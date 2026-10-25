import type { APIRoute } from 'astro';
import type Stripe from 'stripe';
import { STRIPE_WEBHOOK_SECRET } from 'astro:env/server';
import { noteInvoice, stripe, syncSubscription } from '../../../lib/billing';

export const prerender = false;

// Subscribe the endpoint to exactly these in Stripe (Workbench → Webhooks).
const HANDLED = new Set<Stripe.Event.Type>([
	'checkout.session.completed',
	'customer.subscription.created',
	'customer.subscription.updated',
	'customer.subscription.deleted',
	'customer.subscription.paused',
	'customer.subscription.resumed',
	'invoice.paid',
	'invoice.payment_failed',
]);

export const POST: APIRoute = async ({ request }) => {
	const signature = request.headers.get('stripe-signature');
	if (!signature) return new Response('Missing signature.', { status: 400 });

	// The signature covers the exact bytes Stripe sent, so read the body as raw text.
	const body = await request.text();
	let event: Stripe.Event;
	try {
		event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
	} catch {
		return new Response('Bad signature.', { status: 400 });
	}

	if (!HANDLED.has(event.type)) return new Response(null, { status: 204 });

	const object = event.data.object as Stripe.Subscription | Stripe.Checkout.Session | Stripe.Invoice;
	const ref =
		object.object === 'subscription'
			? object.id
			: object.object === 'invoice'
				? object.parent?.subscription_details?.subscription
				: object.subscription;
	const subscriptionId = typeof ref === 'string' ? ref : ref?.id;
	if (!subscriptionId) return new Response(null, { status: 204 });

	try {
		// Sync first, so an invoice notice reads the grant's new renewal date.
		await syncSubscription(subscriptionId);
		if (object.object === 'invoice') await noteInvoice(object, event.type === 'invoice.paid' ? 'paid' : 'failed');
	} catch (error) {
		// A non-2xx makes Stripe retry with backoff for up to three days.
		console.error(`[stripe] ${event.type} ${event.id}`, error);
		return new Response('Sync failed.', { status: 500 });
	}
	return new Response(null, { status: 204 });
};
