// Public AniList data for the dashboard. The site never holds AniList tokens
// (the bot keeps those encrypted with a key only it has), so this only sees what
// AniList shows anyone: entries marked private and private profiles are hidden.

const ANILIST_URL = 'https://graphql.anilist.co';

// AniList allows about 30 requests a minute per IP, shared with every visitor of
// this function instance, so each user's data is reused for a short while.
const CACHE_MS = 60_000;
const cache = new Map<string, { at: number; value: AniListOverview }>();

const CARD = `
	fragment card on Media {
		id
		siteUrl
		episodes
		title { romaji english }
		coverImage { medium color }
		nextAiringEpisode { episode airingAt }
	}
`;

// Kept apart from the muted lookup: AniList drops the whole response when any
// field fails, and a private profile fails the list query.
const LIST_QUERY = `
	query ($userId: Int) {
		User(id: $userId) {
			statistics {
				anime { count episodesWatched minutesWatched }
				manga { count chaptersRead }
			}
		}
		watching: MediaListCollection(userId: $userId, type: ANIME, status_in: [CURRENT, REPEATING]) {
			lists {
				isCustomList
				entries {
					progress
					media { ...card }
				}
			}
		}
	}
	${CARD}
`;

const MEDIA_QUERY = `
	query ($ids: [Int]) {
		Page(perPage: 50) {
			media(id_in: $ids) { ...card }
		}
	}
	${CARD}
`;

class AniListError extends Error {}

async function query(query: string, variables: object) {
	let res: Response;
	try {
		res = await fetch(ANILIST_URL, {
			method: 'POST',
			headers: { 'content-type': 'application/json', accept: 'application/json' },
			body: JSON.stringify({ query, variables }),
			signal: AbortSignal.timeout(8000),
		});
	} catch {
		throw new AniListError("Couldn't reach AniList. Refresh to try again.");
	}
	if (res.status === 429) throw new AniListError('AniList is busy right now. Refresh in a minute.');
	const body = await res.json().catch(() => null);
	if (!body?.data || body.errors?.length) {
		const message: string = body?.errors?.[0]?.message ?? '';
		throw new AniListError(
			/private/i.test(message)
				? 'Your AniList profile is private, so your list can’t be shown here.'
				: "AniList didn't return your list. Refresh to try again.",
		);
	}
	return body.data;
}

export interface Media {
	id: number;
	siteUrl: string;
	episodes: number | null;
	title: { romaji: string | null; english: string | null };
	coverImage: { medium: string | null; color: string | null };
	nextAiringEpisode: { episode: number; airingAt: number } | null;
}

export interface WatchingEntry {
	progress: number;
	media: Media;
}

export interface AniListOverview {
	stats: {
		anime: { count: number; episodesWatched: number; minutesWatched: number };
		manga: { count: number; chaptersRead: number };
	} | null;
	/** Watching and Rewatching, soonest next episode first, then the rest. */
	watching: WatchingEntry[];
	muted: Media[];
	/** Set when AniList refused to show the list, usually because the profile is private. */
	error: string | null;
}

export function titleOf(media: Media) {
	return media.title.english || media.title.romaji || 'Untitled';
}

export async function fetchOverview(userId: number, muted: number[]): Promise<AniListOverview> {
	const key = `${userId}:${[...muted].sort().join(',')}`;
	const hit = cache.get(key);
	if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;

	const [list, mutedMedia] = await Promise.allSettled([
		query(LIST_QUERY, { userId }),
		// An empty `id_in` would match every title, so skip the lookup instead.
		muted.length ? query(MEDIA_QUERY, { ids: muted }) : Promise.resolve(null),
	]);

	const seen = new Set<number>();
	const watching: WatchingEntry[] = [];
	const data = list.status === 'fulfilled' ? list.value : null;
	for (const group of data?.watching?.lists ?? []) {
		if (group.isCustomList) continue;
		for (const entry of group.entries ?? []) {
			if (!entry.media || seen.has(entry.media.id)) continue;
			seen.add(entry.media.id);
			watching.push(entry);
		}
	}
	watching.sort((a, b) => {
		const x = a.media.nextAiringEpisode?.airingAt ?? Infinity;
		const y = b.media.nextAiringEpisode?.airingAt ?? Infinity;
		return x - y || titleOf(a.media).localeCompare(titleOf(b.media));
	});

	const value: AniListOverview = {
		stats: data?.User?.statistics ?? null,
		watching,
		muted: mutedMedia.status === 'fulfilled' ? (mutedMedia.value?.Page?.media ?? []) : [],
		error: list.status === 'rejected' ? (list.reason as Error).message : null,
	};
	// Failures aren't cached, so a refresh retries straight away.
	if (list.status === 'fulfilled' && mutedMedia.status === 'fulfilled') cache.set(key, { at: Date.now(), value });
	return value;
}
