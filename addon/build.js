#!/usr/bin/env node
/*
 * Now Showing — Stremio addon builder
 * -----------------------------------
 * Builds a catalog-only Stremio addon as static JSON files, straight from the data inside index.html,
 * so the app and the addon always share the same lists.
 *
 *   node addon/build.js [--out _site] [--offline]
 *
 * Output (relative to --out):
 *   index.html                        the app itself (copied)
 *   addon/manifest.json               install this URL in Stremio
 *   addon/catalog/<type>/<id>.json    one file per catalog (series and movie)
 *   addon/logo.png                    (copied if present)
 *
 * Env:
 *   ADDON_TZ   time zone for the TV schedule (default America/Chicago)
 *   ADDON_NOW  override "now" (ms or ISO date) — for testing
 *
 *   ADDON_CACHE            where episode/movie data is cached between runs (default .cache/ns-cache.json)
 *   ADDON_FETCH_BUDGET_MS  how long one run may spend fetching (default 150000)
 *
 * Needs Node 18+ (built-in fetch). --offline skips all network lookups and uses only the cache.
 * Episode lists are cached for a week; each run refreshes a batch, so the holiday row fills in over a run or two.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const OUT = path.resolve(args.includes('--out') ? args[args.indexOf('--out') + 1] : '_site');
const OFFLINE = args.includes('--offline');
const ROOT = path.resolve(__dirname, '..');
const TZ = process.env.ADDON_TZ || 'America/Chicago';
const NOW = process.env.ADDON_NOW ? (isNaN(+process.env.ADDON_NOW) ? Date.parse(process.env.ADDON_NOW) : +process.env.ADDON_NOW) : Date.now();
const VERSION = '1.1.0';
const CACHE_FILE = path.resolve(process.env.ADDON_CACHE || path.join(ROOT, '.cache', 'ns-cache.json'));
const FETCH_BUDGET_MS = +(process.env.ADDON_FETCH_BUDGET_MS || 150000);   // max time per run spent refreshing data
const PACE_MS = +(process.env.ADDON_PACE_MS || 550);                         // gap between requests (TVmaze allows 20 / 10 s)

// ---------- Data: read the arrays out of index.html ----------
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
function grab(name) {
    const m = new RegExp(`const ${name} = (\\[.*?\\]);\\s*\\n`, 's').exec(html);
    if (!m) throw new Error(`Couldn't find ${name} in index.html`);
    return JSON.parse(m[1]);
}
const SHOWS = grab('SHOWS'), NYT = grab('NYT_100'), RT = grab('RT_100'), BBC = grab('BBC_100');
const imdbOf = s => s.imdb || (s.sub_shows && s.sub_shows[0] && s.sub_shows[0].imdb) || null;
const posterOf = s => s.image || `https://images.metahub.space/poster/small/${imdbOf(s)}/img`;
const byImdb = new Map(SHOWS.filter(imdbOf).map(s => [imdbOf(s), s]));

// ---------- Time helpers (schedule runs in ADDON_TZ) ----------
function zoned(ts) {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
        .formatToParts(new Date(ts)).map(x => [x.type, x.value]));
    return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}
const offsetAt = ts => { const z = zoned(ts); return Date.UTC(z.y, z.m - 1, z.d, z.h, z.mi, z.s) - Math.floor(ts / 1000) * 1000; };
function zonedToUtc(y, m, d, h, mi) {
    let guess = Date.UTC(y, m - 1, d, h, mi);
    guess -= offsetAt(guess);
    return Date.UTC(y, m - 1, d, h, mi) - offsetAt(guess);
}
function broadcastStart(ts) {            // 6:00 AM local; before 6 belongs to the previous day
    const z = zoned(ts);
    let start = zonedToUtc(z.y, z.m, z.d, 6, 0);
    if (start > ts) { const prev = zoned(start - 12 * 3600e3); start = zonedToUtc(prev.y, prev.m, prev.d, 6, 0); }
    return start;
}
const dayKey = ts => { const z = zoned(ts); return `${z.y}-${String(z.m).padStart(2, '0')}-${String(z.d).padStart(2, '0')}`; };
const fmt = ts => new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(new Date(ts));
const tzAbbr = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'short' }).formatToParts(new Date(NOW)).find(p => p.type === 'timeZoneName').value;

// ---------- Seeded randomness (same algorithm as the app) ----------
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function seeded(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- Channels ----------
const seriesOnly = list => list.filter(s => !s.movie && imdbOf(s));
const CHANNELS = [
    { id: 'laff', num: 2, call: 'LAFF', defLen: 30, shows: SHOWS.filter(s => s.category === 'Sitcom') },
    { id: 'toon', num: 3, call: 'TOON', defLen: 30, shows: SHOWS.filter(s => s.category === 'Animation') },
    { id: 'drma', num: 4, call: 'DRMA', defLen: 60, shows: SHOWS.filter(s => s.category === 'Drama') },
    { id: 'nyt', num: 6, call: 'NYT', defLen: 60, shows: seriesOnly(NYT) },
    { id: 'rt', num: 7, call: 'RT', defLen: 30, shows: seriesOnly(RT) },
    { id: 'bbc', num: 8, call: 'BBC', defLen: 60, shows: seriesOnly(BBC) }
].filter(c => c.shows.length >= 2);

function slotMinutes(show, ch) {
    const known = byImdb.get(imdbOf(show));
    const cat = known ? known.category : null;
    if (cat === 'Drama') return 60;
    if (cat) return 30;
    return ch.defLen;
}

function onAir(ch, ts) {
    const start = broadcastStart(ts), day = dayKey(start);
    const r = seeded(hashStr(ch.id + '|' + day));
    let t = start, last = null, guard = 0, cur = null;
    while (guard++ < 500) {
        let show;
        for (let k = 0; k < 5; k++) { show = ch.shows[Math.floor(r() * ch.shows.length)]; if (ch.shows.length < 2 || imdbOf(show) !== last) break; }
        last = imdbOf(show);
        const end = t + slotMinutes(show, ch) * 60000;
        const slot = { show, start: t, end, key: `${day}|${ch.id}|${t}` };
        if (cur) return { now: cur, next: slot };
        if (end > ts) cur = slot;
        t = end;
    }
    return { now: cur, next: null };
}

// ---------- Network (paced for TVmaze's 20 requests / 10 s) ----------
let lastReq = 0;
async function getJSON(url, tries = 3) {
    for (let i = 0; i < tries; i++) {
        const wait = lastReq + PACE_MS - Date.now();
        if (wait > 0) await new Promise(res => setTimeout(res, wait));
        lastReq = Date.now();
        const r = await fetch(url, { headers: { 'User-Agent': 'NowShowing-Addon-Builder' } });
        if (r.status === 429) { await new Promise(res => setTimeout(res, 3000)); continue; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
    }
    throw new Error('rate-limited');
}

// ---------- Cache (kept between runs by the GitHub workflow) ----------
let CACHE = { v: 1, shows: {}, cine: {} };
try { const c = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); if (c && c.v === 1) CACHE = Object.assign(CACHE, c); } catch (e) { /* first run */ }
const SHOW_TTL = 7 * 864e5, FAIL_TTL = 864e5, CINE_TTL = 20 * 3600e3;
const runStart = Date.now();
const budgetLeft = () => !OFFLINE && Date.now() - runStart < FETCH_BUDGET_MS;
const isFresh = (rec, ttl) => rec && NOW - rec.t < (rec.err ? FAIL_TTL : ttl);
function saveCache() {
    try { fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true }); fs.writeFileSync(CACHE_FILE, JSON.stringify(CACHE)); }
    catch (e) { console.warn('  ! could not save cache:', e.message); }
}

