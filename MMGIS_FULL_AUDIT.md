# NASA-AMMOS / MMGIS ARCHITECTURAL AUDIT & GAP ANALYSIS REPORT
**Target Evaluasi:** Repositori Resmi NASA-AMMOS/MMGIS (`d:\Nasa\ref-mmgis`)  
**Proyek Pengembang:** MarsForAll (`d:\Nasa\ares-martian-map`)  
**Standar Desain:** 100% Solid Matte `#07090e`, Batas 1px Solid, Nol Gradasi, Nol Logo NASA, Monospaced Tabular-Nums, Sinkron 5 Bahasa (EN/ID/ES/FR/ZH).

---

## 1. INVENTARIS STRUKTUR KODE & MODUL INTI MMGIS (`ref-mmgis`)

MMGIS (Multi-Mission Geographic Information System) dikembangkan oleh Jet Propulsion Laboratory (JPL) / NASA-AMMOS sebagai platform analisis spasial web untuk misi penjelajahan permukaan planet (seperti MSL Curiosity dan Mars 2020 Perseverance).

### A. Modul Inti (`src/essence/Basics/`)
1. **`Map_` (`src/essence/Basics/Map_/`):**
   - Menggunakan ekstensi Leaflet terkustomisasi dengan dukungan proyeksi kartografi non-bumi (`proj4`) melalui `Projection_.js`.
   - Menangani *layer switching*, koordinat tiling Web Mercator vs Equirectangular, dan interaksi kanvas.
   - Mengintegrasikan renderer vektor performa tinggi untuk jalur traverse wahana (*rover traverse*) dan poligon geologi.
2. **`Globe_` (`src/essence/Basics/Globe_/`):**
   - Menggunakan engine CesiumJS dan Three.js (`GlobeRenderer.js`, `CesiumMVTLayer.js`, `Globe_.js`).
   - Menyediakan globe planet 3D dengan pembungkus tekstur resolusi tinggi, ketinggian medan (*terrain elevation provider*), sudut pencahayaan matahari astronomis (*sun lighting angle*), dan pembesaran relief medan (*terrain vertical exaggeration*).
3. **`Layers_` (`src/essence/Basics/Layers_/`):**
   - Katalog hierarkis layer raster (WMTS, WMS, COG/Cloud Optimized GeoTIFF) dan layer vektor (GeoJSON, Shapefile via `shpjs`, MVT).
   - Dilengkapi modul *layer capture* (`LayerCapturer.js`, `dynamicExtent.js`) untuk pengambilan snapshot data spasial lokal.
4. **`Viewer_` (`src/essence/Basics/Viewer_/`):**
   - **`Photosphere.js`:** Engine panorama 360° berbasis Three.js equirectangular sphere (`sphereRadius = 100`). Menangani kontrol orientasi kamera (azimut, elevasi, pitch, FOV), cincin indikator azimut 360°, serta penempatan *target points* (stasiun lain) di dalam bola panorama.
   - **`ModelViewer.js`:** Engine inspeksi model 3D (OBJ, GLTF) untuk batuan dan instrumen wahana.
   - **`PDFViewer.js`:** Penampil dokumen sains dan laporan PDS.
5. **`Formulae_` (`src/essence/Basics/Formulae_/`):**
   - Pustaka komputasi geodesi planet (`Formulae_.js` & `subformulae/azElDistBetween.js`).
   - Menghitung koordinat geosentris Mars (IAU-2000 datum $R_{eq}=3396.19\text{ km}$, $R_{pol}=3376.20\text{ km}$), azimut, sudut elevasi pandang, dan jarak *great-circle*.
6. **`TimeControl_` (`src/essence/Basics/TimeControl_/`):**
   - Menangani filter waktu misi (`TimeControl.js` & `TimeUI.js`, 136 kB).
   - Memungkinkan sinkronisasi layer raster temporal dan penapisan titik lintasan berdasarkan rentang waktu UTC atau Sol misi wahana.
7. **`UserInterface_` (`src/essence/Basics/UserInterface_/`):**
   - Menyusun tata letak workstation MMGIS: `TopBar`, `Toolbar` (bilah ikon vertikal kiri), `ToolPanel` (laci panel), `SplitScreens`/`Splitter` (tirai pembanding swipe), `Coordinates` (penampil lat/lon/elevasi kursor waktu-nyata), dan `ScaleBox`.

### B. Plugin & Alat Analisis Spasial (`plugins/core/tools/` & `docs/pages/Tools/`)
1. **`Measure`:** Pengukuran jarak titik-ke-titik, poliline, azimut, dan pembuatan profil elevasi (*elevation profile cross-section*) dari grid DEM.
2. **`Viewshed`:** Analisis radial line-of-sight 360° untuk menentukan area yang terlihat atau terhalang oleh topografi dari sudut pandang wahana atau pos pengamat.
3. **`Sightline`:** Analisis garis pandang komunikasi radio antara wahana di permukaan kawah dengan wahana pengorbit (Mars Reconnaissance Orbiter / Odyssey relay).
4. **`Draw`:** Penggambaran interaktif titik, garis rute, dan poligon daerah penelitian (Zone of Interest / ZOI) serta ekspor data ke GeoJSON.
5. **`Curtain`:** Alat pembanding visual tirai geser (*swipe curtain*) dua layer citra satelit secara berdampingan.
6. **`Identifier`:** Inspektur atribut fitur peta interaktif saat pengguna mengeklik poligon geologi atau waypoint.
7. **`Legend`:** Generator legenda otomatis yang menampilkan skema warna (*color ramp*) dan satuan metrik layer aktif.
8. **`Chemistry`:** Visualisasi data spektrometri sinar laser (ChemCam LIBS / SuperCam) yang memplot persentase oksida mineral ($SiO_2$, $Al_2O_3$, $FeO_T$, $MgO$, $CaO$, $Na_2O$, $K_2O$, $TiO_2$) per tembakan laser.
9. **`Isochrone`:** Analisis keterjangkauan berbasis biaya (*least-cost path analysis*) dan peta batas waktu tempuh melintasi kemiringan lereng.
10. **`Sites`:** Sistem navigasi stasiun pendaratan misi dan bookmark koordinat penting.

