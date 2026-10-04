# 🎬 Now Showing v2.0: The Big Upgrade

A ground-up upgrade of the Now Showing episode randomizer: rock-solid under the hood, packed with new ways to pick what to watch, and a lot more fun to use. Still a single `index.html` file, so just drop it in place of the old one.

> **Upgrading from v1?** Your watch history, added shows, hidden shows and recently played list carry over automatically.

---

## ✨ Highlights

- **📺 Retro TV Guide.** Cable-style channels built from your lobby and lists, airing on a real daily schedule. Flip channels with static, see what's on now, and tune in.
- **▶ Next Up mode.** Story-driven shows play in order, with a Continue Watching row. Sitcoms and cartoons still shuffle.
- **🗺 Episode Map.** A season-by-episode ratings heatmap for any show. Tap a square to jump to that episode.
- **🗽🍅🇬🇧 Three ranked "best of" lists.** The NYT Top 100, Rotten Tomatoes' Top 100 Comedies and the BBC's Top 100 of the 21st Century.
- **📡🎬 Live TV and Movies tabs.** Live Popular / New / Top Rated feeds from Stremio's catalog, with genre filters and a full Movie Night flow.
- **🎃 Holiday Mode.** A seasonal theme that hunts down Halloween, Thanksgiving, Christmas, New Year's and Valentine's episodes in your lobby.
- **🧩 Stremio addon.** On Now, Random Picks and the three top-100 lists as rows inside Stremio itself, rebuilt every 30 minutes by GitHub Actions.
- **🌐 Stremio Web support.** Open episodes in web.stremio.com on devices without the Stremio app, with an automatic "Stremio didn't open?" rescue.

---

## 🆕 New features

### Picking what to watch
- **Pick modes:** 🎲 Pure Chaos (any episode), ⭐ Best of 3, or 🏆 Prestige (best-rated of 6).
- **Next Up / In Order:** a per-show Shuffle ↔ In Order switch, with smart defaults (dramas in order, comedies shuffled, anthologies like Black Mirror shuffled).
  - **⏭ Skip** jumps ahead without marking anything watched.
  - **Resumes after the furthest episode you've watched,** the way streaming apps do.
  - **▶ Continue Watching** row in the lobby.
- **🎚 Season picker:** choose which seasons a show can roll from. Saved per show.
- **👀 Seen It:** marks an episode watched and rolls again.
- **🎡 Wheel of Shows:** a spinning prize wheel with ticking sound and confetti.
- **🍿 Marathon queue:** build a 3-show marathon or queue any episode, then play it from a floating queue.
- **❤️ Favorites:** heart episodes and replay a random favorite any time.