// ---------- Holidays (same windows and keywords as the app's Holiday Mode) ----------
const HOLIDAYS = [
    { id: 'halloween', name: 'Halloween', emoji: '🎃', start: [10, 1], end: [11, 1], movieGenre: 'Horror',
      strong: /hallo[wv]e+n|treehouse of horror|trick[- ]?or[- ]?treat|all hallows|d[ií]a de (los )?muertos|samhain/i },
    { id: 'thanksgiving', name: 'Thanksgiving', emoji: '🦃', start: [11, 2], end: [11, 30], movieGenre: 'Family', movieSearch: 'thanksgiving',
      strong: /thanksgiving|friendsgiving|turkey day|pilgrims?\b/i },
    { id: 'christmas', name: 'Christmas', emoji: '🎄', start: [12, 1], end: [12, 26], movieGenre: 'Family', movieSearch: 'christmas',
      strong: /christmas|x-?mas|santa\b|santa's|yule|festivus|hanukk?ah|chanukk?ah|kwanzaa|mistletoe|nativity|\bnoel\b|holiday special|jingle|sleigh|reindeer|north pole|grinch|scrooge|nutcracker/i },
    { id: 'newyear', name: "New Year's", emoji: '🎆', start: [12, 27], end: [1, 3], movieGenre: 'Comedy', movieSearch: 'new year',
      strong: /new year|auld lang|hogmanay|ball drop|countdown to midnight/i },
    { id: 'valentine', name: "Valentine's", emoji: '💘', start: [2, 1], end: [2, 14], movieGenre: 'Romance',
      strong: /valentine|galentine|cupid/i }
];
const stripHtml = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
function holidayNow() {
    const z = zoned(NOW), v = z.m * 100 + z.d;
    const inWin = h => { const s = h.start[0] * 100 + h.start[1], e = h.end[0] * 100 + h.end[1]; return s <= e ? v >= s && v <= e : v >= s || v <= e; };
    const active = HOLIDAYS.find(inWin);
    if (active) return { h: active, upcoming: false };
    // Off-season: preview the next holiday on the calendar
    const until = h => { const s = h.start[0] * 100 + h.start[1]; return s > v ? s - v : s + 1300 - v; };
    return { h: HOLIDAYS.slice().sort((a, b) => until(a) - until(b))[0], upcoming: true };
}

// ---------- Episodes (TVmaze, cached) ----------
async function fetchShowRecord(show) {
    const k = imdbOf(show), old = CACHE.shows[k] || {};
    const known = byImdb.get(k);
    let parts;
    if (known) parts = known.sub_shows || [{ id: known.id, seasons: known.seasons }];
    else parts = [{ id: old.tvm || (await getJSON(`https://api.tvmaze.com/lookup/shows?imdb=${k}`)).id, seasons: null }];
    const eps = [], hol = {};
    for (const p of parts) {
        const list = await getJSON(`https://api.tvmaze.com/shows/${p.id}/episodes`);
        for (const e of list) {
            if (!e.season || !e.number || (p.seasons && !p.seasons.includes(e.season))) continue;
            eps.push([e.season, e.number, e.name || `Episode ${e.number}`, e.airdate || '']);
            const sum = stripHtml(e.summary);
            for (const h of HOLIDAYS) {
                const score = h.strong.test(e.name || '') ? 3 : h.strong.test(sum) ? 2 : 0;
                if (score) (hol[h.id] = hol[h.id] || []).push([e.season, e.number, e.name || '', score, e.airdate || '']);
            }
        }
    }
    return { t: NOW, tvm: known ? null : parts[0].id, eps, hol };
}

async function showRecord(show) {
    const k = imdbOf(show); if (!k) return null;
    const rec = CACHE.shows[k];
    if (isFresh(rec, SHOW_TTL) || !budgetLeft()) return rec || null;
    try { CACHE.shows[k] = await fetchShowRecord(show); }
    catch (e) { console.warn(`  ! ${show.name}: ${e.message}`); CACHE.shows[k] = Object.assign({}, rec || { eps: [], hol: {} }, { t: NOW, err: true }); }
    return CACHE.shows[k];
}

const today = () => new Date(NOW).toISOString().slice(0, 10);
async function episodesFor(show) {
    const rec = await showRecord(show);
    return rec ? rec.eps.filter(e => !e[3] || e[3] <= today()).map(e => ({ season: e[0], number: e[1], name: e[2] })) : [];
}
async function episodeFor(slot) {
    const eps = await episodesFor(slot.show);
    if (!eps.length) return null;
    return eps[Math.floor(seeded(hashStr(slot.key))() * eps.length)];
}
const epLabel = e => e ? `S${e.season}E${e.number} “${e.name}”` : '';

// Refresh the oldest/missing show records, as far as this run's time budget allows
async function warmCache(shows) {
    const todo = shows.filter(s => imdbOf(s) && !isFresh(CACHE.shows[imdbOf(s)], SHOW_TTL))
        .sort((a, b) => ((CACHE.shows[imdbOf(a)] || {}).t || 0) - ((CACHE.shows[imdbOf(b)] || {}).t || 0));
    let n = 0;
    for (const s of todo) { if (!budgetLeft()) break; await showRecord(s); n++; }
    const known = shows.filter(s => CACHE.shows[imdbOf(s)]).length;
    console.log(`  episode data: refreshed ${n} shows this run · ${known}/${shows.length} cached${todo.length > n ? ` · ${todo.length - n} left for later runs` : ''}`);
}

// ---------- Movies (Stremio's Cinemeta catalog, cached) ----------
async function moviePool(genre, max = 300) {
    const key = 'imdbRating|' + (genre || '');
    const rec = CACHE.cine[key];
    if (isFresh(rec, CINE_TTL) || !budgetLeft()) return rec ? rec.metas : [];
    const metas = [], seen = new Set();
    try {
        while (metas.length < max && budgetLeft()) {
            const extra = [genre ? 'genre=' + encodeURIComponent(genre) : '', metas.length ? 'skip=' + metas.length : ''].filter(Boolean).join('&');
            const data = await getJSON(`https://v3-cinemeta.strem.io/catalog/movie/imdbRating${extra ? '/' + extra : ''}.json`);
            const page = (data.metas || []).filter(m => m && /^tt\d+$/.test(m.id || '') && m.poster && !seen.has(m.id));
            if (!page.length) break;
            page.forEach(m => { seen.add(m.id); metas.push({ id: m.id, name: m.name, poster: m.poster, background: m.background || undefined,
                releaseInfo: m.releaseInfo || m.year || undefined, imdbRating: m.imdbRating || undefined, genres: m.genres || m.genre || undefined,
                description: m.description ? String(m.description).slice(0, 400) : undefined }); });
        }
        CACHE.cine[key] = { t: NOW, metas };
    } catch (e) {
        console.warn(`  ! movie list (${genre || 'all'}): ${e.message}`);
        if (rec) return rec.metas;
        CACHE.cine[key] = { t: NOW, err: true, metas: [] };
    }
    return metas;
}
// Movies *about* a holiday, via Stremio's catalog search (ranked by rating, best first)
async function movieSearchPool(term) {
    const key = 'search|' + term;
    const rec = CACHE.cine[key];
    if (isFresh(rec, CINE_TTL) || !budgetLeft()) return rec ? rec.metas : [];
    try {
        const data = await getJSON(`https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(term)}.json`);
        const metas = (data.metas || []).filter(m => m && /^tt\d+$/.test(m.id || '') && m.poster)
            .map(m => ({ id: m.id, name: m.name, poster: m.poster, background: m.background || undefined,
                releaseInfo: m.releaseInfo || m.year || undefined, imdbRating: m.imdbRating || undefined, genres: m.genres || m.genre || undefined,
                description: m.description ? String(m.description).slice(0, 400) : undefined }))
            .sort((a, b) => (parseFloat(b.imdbRating) || 0) - (parseFloat(a.imdbRating) || 0));
        CACHE.cine[key] = { t: NOW, metas };
        return metas;
    } catch (e) {
        console.warn(`  ! movie search (${term}): ${e.message}`);
        return rec ? rec.metas : [];
    }
}

function dailyShuffle(list, salt, n) {
    const a = list.slice(), r = seeded(hashStr(salt + '|' + dayKey(broadcastStart(NOW))));
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, n);
}
const moviePreview = (m, note) => Object.assign({ type: 'movie', posterShape: 'poster' }, m,
    { imdbRating: m.imdbRating ? String(m.imdbRating) : undefined, description: [note, m.description].filter(Boolean).join('\n\n') });

