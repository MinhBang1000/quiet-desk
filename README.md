# Quiet Desk

A calm, single-user focus timer + task planner + calendar + progress dashboard + shareable
portfolio + personal life tracker (people, things) — self-hosted, local-first, and built to run
quietly in the background on your own machine instead of a browser tab you have to remember to
keep open.

## Why

Most focus-timer / task-tracker apps are either a SaaS product (your data lives on someone else's
server, behind a login, often with a subscription) or a browser tab that resets the moment you close
it. Quiet Desk exists to be neither: a small Express + SQLite server you run yourself, that a React
app talks to over a local API. Nothing leaves your machine, there's no account system beyond a single
PIN, and the data — every task, every completed focus session, every person and thing you track — is
yours in one SQLite file you can back up, inspect, or move to another machine whenever you want.

It's built for one person who wants:
- a timer that survives tab-switching and laptop sleep without losing track of time,
- a task list that isn't just "todos for today" but something you can actually plan ahead in,
- honest stats — a Progress dashboard built entirely from real completed sessions, not sample data,
- a lightweight way to remember useful things about people and physical objects in daily life,
  without turning into a CRM or an inventory spreadsheet,
- and, once in a while, a reason to show someone what that focus record — or that CV — looks like.

## What it supports

- **Focus timer** — Pomodoro-style focus/break cycles with configurable lengths, auto-starting
  breaks, a session counter, and break-idea prompts. Anchored to a wall-clock end time, so it
  self-corrects instead of drifting if the tab is backgrounded or throttled.
- **Tasks with custom tags** — add, edit, complete, and remove tasks; tags are fully yours to add,
  rename, recolor, or delete from Settings — nothing is hardcoded.
- **Planning ahead** — tasks can be due today or scheduled for any future date via the date picker
  on the add-task row, or by clicking a day directly on the Calendar view.
- **Reminders** — an opt-in browser notification fires for tasks due today that aren't done yet
  (checked every minute while the app tab is open — there's no push/email backend, so it only works
  while the tab is open, by design, given this is a local-only tool).
- **Calendar** — a month view of due tasks and daily focus-minute heat, click any day to plan a task
  for it.
- **Progress dashboard** — streaks, a 14-day bar chart, a done-vs-planned view, a "where the hours
  went" tag breakdown, and a year-long focus heatmap — all computed client-side from your real
  session log.
- **People** — a personal directory, not a sales CRM: contact info, birthdays, how you met, likes/
  dislikes/gift ideas, custom categories (Friend, Family, Labmate, …), favorites, and an automatic
  "lent to them" list pulled from Things.
- **Things** — a physical inventory that answers "where is it?": a self-defined location hierarchy
  (e.g. *Taiwan › Apartment › Desk › Drawer 2*), items that can sit inside other items (a backpack
  contains a charger), lending tracked against a person, warranty dates, and related-item links
  (a laptop's charger, hub, sleeve). Search resolves an item's full location immediately.
- **Portfolio** — an editable profile with flexible sections (Education, Experience, Publications,
  Awards, or whatever CV-style blocks you want — add/remove/reorder freely), an avatar with a
  drag-and-zoom crop tool, a photo gallery, and an auto-computed "focus record" (hours logged,
  streak, active days) pulled from your real session data. Has its own theme, independent of the
  app's theme, and publishes at a single unguessable link (`/p/<token>`) you can hand to someone
  without giving them PIN access to the rest of the app. Regenerate the link any time to revoke it.
- **22 themes** — from a plain "Night desk"/"Paper & ink" pair to movie- and superhero-inspired
  palettes, swapped as CSS custom properties and persisted to settings.
- **PIN auth** — a single scrypt-hashed PIN protects the whole app (rate-limited login), since this
  is meant to be reachable on your local network / WSL, not the open internet.
- **Backup** — `GET /api/export` returns a full JSON backup of everything below; `POST /api/import`
  restores from one.

## How to use it

Open the app, set a PIN the first time (6+ characters — this is what unlocks the app on this
device from now on), and you land on **Focus**.

### Focus

Pick a task from the **Today** queue on the right (or just start the timer with nothing picked),
hit **Start focus**, and work until it rings — or hit Space to start/pause from anywhere on the
page. When a focus period ends it logs a completed session (this is the only thing Progress and
your Portfolio's focus record are built from) and rolls into a break, which can auto-start or wait
for you depending on Settings. Adjust focus/break lengths from Settings → Focus timer.

### Today

This is your task list. Type into the add-task row and hit Enter or **Add** — type `#study` or
`#writing` inline to tag it as you type, or use the tag picker. Pick a due date with the date field
next to the input; leave it alone and it defaults to today. Tasks are grouped into **Now**, **Coming
up**, and **Done**; click a task's title to edit it in place, click the checkbox to complete it.

### Calendar

A month view of what's due and how much you focused each day (the strip along the bottom of each
cell is a focus-minutes heat indicator). Click any day to jump to **Today** with that date already
selected in the add-task row — the fastest way to plan something for next Tuesday.

### Progress

Read-only — streaks, a 14-day bar chart, a 7-day done-vs-planned view, a breakdown of where your
hours went by tag, and a year-long heatmap. Everything here is computed from real completed focus
sessions, so it's empty until you've actually run some timers.

### People

Go to **People** (under Life in the sidebar). Click **+ Add person**, type a name, save — that's the
whole minimum flow ("create first, enrich later"). Come back later and click their row to fill in
contact info, categories (multi-select chips — manage the category list itself from Settings), a
birthday, how you met, likes/dislikes/gift ideas, whatever's useful. Use the filter chips (Favorites,
Birthdays, Recently contacted, or any category) to narrow the list, or just search. If you've lent
someone a Thing, it shows up automatically on their detail page — no extra linking needed.

