// Stripe Billing. Stripe is the source of truth for subscriptions; the webhook
// mirrors each one into the bot's `entitlements` collection, which is the only
// thing the bot and the dashboard check. See the bot's premium/lib/entitlements.js
// for the document shape.
//
// Each change worth telling the buyer about (started, renewed, cancelled, ...)
// is queued in `billing_notices`; the bot's billing-notices job sends it as a DM.

import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from 'astro:env/server';
import { db } from './db';
import { PLANS, planForLookupKey, type Tier } from './plans';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
	appInfo: { name: 'miru-site', url: 'https://miru.fyi' },
	// Vercel functions are short-lived; fail fast rather than hang the request.
	timeout: 15_000,
	maxNetworkRetries: 2,
});

interface StripeCustomerLink {
	_id: string; // Discord user id
	customerId: string;
	createdAt: Date;
}

interface EntitlementDoc {
	scope: 'user' | 'guild';
	subjectId: string;
	tier: Tier;
	source: 'manual' | 'stripe' | 'discord';
	startsAt: Date;
	endsAt: Date | null;
	revokedAt: Date | null;
	note: string | null;
	createdAt: Date;
	// Set on grants written by the webhook, so each one follows a single subscription.
	stripeSubscriptionId?: string;
	stripeCustomerId?: string;
	/** Who pays. For a server grant this is the admin who subscribed. */
	purchaserId?: string;
	subjectName?: string | null;
	cancelAtPeriodEnd?: boolean;
	/** When a scheduled cancellation takes effect. */
	cancelAt?: Date | null;
	currentPeriodEnd?: Date | null;
	updatedAt?: Date;
}

export type NoticeKind = 'started' | 'renewed' | 'cancelled' | 'resumed' | 'payment_failed' | 'ended';

/** One DM for the bot to send. Read by the bot's premium/features/billing-notices. */
interface BillingNotice {
	_id: string;
	kind: NoticeKind;
	/** Who gets the DM: the buyer, also for a server plan. */
	recipientId: string;
	tier: Tier;
	scope: 'user' | 'guild';
	subjectId: string;
	/** The server's name when it was bought, in case the bot can't see the server. */
	subjectName: string | null;
	subscriptionId: string;
	/** started/renewed/resumed: next renewal. cancelled: last day. payment_failed: next retry. */
	at: Date | null;
	amount: number | null;
	currency: string | null;
	/** ended: why Stripe ended it. */
	reason: string | null;
	/** payment_failed: Stripe's page to pay the invoice. */
	url: string | null;
	createdAt: Date;
	sentAt: Date | null;
}

const customers = () => db.collection<StripeCustomerLink>('stripe_customers');
const entitlements = () => db.collection<EntitlementDoc>('entitlements');
const notices = () => db.collection<BillingNotice>('billing_notices');

function activeFilter(now = new Date()) {
	return {
		revokedAt: null,
		startsAt: { $lte: now },
		$or: [{ endsAt: null }, { endsAt: { $gt: now } }],
	};
}

/** The tiers a user or server holds right now, from any source. */
export async function tiersOf(scope: 'user' | 'guild', subjectId: string) {
	const docs = await entitlements()
		.find({ scope, subjectId, ...activeFilter() }, { projection: { tier: 1 } })
		.toArray();
	return new Set(docs.map((d) => d.tier));
}

/** Which of `guildIds` hold Miru for Servers right now. */
export async function serversWithTier(guildIds: string[]) {
	if (!guildIds.length) return new Set<string>();
	const docs = await entitlements()
		.find({ scope: 'guild', tier: 'servers', subjectId: { $in: guildIds }, ...activeFilter() }, { projection: { subjectId: 1 } })
		.toArray();
	return new Set(docs.map((d) => d.subjectId));
}

/** The user's live Stripe subscriptions, for the dashboard. */
export async function subscriptionsOf(discordId: string) {
	return entitlements()
		.find({ purchaserId: discordId, source: 'stripe', ...activeFilter() })
		.sort({ startsAt: -1 })
		.toArray();
}

export async function getCustomerId(discordId: string) {
	return (await customers().findOne({ _id: discordId }))?.customerId ?? null;
}

