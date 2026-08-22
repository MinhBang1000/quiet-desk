const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { module } = req.query;
  const rows = module
    ? db.prepare('SELECT * FROM categories WHERE module = ? ORDER BY id ASC').all(module)
    : db.prepare('SELECT * FROM categories ORDER BY id ASC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { module, name, colorIndex } = req.body || {};
  if (!module || typeof module !== 'string') return res.status(400).json({ error: 'module is required' });
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const existing = db.prepare('SELECT * FROM categories WHERE module = ? AND name = ?').get(module, name.trim());
  if (existing) return res.status(409).json({ error: 'a category with that name already exists' });
  const count = db.prepare('SELECT COUNT(*) AS n FROM categories WHERE module = ?').get(module).n;
  const resolvedColorIndex = Number.isInteger(colorIndex) ? colorIndex : count % 4;
  const info = db
    .prepare('INSERT INTO categories (module, name, colorIndex, createdAt) VALUES (?, ?, ?, ?)')
    .run(module, name.trim(), resolvedColorIndex, new Date().toISOString());
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const { name, colorIndex } = req.body || {};
  const nextName = name !== undefined ? String(name).trim() : existing.name;
  if (!nextName) return res.status(400).json({ error: 'name cannot be empty' });
  if (nextName !== existing.name) {
    const dup = db.prepare('SELECT * FROM categories WHERE module = ? AND name = ? AND id != ?').get(existing.module, nextName, existing.id);
    if (dup) return res.status(409).json({ error: 'a category with that name already exists' });
  }
  const nextColorIndex = Number.isInteger(colorIndex) ? colorIndex : existing.colorIndex;
  db.prepare('UPDATE categories SET name = ?, colorIndex = ? WHERE id = ?').run(nextName, nextColorIndex, existing.id);
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(existing.id));
});

// Categories are optional attributes (unlike task tags, nothing requires one),
// so delete never needs to block — affected rows fall back to another
// category in the same module if one exists, else are simply cleared.
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const fallback = db
    .prepare('SELECT * FROM categories WHERE module = ? AND id != ? ORDER BY id ASC LIMIT 1')
    .get(existing.module, existing.id);
  const deleteTx = db.transaction(() => {
    if (existing.module === 'thing') {
      db.prepare('UPDATE things SET categoryId = ? WHERE categoryId = ?').run(fallback ? fallback.id : null, existing.id);
    }
    if (existing.module === 'place') {
      db.prepare('UPDATE places SET categoryId = ? WHERE categoryId = ?').run(fallback ? fallback.id : null, existing.id);
    }
    if (existing.module === 'person') {
      const affected = db.prepare('SELECT personId FROM person_categories WHERE categoryId = ?').all(existing.id);
      db.prepare('DELETE FROM person_categories WHERE categoryId = ?').run(existing.id);
      if (fallback) {
        const insertPC = db.prepare('INSERT OR IGNORE INTO person_categories (personId, categoryId) VALUES (?, ?)');
        for (const { personId } of affected) insertPC.run(personId, fallback.id);
      }
    }
    if (existing.module === 'place_tag') {
      const affected = db.prepare('SELECT placeId FROM place_tags WHERE categoryId = ?').all(existing.id);
      db.prepare('DELETE FROM place_tags WHERE categoryId = ?').run(existing.id);
      if (fallback) {
        const insertPT = db.prepare('INSERT OR IGNORE INTO place_tags (placeId, categoryId) VALUES (?, ?)');
        for (const { placeId } of affected) insertPT.run(placeId, fallback.id);
      }
    }
    db.prepare('DELETE FROM categories WHERE id = ?').run(existing.id);
  });
  deleteTx();
  res.status(204).end();
});

module.exports = { router };
