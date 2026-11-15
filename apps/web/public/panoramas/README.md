# MARSFORALL // PANDUAN FOLDER PANORAMA 360° PERMUKAAN MARS

Folder ini (`apps/web/public/panoramas/`) adalah direktori khusus untuk meletakkan file foto **Panorama 360° Permukaan Mars** (JPEG/JPG/PNG).

Setiap file foto yang Anda masukkan ke folder ini dapat langsung diolah dan dirender secara instan oleh mesin WebGL Three.js menjadi **sudut pandang (POV) 360° interaktif nyata** layaknya seorang astronaut berdiri langsung di permukaan Mars.

---

## 1. CARA MEMASUKKAN FOTO PANORAMA BARU

1. **Salin file JPEG/JPG Anda** langsung ke dalam folder ini (`apps/web/public/panoramas/`).  
   Contoh nama file: `sol4500_gediz_vallis_360.jpg`
2. **Format Gambar yang Direkomendasikan:**
   - **Rasio 2:1 Equirectangular Spherical** (misalnya `2048x1024`, `3840x1920`, atau `4096x2048` px) untuk pengalaman bola 360° penuh yang sempurna (atas = langit Mars, tengah = cakrawala, bawah = permukaan tanah regolith).
   - *Catatan Pintar:* Jika foto yang Anda masukkan berupa strip panorama datar atau rover mosaic dengan bagian atas/bawah terpotong, mesin MARSFORALL secara otomatis menjalankan algoritma `blendMartianZenithAndNadir` untuk mengisi langit Mars (*zenith*) dan tanah batuan (*nadir*) secara mulus tanpa lubang hitam!

---

## 2. CARA MENENTUKAN POSISI KOORDINAT & WAYPOINT

Terdapat **2 CARA MUDAH** untuk menghubungkan foto Anda dengan titik waypoint di peta:

### CARA A: Melalui UI Interaktif di Peta (Direkomendasikan & Paling Mudah)
1. Buka peta kokpit di browser (`/id/peta` atau `/en/peta`).
2. Klik tombol **`[+ TANDAI WAYPOINT 360°]`** pada panel navigasi peta.
3. Klik titik mana saja di permukaan Mars pada peta untuk mengambil koordinat Latitude, Longitude, dan Elevasi secara otomatis.
4. Pilih file foto yang ada di folder ini (atau ketik nama filenya) serta beri nama waypoint Anda.
5. Klik **"Simpan & Tampilkan Waypoint"**. Titik waypoint berlogo kamera 360° akan langsung muncul di peta dan dapat diklik untuk membuka POV 360° seketika!

### CARA B: Melalui File `panoramas-registry.json`
Buka file `apps/web/public/panoramas/panoramas-registry.json` dan tambahkan blok objek baru:

```json
{
  "id": "pano_gediz_vallis",
  "filename": "sol4500_gediz_vallis_360.jpg",
  "title": "Sol 4500: Saluran Debris Aliran Gediz Vallis",
  "site": "gale_crater",
  "coordinates": [137.3650, -4.7620],
  "elevationM": -3720,
  "sol": 4500,
  "description": "Pemandangan 360 derajat tebing curam dan endapan longsoran puing-puing air bah purba Mount Sharp.",
  "category": "ridge_escarpment",
  "headingOffsetDeg": 180,
  "credit": "Curiosity Mastcam Raw Mosaic"
}
```

---

## 3. PANDUAN SISTEM KOORDINAT MARS (GALE & JEZERO)

- **Gale Crater (Mount Sharp / MSL Curiosity):**
  - **Bujur (Longitude):** `137.30°` s/d `137.50°` Bujur Timur
  - **Lintang (Latitude):** `-4.50°` s/d `-4.85°` Lintang Selatan (tanda minus `-`)
  - **Elevasi Ketinggian MOLA:** Sekitar `-4500 m` (dasar kawah) hingga `-3500 m` (lereng atas)
- **Jezero Crater (Delta Front / M2020 Perseverance):**
  - **Bujur (Longitude):** `77.35°` s/d `77.55°` Bujur Timur
  - **Lintang (Latitude):** `18.30°` s/d `18.50°` Lintang Utara (tanda positif `+`)
  - **Elevasi Ketinggian MOLA:** Sekitar `-2600 m` hingga `-2400 m`
