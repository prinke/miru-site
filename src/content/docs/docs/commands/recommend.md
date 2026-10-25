---
title: /recommend
description: Get anime or manga recommendations for you or your whole server.
---

```
/recommend [for] [type] [genre]
```

Recommendations built from AniList's community "if you liked this, try…" data. Needs a [linked account](/docs/commands/link/). The reply is public.

## Options

| Option | Choices | Default |
| --- | --- | --- |
| `for` | **Me**, **This server** | Me |
| `type` | Anime, Manga | Anime |
| `genre` | Action, Adventure, Comedy, Drama, Ecchi, Fantasy, Horror, Mahou Shoujo, Mecha, Music, Mystery, Psychological, Romance, Sci-Fi, Slice of Life, Sports, Supernatural, Thriller | Any |

## For you

Picks are built from your highest-scored titles, or from your completed titles if you don't score. Each pick says **Because you liked …**.

## For this server

"Nobody here has seen these yet." Miru pools picks from up to 10 randomly chosen members who have joined the server feed from [`/feed`](/docs/commands/feed/#joining-and-leaving). At least 2 members need to have joined. Each pick says whose favourites led to it.

## What's left out

- Anything already on any of the included lists
- Other entries in the same franchise, so no "watch season 2" suggestions
- Adult titles
- Titles that haven't been released yet

## Add to Planning

The **Add one to your Planning list…** dropdown lets **anyone** who sees the reply add a pick to their own Planning list, as long as they've linked AniList. It lasts **10 minutes**.
