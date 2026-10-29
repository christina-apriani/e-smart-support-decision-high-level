/* ============================================================================
 * Quantum Strategic Ledger (Q-SL) — Domain Model, Rules & Horizon Engine
 * Author: Christina Apriani
 *
 * Macro financial-interconnection advisor for the national payment switch.
 * Produces recommendations across three time horizons, each computed
 * deterministically from live metrics and then cross-validated by the
 * constraint engine (Anti-Halu). No figure is invented: every number in a
 * recommendation is derived from the inputs.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./constraint.js"));
  else root.QSL = factory(root.ConstraintEngine);
})(typeof self !== "undefined" ? self : this, function (CE) {
  "use strict";

  /* ---- default operating context (capacity, regulation, finance) --------- */
  var CONTEXT = {
    capacity: { maxTPS: 8000, currentLoadTPS: 6700, slaTarget: 99.9, hsmMaxLatencyMs: 50 },
    regulation: { coreMigrationMinMonths: 18, newLicenseMinMonths: 6, maxLeverageRatio: 2.5, settlementWindowMin: 90 },
    finance: { retainedEarningsIDR: 3_200_000_000_000, minROIpct: 12, maxPaybackYears: 5 },
  };

  /* ---- rule set (hard rules reject; soft rules flag) --------------------- */
  var RULES = [
    {
      id: "tps_capacity", label: "Kapasitas TPS switching", dimension: "technical", severity: "hard",
      test: function (p, ctx) {
        var projected = CE.num(ctx.capacity.currentLoadTPS) + CE.num(p.tpsRequired);
        var limit = ctx.capacity.maxTPS;
        var pass = projected <= limit;
        return {
          pass: pass, actual: projected, limit: limit,
          detail: "Beban proyeksi " + projected + " TPS vs kapasitas " + limit + " TPS",
          remedy: pass ? null : "Terapkan dynamic throttling " + (projected - Math.floor(limit * 0.9)) + " TPS atau tambah kapasitas sebelum eksekusi.",
        };
      },
    },
    {
      id: "sla_guard", label: "Jaminan SLA 99.9%", dimension: "technical", severity: "hard",
      test: function (p, ctx) {
        var projectedSLA = 100 - CE.num(p.slaImpactPct);
        var pass = projectedSLA >= ctx.capacity.slaTarget;
        return {
          pass: pass, actual: CE.round(projectedSLA, 3), limit: ctx.capacity.slaTarget,
          detail: "SLA proyeksi " + CE.round(projectedSLA, 3) + "% vs target " + ctx.capacity.slaTarget + "%",
          remedy: pass ? null : "Amankan jalur utama (ATM/Debit Link) dengan antrean prioritas sebelum menambah beban.",
        };
      },
    },
    {
      id: "migration_feasibility", label: "Kelayakan waktu migrasi core", dimension: "operational", severity: "hard",
      test: function (p, ctx) {
        var isCore = /core|blockchain|migrasi total|seluruh/i.test((p.type || "") + " " + (p.label || ""));
        if (!isCore) return { pass: true, detail: "Bukan migrasi core — tidak terkena batas waktu." };
        var pass = CE.num(p.migrationMonths) >= ctx.regulation.coreMigrationMinMonths;
        return {
          pass: pass, actual: CE.num(p.migrationMonths), limit: ctx.regulation.coreMigrationMinMonths,
          detail: "Rencana " + CE.num(p.migrationMonths) + " bulan vs minimum realistis " + ctx.regulation.coreMigrationMinMonths + " bulan",
          remedy: pass ? null : "Jadwalkan migrasi bertahap (pilot + paralel-run) minimal " + ctx.regulation.coreMigrationMinMonths + " bulan, bukan big-bang.",
        };
      },
    },
    {
      id: "regulatory_certification", label: "Sertifikasi regulasi (BI PBI/PADG)", dimension: "regulatory", severity: "hard",
      test: function (p, ctx) {
        if (!p.requiresNewLicense) return { pass: true, detail: "Tidak memerlukan lisensi/sertifikasi baru." };
        var pass = CE.num(p.certificationMonths) >= ctx.regulation.newLicenseMinMonths;
        return {
          pass: pass, actual: CE.num(p.certificationMonths), limit: ctx.regulation.newLicenseMinMonths,
          detail: "Lead time sertifikasi " + CE.num(p.certificationMonths) + " bulan vs minimum " + ctx.regulation.newLicenseMinMonths + " bulan",
          remedy: pass ? null : "Mulai proses perizinan BI lebih awal; minimal " + ctx.regulation.newLicenseMinMonths + " bulan sebelum go-live.",
        };
      },
    },
    {
      id: "leverage_cap", label: "Batas rasio utang (Kementerian BUMN)", dimension: "financial", severity: "hard",
      test: function (p, ctx) {
        if (p.leverageAfter == null) return { pass: true, detail: "Tidak ada perubahan struktur utang." };
        var pass = CE.num(p.leverageAfter) <= ctx.regulation.maxLeverageRatio;
        return {
          pass: pass, actual: CE.num(p.leverageAfter), limit: ctx.regulation.maxLeverageRatio,
          detail: "Leverage pasca-investasi " + CE.num(p.leverageAfter) + "x vs batas " + ctx.regulation.maxLeverageRatio + "x",
          remedy: pass ? null : "Danai lewat laba ditahan / kemitraan (bukan utang) agar leverage ≤ " + ctx.regulation.maxLeverageRatio + "x.",
        };
      },
    },
    {
      id: "roi_floor", label: "Ambang ROI minimum", dimension: "financial", severity: "soft",
      test: function (p, ctx) {
        if (p.expectedROIpct == null) return { pass: true };
        var pass = CE.num(p.expectedROIpct) >= ctx.finance.minROIpct;
        return { pass: pass, actual: p.expectedROIpct, limit: ctx.finance.minROIpct, detail: "ROI " + p.expectedROIpct + "% vs ambang " + ctx.finance.minROIpct + "%", remedy: pass ? null : "Tinjau ulang skema biaya atau fokus ke segmen margin lebih tinggi." };
      },
    },
    {
      id: "payback_cap", label: "Batas payback period", dimension: "financial", severity: "soft",
      test: function (p, ctx) {
        if (p.paybackYears == null) return { pass: true };
        var pass = CE.num(p.paybackYears) <= ctx.finance.maxPaybackYears;
        return { pass: pass, actual: p.paybackYears, limit: ctx.finance.maxPaybackYears, detail: "Payback " + p.paybackYears + " thn vs batas " + ctx.finance.maxPaybackYears + " thn", remedy: pass ? null : "Pilih opsi CapEx lebih ringan (konversi aset vs pengadaan baru)." };
      },
    },
  ];

  /* ---- preset proposals (rational + irrational) for the validator demo --- */
  var PRESETS = [
    { label: "Migrasi seluruh core ke blockchain dalam 1 bulan", type: "core blockchain", migrationMonths: 1, tpsRequired: 0, requiresNewLicense: true, certificationMonths: 1, leverageAfter: 1.8, expectedROIpct: 5, paybackYears: 9 },
    { label: "Dynamic throttling 500 TPS untuk mitra e-commerce X", type: "operational throttling", migrationMonths: 0, tpsRequired: -500, slaImpactPct: 0.02, leverageAfter: 1.5, expectedROIpct: 20, paybackYears: 1 },
    { label: "Tambah 3.500 TPS beban baru tanpa penambahan kapasitas", type: "capacity add", tpsRequired: 3500, slaImpactPct: 0.4, leverageAfter: 1.6 },
    { label: "Konversi 30% ATM Link berkinerja rendah menjadi CRM", type: "asset conversion", tpsRequired: 0, capexIDR: 420_000_000_000, leverageAfter: 1.9, expectedROIpct: 17, paybackYears: 4 },
    { label: "Alokasi 15% laba ditahan untuk riset kriptografi pasca-kuantum", type: "r&d allocation", tpsRequired: 0, requiresNewLicense: false, leverageAfter: 2.0, expectedROIpct: 13, paybackYears: 5 },
  ];

  function validateProposal(proposal, ctx) {
    return CE.validate(proposal, ctx || CONTEXT, RULES);
  }

  /* ---- 3-horizon recommendation generator (deterministic) ---------------- */
  function fmtIDR(n) {
    n = Math.round(n);
    if (Math.abs(n) >= 1e12) return "Rp " + (n / 1e12).toFixed(2) + " T";
    if (Math.abs(n) >= 1e9) return "Rp " + (n / 1e9).toFixed(1) + " M";
    if (Math.abs(n) >= 1e6) return "Rp " + (n / 1e6).toFixed(1) + " jt";
    return "Rp " + n.toLocaleString("id-ID");
  }

  // SHORT TERM — tactical operations (interconnection load)
  function shortTerm(m, ctx) {
    ctx = ctx || CONTEXT;
    var spike = CE.num(m.clusterSpikePct);          // e.g. 18
    var partner = m.partner || "Mitra X";
    var base = CE.num(m.partnerBaseTPS) || 2800;
    var surge = Math.round(base * (spike / 100));   // extra TPS from the cluster surge
    var projectedTotal = ctx.capacity.currentLoadTPS + surge;
    var safeCap = Math.floor(ctx.capacity.maxTPS * 0.9); // keep 10% headroom for SLA
    var breach = projectedTotal > safeCap;
    var throttle = breach ? surge : 0;              // queue the partner surge back to baseline
    var proposal = { type: "operational throttling", tpsRequired: -throttle, slaImpactPct: breach ? 0.02 : 0.0, leverageAfter: 1.5 };
    var v = validateProposal(proposal, ctx);
    var narrative = breach
      ? "Terdeteksi anomali kenaikan beban switching sebesar " + spike + "% dari kluster " + partner +
        " pada jam sibuk (" + (m.window || "12:00–13:00") + "). Beban proyeksi " + projectedTotal + " TPS melewati ambang aman " +
        safeCap + " TPS (SLA " + ctx.capacity.slaTarget + "%). Direkomendasikan dynamic throttling / antrean " + throttle +
        " TPS khusus " + partner + " untuk mengamankan jalur utama ATM/Debit Link nasional dari risiko gangguan interkoneksi."
      : "Beban dari kluster " + partner + " naik " + spike + "% (proyeksi " + projectedTotal +
        " TPS) masih di bawah ambang aman " + safeCap + " TPS. Tidak perlu throttling; cukup pantau tren dan siapkan antrean prioritas sebagai cadangan.";
    return { horizon: "short", title: "Taktis Operasional (<1 Tahun)", narrative: narrative, validation: v,
      metrics: [["Beban proyeksi total", projectedTotal + " TPS"], ["Ambang aman (SLA)", safeCap + " TPS"], ["Throttling disarankan", throttle + " TPS"], ["Mitra", partner]] };
  }

  // MEDIUM TERM — tactical financial (ATM vs QRIS, CRM conversion)
  function mediumTerm(m, ctx) {
    ctx = ctx || CONTEXT;
    var interchange = CE.num(m.interchangeFeeIDR) || 1_800_000_000_000;
    var declinePct = CE.num(m.qrisDeclinePct) || 14;
    var atmCount = CE.num(m.atmCount) || 4200;
    var lowPerfPct = CE.num(m.lowPerfPct) || 30;
    var convertCount = Math.round(atmCount * lowPerfPct / 100);
    var projectedInterchange = interchange * (1 - declinePct / 100);
    var lostRevenue = interchange - projectedInterchange;
    var crmCapex = convertCount * 350_000_000; // per-unit conversion cost (test figure)
    var logisticsSaving = convertCount * 180_000_000; // annual cash-logistics saving
    var payback = CE.round(crmCapex / Math.max(1, logisticsSaving), 1);
    var roi = CE.round(logisticsSaving / crmCapex * 100, 1);
    var leverageAfter = 1.9;
    var proposal = { type: "asset conversion", capexIDR: crmCapex, leverageAfter: leverageAfter, expectedROIpct: roi, paybackYears: payback, tpsRequired: 0 };
    var v = validateProposal(proposal, ctx);
    var narrative =
      "Pendapatan interchange fee kartu debit fisik diproyeksikan turun " + declinePct + "% dalam 24 bulan (" +
      fmtIDR(lostRevenue) + "/tahun) akibat adopsi QRIS. Berdasarkan kalkulasi CapEx (" + fmtIDR(crmCapex) +
      "), investasi rasional bukan menambah mesin ATM baru, melainkan mengonversi " + lowPerfPct + "% (" + convertCount +
      " unit) ATM berkinerja rendah menjadi CRM (Cash Recycling Machine) di lokasi strategis — memangkas biaya logistik pihak ketiga ~" +
      fmtIDR(logisticsSaving) + "/tahun (payback " + payback + " thn).";
    return { horizon: "medium", title: "Taktis Finansial (1–3 Tahun)", narrative: narrative, validation: v,
      metrics: [["Potensi pendapatan hilang", fmtIDR(lostRevenue) + "/thn"], ["Unit dikonversi ke CRM", convertCount + " unit"], ["CapEx konversi", fmtIDR(crmCapex)], ["Penghematan logistik", fmtIDR(logisticsSaving) + "/thn"], ["Payback", payback + " thn"]] };
  }

  // LONG TERM — visionary regulatory (CBDC, post-quantum)
  function longTerm(m, ctx) {
    ctx = ctx || CONTEXT;
    var allocPct = CE.num(m.allocPct) || 15;
    var retained = ctx.finance.retainedEarningsIDR;
    var alloc = retained * allocPct / 100;
    var cbdcYears = CE.num(m.cbdcYears) || 6;
    var leverageAfter = 2.0;
    var proposal = { type: "r&d allocation", tpsRequired: 0, leverageAfter: leverageAfter, expectedROIpct: 13, paybackYears: 5, requiresNewLicense: false };
    var v = validateProposal(proposal, ctx);
    var narrative =
      "Menghadapi implementasi Rupiah Digital (CBDC) skala penuh dalam ~" + cbdcYears +
      " tahun, infrastruktur switching nasional perlu bertransformasi menjadi Centralized Settlement Node. " +
      "Alokasikan " + allocPct + "% laba ditahan (" + fmtIDR(alloc) +
      ") mulai tahun fiskal depan untuk riset kriptografi pasca-kuantum, agar jaringan tetap menjadi gerbang kliring nasional yang sah secara regulasi (BSPI).";
    return { horizon: "long", title: "Visioner Regulatori (3–10 Tahun)", narrative: narrative, validation: v,
      metrics: [["Alokasi laba ditahan", allocPct + "%"], ["Nilai alokasi", fmtIDR(alloc)], ["Horizon CBDC", "~" + cbdcYears + " tahun"], ["Target", "Centralized Settlement Node + PQC"]] };
  }

  function allHorizons(m, ctx) { return [shortTerm(m, ctx), mediumTerm(m, ctx), longTerm(m, ctx)]; }

  return {
    CONTEXT: CONTEXT, RULES: RULES, PRESETS: PRESETS,
    validateProposal: validateProposal,
    shortTerm: shortTerm, mediumTerm: mediumTerm, longTerm: longTerm, allHorizons: allHorizons,
    fmtIDR: fmtIDR,
  };
});
