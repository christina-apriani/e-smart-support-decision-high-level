/* ============================================================================
 * Spatial-Economic Industrial Zone — Geospatial & Fiscal Knowledge Graph
 * Author: Christina Apriani
 *
 * The 13 industrial zones with the attributes the advisor is locked to: land
 * availability (HPL/HGB), PLN power capacity & surplus, deep-sea port access,
 * AMDAL status, leverage ratio, occupancy, sector, and inter-zone supply links.
 * No recommendation can ignore these constraints. Shared via UMD.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SEZZones = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // land in hectares; power in MW; leverage ratio (x).
  var ZONES = [
    { id: "SIER", name: "KI SIER", city: "Surabaya", lat: -7.3297, lng: 112.7510, occupancyPct: 96, landTotalHa: 330, landAvailableHa: 13, powerCapacityMW: 120, powerUsedMW: 112, deepSeaPort: true, port: "Tanjung Perak", amdal: "approved", leverage: 1.6, sector: "Manufaktur campuran", tenants: 310, ebtPct: 8, rail: true, toll: true },
    { id: "KITB", name: "KIT Batang (Industropolis)", city: "Batang", lat: -6.9445, lng: 109.7308, occupancyPct: 45, landTotalHa: 4300, landAvailableHa: 2365, powerCapacityMW: 180, powerUsedMW: 100, deepSeaPort: true, port: "Pelabuhan Batang", amdal: "approved", leverage: 1.3, sector: "Elektronik & hijau", tenants: 28, ebtPct: 35, rail: true, toll: true },
    { id: "MM2100", name: "KI MM2100", city: "Bekasi", lat: -6.3092, lng: 107.0760, occupancyPct: 92, landTotalHa: 1200, landAvailableHa: 96, powerCapacityMW: 230, powerUsedMW: 212, deepSeaPort: false, port: null, amdal: "approved", leverage: 1.7, sector: "Otomotif & elektronik", tenants: 220, ebtPct: 6, rail: false, toll: true },
    { id: "KIEC", name: "KI Krakatau (KIEC)", city: "Cilegon", lat: -6.0129, lng: 106.0540, occupancyPct: 85, landTotalHa: 570, landAvailableHa: 85, powerCapacityMW: 400, powerUsedMW: 330, deepSeaPort: true, port: "Cigading", amdal: "approved", leverage: 2.1, sector: "Baja & kimia", tenants: 110, ebtPct: 10, rail: true, toll: true },
    { id: "KIM", name: "KI Medan (KIM)", city: "Medan", lat: 3.6957, lng: 98.6680, occupancyPct: 88, landTotalHa: 780, landAvailableHa: 94, powerCapacityMW: 160, powerUsedMW: 142, deepSeaPort: true, port: "Belawan", amdal: "approved", leverage: 1.8, sector: "Kimia & sawit", tenants: 135, ebtPct: 7, rail: false, toll: true },
    { id: "JIEP", name: "KI Pulogadung (JIEP)", city: "Jakarta", lat: -6.1889, lng: 106.9120, occupancyPct: 93, landTotalHa: 500, landAvailableHa: 35, powerCapacityMW: 140, powerUsedMW: 130, deepSeaPort: false, port: null, amdal: "approved", leverage: 1.5, sector: "Manufaktur ringan", tenants: 380, ebtPct: 5, rail: true, toll: true },
    { id: "KIIC", name: "KI Karawang (KIIC)", city: "Karawang", lat: -6.3550, lng: 107.2960, occupancyPct: 90, landTotalHa: 1400, landAvailableHa: 140, powerCapacityMW: 250, powerUsedMW: 225, deepSeaPort: false, port: null, amdal: "approved", leverage: 1.7, sector: "Otomotif", tenants: 180, ebtPct: 9, rail: false, toll: true },
    { id: "KIK", name: "KI Kendal", city: "Kendal", lat: -6.9210, lng: 110.2060, occupancyPct: 55, landTotalHa: 1000, landAvailableHa: 450, powerCapacityMW: 200, powerUsedMW: 118, deepSeaPort: true, port: "Pelabuhan Kendal", amdal: "approved", leverage: 1.4, sector: "Tekstil & furnitur", tenants: 70, ebtPct: 22, rail: true, toll: true },
    { id: "JIIPE", name: "KI JIIPE Gresik", city: "Gresik", lat: -7.1083, lng: 112.5700, occupancyPct: 62, landTotalHa: 1760, landAvailableHa: 669, powerCapacityMW: 500, powerUsedMW: 300, deepSeaPort: true, port: "Pelabuhan JIIPE", amdal: "approved", leverage: 1.9, sector: "Smelter & berat", tenants: 45, ebtPct: 12, rail: true, toll: true },
    { id: "IMIP", name: "KI IMIP Morowali", city: "Morowali", lat: -2.5600, lng: 122.0800, occupancyPct: 82, landTotalHa: 2000, landAvailableHa: 360, powerCapacityMW: 3000, powerUsedMW: 2600, deepSeaPort: true, port: "Pelabuhan IMIP", amdal: "conditional", leverage: 2.3, sector: "Nikel & smelter", tenants: 55, ebtPct: 4, rail: false, toll: false },
    { id: "BTM", name: "KI Batamindo", city: "Batam", lat: 1.0590, lng: 104.0300, occupancyPct: 75, landTotalHa: 320, landAvailableHa: 80, powerCapacityMW: 180, powerUsedMW: 150, deepSeaPort: true, port: "Batu Ampar", amdal: "approved", leverage: 1.6, sector: "Elektronik ekspor", tenants: 140, ebtPct: 11, rail: false, toll: false },
    { id: "DMI", name: "KI Dumai", city: "Dumai", lat: 1.6660, lng: 101.4420, occupancyPct: 50, landTotalHa: 900, landAvailableHa: 450, powerCapacityMW: 220, powerUsedMW: 120, deepSeaPort: true, port: "Pelabuhan Dumai", amdal: "approved", leverage: 1.5, sector: "Oleokimia", tenants: 40, ebtPct: 14, rail: false, toll: false },
    { id: "KIBA", name: "KI Bantaeng", city: "Bantaeng", lat: -5.5490, lng: 119.9560, occupancyPct: 40, landTotalHa: 3000, landAvailableHa: 1800, powerCapacityMW: 250, powerUsedMW: 95, deepSeaPort: true, port: "Pelabuhan Bantaeng", amdal: "conditional", leverage: 1.2, sector: "Smelter berkembang", tenants: 22, ebtPct: 18, rail: false, toll: false },
  ];

  // Illustrative inter-zone supply links (buyer zone <- supplier zone).
  var SUPPLY_LINKS = [
    { from: "KIM", to: "MM2100", material: "bahan baku kimia", tenantsBuying: 22, annualValueIDR: 520_000_000_000, logistics: "vendor eceran luar" },
    { from: "KIEC", to: "KIIC", material: "baja lembaran", tenantsBuying: 14, annualValueIDR: 310_000_000_000, logistics: "vendor eceran luar" },
    { from: "DMI", to: "SIER", material: "oleokimia", tenantsBuying: 9, annualValueIDR: 180_000_000_000, logistics: "vendor eceran luar" },
  ];

  function byId(id) { return ZONES.find(function (z) { return z.id === id; }); }
  function powerSurplus(z) { return z.powerCapacityMW - z.powerUsedMW; }

  return { ZONES: ZONES, SUPPLY_LINKS: SUPPLY_LINKS, byId: byId, powerSurplus: powerSurplus };
});