/** The user's Stripe customer, created on first checkout. One per Discord account. */
export async function getOrCreateCustomer(discordId: string, profile: { name: string; email: string }) {
	const existing = await getCustomerId(discordId);
	if (existing) return existing;

	// The idempotency key stops two checkouts started at once from making two customers.
	const customer = await stripe.customers.create(
		{ name: profile.name, email: profile.email, metadata: { discordId } },
		{ idempotencyKey: `miru-customer-${discordId}` },
	);
	// If another request saved one first, keep that one.
	const saved = await customers().findOneAndUpdate(
		{ _id: discordId },
		{ $setOnInsert: { customerId: customer.id, createdAt: new Date() } },
		{ upsert: true, returnDocument: 'after' },
	);
	return saved!.customerId;
}

export async function createCheckout({
	tier,
	discordId,
	guildId,
	guildName,
	profile,
	origin,
}: {
	tier: Tier;
	discordId: string;
	guildId: string | null;
	guildName: string | null;
	profile: { name: string; email: string };
	origin: string;
}) {
	const plan = PLANS[tier];
	const prices = await stripe.prices.list({ lookup_keys: [plan.lookupKey], active: true, limit: 1 });
	const price = prices.data[0];
	if (!price) throw new Error(`No active Stripe price has lookup key "${plan.lookupKey}". Run scripts/stripe-setup.ts.`);

	const customer = await getOrCreateCustomer(discordId, profile);
	const metadata: Record<string, string> = { tier, discordId };
	if (guildId) metadata.guildId = guildId;
	// Stripe caps metadata values at 500 characters; Discord names are at most 100.
	if (guildName) metadata.guildName = guildName;

	const session = await stripe.checkout.sessions.create({
		mode: 'subscription',
		customer,
		client_reference_id: discordId,
		line_items: [{ price: price.id, quantity: 1 }],
		// Already the default on this API version; stated so a pinned older version can't change it.
		subscription_data: { metadata, billing_mode: { type: 'flexible' } },
		metadata,
		allow_promotion_codes: true,
		// Lets Stripe collect the address it needs for tax, and keeps it on the customer.
		customer_update: { address: 'auto', name: 'auto' },
		success_url: `${origin}/dashboard/?checkout=success#h-premium`,
		cancel_url: `${origin}/dashboard/?checkout=cancelled#h-premium`,
	});
	return session.url!;
}

export async function createPortal(customerId: string, origin: string) {
	const session = await stripe.billingPortal.sessions.create({
		customer: customerId,
		return_url: `${origin}/dashboard/#h-premium`,
	});
	return session.url;
}

// Past-due subscriptions keep access while Stripe retries the payment. When the
// retries run out, Stripe moves it to canceled or unpaid (Dashboard → Billing →
// Revenue recovery decides which) and access ends.
const LIVE_STATUSES = new Set<Stripe.Subscription.Status>(['active', 'trialing', 'past_due']);

/**
 * Brings the grant for one subscription in line with Stripe, and queues a DM when
 * that changes something the buyer should hear about. Always re-reads the
 * subscription, so webhook events arriving late or out of order can't leave a
 * stale grant. Each update returns the grant as it was, so only the request that
 * actually made a change queues a notice, even when Stripe delivers events twice.
 */
