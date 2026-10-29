/* ============================================================================
 * E-Smart Support Decision High Level — Constraint Validation Engine
 * Author: Christina Apriani
 *
 * The "Anti-Halu" core. Every recommendation or proposal is cross-validated,
 * mathematically, against a domain rule set (regulation, technical capacity,
 * financial model). A proposal that violates a hard rule is REJECTED with the
 * exact figure that broke it, and the engine returns a rational alternative.
 *
 * Deterministic and explainable: identical input always yields identical
 * verdict. Shared, byte-for-byte, by the Node backend and the browser (UMD).
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ConstraintEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function num(v) { return typeof v === "number" && isFinite(v) ? v : 0; }
  function pct(part, whole) { return whole ? (part / whole) * 100 : 0; }
  function round(n, d) { var f = Math.pow(10, d || 0); return Math.round(n * f) / f; }

  /* Run a proposal against a rule set.
   * proposal : plain object of fields describing the idea
   * ctx      : context (capacity limits, regulation, financial baselines)
   * rules    : [{ id, label, severity:'hard'|'soft', dimension, test(p,ctx) }]
   *   test returns { pass, detail, actual, limit, remedy }
   */
  function validate(proposal, ctx, rules) {
    var checks = (rules || []).map(function (r) {
      var res;
      try { res = r.test(proposal, ctx) || { pass: true }; }
      catch (e) { res = { pass: false, detail: "rule error: " + e.message }; }
      return {
        id: r.id, label: r.label, dimension: r.dimension || "general",
        severity: r.severity || "hard", pass: !!res.pass,
        detail: res.detail || "", actual: res.actual, limit: res.limit, remedy: res.remedy || null,
      };
    });
    var hardFails = checks.filter(function (c) { return !c.pass && c.severity === "hard"; });
    var softFails = checks.filter(function (c) { return !c.pass && c.severity === "soft"; });
    var verdict = hardFails.length ? "REJECTED" : softFails.length ? "CONDITIONAL" : "APPROVED";
    var score = checks.length ? Math.round((checks.filter(function (c) { return c.pass; }).length / checks.length) * 100) : 100;
    var remedies = [];
    hardFails.concat(softFails).forEach(function (c) { if (c.remedy && remedies.indexOf(c.remedy) < 0) remedies.push(c.remedy); });
    return {
      verdict: verdict, score: score, checks: checks,
      hard_violations: hardFails, soft_violations: softFails,
      rational_alternative: remedies,
      dimensions: summarizeDimensions(checks),
      evaluated_at: new Date().toISOString(),
      engine: "Christina Apriani / Constraint Validator v1",
    };
  }

  function summarizeDimensions(checks) {
    var d = {};
    checks.forEach(function (c) {
      if (!d[c.dimension]) d[c.dimension] = { total: 0, passed: 0 };
      d[c.dimension].total++; if (c.pass) d[c.dimension].passed++;
    });
    return d;
  }

  return { validate: validate, num: num, pct: pct, round: round };
});
