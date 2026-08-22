const express = require('express');
const crypto = require('node:crypto');
const db = require('../db');

const router = express.Router();

function placeOut(row) {
  const tagIds = db.prepare('SELECT categoryId FROM place_tags WHERE placeId = ?').all(row.id).map((r) => r.categoryId);
  return {
    id: row.id, name: row.name, categoryId: row.categoryId, address: row.address, mapLink: row.mapLink,
    phone: row.phone, website: row.website, openingHours: row.openingHours, rating: row.rating,
    visited: !!row.visited, wantToVisit: !!row.wantToVisit, favorite: !!row.favorite, notes: row.notes,
    lastVisitedDate: row.lastVisitedDate, visitCount: row.visitCount, city: row.city, country: row.country,
    createdAt: row.createdAt, tagIds,
  };
}

function setPlaceTags(placeId, tagIds) {
  db.prepare('DELETE FROM place_tags WHERE placeId = ?').run(placeId);
  if (Array.isArray(tagIds)) {
    const insert = db.prepare('INSERT OR IGNORE INTO place_tags (placeId, categoryId) VALUES (?, ?)');
    for (const categoryId of tagIds) insert.run(placeId, categoryId);
  }
}

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM places ORDER BY name ASC').all().map(placeOut));
});

router.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const insertTx = db.transaction(() => {
    db.prepare(
      `INSERT INTO places (id, name, categoryId, address, mapLink, phone, website, openingHours, rating,
        visited, wantToVisit, favorite, notes, lastVisitedDate, visitCount, city, country, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, body.name.trim(), body.categoryId ?? null, body.address || '', body.mapLink || '', body.phone || '',
      body.website || '', body.openingHours || '', Number.isInteger(body.rating) ? body.rating : null,
      body.visited ? 1 : 0, body.wantToVisit ? 1 : 0, body.favorite ? 1 : 0, body.notes || '',
      body.lastVisitedDate || null, Number.isInteger(body.visitCount) ? body.visitCount : 0,
      body.city || '', body.country || '', createdAt
    );
    setPlaceTags(id, body.tagIds);
  });
  insertTx();
  res.status(201).json(placeOut(db.prepare('SELECT * FROM places WHERE id = ?').get(id)));
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM places WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const body = req.body || {};
  const next = {
    name: body.name !== undefined ? body.name : existing.name,
    categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
    address: body.address !== undefined ? body.address : existing.address,
    mapLink: body.mapLink !== undefined ? body.mapLink : existing.mapLink,
    phone: body.phone !== undefined ? body.phone : existing.phone,
    website: body.website !== undefined ? body.website : existing.website,
    openingHours: body.openingHours !== undefined ? body.openingHours : existing.openingHours,
    rating: body.rating !== undefined ? body.rating : existing.rating,
    visited: body.visited !== undefined ? (body.visited ? 1 : 0) : existing.visited,
    wantToVisit: body.wantToVisit !== undefined ? (body.wantToVisit ? 1 : 0) : existing.wantToVisit,
    favorite: body.favorite !== undefined ? (body.favorite ? 1 : 0) : existing.favorite,
    notes: body.notes !== undefined ? body.notes : existing.notes,
    lastVisitedDate: body.lastVisitedDate !== undefined ? body.lastVisitedDate : existing.lastVisitedDate,
    visitCount: body.visitCount !== undefined ? body.visitCount : existing.visitCount,
    city: body.city !== undefined ? body.city : existing.city,
    country: body.country !== undefined ? body.country : existing.country,
  };
  const updateTx = db.transaction(() => {
    db.prepare(
      `UPDATE places SET name=?, categoryId=?, address=?, mapLink=?, phone=?, website=?, openingHours=?, rating=?,
        visited=?, wantToVisit=?, favorite=?, notes=?, lastVisitedDate=?, visitCount=?, city=?, country=? WHERE id=?`
    ).run(
      next.name, next.categoryId, next.address, next.mapLink, next.phone, next.website, next.openingHours,
      next.rating, next.visited, next.wantToVisit, next.favorite, next.notes, next.lastVisitedDate,
      next.visitCount, next.city, next.country, existing.id
    );
    if (body.tagIds !== undefined) setPlaceTags(existing.id, body.tagIds);
  });
  updateTx();
  res.json(placeOut(db.prepare('SELECT * FROM places WHERE id = ?').get(existing.id)));
});

router.delete('/:id', (req, res) => {
  const deleteTx = db.transaction(() => {
    db.prepare('DELETE FROM place_tags WHERE placeId = ?').run(req.params.id);
    db.prepare('DELETE FROM collection_places WHERE placeId = ?').run(req.params.id);
    db.prepare("UPDATE list_items SET linkType = NULL, linkId = NULL WHERE linkType = 'place' AND linkId = ?").run(req.params.id);
    db.prepare("DELETE FROM links WHERE (fromType = 'place' AND fromId = ?) OR (toType = 'place' AND toId = ?)").run(
      req.params.id, req.params.id
    );
    db.prepare('DELETE FROM places WHERE id = ?').run(req.params.id);
  });
  deleteTx();
  res.status(204).end();
});

module.exports = { router, placeOut };
