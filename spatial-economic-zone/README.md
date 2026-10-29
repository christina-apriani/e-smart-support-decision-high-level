<div align="center">

# 🗺️ Spatial-Economic Industrial Zone

### Konsolidasi AI lintas 13 kawasan industri — optimasi lahan, infrastruktur & portofolio BUMN

**AI tidak bisa menyarankan asal: ia dikunci oleh Geospatial & Fiscal Knowledge Graph. Tidak ada pabrik baja di kawasan tanpa pelabuhan laut dalam atau daya yang cukup.**

![Part of](https://img.shields.io/badge/suite-E--Smart%20Support%20Decision-1fbf78?style=flat-square)
![Zones](https://img.shields.io/badge/knowledge%20graph-13%20zones-46d08a?style=flat-square)
![Map](https://img.shields.io/badge/map-Leaflet%20realtime-27c6b0?style=flat-square)
![Tests](https://img.shields.io/badge/tests-8%2F8%20passing-46d08a?style=flat-square)

*Dibangun oleh **Christina Apriani***

</div>

---

## Konsep inti: Geospatial & Fiscal Knowledge Graph

Setiap kawasan punya atribut yang mengikat: ketersediaan lahan (HPL/HGB), kapasitas & surplus daya PLN, akses
pelabuhan laut dalam, status AMDAL, rasio utang (leverage), okupansi, dan rantai pasok antar-tenant. Advisor
**dikunci** ke graph ini — ia tidak bisa menempatkan industri di kawasan yang tidak memenuhi syaratnya.

```
Investor: pabrik baja (butuh pelabuhan laut dalam + 200 MW + 50 ha)
→ KI MM2100  : REJECTED (tanpa pelabuhan, surplus daya 18 MW)
→ KIT Batang : REJECTED (surplus daya 80 MW < 200 MW)
→ KI JIIPE   : APPROVED ✓ (pelabuhan JIIPE, surplus 200 MW, lahan 669 ha)
```

## Rekomendasi konsolidasi 3 horizon

Semua angka dihitung dari knowledge graph — tidak dikarang.

| Horizon | Fokus | Contoh output |
|---|---|---|
| **Jangka Pendek (<1 thn)** | Sinergi & utilisasi aset | *"KI SIER okupansi 96% (kritis) vs KIT Batang 45% + surplus 80 MW + 2365 ha menganggur → arahkan insentif investasi ke KIT Batang."* |
| **Jangka Menengah (1–3 thn)** | Penggabungan & sinergi logistik | *"22 tenant MM2100 membeli bahan baku kimia dari KI Medan via vendor eceran → konsolidasi kargo + pembayaran B2B lewat jaringan switching nasional, fee income ~Rp 40 Miliar/tahun."* |
| **Jangka Panjang (3–10 thn)** | Kompetisi global & keberlanjutan | *"70% MNC ESG hanya sewa di kawasan rendah emisi → konversi 4 kawasan ke EBT via sewa atap Solar PV pihak ketiga, minimal CapEx tunai."* |

## Fitur

| Modul | Fungsi |
|---|---|
| **🗺️ Peta Kawasan** | Peta OpenStreetMap real-time 13 kawasan; warna per okupansi, cincin pelabuhan; klik untuk detail geospasial & fiskal. |
| **🏭 Investor Matching** | Masukkan kebutuhan (sektor, daya, lahan, pelabuhan) → peringkat kawasan dengan verdict + alasan penolakan; rekomendasi otomatis ter-highlight di peta. |
| **🧭 3-Horizon Advisor** | Rekomendasi konsolidasi lintas kawasan; tombol "Lihat di peta" memfokuskan kawasan terkait. |
| **🗂️ Data Kawasan** | Tabel knowledge graph lengkap (okupansi, lahan, daya, pelabuhan, AMDAL, leverage, EBT). |
| **📒 Rekomendasi** | Simpan rekomendasi ke database. |

## 13 kawasan dalam graph

SIER (Surabaya) · KIT Batang · MM2100 (Bekasi) · KIEC (Cilegon) · KIM (Medan) · JIEP (Jakarta) ·
KIIC (Karawang) · KIK (Kendal) · JIIPE (Gresik) · IMIP (Morowali) · Batamindo (Batam) · Dumai · KIBA (Bantaeng).

## Aturan constraint

- **Kapasitas daya PLN**: surplus ≥ kebutuhan (hard).
- **Ketersediaan lahan HPL/HGB**: lahan tersedia ≥ kebutuhan (hard).
- **Akses pelabuhan laut dalam**: wajib untuk industri berat/ekspor (hard).
- **Status AMDAL** (soft) & **rasio leverage holding** ≤ 2.5x (soft).

## Menjalankan

Butuh **Node.js ≥ 20**. Tanpa dependency eksternal.

```bash
npm start        # http://localhost:5002
npm test         # 8 unit test (knowledge graph, matching, horizon)
```

Tanpa Node? Buka `public/index.html` langsung — **mode DEMO** (engine lokal + localStorage).

## Arsitektur

```
spatial-economic-zone/
├── server.js            # HTTP + REST
├── src/
│   ├── zones.js         # ⭐ Geospatial & Fiscal Knowledge Graph (13 zona)
│   ├── sez.js           # investor matching + 3-horizon engine
│   ├── constraint.js    # constraint validator (bersama dengan Q-SL)
│   └── db.js            # penyimpanan rekomendasi (SQLite)
├── public/              # console peta (+ salinan engine untuk demo)
└── test/
```

## Catatan

Data kawasan bersifat ilustratif untuk demonstrasi; ganti dengan data riil organisasi Anda. Alat bantu
keputusan untuk analisis portofolio internal.

---

<div align="center">
<sub>Bagian dari E-Smart Support Decision High Level · dibangun oleh Christina Apriani</sub>
</div>
