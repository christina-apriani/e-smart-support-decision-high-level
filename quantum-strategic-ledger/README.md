<div align="center">

# 🧭 Quantum Strategic Ledger (Q-SL)

### Penasihat Interkoneksi Finansial Makro & Pengendali Risiko Sistemik Pembayaran

**Setiap rekomendasi strategis wajib lolos validasi matematis — regulasi, kapasitas teknis, dan model keuangan. Ide yang tidak masuk akal ditolak otomatis.**

![Part of](https://img.shields.io/badge/suite-E--Smart%20Support%20Decision-4d7cff?style=flat-square)
![Anti-Halu](https://img.shields.io/badge/engine-Anti--Halu%20Validator-7aa0ff?style=flat-square)
![Backend](https://img.shields.io/badge/backend-Node.js%20(zero--dep)-0d1226?style=flat-square)
![Tests](https://img.shields.io/badge/tests-8%2F8%20passing-2ee6a0?style=flat-square)

*Dibangun oleh **Christina Apriani***

</div>

---

## Konsep inti: Anti-Halu Logic

Masalah utama AI penasihat strategis adalah **halusinasi** — mengusulkan ide yang terdengar meyakinkan tetapi
mustahil secara teknis, melanggar regulasi, atau tidak layak finansial. Q-SL memakai **Deterministic Business
Rules Constraint**: setiap argumen divalidasi silang secara matematis sebelum disajikan.

Jika AI mengusulkan *"Migrasi seluruh core ke blockchain dalam 1 bulan"*, Constraint Validator **langsung
menolak** dengan angka pelanggarannya, dan memaksa alternatif rasional.

```
Usulan: "Migrasi seluruh core ke blockchain dalam 1 bulan"
→ VERDICT: REJECTED (score 43%)
  ✗ Kelayakan waktu migrasi core : rencana 1 bulan vs minimum realistis 18 bulan
  ✗ Sertifikasi regulasi (BI)    : lead time 1 bulan vs minimum 6 bulan
  ✗ Ambang ROI minimum           : 5% vs 12%
  → Alternatif: jadwalkan migrasi bertahap (pilot + paralel-run) minimal 18 bulan.
```

Deterministik: input yang sama selalu menghasilkan verdict yang sama.

## Rekomendasi 3 horizon waktu

Setiap horizon dihitung dari metrik yang Anda input — **tidak ada angka yang dikarang** — lalu divalidasi.

| Horizon | Fokus | Contoh output (terhitung dari input) |
|---|---|---|
| **Jangka Pendek (<1 thn)** | Taktis operasional | *"Anomali kenaikan beban switching 18% dari kluster X... throttling 504 TPS untuk amankan jalur ATM/Debit Link."* |
| **Jangka Menengah (1–3 thn)** | Taktis finansial | *"Interchange turun 14%... konversi 30% (1260 unit) ATM berkinerja rendah menjadi CRM, payback 1.9 thn."* |
| **Jangka Panjang (3–10 thn)** | Visioner regulatori | *"Hadapi CBDC: transformasi ke Centralized Settlement Node, alokasi 15% laba ditahan untuk riset kriptografi pasca-kuantum."* |

## Fitur

| Modul | Fungsi |
|---|---|
| **🧭 3-Horizon Advisor** | Atur metrik live (slider/field) → hasilkan rekomendasi terhitung & tervalidasi untuk 3 horizon. |
| **🛡️ Anti-Halu Validator** | Uji usulan apa pun (preset atau manual) terhadap seluruh constraint; lihat verdict + math + alternatif. |
| **🗺️ Live Network** | Peta jaringan pembayaran nasional real-time (DC/DRC/regional) dengan beban & latensi; simulasi lonjakan. |
| **📒 Decision Ledger** | Simpan keputusan + verdict ke database untuk audit. |
| **📚 Constraint Rules** | Daftar seluruh aturan (hard/soft) per dimensi: teknis, regulasi, finansial, operasional. |

## Aturan constraint (contoh)

- **Kapasitas TPS**: beban proyeksi ≤ kapasitas switching.
- **Jaminan SLA 99.9%**: dampak ≤ ambang.
- **Kelayakan migrasi core**: migrasi core minimal 18 bulan (tolak big-bang).
- **Sertifikasi regulasi (BI PBI/PADG)**: lead time lisensi ≥ 6 bulan.
- **Batas leverage (Kementerian BUMN)**: ≤ 2.5x.
- **ROI & payback** (soft): ambang kelayakan finansial.

## Menjalankan

Butuh **Node.js ≥ 20**. Tanpa dependency eksternal.

```bash
npm start        # http://localhost:5001
npm test         # 8 unit test (validator, horizon, determinisme)
```

Tanpa Node? Buka `public/index.html` langsung — **mode DEMO** (engine lokal + localStorage).

## Arsitektur

```
quantum-strategic-ledger/
├── server.js            # HTTP + REST + live network feed
├── src/
│   ├── constraint.js    # ⭐ Constraint Validation Engine (Anti-Halu, UMD)
│   ├── qsl.js           # rules + 3-horizon generator (deterministik)
│   ├── network.js       # topologi jaringan nasional + beban live
│   └── db.js            # decision ledger (SQLite)
├── public/              # console (+ salinan engine untuk demo)
└── test/
```

## Catatan

Alat bantu keputusan untuk analisis internal. Angka regulasi/kapasitas bersifat parameter yang dapat
disesuaikan dengan data riil organisasi Anda.

---

<div align="center">
<sub>Bagian dari E-Smart Support Decision High Level · dibangun oleh Christina Apriani</sub>
</div>
