// The paid tiers, shared by the pricing page, the dashboard, checkout and
// scripts/stripe-setup.ts. Prices are looked up in Stripe by `lookupKey`, so a
// new price only needs the key moved to it (the setup script does this).
//
// Tier ids and scopes match the bot's premium/lib/entitlements.js.

export type Tier = 'plus' | 'servers' | 'supporter';

export interface Plan {
	tier: Tier;
	name: string;
	/** Who holds the grant: the paying user, or a server they manage. */
	scope: 'user' | 'guild';
	lookupKey: string;
	/** In the smallest currency unit. */
	amount: number;
	currency: string;
	interval: 'month' | 'year';
}

export const PLANS: Record<Tier, Plan> = {
	plus: { tier: 'plus', name: 'Miru+', scope: 'user', lookupKey: 'miru_plus_monthly', amount: 300, currency: 'usd', interval: 'month' },
	servers: { tier: 'servers', name: 'Miru for Servers', scope: 'guild', lookupKey: 'miru_servers_monthly', amount: 500, currency: 'usd', interval: 'month' },
	supporter: { tier: 'supporter', name: 'Supporter', scope: 'user', lookupKey: 'miru_supporter_monthly', amount: 200, currency: 'usd', interval: 'month' },
};

export function isTier(value: unknown): value is Tier {
	return typeof value === 'string' && Object.hasOwn(PLANS, value);
}

export function planForLookupKey(key: string | null | undefined) {
	return Object.values(PLANS).find((p) => p.lookupKey === key) ?? null;
}

/** "$3 / month" */
export function formatPrice(plan: Plan) {
	const money = new Intl.NumberFormat('en', {
		style: 'currency',
		currency: plan.currency,
		minimumFractionDigits: plan.amount % 100 === 0 ? 0 : 2,
	}).format(plan.amount / 100);
	return `${money} / ${plan.interval}`;
}