// ---------- Catalogs ----------
const preview = (s, extra) => Object.assign({ id: imdbOf(s), type: 'series', name: s.name, poster: posterOf(s), posterShape: 'poster' }, extra);

async function buildOnNow() {
    const metas = [], used = new Set();
    for (const ch of CHANNELS) {
        const { now, next } = onAir(ch, NOW);
        if (!now || used.has(imdbOf(now.show))) continue;
        used.add(imdbOf(now.show));
        const ep = await episodeFor(now);
        const lines = [
            `📺 On now on CH ${ch.num} ${ch.call} · ${fmt(now.start)}–${fmt(now.end)} ${tzAbbr}`,
            ep ? `Now playing: ${epLabel(ep)}` : '',
            next ? `Up next at ${fmt(next.start)}: ${next.show.name}` : '',
            'Schedule from the Now Showing TV Guide.'
        ].filter(Boolean);
        metas.push(preview(now.show, { name: `${ch.num} ${ch.call} · ${now.show.name}`, releaseInfo: `until ${fmt(now.end)}`, description: lines.join('\n') }));
    }
    return metas;
}

function buildList(list, label) {
    return seriesOnly(list).sort((a, b) => a.rank - b.rank).map(s =>
        preview(s, { releaseInfo: `#${s.rank}`, description: `#${s.rank} on ${label}.` }));
}

