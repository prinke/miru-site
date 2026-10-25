import { ActionError, defineAction, type ActionAPIContext } from 'astro:actions';
import { z } from 'astro/zod';
import { getDiscordAccount, getGuilds } from '../lib/discord';
import * as miru from '../lib/miru';

/** The calling user's Discord account, or an error the dashboard can show. */
async function requireAccount(ctx: ActionAPIContext) {
	if (!ctx.locals.user) {
		throw new ActionError({ code: 'UNAUTHORIZED', message: 'Your session has ended. Log in again.' });
	}
	const account = await getDiscordAccount(ctx.request.headers);
	if (!account) {
		throw new ActionError({ code: 'FORBIDDEN', message: 'No Discord account is linked to this login.' });
	}
	return account;
}

/** Same rule as the `/feed` settings: the caller must be able to manage the server. */
async function requireManager(ctx: ActionAPIContext, guildId: string) {
	const account = await requireAccount(ctx);
	const guilds = await getGuilds(ctx.request.headers, account);
	if (!guilds?.some((g) => g.id === guildId && g.canManage)) {
		throw new ActionError({ code: 'FORBIDDEN', message: 'You need Manage Server in that server.' });
	}
}

const snowflake = z.string().regex(/^\d{17,20}$/);

export const server = {
	setAlerts: defineAction({
		input: z.object({ enabled: z.boolean() }),
		handler: async ({ enabled }, ctx) => {
			const { discordId } = await requireAccount(ctx);
			// Turning alerts off always works, so a lapsed member can stop them.
			if (enabled && !(await miru.hasPlus(discordId))) {
				throw new ActionError({ code: 'FORBIDDEN', message: 'Episode alerts are part of Miru+.' });
			}
			await miru.setAlerts(discordId, enabled);
			return { enabled };
		},
	}),

	setMuted: defineAction({
		input: z.object({ mediaId: z.number().int().positive(), muted: z.boolean() }),
		handler: async ({ mediaId, muted }, ctx) => {
			const { discordId } = await requireAccount(ctx);
			await miru.setMuted(discordId, mediaId, muted);
			return { mediaId, muted };
		},
	}),

	clearMuted: defineAction({
		handler: async (_, ctx) => {
			const { discordId } = await requireAccount(ctx);
			await miru.clearMuted(discordId);
		},
	}),

	unlinkAniList: defineAction({
		handler: async (_, ctx) => {
			const { discordId } = await requireAccount(ctx);
			await miru.unlinkAniList(discordId);
		},
	}),

	leaveFeed: defineAction({
		input: z.object({ guildId: snowflake }),
		handler: async ({ guildId }, ctx) => {
			const { discordId } = await requireAccount(ctx);
			await miru.leaveServer(discordId, guildId);
		},
	}),

	setFeedMode: defineAction({
		input: z.object({ guildId: snowflake, mode: z.enum(['highlights', 'everything']) }),
		handler: async ({ guildId, mode }, ctx) => {
			await requireManager(ctx, guildId);
			await miru.setFeedMode(guildId, mode);
			return { mode };
		},
	}),

	disableFeed: defineAction({
		input: z.object({ guildId: snowflake }),
		handler: async ({ guildId }, ctx) => {
			await requireManager(ctx, guildId);
			await miru.disableFeed(guildId);
		},
	}),
};
