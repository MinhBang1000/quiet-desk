const express = require('express');
const crypto = require('node:crypto');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM sessions ORDER BY startedAt DESC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { startedAt, minutes, taskId, tag } = req.body || {};
  if (!startedAt || !Number.isFinite(minutes)) {
    return res.status(400).json({ error: 'startedAt and minutes are required' });
  }
  const id = crypto.randomUUID();
  db.prepare(
    'INSERT INTO sessions (id, startedAt, minutes, taskId, tag) VALUES (?, ?, ?, ?, ?)'
  ).run(id, startedAt, Math.round(minutes), taskId || null, tag || null);
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
  res.status(201).json(row);
});

module.exports = { router };
