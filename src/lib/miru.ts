// Reads and writes the bot's own collections. Every write here mirrors the
// matching function in the bot's src/lib/users.js and guilds.js, so a change
// made on the dashboard looks exactly like one made with a slash command.

import { db } from './db';

export interface AniListLink {
	id: number;
	name: string;
	siteUrl: string;
	avatar: string | null;
	expiresAt: Date;
	linkedAt: Date;
}

export interface BotUser {
	_id: string;
	anilist?: AniListLink & { token?: unknown };
	alerts?: {
		enabled?: boolean;
		muted?: number[];
		changedAt?: Date;
		undeliverableAt?: Date;
	};
	servers?: string[];
	createdAt?: Date;
	updatedAt?: Date;
}

export type FeedMode = 'highlights' | 'everything';

export interface GuildFeed {
	channelId: string;
	mode: FeedMode;
	enabledBy: string;
	enabledAt: Date;
}

interface BotGuild {
	_id: string;
	feed?: GuildFeed;
	createdAt?: Date;
	updatedAt?: Date;
}

interface WrappedRecord {
	_id: string;
	discordId: string;
	year: number;
	effort: number;
	servers: string[];
	updatedAt: Date;
}

const users = () => db.collection<BotUser>('users');
const guilds = () => db.collection<BotGuild>('guilds');
const wrapped = () => db.collection<WrappedRecord>('wrapped');

// Same minimums the bot uses before it will show a ranking.
const MIN_GLOBAL_SAMPLE = 5;

/** The user's bot document, never including the sealed AniList token. */
export async function getBotUser(discordId: string): Promise<BotUser | null> {
	return users().findOne({ _id: discordId }, { projection: { 'anilist.token': 0 } });
}

export function isExpired(link: AniListLink) {
	return link.expiresAt instanceof Date && link.expiresAt <= new Date();
}

export async function unlinkAniList(discordId: string) {
	await users().updateOne(
		{ _id: discordId, anilist: { $exists: true } },
		{ $unset: { anilist: '' }, $set: { updatedAt: new Date() } },
	);
}

/**
 * Whether the user has Miru+ right now. Same rule as the bot's
 * premium/lib/entitlements.js: an unrevoked grant that has started and not ended.
 */
export async function hasPlus(discordId: string) {
	const now = new Date();
	const grant = await db
		.collection('entitlements')
		.findOne({
			scope: 'user',
			subjectId: discordId,
			tier: 'plus',
			revokedAt: null,
			startsAt: { $lte: now },
			$or: [{ endsAt: null }, { endsAt: { $gt: now } }],
		});
	return grant !== null;
}

export async function setAlerts(discordId: string, enabled: boolean) {
	const now = new Date();
	await users().updateOne(
		{ _id: discordId },
		{
			$set: { 'alerts.enabled': enabled, 'alerts.changedAt': now, updatedAt: now },
			// A fresh opt-in is a fresh chance to deliver, so an old failure is dropped.
			$unset: { 'alerts.undeliverableAt': '' },
			$setOnInsert: { createdAt: now },
		},
		{ upsert: true },
	);
}

export async function setMuted(discordId: string, mediaId: number, muted: boolean) {
	await users().updateOne(
		{ _id: discordId },
		muted ? { $addToSet: { 'alerts.muted': mediaId } } : { $pull: { 'alerts.muted': mediaId } },
	);
}

export async function clearMuted(discordId: string) {
	await users().updateOne({ _id: discordId }, { $set: { 'alerts.muted': [] } });
}

export async function leaveServer(discordId: string, guildId: string) {
	await users().updateOne(
		{ _id: discordId, servers: guildId },
		{ $pull: { servers: guildId }, $set: { updatedAt: new Date() } },
	);
}

/** Feed settings for whichever of `guildIds` have a feed, as `Map<guildId, feed>`. */
export async function feedsFor(guildIds: string[]) {
	const feeds = new Map<string, GuildFeed>();
	if (!guildIds.length) return feeds;
	const cursor = guilds().find(
		{ _id: { $in: guildIds }, 'feed.channelId': { $exists: true } },
		{ projection: { feed: 1 } },
	);
	for await (const guild of cursor) if (guild.feed) feeds.set(guild._id, guild.feed);
	return feeds;
}

/** How many linked members have joined each server's feed. */
export async function feedMemberCounts(guildIds: string[]) {
	const counts = new Map<string, number>();
	if (!guildIds.length) return counts;
	const rows = users().aggregate<{ _id: string; count: number }>([
		{ $match: { servers: { $in: guildIds }, 'anilist.id': { $exists: true } } },
		{ $unwind: '$servers' },
		{ $match: { servers: { $in: guildIds } } },
		{ $group: { _id: '$servers', count: { $sum: 1 } } },
	]);
	for await (const row of rows) counts.set(row._id, row.count);
	return counts;
}

export async function setFeedMode(guildId: string, mode: FeedMode) {
	const now = new Date();
	await guilds().updateOne(
		{ _id: guildId, 'feed.channelId': { $exists: true } },
		{ $set: { 'feed.mode': mode, updatedAt: now } },
	);
}

export async function disableFeed(guildId: string) {
	await guilds().updateOne({ _id: guildId }, { $unset: { feed: '' }, $set: { updatedAt: new Date() } });
}

export interface WrappedStanding {
	year: number;
	effort: number;
	global: { rank: number; of: number; topPercent: number } | null;
}

/** Every year the user has run /wrapped, newest first, with their global standing. */
export async function wrappedHistory(discordId: string): Promise<WrappedStanding[]> {
	const records = await wrapped().find({ discordId }).sort({ year: -1 }).toArray();
	return Promise.all(
		records.map(async ({ year, effort }) => {
			const [of, ahead] = await Promise.all([
				wrapped().countDocuments({ year }),
				wrapped().countDocuments({ year, effort: { $gt: effort } }),
			]);
			const global =
				of < MIN_GLOBAL_SAMPLE
					? null
					: { rank: ahead + 1, of, topPercent: Math.max(1, Math.ceil(((ahead + 1) / of) * 100)) };
			return { year, effort, global };
		}),
	);
}

/** Everything the bot stores about the user, for the data export. Tokens are left out. */
export async function exportData(discordId: string) {
	const [user, wrappedRecords] = await Promise.all([
		getBotUser(discordId),
		wrapped().find({ discordId }, { projection: { _id: 0 } }).toArray(),
	]);
	return {
		exportedAt: new Date().toISOString(),
		discordId,
		anilist: user?.anilist ?? null,
		alerts: user?.alerts ?? null,
		feedServers: user?.servers ?? [],
		wrapped: wrappedRecords,
	};
}
