const express = require('express');
const crypto = require('node:crypto');
const db = require('../db');

const router = express.Router();

const PERSON_TEXT_FIELDS = [
  'fullName', 'nickname', 'photoUrl', 'relationship', 'organization', 'position', 'phone', 'email',
  'otherContact', 'website', 'birthday', 'city', 'country', 'notes', 'interests', 'likes', 'dislikes',
  'foodPreferences', 'giftIdeas', 'howWeMet', 'firstMetDate', 'lastContactedDate',
];
// Only these three columns are nullable (dates with no value); everything
// else is `NOT NULL DEFAULT ''`, so a missing field must fall back to ''.
const NULLABLE_PERSON_FIELDS = new Set(['birthday', 'firstMetDate', 'lastContactedDate']);
function personFieldDefault(f, value) {
  if (value !== undefined) return value;
  return NULLABLE_PERSON_FIELDS.has(f) ? null : '';
}

function personOut(row) {
  const categoryIds = db
    .prepare('SELECT categoryId FROM person_categories WHERE personId = ?')
    .all(row.id)
    .map((r) => r.categoryId);
  const out = { id: row.id, favorite: !!row.favorite, createdAt: row.createdAt, categoryIds };
  for (const f of PERSON_TEXT_FIELDS) out[f] = row[f];
  return out;
}

function setPersonCategories(personId, categoryIds) {
  db.prepare('DELETE FROM person_categories WHERE personId = ?').run(personId);
  if (Array.isArray(categoryIds)) {
    const insert = db.prepare('INSERT OR IGNORE INTO person_categories (personId, categoryId) VALUES (?, ?)');
    for (const categoryId of categoryIds) insert.run(personId, categoryId);
  }
}

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM people ORDER BY fullName ASC').all().map(personOut));
});

router.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.fullName || typeof body.fullName !== 'string' || !body.fullName.trim()) {
    return res.status(400).json({ error: 'fullName is required' });
  }
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const values = PERSON_TEXT_FIELDS.map((f) => (f === 'fullName' ? body.fullName.trim() : personFieldDefault(f, body[f])));
  const columns = ['id', ...PERSON_TEXT_FIELDS, 'favorite', 'createdAt'];
  const insertTx = db.transaction(() => {
    db.prepare(`INSERT INTO people (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`).run(
      id, ...values, body.favorite ? 1 : 0, createdAt
    );
    setPersonCategories(id, body.categoryIds);
  });
  insertTx();
  res.status(201).json(personOut(db.prepare('SELECT * FROM people WHERE id = ?').get(id)));
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM people WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const body = req.body || {};
  const nextValues = PERSON_TEXT_FIELDS.map((f) => (body[f] !== undefined ? body[f] : existing[f]));
  const nextFavorite = body.favorite !== undefined ? (body.favorite ? 1 : 0) : existing.favorite;
  const setClause = PERSON_TEXT_FIELDS.map((f) => `${f} = ?`).join(', ') + ', favorite = ?';
  const updateTx = db.transaction(() => {
    db.prepare(`UPDATE people SET ${setClause} WHERE id = ?`).run(...nextValues, nextFavorite, existing.id);
    if (body.categoryIds !== undefined) setPersonCategories(existing.id, body.categoryIds);
  });
  updateTx();
  res.json(personOut(db.prepare('SELECT * FROM people WHERE id = ?').get(existing.id)));
});

router.delete('/:id', (req, res) => {
  const deleteTx = db.transaction(() => {
    db.prepare('DELETE FROM person_categories WHERE personId = ?').run(req.params.id);
    db.prepare('UPDATE things SET loanPersonId = NULL WHERE loanPersonId = ?').run(req.params.id);
    db.prepare('UPDATE assets SET counterpartyPersonId = NULL WHERE counterpartyPersonId = ?').run(req.params.id);
    db.prepare("UPDATE list_items SET linkType = NULL, linkId = NULL WHERE linkType = 'person' AND linkId = ?").run(req.params.id);
    db.prepare("DELETE FROM links WHERE (fromType = 'person' AND fromId = ?) OR (toType = 'person' AND toId = ?)").run(
      req.params.id, req.params.id
    );
    db.prepare('DELETE FROM people WHERE id = ?').run(req.params.id);
  });
  deleteTx();
  res.status(204).end();
});

module.exports = { router, personOut, PERSON_TEXT_FIELDS, personFieldDefault };
