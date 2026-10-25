// Creates (or updates) Miru's products, prices and customer portal in Stripe, and
// the database indexes the webhook relies on. Safe to run again any time.
//
//   node --env-file=.env.local scripts/stripe-setup.ts
//
// Run it once with the test key and once with the live key. Changing a price in
// src/lib/plans.ts and re-running makes a new price and moves the lookup key to
// it; existing subscribers keep their old price until you migrate them.

import Stripe from 'stripe';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { PLANS } from '../src/lib/plans.ts';

const { STRIPE_SECRET_KEY, MONGODB_URI, MONGODB_DB = 'miru' } = process.env;
if (!STRIPE_SECRET_KEY) throw new Error('Set STRIPE_SECRET_KEY.');
const stripe = new Stripe(STRIPE_SECRET_KEY);
const mode = STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'LIVE' : 'test';
console.log(`Stripe ${mode} mode`);

for (const plan of Object.values(PLANS)) {
	const productId = `miru_${plan.tier}`;
	const product = await stripe.products.retrieve(productId).catch(() =>
		stripe.products.create({ id: productId, name: plan.name, metadata: { tier: plan.tier } }),
	);
	if (product.name !== plan.name) await stripe.products.update(productId, { name: plan.name });

	const [current] = (await stripe.prices.list({ lookup_keys: [plan.lookupKey], limit: 1 })).data;
	const same =
		current?.active &&
		current.product === productId &&
		current.unit_amount === plan.amount &&
		current.currency === plan.currency &&
		current.recurring?.interval === plan.interval;
	if (same) {
		console.log(`  ${plan.name}: ${current.id} is up to date`);
		continue;
	}

	const price = await stripe.prices.create({
		product: productId,
		unit_amount: plan.amount,
		currency: plan.currency,
		recurring: { interval: plan.interval },
		lookup_key: plan.lookupKey,
		transfer_lookup_key: true,
		tax_behavior: 'exclusive',
		metadata: { tier: plan.tier },
	});
	if (current?.active) await stripe.prices.update(current.id, { active: false });
	console.log(`  ${plan.name}: created ${price.id}${current ? ` (replaces ${current.id})` : ''}`);
}

// Customer portal: update the card, see invoices, cancel at period end. Switching
// plans stays off, since a server plan needs a server picked at checkout.
const [portal] = (await stripe.billingPortal.configurations.list({ is_default: true, limit: 1 })).data;
const portalSettings: Stripe.BillingPortal.ConfigurationCreateParams = {
	business_profile: { headline: 'Manage your Miru Premium subscription' },
	features: {
		customer_update: { enabled: true, allowed_updates: ['email', 'address', 'tax_id'] },
		invoice_history: { enabled: true },
		payment_method_update: { enabled: true },
		subscription_cancel: {
			enabled: true,
			mode: 'at_period_end',
			cancellation_reason: {
				enabled: true,
				options: ['too_expensive', 'missing_features', 'unused', 'other'],
			},
		},
		subscription_update: { enabled: false },
	},
};
if (portal) {
	await stripe.billingPortal.configurations.update(portal.id, portalSettings);
	console.log(`  Customer portal: updated ${portal.id}`);
} else {
	const created = await stripe.billingPortal.configurations.create(portalSettings);
	console.log(`  Customer portal: created ${created.id}${created.is_default ? '' : ' (not default: save the portal settings once in the Dashboard)'}`);
}

if (MONGODB_URI) {
	const client = new MongoClient(MONGODB_URI, { serverApi: { version: ServerApiVersion.v1, strict: true } });
	const entitlements = client.db(MONGODB_DB).collection('entitlements');
	await entitlements.createIndex({ stripeSubscriptionId: 1 }, { name: 'stripe_subscription', unique: true, sparse: true });
	await entitlements.createIndex({ purchaserId: 1 }, { name: 'purchaser', sparse: true });
	await client.close();
	console.log('  Mongo indexes: ok');
} else {
	console.log('  MONGODB_URI not set: skipped indexes');
}
