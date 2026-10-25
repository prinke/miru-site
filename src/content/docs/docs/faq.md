---
title: FAQ
description: Answers to common problems with Miru.
---

## "These controls are not for you!"

Buttons and menus only respond to the person who ran the command. The one exception is the Planning menu on [`/recommend`](/docs/commands/recommend/#add-to-planning), which anyone can use.

## The buttons disappeared

Controls expire, usually after 5 or 10 minutes. Run the command again.

## I don't get alert DMs

Episode alerts are part of [Miru+](/premium/). Run [`/alerts`](/docs/commands/alerts/) first to check they're on. Then check that:

- You share a server with Miru and allow direct messages from its members.
- The show is on **Watching** or **Rewatching**.
- The entry isn't marked private on AniList. Private entries don't trigger alerts.

See [Episode alerts](/docs/features/episode-alerts/) for more.

## `/progress` says it's not on my list

Pick the title from the autocomplete suggestions, or add it first with the **Add to list** button on [`/anime`](/docs/commands/anime/) or [`/manga`](/docs/commands/manga/).

## `/compat` can't read someone's list

Their AniList profile may be private, or the username doesn't exist. AniList doesn't say which.

## Wrapped says nothing happened this year

[`/wrapped`](/docs/commands/wrapped/) uses the start and finish dates on your AniList entries. Entries edited outside AniList's website may not have them.

## Scene search got it wrong

Use an uncropped, unedited screenshot straight from the episode. Matches under 90% are flagged as low confidence. See [`/trace`](/docs/commands/trace/).

## The `/feed` command doesn't appear

`/feed` only exists when Miru is [installed to the server](/docs/getting-started/#1-add-miru), not as a personal app.

## "AniList is rate limiting us right now"

Wait a minute and try again. AniList currently allows about 30 requests per minute.

## Results say "MyAnimeList" in the footer

AniList couldn't be reached, so Miru used its Jikan (MyAnimeList) fallback. See [Data sources](/docs/features/list-buttons/#data-sources).

## How do I disconnect my account?

Run [`/unlink`](/docs/commands/link/#unlink), then remove Miru at **anilist.co → Settings → Apps**. See [Privacy](/docs/privacy/#removing-your-data).
