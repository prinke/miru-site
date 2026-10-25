# Miru website

The website for [Miru](https://github.com/prinke/miru), a Discord bot for anime and manga powered by AniList. It has:

- a landing page and a Premium page
- the docs, under `/docs/`
- a dashboard where you log in with Discord to manage your AniList link, episode alerts, server feeds and subscriptions

It's built with [Astro](https://astro.build), [Starlight](https://starlight.astro.build) for the docs, React, Tailwind and shadcn/ui. Sign-in uses [Better Auth](https://better-auth.com) and payments use Stripe Checkout. It's deployed on Vercel.

## Running it locally

```sh
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

The site runs at http://localhost:4321. To work on the docs and landing page, you can leave `.env.local` empty. The login, dashboard and billing pages need every value in it.

The site shares a MongoDB database with the bot. The bot owns the `users`, `guilds` and `entitlements` collections. The site's login data goes in collections that start with `auth_`.

## Layout

| Path | What's there |
| --- | --- |
| `src/content/docs/docs/` | Docs pages (Markdown/MDX). The sidebar is set in `astro.config.mjs`. |
| `src/pages/` | Landing, Premium, login, dashboard, 404 and the API routes |
| `src/actions/` | Server actions the dashboard calls |
| `src/lib/` | Auth, database, Discord, AniList and Stripe helpers. Plans and prices are in `plans.ts`. |
| `src/components/` | Shared components. `ui/` holds the shadcn/ui components. |
| `scripts/` | `og-image.mjs` redraws the link preview image. `stripe-setup.ts` creates the Stripe products and prices. |

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Starts the dev server |
| `npm run build` | Builds the site for production |
| `npm run og-image` | Redraws `public/og.png` |
| `npm run stripe:setup` | Creates or updates the Stripe products, prices and customer portal from `src/lib/plans.ts` |

## Testing payments locally

Forward Stripe's webhook events to the dev server:

```sh
stripe listen --forward-to localhost:4321/api/stripe/webhook \
  --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,customer.subscription.paused,customer.subscription.resumed,invoice.paid,invoice.payment_failed
```

Put the `whsec_...` secret it prints into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## License

[GNU AGPL v3.0](LICENSE), the same as the bot. If you run a modified copy of this site for other people, you have to share your changes under the same license.

[![AGPL v3](public/AGPLv3_logo_purple.png)](https://www.gnu.org/licenses/agpl-3.0.html)
