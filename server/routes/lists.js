const express = require('express');
const crypto = require('node:crypto');
const db = require('../db');
const { placeOut } = require('./places');
const { thingOut } = require('./things');

const listsRouter = express.Router();
const listItemsRouter = express.Router();

function listOut(row) {
  return { id: row.id, name: row.name, style: row.style, favorite: !!row.favorite, notes: row.notes, createdAt: row.createdAt };
}

function listItemOut(row) {
  return {
    id: row.id, listId: row.listId, text: row.text, description: row.description, completed: !!row.completed,
    position: row.position, notes: row.notes, date: row.date, linkType: row.linkType, linkId: row.linkId,
    convertedToType: row.convertedToType, convertedToId: row.convertedToId, createdAt: row.createdAt,
  };
}

listsRouter.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM lists ORDER BY createdAt DESC').all().map(listOut));
});

listsRouter.post('/', (req, res) => {
  const { name, style, notes } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'name is required' });
  const validStyles = ['simple', 'checklist', 'reusable_checklist', 'ranked'];
  const resolvedStyle = validStyles.includes(style) ? style : 'simple';
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO lists (id, name, style, notes, createdAt) VALUES (?, ?, ?, ?, ?)').run(
    id, name.trim(), resolvedStyle, notes || '', createdAt
  );
  res.status(201).json(listOut(db.prepare('SELECT * FROM lists WHERE id = ?').get(id)));
});

listsRouter.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM lists WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const { name, favorite, notes } = req.body || {};
  const nextName = name !== undefined ? String(name).trim() : existing.name;
  if (!nextName) return res.status(400).json({ error: 'name cannot be empty' });
  const nextFavorite = favorite !== undefined ? (favorite ? 1 : 0) : existing.favorite;
  const nextNotes = notes !== undefined ? notes : existing.notes;
  db.prepare('UPDATE lists SET name = ?, favorite = ?, notes = ? WHERE id = ?').run(nextName, nextFavorite, nextNotes, existing.id);
  res.json(listOut(db.prepare('SELECT * FROM lists WHERE id = ?').get(existing.id)));
});

listsRouter.delete('/:id', (req, res) => {
  const deleteTx = db.transaction(() => {
    db.prepare('DELETE FROM list_items WHERE listId = ?').run(req.params.id);
    db.prepare('DELETE FROM lists WHERE id = ?').run(req.params.id);
  });
  deleteTx();
  res.status(204).end();
});

// Reusable Checklist: un-complete every item without touching membership.
listsRouter.post('/:id/reset', (req, res) => {
  db.prepare('UPDATE list_items SET completed = 0 WHERE listId = ?').run(req.params.id);
  res.json(db.prepare('SELECT * FROM list_items WHERE listId = ?').all(req.params.id).map(listItemOut));
});

listsRouter.get('/:id/items', (req, res) => {
  res.json(db.prepare('SELECT * FROM list_items WHERE listId = ? ORDER BY position ASC, createdAt ASC').all(req.params.id).map(listItemOut));
});

listsRouter.post('/:id/items', (req, res) => {
  const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(req.params.id);
  if (!list) return res.status(404).json({ error: 'list not found' });
  const body = req.body || {};
  if (!body.text || typeof body.text !== 'string' || !body.text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }
  const maxPos = db.prepare('SELECT MAX(position) AS m FROM list_items WHERE listId = ?').get(req.params.id).m;
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO list_items (id, listId, text, description, notes, date, linkType, linkId, position, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, req.params.id, body.text.trim(), body.description || '', body.notes || '', body.date || null,
    body.linkType || null, body.linkId || null, (maxPos ?? -1) + 1, createdAt
  );
  res.status(201).json(listItemOut(db.prepare('SELECT * FROM list_items WHERE id = ?').get(id)));
});

listItemsRouter.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM list_items WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const body = req.body || {};
  const next = {
    text: body.text !== undefined ? body.text : existing.text,
    description: body.description !== undefined ? body.description : existing.description,
    completed: body.completed !== undefined ? (body.completed ? 1 : 0) : existing.completed,
    position: body.position !== undefined ? body.position : existing.position,
    notes: body.notes !== undefined ? body.notes : existing.notes,
    date: body.date !== undefined ? body.date : existing.date,
    linkType: body.linkType !== undefined ? body.linkType : existing.linkType,
    linkId: body.linkId !== undefined ? body.linkId : existing.linkId,
  };
  db.prepare(
    'UPDATE list_items SET text=?, description=?, completed=?, position=?, notes=?, date=?, linkType=?, linkId=? WHERE id=?'
  ).run(next.text, next.description, next.completed, next.position, next.notes, next.date, next.linkType, next.linkId, existing.id);
  res.json(listItemOut(db.prepare('SELECT * FROM list_items WHERE id = ?').get(existing.id)));
});

listItemsRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM list_items WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Promotes a lightweight item into a real Place/Thing record. The item is
// never deleted — it stays in the list with a badge pointing at what it
// became, per the spec ("the original List should remain usable").
listItemsRouter.post('/:id/convert', (req, res) => {
  const existing = db.prepare('SELECT * FROM list_items WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const { toType, fields } = req.body || {};
  if (toType !== 'place' && toType !== 'thing') {
    return res.status(400).json({ error: "toType must be 'place' or 'thing'" });
  }
  const name = (fields && fields.name) || existing.text;
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const convertTx = db.transaction(() => {
    if (toType === 'place') {
      db.prepare('INSERT INTO places (id, name, notes, createdAt) VALUES (?, ?, ?, ?)').run(id, name, existing.description || '', createdAt);
    } else {
      db.prepare('INSERT INTO things (id, name, notes, createdAt) VALUES (?, ?, ?, ?)').run(id, name, existing.description || '', createdAt);
    }
    db.prepare('UPDATE list_items SET convertedToType = ?, convertedToId = ? WHERE id = ?').run(toType, id, existing.id);
  });
  convertTx();
  const created = toType === 'place'
    ? placeOut(db.prepare('SELECT * FROM places WHERE id = ?').get(id))
    : thingOut(db.prepare('SELECT * FROM things WHERE id = ?').get(id));
  res.status(201).json({ item: listItemOut(db.prepare('SELECT * FROM list_items WHERE id = ?').get(existing.id)), created });
});

module.exports = { listsRouter, listItemsRouter, listOut, listItemOut };