function allSeries() {
    const pool = new Map();
    const add = (s, from) => { const k = imdbOf(s); if (k && !s.movie && !pool.has(k)) pool.set(k, { s, from }); };
    SHOWS.forEach(s => add(s, 'Now Showing picks'));
    NYT.forEach(s => add(s, `NYT #${s.rank}`));
    RT.forEach(s => add(s, `RT Comedy #${s.rank}`));
    BBC.forEach(s => add(s, `BBC #${s.rank}`));
    return [...pool.values()];
}

function buildRandom() {
    return dailyShuffle(allSeries(), 'random', 40).map(({ s, from }) => preview(s, { description: `🎲 Today's random pick (${from}). New picks every morning at 6.` }));
}

function buildPicks() {
    return SHOWS.filter(imdbOf).slice().sort((a, b) => a.name.localeCompare(b.name))
        .map(s => preview(s, { genres: [s.category], description: `From the Now Showing starter lineup (${s.category}).` }));
}

async function buildHolidayShows() {
    const { h, upcoming } = holidayNow();
    const rows = [];
    for (const { s } of allSeries()) {
        const rec = CACHE.shows[imdbOf(s)];
        const hits = rec && rec.hol && rec.hol[h.id] ? rec.hol[h.id].filter(e => !e[4] || e[4] <= today()) : [];
        const uniq = [...new Map(hits.map(e => [`${e[0]}|${e[1]}|${e[2]}`, e])).values()];
        if (uniq.length) rows.push({ s, hits: uniq.sort((a, b) => b[3] - a[3] || a[0] - b[0] || a[1] - b[1]) });
    }
    rows.sort((a, b) => b.hits.length - a.hits.length || a.s.name.localeCompare(b.s.name));
    return rows.slice(0, 60).map(({ s, hits }) => preview(s, {
        releaseInfo: `${hits.length} ${h.name} ep${hits.length === 1 ? '' : 's'}`,
        description: [
            upcoming ? `${h.emoji} Coming up: ${h.name}. Get a head start with these.` : `${h.emoji} ${h.name} episodes of ${s.name}:`,
            ...hits.slice(0, 5).map(e => `• S${e[0]}E${e[1]} “${e[2]}”`),
            hits.length > 5 ? `…and ${hits.length - 5} more` : '',
            'Found by Now Showing\'s Holiday Mode.'
        ].filter(Boolean).join('\n')
    }));
}

