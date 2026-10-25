import { auth } from './auth';

// Discord's permission bits that let someone change the `/feed` settings (Manage Server),
// or anything at all (Administrator).
const ADMINISTRATOR = 1n << 3n;
const MANAGE_GUILD = 1n << 5n;

// Discord rate-limits /users/@me/guilds hard, so each user's list is reused briefly.
const CACHE_MS = 60_000;
const cache = new Map<string, { at: number; value: DiscordGuild[] }>();

export interface DiscordGuild {
	id: string;
	name: string;
	icon: string | null;
	canManage: boolean;
}

export interface DiscordAccount {
	/** Better Auth's id for the linked account. */
	id: string;
	/** The Discord user id, which is the `_id` of the bot's user document. */
	discordId: string;
	scopes: string[];
}

export async function getDiscordAccount(headers: Headers): Promise<DiscordAccount | null> {
	const accounts = await auth.api.listUserAccounts({ headers });
	const account = accounts.find((a) => a.providerId === 'discord');
	return account ? { id: account.id, discordId: account.accountId, scopes: account.scopes } : null;
}

export function guildIcon(guild: Pick<DiscordGuild, 'id' | 'icon'>) {
	return guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64` : null;
}

/**
 * The user's servers, or null when they can't be read: the session predates the
 * `guilds` scope, or Discord refused. The dashboard then asks them to log in again.
 */
export async function getGuilds(headers: Headers, account: DiscordAccount): Promise<DiscordGuild[] | null> {
	if (!account.scopes.includes('guilds')) return null;

	const hit = cache.get(account.discordId);
	if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;

	try {
		const { accessToken } = await auth.api.getAccessToken({ body: { accountId: account.id }, headers });
		const res = await fetch('https://discord.com/api/v10/users/@me/guilds', {
			headers: { authorization: `Bearer ${accessToken}` },
			signal: AbortSignal.timeout(8000),
		});
		if (!res.ok) return hit?.value ?? null;
		const raw: { id: string; name: string; icon: string | null; owner: boolean; permissions: string }[] =
			await res.json();
		const value = raw.map((g) => {
			const perms = BigInt(g.permissions);
			return {
				id: g.id,
				name: g.name,
				icon: g.icon,
				canManage: g.owner || (perms & ADMINISTRATOR) !== 0n || (perms & MANAGE_GUILD) !== 0n,
			};
		});
		cache.set(account.discordId, { at: Date.now(), value });
		return value;
	} catch {
		return hit?.value ?? null;
	}
}
