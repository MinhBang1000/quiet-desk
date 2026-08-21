# Quiet Desk

A calm, single-user focus timer + task planner + calendar + progress dashboard + shareable
portfolio — self-hosted, local-first, and built to run quietly in the background on your own
machine instead of a browser tab you have to remember to keep open.

## Why

Most focus-timer / task-tracker apps are either a SaaS product (your data lives on someone else's
server, behind a login, often with a subscription) or a browser tab that resets the moment you close
it. Quiet Desk exists to be neither: a small Express + SQLite server you run yourself, that a React
app talks to over a local API. Nothing leaves your machine, there's no account system beyond a single
PIN, and the data — every task, every completed focus session — is yours in one SQLite file you can
back up, inspect, or move to another machine whenever you want.

It's built for one person, doing focused work, who wants:
- a timer that survives tab-switching and laptop sleep without losing track of time,
- a task list that isn't just "todos for today" but something you can actually plan ahead in,
- honest stats — a Progress dashboard built entirely from real completed sessions, not sample data,
- and, once in a while, a reason to show someone what that focus record looks like.

## What it supports

- **Focus timer** — Pomodoro-style focus/break cycles with configurable lengths, auto-starting
  breaks, a session counter, and break-idea prompts. Anchored to a wall-clock end time, so it
  self-corrects instead of drifting if the tab is backgrounded or throttled.
- **Tasks with custom tags** — add, edit, complete, and remove tasks; tags (`Deep work`, `Study`,
  `Writing`, `Admin` out of the box) are fully yours to add, rename, recolor, or delete from the
  sidebar — nothing is hardcoded.
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
- **Portfolio** — an editable profile (name, headline, bio, links, projects) plus an auto-computed
  "focus record" (hours logged, streak, active days) pulled from your real session data, publishable
  at a single unguessable link (`/p/<token>`) you can hand to someone without giving them PIN access
  to the rest of the app. Regenerate the link any time to revoke it.
- **22 themes** — from a plain "Night desk"/"Paper & ink" pair to movie- and superhero-inspired
  palettes, swapped as CSS custom properties and persisted to settings.
- **PIN auth** — a single scrypt-hashed PIN protects the whole app (rate-limited login), since this
  is meant to be reachable on your local network / WSL, not the open internet.
- **Backup** — `GET /api/export` returns a full JSON backup (tasks, sessions, settings, tags,
  portfolio); `POST /api/import` restores from one.

## Structure

- `app/` — Vite + React + TypeScript frontend (Focus, Today, Calendar, Progress, Portfolio views).
- `server/` — Express API backed by a SQLite database (`server/quietdesk.db`), the permanent store
  for tasks, tags, finished focus sessions, settings, and the portfolio.

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

Everything you do — tasks, tags, completed focus sessions, settings (timer lengths, goal, theme),
and your portfolio — is written to `server/quietdesk.db` (SQLite) via the API, so it survives
closing the browser, the laptop, or restarting the server. A single PIN protects the app (set on
first run); nothing leaves your machine except whatever you explicitly choose to share via a
portfolio link.

`GET /api/export` returns a full JSON backup; `POST /api/import` restores from one. Handy before
wiping the db file or moving machines.

## Notes

- All derived stats (streaks, heatmap, KPIs, done-vs-planned) are computed client-side from the real
  task/session data — there's no seeded fake history like the design prototype had, so charts start
  empty and fill in as you actually use it.
- The public portfolio endpoint only ever returns session minutes/dates (never task titles or tags)
  plus whatever profile fields you filled in — an invalid or disabled share link 404s the same way
  either way, so a guessed token can't confirm anything exists.
- Themes are CSS custom properties swapped on `:root`; the selection is persisted to settings.
