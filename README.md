# 🎬 Now Showing
https://papaserf.github.io/now-showing/

**A random episode picker and personal TV channel for [Stremio](https://www.stremio.com/).**

Can't decide what to watch? Now Showing picks an episode for you from your favorite shows, ranked "best of" lists, or live trending feeds, then opens it in Stremio with one tap. It also runs a retro cable-style TV Guide, tracks your progress through story-driven shows, maps every show's best and worst episodes, and dresses up for the holidays.

It's a single self-contained `index.html` file: no install, no build step and no server. Your data stays in your browser.

---

## Contents
- [Features](#-features)
- [Getting started](#-getting-started)
- [How to use it](#-how-to-use-it)
- [Controls](#-controls)
- [Stremio addon](#-stremio-addon)
- [Your data](#-your-data)
- [Customizing the built-in shows](#-customizing-the-built-in-shows)
- [How it works](#-how-it-works)
- [Known limitations](#-known-limitations)
- [Credits & data sources](#-credits--data-sources)

---

## ✨ Features

### Pick something to watch
- **Your lobby:** a poster grid of your shows, sorted into tabs: All · Animation · Sitcom · Drama · Other.
- **Tap a show** for a random episode from it, or **🎬 Play Random** for a random show *and* episode, with a slot-machine spin.
- **Pick modes:** 🎲 **Pure Chaos** (any episode), ⭐ **Best of 3**, or 🏆 **Prestige** (best-rated of 6).
- **Never repeats:** the app tracks what you've watched and steers you to new episodes. When you finish a show, it resets.
- **Episode screen actions:**
  - **🎲 Reroll** for another pick.
  - **👀 Seen It** marks an episode watched and rolls again.
  - **🎚 Season picker** limits a show to the seasons you like (e.g. skip a rough first season).
- **🎡 Wheel of Shows:** spin a prize wheel to choose the show.
- **🍿 Marathon queue:** build a 3-show marathon or queue episodes as you go.
- **❤️ Favorites:** heart episodes you love and replay one at random.
- **🔍 Search:** add any show from Stremio's catalog. On the Movies tab, search finds movies.

### ▶ Next Up: watch story shows in order
- **Every show has a 🎲 Shuffle / ▶ In Order switch.** Dramas default to in order, while sitcoms, cartoons and anthologies (Black Mirror, Twilight Zone) shuffle.
- **Picks up where you left off:** in order, the app plays the episode after the furthest one you've watched. **⏭ Skip** jumps ahead without marking anything.
- **▶ Continue Watching:** a lobby row shows your next episode for each show you've started.

### 🗽🍅🇬🇧 Ranked "best of" lists
- **NYT: The 100 Best TV Shows of the 21st Century**
- **Rotten Tomatoes: The 100 Best Comedy Series of All Time**
- **BBC Culture: The 100 Greatest TV Series of the 21st Century**

Each list is shown in rank order with badges, and a ✓ marks shows already in your lobby. Tap any show to preview an episode, then **➕ Add** it to your lobby.

### 📡🎬 Live TV & Movies
- **Live feeds from Stremio's catalog:** 🔥 **Popular**, 🆕 **New this year** and 🏆 **Top Rated**, with genre filters (Horror, Sci-Fi, Reality-TV…).
- **Movie Night:** movies show year, runtime, IMDb rating and summary, and play straight in Stremio. Reroll for another movie, and 👁 marks the ones you've seen.

### 📺 Retro TV Guide
- **A cable-style program grid** with channels built from your lobby and lists:
  `2 LAFF` sitcoms · `3 TOON` cartoons · `4 DRMA` drama · `5 MIX` your lobby · `6 NYT` · `7 RT` · `8 BBC` · `9 FLIX` movies, plus `10 FAVS` and `13 SPKY` at Halloween.
- **A real broadcast day (6 AM–6 AM):** half-hour sitcom slots, hour-long dramas, movies at their real runtime. The schedule is the same every time you look that day, and new shows join the lineup at 6 AM.
- **Flip channels** with ▲/▼, arrow keys or a controller's D-pad, with on-screen static. See what's on now and next, and tune in.

### 🗺 Episode Map
- **A season-by-episode ratings heatmap** for any show, from red (weak) to green (great). It shows season averages, 🏆 best and 💤 worst episodes, and marks what you've watched.
- **Tap any square** to jump to that episode.

### 🎃 Holiday Mode
- **Switches on automatically** for Halloween, Thanksgiving, Christmas, New Year's and Valentine's, or pick any holiday year-round.
- **Re-themes the app** with holiday colors and drifting pumpkins, snow or hearts.
- **Finds holiday episodes** in your lobby (Treehouse of Horror, Thanksgiving specials, Festivus…). Play one, build a holiday marathon, or pick a themed movie.

### Fun stuff
- **🏆 17 achievements** and a 🔥 daily streak in the 📊 Stats dossier.
- **🔊 Sound effects:** ticks, dings, fanfares and channel static, generated in the browser and mutable.
- **Visuals:** confetti, a marquee-bulb title, 3D poster tilt, and blurred show-art backdrops.
- **📱 Shake your phone** to reroll.

---

## 🚀 Getting started

### Requirements
- **[Stremio](https://www.stremio.com/download)** installed on the device you'll watch on. Now Showing opens episodes using `stremio://` links.
- **A modern browser:** Chrome, Edge, Firefox or Safari.

### Run it
1. Download `index.html`.
2. Open it in your browser.

That's it.

### Host it on GitHub Pages (recommended)
This repo includes a workflow that publishes the app *and* the [Stremio addon](#-stremio-addon) for free:
1. Push this repo to GitHub, keeping `index.html`, `addon/` and `.github/workflows/` as they are, and make the repo **public**.
2. Go to **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
3. Go to the **Actions** tab, open **Build site & Stremio addon**, and click **Run workflow** (after that it runs on its own).
4. Open `https://<your-username>.github.io/<repo-name>/`.

On a phone, use your browser's **Add to Home screen** option for one-tap access.

---

## 🕹 How to use it

| I want to… | Do this |
|---|---|
| Watch something random from my shows | **🎬 Play Random** |
| Watch a specific show | Tap its poster |
| Continue a drama where I left off | **▶ Continue Watching** row, or open the show (In Order) |
| Let fate decide | **🎡 Spin the Wheel** |
| Line up a night of TV | **🍿 Build a Marathon** |
| Channel-surf | **📺 TV Guide** |
| Find a show's best episodes | Open the show → **🗺 Episode map** |
| Discover something new | **🗽 NYT / 🍅 RT / 🇬🇧 BBC** tabs, or **📡 Live TV** |
| Pick a movie | **🎬 Movies** tab |
| Get in the spirit | The 🎃 button (top right) or the holiday banner |

Close any pop-up with **Lobby**, the back button, **Esc**, or by clicking outside it.

---

## 🎮 Controls

### Keyboard
| Key | Action |
|---|---|
| `Space` | Play random (lobby) |
| `R` | Play random (lobby) · Reroll (episode screen) |
| `S` | Seen it, roll again |
| `F` | Favorite the current episode |
| `Q` | Add the current episode to the queue |
| `W` | Wheel of Shows |
| `M` | Build a marathon |
| `G` | TV Guide |
| `H` | Holiday panel |
| `/` | Search |
| `↑` / `↓` | Change channel (TV Guide) |
| `Enter` | Tune in (TV Guide) |
| `Esc` | Close / back |

### Game controller
| Button | Action |
|---|---|
| **Y** | Play random · Reroll |
| **X** | Seen it |
| **A** | Tune in (TV Guide) |
| **B** | Back |
| **D-pad ↑/↓** | Change channel (TV Guide) |

### Phone
- **Shake** to reroll.
- **Back button** closes pop-ups.

---

## 🧩 Stremio addon

Now Showing also comes as a **Stremio addon**, so its lists and TV Guide show up as rows right inside Stremio (on the Board and in Discover):

| Row | What's in it |
|---|---|
| 📺 **On Now** | What's airing right now on each TV Guide channel (LAFF, TOON, DRMA, NYT, RT, BBC), with the episode and what's up next |
| 🎲 **Random Picks** | 40 shows from all the lists, reshuffled every morning at 6 |
| 🎉 **Holiday Specials** | Shows with Halloween, Thanksgiving, Christmas, New Year's or Valentine's episodes, listing the episodes. Off-season, it previews the next holiday |
| 🎬 **Movie Night** | 30 picks from Stremio's top-rated movies, reshuffled every morning at 6 |
| 🎉 **Holiday Movie Night** | Movies for the current holiday: Christmas, Thanksgiving and New Year's titles, Halloween horror, Valentine's romance |
| 🗽 **NYT Top 100** · 🍅 **RT Comedy Top 100** · 🇬🇧 **BBC Top 100** | The ranked lists, with the rank under each poster |
| ⭐ **Now Showing Picks** | The app's starter lineup |

**Install:** open the hosted app, then **📊 Stats → 🧩 Add to Stremio**. For Stremio Web or another device, use **📋 Copy addon link** and paste it into Stremio's **Addons** page. The link is `https://<your-username>.github.io/<repo-name>/addon/manifest.json`.

**How it works:** the addon is plain JSON files, with no server. `addon/build.js` reads the lists straight out of `index.html`, so the app and the addon always match, and writes Stremio catalog files. The GitHub workflow reruns it **every 30 minutes** and publishes the result with the site. Episode and movie data is cached between runs (episodes refresh weekly), so after the first hour each run only fetches what's changed. The addon only adds *rows of shows*. Playback, streams and your watch history stay in Stremio and in the app.

**Notes:**
- **Schedule time zone:** set by `ADDON_TZ` in `.github/workflows/pages.yml` (default `America/Chicago`).
- **Your lobby isn't included:** the addon's channels use the app's built-in lineup and lists, since your personal lobby lives on your device.
- **Timing:** GitHub can delay scheduled runs by a few minutes, so "On Now" may lag slightly at the top of the hour.
- **Inactivity:** GitHub pauses scheduled workflows in repos with no activity for 60 days; any push turns them back on.
- **Holiday row warm-up:** after you first deploy, the holiday row fills in over the first couple of runs while episode data is collected.
- **Build it yourself:** `node addon/build.js --out _site` (Node 18+). Add `--offline` to use only cached data.

---

## 💾 Your data

Everything is saved in your browser's local storage on **that device**: watch history, added and hidden shows, favorites, queue, settings, achievements and the TV Guide lineup. Nothing is sent to any server of ours, because there isn't one.

**To move your data to another device** (or keep a backup), go to **📊 Stats → ⬇ Export backup**, then **⬆ Import backup** on the other device.

Episode lists are cached for 3 days and live feeds for 6 hours, so the app stays fast. **♻ Refresh episode data** in Stats clears the cache.

---

## 🛠 Customizing the built-in shows

The starter lobby is defined near the top of the `<script>` block in `index.html`, in the `SHOWS` array:

```js
{ "key": "6", "name": "Seinfeld", "id": 530, "imdb": "tt0098904",
  "image": "https://static.tvmaze.com/uploads/images/medium_portrait/83/207960.jpg",
  "seasons": [3, 4, 5, 6, 7], "category": "Sitcom" }
```

| Field | Meaning |
|---|---|
| `key` | Any unique ID |
| `id` | The show's [TVmaze](https://www.tvmaze.com/) ID (from its TVmaze URL) |
| `imdb` | IMDb ID, used to open the episode in Stremio |
| `seasons` | `null` for all seasons, or a list to limit which seasons can be picked |
| `category` | `Animation`, `Sitcom`, `Drama` or `Other` |
| `sub_shows` | *(optional)* combine several TVmaze shows into one entry |

Shows added through the in-app search don't need any of this; they're saved automatically.

---

## 📁 Repository layout

```
index.html                     the whole app
addon/build.js                 builds the Stremio addon from index.html
addon/logo.png                 addon logo
.github/workflows/pages.yml    publishes the app + addon to GitHub Pages every 30 minutes
README.md · RELEASE_NOTES.md
```

---

## ⚙ How it works

- **One file:** plain HTML, CSS and JavaScript, with no frameworks or build tools.
- **Episode data:** from the [TVmaze API](https://www.tvmaze.com/api) for built-in shows, and Stremio's **Cinemeta** catalog for shows added from search. Each source backs up the other: if TVmaze is down, episodes come from Cinemeta; if a show from Cinemeta lacks ratings, they're borrowed from TVmaze.
- **Live feeds and search:** Cinemeta's public catalog endpoints.
- **Playback:** `stremio:///detail/series/<imdb>/<imdb>:<season>:<episode>` (or `/detail/movie/...` for films) hands off to the Stremio app.
- **TV Guide schedules:** generated from a seeded random sequence per channel and day, so they're consistent without storing a schedule.
- **Sound effects:** synthesized with the Web Audio API.

---

## ⚠ Known limitations

- **Per-device data:** watch history doesn't sync between devices automatically. Use Export / Import backup.
- **Starting point:** Stremio starts episodes from the beginning, including when you "tune in" mid-show from the TV Guide.
- **Ratings coverage:** shows without ratings on TVmaze or Cinemeta show gray squares in the Episode Map, and pick modes treat their episodes equally.
- **RT list gap:** Rotten Tomatoes' published list has a blank #39. It's filled with the original entry, *The Abbott and Costello Show*.
- **Entries Stremio lists as films:** a few list entries (e.g. *O.J.: Made in America*) exist in Stremio only as films and play as a movie.

---

## 🙏 Credits & data sources

- **Episode data:** [TVmaze](https://www.tvmaze.com/api) (CC BY-SA) and Stremio's Cinemeta catalog.
- **Lists:**
  - [The New York Times: The 100 Best TV Shows of the 21st Century](https://nofilmschool.com/best-tv-shows-of-the-21st-century)
  - [Rotten Tomatoes: The 200 Best Comedy Series of All Time](https://editorial.rottentomatoes.com/guide/best-comedy-shows-of-all-time/)
  - [BBC Culture: The 100 Greatest TV Series of the 21st Century](https://en.wikipedia.org/wiki/BBC%27s_100_Greatest_Television_Series_of_the_21st_Century)
- **Fonts:** [Monoton](https://fonts.google.com/specimen/Monoton), [Montserrat](https://fonts.google.com/specimen/Montserrat) and [VT323](https://fonts.google.com/specimen/VT323) from Google Fonts.
- **Playback:** [Stremio](https://www.stremio.com/).

Now Showing isn't affiliated with Stremio, TVmaze, IMDb, The New York Times, Rotten Tomatoes or the BBC.
