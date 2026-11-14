# Mine For All

<p align="center">
  <img src="apps/web/public/images/hero_light.svg" alt="Mine For All" width="320">
</p>

**Observatorium independen dan nirlaba untuk transparansi data pertambangan, kawasan lindung, dan lingkungan Indonesia.**

Mine For All adalah aplikasi web berbasis peta interaktif yang merangkum data satelit dan data publik resmi — termasuk izin usaha pertambangan (WIUP/IUP), jejak fisik tambang, kawasan konservasi, tutupan hutan, dan risiko lingkungan — menjadi satu peta terbuka yang dapat diperiksa oleh siapa saja.

> **Transparansi Berbasis Data.** Kami menyajikan data apa adanya dari sumber-sumber terpercaya tanpa tuduhan sepihak. Setiap layer dilengkapi sumber resmi, metodologi, dan tanggal pembaruan data.

---

## Fitur Utama

- **Wilayah Izin Usaha Pertambangan (WIUP/IUP)**: Pemetaan sebaran konsesi izin tambang (batu bara, nikel, emas, dan mineral lainnya) di seluruh Indonesia.
- **Kawasan Lindung & Konservasi**: Peta kawasan Taman Nasional, Cagar Alam, Suaka Margasatwa, dan Hutan Lindung.
- **Tumpang Tindih & Analisis Spasial**: Pemeriksaan visual irisan antara izin tambang dan kawasan konservasi alam.
- **Kehilangan Tutupan Pohon & Satwa Terancam**: Pemantauan deforestasi satelit dan persebaran satwa yang terdampak.
- **Bilingual**: Mendukung Bahasa Indonesia dan English.

---

## Arsitektur Monorepo

Repository ini dibangun menggunakan **pnpm** workspace dan **Turborepo**:

| Package | Deskripsi |
| --- | --- |
| `apps/web` | Next.js 14 (App Router), MapLibre GL, `next-intl` (ID/EN), Tailwind CSS, Recharts |
| `apps/api` | REST API (NestJS, Express, Mongoose) & pipeline ingestion data |
| `packages/shared` | Tipe data domain TypeScript yang digunakan bersama oleh web & API |

---

## Panduan Instalasi & Menjalankan Lokal

### Prasyarat
- **Node.js >= 20**
- **pnpm >= 9** (`npm i -g pnpm`)
- *(Opsional)* MongoDB lokal (`mongodb://localhost:27017`) jika menjalankan backend API

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Fadzkal/mine-for-all.git
cd mine-for-all
pnpm install
```

### 2. Jalankan Environment Pengembangan
```bash
# Menjalankan seluruh workspace (web & api)
pnpm dev

# Atau hanya menjalankan web
pnpm --filter @mineforall/web dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## Lisensi
Proyek ini berlisensi [GNU AGPLv3](./LICENSE).
