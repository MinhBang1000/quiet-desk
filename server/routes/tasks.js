const express = require('express');
const crypto = require('node:crypto');
const db = require('../db');

const router = express.Router();

function rowToTask(row) {
  return { id: row.id, title: row.title, tag: row.tag, due: row.due, done: !!row.done };
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC').all();
  res.json(rows.map(rowToTask));
});

router.post('/', (req, res) => {
  const { title, tag, due, done } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  if (!due || typeof due !== 'string') {
    return res.status(400).json({ error: 'due is required' });
  }
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    'INSERT INTO tasks (id, title, tag, due, done, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, title.trim(), tag || 'Deep work', due, done ? 1 : 0, createdAt);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.status(201).json(rowToTask(row));
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const { title, tag, due, done } = req.body || {};
  const next = {
    title: title !== undefined ? title : existing.title,
    tag: tag !== undefined ? tag : existing.tag,
    due: due !== undefined ? due : existing.due,
    done: done !== undefined ? (done ? 1 : 0) : existing.done,
  };
  db.prepare('UPDATE tasks SET title = ?, tag = ?, due = ?, done = ? WHERE id = ?').run(
    next.title, next.tag, next.due, next.done, req.params.id
  );
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(rowToTask(row));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = { router, rowToTask };
