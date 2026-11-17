# LAPORAN TEKNIS ILMIAH & AUDIT MATEMATIKA CODEBASE MARSFORALL
## Ekstraksi Komprehensif Rumus Geodesi, Fisika Planetarium, Model Hidrologi Bawah Tanah SWIM, Spektrometri Geokimia, Navigasi EVA Slope-Aware, dan Analisis Spasial MMGIS

---

**Identitas Dokumen:**
- **Proyek:** MarsForAll (ARES-PATH: Interplanetary Exploration & Survival Workstation)
- **Kompetisi:** NASA International Space Apps Challenge 2026
- **Kategori:** Planetary GIS, Autonomous EVA Routing, and In-Situ Resource Utilization (ISRU)
- **Status Audit:** 100% Deterministic Codebase Extraction (Read-Only Verification)
- **Target Studi Kasus:** Gale Crater (Mount Sharp / MSL Curiosity) & Jezero Crater (Delta Front / Mars 2020 Perseverance)
- **Standar Format Data:** NASA PDS4, JPL MMGIS Architecture, IAU-2000 Planetary Datum, RFC 7946 GeoJSON

---

## DAFTAR ISI
1. **BAB 1: Ringkasan Arsitektur Komputasi & Sumber Data Resmi NASA/USGS**
2. **BAB 2: Model Geodesi Planet Mars & Transformasi Proyeksi Peta**
3. **BAB 3: Matriks 35 Parameter Ilmiah & Model Es Bawah Tanah SWIM (Morgan et al., 2020)**
4. **BAB 4: Algoritma Fusi Prospector ML & Spektrometri Oksida ChemCam LIBS**
5. **BAB 5: Algoritma Perencanaan Rute EVA (Slope-Aware Routing) & Fisiologi PLSS**
6. **BAB 6: Kalkulasi Spasial Workstation MMGIS (Cross-Section, Line-of-Sight, & Viewshed 360°)**
7. **BAB 7: Algoritma Pencocokan Analogi Bumi (Weighted Euclidean Multi-Attribute Matcher)**
8. **BAB 8: Rekonstruksi Medan 3D, Fotometri Lambertian, & Sintesis Akustik Angin Mars**
9. **BAB 9: Studi Kasus Perhitungan Numerik Nyata (Worked Examples)**
10. **BAB 10: Daftar Pustaka & Atribusi Ilmiah**

---

## BAB 1: RINGKASAN ARSITEKTUR KOMPUTASI & SUMBER DATA RESMI NASA/USGS

Arsitektur komputasi MarsForAll mengintegrasikan data penginderaan jauh (*remote sensing*) orbital multispektral, data geofisika radar penetrasi tanah (*ground-penetrating radar*), serta data telemetri *in-situ* dari rover NASA Curiosity dan Perseverance. Seluruh pemrosesan dilakukan secara deterministik pada lapisan klien dan server tanpa mengandalkan data sintesis acak.

### 1.1 Tabel Pemetaan Sumber Daya Data Satelit & Endpoint API
*Referensi Codebase:* `apps/web/src/app/api/mars-tiles/[layer]/[z]/[y]/[x]/route.ts` (Baris 104–170), `apps/web/src/lib/martian/scientificParams.ts` (Baris 298–337).

| Alias Layer Sistem | Layer ID Resmi NASA Mars Trek | Instrumen & Wahana Antariksa | Resolusi Spasial | Format Berkas | Deskripsi Ilmiah & Fungsi Analisis |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `viking-mdim21` | `Mars_Viking_MDIM21_ClrMosaic_global_232m` | Viking Orbiter 1 & 2 VIS | 232 m/px | JPEG | Peta dasar optik ortorektifikasi global warna alami planet Mars. |
| `mola-clrshade` | `Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw` | MGS MOLA + MEX HRSC | 200 m/px | JPEG | Komposit elevasi hillshade berwarna global gabungan MOLA laser altimeter dan kamera HRSC Jerman. |
| `mola-dem` | `Mars_MGS_MOLA_DEM_mosaic_global_463m` | MGS MOLA | 463 m/px (128 ppd) | JPEG | Model elevasi digital global (*Digital Elevation Model*) datum aeroid MOLA. |
| `mola-slope` | `Mars_MGS_MOLA_Slope_Map` | MGS MOLA Altimeter | 463 m/px | JPEG | Peta kemiringan lereng planetarium turunan gradien ketinggian MOLA. |
| `mola-roughness` | `Mars_MGS_MOLA_Roughness_0.6km` | MGS MOLA Altimeter | 600 m baseline | JPEG | Kekasaran permukaan skala sedang (baseline 0.6 km) berbasis dispersi pulsa laser. |
| `themis-day-ir` | `Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v2` | Mars Odyssey THEMIS IR | 100 m/px | JPEG | Citra inframerah siang hari untuk diferensiasi sifat termal litologi permukaan. |
| `themis-night-ir`| `Mars_MO_THEMIS-IR-Night_mosaic_global_100m_v2` | Mars Odyssey THEMIS IR | 100 m/px | JPEG | Citra inframerah malam hari; mendeteksi batuan hangat dan jebakan pasir dingin (*sand traps*). |
| `themis-ti` | `THEMIS_Thermal_Inertia_Mosaic_100m` | Mars Odyssey THEMIS | 100 m/px | JPEG | Peta inersia termal permukaan terkalibrasi ($J\cdot m^{-2}\cdot K^{-1}\cdot s^{-1/2}$). |
| `tes-ti` | `TES_Thermal_Inertia` | MGS TES Spectrometer | 3 km/px | JPEG | Inersia termal skala makro dari instrumen spektrometer emisi termal MGS. |
| `tes-dust` | `TES_Dust_Cover_Index` | MGS TES Spectrometer | 3 km/px | JPEG | Indeks tutupan debu eolian (*Dust Cover Index / DCI*). |
| `tes-albedo` | `TES_Lambert_Albedo` | MGS TES Spectrometer | 3 km/px | JPEG | Reflektansi bolometrik permukaan regolit (albedo Lambertian). |
| `gale-ctx` / `gale-hirise` | `Gale_CTX_BlockAdj_dd` | MRO CTX (Context Camera) | 6.0 m/px | PNG | Mosaik citra beresolusi tinggi terkoreksi blok di Gale Crater (Mount Sharp). |
| `gale-ortho-25cm`| `MSL_Gale_Orthophoto_Mosaic_25cm_v3` | MRO HiRISE Camera | 0.25 m/px | PNG | Ortofoto ultra-tinggi penjelajahan rover Curiosity dari USGS Astrogeology. |
| `gale-dtm-1m` | `MSL_Gale_HiRISE_DTM_1m` | MRO HiRISE Stereo | 1.0 m/px | PNG | Digital Terrain Model fotogrametri stereo HiRISE dengan akurasi ketinggian submeter. |
| `jezero-ctx` | `Jezero_CTX_BlockAdj_dd` | MRO CTX Camera | 6.0 m/px | PNG | Mosaik konteks orbital Kawah Jezero mencakup kipas delta sungai Neretva Vallis. |
| `mgs-mag` | `MGS_Crustal_Magnetism_Radial_Field` | MGS MAG/ER Magnetometer | 0.5° grid | JPEG | Komponen medan magnetik radial sisa kerak purba Noachian dalam satuan nanoTesla ($nT$). |
| `omega-clays` | `OMEGA_Phyllosilicates_Map` | MEX OMEGA Hyperspectral | 300 m/px | PNG | Peta distribusi spektral mineral lempung terhidrasi (smektit, nontronit). |
| `tes-sulfate` | `TES_Sulfate_Abundance` | MGS TES Spectrometer | 3 km/px | JPEG | Kelimpahan mineral sulfat polihidrat dan monohidrat (gips, kieserit, jarosit). |
| `mons-weh` | `MONS_Water_Equivalent_Hydrogen` | Mars Odyssey GRS/MONS | ~60 km footprint | JPEG | Kandungan hidrogen ekuivalen air (*Water-Equivalent Hydrogen / WEH*) regolit atas 1 meter. |
| `usgs-geology` | `USGS_SIM3292_Global_Geologic_Map_of_Mars` | USGS Planetary Program | Vektor/Raster | JPEG | Peta geologi formal global Mars (Tanaka et al., 2014) pembagian era Noachian/Hesperian/Amazonian. |
| `mro-gravity` | `MRO_GMM3_Free_Air_Gravity_Map` | MRO Radio Science | 110 ppd | JPEG | Peta anomali gravitasi *Free-Air* model Goddard Mars Gravity 3 ($mGal$). |

---

## BAB 2: MODEL GEODESI PLANET MARS & TRANSFORMASI PROYEKSI PETA

Pemetaan planet Mars memiliki perbedaan mendasar dengan geodesi terestrial (Bumi). Mars tidak memiliki permukaan laut (*mean sea level*), sehingga datum vertikal diukur terhadap elipsoid referensi atau gravitasi equipotensial aeroid MOLA.

### 2.1 Datum Planetarium IAU-2000 / IAU-2015 Mars
*Referensi Codebase:* `packages/shared/src/mars/prospectorScorer.ts` (Baris 70–85), `apps/web/src/components/mars/MarsGlobeViewer.tsx` (Baris 85–92).

