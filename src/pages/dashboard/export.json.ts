import type { APIRoute } from 'astro';
import { getDiscordAccount } from '../../lib/discord';
import { exportData } from '../../lib/miru';

export const prerender = false;

export const GET: APIRoute = async ({ locals, request }) => {
	if (!locals.user) return new Response('Log in first.', { status: 401 });
	const account = await getDiscordAccount(request.headers);
	if (!account) return new Response('No Discord account is linked to this login.', { status: 403 });

	const data = await exportData(account.discordId);
	return new Response(JSON.stringify(data, null, 2), {
		headers: {
			'content-type': 'application/json',
			'content-disposition': 'attachment; filename="miru-data.json"',
			'cache-control': 'no-store',
		},
	});
};
