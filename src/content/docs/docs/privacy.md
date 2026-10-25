---
title: Privacy
description: What Miru stores, what it shows publicly, and how to remove your data.
---

## What's stored

Miru keeps the following in its database:

- Your Discord user ID
- Your AniList ID, name, avatar and access token, only if you run [`/link`](/docs/commands/link/)
- Your [alert](/docs/features/episode-alerts/) settings and muted shows
- Which servers you've joined the feed in
- Your yearly Wrapped total, for rankings
- Server feed settings
- A record of which episode alerts were sent, deleted after 30 days

## Your AniList token

- Tokens are **encrypted** at rest (AES-GCM) with a key only the bot host has.
- AniList tokens are all-or-nothing: AniList doesn't let apps ask for limited access. Miru only reads your lists and makes the changes you ask for.

## What's shown publicly

**Public replies never reveal private entries.**

- [`/compat`](/docs/commands/compat/), server [`/recommend`](/docs/commands/recommend/#for-this-server) and the [server feed](/docs/features/server-feed/) only read public AniList data.
- [`/wrapped`](/docs/commands/wrapped/) and personal `/recommend` read your full list, so private entries count, but a private entry is never named.

## Opt-in only

Nobody appears in a server feed, server recommendations or server rankings without joining it themselves from [`/feed`](/docs/commands/feed/#joining-and-leaving).

## Removing your data

| To… | Run |
| --- | --- |
| Delete your token and AniList link | `/unlink` |
| Leave a server's feed | `/feed`, then **Leave the feed** |
| Stop alert DMs | `/alerts`, then **Alerts: off** |

AniList has no way for apps to revoke their own access, so also remove Miru at **anilist.co → Settings → Apps**.

## Third parties

- **AniList**: account data and search.
- **Jikan / MyAnimeList**: fallback search when AniList is unreachable.
- **trace.moe**: images you submit to [`/trace`](/docs/commands/trace/) or **What anime is this?** are sent there.