export async function syncSubscription(subscriptionId: string) {
	const sub = await stripe.subscriptions.retrieve(subscriptionId);
	const item = sub.items.data[0];
	const plan = planForLookupKey(item?.price.lookup_key);
	if (!plan) {
		console.warn(`[billing] ${sub.id}: price ${item?.price.id} has no Miru lookup key; ignoring`);
		return;
	}

	const purchaserId = sub.metadata.discordId;
	const subjectId = plan.scope === 'guild' ? sub.metadata.guildId : purchaserId;
	if (!subjectId || !/^\d{17,20}$/.test(subjectId) || !/^\d{17,20}$/.test(purchaserId ?? '')) {
		throw new Error(`[billing] ${sub.id}: metadata has no ${plan.scope === 'guild' ? 'guildId' : 'discordId'}`);
	}

	const now = new Date();
	const live = LIVE_STATUSES.has(sub.status);
	const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
	const currentPeriodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : null;
	const cancelAtPeriodEnd = sub.cancel_at_period_end || sub.cancel_at !== null;
	const fields = {
		scope: plan.scope,
		subjectId,
		tier: plan.tier,
		purchaserId,
		subjectName: sub.metadata.guildName ?? null,
		stripeCustomerId: customerId,
		cancelAtPeriodEnd,
		cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : cancelAtPeriodEnd ? currentPeriodEnd : null,
		currentPeriodEnd,
		updatedAt: now,
	};

	if (live) {
		const before = await entitlements().findOneAndUpdate(
			{ stripeSubscriptionId: sub.id },
			{
				$set: { ...fields, revokedAt: null, endsAt: null },
				$setOnInsert: {
					source: 'stripe',
					startsAt: new Date(sub.start_date * 1000),
					note: `Stripe ${sub.id}`,
					createdAt: now,
				},
			},
			{ upsert: true, returnDocument: 'before' },
		);
		const wasLive = before !== null && before.revokedAt === null;
		const price = { amount: item?.price.unit_amount ?? null, currency: item?.price.currency ?? null };

		if (!wasLive) {
			await queueNotice(sub.id, fields, 'started', { at: cancelAtPeriodEnd ? fields.cancelAt : currentPeriodEnd, ...price });
		} else if (cancelAtPeriodEnd && !before.cancelAtPeriodEnd) {
			await queueNotice(sub.id, fields, 'cancelled', { at: fields.cancelAt });
		} else if (!cancelAtPeriodEnd && before.cancelAtPeriodEnd) {
			await queueNotice(sub.id, fields, 'resumed', { at: currentPeriodEnd, ...price });
		}
	} else {
		// Ends only this subscription's grant. A manual grant of the same tier is left alone.
		const before = await entitlements().findOneAndUpdate(
			{ stripeSubscriptionId: sub.id, revokedAt: null },
			{ $set: { ...fields, revokedAt: sub.ended_at ? new Date(sub.ended_at * 1000) : now } },
			{ returnDocument: 'before' },
		);
		if (before) {
			await queueNotice(sub.id, fields, 'ended', {
				reason: sub.cancellation_details?.reason ?? (sub.status === 'unpaid' ? 'payment_failed' : null),
			});
		}
	}
}

/**
 * Queues the DMs that come from invoices rather than from the subscription
 * changing: a paid renewal, and a failed payment Stripe will retry. Keyed by
 * invoice (and attempt), so a redelivered event doesn't send it twice.
 */
export async function noteInvoice(invoice: Stripe.Invoice, outcome: 'paid' | 'failed') {
	const ref = invoice.parent?.subscription_details?.subscription;
	const subscriptionId = typeof ref === 'string' ? ref : ref?.id;
	if (!subscriptionId) return;

	// The first invoice is covered by "started".
	if (outcome === 'paid' && invoice.billing_reason !== 'subscription_cycle') return;

	const grant = await entitlements().findOne({ stripeSubscriptionId: subscriptionId });
	if (!grant?.purchaserId) return;

	if (outcome === 'paid') {
		await queueNotice(subscriptionId, grant, 'renewed', {
			id: `renewed:${invoice.id}`,
			at: grant.currentPeriodEnd ?? null,
			amount: invoice.amount_paid,
			currency: invoice.currency,
		});
	} else {
		await queueNotice(subscriptionId, grant, 'payment_failed', {
			id: `payment_failed:${invoice.id}:${invoice.attempt_count}`,
			at: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000) : null,
			amount: invoice.amount_due,
			currency: invoice.currency,
			url: invoice.hosted_invoice_url ?? null,
		});
	}
}

async function queueNotice(
	subscriptionId: string,
	grant: Pick<EntitlementDoc, 'tier' | 'scope' | 'subjectId' | 'purchaserId' | 'subjectName'>,
	kind: NoticeKind,
	extra: Partial<Pick<BillingNotice, 'at' | 'amount' | 'currency' | 'reason' | 'url'>> & { id?: string } = {},
) {
	const { id = `${kind}:${subscriptionId}:${Date.now()}`, ...details } = extra;
	const notice: BillingNotice = {
		_id: id,
		kind,
		recipientId: grant.purchaserId!,
		tier: grant.tier,
		scope: grant.scope,
		subjectId: grant.subjectId,
		subjectName: grant.subjectName ?? null,
		subscriptionId,
		at: null,
		amount: null,
		currency: null,
		reason: null,
		url: null,
		...details,
		createdAt: new Date(),
		sentAt: null,
	};
	// $setOnInsert: a notice that already exists (a redelivered invoice event) is left as is.
	const { _id, ...rest } = notice;
	await notices().updateOne({ _id }, { $setOnInsert: rest }, { upsert: true });
}
