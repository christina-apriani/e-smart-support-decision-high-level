/* ============================================================================
 * Quantum Strategic Ledger (Q-SL) — Backend
 * Author: Christina Apriani
 * Zero-dependency Node HTTP server: static + REST + live network feed.
 * ==========================================================================*/
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const CE = require("./src/constraint.js");
const QSL = require("./src/qsl.js");
const NET = require("./src/network.js");
const db = require("./src/db.js");

const PORT = process.env.PORT || 5001;
const PUBLIC = path.join(__dirname, "public");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml" };

function sendJSON(res, code, obj) { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" }); res.end(JSON.stringify(obj)); }
function body(req) { return new Promise(function (r) { let d = ""; req.on("data", function (c) { d += c; if (d.length > 2e6) req.destroy(); }); req.on("end", function () { try { r(d ? JSON.parse(d) : {}); } catch (e) { r({}); } }); }); }
function serveStatic(res, pathname) {
  let rel = pathname === "/" ? "/index.html" : pathname;
  const fp = path.join(PUBLIC, path.normalize(rel).replace(/^(\.\.[/\\])+/, ""));
  if (!fp.startsWith(PUBLIC)) return res.writeHead(403).end("Forbidden");
  fs.readFile(fp, function (err, buf) { if (err) return res.writeHead(404, { "Content-Type": "text/plain" }).end("404"); res.writeHead(200, { "Content-Type": MIME[path.extname(fp)] || "application/octet-stream" }); res.end(buf); });
}

const server = http.createServer(async function (req, res) {
  const parsed = url.parse(req.url, true), p = parsed.pathname, m = req.method;
  if (m === "OPTIONS") return res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }).end();
  try {
    if (p.startsWith("/api/")) {
      if (p === "/api/health") return sendJSON(res, 200, { ok: true, service: "Quantum Strategic Ledger", author: "Christina Apriani" });
      if (p === "/api/context") return sendJSON(res, 200, QSL.CONTEXT);
      if (p === "/api/presets") return sendJSON(res, 200, QSL.PRESETS);
      if (p === "/api/rules") return sendJSON(res, 200, QSL.RULES.map(function (r) { return { id: r.id, label: r.label, dimension: r.dimension, severity: r.severity }; }));
      if (p === "/api/network") return sendJSON(res, 200, { nodes: NET.NODES });
      if (p === "/api/network/live") {
        const total = parseInt(parsed.query.total) || QSL.CONTEXT.capacity.currentLoadTPS;
        const surgeNode = parsed.query.surge;
        const surge = surgeNode ? (function () { var o = {}; o[surgeNode] = parseInt(parsed.query.amt) || 500; return o; })() : {};
        return sendJSON(res, 200, { nodes: NET.liveLoad(total, surge), total: total });
      }
      if (p === "/api/validate" && m === "POST") { const b = await body(req); return sendJSON(res, 200, QSL.validateProposal(b.proposal || b, b.context || QSL.CONTEXT)); }
      if (p === "/api/horizons" && m === "POST") { const b = await body(req); return sendJSON(res, 200, { horizons: QSL.allHorizons(b.metrics || {}, b.context || QSL.CONTEXT) }); }
      if (p === "/api/decisions" && m === "GET") return sendJSON(res, 200, db.list());
      if (p === "/api/decisions" && m === "POST") { const b = await body(req); if (b.decision) { db.save(b.decision); return sendJSON(res, 200, { saved: b.decision.id }); } return sendJSON(res, 400, { error: "no decision" }); }
      let mm;
      if ((mm = p.match(/^\/api\/decisions\/(.+)$/))) { const id = decodeURIComponent(mm[1]); if (m === "GET") return sendJSON(res, 200, db.get(id) || {}); if (m === "DELETE") { db.remove(id); return sendJSON(res, 200, { deleted: id }); } }
      if (p === "/api/stats") return sendJSON(res, 200, db.stats());
      return sendJSON(res, 404, { error: "unknown endpoint" });
    }
    return serveStatic(res, p);
  } catch (e) { return sendJSON(res, 500, { error: "internal", detail: String(e) }); }
});
server.listen(PORT, function () {
  console.log("────────────────────────────────────────────────────────");
  console.log("  Quantum Strategic Ledger (Q-SL) · by Christina Apriani");
  console.log("  http://localhost:" + PORT);
  console.log("  Anti-Halu: deterministic constraint validation");
  console.log("────────────────────────────────────────────────────────");
});
module.exports = { server };