### Lists, feeds and search
- **🗽 NYT Top 100** (21st century), **🍅 RT Comedy Top 100** and **🇬🇧 BBC Top 100.** Each is ranked, with rank badges and a ✓ on shows already in your lobby. Every entry was checked against Stremio's catalog.
- **📡 Live TV and 🎬 Movies tabs:** live 🔥 Popular, 🆕 New this year and 🏆 Top Rated feeds, with genre filters, ⭐ ratings, Load more, and 6-hour caching.
- **Movie Night:** movies open with year, runtime and IMDb rating and play straight in Stremio. Reroll for another, 👁 marks movies you've seen, and Play Random favors unseen ones.
- **Search** on the Movies tab finds movies; everywhere else it finds TV shows.
- **Multi-part entries:** shows split across several Stremio entries (e.g. *This Is England '86 / '88 / '90*) play as one show.
- **Film entries:** entries Stremio only has as a movie (e.g. *O.J.: Made in America*) play straight in Stremio.

### 📺 TV Guide
- **Channels:** 2 LAFF · 3 TOON · 4 DRMA · 5 MIX · 6 NYT · 7 RT · 8 BBC · 9 FLIX, plus 10 FAVS and 13 SPKY (Halloween).
- **A real broadcast-day schedule (6 AM–6 AM):** half-hour sitcom slots, hour-long drama slots, movies at their real runtime. The schedule stays the same all day.
- **Daily lineup lock:** shows you add join the lineup at the next 6 AM; removed shows stop airing right away.
- **Flip channels** with ▲/▼, the arrow keys or the D-pad, with on-screen static and a static sound. "On now" panel with time left and what's next.

### 🗺 Episode Map
- **Ratings heatmap:** red-to-green squares by episode rating, plus season averages, 🏆 best and 💤 worst episodes, watched markers, and dimmed seasons you've turned off.
- **Borrowed ratings:** shows added from Stremio get ratings from TVmaze automatically.

### 🎃 Holiday Mode
- **Switches on automatically** for Halloween, Thanksgiving, Christmas, New Year's and Valentine's, or force any holiday year-round.
- **Re-themes the app** with holiday colors and floating pumpkins, snow or hearts.
- **Finds holiday episodes** by title and description: Play One, Holiday Marathon, Browse All, plus a themed movie pick.

### 🧩 Stremio addon
- **Catalog rows in Stremio:** 📺 On Now (what's airing on each TV Guide channel, with episode and up-next), 🎲 Random Picks (reshuffled daily), 🗽 NYT, 🍅 RT and 🇬🇧 BBC top 100s, and ⭐ Now Showing Picks.
- **No server needed:** static JSON built from the app's own data by `addon/build.js` and published to GitHub Pages.
- **One-tap install:** 📊 Stats → 🧩 Add to Stremio, or 📋 Copy addon link for Stremio Web.

### 🌐 Stremio app or Stremio Web
- **"Open in" switch** under ▶ Play: 📱 Stremio app or 🌐 Stremio Web. Applies to episodes, movies, Recently Played and the queue.
- **Rescue prompt:** if the app doesn't open within a few seconds, "Stremio didn't open? 🌐 Try Stremio Web" appears.

### Fun and polish
- **Visuals:** a 🎰 slot-machine spin on Play Random, a marquee-bulb title, 3D tilt-and-glare on poster cards, and blurred show-art backdrops.
- **🔊 Sound effects,** generated in the browser so there are no files to load. Mute toggle included.
- **🏆 17 achievements** and a 🔥 day streak in the Stats dossier.
- **📱 Shake your phone** to reroll.
- **Getting around:**
  - **🎮 Controller support:** Y roll, X seen it, B back, A select, D-pad to change channels.
  - **⌨ Keyboard shortcuts** for nearly everything.
  - **Closing pop-ups:** click outside any pop-up, or use the Android back button.
- **💾 Backup and restore:** export and import all your data as a single file.

---

## 🐛 Fixes from v1

- **Stats:** no longer crashes on shows you added, and now loads shows in parallel with a progress counter.
- **Reroll:** after Play Random, it now picks a new random show instead of repeating the same one.
- **Search:** works with titles containing apostrophes (e.g. *Bob's Burgers*), and results are safely escaped.
- **Tabs:**
  - Shows you added with genres like Crime or Fantasy now appear in the right category tab.
  - The NYT tab now highlights correctly.
- **Episode picking:**
  - "Best of 3" can no longer pick the same episode three times.
  - The "watched everything" reset now actually saves.
  - Unaired future episodes are skipped.
- **Reliability:**
  - Fast clicking can no longer show the wrong show's results.
  - The app retries automatically when TVmaze is busy (rate-limited) instead of silently dropping shows.
  - An empty feed no longer freezes the page.
  - Corrupt saved data no longer breaks the app.
  - Pop-ups with a button (Undo, Try Stremio Web) are no longer replaced by other messages before you can tap them.
  - If TVmaze is down, episodes load from Cinemeta instead.

---

## ⚠️ Known limitations

- **Per-device data:** watch history is stored separately on each device or browser. Use Stats → Export / Import backup to move it between devices.
- **Starting point:** Stremio always starts an episode from the beginning, including when you "tune in" mid-show from the TV Guide.
- **Feed links:** the live feeds use Stremio's public catalog. If a feed shows "Couldn't load," hit ↻ to retry.
- **RT list gap:** Rotten Tomatoes' own page has a blank #39. It's filled with the original entry, *The Abbott and Costello Show*.

---

## 📚 Data sources

- Episode data: [TVmaze](https://www.tvmaze.com/api) and Stremio's Cinemeta catalog.
- Lists:
  - [New York Times: The 100 Best TV Shows of the 21st Century](https://nofilmschool.com/best-tv-shows-of-the-21st-century)
  - [Rotten Tomatoes: The 200 Best Comedy Series of All Time](https://editorial.rottentomatoes.com/guide/best-comedy-shows-of-all-time/)
  - [BBC Culture: The 100 Greatest TV Series of the 21st Century](https://en.wikipedia.org/wiki/BBC%27s_100_Greatest_Television_Series_of_the_21st_Century)
- Playback: opens episodes and movies in [Stremio](https://www.stremio.com/) via `stremio://` links.