async function buildMovieNight() {
    const pool = await moviePool('', 300);
    return dailyShuffle(pool, 'movienight', 30).map(m => moviePreview(m, '🎬 Tonight\'s Movie Night pick from Stremio\'s top-rated films. Reshuffled every morning at 6.'));
}

async function buildHolidayMovies() {
    const { h, upcoming } = holidayNow();
    let pool = [], kind = `top-rated ${h.movieGenre.toLowerCase()} pick`;
    if (h.movieSearch) {
        // Holiday-themed titles first (best-rated 40), topped up with the genre if the search comes back thin
        pool = (await movieSearchPool(h.movieSearch)).slice(0, 40);
        kind = `${h.name} movie`;
    }
    if (pool.length < 15) {
        const seen = new Set(pool.map(m => m.id));
        pool = pool.concat((await moviePool(h.movieGenre, 200)).filter(m => !seen.has(m.id)));
        if (!h.movieSearch || pool.length > 40) kind = h.movieSearch ? `${h.name} or ${h.movieGenre.toLowerCase()} pick` : kind;
    }
    return dailyShuffle(pool, 'holmovies|' + h.id, 30).map(m => moviePreview(m,
        `${h.emoji} ${upcoming ? 'Coming up: ' + h.name : h.name} movie night: ${/^[aeiou]/i.test(kind) ? 'an' : 'a'} ${kind}. Reshuffled every morning at 6.`));
}

