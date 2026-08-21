const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const db = require('./db');
const auth = require('./auth');

const app = express();
app.use(cors({ origin: true, credentials: true }));
// Raised from the 100kb default: portfolio avatar/gallery images travel as
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

// --- tasks ---

app.get('/api/tasks', (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC').all();
  res.json(rows.map(rowToTask));
});

app.post('/api/tasks', (req, res) => {
  const { title, tag, due, done } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  if (!due || typeof due !== 'string') {
    return res.status(400).json({ error: 'due is required' });
  }
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    'INSERT INTO tasks (id, title, tag, due, done, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, title.trim(), tag || 'Deep work', due, done ? 1 : 0, createdAt);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.status(201).json(rowToTask(row));
});

app.patch('/api/tasks/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const { title, tag, due, done } = req.body || {};
  const next = {
    title: title !== undefined ? title : existing.title,
    tag: tag !== undefined ? tag : existing.tag,
    due: due !== undefined ? due : existing.due,
    done: done !== undefined ? (done ? 1 : 0) : existing.done,
  };
  db.prepare('UPDATE tasks SET title = ?, tag = ?, due = ?, done = ? WHERE id = ?').run(
    next.title, next.tag, next.due, next.done, req.params.id
  );
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(rowToTask(row));
});

app.delete('/api/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// --- tags ---

app.get('/api/tags', (req, res) => {
  const rows = db.prepare('SELECT * FROM tags ORDER BY id ASC').all();
  res.json(rows);
});

app.post('/api/tags', (req, res) => {
  const { name, colorIndex } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const existing = db.prepare('SELECT * FROM tags WHERE name = ?').get(name.trim());
  if (existing) return res.status(409).json({ error: 'a tag with that name already exists' });
  const count = db.prepare('SELECT COUNT(*) AS n FROM tags').get().n;
  const resolvedColorIndex = Number.isInteger(colorIndex) ? colorIndex : count % 4;
  const info = db
    .prepare('INSERT INTO tags (name, colorIndex, createdAt) VALUES (?, ?, ?)')
    .run(name.trim(), resolvedColorIndex, new Date().toISOString());
  const row = db.prepare('SELECT * FROM tags WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

app.patch('/api/tags/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const { name, colorIndex } = req.body || {};
  const nextName = name !== undefined ? String(name).trim() : existing.name;
  if (!nextName) return res.status(400).json({ error: 'name cannot be empty' });
  if (nextName !== existing.name) {
    const dup = db.prepare('SELECT * FROM tags WHERE name = ? AND id != ?').get(nextName, existing.id);
    if (dup) return res.status(409).json({ error: 'a tag with that name already exists' });
  }
  const nextColorIndex = Number.isInteger(colorIndex) ? colorIndex : existing.colorIndex;
  const renameTx = db.transaction(() => {
    if (nextName !== existing.name) {
      db.prepare('UPDATE tasks SET tag = ? WHERE tag = ?').run(nextName, existing.name);
    }
    db.prepare('UPDATE tags SET name = ?, colorIndex = ? WHERE id = ?').run(nextName, nextColorIndex, existing.id);
  });
  renameTx();
  const row = db.prepare('SELECT * FROM tags WHERE id = ?').get(existing.id);
  res.json(row);
});

app.delete('/api/tags/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const total = db.prepare('SELECT COUNT(*) AS n FROM tags').get().n;
  if (total <= 1) return res.status(400).json({ error: 'cannot delete the last tag' });
  const fallback = db.prepare('SELECT * FROM tags WHERE id != ? ORDER BY id ASC LIMIT 1').get(existing.id);
  const deleteTx = db.transaction(() => {
    db.prepare('UPDATE tasks SET tag = ? WHERE tag = ?').run(fallback.name, existing.name);
    db.prepare('DELETE FROM tags WHERE id = ?').run(existing.id);
  });
  deleteTx();
  res.status(204).end();
});

// --- sessions (focus log = source of truth for stats) ---

app.get('/api/sessions', (req, res) => {
  const rows = db.prepare('SELECT * FROM sessions ORDER BY startedAt DESC').all();
  res.json(rows);
});

app.post('/api/sessions', (req, res) => {
  const { startedAt, minutes, taskId, tag } = req.body || {};
  if (!startedAt || !Number.isFinite(minutes)) {
    return res.status(400).json({ error: 'startedAt and minutes are required' });
  }
  const id = crypto.randomUUID();
  db.prepare(
    'INSERT INTO sessions (id, startedAt, minutes, taskId, tag) VALUES (?, ?, ?, ?, ?)'
  ).run(id, startedAt, Math.round(minutes), taskId || null, tag || null);
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  res.status(201).json(row);
});

// --- settings ---

app.get('/api/settings', (req, res) => {
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(settingsOut(row));
});

app.put('/api/settings', (req, res) => {
  const existing = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const { focusMinutes, breakMinutes, autoStartBreak, goalMinutes, theme } = req.body || {};
  const next = {
    focusMinutes: focusMinutes ?? existing.focusMinutes,
    breakMinutes: breakMinutes ?? existing.breakMinutes,
    autoStartBreak: autoStartBreak !== undefined ? (autoStartBreak ? 1 : 0) : existing.autoStartBreak,
    goalMinutes: goalMinutes ?? existing.goalMinutes,
    theme: theme ?? existing.theme,
  };
  db.prepare(
    'UPDATE settings SET focusMinutes = ?, breakMinutes = ?, autoStartBreak = ?, goalMinutes = ?, theme = ? WHERE id = 1'
  ).run(next.focusMinutes, next.breakMinutes, next.autoStartBreak, next.goalMinutes, next.theme);
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(settingsOut(row));
});

// --- portfolio (editable profile; public link is served above, unauthenticated) ---

app.get('/api/portfolio', (req, res) => {
  const row = db.prepare('SELECT * FROM portfolio WHERE id = 1').get();
  res.json(portfolioOut(row));
});

app.put('/api/portfolio', (req, res) => {
  const existing = db.prepare('SELECT * FROM portfolio WHERE id = 1').get();
  const { displayName, headline, bio, avatarUrl, gallery, links, sections, theme, shareEnabled } = req.body || {};
  const next = {
    displayName: displayName !== undefined ? displayName : existing.displayName,
    headline: headline !== undefined ? headline : existing.headline,
    bio: bio !== undefined ? bio : existing.bio,
    avatarUrl: avatarUrl !== undefined ? avatarUrl : existing.avatarUrl,
    gallery: gallery !== undefined ? JSON.stringify(gallery) : existing.gallery,
    links: links !== undefined ? JSON.stringify(links) : existing.links,
    sections: sections !== undefined ? JSON.stringify(sections) : existing.sections,
    theme: theme !== undefined ? theme : existing.theme,
    shareEnabled: shareEnabled !== undefined ? (shareEnabled ? 1 : 0) : existing.shareEnabled,
  };
  db.prepare(
    'UPDATE portfolio SET displayName = ?, headline = ?, bio = ?, avatarUrl = ?, gallery = ?, links = ?, sections = ?, theme = ?, shareEnabled = ? WHERE id = 1'
  ).run(next.displayName, next.headline, next.bio, next.avatarUrl, next.gallery, next.links, next.sections, next.theme, next.shareEnabled);
  const row = db.prepare('SELECT * FROM portfolio WHERE id = 1').get();
  res.json(portfolioOut(row));
});

app.post('/api/portfolio/rotate-token', (req, res) => {
  const shareToken = crypto.randomBytes(16).toString('hex');
  db.prepare('UPDATE portfolio SET shareToken = ? WHERE id = 1').run(shareToken);
  res.json({ shareToken });
});

// --- export / import (full backup) ---

app.get('/api/export', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks').all().map(rowToTask);
  const sessions = db.prepare('SELECT * FROM sessions').all();
  const settings = settingsOut(db.prepare('SELECT * FROM settings WHERE id = 1').get());
  const tags = db.prepare('SELECT * FROM tags ORDER BY id ASC').all();
  const portfolio = portfolioOut(db.prepare('SELECT * FROM portfolio WHERE id = 1').get());
  res.json({ tasks, sessions, settings, tags, portfolio, exportedAt: new Date().toISOString() });
});

app.post('/api/import', (req, res) => {
  const { tasks, sessions, settings, tags, portfolio } = req.body || {};
  const importTx = db.transaction(() => {
    if (Array.isArray(tags)) {
      db.prepare('DELETE FROM tags').run();
      const insert = db.prepare('INSERT INTO tags (id, name, colorIndex, createdAt) VALUES (?, ?, ?, ?)');
      for (const t of tags) {
        insert.run(t.id, t.name, t.colorIndex ?? 0, t.createdAt || new Date().toISOString());
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
        'UPDATE settings SET focusMinutes = ?, breakMinutes = ?, autoStartBreak = ?, goalMinutes = ?, theme = ? WHERE id = 1'
      ).run(
        settings.focusMinutes ?? 25,
        settings.breakMinutes ?? 5,
        settings.autoStartBreak ? 1 : 0,
        settings.goalMinutes ?? 120,
        settings.theme ?? 'night'
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

function rowToTask(row) {
  return { id: row.id, title: row.title, tag: row.tag, due: row.due, done: !!row.done };
}

function settingsOut(row) {
  return {
    focusMinutes: row.focusMinutes,
    breakMinutes: row.breakMinutes,
    autoStartBreak: !!row.autoStartBreak,
    goalMinutes: row.goalMinutes,
    theme: row.theme,
  };
}

function portfolioOut(row) {
  return {
    displayName: row.displayName,
    headline: row.headline,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    gallery: JSON.parse(row.gallery),
    links: JSON.parse(row.links),
    sections: JSON.parse(row.sections),
    theme: row.theme,
    shareEnabled: !!row.shareEnabled,
    shareToken: row.shareToken,
  };
}

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