Konstanta fisik geodesi Mars yang tertanam pada sistem:
- **Jari-jari Rata-rata Volumetrik Mars ($R_{\text{mars}}$):** $3389.50 \text{ km}$ ($3,389,500 \text{ m}$)
- **Jari-jari Ekuatorial ($a$):** $3396.19 \text{ km}$
- **Jari-jari Polar ($b$):** $3376.20 \text{ km}$
- **Flattening Geodetik ($f$):** $f = \frac{a - b}{a} = \frac{3396.19 - 3376.20}{3396.19} \approx 0.005886$
- **Faktor Konversi Busur Meridian:** 
  Pada radius $R_{\text{mars}} = 3389.5 \text{ km}$, panjang busur satu derajat lintang/bujur pada ekuator adalah:
  $$\Delta_{\text{km/deg}} = \frac{2\pi \times 3389.5}{360} \approx 59.158 \text{ km/derajat}$$
  Di dalam kode sumber (`mmgisSpatialAnalysis.ts` Baris 58–59, 142–143, 249), konstanta ini dibulatkan secara deterministik menjadi $59.16 \text{ km/derajat}$.

### 2.2 Transformasi Proyeksi MapLibre Web Mercator ke NASA Mars Trek Equirectangular
*Referensi Codebase:* `apps/web/src/app/api/mars-tiles/[layer]/[z]/[y]/[x]/route.ts` (Baris 64–81).

Pustaka peta web modern (MapLibre GL / OpenLayers) menggunakan kisi tile piramida Web Mercator (proyeksi silindris konformal, EPSG:3857), sedangkan repositori ubin resmi NASA Mars Trek WMTS menggunakan proyeksi silindris silang ekuidistan *Equirectangular Plate Carrée* (`default028mm`). Agar citra satelit NASA tidak terdistorsi pada peta interaktif, dilakukan konversi matematis dinamis secara *real-time* di tingkat server proxy.

#### Langkah 1: Ekstraksi Koordinat Geografis $(\lambda, \phi)$ dari Tile Web Mercator $(x_{\text{merc}}, y_{\text{merc}}, z_{\text{merc}})$
Pusat koordinat tile ($+0.5$ piksel normalisasi) dihitung melalui inversi proyeksi Mercator:

$$\lambda_{\text{deg}} = \left( \frac{x_{\text{merc}} + 0.5}{2^{z_{\text{merc}}}} \right) \times 360^\circ - 180^\circ$$

Variabel perantara proyeksi $n$:
$$n = \pi - \frac{2\pi (y_{\text{merc}} + 0.5)}{2^{z_{\text{merc}}}}$$

Lintang planetosentris $\phi_{\text{deg}}$ dihitung melalui fungsi inversi Gudermannian:
$$\phi_{\text{deg}} = \frac{180^\circ}{\pi} \arctan\left( \frac{e^n - e^{-n}}{2} \right) = \frac{180^\circ}{\pi} \arctan(\sinh n)$$

#### Langkah 2: Pemetaan Koordinat ke Indeks Tile Equirectangular Mars Trek $(x_{\text{trek}}, y_{\text{trek}}, z_{\text{trek}})$
NASA Mars Trek menggunakan rasio aspek global $2:1$ (bujur $-180^\circ \text{ s.d. } +180^\circ = 360^\circ$, lintang $-90^\circ \text{ s.d. } +90^\circ = 180^\circ$). Oleh karena itu, jumlah kolom adalah dua kali lipat jumlah baris:

$$z_{\text{trek}} = \max\left(0, \min\left(z_{\text{merc}} - 1, 13\right)\right)$$
$$\text{cols}_{\max} = 2^{z_{\text{trek}} + 1}$$
$$\text{rows}_{\max} = 2^{z_{\text{trek}}}$$

Indeks kolom ubin horizontal ($x_{\text{trek}}$):
$$x_{\text{trek}} = \left\lfloor \frac{\lambda_{\text{deg}} + 180^\circ}{360^\circ} \times \text{cols}_{\max} \right\rfloor$$

Indeks baris ubin vertikal ($y_{\text{trek}}$) diukur dari Kutub Utara ($+90^\circ$) ke Kutub Selatan ($-90^\circ$):
$$y_{\text{trek}} = \left\lfloor \frac{90^\circ - \phi_{\text{deg}}}{180^\circ} \times \text{rows}_{\max} \right\rfloor$$

Dengan pembatas batas (*clamping*):
$$x_{\text{trek}} = \max\left(0, \min\left(x_{\text{trek}}, \text{cols}_{\max} - 1\right)\right)$$
$$y_{\text{trek}} = \max\left(0, \min\left(y_{\text{trek}}, \text{rows}_{\max} - 1\right)\right)$$

### 2.3 Transformasi Koordinat Sferis ke Ruang Kartesian 3D Three.js
*Referensi Codebase:* `apps/web/src/components/mars/MarsGlobeViewer.tsx` (Baris 85–92).

Untuk merender bola planet Mars 3D interaktif pada Three.js dengan radius $R_{\text{globe}} = 3.0$ unit:
$$\Phi = (90^\circ - \phi_{\text{lat}}) \times \frac{\pi}{180^\circ}$$
$$\Theta = (\lambda_{\text{lon}} + 180^\circ) \times \frac{\pi}{180^\circ}$$

Vektor posisi 3D $\vec{P} = (x, y, z)$:
$$x = -\left(R_{\text{globe}} \times \sin\Phi \times \cos\Theta\right)$$
$$y = R_{\text{globe}} \times \cos\Phi$$
$$z = R_{\text{globe}} \times \sin\Phi \times \sin\Theta$$

Orientasi koordinat ini menjamin Kutub Utara Mars berada tepat pada sumbu $+y$, meridian nol ($0^\circ$) sejajar dengan sumbu $+z$, dan rotasi diurnal mengikuti sumbu rotasi planet yang benar.

---

## BAB 3: MATRIKS 35 PARAMETER ILMIAH & MODEL ES BAWAH TANAH SWIM

MarsForAll mengintegrasikan **35 parameter ilmiah** yang dikelompokkan ke dalam 6 domain eksplorasi geofisika.

### 3.1 Inventaris Lengkap 35 Parameter Ilmiah
*Referensi Codebase:* `apps/web/src/lib/martian/mountSharpWaypoints.ts` (Baris 1256–1356).

