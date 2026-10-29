/* ============================================================================
 * Quantum Strategic Ledger — Console Controller
 * Author: Christina Apriani
 * ==========================================================================*/
(function () {
  "use strict";
  var API = window.QSLApi, MAP = window.QSLMap;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var lastHorizons = [], netTimer = null, surgeOn = false;

  document.querySelectorAll(".tab").forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("active"); });
      document.querySelectorAll(".view").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active"); $(b.dataset.v).classList.add("active");
      if (b.dataset.v === "network") startNetwork();
      if (b.dataset.v === "decisions") renderDecisions();
      if (b.dataset.v === "rules") renderRules();
    };
  });
  var toastT; function toast(m) { var t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 2500); }
  function setMode(mode) { var p = $("modePill"); p.className = "pill mode-" + mode; $("modeText").textContent = mode === "live" ? "LIVE · backend aktif" : "DEMO · engine lokal"; }

  // sliders
  $("m_spike").oninput = function () { $("v_spike").textContent = this.value + "%"; };
  $("m_qris").oninput = function () { $("v_qris").textContent = this.value + "%"; };

  /* ---- advisor ---- */
  function metrics() {
    return {
      clusterSpikePct: +$("m_spike").value, partner: $("m_partner").value, partnerBaseTPS: +$("m_base").value, window: $("m_window").value,
      qrisDeclinePct: +$("m_qris").value, atmCount: +$("m_atm").value, lowPerfPct: +$("m_low").value,
      allocPct: +$("m_alloc").value, cbdcYears: +$("m_cbdc").value,
    };
  }
  function generate() {
    API.horizons(metrics()).then(function (res) {
      lastHorizons = res.horizons;
      $("horizonsPane").innerHTML = res.horizons.map(renderHorizon).join("");
      bindHorizonSaves();
    });
  }
  function renderHorizon(h) {
    var v = h.validation;
    return '<div class="horizon ' + h.horizon + '">' +
      '<div class="hh"><div><div class="hz">' + (h.horizon === "short" ? "Jangka Pendek" : h.horizon === "medium" ? "Jangka Menengah" : "Jangka Panjang") + '</div><div class="ht">' + esc(h.title) + '</div></div>' +
      '<span class="verdict ' + v.verdict + '">' + v.verdict + '</span></div>' +
      '<div class="narr">' + esc(h.narrative) + '</div>' +
      '<div class="mx">' + (h.metrics || []).map(function (m) { return '<div class="m">' + esc(m[0]) + '<b>' + esc(m[1]) + '</b></div>'; }).join("") + "</div>" +
      (v.verdict !== "APPROVED" && v.rational_alternative.length ? '<div class="remedy"><div class="lbl">Alternatif rasional</div>' + v.rational_alternative.map(esc).join("<br>") + "</div>" : "") +
      '<div class="row" style="margin-top:10px"><button class="btn ghost sm" data-save=\'' + encodeURIComponent(JSON.stringify(decisionFrom(h))) + '\'>Simpan ke ledger</button></div>' +
      "</div>";
  }
  function decisionFrom(h) { return { id: "D" + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 100), horizon: h.horizon, title: h.title, verdict: h.validation.verdict, score: h.validation.score, narrative: h.narrative, metrics: h.metrics }; }
  function bindHorizonSaves() {
    $("horizonsPane").querySelectorAll("[data-save]").forEach(function (b) { b.onclick = function () { var d = JSON.parse(decodeURIComponent(b.dataset.save)); API.saveDecision(d).then(function () { toast("Tersimpan ke ledger"); refreshStats(); }); }; });
  }
  $("btnGenerate").onclick = generate;
  $("btnSaveAll").onclick = function () { if (!lastHorizons.length) { toast("Hasilkan rekomendasi dulu"); return; } var n = 0; lastHorizons.forEach(function (h) { API.saveDecision(decisionFrom(h)); n++; }); toast(n + " keputusan disimpan"); refreshStats(); };

  /* ---- validator ---- */
  function proposalFromForm() {
    return {
      label: $("p_label").value, type: $("p_label").value,
      tpsRequired: +$("p_tps").value, migrationMonths: +$("p_mig").value, leverageAfter: +$("p_lev").value, slaImpactPct: +$("p_sla").value,
      requiresNewLicense: $("p_lic").value === "true", certificationMonths: +$("p_cert").value, expectedROIpct: +$("p_roi").value, paybackYears: +$("p_pay").value,
    };
  }
  function validate() {
    var p = proposalFromForm();
    API.validate(p).then(function (v) { renderValidation(v, p); });
  }
  function renderValidation(v, p) {
    $("valVerdict").innerHTML = '<span class="verdict ' + v.verdict + '">' + v.verdict + " · " + v.score + "%</span>";
    var html = '<div class="row" style="align-items:center;gap:14px;margin-bottom:12px">' + scoreRing(v.score) +
      '<div><div style="font-weight:700">' + esc(p.label) + '</div><div class="faint" style="font-size:12px">' + v.hard_violations.length + " pelanggaran keras · " + v.soft_violations.length + " peringatan</div></div></div>";
    html += '<div class="checks">' + v.checks.map(function (c) {
      return '<div class="check"><div class="cl">' + esc(c.label) + '<span class="dim">' + c.dimension + "/" + c.severity + '</span></div>' +
        '<div class="cv ' + (c.pass ? "ok" : "bad") + '">' + (c.pass ? "✓ lolos" : "✗ " + esc(c.detail)) + "</div></div>";
    }).join("") + "</div>";
    if (v.rational_alternative.length) html += '<div class="remedy"><div class="lbl">Alternatif rasional (dipaksa oleh validator)</div>' + v.rational_alternative.map(esc).join("<br>") + "</div>";
    html += '<div class="row" style="margin-top:12px"><button class="btn ghost sm" id="btnSaveVal">Simpan verdict ke ledger</button></div>';
    $("validatePane").innerHTML = html;
    $("btnSaveVal").onclick = function () { API.saveDecision({ id: "D" + Date.now().toString(36).toUpperCase(), horizon: "validation", title: p.label, verdict: v.verdict, score: v.score, narrative: v.rational_alternative.join(" ") || "Lolos semua constraint." }).then(function () { toast("Verdict disimpan"); refreshStats(); }); };
  }
  function scoreRing(score) {
    var c = score >= 80 ? "var(--ok)" : score >= 50 ? "var(--cond)" : "var(--rej)";
    var circ = 150.8; var off = circ - circ * score / 100;
    return '<div class="score-ring"><svg width="54" height="54" viewBox="0 0 54 54"><circle cx="27" cy="27" r="24" fill="none" stroke="var(--line2)" stroke-width="5"/><circle cx="27" cy="27" r="24" fill="none" stroke="' + c + '" stroke-width="5" stroke-linecap="round" stroke-dasharray="150.8" stroke-dashoffset="' + off + '"/></svg><div class="sv" style="color:' + c + '">' + score + "</div></div>";
  }
  function fillPresets() {
    API.presets().then(function (presets) {
      $("presetChips").innerHTML = presets.map(function (p, i) { return '<span class="preset-chip" data-i="' + i + '">' + esc(p.label) + "</span>"; }).join("");
      $("presetChips").querySelectorAll("[data-i]").forEach(function (chip) { chip.onclick = function () { loadPreset(presets[+chip.dataset.i]); }; });
    });
  }
  function loadPreset(p) {
    $("p_label").value = p.label; $("p_tps").value = p.tpsRequired || 0; $("p_mig").value = p.migrationMonths || 0;
    $("p_lev").value = p.leverageAfter != null ? p.leverageAfter : 1.5; $("p_sla").value = p.slaImpactPct || 0;
    $("p_lic").value = p.requiresNewLicense ? "true" : "false"; $("p_cert").value = p.certificationMonths || 0;
    $("p_roi").value = p.expectedROIpct != null ? p.expectedROIpct : 15; $("p_pay").value = p.paybackYears != null ? p.paybackYears : 3;
    validate();
  }
  $("btnValidate").onclick = validate;

  /* ---- network ---- */
  function startNetwork() {
    API.network().then(function (n) { MAP.init(n.nodes); MAP.refresh(); tickNetwork(); });
    if (netTimer) clearInterval(netTimer);
    netTimer = setInterval(tickNetwork, 3000);
  }
  function tickNetwork() {
    var surge = surgeOn ? "SW-BDG" : null;
    API.networkLive(undefined, surge, 1400).then(function (d) { MAP.update(d.nodes); $("netTotal").textContent = "total ~" + (d.total || d.nodes.reduce(function (s, x) { return s + x.tps; }, 0)) + " TPS"; });
  }
  $("btnSurge").onclick = function () { surgeOn = !surgeOn; toast(surgeOn ? "Simulasi lonjakan AKTIF (Bandung)" : "Lonjakan dimatikan"); tickNetwork(); };

  /* ---- decisions ---- */
  function renderDecisions() {
    API.listDecisions().then(function (list) {
      if (!list.length) { $("decPane").innerHTML = '<div class="empty">Belum ada keputusan. Simpan dari Advisor atau Validator.</div>'; return; }
      $("decPane").innerHTML = '<table class="tbl"><thead><tr><th>ID</th><th>Horizon</th><th>Judul</th><th>Verdict</th><th>Skor</th><th>Waktu</th><th></th></tr></thead><tbody>' +
        list.map(function (d) { return "<tr><td class='mono'>" + esc(d.id) + "</td><td>" + esc(d.horizon || "") + "</td><td>" + esc(d.title || "") + "</td><td><span class='verdict " + d.verdict + "'>" + d.verdict + "</span></td><td class='mono'>" + (d.score || 0) + "</td><td class='mono' style='font-size:11px'>" + esc(d.ts || "") + "</td><td><button class='btn danger sm' data-del='" + esc(d.id) + "'>×</button></td></tr>"; }).join("") + "</tbody>";
      $("decPane").querySelectorAll("[data-del]").forEach(function (b) { b.onclick = function () { API.deleteDecision(b.dataset.del).then(function () { renderDecisions(); refreshStats(); }); }; });
    });
  }
  $("btnRefreshDec").onclick = renderDecisions;

  /* ---- rules ---- */
  function renderRules() {
    API.rules().then(function (rules) {
      $("tblRules").innerHTML = "<thead><tr><th>ID</th><th>Aturan</th><th>Dimensi</th><th>Tipe</th></tr></thead><tbody>" +
        rules.map(function (r) { return "<tr><td class='mono'>" + esc(r.id) + "</td><td>" + esc(r.label) + "</td><td>" + esc(r.dimension) + "</td><td><span class='verdict " + (r.severity === "hard" ? "REJECTED" : "CONDITIONAL") + "' style='font-size:10px'>" + r.severity + "</span></td></tr>"; }).join("") + "</tbody>";
      $("st_rules").textContent = rules.length;
    });
  }

  function refreshStats() { API.stats().then(function (s) { $("st_dec").textContent = s.total; $("st_appr").textContent = s.approved; $("st_rej").textContent = s.rejected; }); }

  /* ---- boot ---- */
  API.detect().then(function (mode) { setMode(mode); fillPresets(); renderRules(); refreshStats(); generate(); });
})();