### Things

Go to **Things**. Click **+ Add thing**, name it, save. To make it findable later, open it and set
either a **physical location** (the location picker lets you drill down a breadcrumb — Taiwan ›
Apartment › Desk — and add a new level inline with "+ Add location here" the moment you realize you
need one) or mark it **inside another thing** (pick an existing item as its container — e.g. put
"Charger" inside "Backpack"). The sidebar list groups everything by resolved location when you're
not filtering, so it doubles as a location browser. Set **Status** to `Lent`/`Borrowed` to attach a
person and dates; use the filter chips (Lent, Borrowed, Wishlist, Lost, Warranty expiring) to find
things fast. Search by name, brand, model, or serial number — searching "HDMI adapter" shows you
exactly where it is without opening anything.

### Portfolio

Go to **Portfolio**. Fill in your name, headline, and bio; upload an avatar (drag to reposition,
scroll or use the slider to zoom before confirming — what you see in the crop circle is exactly
what gets saved); add a few gallery photos if you want. Build out **Sections** to match your own
CV or profile — click **+ Add section**, give it a title ("Education," "Projects," whatever), and
**+ Add entry** for each item inside it (heading, subheading, dates, bullet points, an optional
link). Reorder or remove sections freely. Pick a **Theme** for the public page (separate from
whatever theme you're using while editing). When it's ready, flip **Make my portfolio public** on,
hit **Copy link**, and send it — anyone with the link sees a read-only page with no PIN prompt, your
profile, and your live focus stats. **Regenerate** the link any time to kill the old one.

### Settings

Everything configuration-shaped lives here now (under Personal): focus/break timer lengths, the
reminders opt-in, your app theme, task tags, and the category lists for People and Things. Each
category list works the same way — click a color dot to recolor it, click the name to rename it,
`×` to delete it (anything using a deleted category falls back to another one in the same list
rather than losing the tag entirely).

## Structure

- `app/` — Vite + React + TypeScript frontend. Views: Focus, Today, Calendar, Progress, People,
  Things, Portfolio, Settings.
- `server/` — Express API backed by a SQLite database (`server/quietdesk.db`), the permanent store
  for tasks, tags, sessions, settings, portfolio, people, things, locations, categories, and the
  links between them.

## Run it (development)

```bash
npm run dev
```

This starts the API on `http://localhost:4001` and the app on `http://localhost:5173` (which proxies
`/api/*` to the server). Open the app URL in a browser.

Or run them separately:

```bash
npm run dev --prefix server   # API on :4001
npm run dev --prefix app      # Vite dev server on :5173
```

## Running it persistently with PM2 (WSL)

For day-to-day use this isn't meant to be started by hand every time — it runs as one long-lived
process kept alive by [PM2](https://pm2.keymetrics.io/), which is what actually keeps it up on this
WSL machine across terminal closes and reboots.

In production there's no need for the separate Vite dev server: build the frontend once, and
`server/index.js` serves the built `app/dist` directly alongside the API on a single port (see the
static-serve block at the bottom of `server/index.js`).

```bash
# one-time setup
npm install --prefix server
npm run build --prefix app        # produces app/dist, served by the API below

# start under pm2, on the API port (default 4001)
pm2 start server/index.js --name quiet-desk

# persist across reboots
pm2 save
pm2 startup            # run the printed command once to hook pm2 into WSL's init
```

Common pm2 commands while it's running:

```bash
pm2 status                # is it up?
pm2 logs quiet-desk       # tail logs
pm2 restart quiet-desk    # after pulling changes + rebuilding app/dist
pm2 stop quiet-desk
```

After any code change, rebuild the frontend and restart the process:

```bash
npm run build --prefix app && pm2 restart quiet-desk
```

By default the server binds `0.0.0.0:4001` (override with `PORT`/`HOST` env vars), so it's reachable
from Windows via `localhost:4001` through WSL's networking, or from other devices on the LAN.

## Data

Everything you do — tasks, tags, completed focus sessions, settings, your portfolio, and everything
under People/Things (including the categories and locations you define, and the relationships
between records) — is written to `server/quietdesk.db` (SQLite) via the API, so it survives closing
the browser, the laptop, or restarting the server. A single PIN protects the app (set on first run);
nothing leaves your machine except whatever you explicitly choose to share via a portfolio link.

`GET /api/export` returns a full JSON backup; `POST /api/import` restores from one. Handy before
wiping the db file or moving machines.

## Notes

- All derived stats (streaks, heatmap, KPIs, done-vs-planned) are computed client-side from the real
  task/session data — there's no seeded fake history like the design prototype had, so charts start
  empty and fill in as you actually use it.
- The public portfolio endpoint only ever returns session minutes/dates (never task titles or tags)
  plus whatever profile fields you filled in — an invalid or disabled share link 404s the same way
  either way, so a guessed token can't confirm anything exists.
- Themes are CSS custom properties swapped on `:root`; the selection is persisted to settings. The
  portfolio's public-page theme is stored separately, so it doesn't change while you're editing.
- People and Things are deliberately lightweight — a person or thing can be created with just a
  name, and everything else is optional and can be filled in later ("create first, enrich later").
  Places, Assets, and Lists are planned but not yet built.