| No | Parameter Ilmiah | Simbol / Variabel | Domain Geofisika | Instrumen Sumber | Satuan | Rentang Nilai Operasional | Sumber Data |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | MOLA Elevation | $E_{\text{mola}}$ | Topography & Geometry | MOLA / HRSC DTM | m | $-4550 \text{ s.d. } +21287$ | JPL_TREK_DEM |
| 2 | Terrain Slope | $\theta$ | Topography & Geometry | HiRISE 1m DTM | derajat (°) | $0.0 \text{ s.d. } 90.0$ | JPL_TREK_DEM |
| 3 | Surface Roughness | $r_{\text{hapke}}$ | Topography & Geometry | Hapke Photometry | m | $0.05 \text{ s.d. } 0.85$ | PHYSICS_COMPUTED |
| 4 | Slope Aspect Angle | $\alpha_{\text{aspect}}$ | Topography & Geometry | Orbital DEM Normal | derajat (°) | $0 \text{ s.d. } 359$ | JPL_TREK_DEM |
| 5 | Solar Illumination | $\mu_0$ | Topography & Geometry | Solar Ephemeris | rasio ($0\text{--}1$) | $0.0 \text{ s.d. } 1.0$ | PHYSICS_COMPUTED |
| 6 | Daytime Surface Temp | $T_{\text{day}}$ | Thermal & Surface Physics | THEMIS Day IR | °C / K | $-35 \text{ s.d. } +2^\circ\text{C}$ ($238\text{--}275\text{ K}$) | MSL_PDS_ARCHIVE |
| 7 | Nighttime Surface Temp | $T_{\text{night}}$ | Thermal & Surface Physics | THEMIS Night IR | °C / K | $-105 \text{ s.d. } -75^\circ\text{C}$ ($168\text{--}198\text{ K}$) | MSL_PDS_ARCHIVE |
| 8 | Apparent Thermal Inertia | $I$ | Thermal & Surface Physics | MGS TES / THEMIS | tiu ($J\cdot m^{-2}\cdot K^{-1}\cdot s^{-1/2}$) | $80 \text{ s.d. } 650$ | MSL_PDS_ARCHIVE |
| 9 | Dust Cover Index | $\text{DCI}$ | Thermal & Surface Physics | TES Spectrometer | indeks | $0.04 \text{ s.d. } 0.95$ | MSL_PDS_ARCHIVE |
| 10 | Bolometric Albedo | $A_{\text{bolo}}$ | Thermal & Surface Physics | TES Radiometer | rasio | $0.12 \text{ s.d. } 0.32$ | MSL_PDS_ARCHIVE |
| 11 | Ambient Air Temp | $T_{\text{air}}$ | Weather & Atmosphere | MSL REMS / MEDA | °C | $-85 \text{ s.d. } -15^\circ\text{C}$ | MSL_PDS_ARCHIVE |
| 12 | Atmospheric Pressure | $P_{\text{atm}}$ | Weather & Atmosphere | REMS Barometer | Pa | $680 \text{ s.d. } 850$ | MSL_PDS_ARCHIVE |
| 13 | Wind Speed | $v_{\text{wind}}$ | Weather & Atmosphere | REMS Anemometer | m/s | $2.0 \text{ s.d. } 18.5$ | MSL_PDS_ARCHIVE |
| 14 | Wind Direction | $\theta_{\text{wind}}$ | Weather & Atmosphere | REMS 2D Wind Boom | derajat (°) | $0 \text{ s.d. } 359$ | MSL_PDS_ARCHIVE |
| 15 | Atmospheric Dust Opacity | $\tau_{\text{dust}}$ | Weather & Atmosphere | Mastcam Solar Tau | $\tau$ | $0.25 \text{ s.d. } 2.50$ | MSL_PDS_ARCHIVE |
| 16 | Relative Humidity | $\text{RH}$ | Weather & Atmosphere | REMS Capacitive Hum | % | $0.5 \text{ s.d. } 8.5$ | MSL_PDS_ARCHIVE |
| 17 | GCR Radiation Dose | $D_{\text{GCR}}$ | Radiation & Space Hazard | MSL RAD Detector | $\mu\text{Gy/day}$ | $180 \text{ s.d. } 250$ | MSL_PDS_ARCHIVE |
| 18 | SPE Alert Warning | $\text{SPE}_{\text{stat}}$ | Radiation & Space Hazard | NASA DONKI Live API | status | NOMINAL / ALERT | LIVE_API |
| 19 | UV Radiance Level | $\text{UV}_{\text{idx}}$ | Radiation & Space Hazard | REMS UV Sensor | indeks | MODERATE / HIGH / EXTREME | MSL_PDS_ARCHIVE |
| 20 | Crustal Magnetic Field | $B_{\text{crust}}$ | Radiation & Space Hazard | MGS MAG/ER | nT | $15 \text{ s.d. } 120$ | MSL_PDS_ARCHIVE |
| 21 | CRISM Phyllosilicates | $\text{IDX}_{\text{clay}}$ | Mineralogy & Chemistry | CRISM Hyperspectral | indeks ($0\text{--}1$) | $0.05 \text{ s.d. } 0.85$ | MSL_PDS_ARCHIVE |
| 22 | CRISM Polyhydrated Sulfate | $\text{IDX}_{\text{sulf}}$ | Mineralogy & Chemistry | CRISM SINDEX2 | indeks ($0\text{--}1$) | $0.10 \text{ s.d. } 0.95$ | MSL_PDS_ARCHIVE |
| 23 | CRISM Carbonates | $\text{IDX}_{\text{carb}}$ | Mineralogy & Chemistry | CRISM MIN2295 | indeks ($0\text{--}1$) | $0.02 \text{ s.d. } 0.45$ | MSL_PDS_ARCHIVE |
| 24 | CRISM Olivine/Pyroxene | $\text{IDX}_{\text{oliv}}$ | Mineralogy & Chemistry | CRISM OLINDEX3 | indeks ($0\text{--}1$) | $0.15 \text{ s.d. } 0.90$ | MSL_PDS_ARCHIVE |
| 25 | Hematite Abundance | $\%_{\text{hem}}$ | Mineralogy & Chemistry | CRISM BDI1000 | wt% | $5.0 \text{ s.d. } 35.0$ | MSL_PDS_ARCHIVE |
| 26 | Water-Equivalent Hydrogen | $\text{WEH}$ | Mineralogy & Chemistry | GRS / DAN Neutron | wt% $\text{H}_2\text{O}$ | $2.5 \text{ s.d. } 8.5$ | MSL_PDS_ARCHIVE |
| 27 | ChemCam Major Oxides | $\{\text{Oxide}\}$ | Mineralogy & Chemistry | ChemCam LIBS / APXS | wt% | $\sum \approx 100\%$ | MSL_PDS_ARCHIVE |
| 28 | SHARAD Radar Stratigraphy | $\vec{S}_{\text{strat}}$ | Subsurface Radar & Geology | MRO SHARAD Sounder | 3 lapisan (0–500 m) | $\epsilon' = 3.1 \text{ s.d. } 7.5$ | MSL_PDS_ARCHIVE |
| 29 | Geologic Stratigraphic Unit| $\text{Unit}_{\text{geo}}$ | Subsurface Radar & Geology | USGS Geological Map | formasi | Kategori Geologi Formal | JPL_TREK_DEM |
| 30 | Free-Air Gravity Anomaly | $\Delta g_{\text{fa}}$ | Subsurface Radar & Geology | MGS Radio Science | mGal | $-150 \text{ s.d. } +50$ | MSL_PDS_ARCHIVE |
| 31 | Surface Raw Visual POV | $\text{URL}_{\text{pov}}$ | Ground Visuals & EVA | Mastcam-Z / ASU Archive| URL | Citra Resolusi Asli Rover | LIVE_API |
| 32 | Aerocentric Coordinates | $(\lambda, \phi)$ | Ground Visuals & EVA | Planetary Coordinate Frame| derajat desimal | $137^\circ\text{E, }-4^\circ\text{N} \text{ / } 77^\circ\text{E, } 18^\circ\text{N}$ | JPL_TREK_DEM |
| 33 | Curiosity/Perseverance Sol | $\text{Sol}_{\text{num}}$ | Ground Visuals & EVA | Rover Mission Clock | integer | $0 \text{ s.d. } 4500+$ | MSL_PDS_ARCHIVE |
| 34 | Marswalk Route Metrics | $\vec{M}_{\text{route}}$ | Ground Visuals & EVA | A* Cost Routing Engine | km / jam / % | Jarak, Waktu, $\text{O}_2$, Baterai | PHYSICS_COMPUTED |
| 35 | Habitat Radio Line-of-Sight| $\text{LOS}_{\text{rad}}$ | Ground Visuals & EVA | Fresnel Topographic Ray| status | CONNECTED / BLOCKED | PHYSICS_COMPUTED |

---

### 3.2 Model Es Bawah Tanah SWIM (Subsurface Water Ice Mapping)
*Referensi Codebase:* `apps/web/src/lib/martian/scientificParams.ts` (Baris 35–155).

Model SWIM mengadopsi metodologi konsistensi multi-instrumen yang dikembangkan oleh konsorsium NASA SWIM (*Morgan et al., 2020*). Model ini mengombinasikan lima indikator independen ($C_N, C_T, C_G, C_{RS}, C_{RD}$) yang dinormalisasi ke dalam rentang $[-1.0, +1.0]$.

#### A. Kedalaman Penetrasi Termal Diurnal (*Diurnal Thermal Skin Depth*)
Kedalaman penetrasi gelombang panas harian matahari ke dalam regolit Mars ($z_{\text{skin}}$) dirumuskan melalui persamaan difusi panas:

$$z_{\text{skin}} = \frac{I}{\rho c \sqrt{\omega / 2}} = \frac{I}{\rho c \sqrt{\frac{\pi}{P_{\text{sol}}}}}$$

Konstanta yang digunakan:
- Inersia Termal ($I$): dalam satuan $\text{tiu}$ ($\text{J}\cdot\text{m}^{-2}\cdot\text{K}^{-1}\cdot\text{s}^{-1/2}$)
- Periode Rotasi Mars ($P_{\text{sol}}$): $88775.244 \text{ detik}$ ($24\text{ jam } 39\text{ menit } 35.244\text{ detik}$)
- Kerapatan Regolit Kering ($\rho$): $1550.0 \text{ kg/m}^3$
- Kapasitas Kalor Jenis Regolit Basaltik ($c$): $800.0 \text{ J/(kg}\cdot\text{K)}$
- Frekuensi Sudut Rotasi ($\omega$): $\omega = \frac{2\pi}{P_{\text{sol}}} \approx 7.0776 \times 10^{-5} \text{ rad/s}$
- Kapasitas Kalor Volumetrik ($\rho c$): $1550 \times 800 = 1,240,000 \text{ J/(m}^3\cdot\text{K)}$

Maka:
$$z_{\text{skin}} = \frac{I}{1,240,000 \times \sqrt{3.5388 \times 10^{-5}}} = \frac{I}{1,240,000 \times 5.9488 \times 10^{-3}} = \frac{I}{7376.5} \text{ meter}$$

*Contoh Evaluasi:* Untuk $I = 485 \text{ tiu}$, $z_{\text{skin}} = \frac{485}{7376.5} \approx 0.0657 \text{ m} = 6.57 \text{ cm}$.

#### B. Evaluasi Konsistensi Termal Subpermukaan ($C_T$)
Dihitung berdasarkan stratifikasi vertikal inersia termal lapisan penutup (*mantle*) dan lapisan substrat:
- Jika kedalaman overburden $d_{\text{mantle}} > 3.0 \times z_{\text{skin}}$, maka penetrasi termal diurnal tidak dapat mencapai substrat:
  $$C_T = 0 \quad (\text{Ambiguous / Unresolved Overburden})$$
- Jika $I_{\text{top}} < 75.0 \text{ tiu}$ dan $I_{\text{sub}} \ge 75.0 \text{ tiu}$:
  $$C_T = +1 \quad (\text{Konsisten: debu halus menutupi lapisan es/batuan terindurasi})$$
- Jika $I_{\text{top}} \ge 75.0 \text{ tiu}$ dan $I_{\text{sub}} < 75.0 \text{ tiu}$:
  $$C_T = -1 \quad (\text{Profil terbalik: kerak batuan di atas material kering berpori})$$
- Lainnya: $C_T = 0$ (Homogen).

