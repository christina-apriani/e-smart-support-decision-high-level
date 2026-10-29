/* ============================================================================
 * Spatial-Economic Industrial Zone — Console Controller
 * Author: Christina Apriani
 * ==========================================================================*/
(function () {
  "use strict";
  var API = window.SEZApi, MAP = window.SEZMap;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var ZONES = [], lastHorizons = [];

  document.querySelectorAll(".tab").forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("active"); });
      document.querySelectorAll(".view").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active"); $(b.dataset.v).classList.add("active");
      if (b.dataset.v === "map") MAP.refresh();
      if (b.dataset.v === "zones") renderZones();
      if (b.dataset.v === "recs") renderRecs();
      if (b.dataset.v === "advisor" && !lastHorizons.length) genHorizons();
    };
  });
  var toastT; function toast(m) { var t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 2500); }
  function setMode(mode) { var p = $("modePill"); p.className = "pill mode-" + mode; $("modeText").textContent = mode === "live" ? "LIVE · backend aktif" : "DEMO · engine lokal"; }
  function surplus(z) { return z.powerCapacityMW - z.powerUsedMW; }

  /* ---- zone detail ---- */
  function showZone(id) {
    var z = ZONES.find(function (x) { return x.id === id; }); if (!z) return;
    MAP.open(id);
    $("zoneDetail").innerHTML =
      '<div style="font-weight:700;font-size:16px">' + esc(z.name) + '</div><div class="faint" style="font-size:12px;margin-bottom:10px">' + esc(z.city) + " · " + esc(z.sector) + '</div>' +
      kv("Okupansi", z.occupancyPct + "% " + occBar(z.occupancyPct)) +
      kv("Lahan tersedia", z.landAvailableHa + " / " + z.landTotalHa + " ha (HPL/HGB)") +
      kv("Kapasitas daya", z.powerUsedMW + " / " + z.powerCapacityMW + " MW") +
      kv("Surplus daya", '<b style="color:' + (surplus(z) > 50 ? "var(--lime)" : "var(--muted)") + '">' + surplus(z) + " MW</b>") +
      kv("Pelabuhan laut dalam", z.deepSeaPort ? '<span class="chip ok">' + esc(z.port) + "</span>" : '<span class="chip no">tidak ada</span>') +
      kv("AMDAL", '<span class="chip ' + (z.amdal === "approved" ? "ok" : "no") + '">' + esc(z.amdal) + "</span>") +
      kv("Leverage", z.leverage + "x") + kv("Tenant", z.tenants) + kv("EBT", z.ebtPct + "%") +
      kv("Akses", (z.toll ? "Tol " : "") + (z.rail ? "Rel " : "") + (!z.toll && !z.rail ? "terbatas" : ""));
  }
  function kv(k, v) { return '<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid var(--line);font-size:13px"><span class="faint">' + k + '</span><span style="text-align:right">' + v + "</span></div>"; }
  function occBar(p) { var c = p > 90 ? "var(--rej)" : p >= 60 ? "var(--warn)" : "var(--ok)"; return '<span class="occ"><i style="width:' + p + '%;background:' + c + '"></i></span>'; }

  /* ---- match ---- */
  function doMatch() {
    var req = { name: $("r_name").value, sector: $("r_sector").value, powerNeedMW: +$("r_power").value, landNeedHa: +$("r_land").value, needsDeepSeaPort: $("r_port").value === "true" };
    API.match(req).then(function (res) {
      var rec = res.recommended ? ZONES.find(function (z) { return z.id === res.recommended; }) : null;
      $("matchRec").innerHTML = rec ? '<span class="verdict APPROVED">→ ' + esc(rec.name) + "</span>" : '<span class="verdict REJECTED">tidak ada kawasan cocok</span>';
      $("matchPane").innerHTML = res.results.map(function (r) {
        var z = r.zone, v = r.validation;
        var fails = v.checks.filter(function (c) { return !c.pass; });
        var cond = fails.length
          ? '<div class="zc">✗ ' + fails.map(function (c) { return esc(c.detail); }).join(" · ") + "</div>"
          : '<div class="zc ok">✓ memenuhi semua syarat lahan, daya, pelabuhan &amp; fiskal</div>';
        return '<div class="zone-row ' + v.verdict + '" data-zone="' + esc(z.id) + '">' +
          '<div class="zt"><span>' + esc(z.name) + " · " + esc(z.city) + '</span><span class="verdict ' + v.verdict + '">' + v.verdict + "</span></div>" +
          '<div class="zm">okupansi ' + z.occupancyPct + "% · surplus " + surplus(z) + " MW · lahan " + z.landAvailableHa + " ha · " + (z.deepSeaPort ? "pelabuhan ✓" : "tanpa pelabuhan") + "</div>" +
          cond + "</div>";
      }).join("");
      $("matchPane").querySelectorAll("[data-zone]").forEach(function (el) { el.onclick = function () { showZone(el.getAttribute("data-zone")); }; });
      if (res.recommended) { gotoMapFocus([res.recommended]); }
    });
  }
  function gotoMapFocus(ids) { MAP.focus(ids); }

  /* ---- horizons ---- */
  function genHorizons() {
    API.horizons().then(function (res) {
      lastHorizons = res.horizons;
      $("horizonsPane").innerHTML = res.horizons.map(function (h) {
        return '<div class="horizon ' + h.horizon + '">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><div class="hz">' + (h.horizon === "short" ? "Jangka Pendek" : h.horizon === "medium" ? "Jangka Menengah" : "Jangka Panjang") + '</div><div class="ht">' + esc(h.title) + "</div></div>" +
          '<button class="btn ghost sm" data-focus=\'' + JSON.stringify(h.focus) + '\'>Lihat di peta</button></div>' +
          '<div class="narr">' + esc(h.narrative) + "</div>" +
          '<div class="mx">' + (h.metrics || []).map(function (m) { return '<div class="m">' + esc(m[0]) + "<b>" + esc(m[1]) + "</b></div>"; }).join("") + "</div>" +
          '<div class="row" style="margin-top:10px"><button class="btn ghost sm" data-save=\'' + encodeURIComponent(JSON.stringify({ id: "R" + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 90), kind: h.horizon, title: h.title, zone: (h.focus || []).join(","), narrative: h.narrative })) + '\'>Simpan</button></div>' +
          "</div>";
      }).join("");
      $("horizonsPane").querySelectorAll("[data-focus]").forEach(function (b) { b.onclick = function () { document.querySelector('.tab[data-v="map"]').click(); gotoMapFocus(JSON.parse(b.dataset.focus)); toast("Fokus peta: " + JSON.parse(b.dataset.focus).join(", ")); }; });
      $("horizonsPane").querySelectorAll("[data-save]").forEach(function (b) { b.onclick = function () { API.saveRec(JSON.parse(decodeURIComponent(b.dataset.save))).then(function () { toast("Rekomendasi disimpan"); refreshStats(); }); }; });
    });
  }
  $("btnGenHorizon").onclick = genHorizons;
  $("btnSaveHorizons").onclick = function () { if (!lastHorizons.length) { toast("Hasilkan dulu"); return; } lastHorizons.forEach(function (h) { API.saveRec({ id: "R" + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 900), kind: h.horizon, title: h.title, zone: (h.focus || []).join(","), narrative: h.narrative }); }); toast(lastHorizons.length + " rekomendasi disimpan"); refreshStats(); };

  /* ---- zones table ---- */
  function renderZones() {
    $("tblZones").innerHTML = "<thead><tr><th>Kawasan</th><th>Kota</th><th>Okupansi</th><th>Lahan sisa</th><th>Surplus MW</th><th>Pelabuhan</th><th>AMDAL</th><th>Lev</th><th>EBT</th></tr></thead><tbody>" +
      ZONES.map(function (z) {
        return "<tr><td><b>" + esc(z.id) + "</b> " + esc(z.name) + "</td><td>" + esc(z.city) + "</td><td class='mono'>" + z.occupancyPct + "% " + occBar(z.occupancyPct) +
          "</td><td class='mono'>" + z.landAvailableHa + " ha</td><td class='mono'>" + surplus(z) + "</td><td>" + (z.deepSeaPort ? "<span class='chip ok'>✓</span>" : "<span class='chip no'>—</span>") +
          "</td><td><span class='chip " + (z.amdal === "approved" ? "ok" : "no") + "'>" + esc(z.amdal) + "</span></td><td class='mono'>" + z.leverage + "x</td><td class='mono'>" + z.ebtPct + "%</td></tr>";
      }).join("") + "</tbody>";
  }

  /* ---- recs ---- */
  function renderRecs() {
    API.listRecs().then(function (list) {
      if (!list.length) { $("recsPane").innerHTML = '<div class="empty">Belum ada rekomendasi. Simpan dari Advisor.</div>'; return; }
      $("recsPane").innerHTML = '<table class="tbl"><thead><tr><th>ID</th><th>Horizon</th><th>Judul</th><th>Kawasan</th><th>Waktu</th><th></th></tr></thead><tbody>' +
        list.map(function (r) { return "<tr><td class='mono'>" + esc(r.id) + "</td><td>" + esc(r.kind || "") + "</td><td>" + esc(r.title || "") + "</td><td class='mono'>" + esc(r.zone || "") + "</td><td class='mono' style='font-size:11px'>" + esc(r.ts || "") + "</td><td><button class='btn danger sm' data-del='" + esc(r.id) + "'>×</button></td></tr>"; }).join("") + "</tbody>";
      $("recsPane").querySelectorAll("[data-del]").forEach(function (b) { b.onclick = function () { API.deleteRec(b.dataset.del).then(function () { renderRecs(); refreshStats(); }); }; });
    });
  }
  $("btnRefreshRecs").onclick = renderRecs;
  $("btnMatch").onclick = doMatch;
  window.__showZone = showZone;

  function refreshStats() {
    var avg = Math.round(ZONES.reduce(function (s, z) { return s + z.occupancyPct; }, 0) / ZONES.length);
    var surp = ZONES.reduce(function (s, z) { return s + surplus(z); }, 0);
    $("st_occ").textContent = avg + "%"; $("st_surplus").textContent = surp.toLocaleString("id-ID") + " MW";
    API.stats().then(function (s) { $("st_recs").textContent = s.total; });
  }

  /* ---- boot ---- */
  API.detect().then(function (mode) {
    setMode(mode);
    API.zones().then(function (d) {
      ZONES = d.zones; $("st_zones").textContent = ZONES.length; $("zoneCount").textContent = ZONES.length + " kawasan";
      MAP.init(ZONES, showZone); MAP.refresh();
      renderZones(); refreshStats();
    });
  });
})();
