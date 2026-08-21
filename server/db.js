const path = require('node:path');
const crypto = require('node:crypto');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'quietdesk.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    tag TEXT NOT NULL,
    due TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    startedAt TEXT NOT NULL,
    minutes INTEGER NOT NULL,
    taskId TEXT,
    tag TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    focusMinutes INTEGER NOT NULL DEFAULT 25,
    breakMinutes INTEGER NOT NULL DEFAULT 5,
    autoStartBreak INTEGER NOT NULL DEFAULT 1,
    goalMinutes INTEGER NOT NULL DEFAULT 120,
    theme TEXT NOT NULL DEFAULT 'night'
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    colorIndex INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    displayName TEXT NOT NULL DEFAULT '',
    headline TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    links TEXT NOT NULL DEFAULT '[]',
    projects TEXT NOT NULL DEFAULT '[]',
    shareToken TEXT NOT NULL,
    shareEnabled INTEGER NOT NULL DEFAULT 0
  );
`);

const settingsRow = db.prepare('SELECT * FROM settings WHERE id = 1').get();
if (!settingsRow) {
  db.prepare(
    'INSERT INTO settings (id, focusMinutes, breakMinutes, autoStartBreak, goalMinutes, theme) VALUES (1, 25, 5, 1, 120, ?)'
  ).run('night');
}

const tagCount = db.prepare('SELECT COUNT(*) AS n FROM tags').get().n;
if (tagCount === 0) {
  const insertTag = db.prepare(
    'INSERT INTO tags (name, colorIndex, createdAt) VALUES (?, ?, ?)'
  );
  const now = new Date().toISOString();
  ['Deep work', 'Study', 'Writing', 'Admin'].forEach((name, i) => insertTag.run(name, i, now));
}

// Additive migration: the portfolio table originally shipped with a fixed
// `projects` column. Sections superseded it with a flexible model, so new
// columns are added here via ALTER TABLE rather than touching the CREATE
// TABLE above, which would no-op against an already-existing table.
const portfolioColumns = db.prepare('PRAGMA table_info(portfolio)').all().map((c) => c.name);
if (!portfolioColumns.includes('avatarUrl')) {
  db.exec("ALTER TABLE portfolio ADD COLUMN avatarUrl TEXT NOT NULL DEFAULT ''");
}
if (!portfolioColumns.includes('gallery')) {
  db.exec("ALTER TABLE portfolio ADD COLUMN gallery TEXT NOT NULL DEFAULT '[]'");
}
if (!portfolioColumns.includes('sections')) {
  db.exec("ALTER TABLE portfolio ADD COLUMN sections TEXT NOT NULL DEFAULT '[]'");
}
if (!portfolioColumns.includes('theme')) {
  db.exec("ALTER TABLE portfolio ADD COLUMN theme TEXT NOT NULL DEFAULT 'night'");
}

const portfolioRow = db.prepare('SELECT * FROM portfolio WHERE id = 1').get();
if (!portfolioRow) {
  const shareToken = crypto.randomBytes(16).toString('hex');
  db.prepare('INSERT INTO portfolio (id, shareToken) VALUES (1, ?)').run(shareToken);
}

module.exports = db;
