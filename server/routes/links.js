const express = require('express');
const crypto = require('node:crypto');
const db = require('../db');

const router = express.Router();

function linkOut(row) {
  return {
    id: row.id, fromType: row.fromType, fromId: row.fromId, toType: row.toType, toId: row.toId,
    relation: row.relation, note: row.note, createdAt: row.createdAt,
  };
}

router.get('/', (req, res) => {
  const { type, id } = req.query;
  const rows = type && id
    ? db.prepare('SELECT * FROM links WHERE (fromType = ? AND fromId = ?) OR (toType = ? AND toId = ?)').all(type, id, type, id)
    : db.prepare('SELECT * FROM links').all();
  res.json(rows.map(linkOut));
});

router.post('/', (req, res) => {
  const { fromType, fromId, toType, toId, relation, note } = req.body || {};
  if (!fromType || !fromId || !toType || !toId) {
    return res.status(400).json({ error: 'fromType, fromId, toType, toId are required' });
  }
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    'INSERT INTO links (id, fromType, fromId, toType, toId, relation, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, fromType, fromId, toType, toId, relation || 'related', note || '', createdAt);
  res.status(201).json(linkOut(db.prepare('SELECT * FROM links WHERE id = ?').get(id)));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM links WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = { router, linkOut };
