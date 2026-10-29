/* ============================================================================
 * Quantum Strategic Ledger — Persistence (node:sqlite, zero-dependency)
 * Author: Christina Apriani
 * Stores saved decisions (a recommendation + its validation verdict).
 * ==========================================================================*/
"use strict";
const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");
const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, "qsl.db"));
db.exec("PRAGMA journal_mode = WAL;");
db.exec(`
  CREATE TABLE IF NOT EXISTS decisions (
    id        TEXT PRIMARY KEY,
    ts        TEXT DEFAULT (datetime('now')),
    horizon   TEXT,
    title     TEXT,
    verdict   TEXT,
    score     INTEGER,
    narrative TEXT,
    json      TEXT
  );
`);
module.exports = {
  db,
  save: function (d) {
    db.prepare("INSERT OR REPLACE INTO decisions (id,horizon,title,verdict,score,narrative,json) VALUES (?,?,?,?,?,?,?)")
      .run(d.id, d.horizon || "", d.title || "", d.verdict || "", d.score || 0, d.narrative || "", JSON.stringify(d));
    return d.id;
  },
  list: function () { return db.prepare("SELECT id,ts,horizon,title,verdict,score FROM decisions ORDER BY ts DESC, rowid DESC LIMIT 100").all(); },
  get: function (id) { const r = db.prepare("SELECT json FROM decisions WHERE id=?").get(id); try { return r ? JSON.parse(r.json) : null; } catch (e) { return null; } },
  remove: function (id) { db.prepare("DELETE FROM decisions WHERE id=?").run(id); },
  stats: function () {
    const total = db.prepare("SELECT COUNT(*) c FROM decisions").get().c;
    const approved = db.prepare("SELECT COUNT(*) c FROM decisions WHERE verdict='APPROVED'").get().c;
    const rejected = db.prepare("SELECT COUNT(*) c FROM decisions WHERE verdict='REJECTED'").get().c;
    return { total, approved, rejected };
  },
};
