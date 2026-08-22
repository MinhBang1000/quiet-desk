const express = require('express');
const crypto = require('node:crypto');
const db = require('../db');

const router = express.Router();

function thingOut(row) {
  return {
    id: row.id, name: row.name, photoUrl: row.photoUrl, categoryId: row.categoryId,
    brand: row.brand, model: row.model, serialNumber: row.serialNumber, quantity: row.quantity,
    notes: row.notes, purchaseDate: row.purchaseDate, purchaseLocation: row.purchaseLocation,
    purchasePrice: row.purchasePrice, currency: row.currency, warrantyExpires: row.warrantyExpires,
    attachments: JSON.parse(row.attachments), status: row.status, locationId: row.locationId,
    containerId: row.containerId, loanPersonId: row.loanPersonId, loanSince: row.loanSince,
    loanDue: row.loanDue, createdAt: row.createdAt,
  };
}

// Prevents a thing from ending up nested inside its own contents (directly
// or transitively), which would otherwise hang the client-side location
// resolver in an infinite loop.
function wouldCreateCycle(thingId, newContainerId) {
  let current = newContainerId;
  let hops = 0;
  while (current && hops < 200) {
    if (current === thingId) return true;
    const row = db.prepare('SELECT containerId FROM things WHERE id = ?').get(current);
    current = row ? row.containerId : null;
    hops++;
  }
  return false;
}

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM things ORDER BY name ASC').all().map(thingOut));
});

router.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO things (id, name, photoUrl, categoryId, brand, model, serialNumber, quantity, notes,
      purchaseDate, purchaseLocation, purchasePrice, currency, warrantyExpires, attachments, status,
      locationId, containerId, loanPersonId, loanSince, loanDue, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, body.name.trim(), body.photoUrl || '', body.categoryId ?? null, body.brand || '', body.model || '',
    body.serialNumber || '', Number.isInteger(body.quantity) ? body.quantity : 1, body.notes || '',
    body.purchaseDate || null, body.purchaseLocation || '',
    typeof body.purchasePrice === 'number' ? body.purchasePrice : null, body.currency || 'TWD',
    body.warrantyExpires || null, JSON.stringify(body.attachments || []), body.status || 'owned',
    body.locationId || null, body.containerId || null, body.loanPersonId || null, body.loanSince || null,
    body.loanDue || null, createdAt
  );
  res.status(201).json(thingOut(db.prepare('SELECT * FROM things WHERE id = ?').get(id)));
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM things WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const body = req.body || {};
  const next = {
    name: body.name !== undefined ? body.name : existing.name,
    photoUrl: body.photoUrl !== undefined ? body.photoUrl : existing.photoUrl,
    categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
    brand: body.brand !== undefined ? body.brand : existing.brand,
    model: body.model !== undefined ? body.model : existing.model,
    serialNumber: body.serialNumber !== undefined ? body.serialNumber : existing.serialNumber,
    quantity: body.quantity !== undefined ? body.quantity : existing.quantity,
    notes: body.notes !== undefined ? body.notes : existing.notes,
    purchaseDate: body.purchaseDate !== undefined ? body.purchaseDate : existing.purchaseDate,
    purchaseLocation: body.purchaseLocation !== undefined ? body.purchaseLocation : existing.purchaseLocation,
    purchasePrice: body.purchasePrice !== undefined ? body.purchasePrice : existing.purchasePrice,
    currency: body.currency !== undefined ? body.currency : existing.currency,
    warrantyExpires: body.warrantyExpires !== undefined ? body.warrantyExpires : existing.warrantyExpires,
    attachments: body.attachments !== undefined ? JSON.stringify(body.attachments) : existing.attachments,
    status: body.status !== undefined ? body.status : existing.status,
    locationId: body.locationId !== undefined ? body.locationId : existing.locationId,
    containerId: body.containerId !== undefined ? body.containerId : existing.containerId,
    loanPersonId: body.loanPersonId !== undefined ? body.loanPersonId : existing.loanPersonId,
    loanSince: body.loanSince !== undefined ? body.loanSince : existing.loanSince,
    loanDue: body.loanDue !== undefined ? body.loanDue : existing.loanDue,
  };
  if (next.containerId && wouldCreateCycle(existing.id, next.containerId)) {
    return res.status(400).json({ error: 'cannot place a thing inside itself or its own contents' });
  }
  db.prepare(
    `UPDATE things SET name=?, photoUrl=?, categoryId=?, brand=?, model=?, serialNumber=?, quantity=?, notes=?,
      purchaseDate=?, purchaseLocation=?, purchasePrice=?, currency=?, warrantyExpires=?, attachments=?,
      status=?, locationId=?, containerId=?, loanPersonId=?, loanSince=?, loanDue=? WHERE id=?`
  ).run(
    next.name, next.photoUrl, next.categoryId, next.brand, next.model, next.serialNumber, next.quantity,
    next.notes, next.purchaseDate, next.purchaseLocation, next.purchasePrice, next.currency,
    next.warrantyExpires, next.attachments, next.status, next.locationId, next.containerId,
    next.loanPersonId, next.loanSince, next.loanDue, existing.id
  );
  res.json(thingOut(db.prepare('SELECT * FROM things WHERE id = ?').get(existing.id)));
});

router.delete('/:id', (req, res) => {
  const deleteTx = db.transaction(() => {
    db.prepare('UPDATE things SET containerId = NULL WHERE containerId = ?').run(req.params.id);
    db.prepare("UPDATE list_items SET linkType = NULL, linkId = NULL WHERE linkType = 'thing' AND linkId = ?").run(req.params.id);
    db.prepare("DELETE FROM links WHERE (fromType = 'thing' AND fromId = ?) OR (toType = 'thing' AND toId = ?)").run(
      req.params.id, req.params.id
    );
    db.prepare('DELETE FROM things WHERE id = ?').run(req.params.id);
  });
  deleteTx();
  res.status(204).end();
});

module.exports = { router, thingOut };
