// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { satteri } from '@astrojs/markdown-satteri';
import { hastExternalLinks } from './src/hast/external-links.ts';

// Absolute URLs for link previews and the sitemap. Vercel sets the production
// domain at build time; set SITE_URL to override it.
const site =
	process.env.SITE_URL ??
	(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:4321');

// https://astro.build/config
export default defineConfig({
	site,
	// Pages stay prerendered; routes that need a session opt out with `prerender = false`.
	adapter: vercel(),
	// The docs have no index page of their own.
	redirects: { '/docs': '/docs/getting-started/' },
	env: {
		schema: {
			MONGODB_URI: envField.string({ context: 'server', access: 'secret' }),
			MONGODB_DB: envField.string({ context: 'server', access: 'secret', default: 'miru' }),
			DISCORD_CLIENT_ID: envField.string({ context: 'server', access: 'secret' }),
			DISCORD_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret' }),
			BETTER_AUTH_SECRET: envField.string({ context: 'server', access: 'secret' }),
			BETTER_AUTH_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
			STRIPE_SECRET_KEY: envField.string({ context: 'server', access: 'secret' }),
			STRIPE_WEBHOOK_SECRET: envField.string({ context: 'server', access: 'secret' }),
		},
	},
	markdown: {
		processor: satteri({ hastPlugins: [hastExternalLinks] }),
	},
	integrations: [
		starlight({
			title: 'Miru',
			description: 'Anime & manga on Discord, powered by AniList',
			// Match the separator the landing and dashboard pages use in their titles.
			titleDelimiter: '·',
			// src/pages/404.astro covers the whole site, docs included.
			disable404Route: true,
			favicon: '/favicon.ico',
			customCss: ['./src/styles/starlight.css'],
			head: [
				{ tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' } },
				{ tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' } },
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' } },
				{ tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
				// Starlight already sets the title, description and summary_large_image card.
				{ tag: 'meta', attrs: { name: 'theme-color', content: '#ec5f9a' } },
				{ tag: 'meta', attrs: { property: 'og:image', content: new URL('/og.png', site).href } },
				{ tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
				{ tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true } },
				{
					tag: 'link',
					attrs: {
						rel: 'stylesheet',
						href: 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@500&family=Zen+Maru+Gothic:wght@500;700;900&display=swap',
					},
				},
			],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/prinke/miru' }],
			components: {
				Footer: './src/components/DocsFooter.astro',
				SocialIcons: './src/components/SocialIcons.astro',
				SiteTitle: './src/components/SiteTitle.astro',
			},
			sidebar: [
				{
					label: 'Start here',
					items: [
						{ label: 'Getting started', slug: 'docs/getting-started', badge: { text: 'Beta', variant: 'tip' } },
						{ label: 'Premium', link: '/premium/', badge: { text: 'Soon', variant: 'tip' } },
					],
				},
				{
					label: 'Commands',
					items: [
						{ label: 'All commands', slug: 'docs/commands' },
						{
							label: 'Search',
							items: [
								{ label: '/anime', slug: 'docs/commands/anime' },
								{ label: '/manga', slug: 'docs/commands/manga' },
								{ label: '/character', slug: 'docs/commands/character' },
								{ label: '/season', slug: 'docs/commands/season' },
								{ label: '/trace', slug: 'docs/commands/trace' },
								{ label: '/ping', slug: 'docs/commands/ping' },
							],
						},
						{
							label: 'AniList account',
							items: [
								{ label: '/link & /unlink', slug: 'docs/commands/link' },
								{ label: '/animelist & /mangalist', slug: 'docs/commands/animelist' },
								{ label: '/progress', slug: 'docs/commands/progress' },
								{ label: '/alerts', slug: 'docs/commands/alerts', badge: { text: 'Miru+', variant: 'tip' } },
								{ label: '/compat', slug: 'docs/commands/compat' },
								{ label: '/recommend', slug: 'docs/commands/recommend' },
								{ label: '/wrapped', slug: 'docs/commands/wrapped' },
							],
						},
						{
							label: 'Server',
							items: [{ label: '/feed', slug: 'docs/commands/feed' }],
						},
					],
				},
				{
					label: 'Features',
					items: [
						{ label: 'List buttons', slug: 'docs/features/list-buttons' },
						{ label: 'Episode alerts', slug: 'docs/features/episode-alerts', badge: { text: 'Miru+', variant: 'tip' } },
						{ label: 'Server feed', slug: 'docs/features/server-feed' },
					],
				},
				{
					label: 'Help',
					items: [
						{ label: 'FAQ', slug: 'docs/faq' },
						{ label: 'Privacy', slug: 'docs/privacy' },
					],
				},
			],
		}),
		react(),
	],
	vite: {
		plugins: [tailwindcss()],
		// Pre-bundle the shadcn/ui dependencies when the dev server starts. Otherwise Vite
		// finds them one island at a time, re-bundles mid-session, and islands that were
		// already loaded fail to import ("Outdated Optimize Dep") until a restart.
		optimizeDeps: {
			include: ['radix-ui', 'cn', 'class-variance-authority', '@hugeicons/react', '@hugeicons/core-free-icons'],
		},
	},
});
