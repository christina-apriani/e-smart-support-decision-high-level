/* ============================================================================
 * Quantum Strategic Ledger — Data layer (live backend / demo fallback)
 * Author: Christina Apriani
 * ==========================================================================*/
(function (root) {
  "use strict";
  var QSL = root.QSL, NET = root.QSLNetwork;
  var mode = "demo";
  var LS = "qsl_decisions_v1";
  function loadLocal() { try { return JSON.parse(localStorage.getItem(LS) || "[]"); } catch (e) { return []; } }
  function saveLocal(a) { try { localStorage.setItem(LS, JSON.stringify(a)); } catch (e) {} }
  function j(method, path, b) { var o = { method: method, headers: { "Content-Type": "application/json" } }; if (b) o.body = JSON.stringify(b); return fetch(path, o).then(function (r) { return r.json(); }); }

  var API = {
    mode: function () { return mode; },
    detect: function () {
      var ctrl = new AbortController(); var to = setTimeout(function () { ctrl.abort(); }, 900);
      return fetch("/api/health", { signal: ctrl.signal }).then(function (r) { clearTimeout(to); if (!r.ok) throw 0; return r.json(); })
        .then(function () { mode = "live"; return "live"; }).catch(function () { mode = "demo"; return "demo"; });
    },
    context: function () { return mode === "live" ? j("GET", "/api/context") : Promise.resolve(QSL.CONTEXT); },
    presets: function () { return mode === "live" ? j("GET", "/api/presets") : Promise.resolve(QSL.PRESETS); },
    rules: function () { return mode === "live" ? j("GET", "/api/rules") : Promise.resolve(QSL.RULES.map(function (r) { return { id: r.id, label: r.label, dimension: r.dimension, severity: r.severity }; })); },
    network: function () { return mode === "live" ? j("GET", "/api/network") : Promise.resolve({ nodes: NET.NODES }); },
    networkLive: function (total, surge, amt) {
      if (mode === "live") { var q = "/api/network/live?total=" + (total || "") + (surge ? "&surge=" + surge + "&amt=" + (amt || 500) : ""); return j("GET", q); }
      var s = {}; if (surge) s[surge] = amt || 500;
      return Promise.resolve({ nodes: NET.liveLoad(total || QSL.CONTEXT.capacity.currentLoadTPS, s), total: total });
    },
    validate: function (proposal, context) { return mode === "live" ? j("POST", "/api/validate", { proposal: proposal, context: context }) : Promise.resolve(QSL.validateProposal(proposal, context || QSL.CONTEXT)); },
    horizons: function (metrics, context) { return mode === "live" ? j("POST", "/api/horizons", { metrics: metrics, context: context }) : Promise.resolve({ horizons: QSL.allHorizons(metrics || {}, context || QSL.CONTEXT) }); },
    listDecisions: function () { return mode === "live" ? j("GET", "/api/decisions") : Promise.resolve(loadLocal().map(function (d) { return { id: d.id, ts: d.ts, horizon: d.horizon, title: d.title, verdict: d.verdict, score: d.score }; })); },
    saveDecision: function (d) { if (mode === "live") return j("POST", "/api/decisions", { decision: d }); var all = loadLocal().filter(function (x) { return x.id !== d.id; }); d.ts = new Date().toISOString().slice(0, 19).replace("T", " "); all.unshift(d); saveLocal(all); return Promise.resolve({ saved: d.id }); },
    deleteDecision: function (id) { if (mode === "live") return j("DELETE", "/api/decisions/" + encodeURIComponent(id)); saveLocal(loadLocal().filter(function (x) { return x.id !== id; })); return Promise.resolve({ deleted: id }); },
    stats: function () { if (mode === "live") return j("GET", "/api/stats"); var all = loadLocal(); return Promise.resolve({ total: all.length, approved: all.filter(function (d) { return d.verdict === "APPROVED"; }).length, rejected: all.filter(function (d) { return d.verdict === "REJECTED"; }).length }); },
  };
  root.QSLApi = API;
})(window);
