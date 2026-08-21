// db/database.js
// Single SQLite file on disk (portfolio.db). better-sqlite3 is synchronous,
// which keeps this small server simple to read - no callback/async noise.
const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "portfolio.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    original_name TEXT NOT NULL,
    stored_name   TEXT NOT NULL,
    mime_type     TEXT,
    size_bytes    INTEGER,
    category      TEXT NOT NULL DEFAULT 'other',
    title         TEXT,
    description   TEXT,
    uploaded_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    message     TEXT NOT NULL,
    received_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Keep existing portfolio databases compatible when new upload metadata is added.
for (const column of [
  ["category", "TEXT NOT NULL DEFAULT 'other'"],
  ["title", "TEXT"],
  ["description", "TEXT"],
]) {
  try {
    db.exec(`ALTER TABLE files ADD COLUMN ${column[0]} ${column[1]}`);
  } catch (error) {
    if (!error.message.includes("duplicate column name")) throw error;
  }
}

module.exports = db;
