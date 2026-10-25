import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import {
	BETTER_AUTH_SECRET,
	BETTER_AUTH_URL,
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET,
} from 'astro:env/server';
import { client, db } from './db';

export const auth = betterAuth({
	baseURL: BETTER_AUTH_URL,
	secret: BETTER_AUTH_SECRET,
	// Shares the bot's database. The bot already owns a `users` collection, so
	// auth data lives under an `auth_` prefix to keep the two apart.
	database: mongodbAdapter(db, { client }),
	user: { modelName: 'auth_users' },
	session: { modelName: 'auth_sessions' },
	account: { modelName: 'auth_accounts' },
	verification: { modelName: 'auth_verifications' },
	socialProviders: {
		discord: {
			clientId: DISCORD_CLIENT_ID,
			clientSecret: DISCORD_CLIENT_SECRET,
			// Lets the dashboard list the user's servers to find the ones they manage.
			scope: ['guilds'],
		},
	},
});
