/* ============================================================================
 * Spatial-Economic Industrial Zone — Interactive Map (Leaflet + OSM)
 * Author: Christina Apriani
 * ==========================================================================*/
(function (root) {
  "use strict";
  var map = null, markers = {}, inited = false, onClick = null, highlights = [];
  function color(z) { return z.occupancyPct > 90 ? "#ff5a6a" : z.occupancyPct >= 60 ? "#ffb020" : "#46d08a"; }
  function icon(z, focused) {
    var c = color(z);
    var size = focused ? 26 : 18 + Math.round((100 - z.occupancyPct) / 12);
    var ring = z.deepSeaPort ? "box-shadow:0 0 0 2px #27c6b0, 0 0 12px " + c + ";" : "box-shadow:0 0 12px " + c + ";";
    return L.divIcon({ className: "zone-pin", iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      html: '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + c + ';border:2px solid #061009;' + ring + (focused ? "animation:zpulse 1.2s infinite;" : "") + '"></div>' });
  }
  var M = {
    init: function (zones, clickCb) {
      onClick = clickCb;
      if (inited || typeof L === "undefined") { if (typeof L === "undefined") { var el = document.getElementById("map-el"); if (el) el.innerHTML = '<div class="empty">Peta tidak dapat dimuat (library offline).</div>'; } return; }
      try {
        map = L.map("map-el", { zoomControl: true }).setView([-2.6, 117], 5);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);
        zones.forEach(function (z) {
          var mk = L.marker([z.lat, z.lng], { icon: icon(z, false) }).addTo(map)
            .bindPopup("<b>" + z.name + "</b><br>" + z.city + "<br>Okupansi " + z.occupancyPct + "% · Surplus " + (z.powerCapacityMW - z.powerUsedMW) + " MW" + (z.deepSeaPort ? "<br>Pelabuhan: " + z.port : "<br>Tanpa pelabuhan laut dalam"));
          mk.on("click", function () { if (onClick) onClick(z.id); });
          markers[z.id] = mk; markers[z.id]._zone = z;
        });
        inited = true; setTimeout(function () { map.invalidateSize(); }, 200);
      } catch (e) { var el2 = document.getElementById("map-el"); if (el2) el2.innerHTML = '<div class="empty">Peta tidak dapat dimuat (tile offline). Fungsi lain tetap berjalan.</div>'; }
    },
    refresh: function () { if (map) setTimeout(function () { map.invalidateSize(); }, 150); },
    focus: function (ids) {
      if (!map) return;
      highlights = ids || [];
      Object.keys(markers).forEach(function (id) { markers[id].setIcon(icon(markers[id]._zone, highlights.indexOf(id) >= 0)); });
      if (highlights.length) { var z = markers[highlights[0]]._zone; map.panTo([z.lat, z.lng]); }
    },
    open: function (id) { if (markers[id]) markers[id].openPopup(); },
  };
  var style = document.createElement("style"); style.textContent = "@keyframes zpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}"; document.head.appendChild(style);
  root.SEZMap = M;
})(window);
