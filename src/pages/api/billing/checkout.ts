import type { APIRoute } from 'astro';
import { createCheckout, getCustomerId, createPortal, tiersOf } from '../../../lib/billing';
import { getDiscordAccount, getGuilds } from '../../../lib/discord';
import { isTier, PLANS } from '../../../lib/plans';

export const prerender = false;

const snowflake = /^\d{17,20}$/;

/** Form POST from the pricing page or dashboard. Sends the user on to Stripe Checkout. */
export const POST: APIRoute = async ({ locals, request, redirect, url }) => {
	if (!locals.user) return redirect('/login/', 303);

	const form = await request.formData();
	const tier = form.get('tier');
	if (!isTier(tier)) return new Response('Unknown plan.', { status: 400 });

	const account = await getDiscordAccount(request.headers);
	if (!account) return new Response('No Discord account is linked to this login.', { status: 403 });

	const plan = PLANS[tier];
	let guildId: string | null = null;
	let guildName: string | null = null;
	if (plan.scope === 'guild') {
		const value = form.get('guildId');
		if (typeof value !== 'string' || !snowflake.test(value)) return redirect('/dashboard/#h-premium', 303);
		// Same rule as the feed settings: only someone who can manage the server can buy for it.
		const guild = (await getGuilds(request.headers, account))?.find((g) => g.id === value);
		if (!guild?.canManage) {
			return new Response('You need Manage Server in that server.', { status: 403 });
		}
		guildId = guild.id;
		guildName = guild.name;
	}

	// Already has it (a subscription or a manual grant): manage it rather than pay twice.
	const held = await tiersOf(plan.scope, guildId ?? account.discordId);
	if (held.has(tier)) {
		const customerId = await getCustomerId(account.discordId);
		return redirect(customerId ? await createPortal(customerId, url.origin) : '/dashboard/#h-premium', 303);
	}

	const checkoutUrl = await createCheckout({
		tier,
		discordId: account.discordId,
		guildId,
		guildName,
		profile: { name: locals.user.name, email: locals.user.email },
		origin: url.origin,
	});
	return redirect(checkoutUrl, 303);
};
