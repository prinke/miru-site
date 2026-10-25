import type { APIRoute } from 'astro';
import { createPortal, getCustomerId } from '../../../lib/billing';
import { getDiscordAccount } from '../../../lib/discord';

export const prerender = false;

/** Form POST from the dashboard. Opens the Stripe customer portal to change or cancel plans. */
export const POST: APIRoute = async ({ locals, request, redirect, url }) => {
	if (!locals.user) return redirect('/login/', 303);
	const account = await getDiscordAccount(request.headers);
	if (!account) return new Response('No Discord account is linked to this login.', { status: 403 });

	const customerId = await getCustomerId(account.discordId);
	if (!customerId) return redirect('/dashboard/#h-premium', 303);
	return redirect(await createPortal(customerId, url.origin), 303);
};
