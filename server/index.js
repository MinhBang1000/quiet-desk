const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const db = require('./db');
const auth = require('./auth');

const { router: tasksRouter, rowToTask } = require('./routes/tasks');
const { router: tagsRouter } = require('./routes/tags');
const { router: categoriesRouter } = require('./routes/categories');
const { router: peopleRouter, personOut, PERSON_TEXT_FIELDS, personFieldDefault } = require('./routes/people');
const { router: locationsRouter, locationOut } = require('./routes/locations');
const { router: thingsRouter, thingOut } = require('./routes/things');
const { router: linksRouter, linkOut } = require('./routes/links');
const { router: sessionsRouter } = require('./routes/sessions');
const { router: settingsRouter, settingsOut } = require('./routes/settings');
const { router: portfolioRouter, portfolioOut } = require('./routes/portfolio');
const { router: placesRouter, placeOut } = require('./routes/places');
const { router: collectionsRouter, collectionOut } = require('./routes/collections');
const { listsRouter, listItemsRouter, listOut, listItemOut } = require('./routes/lists');
const { assetsRouter, ratesRouter, snapshotsRouter, assetOut } = require('./routes/assets');

const app = express();
app.use(cors({ origin: true, credentials: true }));
// Raised from the 100kb default: portfolio/thing/person photos travel as
// base64 data URLs in the JSON body (resized client-side, but base64 still
// adds ~33% overhead on top of a handful of sub-1MB images).
app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());

const PORT = process.env.PORT || 4001;

// --- auth (public routes) ---

app.get('/api/auth/status', (req, res) => {
  const token = req.cookies ? req.cookies[auth.SESSION_COOKIE] : null;
  res.json({
    hasPin: auth.hasPin(),
    authenticated: auth.hasPin() ? auth.isValidSession(token) : false,
  });
});

app.post('/api/auth/setup', (req, res) => {
  if (auth.hasPin()) {
    return res.status(409).json({ error: 'PIN already set' });
  }
  const { pin } = req.body || {};
  if (typeof pin !== 'string' || pin.length < auth.MIN_PIN_LENGTH) {
    return res.status(400).json({ error: `PIN must be at least ${auth.MIN_PIN_LENGTH} characters` });
  }
  auth.setPin(pin);
  const token = auth.createSession();
  auth.setSessionCookie(res, token);
  res.status(201).json({ ok: true });
});

app.post('/api/auth/login', (req, res) => {
  const ip = req.ip;
  const limit = auth.checkRateLimit(ip);
  if (limit.blocked) {
    return res.status(429).json({ error: 'Too many attempts', retryAfterMs: limit.retryAfterMs });
  }
  const { pin } = req.body || {};
  if (typeof pin !== 'string' || !auth.verifyPin(pin)) {
    auth.recordFailedAttempt(ip);
    return res.status(401).json({ error: 'Incorrect PIN' });
  }
  auth.clearAttempts(ip);
  const token = auth.createSession();
  auth.setSessionCookie(res, token);
  res.json({ ok: true });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.cookies ? req.cookies[auth.SESSION_COOKIE] : null;
  auth.destroySession(token);
  auth.clearSessionCookie(res);
  res.json({ ok: true });
});

// --- public portfolio (no auth — this is the whole point) ---

app.get('/api/public/portfolio/:token', (req, res) => {
  const row = db.prepare('SELECT * FROM portfolio WHERE shareToken = ?').get(req.params.token);
  if (!row || !row.shareEnabled) return res.status(404).json({ error: 'not found' });
  const sessions = db.prepare('SELECT startedAt, minutes FROM sessions').all();
  res.json({
    displayName: row.displayName,
    headline: row.headline,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    gallery: JSON.parse(row.gallery),
    links: JSON.parse(row.links),
    sections: JSON.parse(row.sections),
    theme: row.theme,
    sessions,
  });
});

// Everything else under /api requires a valid session.
app.use('/api', auth.requireAuth);

