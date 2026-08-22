const express = require('express');
const crypto = require('node:crypto');
const db = require('../db');

const assetsRouter = express.Router();
const ratesRouter = express.Router();
const snapshotsRouter = express.Router();

function assetOut(row) {
  return {
    id: row.id, name: row.name, category: row.category, currency: row.currency,
    estimatedValue: row.estimatedValue, counterpartyPersonId: row.counterpartyPersonId,
    details: JSON.parse(row.details), notes: row.notes, lastUpdated: row.lastUpdated, createdAt: row.createdAt,
  };
}

assetsRouter.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM assets ORDER BY name ASC').all().map(assetOut));
});

assetsRouter.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (!body.category || typeof body.category !== 'string') {
    return res.status(400).json({ error: 'category is required' });
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO assets (id, name, category, currency, estimatedValue, counterpartyPersonId, details, notes, lastUpdated, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, body.name.trim(), body.category, body.currency || 'TWD',
    typeof body.estimatedValue === 'number' ? body.estimatedValue : 0, body.counterpartyPersonId || null,
    JSON.stringify(body.details || {}), body.notes || '', now, now
  );
  res.status(201).json(assetOut(db.prepare('SELECT * FROM assets WHERE id = ?').get(id)));
});

assetsRouter.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM assets WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const body = req.body || {};
  const next = {
    name: body.name !== undefined ? body.name : existing.name,
    category: body.category !== undefined ? body.category : existing.category,
    currency: body.currency !== undefined ? body.currency : existing.currency,
    estimatedValue: body.estimatedValue !== undefined ? body.estimatedValue : existing.estimatedValue,
    counterpartyPersonId: body.counterpartyPersonId !== undefined ? body.counterpartyPersonId : existing.counterpartyPersonId,
    details: body.details !== undefined ? JSON.stringify(body.details) : existing.details,
    notes: body.notes !== undefined ? body.notes : existing.notes,
  };
  const touchesValue = body.estimatedValue !== undefined || body.details !== undefined;
  const lastUpdated = touchesValue ? new Date().toISOString() : existing.lastUpdated;
  db.prepare(
    'UPDATE assets SET name=?, category=?, currency=?, estimatedValue=?, counterpartyPersonId=?, details=?, notes=?, lastUpdated=? WHERE id=?'
  ).run(next.name, next.category, next.currency, next.estimatedValue, next.counterpartyPersonId, next.details, next.notes, lastUpdated, existing.id);
  res.json(assetOut(db.prepare('SELECT * FROM assets WHERE id = ?').get(existing.id)));
});

assetsRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM assets WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

ratesRouter.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM exchange_rates ORDER BY currency ASC').all());
});

// Full-replace — this is a short, manually-maintained list, not a ledger.
ratesRouter.put('/', (req, res) => {
  const { rates } = req.body || {};
  if (!Array.isArray(rates)) return res.status(400).json({ error: 'rates must be an array' });
  const now = new Date().toISOString();
  const replaceTx = db.transaction(() => {
    db.prepare('DELETE FROM exchange_rates').run();
    const insert = db.prepare('INSERT INTO exchange_rates (currency, rateToBase, updatedAt) VALUES (?, ?, ?)');
    for (const r of rates) {
      if (!r.currency || typeof r.rateToBase !== 'number') continue;
      insert.run(r.currency, r.rateToBase, now);
    }
  });
  replaceTx();
  res.json(db.prepare('SELECT * FROM exchange_rates ORDER BY currency ASC').all());
});

// The one place base-currency totals are computed server-side rather than in
// the client's lib/assets.ts — a snapshot must freeze the value AT THIS
// MOMENT, so it stays correct even if rates or assets change later.
function computeCurrentTotals() {
  const settingsRow = db.prepare('SELECT baseCurrency FROM settings WHERE id = 1').get();
  const baseCurrency = settingsRow.baseCurrency;
  const rateMap = new Map(db.prepare('SELECT * FROM exchange_rates').all().map((r) => [r.currency, r.rateToBase]));
  rateMap.set(baseCurrency, 1);
  const assets = db.prepare('SELECT * FROM assets').all();
  let total = 0;
  const byCategory = {};
  const byCurrency = {};
  for (const a of assets) {
    const rate = rateMap.get(a.currency);
    const signed = a.category === 'payable' ? -a.estimatedValue : a.estimatedValue;
    byCurrency[a.currency] = (byCurrency[a.currency] || 0) + signed;
    if (rate == null) continue;
    const valueBase = signed * rate;
    total += valueBase;
    byCategory[a.category] = (byCategory[a.category] || 0) + valueBase;
  }
  return { total, baseCurrency, breakdown: { byCategory, byCurrency } };
}

snapshotsRouter.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM asset_snapshots ORDER BY takenAt ASC').all();
  res.json(rows.map((r) => ({ ...r, breakdown: JSON.parse(r.breakdown) })));
});

snapshotsRouter.post('/', (req, res) => {
  const { total, baseCurrency, breakdown } = computeCurrentTotals();
  const id = crypto.randomUUID();
  const takenAt = new Date().toISOString();
  db.prepare(
    'INSERT INTO asset_snapshots (id, takenAt, totalBaseCurrency, baseCurrency, breakdown) VALUES (?, ?, ?, ?, ?)'
  ).run(id, takenAt, total, baseCurrency, JSON.stringify(breakdown));
  const row = db.prepare('SELECT * FROM asset_snapshots WHERE id = ?').get(id);
  res.status(201).json({ ...row, breakdown: JSON.parse(row.breakdown) });
});

module.exports = { assetsRouter, ratesRouter, snapshotsRouter, assetOut };
