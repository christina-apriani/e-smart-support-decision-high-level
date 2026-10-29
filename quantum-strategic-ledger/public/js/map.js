/* ============================================================================
 * Quantum Strategic Ledger — Live Network Map (Leaflet + OpenStreetMap)
 * Author: Christina Apriani
 * ==========================================================================*/
(function (root) {
  "use strict";
  var map = null, markers = {}, inited = false;
  function color(util, role) {
    if (role === "primary") return "#4d7cff";
    if (role === "drc") return "#30e0d4";
    return util >= 85 ? "#ff4d6d" : util >= 65 ? "#ffb020" : "#2ee6a0";
  }
  function icon(node) {
    var c = color(node.util, node.role);
    var size = node.role === "primary" ? 26 : node.role === "drc" ? 22 : 18;
    return L.divIcon({ className: "node-pin", iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      html: '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:' + (node.role === "regional" ? "50%" : "7px") + ';background:' + c + ';border:2px solid #070a16;box-shadow:0 0 12px ' + c + '"></div>' });
  }
  var M = {
    init: function (nodes) {
      if (inited || typeof L === "undefined") { if (typeof L === "undefined") { var el = document.getElementById("map"); if (el) el.innerHTML = '<div class="empty">Peta tidak dapat dimuat (library offline).</div>'; } return; }
      try {
        map = L.map("map", { zoomControl: true }).setView([-3.0, 118], 5);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);
        var prim = nodes.find(function (n) { return n.role === "primary"; });
        nodes.forEach(function (n) {
          if (prim && n.role !== "primary") L.polyline([[prim.lat, prim.lng], [n.lat, n.lng]], { color: "#28335c", weight: 2, opacity: .6 }).addTo(map);
          markers[n.id] = L.marker([n.lat, n.lng], { icon: icon(Object.assign({ util: 50 }, n)) }).addTo(map).bindPopup("<b>" + n.name + "</b><br>" + n.city);
        });
        inited = true; setTimeout(function () { map.invalidateSize(); }, 200);
      } catch (e) { var el2 = document.getElementById("map"); if (el2) el2.innerHTML = '<div class="empty">Peta tidak dapat dimuat (tile offline). Fungsi lain tetap berjalan.</div>'; }
    },
    refresh: function () { if (map) setTimeout(function () { map.invalidateSize(); }, 150); },
    update: function (nodes) {
      if (!map) return;
      nodes.forEach(function (n) {
        if (markers[n.id]) {
          markers[n.id].setIcon(icon(n));
          markers[n.id].bindPopup("<b>" + n.name + "</b><br>" + n.city + "<br>" + n.tps + " TPS · " + n.latency + " ms · util " + n.util + "%");
        }
      });
    },
  };
  root.QSLMap = M;
})(window);
