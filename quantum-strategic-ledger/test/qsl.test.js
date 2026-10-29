/* Quantum Strategic Ledger — tests. Author: Christina Apriani. */
"use strict";
const assert = require("assert");
const QSL = require("../src/qsl.js");

let pass = 0, fail = 0;
function t(n, fn) { try { fn(); pass++; console.log("  ✓ " + n); } catch (e) { fail++; console.log("  ✗ " + n + "\n      " + e.message); } }

console.log("\nQuantum Strategic Ledger — Anti-Halu validator");

t("rejects 'migrate core to blockchain in 1 month'", () => {
  const p = QSL.PRESETS.find((x) => /blockchain/i.test(x.label));
  const v = QSL.validateProposal(p);
  assert.strictEqual(v.verdict, "REJECTED");
  assert.ok(v.hard_violations.some((c) => c.id === "migration_feasibility"));
  assert.ok(v.rational_alternative.length > 0, "should return a rational alternative");
});

t("rejects over-capacity TPS add with exact figure", () => {
  const p = QSL.PRESETS.find((x) => /3\.?500 TPS/i.test(x.label));
  const v = QSL.validateProposal(p);
  assert.strictEqual(v.verdict, "REJECTED");
  const cap = v.hard_violations.find((c) => c.id === "tps_capacity");
  const expected = QSL.CONTEXT.capacity.currentLoadTPS + 3500;
  assert.ok(cap && cap.actual === expected && cap.limit === 8000, "actual " + (cap && cap.actual) + " expected " + expected);
});

t("approves rational dynamic throttling", () => {
  const p = QSL.PRESETS.find((x) => /throttling 500 TPS/i.test(x.label));
  assert.strictEqual(QSL.validateProposal(p).verdict, "APPROVED");
});

t("leverage cap blocks debt-funded proposal beyond 2.5x", () => {
  const v = QSL.validateProposal({ type: "expansion", leverageAfter: 3.1 });
  assert.strictEqual(v.verdict, "REJECTED");
  assert.ok(v.hard_violations.some((c) => c.id === "leverage_cap"));
});

t("short-term horizon computes throttle from a real surge", () => {
  const h = QSL.shortTerm({ clusterSpikePct: 18, partner: "Mitra X", partnerBaseTPS: 2800 });
  assert.strictEqual(h.validation.verdict, "APPROVED");
  assert.ok(/504 TPS/.test(h.narrative), "throttle figure should be computed (504)");
});

t("medium-term horizon converts ATMs with computed payback", () => {
  const h = QSL.mediumTerm({ qrisDeclinePct: 14, atmCount: 4200, lowPerfPct: 30 });
  assert.ok(/1260 unit/.test(h.narrative), "should convert 1260 units");
  assert.strictEqual(h.validation.verdict, "APPROVED");
});

t("long-term allocates retained earnings within leverage", () => {
  const h = QSL.longTerm({ allocPct: 15, cbdcYears: 6 });
  assert.ok(/Centralized Settlement Node/.test(h.narrative));
  assert.notStrictEqual(h.validation.verdict, "REJECTED");
});

t("identical input yields identical verdict (deterministic)", () => {
  const p = { type: "x", tpsRequired: 1000, slaImpactPct: 0.05, leverageAfter: 2.0 };
  assert.strictEqual(JSON.stringify(QSL.validateProposal(p).checks), JSON.stringify(QSL.validateProposal(p).checks));
});

console.log("\n  " + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);
