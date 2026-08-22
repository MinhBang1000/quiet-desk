const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM tags ORDER BY id ASC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
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

router.patch('/:id', (req, res) => {
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

router.delete('/:id', (req, res) => {
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

module.exports = { router };
