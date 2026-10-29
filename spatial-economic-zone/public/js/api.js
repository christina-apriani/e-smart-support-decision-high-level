/* ============================================================================
 * Spatial-Economic Industrial Zone — Data layer (live / demo)
 * Author: Christina Apriani
 * ==========================================================================*/
(function (root) {
  "use strict";
  var SEZ = root.SEZ, Z = root.SEZZones;
  var mode = "demo";
  var LS = "sez_recs_v1";
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
    zones: function () { return mode === "live" ? j("GET", "/api/zones") : Promise.resolve({ zones: Z.ZONES, links: Z.SUPPLY_LINKS }); },
    rules: function () { return mode === "live" ? j("GET", "/api/rules") : Promise.resolve(SEZ.ZONE_RULES.map(function (r) { return { id: r.id, label: r.label, dimension: r.dimension, severity: r.severity }; })); },
    horizons: function () { return mode === "live" ? j("GET", "/api/horizons") : Promise.resolve({ horizons: SEZ.allHorizons() }); },
    match: function (req) { return mode === "live" ? j("POST", "/api/match", { requirement: req }) : Promise.resolve(SEZ.matchInvestor(req)); },
    listRecs: function () { return mode === "live" ? j("GET", "/api/recommendations") : Promise.resolve(loadLocal().map(function (r) { return { id: r.id, ts: r.ts, kind: r.kind, title: r.title, zone: r.zone }; })); },
    saveRec: function (r) { if (mode === "live") return j("POST", "/api/recommendations", { rec: r }); var all = loadLocal().filter(function (x) { return x.id !== r.id; }); r.ts = new Date().toISOString().slice(0, 19).replace("T", " "); all.unshift(r); saveLocal(all); return Promise.resolve({ saved: r.id }); },
    deleteRec: function (id) { if (mode === "live") return j("DELETE", "/api/recommendations/" + encodeURIComponent(id)); saveLocal(loadLocal().filter(function (x) { return x.id !== id; })); return Promise.resolve({ deleted: id }); },
    stats: function () { if (mode === "live") return j("GET", "/api/stats"); return Promise.resolve({ total: loadLocal().length }); },
  };
  root.SEZApi = API;
})(window);
