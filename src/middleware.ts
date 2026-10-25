import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
	context.locals.user = null;
	context.locals.session = null;

	// Docs pages are built ahead of time and have no request to read a session
	// from, the auth API resolves sessions itself, and Stripe's webhook has none.
	const { pathname } = context.url;
	if (context.isPrerendered || pathname.startsWith('/api/auth/') || pathname.startsWith('/api/stripe/')) {
		return next();
	}

	// Imported here rather than at the top: this module also runs while docs pages
	// prerender, where the auth secrets are not set.
	const { auth } = await import('./lib/auth');
	const result = await auth.api.getSession({ headers: context.request.headers });
	if (result) {
		context.locals.user = result.user;
		context.locals.session = result.session;
	}

	return next();
});
