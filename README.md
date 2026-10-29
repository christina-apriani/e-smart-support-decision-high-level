<div align="center">

# E-Smart Support Decision High Level

### Executive decision-support platforms with deterministic  validation



**Dua platform AI penasihat strategis tingkat tinggi. Setiap rekomendasi divalidasi silang secara matematis — tidak ada halusinasi, hanya keputusan yang masuk akal.**



!\[Full-stack](https://img.shields.io/badge/stack-full--stack-4d7cff?style=for-the-badge)
!\[Zero deps](https://img.shields.io/badge/runtime-Node.js%20zero--dependency-0d1226?style=for-the-badge)

!\[Anti-Halu](https://img.shields.io/badge/core-Constraint%20Validator-7aa0ff?style=flat-square)
!\[Realtime map](https://img.shields.io/badge/map-Leaflet%20realtime-1fbf78?style=flat-square)
!\[Tests](https://img.shields.io/badge/tests-16%2F16%20passing-2ee6a0?style=flat-square)
!\[License](https://img.shields.io/badge/license-MIT-19332a?style=flat-square)

*Dibangun oleh **Christina Apriani***

</div>

\---



## Mangatasi masalah bersama AI dalam keputusan strategis



AI penasihat level eksekutif berbahaya ketika ia **berhalusinasi** - mengusulkan ide yang terdengar brilian
tetapi mustahil secara teknis, melanggar regulasi, atau tidak layak secara fiskal/spasial. Kedua platform di
repo ini memakai inti yang sama: **Deterministic Business Rules Constraint Validator**. Setiap argumen AI wajib
lolos validasi matematis sebelum disajikan; jika tidak, ditolak dengan angka pelanggarannya dan dipaksa mencari
opsi rasional.



## Dua platform



### 🧭 [1 · Quantum Strategic Ledger (Q-SL)](./quantum-strategic-ledger)

Penasihat interkoneksi finansial makro \& pengendali risiko sistemik pembayaran nasional. Memvalidasi rekomendasi
terhadap regulasi Bank Indonesia (PBI/PADG), kapasitas teknis (TPS/SLA/HSM), dan model keuangan riil.
Rekomendasi 3 horizon: throttling taktis, konversi aset ATM→CRM, hingga transformasi Centralized Settlement Node
menghadapi CBDC. Contoh: *"ide migrasi core ke blockchain dalam 1 bulan → DITOLAK (butuh min. 18 bulan)."*



### 🗺️ [2 · Spatial-Economic Industrial Zone](./spatial-economic-zone)

Konsolidasi lintas 13 kawasan industri untuk optimasi lahan, infrastruktur, dan portofolio BUMN. Dikunci oleh
Geospatial \& Fiscal Knowledge Graph: AI tidak bisa menempatkan pabrik baja di kawasan tanpa pelabuhan laut dalam
atau daya cukup. Rekomendasi 3 horizon: realokasi insentif ke kawasan menganggur, konsolidasi logistik
antar-kawasan, hingga konversi kawasan ke Energi Baru Terbarukan. Dengan peta interaktif real-time.



## Arsitektur bersama

```
      ┌────────────────────────────────────────────────┐
      │   Constraint Validation Engine                 │  ← inti deterministik
      │   regulasi · kapasitas · model keuangan/spasial│
      └───────────────┬───────────────────┬────────────┘
                      │                   │

&#x09;	      ▼                   ▼
        ┌─────────────────────┐   ┌──────────────────────┐
        │  Q-SL               │   │  Spatial Zone        │
        │  aturan finansial   │   │  knowledge graph 13  │
        │  3-horizon advisor  │   │  3-horizon advisor   │
        └─────────────────────┘   └──────────────────────┘
```

Kedua platform berbagi `constraint.js` yang sama - satu mesin validasi, dua domain aturan.


## Menjalankan

Setiap project berdiri sendiri, butuh **Node.js ≥ 20**, dan **tanpa dependency eksternal**.

```bash
# Platform 1 - Q-SL
cd quantum-strategic-ledger \&\& npm start     # http://localhost:5001

# Platform 2 - Spatial Zone
cd spatial-economic-zone \&\& npm start          # http://localhost:5002
```

Unit test tiap project: `npm test` (16 test total, semua lolos). Tanpa Node, buka `public/index.html` tiap
project untuk **mode DEMO** di browser.



## Prinsip rekayasa



* **Anti-Halu by design.** Rekomendasi bukan teks bebas; ia output deterministik dari aturan + input, lalu
divalidasi. Input sama → verdict sama.
* **Angka terhitung, bukan dikarang.** Setiap nilai dalam rekomendasi diturunkan dari metrik/graph.
* **Zero dependency.** Modul inti Node (`http`, `node:sqlite`). Mudah di-deploy \& diaudit.
* **Engine bersama.** Constraint validator ditulis sekali (UMD), dipakai backend \& browser, identik.
* **Mode adaptif.** LIVE (SQLite) saat server aktif; DEMO (engine lokal) saat halaman statis.



## Struktur



```
e-smart-support-decision-high-level/
├── quantum-strategic-ledger/     # Platform 1 - Q-SL (port 5001)
├── spatial-economic-zone/        # Platform 2 - Spatial Zone (port 5002)
├── README.md
└── LICENSE
```


\---

<div align="center">

**Christina Apriani** · Full-Stack Developer Profesional


*Decision support · constraint validation · strategic planning*



<sub>Data parameter bersifat ilustratif; sesuaikan dengan data riil organisasi. Alat bantu keputusan internal.</sub>

</div>


