// server.js
// Small Express API that powers the portfolio's "Uplink" section:
//   - stores uploaded files on disk + their metadata in SQLite
//   - stores contact-form messages in SQLite
// Serves the static frontend too, so `npm start` is the only step needed.

const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const db = require("./db/database");

const app = express();
const PORT = process.env.PORT || 3000;

const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_FILE_SIZE_MB = 15;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use("/uploads", express.static(UPLOAD_DIR));

// ---------- Multer storage: keep the original extension, randomize the name ----------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

// ---------- Routes: file uplink ----------
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file was received." });
  }

  const stmt = db.prepare(`
    INSERT INTO files (original_name, stored_name, mime_type, size_bytes)
    VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(
    req.file.originalname,
    req.file.filename,
    req.file.mimetype,
    req.file.size
  );

  const row = db
    .prepare("SELECT * FROM files WHERE id = ?")
    .get(info.lastInsertRowid);

  res.status(201).json(row);
});

app.get("/api/files", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM files ORDER BY uploaded_at DESC")
    .all();
  res.json(rows);
});

app.delete("/api/files/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM files WHERE id = ?")
    .get(req.params.id);

  if (!row) return res.status(404).json({ error: "File not found." });

  const filePath = path.join(UPLOAD_DIR, row.stored_name);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare("DELETE FROM files WHERE id = ?").run(req.params.id);
  res.json({ deleted: true });
});

// ---------- Routes: contact transmissions ----------
app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: "name, email and message are required." });
  }

  const stmt = db.prepare(`
    INSERT INTO messages (name, email, message) VALUES (?, ?, ?)
  `);
  const info = stmt.run(name, email, message);
  const row = db
    .prepare("SELECT * FROM messages WHERE id = ?")
    .get(info.lastInsertRowid);

  res.status(201).json(row);
});

// ---------- Error handler (e.g. file too large) ----------
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(PORT, () => {
  console.log(`Portfolio server running -> http://localhost:${PORT}`);
});