app.use('/api/tasks', tasksRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/people', peopleRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/things', thingsRouter);
app.use('/api/links', linksRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/places', placesRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/lists', listsRouter);
app.use('/api/list-items', listItemsRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/exchange-rates', ratesRouter);
app.use('/api/asset-snapshots', snapshotsRouter);

// --- export / import (full backup — touches every table, stays central) ---

app.get('/api/export', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks').all().map(rowToTask);
  const sessions = db.prepare('SELECT * FROM sessions').all();
  const settings = settingsOut(db.prepare('SELECT * FROM settings WHERE id = 1').get());
  const tags = db.prepare('SELECT * FROM tags ORDER BY id ASC').all();
  const portfolio = portfolioOut(db.prepare('SELECT * FROM portfolio WHERE id = 1').get());
  const categories = db.prepare('SELECT * FROM categories ORDER BY id ASC').all();
  const people = db.prepare('SELECT * FROM people ORDER BY fullName ASC').all().map(personOut);
  const personCategories = db.prepare('SELECT * FROM person_categories').all();
  const locations = db.prepare('SELECT * FROM locations ORDER BY name ASC').all().map(locationOut);
  const things = db.prepare('SELECT * FROM things ORDER BY name ASC').all().map(thingOut);
  const links = db.prepare('SELECT * FROM links').all().map(linkOut);
  const places = db.prepare('SELECT * FROM places ORDER BY name ASC').all().map(placeOut);
  const placeTags = db.prepare('SELECT * FROM place_tags').all();
  const collections = db.prepare('SELECT * FROM collections ORDER BY name ASC').all().map(collectionOut);
  const lists = db.prepare('SELECT * FROM lists ORDER BY createdAt ASC').all().map(listOut);
  const listItems = db.prepare('SELECT * FROM list_items ORDER BY position ASC').all().map(listItemOut);
  const assets = db.prepare('SELECT * FROM assets ORDER BY name ASC').all().map(assetOut);
  const exchangeRates = db.prepare('SELECT * FROM exchange_rates').all();
  const assetSnapshots = db
    .prepare('SELECT * FROM asset_snapshots ORDER BY takenAt ASC')
    .all()
    .map((r) => ({ ...r, breakdown: JSON.parse(r.breakdown) }));
  res.json({
    tasks, sessions, settings, tags, portfolio, categories, people, personCategories, locations, things, links,
    places, placeTags, collections, lists, listItems, assets, exchangeRates, assetSnapshots,
    exportedAt: new Date().toISOString(),
  });
});