#### C. Permitivitas Dielektrik SHARAD Radar ($\epsilon'$) & Skor $C_{RD}$
Permitivitas dielektrik nyata ($\epsilon'$) diekstraksi dari selisih waktu tempuh dua arah (*two-way travel time delay* $\Delta t$ dalam nanodetik) dari pulsa radar SHARAD ($15\text{--}25\text{ MHz}$) menembus lapisan setebal $h$ meter:

$$\epsilon' = \left( \frac{c_0 \Delta t}{2 h} \right)^2$$
dengan kecepatan cahaya dalam ruang hampa $c_0 = 0.299792 \text{ m/ns}$.

Pemetaan nilai permitivitas dielektrik $\epsilon'$ ke dalam indeks konsistensi dielektrik $C_{RD} \in [-1.0, +1.0]$:
$$C_{RD} = \begin{cases} 
+1.0 & \text{jika } \epsilon' \le 3.15 \quad (\text{Es Air Murni}) \\
1.0 - \left(\frac{\epsilon' - 3.15}{5.0 - 3.15}\right) & \text{jika } 3.15 < \epsilon' \le 5.0 \quad (\text{Campuran Es \& Regolit Terhidrasi}) \\
0.0 - \left(\frac{\epsilon' - 5.0}{7.0 - 5.0}\right) & \text{jika } 5.0 < \epsilon' \le 7.0 \quad (\text{Sulfat Padat / Tanah Terkompaksi}) \\
-1.0 & \text{jika } \epsilon' > 7.0 \quad (\text{Batuan Basal Kering / Bedrock Padat})
\end{cases}$$

#### D. Rumus Skor Komposit SWIM ($S_{\text{SWIM}}$)
Kombinasi kelima indikator dihitung melalui pembobotan geofisika:
$$S_{\text{SWIM}} = 0.25 C_N + 0.25 C_T + 0.20 C_G + 0.10 C_{RS} + 0.20 C_{RD}$$

Kategori Klasifikasi:
- $S_{\text{SWIM}} \ge +0.45$: `HIGH_CONFIDENCE_ICE`
- $+0.15 \le S_{\text{SWIM}} < +0.45$: `POTENTIAL_HYDRATED_UNIT`
- $-0.15 \le S_{\text{SWIM}} < +0.15$: `INCONCLUSIVE`
- $S_{\text{SWIM}} < -0.15$: `ICE_FREE_BEDROCK`

### 3.3 Model Perisai Magnetik Kerak Mars Global Surveyor (MGS MAG)
*Referensi Codebase:* `apps/web/src/lib/martian/scientificParams.ts` (Baris 353–373).

Mars tidak memiliki dinamo inti aktif global, tetapi memiliki medan magnet remanen purba lokal di dalam batuan kerak berumur Noachian.
Faktor reduksi dosis radiasi kosmik ($F_{\text{shield}}$ dalam %):
$$F_{\text{shield}} = \min(120, B_{\text{crust}}) \times 0.19$$
Kategori Status:
- $B_{\text{crust}} \ge 60 \text{ nT}$: `HIGH_MAGNETIC_UMBRELLA` (Reduksi dosis hingga $\sim 15\text{--}22\%$)
- $35 \le B_{\text{crust}} < 60 \text{ nT}$: `MODERATE_DEFLECTION`
- $B_{\text{crust}} < 35 \text{ nT}$: `MINIMAL_SHIELDING`

### 3.4 Model Evaluasi Risiko Jebakan Pasir Lunak (*Sand Trap Risk*)
*Referensi Codebase:* `apps/web/src/lib/martian/scientificParams.ts` (Baris 394–431).

Evaluasi daya dukung mekanis tanah (*bearing capacity*) berdasarkan inersia termal ($I$) dan temperatur inframerah malam THEMIS ($T_{\text{night}}$):
- **BEDROCK FIRM (Risiko Rendah / LOW):**
  Jika $I \ge 350 \text{ tiu}$ dan $T_{\text{night}} \ge 185 \text{ K}$:
  $$\text{Daya Dukung} = 220 \text{ kPa} \quad (\text{Traksi optimal untuk EVA astronaut dan rover})$$
- **MODERATE COMPACTION (Risiko Sedang / MODERATE):**
  Jika $I \ge 200 \text{ tiu}$ atau $T_{\text{night}} \ge 178 \text{ K}$:
  $$\text{Daya Dukung} = 110 \text{ kPa} \quad (\text{Regolit terkompaksi / kerak sulfat})$$
- **SOFT SAND TRAP RISK (Risiko Tinggi / HIGH):**
  Jika $I < 200 \text{ tiu}$ dan $T_{\text{night}} < 178 \text{ K}$:
  $$\text{Daya Dukung} = 28 \text{ kPa} \quad (\text{Bahaya amblas fatal; membutuhkan raket salju antariksa})$$

---

## BAB 4: ALGORITMA FUSI PROSPECTOR ML & SPEKTROMETRI OKSIDA CHEMCAM

Modul Prospector ML mengintegrasikan data mineralogi spektroskopi, karakteristik medan, dan kalibrasi rover ground-truth untuk menghitung potensi ekstraksi sumber daya (*In-Situ Resource Utilization / ISRU*).

### 4.1 Formulasi Sub-Skor Penilaian Prospektor
*Referensi Codebase:* `packages/shared/src/mars/prospectorScorer.ts` (Baris 90–208).

#### 1. Sub-Skor Hidrasi & Potensi Sumber Daya ($S_{\text{hyd}}$) — Bobot 38%
Menghitung konsentrasi air terikat secara struktural pada kisi kristal lempung dan garam sulfat:
$$H_{\text{raw}} = 1.1 \times \%_{\text{sulfate}} + 1.3 \times \%_{\text{clay}} + 0.4 \times \%_{\text{hematite}}$$
$$H_{\text{clamped}} = \max(0, \min(100, H_{\text{raw}}))$$

Multiplier Termal ($M_{\text{thermal}}$):
$$M_{\text{thermal}} = \begin{cases} 
1.25 & \text{jika } C_T = +1 \\
0.75 & \text{jika } C_T = -1 \\
1.00 & \text{jika } C_T = 0 
\end{cases}$$

$$S_{\text{hyd}} = \min(100, \text{round}(H_{\text{clamped}} \times M_{\text{thermal}}))$$

#### 2. Sub-Skor Jebakan Rekahan Geologi & Vena Boxwork ($S_{\text{frac}}$) — Bobot 32%
Menilai peluang mineralisasi hidrotermal sekunder pada rekahan poligon:
$$\text{TI}_{\text{norm}} = \max\left(0.0, \min\left(1.0, \frac{I - 100}{500}\right)\right)$$
$$S_{\text{frac}} = \min\left(100, \text{round}\left(\text{TI}_{\text{norm}} \times 55 + \left(\frac{\%_{\text{sulfate}}}{50}\right) \times 45\right)\right)$$

#### 3. Sub-Skor Aksesibilitas Medan EVA ($S_{\text{acc}}$) — Bobot 18%
Dihitung dari gradien kemiringan lereng ($\theta$) dan risiko jebakan pasir:
$$S_{\text{base}} = \begin{cases} 
100 & \text{jika } \theta < 15.0^\circ \quad (\text{Safe Walk}) \\
\max(30, \text{round}(100 - (\theta - 15.0) \times 6.5)) & \text{jika } 15.0^\circ \le \theta \le 25.0^\circ \quad (\text{Caution}) \\
5 & \text{jika } \theta > 25.0^\circ \quad (\text{Impassable Cliff})
\end{cases}$$

Koreksi Penalti Jebakan Pasir:
$$S_{\text{acc}} = \begin{cases} 
\max(10, S_{\text{base}} - 25) & \text{jika Sand Trap Level = HIGH} \\
\max(20, S_{\text{base}} - 10) & \text{jika Sand Trap Level = MODERATE} \\
S_{\text{base}} & \text{jika Sand Trap Level = LOW}
\end{cases}$$

#### 4. Sub-Skor Kalibrasi Ground Truth In-Situ ($S_{\text{cal}}$) — Bobot 12%
Melakukan penalti eksponensial terhadap jarak spasial dari titik kalibrasi payload rover:
$$d_{\min} = \min_{w \in \text{Waypoints}} \text{calculateMartianDistanceKm}(\vec{P}_{\text{query}}, \vec{P}_w)$$
$$S_{\text{cal}} = \max\left(15, \min\left(100, \text{round}\left(100 \times e^{-d_{\min} / 4.5}\right)\right)\right)$$

### 4.2 Skor Komposit Akhir (*Resource Promise Score*)
$$P_{\text{score}} = \max(0, \min(100, \text{round}(0.38 S_{\text{hyd}} + 0.32 S_{\text{frac}} + 0.18 S_{\text{acc}} + 0.12 S_{\text{cal}})))$$

### 4.3 Model Indeks Ketidakpastian Sensor (*Uncertainty Index*)
Total ketidakpastian model ($\pm U\%$) menggabungkan resolusi instrumen, jarak ground-truth, opasitas badai debu, dan kemiringan lereng:
$$U = \min\left(38.0, \text{parseFloat}\left(8.0 + \min\left(22.0, \frac{d_{\min}}{10.0} \times 15.0\right) + \tau_{\text{dust}} \times 12.0 + (\theta > 18.0^\circ ? 5.5 : 1.5)\right)\right)$$

Klasifikasi Tingkat Keyakinan (*Confidence Level*):
- $U \le 14.0\%$: `HIGH`
- $14.0\% < U \le 25.0\%$: `MODERATE`
- $U > 25.0\%$: `RECONNAISSANCE_ONLY`

Rekomendasi Operasional:
- Jika $\theta > 25^\circ$ atau $\text{SandTrap} = \text{HIGH} \Rightarrow$ `HAZARD_BYPASS_REQUIRED`
- Jika $P_{\text{score}} \ge 70$ dan Tingkat Keyakinan $\ne$ `RECONNAISSANCE_ONLY` $\Rightarrow$ `PRIORITY_SAMPLING_SITE`
- Lainnya $\Rightarrow$ `SECONDARY_EXPLORATION`

---

## BAB 5: ALGORITMA PERENCANAAN RUTE EVA & FISIOLOGI PLSS

Sistem navigasi Marswalk menerapkan algoritma pencarian jalur biaya minimum $A^*$ (*A-Star Search*) dengan fungsi heuristik jarak sferis Mars.

### 5.1 Perhitungan Jarak Aerocentris Lingkaran Besar (Great-Circle Distance)
*Referensi Codebase:* `packages/shared/src/mars/prospectorScorer.ts` (Baris 72–85).

Menggunakan rumus Haversine terkalibrasi jari-jari Mars ($R_{\text{mars}} = 3389.5 \text{ km}$):
$$\Delta \phi = (\phi_2 - \phi_1) \times \frac{\pi}{180^\circ}$$
$$\Delta \lambda = (\lambda_2 - \lambda_1) \times \frac{\pi}{180^\circ}$$
$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos\left(\phi_1 \frac{\pi}{180^\circ}\right) \cos\left(\phi_2 \frac{\pi}{180^\circ}\right) \sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$c = 2 \arctan2\left(\sqrt{a}, \sqrt{1 - a}\right)$$
$$d_{\text{km}} = R_{\text{mars}} \times c$$

### 5.2 Fungsi Biaya Penalti Kemiringan Lereng (*Slope Impedance*)
*Referensi Codebase:* `apps/web/src/lib/martian/scientificParams.ts` (Baris 162–195, 244–255).

Kemiringan segmen rute antara node $A$ dan $B$ dihitung secara trigonometri dari jarak horizontal dan beda ketinggian:
$$\theta = \left| \arctan2\left(|\Delta E_{\text{meter}}|, d_{\text{km}} \times 1000\right) \right| \times \frac{180^\circ}{\pi}$$

Faktor Pengali Bahaya Kemiringan ($P_{\text{slope}}$):
$$P_{\text{slope}} = \begin{cases} 
1.0 + \left(\frac{\theta}{15.0}\right) \times 0.25 & \text{jika } \theta < 15.0^\circ \quad (\text{Safe Walk}) \\
2.2 \times \exp(0.085 \times (\theta - 15.0)) & \text{jika } 15.0^\circ \le \theta \le 25.0^\circ \quad (\text{Caution}) \\
\infty & \text{jika } \theta > 25.0^\circ \quad (\text{Impassable Cliff})
\end{cases}$$

Impedansi Medan Total ($Z_{\text{terrain}}$):
$$Z_{\text{terrain}} = P_{\text{slope}} \times \left(1.0 + \sin\left(\theta_{\text{Hapke}} \frac{\pi}{180^\circ}\right) \times 0.45\right) \times (\text{Albedo} < 0.14 ? 1.15 : 1.0)$$

Biaya Sisi Graf Navigasi $A^*$:
$$\text{Cost}(A, B) = d_{\text{km}} \times Z_{\text{terrain}} \times \text{RadFactor}$$
dengan $\text{RadFactor} = 1.4$ jika rute melewati punggung bukit teradiasi tinggi ($D_{\text{rad}} > 0.70 \text{ mSv/sol}$), atau $1.0$ pada kondisi normal.

### 5.3 Model Konsumsi Habis Pakai PLSS (Portable Life Support System)
*Referensi Codebase:* `apps/web/src/lib/martian/marswalkRouter.ts` (Baris 157–182, 365–376, 486–515).

Perhitungan laju metabolik dan konsumsi oksigen bergantung pada mode dukungan operasional misi:

| Parameter Fisik & Fisiologis | Simbol | Mode 1: SOLO ASTRONAUT | Mode 2: PAIRED CREW + CARGO MULE ROVER | Satuan |
| :--- | :---: | :---: | :---: | :---: |
| Kapasitas Muatan Maksimal | $C_{\text{payload}}$ | $25.0$ | $250.0$ | kg |
| Sudut Kemiringan Maksimal Aman | $\theta_{\text{safe}}$ | $15.0^\circ$ | $22.0^\circ$ | derajat |
| Sudut Kemiringan Batas Keras | $\theta_{\text{hard}}$ | $19.0^\circ$ | $25.0^\circ$ | derajat |
| Kecepatan Jalan Nominal | $v_{\text{nom}}$ | $3.2$ | $4.6$ | km/jam |
| Kapasitas Tangki Oksigen $\text{O}_2$ | $V_{\text{tank}}$ | $1200.0$ | $4800.0$ (Umbilical Buffer) | Liter |
| Laju Konsumsi Dasar $\text{O}_2$ | $r_{\text{O2,base}}$ | $1.60$ | $1.15$ (Beban ditanggung rover) | Liter/menit |
| Koefisien Penalti Lereng $\text{O}_2$ | $k_{\text{O2,slope}}$ | $0.085$ | $0.045$ | Liter/(menit$\cdot^\circ$) |
| Kapasitas Baterai Cadangan | $E_{\text{bat}}$ | $950.0$ | $5400.0$ | Watt-jam (Wh) |
| Konsumsi Daya Dasar Sistem | $W_{\text{base}}$ | $220.0$ | $450.0$ | Watt |
| Koefisien Daya Kemiringan | $k_{\text{W,slope}}$ | $12.0$ | $18.0$ | Watt/derajat |

#### Persamaan Kecepatan dan Durasi Segmen
Kecepatan jalan efektif terdegradasi seiring peningkatan sudut kemiringan medan:
$$v(\theta) = \max\left(0.9, v_{\text{nom}} - \left(\frac{\theta}{15.0}\right) \times 1.4\right) \text{ km/jam}$$
$$\Delta t_{\text{jam}} = \frac{d_{\text{km}}}{v(\theta)}$$

#### Persamaan Konsumsi Oksigen ($\text{O}_2$)
$$R_{\text{O2}}(\theta) = r_{\text{O2,base}} + \theta \times k_{\text{O2,slope}} \quad \text{[Liter/menit]}$$
$$\text{O}_{2,\text{consumed}} = R_{\text{O2}}(\theta) \times (\Delta t_{\text{jam}} \times 60) \quad \text{[Liter]}$$
$$\text{Persentase Cadangan Tersisa} = \max\left(0, \text{round}\left(\frac{V_{\text{tank}} - \sum \text{O}_{2,\text{consumed}}}{V_{\text{tank}}} \times 100\right)\right)$$

#### Persamaan Konsumsi Energi Baterai
$$W(\theta) = W_{\text{base}} + \theta \times k_{\text{W,slope}} \quad \text{[Watt]}$$
$$E_{\text{consumed}} = W(\theta) \times \Delta t_{\text{jam}} \quad \text{[Watt-jam (Wh)]}$$
$$\text{Persentase Baterai Tersisa} = \max\left(0, \text{round}\left(\frac{E_{\text{bat}} - \sum E_{\text{consumed}}}{E_{\text{bat}}} \times 100\right)\right)$$

#### Beban Metabolik Astronaut (Kalori)
Biaya metabolik dihitung dalam ekuivalen metabolik (*Metabolic Equivalent of Task / METs*):
$$\text{METs} = 3.5 + \left(\frac{\theta}{5.0}\right) \times 1.8$$
$$\text{Kalori Terbakar (kcal)} = \text{round}\left(\text{METs} \times 80\text{ kg} \times \Delta t_{\text{jam}}\right)$$

---

## BAB 6: KALKULASI SPASIAL WORKSTATION MMGIS

Modul instrumen spasial AMMOS MMGIS pada MarsForAll menyediakan pengukuran topografi presisi tinggi, profil elevasi transek, garis pandang optik (*Line-of-Sight*), dan poligon tutupan horizon 360°.

### 6.1 Model Elevasi MOLA Parametrik Deterministik
*Referensi Codebase:* `apps/web/src/lib/martian/mmgisSpatialAnalysis.ts` (Baris 49–98).

Ketinggian datum MOLA dihitung secara analitik pada setiap koordinat $(\lambda, \phi)$:

#### Untuk Kawah Gale (Gale Crater / Mount Sharp):
Pusat puncak Aeolis Mons berada pada $(137.51^\circ\text{E}, -5.05^\circ\text{N})$ dengan elevasi puncak $-1500 \text{ m}$ dan elevasi dasar kawah $-4520 \text{ m}$. Jarak ke puncak $d_{\text{peak}}$ dihitung melalui:
$$d_{\text{peak}} = \sqrt{\left((\lambda - 137.51) \times 59.16\right)^2 + \left((\phi - (-5.05)) \times 59.16\right)^2} \text{ [km]}$$

Elevasi gundukan utama dihitung melalui fungsi Gaussian radial:
$$E_{\text{mound}} = -4520 + (-1500 - (-4520)) \times \exp\left( -\left(\frac{d_{\text{peak}}}{18.0}\right)^2 \right)$$

Penambahan relief struktur vena boxwork tenggara dan undulasi permukaan:
$$E_{\text{boxwork}} = (\phi < -5.2^\circ \text{ dan } \lambda > 137.7^\circ) ? 280 : 0$$
$$E_{\text{ripple}} = \sin(180^\circ \lambda) \times \cos(180^\circ \phi) \times 22 \text{ [m]}$$
$$E_{\text{Gale}}(\lambda, \phi) = \max(-4550, \min(-1200, \text{round}(E_{\text{mound}} + E_{\text{boxwork}} + E_{\text{ripple}})))$$

#### Untuk Kawah Jezero (Jezero Crater Floor & Delta Front):
Pusat kawah berada pada $(77.4509^\circ\text{E}, 18.3789^\circ\text{N})$ dengan dasar kawah $-2569 \text{ m}$:
$$d_{\text{center}} = \sqrt{\left((\lambda - 77.4509) \times 59.16\right)^2 + \left((\phi - 18.3789) \times 59.16\right)^2} \text{ [km]}$$
$$E_{\text{delta}} = (\lambda < 77.4509) ? (77.4509 - \lambda) \times 1200 : 0$$
$$E_{\text{rim}} = (d_{\text{center}} > 14.0) ? \min\left(600, (d_{\text{center}} - 14.0)^{1.4} \times 45\right) : 0$$
$$E_{\text{micro}} = \sin(240^\circ \lambda) \times \cos(240^\circ \phi) \times 18 \text{ [m]}$$
$$E_{\text{Jezero}}(\lambda, \phi) = \text{round}(-2569 + E_{\text{delta}} + E_{\text{rim}} + E_{\text{micro}})$$

### 6.2 Perhitungan Gradien Kemiringan Medan (*Finite Difference Slope*)
*Referensi Codebase:* `apps/web/src/lib/martian/mmgisSpatialAnalysis.ts` (Baris 103–122).

Menggunakan metode beda hingga terpusat (*central finite difference*) dengan langkah spasial $\delta = 0.0006^\circ$ ($s = \delta \times 59160 \approx 35.496 \text{ meter}$ di permukaan Mars):
$$\frac{\partial z}{\partial x} = \frac{E(\lambda + \delta, \phi) - E(\lambda - \delta, \phi)}{2 \times s}$$
$$\frac{\partial z}{\partial y} = \frac{E(\lambda, \phi + \delta) - E(\lambda, \phi - \delta)}{2 \times s}$$
$$\text{Gradien} = \sqrt{\left(\frac{\partial z}{\partial x}\right)^2 + \left(\frac{\partial z}{\partial y}\right)^2}$$
$$\theta_{\text{slope}} = \text{round}\left(\arctan(\text{Gradien}) \times \frac{180^\circ}{\pi} \times 10\right) / 10 \quad \text{[derajat]}$$

### 6.3 Raycasting Line-of-Sight (LOS) Tinggi Mata Astronaut 1.7 Meter
*Referensi Codebase:* `apps/web/src/lib/martian/mmgisSpatialAnalysis.ts` (Baris 156–224).

Diberikan titik awal pengamat $P_{\text{start}} = (\lambda_1, \phi_1)$ dan target $P_{\text{end}} = (\lambda_2, \phi_2)$ dengan elevasi tanah $E_1$ dan $E_2$.
Ketinggian mata astronaut atau antena rover ditetapkan setinggi $h_{\text{obs}} = 1.7 \text{ meter}$ di atas tanah:
$$Z_{\text{LOS,start}} = E_1 + 1.7 \text{ m}$$
$$Z_{\text{LOS,end}} = E_2 + 1.7 \text{ m}$$

Untuk setiap sampel $s$ dari $N=60$ titik sepanjang transek dengan parameter interpolasi normalisasi $t \in [0, 1]$:
$$Z_{\text{LOS}}(t) = Z_{\text{LOS,start}} + t \times (Z_{\text{LOS,end}} - Z_{\text{LOS,start}})$$

Kondisi Terobstruksi (*Line-of-Sight Obstructed*):
Jika untuk suatu titik perantara $s \in (1, N-1)$ berlaku:
$$E_{\text{ground}}(t) > Z_{\text{LOS}}(t)$$
maka berkas optik/radio dinyatakan terhalang (`isDirectLosClear = false`).

### 6.4 Pemodelan Poligon Viewshed 360°
*Referensi Codebase:* `apps/web/src/lib/martian/mmgisSpatialAnalysis.ts` (Baris 241–311).

Viewshed dihitung secara radial keluar dari posisi pengamat setinggi $E_{\text{obs}} = E(\lambda_{\text{center}}, \phi_{\text{center}}) + 1.7 \text{ m}$ sepanjang $N_{\text{ray}} = 36$ berkas azimuth ($\Delta \theta = 10^\circ$).
Setiap berkas diuji sebanyak 25 langkah bertahap hingga radius maksimum $R_{\max} = 3.0 \text{ km}$:
$$\Delta r = \frac{3.0}{25} = 0.12 \text{ km}$$

Untuk setiap langkah $k \in [1, 25]$ pada jarak $d_k = k \times \Delta r$:
$$\lambda_k = \lambda_{\text{center}} + \frac{d_k \times \sin\theta_{\text{az}}}{59.16}$$
$$\phi_k = \phi_{\text{center}} + \frac{d_k \times \cos\theta_{\text{az}}}{59.16}$$

Sudut elevasi sudut pandang vertikal terhadap horizon:
$$\alpha_k = \arctan\left( \frac{E(\lambda_k, \phi_k) - E_{\text{obs}}}{d_k \times 1000} \right)$$

Jika $\alpha_k \ge \alpha_{\max}$, titik tersebut terlihat langsung dari stasiun pengamat dan $\alpha_{\max} = \alpha_k$. Jika $\alpha_k < \alpha_{\max}$, berkas pandang terhalang oleh punggung bukit perantara, sehingga horizon terputus pada titik pandang terjauh tersebut. Titik-titik ujung terjauh ini membentuk poligon tertutup GeoJSON RFC 7946 dengan proyeksi datum `IAU_2000:49900`.

---

## BAB 7: ALGORITMA PENCOCOKAN ANALOGI BUMI (MCDA)

Modul Earth Analogue Matcher menggunakan pendekatan *Multi-Criteria Decision Analysis (MCDA)* untuk memetakan formasi batuan Mars dengan 4 lokasi pengujian analogi planet terestrial terkemuka di Bumi.

### 7.1 Fungsi Kemiripan Gaussian (*Gaussian Similarity Kernel*)
*Referensi Codebase:* `apps/web/src/lib/martian/earthAnalogueMatcher.ts` (Baris 46–52).

Kemiripan antara atribut target Mars ($v_{\text{mars}}$) dan situs Bumi ($v_{\text{earth}}$) dihitung melalui kernel eksponensial Gaussian dengan skala karakteristik $\sigma$:
$$S(v_{\text{mars}}, v_{\text{earth}}; \sigma) = \exp\left( -\frac{(v_{\text{mars}} - v_{\text{earth}})^2}{2 \sigma^2} \right)$$

### 7.2 Empat Dimensi Pencocokan Terbobot
*Referensi Codebase:* `apps/web/src/lib/martian/earthAnalogueMatcher.ts` (Baris 72–115).

1. **Kemiripan Inersia Termal ($S_{\text{thermal}}$):**
   $$\sigma_{\text{thermal}} = 140.0 \text{ tiu}$$
   $$S_{\text{thermal}} = \text{round}\left(100 \times \exp\left( -\frac{(I_{\text{mars}} - I_{\text{earth}})^2}{2 \times (140.0)^2} \right)\right)$$

2. **Kemiripan Kemiringan Lereng ($S_{\text{slope}}$):**
   $$\sigma_{\text{slope}} = 5.5^\circ$$
   $$S_{\text{slope}} = \text{round}\left(100 \times \exp\left( -\frac{(\theta_{\text{mars}} - \theta_{\text{earth}})^2}{2 \times (5.5)^2} \right)\right)$$

3. **Kemiripan Profil Mineralogi ($S_{\text{mineral}}$):**
   Atribut mineralogi dinormalisasi terhadap batas maksimum teoretis pembentukan sedimen:
   - $M_{\text{sulf}} = \min(1.0, \%_{\text{sulfate}} / 50.0)$
   - $M_{\text{hem}} = \min(1.0, \%_{\text{hematite}} / 40.0)$
   - $M_{\text{clay}} = \min(1.0, \%_{\text{clay}} / 55.0)$
   - $M_{\text{perch}} = \min(1.0, \%_{\text{perchlorate}} / 1.0)$

   Selisih absolut terhadap indeks mineralogi situs Bumi:
   $$D_{\text{min}} = 0.35(1 - |M_{\text{sulf}} - I_{\text{sulf,earth}}|) + 0.25(1 - |M_{\text{hem}} - I_{\text{hem,earth}}|) + 0.25(1 - |M_{\text{clay}} - I_{\text{clay,earth}}|) + 0.15(1 - |M_{\text{perch}} - I_{\text{perch,earth}}|)$$
   $$S_{\text{mineral}} = \text{round}(100 \times \max(0, D_{\text{min}}))$$

4. **Kemiripan Kekeringan & Proksi Radiasi ($S_{\text{rad}}$):**
   Proksi radiasi Mars diskalakan ke skala terestrial $0\text{--}100$:
   $$\text{Proxy}_{\text{rad}} = \min\left(100, \text{round}\left(\frac{D_{\text{rad}}}{0.80} \times 90\right)\right)$$
   $$\sigma_{\text{rad}} = 20.0$$
   $$S_{\text{rad}} = \text{round}\left(100 \times \exp\left( -\frac{(\text{Proxy}_{\text{rad}} - \text{Score}_{\text{aridity,earth}})^2}{2 \times (20.0)^2} \right)\right)$$

### 7.3 Skor Kecocokan Komposit Akhir
Diberikan bobot pengguna yang dinormalisasi $w_{\text{thermal}} + w_{\text{slope}} + w_{\text{mineral}} + w_{\text{rad}} = 1.0$:
$$S_{\text{analogue}} = \min(100, \max(0, \text{round}(w_{\text{thermal}} S_{\text{thermal}} + w_{\text{slope}} S_{\text{slope}} + w_{\text{mineral}} S_{\text{mineral}} + w_{\text{rad}} S_{\text{rad}})))$$

#### Basis Data Empat Situs Analog Bumi di Codebase:
1. **Yungay Hyper-Arid Core, Atacama Desert, Chile** ($I = 185\text{ tiu}, \theta = 4.5^\circ, \text{Aridity} = 98$): Analogi kekeringan ekstrem dan pengayaan garam perklorat.
2. **Haughton Impact Crater, Devon Island, Kanada** ($I = 580\text{ tiu}, \theta = 14.8^\circ, \text{Aridity} = 72$): Analogi breksi impak, es tanah permafrost ($C_T = +1$), dan hidrotermal sekunder.
3. **Mars Hill & Badwater Alluvial Fan, Death Valley, AS** ($I = 440\text{ tiu}, \theta = 21.0^\circ, \text{Aridity} = 84$): Analogi saluran longsoran puing curam (*Gediz Vallis ridge*) dan batuan terpoles angin (*ventifacts*).
4. **Río Tinto Gossan Basin, Andalusia, Spanyol** ($I = 360\text{ tiu}, \theta = 9.2^\circ, \text{Aridity} = 60$): Analogi oksidasi besi masif (hematit, goetit, jarosit) di Vera Rubin Ridge.

---

## BAB 8: REKONSTRUKSI MEDAN 3D, FOTOMETRI LAMBERTIAN, & SINTESIS AKUSTIK ANGIN MARS

### 8.1 Elevasi Medan Prosedural 3D & Pembesaran Vertikal (*Vertical Exaggeration*)
*Referensi Codebase:* `apps/web/src/components/mars/SurfacePovModal.tsx` (Baris 113–155, 652–660, 808–815).

Mesh permukaan 3D pada mode `SURFACE` dan `MESH` dibangun menggunakan bidang `PlaneGeometry(120, 120, 80, 80)` dengan luas $120 \times 120 \text{ meter}$ dan resolusi $80 \times 80$ kisi ($6400$ kuadran poligonal).
Untuk waypoint Boxwork 2025 (`curiosity_boxwork_2025`), elevasi simpul $y(x, z)$ dihitung melalui kisi poligon heksagonal sintetis:
$$y_{\text{base}} = 0.04 x - 0.025 z + 0.5 \sin(0.12 x) \cos(0.12 z)$$
$$\text{cell}_X = \left| ((0.22 x \bmod 1) + 1 \bmod 1) - 0.5 \right|$$
$$\text{cell}_Z = \left| ((0.22 z \bmod 1) + 1 \bmod 1) - 0.5 \right|$$
$$\text{diag} = \left| (((x + z) \times 0.22 \times 0.707 \bmod 1) + 1 \bmod 1) - 0.5 \right|$$
$$d_{\text{edge}} = \min(\text{cell}_X, \text{cell}_Z, \text{diag})$$

Pematangan dinding vena boxwork jika mendekati batas sel ($d_{\text{edge}} < 0.065$):
$$y_{\text{ridges}} = \left(\frac{0.065 - d_{\text{edge}}}{0.065}\right) \times 1.8 \times (0.8 + 0.3 \sin(0.5 x) \cos(0.5 z))$$
$$y(x, z) = y_{\text{base}} + y_{\text{ridges}} + 0.05 \sin(2.8 x) \sin(2.8 z)$$

Aplikasi Pengali Skala Vertikal (*Vertical Exaggeration* $\xi \in [1.0, 3.0]$, default $1.5\times$):
$$y_{\text{final}}(x, z) = y(x, z) \times \left( \frac{\xi}{1.5} \right)$$

### 8.2 Model Hamburan Fotometrik Lambertian
*Referensi Codebase:* `apps/web/src/lib/martian/scientificParams.ts` (Baris 224–242).

Dihitung berdasarkan sudut elevasi matahari Mars ($\theta_{\text{elev}}$):
Sudut datang matahari (*incidence angle*):
$$\theta_{\text{inc}} = 90^\circ - \theta_{\text{elev}}$$
$$\mu_0 = \cos\left( \theta_{\text{inc}} \frac{\pi}{180^\circ} \right)$$
$$\text{Multiplier Panjang Bayangan} = \frac{1}{\tan\left(\theta_{\text{elev}} \frac{\pi}{180^\circ}\right)}$$
$$\text{Indeks Kontras Medan} = \text{round}((1 - \mu_0) \times 100)$$
$$\text{Indeks Hamburan Silau / Glare} = \begin{cases} 
\text{round}\left( \left(1 - \frac{\theta_{\text{elev}}}{25}\right) \times 85 + 15 \right) & \text{jika } \theta_{\text{elev}} < 25^\circ \\
\text{round}\left( \max\left(5, \left(1 - \frac{\theta_{\text{elev}}}{90}\right) \times 40\right) \right) & \text{jika } \theta_{\text{elev}} \ge 25^\circ
\end{cases}$$

### 8.3 Algoritma Pemindaian Piksel Penambal Zenith & Nadir 360°
*Referensi Codebase:* `apps/web/src/components/mars/SurfacePovModal.tsx` (Baris 248–351).

Pada proyeksi bola Three.js panorama silindris rover Mastcam-Z dan Mastcam-100, bagian zenith (puncak bola) dan nadir (kaki tripod rover) sering kali meninggalkan lubang hitam atau distorsi spiral.
Fungsi `blendMartianZenithAndNadir` melakukan pemindaian seluruh array piksel kanvas $w \times h$:
Suatu piksel $(x, y)$ diklasifikasikan sebagai lubang hitam/cacat jika:
$$R < 14 \quad \text{dan} \quad G < 14 \quad \text{dan} \quad B < 14$$

Aturan Penambalan Interpolasi Spektral:
- **Untuk Zenith ($y < 0.35 h$):** Diisi dengan gradien atmosfer hamburan debu Mars:
  $$t = \frac{y}{0.35 h}$$
  $$R_{\text{patch}} = \text{round}(184(1 - t) + 140 t) \quad \text{[#b87d56 ke #8c5028]}$$
  $$G_{\text{patch}} = \text{round}(125(1 - t) + 80 t)$$
  $$B_{\text{patch}} = \text{round}(86(1 - t) + 40 t)$$
- **Untuk Nadir ($y > 0.72 h$):** Diisi dengan warna batuan dasar ferric-oxide ferit gelap:
  $$(R, G, B)_{\text{nadir}} = (74, 44, 29) \quad \text{[#4a2c1d]}$$

### 8.4 Sintesis Akustik Angin Mars Web Audio API (NASA InSight APSS Simulation)
*Referensi Codebase:* `apps/web/src/components/mars/SurfacePovModal.tsx` (Baris 407–487).

Atmosfer Mars yang tipis ($\sim 700\text{ Pa}$, 95% $\text{CO}_2$) meredam frekuensi tinggi secara drastis, sehingga desau angin terdengar sebagai dengungan frekuensi rendah (*sub-bass rumble*).
Sistem mensintesis audio ini secara prosedural tanpa aset audio eksternal menggunakan Web Audio API:

1. **Pembangkit Derau Pink (*Pink Noise Generator*):**
   Filter satu kutub (*one-pole IIR filter*) dari sumber derau putih $w_i \in [-1.0, +1.0]$:
   $$x_i = \frac{x_{i-1} + 0.02 w_i}{1.02}$$
   $$y_i = x_i \times 3.8$$

2. **Filter Resonansi Low-Pass Biquad:**
   Tipe: `lowpass`, Frekuensi Cutoff Dasar $f_0 = 260 \text{ Hz}$, Faktor Kualitas $Q = 2.2$.

3. **Modulasi Osilator LFO (Low-Frequency Oscillator):**
   Gelombang sinus $f_{\text{LFO}} = 0.18 \text{ Hz}$ dengan amplitudo modulasi $A_{\text{mod}} = 110 \text{ Hz}$:
   $$f_{\text{cutoff}}(t) = 260 + 110 \sin(2\pi \times 0.18 t) \quad \text{[Rentang: } 150 \text{ s.d. } 370 \text{ Hz]}$$

4. **Amplitudo Penguatan (*Master Gain*):**
   $$G = 0.24 \quad (-12.4 \text{ dBFS})$$

---

## BAB 9: STUDI KASUS PERHITUNGAN NUMERIK NYATA (WORKED EXAMPLES)

Untuk memvalidasi integritas matematis sistem, berikut adalah audit perhitungan numerik langkah demi langkah menggunakan parameter nyata dari dua target ilmiah utama di codebase.

### 9.1 Kasus 1: Waypoint `BOX` — Mount Sharp Boxwork 2025 (Gale Crater)
*Data Mentah Input:*
- Koordinat: $\lambda = 137.8414^\circ\text{E}, \phi = -5.4453^\circ\text{N}$
- Elevasi: $E = -4120 \text{ m}$
- Kemiringan Lereng: $\theta = 7.8^\circ$
- Inersia Termal: $I = 485 \text{ tiu}$
- Indeks Konsistensi Termal: $C_T = +1$
- Komposisi Mineralogi: Sulfat $48\%$, Lempung Smektit $24\%$, Hematit $18\%$, Silika $8\%$, Perklorat $2\%$
- Radiasi Permukaan: $0.64 \text{ mSv/sol}$
- Medan Magnet Kerak MGS MAG: $72 \text{ nT}$
- Suhu Malam THEMIS: $196 \text{ K}$
- Opasitas Debu: $\tau_{\text{dust}} = 0.32$
- Jarak ke Ground Truth Terdekat: $d_{\min} = 0.00 \text{ km}$ (titik ini adalah stasiun ground-truth rover Curiosity itu sendiri)

#### Langkah 1: Perhitungan Sub-Skor Hidrasi ($S_{\text{hyd}}$)
$$H_{\text{raw}} = (48 \times 1.1) + (24 \times 1.3) + (18 \times 0.4) = 52.8 + 31.2 + 7.2 = 91.2$$
Karena $C_T = +1$, pengali termal $M_{\text{thermal}} = 1.25$:
$$H_{\text{adjusted}} = 91.2 \times 1.25 = 114.0$$
$$S_{\text{hyd}} = \min(100, \text{round}(114.0)) = 100$$

#### Langkah 2: Perhitungan Sub-Skor Vena Boxwork ($S_{\text{frac}}$)
$$\text{TI}_{\text{norm}} = \frac{485 - 100}{500} = \frac{385}{500} = 0.77$$
$$S_{\text{frac}} = \min\left(100, \text{round}\left(0.77 \times 55 + \left(\frac{48}{50}\right) \times 45\right)\right) = \text{round}(42.35 + 43.2) = \text{round}(85.55) = 86$$

#### Langkah 3: Perhitungan Sub-Skor Aksesibilitas ($S_{\text{acc}}$)
Kemiringan $\theta = 7.8^\circ < 15.0^\circ \Rightarrow S_{\text{base}} = 100$.
Inersia termal $I = 485 \ge 350$ dan $T_{\text{night}} = 196 \ge 185 \text{ K} \Rightarrow \text{BEDROCK FIRM}$, Sand Trap Level = LOW (penalti $= 0$).
$$S_{\text{acc}} = 100$$

#### Langkah 4: Perhitungan Sub-Skor Kalibrasi In-Situ ($S_{\text{cal}}$)
Karena $d_{\min} = 0.00 \text{ km}$:
$$S_{\text{cal}} = \max(15, \min(100, \text{round}(100 \times e^{-0 / 4.5}))) = 100 \times 1.0 = 100$$

#### Langkah 5: Skor Komposit Resource Promise Score ($P_{\text{score}}$)
$$P_{\text{raw}} = 0.38(100) + 0.32(86) + 0.18(100) + 0.12(100) = 38.0 + 27.52 + 18.0 + 12.0 = 95.52$$
$$P_{\text{score}} = \text{round}(95.52) = 96\%$$

#### Langkah 6: Indeks Ketidakpastian & Rekomendasi
$$U = 8.0 + \min\left(22.0, \frac{0}{10} \times 15\right) + (0.32 \times 12.0) + 1.5 = 8.0 + 0.0 + 3.84 + 1.5 = 13.3\%$$
Karena $U = 13.3\% \le 14.0\% \Rightarrow \text{Confidence Level} = \mathbf{HIGH}$.
Rekomendasi Operasional: $\mathbf{PRIORITY\_SAMPLING\_SITE}$.

---

### 9.2 Kasus 2: Waypoint `JZR-BRT` — Cheyava Falls / Bright Angel Redox (Jezero Crater)
*Data Mentah Input:*
- Koordinat: $\lambda = 77.4120^\circ\text{E}, \phi = 18.4480^\circ\text{N}$
- Elevasi: $E = -2480 \text{ m}$
- Kemiringan Lereng: $\theta = 11.2^\circ$
- Inersia Termal: $I = 520 \text{ tiu}$
- Indeks Konsistensi Termal: $C_T = +1$
- Komposisi Mineralogi: Sulfat $42\%$, Lempung Smektit $22\%$, Hematit $26\%$, Silika $8\%$, Perklorat $2\%$
- Radiasi Permukaan: $0.58 \text{ mSv/sol}$
- Medan Magnet Kerak: $42 \text{ nT}$
- Suhu Malam THEMIS: $188 \text{ K}$
- Opasitas Debu: $\tau_{\text{dust}} = 0.32$
- Jarak ke Ground Truth: $d_{\min} = 0.00 \text{ km}$ (Stasiun rover Perseverance Sol 1220)

#### Langkah 1: Perhitungan Sub-Skor Hidrasi ($S_{\text{hyd}}$)
$$H_{\text{raw}} = (42 \times 1.1) + (22 \times 1.3) + (26 \times 0.4) = 46.2 + 28.6 + 10.4 = 85.2$$
Karena $C_T = +1$, pengali termal $M_{\text{thermal}} = 1.25$:
$$H_{\text{adjusted}} = 85.2 \times 1.25 = 106.5$$
$$S_{\text{hyd}} = \min(100, \text{round}(106.5)) = 100$$

#### Langkah 2: Perhitungan Sub-Skor Vena Boxwork/Redox ($S_{\text{frac}}$)
$$\text{TI}_{\text{norm}} = \frac{520 - 100}{500} = \frac{420}{500} = 0.84$$
$$S_{\text{frac}} = \min\left(100, \text{round}\left(0.84 \times 55 + \left(\frac{42}{50}\right) \times 45\right)\right) = \text{round}(46.2 + 37.8) = \text{round}(84.0) = 84$$

#### Langkah 3: Perhitungan Sub-Skor Aksesibilitas ($S_{\text{acc}}$)
Kemiringan $\theta = 11.2^\circ < 15.0^\circ \Rightarrow S_{\text{base}} = 100$.
$I = 520 \ge 350 \text{ tiu}$ dan $T_{\text{night}} = 188 \ge 185 \text{ K} \Rightarrow \text{BEDROCK FIRM} \Rightarrow S_{\text{acc}} = 100$.

#### Langkah 4: Perhitungan Sub-Skor Kalibrasi In-Situ ($S_{\text{cal}}$)
$$d_{\min} = 0.00 \text{ km} \Rightarrow S_{\text{cal}} = 100$$

#### Langkah 5: Skor Komposit Resource Promise Score ($P_{\text{score}}$)
$$P_{\text{raw}} = 0.38(100) + 0.32(84) + 0.18(100) + 0.12(100) = 38.0 + 26.88 + 18.0 + 12.0 = 94.88$$
$$P_{\text{score}} = \text{round}(94.88) = 95\%$$

#### Langkah 6: Indeks Ketidakpastian & Rekomendasi
$$U = 8.0 + 0.0 + 3.84 + 1.5 = 13.3\% \le 14.0\% \Rightarrow \text{Confidence Level} = \mathbf{HIGH}$$.
Rekomendasi Operasional: $\mathbf{PRIORITY\_SAMPLING\_SITE}$.

---

## BAB 10: DAFTAR PUSTAKA & ATRIBUSI ILMIAH

1. **Morgan, G. A., Putzig, N. E., Perry, M. R., et al. (2020).** *Availability of Subsurface Water-Ice for an Early Human Mars Mission: Results from the Subsurface Water Ice Mapping (SWIM) Project.* Nature Astronomy, 5(3), 230–236.
2. **Calef, F. J., Goetz, W., Berger, J. A., et al. (2017).** *Geologic Mapping of the Curiosity Rover Traverse within Gale Crater, Mars.* Planetary and Space Science, 147, 9–22.
3. **Tanaka, K. L., Skinner, J. A., Dohm, J. M., et al. (2014).** *Geologic Map of Mars.* U.S. Geological Survey Scientific Investigations Map 3292, scale 1:20,000,000.
4. **Fergason, L. R., Hare, T. M., & Laura, J. (2020).** *HRSC and MOLA Blended Digital Elevation Model at 200m Global Resolution.* USGS Astrogeology Science Center / NASA Planetary Data System (PDS).
5. **Bell, J. F., Maki, J. N., Mehall, G. L., et al. (2025).** *The Mars 2020 Perseverance Rover Mastcam-Z Investigation at Jezero Crater.* Space Science Reviews, 217(1), 24.
6. **Aberle, F., et al. (2021).** *Interactive 360-Degree Panoramic Visualizations of Jezero Crater and Mars Surface Morphology.* Freie Universität Berlin, Planetary Sciences and Remote Sensing Group (`maps.planet.fu-berlin.de/jezero/360/`).
7. **NASA AMMOS / Jet Propulsion Laboratory (2024).** *Multi-Mission Geographic Information System (MMGIS) Architecture and Spatial Tools.* NASA Open Source Software, GitHub: `NASA-AMMOS/MMGIS`.
8. **Hapke, B. (2012).** *Theory of Reflectance and Emittance Spectroscopy.* Cambridge University Press, 2nd Edition.
9. **Banerdt, W. B., et al. (2020).** *Initial Results from the InSight Mission on Mars.* Nature Geoscience, 13, 183–189.
10. **Hassler, D. M., et al. (2014).** *Mars' Surface Radiation Environment Measured with the Mars Science Laboratory's Curiosity Rover.* Science, 343(6169), 1244726.
