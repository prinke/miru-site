---
title: /alerts
description: Episode alert DMs, and when they arrive. Part of Miru+.
---

```
/alerts
```

Get a DM when a new episode of something on your **Watching** (or **Rewatching**) list airs. Episode alerts are part of **[Miru+](/premium/)** and need a [linked account](/docs/commands/link/).

`/alerts` opens a panel that only you can see. For what the alert DMs look like, see [Episode alerts](/docs/features/episode-alerts/).

## What the panel shows

- Whether alerts are on, and the next episodes coming up on your Watching list (muted shows and private entries are marked).
- When alerts arrive: your delay, quiet hours, the daily digest, your time zone, and anything waiting to be sent.

## Turning alerts on and off

Press **Alerts: on/off**. Turning them on sends you a test DM. If it fails, Miru tells you how to allow DMs: you need to share a server with Miru and turn on **Allow direct messages from server members** for that server.

Turning alerts off keeps the shows you've muted muted. **Unmute N shows** clears them all.

## When alerts arrive

| Control | What it does |
| --- | --- |
| **Delay** menu | Wait a while after an episode airs, so the alert lines up with your streaming site. Pick a preset, or **Custom…** for anything up to 12 hours (`40`, `1h30`, `2h`). |
| **Per-show delay** menu | A different delay for one show on your Watching list. Leave the form empty to go back to your default. |
| **Time zone** menu | Pick a region, then a city. Each one shows its current UTC offset and local time. **Not listed? Type it** accepts any time zone name or a city. |
| **Quiet hours** | No alerts between two times, like 23:00 to 08:00. Anything that airs then arrives when quiet hours end. |
| **Digest** | One DM a day listing every new episode, instead of one DM per episode, at the time you choose. It has a menu to mark episodes watched. |
| **Back to instant alerts** | Undo all of the above. |

Before a held alert is sent, Miru drops it if you've since watched the episode, muted the show or turned alerts off.

If your Miru+ ends, your settings are kept and alerts pause until it's back. You can still open `/alerts` to turn them off.