app.post('/api/import', (req, res) => {
  const {
    tasks, sessions, settings, tags, portfolio, categories, people, personCategories, locations, things, links,
    places, placeTags, collections, lists, listItems, assets, exchangeRates, assetSnapshots,
  } = req.body || {};
  const importTx = db.transaction(() => {
    if (Array.isArray(tags)) {
      db.prepare('DELETE FROM tags').run();
      const insert = db.prepare('INSERT INTO tags (id, name, colorIndex, createdAt) VALUES (?, ?, ?, ?)');
      for (const t of tags) {
        insert.run(t.id, t.name, t.colorIndex ?? 0, t.createdAt || new Date().toISOString());
      }
    }
    if (Array.isArray(categories)) {
      db.prepare('DELETE FROM categories').run();
      const insert = db.prepare('INSERT INTO categories (id, module, name, colorIndex, createdAt) VALUES (?, ?, ?, ?, ?)');
      for (const c of categories) {
        insert.run(c.id, c.module, c.name, c.colorIndex ?? 0, c.createdAt || new Date().toISOString());
      }
    }
    if (Array.isArray(people)) {
      db.prepare('DELETE FROM people').run();
      const cols = ['id', ...PERSON_TEXT_FIELDS, 'favorite', 'createdAt'];
      const insert = db.prepare(`INSERT INTO people (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`);
      for (const p of people) {
        insert.run(
          p.id || crypto.randomUUID(),
          ...PERSON_TEXT_FIELDS.map((f) => personFieldDefault(f, p[f])),
          p.favorite ? 1 : 0,
          p.createdAt || new Date().toISOString()
        );
      }
    }
    if (Array.isArray(personCategories)) {
      db.prepare('DELETE FROM person_categories').run();
      const insert = db.prepare('INSERT OR IGNORE INTO person_categories (personId, categoryId) VALUES (?, ?)');
      for (const pc of personCategories) insert.run(pc.personId, pc.categoryId);
    }
    if (Array.isArray(locations)) {
      db.prepare('DELETE FROM locations').run();
      const insert = db.prepare('INSERT INTO locations (id, parentId, name, createdAt) VALUES (?, ?, ?, ?)');
      for (const l of locations) {
        insert.run(l.id, l.parentId || null, l.name, l.createdAt || new Date().toISOString());
      }
    }
    if (Array.isArray(things)) {
      db.prepare('DELETE FROM things').run();
      const insert = db.prepare(
        `INSERT INTO things (id, name, photoUrl, categoryId, brand, model, serialNumber, quantity, notes,
          purchaseDate, purchaseLocation, purchasePrice, currency, warrantyExpires, attachments, status,
          locationId, containerId, loanPersonId, loanSince, loanDue, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const t of things) {
        insert.run(
          t.id || crypto.randomUUID(), t.name, t.photoUrl || '', t.categoryId ?? null, t.brand || '',
          t.model || '', t.serialNumber || '', Number.isInteger(t.quantity) ? t.quantity : 1, t.notes || '',
          t.purchaseDate || null, t.purchaseLocation || '', typeof t.purchasePrice === 'number' ? t.purchasePrice : null,
          t.currency || 'TWD', t.warrantyExpires || null, JSON.stringify(t.attachments || []), t.status || 'owned',
          t.locationId || null, t.containerId || null, t.loanPersonId || null, t.loanSince || null,
          t.loanDue || null, t.createdAt || new Date().toISOString()
        );
      }
    }
    if (Array.isArray(links)) {
      db.prepare('DELETE FROM links').run();
      const insert = db.prepare(
        'INSERT INTO links (id, fromType, fromId, toType, toId, relation, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );
      for (const l of links) {
        insert.run(
          l.id || crypto.randomUUID(), l.fromType, l.fromId, l.toType, l.toId,
          l.relation || 'related', l.note || '', l.createdAt || new Date().toISOString()
        );
      }
    }
    if (Array.isArray(places)) {
      db.prepare('DELETE FROM places').run();
      const insert = db.prepare(
        `INSERT INTO places (id, name, categoryId, address, mapLink, phone, website, openingHours, rating,
          visited, wantToVisit, favorite, notes, lastVisitedDate, visitCount, city, country, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const p of places) {
        insert.run(
          p.id || crypto.randomUUID(), p.name, p.categoryId ?? null, p.address || '', p.mapLink || '',
          p.phone || '', p.website || '', p.openingHours || '', Number.isInteger(p.rating) ? p.rating : null,
          p.visited ? 1 : 0, p.wantToVisit ? 1 : 0, p.favorite ? 1 : 0, p.notes || '', p.lastVisitedDate || null,
          Number.isInteger(p.visitCount) ? p.visitCount : 0, p.city || '', p.country || '',
          p.createdAt || new Date().toISOString()
        );
      }
    }
    if (Array.isArray(placeTags)) {
      db.prepare('DELETE FROM place_tags').run();
      const insert = db.prepare('INSERT OR IGNORE INTO place_tags (placeId, categoryId) VALUES (?, ?)');
      for (const pt of placeTags) insert.run(pt.placeId, pt.categoryId);
    }
    if (Array.isArray(collections)) {
      db.prepare('DELETE FROM collection_places').run();
      db.prepare('DELETE FROM collections').run();
      const insertC = db.prepare('INSERT INTO collections (id, name, createdAt) VALUES (?, ?, ?)');
      const insertCP = db.prepare('INSERT OR IGNORE INTO collection_places (collectionId, placeId) VALUES (?, ?)');
      for (const c of collections) {
        insertC.run(c.id || crypto.randomUUID(), c.name, c.createdAt || new Date().toISOString());
        for (const placeId of c.placeIds || []) insertCP.run(c.id, placeId);
      }
    }
    if (Array.isArray(lists)) {
      db.prepare('DELETE FROM lists').run();
      const insert = db.prepare('INSERT INTO lists (id, name, style, favorite, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
      for (const l of lists) {
        insert.run(l.id || crypto.randomUUID(), l.name, l.style || 'simple', l.favorite ? 1 : 0, l.notes || '', l.createdAt || new Date().toISOString());
      }
    }
    if (Array.isArray(listItems)) {
      db.prepare('DELETE FROM list_items').run();
      const insert = db.prepare(
        `INSERT INTO list_items (id, listId, text, description, completed, position, notes, date, linkType, linkId,
          convertedToType, convertedToId, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const i of listItems) {
        insert.run(
          i.id || crypto.randomUUID(), i.listId, i.text, i.description || '', i.completed ? 1 : 0, i.position ?? 0,
          i.notes || '', i.date || null, i.linkType || null, i.linkId || null, i.convertedToType || null,
          i.convertedToId || null, i.createdAt || new Date().toISOString()
        );
      }
    }
    if (Array.isArray(assets)) {
      db.prepare('DELETE FROM assets').run();
      const insert = db.prepare(
        `INSERT INTO assets (id, name, category, currency, estimatedValue, counterpartyPersonId, details, notes, lastUpdated, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const a of assets) {
        const now = new Date().toISOString();
        insert.run(
          a.id || crypto.randomUUID(), a.name, a.category, a.currency || 'TWD',
          typeof a.estimatedValue === 'number' ? a.estimatedValue : 0, a.counterpartyPersonId || null,
          JSON.stringify(a.details || {}), a.notes || '', a.lastUpdated || now, a.createdAt || now
        );
      }
    }
    if (Array.isArray(exchangeRates)) {
      db.prepare('DELETE FROM exchange_rates').run();
      const insert = db.prepare('INSERT INTO exchange_rates (currency, rateToBase, updatedAt) VALUES (?, ?, ?)');
      for (const r of exchangeRates) {
        insert.run(r.currency, r.rateToBase, r.updatedAt || new Date().toISOString());
      }
    }
    if (Array.isArray(assetSnapshots)) {
      db.prepare('DELETE FROM asset_snapshots').run();
      const insert = db.prepare(
        'INSERT INTO asset_snapshots (id, takenAt, totalBaseCurrency, baseCurrency, breakdown) VALUES (?, ?, ?, ?, ?)'
      );
      for (const s of assetSnapshots) {
        insert.run(s.id || crypto.randomUUID(), s.takenAt, s.totalBaseCurrency, s.baseCurrency, JSON.stringify(s.breakdown || {}));
      }
    }
    if (Array.isArray(tasks)) {
      db.prepare('DELETE FROM tasks').run();
      const insert = db.prepare(
        'INSERT INTO tasks (id, title, tag, due, done, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
      );
      for (const t of tasks) {
        insert.run(t.id || crypto.randomUUID(), t.title, t.tag, t.due, t.done ? 1 : 0, t.createdAt || new Date().toISOString());
      }
    }
    if (Array.isArray(sessions)) {
      db.prepare('DELETE FROM sessions').run();
      const insert = db.prepare(
        'INSERT INTO sessions (id, startedAt, minutes, taskId, tag) VALUES (?, ?, ?, ?, ?)'
      );
      for (const s of sessions) {
        insert.run(s.id || crypto.randomUUID(), s.startedAt, s.minutes, s.taskId || null, s.tag || null);
      }
    }
    if (settings) {
      db.prepare(
        'UPDATE settings SET focusMinutes = ?, breakMinutes = ?, autoStartBreak = ?, goalMinutes = ?, theme = ?, baseCurrency = ? WHERE id = 1'
      ).run(
        settings.focusMinutes ?? 25,
        settings.breakMinutes ?? 5,
        settings.autoStartBreak ? 1 : 0,
        settings.goalMinutes ?? 120,
        settings.theme ?? 'night',
        settings.baseCurrency ?? 'TWD'
      );
    }
    if (portfolio) {
      db.prepare(
        'UPDATE portfolio SET displayName = ?, headline = ?, bio = ?, avatarUrl = ?, gallery = ?, links = ?, sections = ?, theme = ?, shareToken = ?, shareEnabled = ? WHERE id = 1'
      ).run(
        portfolio.displayName ?? '',
        portfolio.headline ?? '',
        portfolio.bio ?? '',
        portfolio.avatarUrl ?? '',
        JSON.stringify(portfolio.gallery ?? []),
        JSON.stringify(portfolio.links ?? []),
        JSON.stringify(portfolio.sections ?? []),
        portfolio.theme || 'night',
        portfolio.shareToken || crypto.randomBytes(16).toString('hex'),
        portfolio.shareEnabled ? 1 : 0
      );
    }
  });
  importTx();
  res.json({ ok: true });
});

// --- serve the built frontend, if present ---
// Running `vite dev` publicly is not safe (HMR websocket, source access);
// a real public port should serve the production build (`npm run build`
// in app/) from here instead. In local dev, keep using the Vite dev
// server on :5173 and ignore this.
const distDir = path.join(__dirname, '../app/dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      res.sendFile(path.join(distDir, 'index.html'));
    } else {
      next();
    }
  });
}

const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Quiet Desk API listening on http://${HOST}:${PORT}`);
});
