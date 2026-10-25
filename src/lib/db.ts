import { MongoClient, ServerApiVersion } from 'mongodb';
import { MONGODB_DB, MONGODB_URI } from 'astro:env/server';

// Created once per function instance so warm invocations reuse the pool. The
// driver connects lazily on the first query, so no explicit connect() is needed.
export const client = new MongoClient(MONGODB_URI, {
	serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
	// Fail in seconds rather than the driver's default 30, so a database outage
	// shows up as an error instead of a page that never responds.
	serverSelectionTimeoutMS: 5000,
});

// The bot's database: auth data lives alongside the bot's own collections.
export const db = client.db(MONGODB_DB);