### C. Backend, API, & Format Data (`API/`, `adjacent-servers/`, `Missions/`)
- Integrasi server TiTiler untuk tile GeoTIFF dinamis.
- Validasi dataset GDAL, database PostgreSQL/PostGIS, dan WebSocket untuk streaming telemetri wahana.
- Konfigurasi kernel SPICE NASA (`Missions/spice-kernels-conf.example.msl.json` & `mars2020.json`) untuk kalkulasi orbit dan lintasan wahana nyata.

---

## 2. MATRIKS ANALISIS GAP (`NASA-AMMOS MMGIS` vs `MarsForAll`)

| Kategori Fitur | Fitur MMGIS Asli | Status di MarsForAll | Catatan & Nilai Tambah MarsForAll |
| :--- | :--- | :--- | :--- |
| **Peta Taktis 2D** | Leaflet kustom + Proj4 Equirectangular | **Sudah Ada** (MapLibre GL + Equirectangular Trek Proxy) | Resolusi citra satelit NASA tajam dengan caching lokal. |
| **Globe Planet 3D** | CesiumJS & Three.js MVT Globe | **Sudah Ada** (`MarsGlobeViewer.tsx`) | Three.js IAU-2000 Sphere 2048px dengan 5 landmark planet. |
| **Profil Elevasi** | `Measure` tool (DEM profiling) | **Sudah Ada** (`MmgisProfileDrawer.tsx`) | Profil elevasi dinamis lengkap dengan min/max delta & LOS. |
| **Analisis Viewshed** | `Viewshed` radial raycasting | **Sudah Ada** (`computeViewshed360`) | Menghitung zona visibilitas 360° hingga radius 3.5 km. |
| **Tirai Pembanding** | `Curtain` tool | **Sudah Ada** (Interactive Swipe Divider) | Membandingkan layer USGS/HiRISE vs DEM Slope. |
| **Digitasi ZOI & GeoJSON** | `Draw` tool | **Sudah Ada** (`+ MARK ZOI` & `exportGisGeoJson`) | Pembuatan zona taktis dan ekspor GeoJSON standar. |
| **Lintasan Rover** | MSL/Perseverance Traverse Layer | **Sudah Ada** (Curiosity & Perseverance) | Menggunakan *Dual-Layer Line Casing* MMGIS (emas `#facc15` + casing `#07090e`). |
| **Rute Perjalanan** | `Isochrone` (Least-Cost Surface) | **Sudah Ada + Lebih Canggih** (`MarswalkRouter`) | Solver Dijkstra A* mempertimbangkan 35 parameter fisika Mars. |
| **Analisis Sumber Daya** | `Chemistry` (Oksida ChemCam LIBS) | **Sudah Ada + Lebih Canggih** (`ProspectorPanel`) | Inversi ML 35-parameter + integrasi SHARAD radar 500m. |
| **Uji Analogi Bumi** | *Tidak ada di MMGIS standar* | **Sudah Ada** (`AnalogueMatcherPanel`) | Pencocokan spektral ke 4 testbed bumi analog NASA. |
| **Mode Visor Astronaut** | *Tidak ada di MMGIS standar* | **Sudah Ada** (`VisorHudOverlay.tsx`) | HUD helm astronaut dengan telemetri O2, baterai, & radiasi. |
| **360° Surface Explorer** | `Photosphere.js` (Viewer) | **Diupgrade ke Standar FU Berlin** | Tur 360° resolusi tinggi dengan *ground-projected hotspots*. |

---

## 3. INVENTARIS FITUR MMGIS BERNILAI TINGGI UNTUK PENGEMBANGAN LANJUTAN

Berdasarkan hasil audit mendalam ini, berikut adalah 5 modul MMGIS yang sangat direkomendasikan untuk diintegrasikan pada iterasi berikutnya:
1. **Time-Slider Sol Filter (`TimeControl.js`):** Slider waktu yang dapat digeser untuk menyaring waypoint, lintasan rover, dan kondisi cuaca berdasarkan Sol tertentu secara interaktif.
2. **Multi-Layer Dynamic Legend Ramp (`LegendTool.js`):** Bilah legenda otomatis yang menampilkan gradien warna diskret/kontinu beserta satuan fisik (m, K, nT, tiu, wt%) untuk setiap layer sains yang aktif.
3. **Coordinate Grid / Graticule Overlay:** Lapisan garis bujur/lintang (*lat-lon graticule*) semi-transparan dengan interval teratur untuk orientasi kartografi presisi.
4. **Terrain Vertical Exaggeration Slider (`GlobeRenderer.js`):** Pengatur skala ketinggian vertikal medan 3D ($1\times$ hingga $3\times$) untuk menonjolkan fitur geologi kawah terjal.
5. **In-Map Feature Attribute Inspector (`IdentifierTool.js`):** Dialog inspeksi cepat yang menampilkan seluruh atribut tabel GeoJSON saat pengguna mengeklik sembarang titik medan.
