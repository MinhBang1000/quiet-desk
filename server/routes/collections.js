const express = require('express');
const crypto = require('node:crypto');
const db = require('../db');

const router = express.Router();

function collectionOut(row) {
  const placeIds = db.prepare('SELECT placeId FROM collection_places WHERE collectionId = ?').all(row.id).map((r) => r.placeId);
  return { id: row.id, name: row.name, createdAt: row.createdAt, placeIds };
}

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM collections ORDER BY name ASC').all().map(collectionOut));
});

router.post('/', (req, res) => {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'name is required' });
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO collections (id, name, createdAt) VALUES (?, ?, ?)').run(id, name.trim(), createdAt);
  res.status(201).json(collectionOut(db.prepare('SELECT * FROM collections WHERE id = ?').get(id)));
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const nextName = req.body?.name !== undefined ? String(req.body.name).trim() : existing.name;
  if (!nextName) return res.status(400).json({ error: 'name cannot be empty' });
  db.prepare('UPDATE collections SET name = ? WHERE id = ?').run(nextName, existing.id);
  res.json(collectionOut(db.prepare('SELECT * FROM collections WHERE id = ?').get(existing.id)));
});

router.patch('/:id/members', (req, res) => {
  const existing = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const { placeIds } = req.body || {};
  if (!Array.isArray(placeIds)) return res.status(400).json({ error: 'placeIds must be an array' });
  const updateTx = db.transaction(() => {
    db.prepare('DELETE FROM collection_places WHERE collectionId = ?').run(existing.id);
    const insert = db.prepare('INSERT OR IGNORE INTO collection_places (collectionId, placeId) VALUES (?, ?)');
    for (const placeId of placeIds) insert.run(existing.id, placeId);
  });
  updateTx();
  res.json(collectionOut(db.prepare('SELECT * FROM collections WHERE id = ?').get(existing.id)));
});

router.delete('/:id', (req, res) => {
  const deleteTx = db.transaction(() => {
    db.prepare('DELETE FROM collection_places WHERE collectionId = ?').run(req.params.id);
    db.prepare('DELETE FROM collections WHERE id = ?').run(req.params.id);
  });
  deleteTx();
  res.status(204).end();
});

module.exports = { router, collectionOut };
