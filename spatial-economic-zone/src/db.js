/* ============================================================================
 * Spatial-Economic Industrial Zone — Persistence (node:sqlite, zero-dep)
 * Author: Christina Apriani
 * ==========================================================================*/
"use strict";
const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");
const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, "sez.db"));
db.exec("PRAGMA journal_mode = WAL;");
db.exec(`
  CREATE TABLE IF NOT EXISTS recommendations (
    id        TEXT PRIMARY KEY,
    ts        TEXT DEFAULT (datetime('now')),
    kind      TEXT,
    title     TEXT,
    zone      TEXT,
    narrative TEXT,
    json      TEXT
  );
`);
module.exports = {
  db,
  save: function (r) { db.prepare("INSERT OR REPLACE INTO recommendations (id,kind,title,zone,narrative,json) VALUES (?,?,?,?,?,?)").run(r.id, r.kind || "", r.title || "", r.zone || "", r.narrative || "", JSON.stringify(r)); return r.id; },
  list: function () { return db.prepare("SELECT id,ts,kind,title,zone FROM recommendations ORDER BY ts DESC, rowid DESC LIMIT 100").all(); },
  get: function (id) { const x = db.prepare("SELECT json FROM recommendations WHERE id=?").get(id); try { return x ? JSON.parse(x.json) : null; } catch (e) { return null; } },
  remove: function (id) { db.prepare("DELETE FROM recommendations WHERE id=?").run(id); },
  stats: function () { return { total: db.prepare("SELECT COUNT(*) c FROM recommendations").get().c }; },
};
