const express = require('express');
const crypto = require('node:crypto');
const db = require('../db');

const router = express.Router();

function locationOut(row) {
  return { id: row.id, parentId: row.parentId, name: row.name, createdAt: row.createdAt };
}

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM locations ORDER BY name ASC').all().map(locationOut));
});

router.post('/', (req, res) => {
  const { name, parentId } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'name is required' });
  if (parentId && !db.prepare('SELECT id FROM locations WHERE id = ?').get(parentId)) {
    return res.status(400).json({ error: 'parent location not found' });
  }
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO locations (id, parentId, name, createdAt) VALUES (?, ?, ?, ?)').run(
    id, parentId || null, name.trim(), createdAt
  );
  res.status(201).json(locationOut(db.prepare('SELECT * FROM locations WHERE id = ?').get(id)));
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const nextName = req.body?.name !== undefined ? String(req.body.name).trim() : existing.name;
  if (!nextName) return res.status(400).json({ error: 'name cannot be empty' });
  db.prepare('UPDATE locations SET name = ? WHERE id = ?').run(nextName, existing.id);
  res.json(locationOut(db.prepare('SELECT * FROM locations WHERE id = ?').get(existing.id)));
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  if (db.prepare('SELECT COUNT(*) AS n FROM locations WHERE parentId = ?').get(existing.id).n > 0) {
    return res.status(400).json({ error: 'move or delete child locations first' });
  }
  if (db.prepare('SELECT COUNT(*) AS n FROM things WHERE locationId = ?').get(existing.id).n > 0) {
    return res.status(400).json({ error: 'move things out of this location first' });
  }
  db.prepare('DELETE FROM locations WHERE id = ?').run(existing.id);
  res.status(204).end();
});

module.exports = { router, locationOut };
