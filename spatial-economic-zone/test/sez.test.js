/* Spatial-Economic Industrial Zone — tests. Author: Christina Apriani. */
"use strict";
const assert = require("assert");
const SEZ = require("../src/sez.js");
const Z = require("../src/zones.js");

let pass = 0, fail = 0;
function t(n, fn) { try { fn(); pass++; console.log("  ✓ " + n); } catch (e) { fail++; console.log("  ✗ " + n + "\n      " + e.message); } }

console.log("\nSpatial-Economic Industrial Zone — knowledge graph advisor");

t("knowledge graph holds 13 zones", () => { assert.strictEqual(Z.ZONES.length, 13); });

t("steel plant is rejected from a zone without deep-sea port", () => {
  const z = Z.byId("MM2100"); // inland, no port
  const v = SEZ.evaluateZone({ powerNeedMW: 200, landNeedHa: 50, needsDeepSeaPort: true }, z);
  assert.strictEqual(v.verdict, "REJECTED");
  assert.ok(v.hard_violations.some((c) => c.id === "port_requirement"));
});

t("steel plant is rejected from a zone without enough power", () => {
  const z = Z.byId("KITB");
  const v = SEZ.evaluateZone({ powerNeedMW: 200, landNeedHa: 50, needsDeepSeaPort: true }, z);
  assert.strictEqual(v.verdict, "REJECTED");
  assert.ok(v.hard_violations.some((c) => c.id === "power_sufficiency"));
});

t("investor matcher recommends a port+power+land zone for heavy industry", () => {
  const m = SEZ.matchInvestor({ name: "Baja", powerNeedMW: 200, landNeedHa: 50, needsDeepSeaPort: true });
  assert.ok(m.recommended, "should recommend a zone");
  const rec = Z.byId(m.recommended);
  assert.ok(rec.deepSeaPort && Z.powerSurplus(rec) >= 200 && rec.landAvailableHa >= 50);
});

t("light manufacturing (no port) can match an inland zone", () => {
  const m = SEZ.matchInvestor({ name: "Elektronik ringan", powerNeedMW: 10, landNeedHa: 5, needsDeepSeaPort: false });
  assert.ok(m.recommended);
});

t("short-term pairs the most critical zone with an investment-ready idle zone", () => {
  const h = SEZ.shortTerm();
  assert.strictEqual(h.focus[0], "SIER"); // highest occupancy
  const target = Z.byId(h.focus[1]);
  assert.ok(target.amdal === "approved" && (target.toll || target.rail), "target must be investment-ready");
  assert.ok(target.occupancyPct < 70, "target should be underutilized");
});

t("medium-term consolidates a real inter-zone supply link with computed fee", () => {
  const h = SEZ.mediumTerm();
  assert.ok(/MM2100/.test(h.narrative) && /bahan baku kimia/.test(h.narrative));
  assert.ok(/jaringan switching nasional/i.test(h.narrative));
});

t("long-term targets zones below the ESG/EBT threshold", () => {
  const h = SEZ.longTerm();
  assert.ok(h.focus.length === 4);
  assert.ok(/Energi Baru Terbarukan|Solar PV/.test(h.narrative));
});

console.log("\n  " + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);
