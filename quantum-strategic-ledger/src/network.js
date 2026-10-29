/* ============================================================================
 * Quantum Strategic Ledger — National Payment Network Topology
 * Author: Christina Apriani
 *
 * Clearing / switching nodes across Indonesia with live interconnection load.
 * Feeds the real-time map and the short-term interconnection advisor. UMD.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.QSLNetwork = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NODES = [
    { id: "DC-JKT", name: "Primary Data Center", city: "Jakarta", lat: -6.2146, lng: 106.8451, role: "primary", shareTPS: 0.42, baseLatency: 8 },
    { id: "DRC-SBY", name: "Disaster Recovery Center", city: "Surabaya", lat: -7.2575, lng: 112.7521, role: "drc", shareTPS: 0.18, baseLatency: 14 },
    { id: "SW-MDN", name: "Regional Switch Sumatra", city: "Medan", lat: 3.5952, lng: 98.6722, role: "regional", shareTPS: 0.1, baseLatency: 22 },
    { id: "SW-BDG", name: "Regional Switch Jabar", city: "Bandung", lat: -6.9175, lng: 107.6191, role: "regional", shareTPS: 0.12, baseLatency: 10 },
    { id: "SW-MKS", name: "Regional Switch Sulawesi", city: "Makassar", lat: -5.1477, lng: 119.4327, role: "regional", shareTPS: 0.08, baseLatency: 26 },
    { id: "SW-DPS", name: "Regional Switch Bali-Nusra", city: "Denpasar", lat: -8.6705, lng: 115.2126, role: "regional", shareTPS: 0.1, baseLatency: 18 },
  ];

  // produce a live snapshot given total load + optional surge on a node
  function liveLoad(totalTPS, surge) {
    surge = surge || {};
    return NODES.map(function (n) {
      var noise = (Math.random() - 0.5) * 0.06;
      var tps = Math.round(totalTPS * (n.shareTPS + noise) + (surge[n.id] || 0));
      var latency = Math.round(n.baseLatency + Math.random() * 6 + (surge[n.id] ? 20 : 0));
      var util = Math.min(100, Math.round((tps / (totalTPS * (n.shareTPS + 0.08))) * 72));
      return { id: n.id, name: n.name, city: n.city, lat: n.lat, lng: n.lng, role: n.role, tps: tps, latency: latency, util: util };
    });
  }
  return { NODES: NODES, liveLoad: liveLoad };
});
