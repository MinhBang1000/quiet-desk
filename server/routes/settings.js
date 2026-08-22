const express = require('express');
const db = require('../db');

const router = express.Router();

function settingsOut(row) {
  return {
    focusMinutes: row.focusMinutes,
    breakMinutes: row.breakMinutes,
    autoStartBreak: !!row.autoStartBreak,
    goalMinutes: row.goalMinutes,
    theme: row.theme,
    baseCurrency: row.baseCurrency,
  };
}

router.get('/', (req, res) => {
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(settingsOut(row));
});

router.put('/', (req, res) => {
  const existing = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const { focusMinutes, breakMinutes, autoStartBreak, goalMinutes, theme, baseCurrency } = req.body || {};
  const next = {
    focusMinutes: focusMinutes ?? existing.focusMinutes,
    breakMinutes: breakMinutes ?? existing.breakMinutes,
    autoStartBreak: autoStartBreak !== undefined ? (autoStartBreak ? 1 : 0) : existing.autoStartBreak,
    goalMinutes: goalMinutes ?? existing.goalMinutes,
    theme: theme ?? existing.theme,
    baseCurrency: baseCurrency ?? existing.baseCurrency,
  };
  db.prepare(
    'UPDATE settings SET focusMinutes = ?, breakMinutes = ?, autoStartBreak = ?, goalMinutes = ?, theme = ?, baseCurrency = ? WHERE id = 1'
  ).run(next.focusMinutes, next.breakMinutes, next.autoStartBreak, next.goalMinutes, next.theme, next.baseCurrency);
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(settingsOut(row));
});

module.exports = { router, settingsOut };
