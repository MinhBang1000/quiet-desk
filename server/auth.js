const crypto = require('node:crypto');
const db = require('./db');

const SESSION_COOKIE = 'qd_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MIN_PIN_LENGTH = 6;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

db.exec(`
  CREATE TABLE IF NOT EXISTS auth (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    pinHash TEXT NOT NULL,
    salt TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auth_sessions (
    token TEXT PRIMARY KEY,
    createdAt TEXT NOT NULL,
    expiresAt TEXT NOT NULL
  );
`);

// In-memory brute-force throttle, keyed by client IP. Deliberately not
// persisted: a server restart clearing it is an acceptable trade-off for a
// single-user app, and the PIN length/lockout window are the real defense.
const attempts = new Map();

function hashPin(pin, salt) {
  return crypto.scryptSync(pin, salt, 64).toString('hex');
}

function getAuthRow() {
  return db.prepare('SELECT * FROM auth WHERE id = 1').get();
}

function hasPin() {
  return !!getAuthRow();
}

function setPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const pinHash = hashPin(pin, salt);
  db.prepare('INSERT INTO auth (id, pinHash, salt, createdAt) VALUES (1, ?, ?, ?)').run(
    pinHash,
    salt,
    new Date().toISOString()
  );
}

function verifyPin(pin) {
  const row = getAuthRow();
  if (!row) return false;
  const candidate = hashPin(pin, row.salt);
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(row.pinHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  db.prepare('INSERT INTO auth_sessions (token, createdAt, expiresAt) VALUES (?, ?, ?)').run(
    token,
    new Date(now).toISOString(),
    new Date(now + SESSION_TTL_MS).toISOString()
  );
  return token;
}

function isValidSession(token) {
  if (!token) return false;
  const row = db.prepare('SELECT * FROM auth_sessions WHERE token = ?').get(token);
  if (!row) return false;
  return new Date(row.expiresAt).getTime() > Date.now();
}

function destroySession(token) {
  if (token) db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
}

function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS,
    // Not marked `secure` because this may be served over plain HTTP on a
    // LAN/port-forward without TLS. If you put this behind HTTPS, set
    // secure: true so the cookie is never sent unencrypted.
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE);
}

function checkRateLimit(ip) {
  const entry = attempts.get(ip);
  if (!entry) return { blocked: false };
  if (entry.blockedUntil && entry.blockedUntil > Date.now()) {
    return { blocked: true, retryAfterMs: entry.blockedUntil - Date.now() };
  }
  return { blocked: false };
}

function recordFailedAttempt(ip) {
  const entry = attempts.get(ip) || { count: 0, blockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    entry.blockedUntil = Date.now() + LOCKOUT_MS;
    entry.count = 0;
  }
  attempts.set(ip, entry);
}

function clearAttempts(ip) {
  attempts.delete(ip);
}

function requireAuth(req, res, next) {
  const token = req.cookies ? req.cookies[SESSION_COOKIE] : null;
  if (!isValidSession(token)) {
    return res.status(401).json({ error: 'unauthenticated' });
  }
  next();
}

module.exports = {
  SESSION_COOKIE,
  MIN_PIN_LENGTH,
  hasPin,
  setPin,
  verifyPin,
  createSession,
  isValidSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
  requireAuth,
};
