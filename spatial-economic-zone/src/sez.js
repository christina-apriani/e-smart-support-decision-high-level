/* ============================================================================
 * Spatial-Economic Industrial Zone — Advisor Engine
 * Author: Christina Apriani
 *
 * Constraint-validated investor matching + 3-horizon portfolio recommendations
 * across the 13 zones. The engine is locked to the geospatial & fiscal
 * knowledge graph: it cannot place an industry in a zone that lacks the land,
 * power, port, or fiscal headroom it needs. Every figure is computed. UMD.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./constraint.js"), require("./zones.js"));
  else root.SEZ = factory(root.ConstraintEngine, root.SEZZones);
})(typeof self !== "undefined" ? self : this, function (CE, Z) {
  "use strict";

  var CONTEXT = { maxLeverage: 2.5, esgEbtThreshold: 25, feeRatePct: 4.0, criticalOccupancy: 90 };

  /* ---- investor-matching rules (per candidate zone) ---------------------- */
  var ZONE_RULES = [
    {
      id: "power_sufficiency", label: "Kapasitas daya PLN mencukupi", dimension: "infrastructure", severity: "hard",
      test: function (req, z) {
        var surplus = Z.powerSurplus(z);
        var pass = surplus >= CE.num(req.powerNeedMW);
        return { pass: pass, actual: surplus, limit: req.powerNeedMW, detail: "Surplus daya " + surplus + " MW vs kebutuhan " + CE.num(req.powerNeedMW) + " MW", remedy: pass ? null : "Arahkan ke kawasan dengan surplus daya ≥ " + CE.num(req.powerNeedMW) + " MW (mis. kawasan berkapasitas besar)." };
      },
    },
    {
      id: "land_sufficiency", label: "Ketersediaan lahan (HPL/HGB)", dimension: "land", severity: "hard",
      test: function (req, z) {
        var pass = z.landAvailableHa >= CE.num(req.landNeedHa);
        return { pass: pass, actual: z.landAvailableHa, limit: req.landNeedHa, detail: "Lahan tersedia " + z.landAvailableHa + " ha vs kebutuhan " + CE.num(req.landNeedHa) + " ha", remedy: pass ? null : "Pilih kawasan dengan lahan menganggur ≥ " + CE.num(req.landNeedHa) + " ha." };
      },
    },
    {
      id: "port_requirement", label: "Akses pelabuhan laut dalam", dimension: "logistics", severity: "hard",
      test: function (req, z) {
        if (!req.needsDeepSeaPort) return { pass: true, detail: "Tidak memerlukan pelabuhan laut dalam." };
        var pass = !!z.deepSeaPort;
        return { pass: pass, actual: z.deepSeaPort ? z.port : "tidak ada", limit: "wajib", detail: pass ? "Pelabuhan: " + z.port : "Tidak ada akses pelabuhan laut dalam", remedy: pass ? null : "Industri berat/ekspor memerlukan kawasan ber-pelabuhan laut dalam." };
      },
    },
    {
      id: "amdal_status", label: "Status AMDAL", dimension: "regulatory", severity: "soft",
      test: function (req, z) {
        var pass = z.amdal === "approved";
        return { pass: pass, actual: z.amdal, limit: "approved", detail: "AMDAL: " + z.amdal, remedy: pass ? null : "Selesaikan/mutakhirkan AMDAL sebelum konstruksi skala penuh." };
      },
    },
    {
      id: "leverage_cap", label: "Rasio utang holding (Kementerian BUMN)", dimension: "financial", severity: "soft",
      test: function (req, z) {
        var pass = z.leverage <= CONTEXT.maxLeverage;
        return { pass: pass, actual: z.leverage, limit: CONTEXT.maxLeverage, detail: "Leverage kawasan " + z.leverage + "x vs batas " + CONTEXT.maxLeverage + "x", remedy: pass ? null : "Danai ekspansi via kemitraan, bukan utang, agar leverage ≤ " + CONTEXT.maxLeverage + "x." };
      },
    },
  ];

  function evaluateZone(req, z) {
    return CE.validate(req, z, ZONE_RULES);
  }

  // match an investor requirement across all zones -> ranked list
  function matchInvestor(req) {
    var results = Z.ZONES.map(function (z) {
      var v = evaluateZone(req, z);
      var headroom = Z.powerSurplus(z) + z.landAvailableHa + (100 - z.occupancyPct) * 5; // utilisation potential
      return { zone: z, validation: v, fit: v.verdict === "APPROVED" ? headroom : v.verdict === "CONDITIONAL" ? headroom * 0.5 : -1 };
    });
    results.sort(function (a, b) { return b.fit - a.fit; });
    var best = results.find(function (r) { return r.validation.verdict !== "REJECTED"; }) || null;
    return { requirement: req, results: results, recommended: best ? best.zone.id : null };
  }

  /* ---- 3-horizon recommendations ---------------------------------------- */
  function fmtIDR(n) {
    n = Math.round(n);
    if (Math.abs(n) >= 1e12) return "Rp " + (n / 1e12).toFixed(2) + " T";
    if (Math.abs(n) >= 1e9) return "Rp " + (n / 1e9).toFixed(0) + " Miliar";
    if (Math.abs(n) >= 1e6) return "Rp " + (n / 1e6).toFixed(0) + " jt";
    return "Rp " + n.toLocaleString("id-ID");
  }

  // SHORT — asset utilization: redirect incentives from critical to idle zone
  function shortTerm() {
    var byOcc = Z.ZONES.slice().sort(function (a, b) { return b.occupancyPct - a.occupancyPct; });
    var critical = byOcc[0];
    // Idle target must be investment-ready (AMDAL approved + toll/rail access),
    // then prefer the lowest occupancy with real power/land headroom.
    var ready = Z.ZONES.filter(function (z) { return z.id !== critical.id && z.amdal === "approved" && (z.toll || z.rail) && Z.powerSurplus(z) > 20; });
    var pool = ready.length ? ready : Z.ZONES.filter(function (z) { return z.id !== critical.id; });
    var target = pool.sort(function (a, b) {
      var sa = a.occupancyPct - Z.powerSurplus(a) / 20 - a.landAvailableHa / 500;
      var sb = b.occupancyPct - Z.powerSurplus(b) / 20 - b.landAvailableHa / 500;
      return sa - sb;
    })[0];
    var surplus = Z.powerSurplus(target);
    var narrative =
      "Kawasan " + critical.name + " (" + critical.city + ") sudah mencapai okupansi " + critical.occupancyPct +
      "% (kritis, lahan sisa " + critical.landAvailableHa + " ha), sementara " + target.name + " (" + target.city +
      ") baru " + target.occupancyPct + "% namun memiliki kelebihan pasokan listrik " + surplus + " MW dan lahan menganggur " +
      target.landAvailableHa + " ha. Jika ada investor manufaktur baru masuk, Direksi Holding harus mengarahkan insentif investasi ke " +
      target.name + " guna mempercepat utilisasi aset menganggur dan menekan beban biaya operasional tetap holding.";
    return { horizon: "short", title: "Sinergi & Utilisasi Aset (<1 Tahun)", narrative: narrative,
      metrics: [["Kawasan kritis", critical.name + " · " + critical.occupancyPct + "%"], ["Target realokasi", target.name + " · " + target.occupancyPct + "%"], ["Surplus daya target", surplus + " MW"], ["Lahan menganggur target", target.landAvailableHa + " ha"]],
      focus: [critical.id, target.id] };
  }

  // MEDIUM — logistics consolidation + B2B payment fee income
  function mediumTerm() {
    var totalValue = Z.SUPPLY_LINKS.reduce(function (s, l) { return s + l.annualValueIDR; }, 0);
    var tenants = Z.SUPPLY_LINKS.reduce(function (s, l) { return s + l.tenantsBuying; }, 0);
    var fee = totalValue * CONTEXT.feeRatePct / 100;
    var main = Z.SUPPLY_LINKS.slice().sort(function (a, b) { return b.annualValueIDR - a.annualValueIDR; })[0];
    var fromZ = Z.byId(main.from), toZ = Z.byId(main.to);
    var narrative =
      "Analisis rantai pasok menunjukkan " + main.tenantsBuying + " tenant di " + toZ.name + " (" + toZ.city +
      ") membeli " + main.material + " yang diproduksi tenant di " + fromZ.name + " (" + fromZ.city +
      "), namun logistiknya memakai vendor luar secara eceran. Direkomendasikan memfasilitasi kontrak logistik bersama (konsolidasi kargo) antarkawasan dan memproses pembayaran B2B-nya melalui jaringan switching nasional — menciptakan fee-based income baru bagi holding sekitar " +
      fmtIDR(fee) + "/tahun dari total arus transaksi " + fmtIDR(totalValue) + " (" + tenants + " tenant lintas kawasan).";
    return { horizon: "medium", title: "Penggabungan & Sinergi Logistik (1–3 Tahun)", narrative: narrative,
      metrics: [["Arus B2B lintas kawasan", fmtIDR(totalValue) + "/thn"], ["Tenant terlibat", tenants + " tenant"], ["Blended fee rate", CONTEXT.feeRatePct + "%"], ["Potensi fee income", fmtIDR(fee) + "/thn"]],
      focus: [main.from, main.to] };
  }

  // LONG — ESG / EIP conversion to renewable energy
  function longTerm() {
    var below = Z.ZONES.filter(function (z) { return z.ebtPct < CONTEXT.esgEbtThreshold; });
    // pick 4 strategic (largest, port-access) for conversion
    var convert = below.slice().sort(function (a, b) { return b.landTotalHa - a.landTotalHa; }).slice(0, 4);
    var names = convert.map(function (z) { return z.name; }).join(", ");
    var narrative =
      "Hingga 2030, ~70% perusahaan multinasional bersertifikasi ESG hanya akan menyewa lahan di kawasan industri rendah emisi. " +
      "Saat ini " + below.length + " dari 13 kawasan masih di bawah ambang EBT " + CONTEXT.esgEbtThreshold +
      "%. Opsi paling logis mempertahankan daya saing terhadap Vietnam adalah konversi bertahap 4 kawasan utama (" + names +
      ") menjadi berbasis Energi Baru Terbarukan melalui skema penyewaan atap pabrik untuk Solar PV bersama pihak ketiga — meminimalkan CapEx tunai langsung holding.";
    return { horizon: "long", title: "Peta Kompetisi Global & Keberlanjutan (3–10 Tahun)", narrative: narrative,
      metrics: [["Kawasan di bawah ambang EBT", below.length + " / 13"], ["Target konversi tahap-1", "4 kawasan"], ["Skema", "Sewa atap · Solar PV pihak ketiga"], ["Dampak CapEx holding", "minimal (off-balance)"]],
      focus: convert.map(function (z) { return z.id; }) };
  }

  function allHorizons() { return [shortTerm(), mediumTerm(), longTerm()]; }

  return { CONTEXT: CONTEXT, ZONE_RULES: ZONE_RULES, evaluateZone: evaluateZone, matchInvestor: matchInvestor, shortTerm: shortTerm, mediumTerm: mediumTerm, longTerm: longTerm, allHorizons: allHorizons, fmtIDR: fmtIDR };
});
