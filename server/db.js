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

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module TEXT NOT NULL,
    name TEXT NOT NULL,
    colorIndex INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    UNIQUE(module, name)
  );

  CREATE TABLE IF NOT EXISTS people (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    nickname TEXT NOT NULL DEFAULT '',
    photoUrl TEXT NOT NULL DEFAULT '',
    relationship TEXT NOT NULL DEFAULT '',
    organization TEXT NOT NULL DEFAULT '',
    position TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    otherContact TEXT NOT NULL DEFAULT '',
    website TEXT NOT NULL DEFAULT '',
    birthday TEXT,
    city TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    interests TEXT NOT NULL DEFAULT '',
    likes TEXT NOT NULL DEFAULT '',
    dislikes TEXT NOT NULL DEFAULT '',
    foodPreferences TEXT NOT NULL DEFAULT '',
    giftIdeas TEXT NOT NULL DEFAULT '',
    howWeMet TEXT NOT NULL DEFAULT '',
    firstMetDate TEXT,
    lastContactedDate TEXT,
    favorite INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS person_categories (
    personId TEXT NOT NULL,
    categoryId INTEGER NOT NULL,
    PRIMARY KEY (personId, categoryId)
  );

  CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    parentId TEXT,
    name TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS things (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    photoUrl TEXT NOT NULL DEFAULT '',
    categoryId INTEGER,
    brand TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT '',
    serialNumber TEXT NOT NULL DEFAULT '',
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT NOT NULL DEFAULT '',
    purchaseDate TEXT,
    purchaseLocation TEXT NOT NULL DEFAULT '',
    purchasePrice REAL,
    currency TEXT NOT NULL DEFAULT 'TWD',
    warrantyExpires TEXT,
    attachments TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'owned',
    locationId TEXT,
    containerId TEXT,
    loanPersonId TEXT,
    loanSince TEXT,
    loanDue TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    fromType TEXT NOT NULL,
    fromId TEXT NOT NULL,
    toType TEXT NOT NULL,
    toId TEXT NOT NULL,
    relation TEXT NOT NULL DEFAULT 'related',
    note TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_links_from ON links(fromType, fromId);
  CREATE INDEX IF NOT EXISTS idx_links_to ON links(toType, toId);

  CREATE TABLE IF NOT EXISTS places (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    categoryId INTEGER,
    address TEXT NOT NULL DEFAULT '',
    mapLink TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    website TEXT NOT NULL DEFAULT '',
    openingHours TEXT NOT NULL DEFAULT '',
    rating INTEGER,
    visited INTEGER NOT NULL DEFAULT 0,
    wantToVisit INTEGER NOT NULL DEFAULT 0,
    favorite INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    lastVisitedDate TEXT,
    visitCount INTEGER NOT NULL DEFAULT 0,
    city TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS place_tags (
    placeId TEXT NOT NULL,
    categoryId INTEGER NOT NULL,
    PRIMARY KEY (placeId, categoryId)
  );

  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS collection_places (
    collectionId TEXT NOT NULL,
    placeId TEXT NOT NULL,
    PRIMARY KEY (collectionId, placeId)
  );

  CREATE TABLE IF NOT EXISTS lists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    style TEXT NOT NULL DEFAULT 'simple',
    favorite INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS list_items (
    id TEXT PRIMARY KEY,
    listId TEXT NOT NULL,
    text TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    completed INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    date TEXT,
    linkType TEXT,
    linkId TEXT,
    convertedToType TEXT,
    convertedToId TEXT,
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_list_items_listId ON list_items(listId);

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TWD',
    estimatedValue REAL NOT NULL DEFAULT 0,
    counterpartyPersonId TEXT,
    details TEXT NOT NULL DEFAULT '{}',
    notes TEXT NOT NULL DEFAULT '',
    lastUpdated TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exchange_rates (
    currency TEXT PRIMARY KEY,
    rateToBase REAL NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS asset_snapshots (
    id TEXT PRIMARY KEY,
    takenAt TEXT NOT NULL,
    totalBaseCurrency REAL NOT NULL,
    baseCurrency TEXT NOT NULL,
    breakdown TEXT NOT NULL DEFAULT '{}'
  );
`);

const settingsColumns = db.prepare('PRAGMA table_info(settings)').all().map((c) => c.name);
if (!settingsColumns.includes('baseCurrency')) {
  db.exec("ALTER TABLE settings ADD COLUMN baseCurrency TEXT NOT NULL DEFAULT 'TWD'");
}

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
