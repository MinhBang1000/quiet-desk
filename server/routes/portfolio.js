const express = require('express');
const crypto = require('node:crypto');
const db = require('../db');

const router = express.Router();

function portfolioOut(row) {
  return {
    displayName: row.displayName,
    headline: row.headline,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    gallery: JSON.parse(row.gallery),
    links: JSON.parse(row.links),
    sections: JSON.parse(row.sections),
    theme: row.theme,
    shareEnabled: !!row.shareEnabled,
    shareToken: row.shareToken,
  };
}

router.get('/', (req, res) => {
  const row = db.prepare('SELECT * FROM portfolio WHERE id = 1').get();
  res.json(portfolioOut(row));
});

router.put('/', (req, res) => {
  const existing = db.prepare('SELECT * FROM portfolio WHERE id = 1').get();
  const { displayName, headline, bio, avatarUrl, gallery, links, sections, theme, shareEnabled } = req.body || {};
  const next = {
    displayName: displayName !== undefined ? displayName : existing.displayName,
    headline: headline !== undefined ? headline : existing.headline,
    bio: bio !== undefined ? bio : existing.bio,
    avatarUrl: avatarUrl !== undefined ? avatarUrl : existing.avatarUrl,
    gallery: gallery !== undefined ? JSON.stringify(gallery) : existing.gallery,
    links: links !== undefined ? JSON.stringify(links) : existing.links,
    sections: sections !== undefined ? JSON.stringify(sections) : existing.sections,
    theme: theme !== undefined ? theme : existing.theme,
    shareEnabled: shareEnabled !== undefined ? (shareEnabled ? 1 : 0) : existing.shareEnabled,
  };
  db.prepare(
    'UPDATE portfolio SET displayName = ?, headline = ?, bio = ?, avatarUrl = ?, gallery = ?, links = ?, sections = ?, theme = ?, shareEnabled = ? WHERE id = 1'
  ).run(next.displayName, next.headline, next.bio, next.avatarUrl, next.gallery, next.links, next.sections, next.theme, next.shareEnabled);
  const row = db.prepare('SELECT * FROM portfolio WHERE id = 1').get();
  res.json(portfolioOut(row));
});

router.post('/rotate-token', (req, res) => {
  const shareToken = crypto.randomBytes(16).toString('hex');
  db.prepare('UPDATE portfolio SET shareToken = ? WHERE id = 1').run(shareToken);
  res.json({ shareToken });
});

module.exports = { router, portfolioOut };