const CATALOGS = [
    { id: 'ns-onnow', type: 'series', name: '📺 On Now', build: buildOnNow },
    { id: 'ns-random', type: 'series', name: '🎲 Random Picks', build: buildRandom },
    { id: 'ns-holiday', type: 'series', name: '🎉 Holiday Specials', build: buildHolidayShows },
    { id: 'ns-nyt', type: 'series', name: '🗽 NYT Top 100', build: () => buildList(NYT, "the New York Times' 100 Best TV Shows of the 21st Century") },
    { id: 'ns-rt', type: 'series', name: '🍅 RT Comedy Top 100', build: () => buildList(RT, "Rotten Tomatoes' Best Comedy Series of All Time") },
    { id: 'ns-bbc', type: 'series', name: '🇬🇧 BBC Top 100', build: () => buildList(BBC, "BBC Culture's 100 Greatest TV Series of the 21st Century") },
    { id: 'ns-picks', type: 'series', name: '⭐ Now Showing Picks', build: buildPicks },
    { id: 'ns-movienight', type: 'movie', name: '🎬 Movie Night', build: buildMovieNight },
    { id: 'ns-holidaymovies', type: 'movie', name: '🎉 Holiday Movie Night', build: buildHolidayMovies }
];

// ---------- Write ----------
(async () => {
    const addonDir = path.join(OUT, 'addon');
    for (const t of ['series', 'movie']) fs.mkdirSync(path.join(addonDir, 'catalog', t), { recursive: true });
    fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(OUT, 'index.html'));
    const logo = path.join(__dirname, 'logo.png');
    const hasLogo = fs.existsSync(logo);
    if (hasLogo) fs.copyFileSync(logo, path.join(addonDir, 'logo.png'));

    const manifest = {
        id: 'community.nowshowing',
        version: VERSION,
        name: 'Now Showing',
        description: 'TV lists and a live TV Guide from the Now Showing episode randomizer: what\'s on now across retro channels, daily random picks, holiday specials, movie night, and the NYT, Rotten Tomatoes and BBC top-100 lists. Catalogs only; no streams.',
        resources: ['catalog'],
        types: ['series', 'movie'],
        catalogs: CATALOGS.map(c => ({ type: c.type, id: c.id, name: c.name })),
        behaviorHints: { configurable: false, configurationRequired: false },
        // Ownership verification for the stremio-addons.net listing (public by design)
        stremioAddonsConfig: {
            issuer: 'https://stremio-addons.net',
            signature: 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0..NiE-r8L_vZT1gb7z3PVN5g.sSfXf6UHN1JpJVNb4YdmdACrl2Uv4OXCLbmXCqn4IgAvhhdB1_q8b8B2FwItVSUuUZ1myW6fEsP3nFhU84aDB_nkhJPu_DHpvXFty-uGvKYQ6fZjmB0piPivvB9Qcskj.LvoAOpU1a8j0IDXnN4mjrg'
        }
    };
    if (process.env.ADDON_BASE_URL && hasLogo) manifest.logo = process.env.ADDON_BASE_URL.replace(/\/$/, '') + '/addon/logo.png';
    fs.writeFileSync(path.join(addonDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    const results = {};
    // 1. Time-sensitive rows first, while there's plenty of fetch budget
    results['ns-onnow'] = await buildOnNow();
    // 2. Movies (a few requests, cached for ~a day)
    results['ns-movienight'] = await buildMovieNight();
    results['ns-holidaymovies'] = await buildHolidayMovies();
    // 3. Spend what's left of the budget refreshing episode data for the holiday row
    await warmCache(allSeries().map(x => x.s));
    for (const c of CATALOGS) {
        const metas = results[c.id] || await c.build();
        fs.writeFileSync(path.join(addonDir, 'catalog', c.type, `${c.id}.json`), JSON.stringify({ metas }));
        console.log(`  ${c.name.padEnd(24)} ${c.type.padEnd(6)} ${String(metas.length).padStart(3)} items`);
    }
    saveCache();
    const { h, upcoming } = holidayNow();
    console.log(`Built Now Showing addon v${VERSION} → ${addonDir}  (time zone ${TZ}, holiday: ${h.name}${upcoming ? ' (upcoming)' : ''}, ${OFFLINE ? 'offline' : 'online'}, ${Math.round((Date.now() - runStart) / 1000)}s)`);
})().catch(e => { console.error(e); process.exit(1); });
