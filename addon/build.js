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
 *   addon/catalog/series/<id>.json    one file per catalog
 *   addon/logo.png                    (copied if present)
 *
 * Env:
 *   ADDON_TZ   time zone for the TV schedule (default America/Chicago)
 *   ADDON_NOW  override "now" (ms or ISO date) — for testing
 *
 * Needs Node 18+ (built-in fetch). --offline skips TVmaze lookups (no episode titles in "On Now").
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
const VERSION = '1.0.0';

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

// ---------- Episodes (TVmaze) ----------
async function getJSON(url, tries = 3) {
    for (let i = 0; i < tries; i++) {
        const r = await fetch(url, { headers: { 'User-Agent': 'NowShowing-Addon-Builder' } });
        if (r.status === 429) { await new Promise(res => setTimeout(res, 2500)); continue; }
        if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
        return r.json();
    }
    throw new Error(`Rate-limited: ${url}`);
}
const epCache = new Map();
async function episodesFor(show) {
    const k = imdbOf(show);
    if (epCache.has(k)) return epCache.get(k);
    let eps = [];
    try {
        const known = byImdb.get(k) || (show.id && typeof show.id === 'number' ? show : null);
        const parts = known
            ? (known.sub_shows || [{ id: known.id, seasons: known.seasons }])
            : [{ id: (await getJSON(`https://api.tvmaze.com/lookup/shows?imdb=${k}`)).id, seasons: null }];
        for (const p of parts) {
            const list = await getJSON(`https://api.tvmaze.com/shows/${p.id}/episodes`);
            const today = new Date(NOW).toISOString().slice(0, 10);
            eps.push(...list.filter(e => e.season && e.number && (!e.airdate || e.airdate <= today) && (!p.seasons || p.seasons.includes(e.season))));
        }
    } catch (e) { console.warn(`  ! no episodes for ${show.name}: ${e.message}`); }
    epCache.set(k, eps);
    return eps;
}
async function episodeFor(slot) {
    if (OFFLINE) return null;
    const eps = await episodesFor(slot.show);
    if (!eps.length) return null;
    return eps[Math.floor(seeded(hashStr(slot.key))() * eps.length)];
}
const epLabel = e => e ? `S${e.season}E${e.number} “${e.name}”` : '';

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

function buildRandom() {
    const pool = new Map();
    const add = (s, from) => { const k = imdbOf(s); if (k && !s.movie && !pool.has(k)) pool.set(k, { s, from }); };
    SHOWS.forEach(s => add(s, 'Now Showing picks'));
    NYT.forEach(s => add(s, `NYT #${s.rank}`));
    RT.forEach(s => add(s, `RT Comedy #${s.rank}`));
    BBC.forEach(s => add(s, `BBC #${s.rank}`));
    const all = [...pool.values()];
    const r = seeded(hashStr('random|' + dayKey(broadcastStart(NOW))));
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    return all.slice(0, 40).map(({ s, from }) => preview(s, { description: `🎲 Today's random pick (${from}). New picks every morning at 6.` }));
}

function buildPicks() {
    return SHOWS.filter(imdbOf).slice().sort((a, b) => a.name.localeCompare(b.name))
        .map(s => preview(s, { genres: [s.category], description: `From the Now Showing starter lineup (${s.category}).` }));
}

const CATALOGS = [
    { id: 'ns-onnow', name: '📺 On Now', build: buildOnNow },
    { id: 'ns-random', name: '🎲 Random Picks', build: buildRandom },
    { id: 'ns-nyt', name: '🗽 NYT Top 100', build: () => buildList(NYT, "the New York Times' 100 Best TV Shows of the 21st Century") },
    { id: 'ns-rt', name: '🍅 RT Comedy Top 100', build: () => buildList(RT, "Rotten Tomatoes' Best Comedy Series of All Time") },
    { id: 'ns-bbc', name: '🇬🇧 BBC Top 100', build: () => buildList(BBC, "BBC Culture's 100 Greatest TV Series of the 21st Century") },
    { id: 'ns-picks', name: '⭐ Now Showing Picks', build: buildPicks }
];

// ---------- Write ----------
(async () => {
    const addonDir = path.join(OUT, 'addon');
    fs.mkdirSync(path.join(addonDir, 'catalog', 'series'), { recursive: true });
    fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(OUT, 'index.html'));
    const logo = path.join(__dirname, 'logo.png');
    const hasLogo = fs.existsSync(logo);
    if (hasLogo) fs.copyFileSync(logo, path.join(addonDir, 'logo.png'));

    const manifest = {
        id: 'community.nowshowing',
        version: VERSION,
        name: 'Now Showing',
        description: 'TV lists and a live TV Guide from the Now Showing episode randomizer: what\'s on now across retro channels, daily random picks, and the NYT, Rotten Tomatoes and BBC top-100 lists.',
        resources: ['catalog'],
        types: ['series'],
        catalogs: CATALOGS.map(c => ({ type: 'series', id: c.id, name: c.name })),
        behaviorHints: { configurable: false, configurationRequired: false },
        // Ownership verification for the stremio-addons.net listing (public by design)
        stremioAddonsConfig: {
            issuer: 'https://stremio-addons.net',
            signature: 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0..NiE-r8L_vZT1gb7z3PVN5g.sSfXf6UHN1JpJVNb4YdmdACrl2Uv4OXCLbmXCqn4IgAvhhdB1_q8b8B2FwItVSUuUZ1myW6fEsP3nFhU84aDB_nkhJPu_DHpvXFty-uGvKYQ6fZjmB0piPivvB9Qcskj.LvoAOpU1a8j0IDXnN4mjrg'
        }
    };
    if (process.env.ADDON_BASE_URL && hasLogo) manifest.logo = process.env.ADDON_BASE_URL.replace(/\/$/, '') + '/addon/logo.png';
    fs.writeFileSync(path.join(addonDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    for (const c of CATALOGS) {
        const metas = await c.build();
        fs.writeFileSync(path.join(addonDir, 'catalog', 'series', `${c.id}.json`), JSON.stringify({ metas }));
        console.log(`  ${c.name.padEnd(22)} ${String(metas.length).padStart(3)} items`);
    }
    console.log(`Built Now Showing addon v${VERSION} → ${addonDir}  (schedule time zone ${TZ}, ${OFFLINE ? 'offline' : 'online'})`);
})().catch(e => { console.error(e); process.exit(1); });
