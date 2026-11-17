# Master Data Definition for MARSFORALL // GALE-01 Operational Guidebook
# Contains complete scientific descriptions, NASA data sources, telemetry parameters,
# and formal mathematical physics formulations for all 12 chapters.

PLANETARY_CONSTANTS = [
    ("Radius Volumetrik Mars", "R_mars", "3389.5", "km"),
    ("Massa Planet Mars", "M_mars", "6.4171 × 10²³", "kg"),
    ("Percepatan Gravitasi Permukaan", "g_mars", "3.72076 (0.379 g_Bumi)", "m/s²"),
    ("Tekanan Atmosfer Referensi Datum MOLA", "P_datum", "610.5 (Titik Tripel H₂O)", "Pa"),
    ("Tekanan Dasar Kawah Gale (-4500m)", "P_gale", "915.7", "Pa"),
    ("Massa Jenis Atmosfer Permukaan", "ρ_mars", "0.020", "kg/m³"),
    ("Kecepatan Suara di Atmosfer CO₂ Dingin", "c_sound", "240.0", "m/s"),
    ("Periode Hari Matahari Mars (Sol)", "P_sol", "88775.244 (24j 39m 35.2s)", "detik"),
    ("Skala Ketinggian Atmosfer (Scale Height)", "H_scale", "11.1", "km"),
    ("Densitas Massa Curah Regolith Mars", "ρ_regolith", "1550.0", "kg/m³"),
    ("Kapasitas Panas Spesifik Basalt Mars", "c_p", "800.0", "J kg⁻¹ K⁻¹"),
    ("Laju Radiasi Kosmik Permukaan Rata-rata", "D_rad", "0.65 (0.027 mSv/jam)", "mSv/sol")
]

MASTER_FORMULAS = [
    ("Geodesi Haversine Aerocentric", "d = R_mars · 2 atan2(√a, √(1-a))", "Kalkulasi jarak lengkung sferoid Mars akurat"),
    ("Latensi Propagasi DSN", "t_delay = D_interplanetary / c_light", "Menghitung tunda sinyal radio satu arah (12.5 menit)"),
    ("Hipsometri Barometrik Gale", "P(z) = P₀ · exp(-(z - z₀) / H)", "Tekanan atmosfer dasar kawah Gale pada -4500m"),
    ("Derivasi Kelerengan DEM", "θ = arctan(√((∂z/∂x)² + (∂z/∂y)²))", "Klasifikasi zona aman (<15°), waspada, & tebing terlarang"),
    ("Inersia Termal Regolith (ATI)", "I = √(k · ρ · c_p)", "Memisahkan batuan padat (≥350 tiu) vs pasir hisap (<200 tiu)"),
    ("Defleksi Magnet Kerak MGS", "η_shield = min(20%, B_crust × 0.19%)", "Perisai radiasi alami partikel kosmik surya (SEP/GCR)"),
    ("Stoikiometri Boxwork 2025", "Ca²⁺ + SO₄²⁻ + 2H₂O ⟶ CaSO₄·2H₂O", "Presipitasi urat gipsum hidrotermal purba Gunung Sharp"),
    ("Penetrasi Termal Kulit Harian", "z_skin = I / (ρ · c_p · √(ω/2))", "Menghitung batas kedalaman pengaruh suhu harian (~4.8 cm)"),
    ("Model 5-Term SWIM Air Bawah Tanah", "C_SWIM = Σ (w_i · C_i)", "Fusi 5 sensor satelit deteksi hidrogen & es bawah tanah"),
    ("Resource Promise Score (RPS)", "RPS = Σ (w_k · S_k) ± U%", "Skor kelayakan machine learning pembangunan habitat koloni"),
    ("Kemiripan Gaussian Analogi Bumi", "Sim(A,B) = exp(-(A-B)² / 2σ²)", "Mencocokkan geologi Mars dengan 4 lab ekstrem Bumi"),
    ("Horizon Radio Line-of-Sight", "d_LOS = √(2 R h₁) + √(2 R h₂)", "Batas keterlihatan gelombang radio antena habitat (9.21 km)"),
    ("A* Terrain-Aware Evaluation", "f(n) = g(n) + h(n) · C_step", "Pencarian rute terpendek dengan penalti kelerengan kuadratik"),
    ("Konsumsi Oksigen Metabolik", "V_O2 = V_base + k_slope · θ", "Kalkulasi konsumsi napas astronaut & cadangan aman >25%"),
    ("Aerodinamika Rotor Drone Mars", "L = 0.5 · ρ_mars · v_tip² · S · C_L", "Gaya angkat baling-baling helikopter Ingenuity 2400 RPM")
]

ALL_CHAPTERS = [
    {
        "id": "step01",
        "file": "step01_landing.png",
        "title": "Bab 1: Eksplorasi Beranda Utama & Relief Global 3D Planet Mars",
        "page": "Halaman Beranda Utama (/id)",
        "role": "Mission Commander / Astronaut Pelatihan Awal / Spesialis Komunikasi Misi",
        "action": "Arahkan kursor ke tombol aksi utama di bilah navigasi atas (Top Navbar) dan klik tombol [ BUKA PETA MARS -> ].",
        "impact": "Sistem segera menginisialisasi modul WebGL GIS dan mengalihkan antarmuka langsung ke Cockpit Kendali Habitat Mars (/id/peta).",
        "desc": "Pintu gerbang orientasi makro penjelajahan planet Mars. Menyajikan proyeksi 3D bola planet Mars berbasis elevasi MOLA, parameter antariksa makro (jarak 225 juta km, latensi radio 12.5 menit, fluks radiasi kosmik 0.65 mSv/sol), serta sorotan ilmiah temuan urat mineral Boxwork 2025 Curiosity di Kawah Gale.",
        "info_items": [
            ("Model 3D Bola Mars Interaktif (Three.js WebGL)", "Proyeksi bola planet Mars 3D bertekstur elevasi MOLA yang dapat diputar 360°, menampilkan relief Kawah Gale, Jezero, dan Olympus Mons.", "Orientasi geografis makro bagi astronaut sebelum turun ke skala medan taktis; memvisualisasikan sudut penyinaran insolasi surya."),
            ("Koordinat Datum Pendaratan (Lat: -5.4453°, Lon: 137.8414°)", "Koordinat geodetik pendaratan Bradbury Landing dan kaki Gunung Sharp (Aeolis Mons) di Kawah Gale.", "Titik datum nol mutlak (reference origin) bagi seluruh perhitungan navigasi inersial dan koridor penjelajahan rover/kru."),
            ("Jarak Bumi - Mars (225.000.000 km)", "Jarak langsung aktual antar-planet berdasarkan kalkulasi orbit elips berkala.", "Dasar estimasi logistik wahana transfer antariksawan dan penentuan jendela peluncuran transit Hohmann."),
            ("Latensi Sinyal Komunikasi (~12.5 menit / 750 detik)", "Waktu tempuh gelombang radio satu arah dari Mars ke stasiun Deep Space Network (DSN) di Bumi.", "Menegaskan urgensi operasional otonom lokal; astronaut tidak dapat menunggu arahan Bumi saat keadaan darurat di lapangan."),
            ("Laju Radiasi Kosmik Permukaan (0.65 mSv/sol)", "Fluks radiasi harian dari Galactic Cosmic Rays (GCR) dan Solar Particle Events (SEP).", "Menjadi batas dosimetri keselamatan hayati; menentukan batas waktu aman aktivitas luar habitat (EVA) sebelum mencapai batas tahunan 100 mSv."),
            ("Sorotan Ilmiah: Penemuan Boxwork 2025", "Struktur urat mineral retikuler kalsium sulfat temuan Curiosity di lereng Gunung Sharp.", "Menetapkan target primer ekspedisi lapangan untuk pengumpulan sampel inti batuan yang berpotensi menyimpan fosil jejak kehidupan mikroba purba (biosignatures)."),
            ("Tombol Aksi [ BUKA PETA MARS -> ]", "Tombol navigasi berlatar oranye cerah pada sudut kanan atas bilah navigasi.", "Memuat instrumen peta interaktif 2.5D dan mengaktifkan sub-sistem telemetri habitat secara real-time.")
        ],
        "formulas": [
            {
                "title": "Formula Jarak Geodetik Aerocentric Haversine Planet Mars",
                "citation": "NASA JPL Planetary Geodesy & IAU Working Group on Cartographic Coordinates",
                "eq_text": (
                    "Δφ = (φ₂ - φ₁) · (π / 180°),   Δλ = (λ₂ - λ₁) · (π / 180°)\n"
                    "a = sin²(Δφ / 2) + cos(φ₁ · π / 180°) · cos(φ₂ · π / 180°) · sin²(Δλ / 2)\n"
                    "c = 2 · atan2(√a, √(1 - a))\n"
                    "d_km = R_mars · c   [dengan R_mars = 3389.5 km]"
                ),
                "variables": [
                    ("φ₁, φ₂", "Garis lintang titik awal dan titik tujuan di permukaan Mars", "Derajat desimal (deg)"),
                    ("λ₁, λ₂", "Garis bujur titik awal dan titik tujuan di permukaan Mars", "Derajat desimal (deg)"),
                    ("R_mars", "Radius volumetrik rata-rata planet Mars", "3389.5 km"),
                    ("d_km", "Jarak geodetik lengkung permukaan lingkaran besar (great-circle distance)", "Kilometer (km)")
                ],
                "physical_interpretation": "Menghitung jarak terpendek lengkung permukaan planet Mars dengan memperhitungkan kelengkungan sferoid Mars. Formula ini mengeliminasi distorsi proyeksi datar 2D yang dapat menyebabkan kesalahan navigasi hingga puluhan kilometer pada skala regional."
            },
            {
                "title": "Persamaan Latensi Propagasi Gelombang Radio Antar-Planet",
                "citation": "NASA Deep Space Network (DSN) Telecommunications Link Handbook",
                "eq_text": (
                    "t_delay = D_interplanetary / c_light\n"
                    "t_delay = (225.0 × 10⁶ km) / (299,792.458 km/s) ≈ 750.52 detik ≈ 12.51 menit"
                ),
                "variables": [
                    ("D_interplanetary", "Jarak langsung Bumi-Mars pada konfigurasi orbit saat misi", "225.000.000 km"),
                    ("c_light", "Kecepatan rambat cahaya dan gelombang elektromagnetik di ruang hampa", "299,792.458 km/s"),
                    ("t_delay", "Waktu tunda transmisi sinyal radio satu arah (one-way light time)", "Menit (menit)")
                ],
                "physical_interpretation": "Dengan jeda bolak-balik (round-trip) mencapai ~25 menit, kru astronaut di Kawah Gale tidak dapat dikendalikan dari jarak jauh (remote-piloted) dari Bumi. Setiap keputusan navigasi rute dan mitigasi bahaya medan wajib dihitung secara lokal oleh platform MARSFORALL."
            }
        ],
        "sop_steps": [
            "Buka peramban dan akses alamat portal resmi platform pada URL http://localhost:3001/id.",
            "Lakukan observasi visual pada bola Mars 3D untuk mengidentifikasi cekungan Kawah Gale di belahan selatan Mars.",
            "Evaluasi metrik jarak Bumi-Mars dan latensi sinyal radio untuk memastikan kesiapan mode komputasi mandiri (offline).",
            "Klik tombol aksi navigasi utama [ BUKA PETA MARS -> ] pada bilah navigasi kanan atas untuk memasuki Cockpit Kendali Habitat."
        ],
        "safety_note": "PERINGATAN OPERASIONAL: Latensi komunikasi 12.5 menit melarang ketergantungan pada server komputasi di Bumi. Seluruh algoritma pathfinding dan dosimetri keselamatan dieksekusi secara lokal pada komputer habitat."
    },
    {
        "id": "step02",
        "file": "step02_map_overview.png",
        "title": "Bab 2: Tinjauan Cockpit Kendali Habitat & Seleksi Situs Misi",
        "page": "Cockpit Kendali Habitat Mars (/id/peta)",
        "role": "Pengendali Misi Habitat / Navigator Lapangan EVA",
        "action": "Pada Bilah Navigasi Atas, pastikan tombol pemilih situs [SITE-01: GALE (MSL)] terpilih aktif, atau klik tombol tersebut untuk memfokuskan kamera ke kaki Gunung Sharp.",
        "impact": "Kanvas peta secara otomatis melakukan fly-to dan memuat tile orbital Kawah Gale pada koordinat Lat: -5.4453°, Lon: 137.8414°.",
        "desc": "Cockpit Kendali Habitat Mars berbasis GIS 2.5D. Menampilkan citra satelit resolusi tinggi HiRISE 25cm/px & CTX 6m/px, gradasi datum elevasi MOLA (-4500m s/d -3500m), koordinat kursor real-time, status kekerasan tanah instan, serta toolbar navigasi cepat di sisi kiri.",
        "info_items": [
            ("Selektor Situs Dual-Site [SITE-01: GALE] vs [SITE-02: JEZERO]", "Sakelar pengalih konteks penelitian antara Kawah Gale (MSL Curiosity) dan Kawah Jezero (M2020 Perseverance).", "Memfokuskan seluruh katalog data geologi, rute navigasi, dan layer satelit ke situs penjelajahan yang dituju."),
            ("Kanvas Citra Satelit Orbital (HiRISE 25cm/px & CTX 6m/px)", "Citra ortofoto resolusi super tinggi hasil instrumen HiRISE dan Context Camera pada wahana Mars Reconnaissance Orbiter (MRO).", "Menampilkan tekstur medan permukaan secara fotorealistik, memungkinkan kru mengidentifikasi gundukan pasir, batuan besar, dan batas tebing secara visual."),
            ("Bilah Rentang Datum Elevasi MOLA (-4500 m s/d -3500 m)", "Gradasi bar elevasi digital Mars Orbiter Laser Altimeter terhadap rata-rata gravitasi datum Mars.", "Dasar Kawah Gale berada pada kedalaman ekstrem (-4.5 km), di mana atmosfer lebih tebal (~750-900 Pa vs puncak 100 Pa) sehingga memberikan ketahanan aerodinamis parasut lebih baik."),
            ("Bilah Koordinat Kursor Real-Time (Lat & Lon)", "Tampilan koordinat lintang dan bujur kursor di atas permukaan peta dengan presisi empat angka desimal.", "Memungkinkan operator menentukan titik pendaratan darurat atau penempatan instrumen bor dengan presisi sub-meter."),
            ("Status Cepat Kekerasan Tanah [BEDROCK FIRM] / [SAND TRAP]", "Indikator cepat daya dukung mekanis regolith tepat di bawah kursor mouse berdasarkan integrasi termal TES.", "Peringatan dini instan bagi pengemudi rover agar tidak mengarahkan jalur menuju wilayah pasir lepas yang berisiko menenggelamkan sasis.")
        ],
        "formulas": [
            {
                "title": "Model Tekanan Barometrik Hipsometri Atmosfer Kawah Gale",
                "citation": "NASA Mars Climate Database (MCD) & MSL REMS Atmospheric Investigation",
                "eq_text": (
                    "P(z) = P₀ · exp( - (z - z₀) / H_scale )\n"
                    "Pada dasar Kawah Gale (z = -4500 m, z₀ = 0 m Datum MOLA):\n"
                    "P(-4500) = 610.5 Pa · exp( - (-4500 m) / 11100 m ) ≈ 610.5 Pa · exp(0.4054) ≈ 915.7 Pa"
                ),
                "variables": [
                    ("P₀", "Tekanan atmosfer referensi datum MOLA 0m (titik tripel air)", "610.5 Pa"),
                    ("z", "Elevasi topografi kawah terhadap datum nol MOLA", "-4500 m"),
                    ("H_scale", "Skala ketinggian atmosfer Mars (scale height = k_B·T / m_CO2·g)", "11.1 km = 11100 m"),
                    ("P(z)", "Tekanan barometrik lokal di dasar cekungan kawah", "Pascal (Pa)")
                ],
                "physical_interpretation": "Karena dasar Kawah Gale berada 4.5 km di bawah datum nol Mars, tekanan udaranya mencapai ~915 Pa (50% lebih padat dibandingkan rata-rata permukaan Mars). Kerapatan udara yang lebih tinggi ini memberikan keuntungan aerodinamis bagi pendaratan kapsul dan sedikit mereduksi paparan partikel radiasi kosmik permukaan."
            }
        ],
        "sop_steps": [
            "Periksa bilah navigasi atas dan pastikan indikator tombol situs terkunci pada [SITE-01: GALE (MSL)].",
            "Gunakan roda mouse untuk melakukan pembesaran (zoom) dan geser (pan) pada area kaki barat laut Gunung Sharp.",
            "Amati pembacaan datum elevasi pada bilah bawah layar saat kursor digerakkan melintasi dasar kawah menuju punggungan bukit.",
            "Verifikasi status kekerasan tanah pada bilah telemetri kursor untuk memastikan kursor berada di atas lapisan batuan kokoh [BEDROCK FIRM]."
        ],
        "safety_note": "PROTOKOL SITUS: Perpindahan situs ke Jezero akan mengubah seluruh acuan elevasi datum dan katalog mineralogi. Jangan beralih situs ketika rute perjalanan aktif sedang dieksekusi oleh astronaut di lapangan."
    },
    {
        "id": "step03",
        "file": "step03_layers.png",
        "title": "Bab 3: Mengaktifkan 5 Lapisan Operasional Ilmiah NASA (Scientific Layers)",
        "page": "Panel Lapisan Ilmiah NASA (/id/peta?tool=layers)",
        "role": "Petugas Analisis Data Geofisika / Spesialis Keselamatan Misi",
        "action": "Klik ikon tumpukan layer pada bilah alat vertikal di sisi paling kiri, kemudian aktifkan sakelar Layer 2 (DEM Slope Hazard) dan Layer 3 (Detektor Jebakan Pasir) ke posisi AKTIF, serta atur slider opasitas sesuai kebutuhan.",
        "impact": "Kanvas peta menampilkan masker warna zona bahaya kelerengan dan wilayah pasir hisap untuk memastikan rute yang direncanakan 100% aman.",
        "desc": "Panel laci kiri menyajikan 5 Lapisan Operasional Ilmiah NASA berstandar Mars Trek & MMGIS: Layer 1 Citra Optik HiRISE/CTX & Poligon Geologi USGS; Layer 2 Topografi DEM 1m & Masker Bahaya Kelerengan (<15° Aman, 15°-25° Waspada, >25° Impassable); Layer 3 Detektor Jebakan Pasir Termal THEMIS/TES (Morgan et al. 2020); Layer 4 Mineralogi Terhidrasi CRISM & Hidrogen Ekuivalen Air (WEH %); Layer 5 Lingkungan Radiasi MSL RAD & Perisai Magnetik Kerak MGS MAG (nT).",
        "info_items": [
            ("Layer 1: Citra Optik & Unit Geologi USGS", "Poligon klasifikasi stratigrafi Noachian (>3.7 Ga), Hesperian (3.7-3.0 Ga), dan Amazonian (<3.0 Ga), termasuk formasi urat mineral retikuler Boxwork 2025.", "Memberikan kronologi usia batuan bagi astronaut untuk mengambil sampel inti dari era geologi saat Mars masih memiliki air permukaan cair berlimpah."),
            ("Layer 2: Topografi DEM 1m & Masker Kelerengan (<15°, 15-25°, >25°)", "Model elevasi digital 1 meter dengan pewarnaan zona keselamatan lereng: Hijau (<15° [SAFE]), Kuning (15°-25° [CAUTION]), dan Merah (>25° [HAZARD IMPASSABLE]).", "Mencegah kecelakaan fatal rover terbalik (rollover hazard) dan kelelahan otot parah pada astronaut pejalan kaki; menyaring lereng curam secara otomatis dari jalur pergerakan."),
            ("Layer 3: Detektor Jebakan Pasir Termal (Morgan et al. 2020)", "Peta inersia termal THEMIS Night IR & TES yang mengklasifikasikan batuan padat (>=350 tiu [BEDROCK FIRM]) vs cekungan pasir lepas (<200 tiu [SOFT SAND TRAP RISK]).", "Mencegah roda rover kargo berbobot 450 kg tenggelam di pasir amblas seperti yang dialami rover NASA Spirit pada tahun 2009; menjamin permukaan lintasan memiliki daya dukung tanah kokoh."),
            ("Layer 4: Mineralogi Terhidrasi CRISM & Air Ekuivalen (WEH %)", "Sebaran spektrometri mineral terhidrasi Compact Reconnaissance Imaging Spectrometer (Smektit, Sulfat Polihidrat, Hematit) dan persentase kandungan air setara hidrogen.", "Peta panduan utama In-Situ Resource Utilization (ISRU); memandu astronaut ke lokasi penambangan mineral sulfat kaya air yang dapat disuling menjadi air minum dan propelan roket."),
            ("Layer 5: Lingkungan Radiasi MSL RAD & Perisai Magnetik MGS MAG", "Peta intensitas medan magnet sisa purba kerak Mars (nanotesla / nT) yang dipadukan dengan data dosimeter radiasi permukaan MSL RAD (mSv/sol).", "Mengidentifikasi koridor anomali magnet kerak lokal (>40 nT) yang bertindak sebagai deflektor alami partikel angin matahari berbahaya, memberikan rute teraman bagi kesehatan DNA astronaut.")
        ],
        "formulas": [
            {
                "title": "Formula Derivasi Sudut Kelerengan Topografi DEM",
                "citation": "USGS Astrogeology Planetary DEM Processing Standards",
                "eq_text": (
                    "p = ∂z / ∂x,   q = ∂z / ∂y\n"
                    "θ_slope = arctan( √(p² + q²) ) · (180° / π)\n"
                    "Klasifikasi Bahaya:\n"
                    "θ < 15.0°  ⟶  [SAFE WALK] (Zona Hijau)\n"
                    "15.0° ≤ θ ≤ 25.0°  ⟶  [SUIT EXERTION CAUTION] (Zona Kuning)\n"
                    "θ > 25.0°  ⟶  [IMPASSABLE CLIFF HAZARD] (Zona Merah Terlarang)"
                ),
                "variables": [
                    ("p, q", "Gradien perubahan elevasi pada sumbu horizontal x dan vertikal y", "Tanpa satuan (m/m)"),
                    ("θ_slope", "Sudut kemiringan lereng permukaan lokal", "Derajat busur (deg)"),
                    ("∂z/∂x, ∂z/∂y", "Turunan parsial elevasi raster DEM sel tetangga 3x3 Sobel filter", "m/m")
                ],
                "physical_interpretation": "Menentukan batas traksi mekanis roda rover dan batas pergeseran titik berat ransel PLSS astronaut. Sudut >15° melipatgandakan beban metabolisme sebesar 8.5% per derajat, sedangkan sudut >25° melampaui sudut gesek dalam (angle of repose) pasir Mars (~30°) yang memicu longsoran regolith."
            },
            {
                "title": "Model Inersia Termal Regolith & Deteksi Pasir Lepas Morgan et al. (2020)",
                "citation": "Morgan et al. (2020) Nature Astronomy & Putzig et al. (2005) Mars Thermal Inertia",
                "eq_text": (
                    "I = √(k · ρ · c_p)   [Satuan: tiu = J m⁻² K⁻¹ s⁻¹/²]\n"
                    "Kekerasan Tanah Berdasarkan Ambang Batas Inersia Termal & Suhu Malam THEMIS:\n"
                    "I ≥ 350 tiu  &  T_night ≥ 185 K  ⟶  [BEDROCK FIRM] (Daya Dukung: 220 kPa)\n"
                    "200 ≤ I < 350 tiu  &  T_night ≥ 178 K  ⟶  [MODERATE COMPACTION] (Daya Dukung: 110 kPa)\n"
                    "I < 200 tiu  &  T_night < 178 K  ⟶  [SOFT SAND TRAP RISK] (Daya Dukung: 28 kPa)"
                ),
                "variables": [
                    ("k", "Konduktivitas termal material regolith", "W m⁻¹ K⁻¹"),
                    ("ρ", "Densitas massa curah tanah Mars (bulk density)", "1550 kg/m³"),
                    ("c_p", "Kapasitas panas spesifik batuan basaltik Mars", "800 J kg⁻¹ K⁻¹"),
                    ("I", "Apparent Thermal Inertia (ATI)", "tiu (J m⁻² K⁻¹ s⁻¹/²)"),
                    ("T_night", "Suhu kecerahan inframerah malam hari instrumen THEMIS Band 9", "Kelvin (K)")
                ],
                "physical_interpretation": "Batuan padat masif memiliki kapasitas menyimpan panas matahari yang besar sehingga tetap hangat di malam hari (T_night > 185 K, I > 350 tiu). Sebaliknya, debu halus eolian dan pasir lepas mendingin sangat cepat (T_night < 178 K, I < 200 tiu) dan memiliki daya dukung sangat rendah (28 kPa), yang dapat menenggelamkan roda sasis rover kargo seberat 450 kg."
            },
            {
                "title": "Persamaan Defleksi Radiasi Medan Magnet Kerak Purba MGS MAG",
                "citation": "Mars Global Surveyor (MGS) Magnetometer / Electron Reflectometer Investigation",
                "eq_text": (
                    "F_Lorentz = q · (v × B_crust)\n"
                    "R_gyration = (m · v_perp) / (|q| · B_crust)\n"
                    "Faktor Reduksi Dosis Radiasi Efektif (%):\n"
                    "η_shielding = min(20.0%, B_crust × 0.19%)\n"
                    "Contoh pada B_crust = 72 nT:  η_shielding = min(20%, 72 × 0.19%) = 13.68% Reduksi Dosis"
                ),
                "variables": [
                    ("B_crust", "Intensitas anomali medan magnet kerak lokal Mars Global Surveyor", "nanotesla (nT)"),
                    ("F_Lorentz", "Gaya defleksi Lorentz terhadap partikel ion surya berenergi tinggi", "Newton (N)"),
                    ("R_gyration", "Jari-jari Larmor girasi partikel bermuatan kosmik", "Meter (m)"),
                    ("η_shielding", "Persentase perlindungan radiasi efektif terhadap fluks GCR/SEP", "Persen (%)")
                ],
                "physical_interpretation": "Meskipun Mars kehilangan medan magnet dinamo globalnya 4 miliar tahun lalu, mineral feromagnetik di batuan kerak Kawah Gale mempertahankan magnetisasi sisa purba (15-85 nT). Anomali lokal ini membelokkan partikel angin matahari (Solar Energetic Particles) bermuatan, bertindak sebagai payung magnetik alami yang mereduksi akumulasi dosis radiasi biologis kru hingga ~14-20%."
            }
        ],
        "sop_steps": [
            "Klik ikon toolbar [LAPISAN DATA] di bilah kiri atas untuk memunculkan laci panel 5 layer ilmiah.",
            "Aktifkan sakelar Layer 2 (DEM Topografi & Kelerengan) untuk memunculkan lapisan masker kelerengan.",
            "Aktifkan sakelar Layer 3 (Detektor Jebakan Pasir Termal) untuk memeriksa sebaran pasir amblas di sekitar kaki bukit.",
            "Sesuaikan slider opasitas kedua layer ke tingkat 65% agar kontur citra satelit di bawahnya tetap terlihat jelas."
        ],
        "safety_note": "KRITERIA KESELAMATAN WAJIB: Jangan pernah menonaktifkan Layer 2 dan Layer 3 saat memverifikasi rute pergerakan rover kargo Mule. Rute yang melintasi zona merah (>25°) atau zona pasir hisap dilarang keras untuk dieksekusi dalam kondisi cuaca apa pun."
    },
    {
        "id": "step04",
        "file": "step04_inspector.png",
        "title": "Bab 4: Inspeksi Titik Lapangan & Forensik Geologi (Point Inspector)",
        "page": "Instrumen Point Inspector Cockpit (/id/peta)",
        "role": "Spesialis Geologi Lapangan / Astronaut Operator EVA",
        "action": "Klik sembarang titik batuan pada peta (misal stasiun Sol 4180 Boxwork) atau tombol [INSPEKSI] pada navbar. Setelah panel data forensik terbuka, klik tombol hijau utama: [ RENCANAKAN RUTE MARSWALK A* KE SINI ].",
        "impact": "Koordinat dan parameter fisik titik target terkunci ke dalam sistem navigasi taktis dan siap dihitung lintasannya oleh algoritma A*.",
        "desc": "Instrumen Point Inspector menyajikan data forensik geologi batuan: unit stratigrafi, elevasi MOLA (-3473 m), kemiringan lereng (6.5° [SAFE <15°]), status kekerasan tanah ([BEDROCK FIRM]), perisai magnetik kerak (38 nT), koordinat presisi (Lat -4.7371°, Lon 137.4966°), dan daftar mineral terhidrasi (Hematite, Sulfates & Amorphous Silica).",
        "info_items": [
            ("LOCATION & GEOLOGY (Unit Geologi)", "Nama unit stratigrafi batuan dan perkiraan era terbentuknya (misal: Mt Sharp Flank Layered Sulfate Unit, Hesperian ~3.3 Ga).", "Mengonfirmasi identitas ilmiah target pengamatan untuk pencatatan sampel geologi resmi dan memastikan batuan berasal dari horizon stratigrafi yang relevan."),
            ("MOLA ELEVATION (Elevasi MOLA)", "Nilai ketinggian vertikal titik tersebut terhadap datum referensi nol Mars (misal: -3473 m).", "Menentukan perbedaan ketinggian pendakian yang harus diatasi kru; perbedaan elevasi vertikal secara langsung melipatgandakan konsumsi daya motor rover dan laju pernapasan O2 astronaut."),
            ("SLOPE / LERENG (Kemiringan Medan)", "Derajat kemiringan sudut permukaan lokal beserta bracket status keselamatan (misal: 6.5° [SAFE <15°]).", "Memverifikasi bahwa titik pemberhentian cukup datar untuk memarkir rover tanpa risiko tergelincir dan aman bagi astronaut untuk meletakkan wadah sampel."),
            ("GROUND FIRMNESS (Kekerasan Tanah)", "Status mekanis daya dukung tanah regolith (misal: [BEDROCK FIRM] atau [SOFT SAND TRAP RISK]).", "Memastikan titik tersebut memiliki landasan batuan keras padat yang mampu menopang bobot pendaratan kaki astronaut atau pilar penyangga modul eksperimen tanpa amblas."),
            ("MAG SHIELDING (Perisai Magnetik Kerak)", "Nilai kekuatan intensitas anomali medan magnet sisa purba lokal dalam satuan nanotesla (misal: 38 nT).", "Mengindikasikan tingkat perlindungan magnetik alami terhadap radiasi partikel bermuatan kosmik saat astronaut bekerja diam di titik tersebut."),
            ("COORDINATES (Koordinat Geodetik)", "Koordinat garis lintang dan bujur dengan presisi empat digit desimal (misal: Lat -4.7371°, Lon 137.4966°).", "Koordinat presisi tinggi yang dimasukkan ke sistem inersial helm astronaut dan unit autopilot rover untuk memandu pergerakan menuju sasaran."),
            ("HYDRATED MINERALOGY (Mineral Terhidrasi)", "Daftar komposisi mineral terdeteksi oleh spektrometer CRISM (misal: Hematite, Sulfates & Amorphous Silica).", "Menilai nilai ekonomis ekstraksi air setempat (ISRU) dan potensi keawetan fosil molekuler organik di dalam matriks kristal mineral tersebut.")
        ],
        "formulas": [
            {
                "title": "Geokimia Presipitasi Hidrotermal Mineral Boxwork 2025",
                "citation": "Curiosity MSL Science Team 2025 / Grotzinger et al. Martian Sedimentary Basins",
                "eq_text": (
                    "Reaksi Pembentukan Urat Kalsium Sulfat Mengkristal dalam Retakan Rekahan:\n"
                    "Ca²⁺(aq) + SO₄²⁻(aq) + 2 H₂O(l)  ⟶  CaSO₄ · 2 H₂O(s)  [Gipsum]\n"
                    "CaSO₄ · 2 H₂O  +  ΔT  ⟶  CaSO₄ · 0.5 H₂O (Bassit) + 1.5 H₂O(g)\n"
                    "CaSO₄ · 0.5 H₂O  +  ΔT  ⟶  CaSO₄ (Anhidrit Masif) + 0.5 H₂O(g)"
                ),
                "variables": [
                    ("CaSO₄ · 2 H₂O", "Gipsum polihidrat kaya air (mengandung ~20.9% H₂O berat)", "Kristal monoklinik"),
                    ("CaSO₄", "Anhidrit sulfat dehidrasi tahan erosi angin", "Kristal ortorombik"),
                    ("ΔT", "Pemanasan gradien geotermal hidrotermal purba dasar kawah", "Kelvin (K)")
                ],
                "physical_interpretation": "Penemuan Boxwork 2025 membuktikan bahwa air bawah tanah Mars tidak lenyap seketika, melainkan mengalami sirkulasi hidrotermal berkali-kali di dalam retakan batuan pasir Hesperian. Mineral sulfat yang mengkristal di dalam retakan ini lebih keras daripada batuan induknya, sehingga ketika batuan induk terkikis oleh angin Mars selama 3 miliar tahun, urat-urat mineral ini tertinggal membentuk struktur sarang lebah (boxwork) yang menonjol."
            },
            {
                "title": "Formulasi Penetrasi Termal Kulit Harian (Diurnal Thermal Skin Depth)",
                "citation": "Kieffer et al. (1977) Mars Thermal Properties & Morgan et al. (2020)",
                "eq_text": (
                    "z_skin = I / ( ρ · c_p · √(ω / 2) )\n"
                    "dengan frekuensi rotasi sol: ω = 2π / P_sol = 2π / 88775.244 s ≈ 7.078 × 10⁻⁵ rad/s\n"
                    "Pada titik inspeksi batuan padat (I = 420 tiu, ρ = 1550 kg/m³, c_p = 800 J/kg·K):\n"
                    "z_skin = 420 / ( 1550 · 800 · √(7.078×10⁻⁵ / 2) ) ≈ 420 / ( 1240000 · 0.005949 ) ≈ 0.057 m = 5.7 cm"
                ),
                "variables": [
                    ("P_sol", "Periode satu hari rotasi Mars (sol)", "88775.244 detik"),
                    ("ω", "Frekuensi sudut rotasi diurnal planet Mars", "7.078 × 10⁻⁵ rad/s"),
                    ("z_skin", "Kedalaman penetrasi gelombang fluktuasi panas matahari harian", "Meter (m)")
                ],
                "physical_interpretation": "Gelombang panas matahari harian di Mars hanya menembus sedalam ~5.7 cm ke dalam batuan dasar. Di bawah kedalaman ini, suhu regolith stabil dan terlindung dari fluktuasi ekstrem permukaan (-80°C hingga 0°C), menjadikannya lapisan ideal untuk mendeteksi es air tanah yang terawetkan."
            }
        ],
        "sop_steps": [
            "Arahkan kursor ke titik formasi batuan target di kaki Gunung Sharp pada kanvas peta.",
            "Klik kiri sekali pada permukaan batuan untuk membuka jendela panel Point Inspector.",
            "Evaluasi seluruh parameter telemetri: pastikan SLOPE berstatus [SAFE <15°] dan GROUND FIRMNESS berstatus [BEDROCK FIRM].",
            "Klik tombol hijau [ RENCANAKAN RUTE MARSWALK A* KE SINI ] untuk menetapkan titik ini sebagai destinasi akhir rute navigasi."
        ],
        "safety_note": "BATASAN LERENG MAKSIMUM: Jangan pernah mengklik titik dengan kemiringan >15° sebagai titik henti perkemahan atau area pemindahan kargo rover. Titik dengan kemiringan di atas batas aman rentan terhadap guguran batu lepas."
    },
    {
        "id": "step05",
        "file": "step05_prospector.png",
        "title": "Bab 5: Penilaian Potensi Sumber Daya In-Situ (Prospector ML Data Fusion)",
        "page": "Panel Prospektor Sumber Daya Mars (/id/peta?tool=prospector)",
        "role": "Insinyur Sistem Pendukung Kehidupan ISRU / Perencana Koloni",
        "action": "Klik ikon segitiga peringatan/prospektor di toolbar kiri atau tombol [ANALISIS PROSPEKTOR] di kartu inspeksi, kemudian geser slider pembobotan prioritas (misal menaikkan bobot ekstraksi air atau stabilitas batuan dasar).",
        "impact": "Algoritma machine learning menghitung ulang Resource Promise Score dan Uncertainty Index secara deterministik.",
        "desc": "Mesin kecerdasan buatan Prospector ML menggabungkan 35 parameter geofisika Mars untuk mengevaluasi potensi pemanfaatan sumber daya setempat (ISRU). Menghitung Resource Promise Score (0 - 100%) dan Model Uncertainty Index (±%), dengan rincian potensi ekstraksi air dari mineral terhidrasi, stabilitas batuan pondasi, dan proteksi radiasi magnetik alami.",
        "info_items": [
            ("Resource Promise Score (0 - 100%)", "Skor komposit probabilitas keberhasilan pemanfaatan sumber daya dan pendirian tapak habitat jangka panjang.", "Menjadi indeks kuantitatif utama bagi Dewan Misi dalam memutuskan kelayakan lokasi pabrik penyulingan bahan bakar atau tapak kubah habitat sekunder."),
            ("Model Uncertainty Index (± %)", "Margin ketidakpastian matematis model statistik berdasarkan kerapatan dan konsistensi data satelit (misal: ± 4.2%).", "Menentukan tingkat keyakinan data; jika nilai uncertainty >12%, kru diwajibkan mengirim wahana robotik terlebih dahulu sebelum investasi peralatan berat."),
            ("Subsurface Water Ice Mapping (SWIM Index)", "Indeks 5-term keberadaan hidrogen dan kantong es bawah tanah dari sensor radar SHARAD dan neutron GRS/DAN.", "Mengarahkan titik pengeboran geofisika langsung ke cadangan es air bawah tanah untuk memasok kebutuhan air minum kru dan elektrolisis oksigen pangkalan."),
            ("ChemCam Elemental Oxide Composition", "Komposisi persentase berat oksida utama hasil tembakan laser spektrometer ChemCam (SiO2, FeOT, Al2O3, MgO, CaO, SO3).", "Menyediakan data geokimia untuk proses peleburan regolith menjadi bahan bangunan cetak 3D (batu bata geopolimer Mars) dan nutrisi rumah kaca hidroponik."),
            ("Slider Pembobotan Kriteria Prioritas (MCDA Sliders)", "Empat penggeser bobot interaktif: Ekstraksi Air (WEH %), Batuan Dasar (Firmness), Perisai Radiasi (Magnetic), dan Akses Kelerengan (Low Slope).", "Memberikan fleksibilitas bagi insinyur misi untuk menyesuaikan evaluasi berdasarkan prioritas mendesak saat itu.")
        ],
        "formulas": [
            {
                "title": "Model 5-Term Subsurface Water Ice Mapping (SWIM)",
                "citation": "Morgan et al. (2020) Nature Astronomy & NASA SWIM Project Protocol",
                "eq_text": (
                    "C_SWIM = w_N · C_N + w_T · C_T + w_G · C_G + w_RS · C_RS + w_RD · C_RD\n"
                    "Bobot Terkalibrasi Gale-01:  [0.30, 0.25, 0.15, 0.15, 0.15]\n"
                    "Permitivitas Dielektrik Efektif Radar SHARAD:\n"
                    "ε'_eff = ( f_ice · √ε'_ice + (1 - f_ice) · √ε'_basalt )²\n"
                    "dengan ε'_ice = 3.15 (es murni),  ε'_basalt = 7.50 (batuan basaltik)"
                ),
                "variables": [
                    ("C_N", "Indeks neutron hidrogen (MONS / DAN WEH %)", "Skala [-1.0 s/d +1.0]"),
                    ("C_T", "Konsistensi inersia termal antarmuka bawah permukaan", "Skala [-1, 0, +1]"),
                    ("C_G", "Geomorfologi poligon retakan kontraksi termal es", "Skala [-1.0 s/d +1.0]"),
                    ("C_RS, C_RD", "Reflektivitas dan permitivitas dielektrik radar penembus tanah SHARAD", "Skala [-1.0 s/d +1.0]"),
                    ("C_SWIM", "Skor komposit keberadaan es air tanah", "Rentang [-1.0 s/d +1.0]")
                ],
                "physical_interpretation": "Mengintegrasikan lima dataset geofisika independen: neutron mendeteksi atom hidrogen di kedalaman 1 meter teratas, inersia termal menguji kekerasan lapisan pengubur, geomorfologi memeriksa pola retakan tanah, dan radar SHARAD mengukur konstanta dielektrik hingga kedalaman puluhan meter. Jika ε' mendekati 3.15, ini adalah bukti definitif lensa es air murni."
            },
            {
                "title": "Formula Komposit Resource Promise Score (RPS) & Indeks Ketidakpastian",
                "citation": "NASA Mars In-Situ Resource Utilization (ISRU) Architecture Framework",
                "eq_text": (
                    "RPS = w_water · S_water + w_firm · S_firm + w_mag · S_mag + w_slope · S_slope\n"
                    "dengan bobot ternormalisasi: Σ w_i = 1.0\n"
                    "Indeks Ketidakpastian Multi-Atribut (Uncertainty Index ±%):\n"
                    "U(%) = U_base · (1.0 - B_insitu) · (1.0 + 0.5 · (τ_dust - 0.25)) · (1.0 - B_mag)\n"
                    "dengan U_base = 18.5%,  B_insitu = 1.0 / (1.0 + 0.35 · d_rover_km)"
                ),
                "variables": [
                    ("S_water", "Skor potensi ekstraksi hidrasi mineral sulfat dan lempung (0-100)", "Skor numerik"),
                    ("S_firm", "Skor daya dukung batuan dasar dari apparent thermal inertia (0-100)", "Skor numerik"),
                    ("U(%)", "Margin kesalahan ketidakpastian prediksi fusi sensor satelit", "Persen (±%)"),
                    ("B_insitu", "Faktor bobot kalibrasi jarak tanah dari temuan rover Curiosity", "0.0 s/d 1.0")
                ],
                "physical_interpretation": "RPS mengkuantifikasi peluang keberhasilan investasi koloni. Semakin dekat lokasi dengan jejak fisik rover Curiosity (d_rover kecil), semakin besar bonus kalibrasi lapangan (B_insitu), sehingga indeks ketidakpastian U(%) turun dari ±18.5% menjadi hanya ±4.2%, memberikan data kepastian tinggi bagi dewan astronaut."
            }
        ],
        "sop_steps": [
            "Buka panel Prospektor ML melalui toolbar kiri atau klik tombol [ANALISIS PROSPEKTOR] pada panel inspeksi titik.",
            "Tinjau persentase komposisi unsur oksida ChemCam untuk memastikan keberadaan mineral silika dan sulfat.",
            "Atur slider pembobotan sesuai kebutuhan misi saat ini (misal: tingkatkan bobot Ekstraksi Air ke 40% dan Batuan Dasar ke 30%).",
            "Amati nilai akhir Resource Promise Score: pastikan nilai melebihi ambang batas kelayakan minimum 70% sebelum menyetujui pendirian stasiun."
        ],
        "safety_note": "BATAS KELAYAKAN MINIMUM: Lokasi dengan skor Resource Promise di bawah 50% atau nilai Uncertainty di atas 15% dilarang ditetapkan sebagai tapak instalasi pendukung kehidupan permanen karena risiko kekurangan air dan tanah labil."
    },
    {
        "id": "step06",
        "file": "step06_analogue.png",
        "title": "Bab 6: Validasi Uji Terestrial di Bumi (Earth Analogue Matcher)",
        "page": "Panel Pencocok Analogi Bumi (/id/peta?tool=analogue)",
        "role": "Spesialis Geokimia / Perencana Pelatihan Misi Terestrial",
        "action": "Klik ikon kompas analogi di toolbar kiri atau tombol [ANALOGI BUMI] di kartu inspeksi, lalu evaluasi kartu analogi yang memiliki skor kecocokan tertinggi untuk mempelajari prosedur operasionalnya.",
        "impact": "Astronaut memperoleh panduan protokol pengujian alat dan prosedur keselamatan yang telah terverifikasi di Bumi.",
        "desc": "Algoritma Multi-Criteria Decision Analysis (MCDA) mencocokkan kondisi geologi Mars dengan 4 laboratorium lingkungan ekstrem di Bumi yang menjadi tempat uji coba baju astronaut dan rover NASA: Kawah Haughton (Arktik), Death Valley (Mojave), Río Tinto (Spanyol), dan Gurun Atacama (Cile).",
        "info_items": [
            ("Skor Kecocokan Analogi (Analogue Match %)", "Indeks persentase tingkat kemiripan geokimia, mineralogi, dan iklim antara formasi batuan Mars dengan lokasi uji coba di Bumi.", "Memberikan kepastian ilmiah bahwa kondisi fisik yang dihadapi astronaut di Mars memiliki rujukan lapangan konkret yang telah diuji selama puluhan tahun di Bumi."),
            ("Kawah Haughton (Pulau Devon, Nunavut, Arktik Kanada)", "Struktur kawah impak meteorit di lingkungan kutub beku abadi, kaya akan breksi tumbukan dan pola drainase permafrost.", "Menjadi rujukan prosedur penjelajahan di medan batuan retak dan protokol penanganan peralatan bor saat menembus lapisan regolith beku abadi."),
            ("Death Valley (Gurun Mojave, California, AS)", "Cekungan kipas aluvial kering ekstrem dengan sedimentasi garam boraks masif dan fluktuasi panas terik tinggi.", "Memberikan SOP pergerakan melintasi kerak sedimen garam rapuh dan manajemen beban termal pada sistem pendingin baju antariksa."),
            ("Río Tinto (Andalusia, Spanyol)", "Daerah aliran air asam ekstrem alami yang kaya akan zat besi teroksidasi, jarosit, dan mineral sulfat.", "Rujukan operasional paling krusial untuk formasi sulfat Gunung Sharp; menyediakan pedoman penanganan debu sulfat asam yang dapat menimbulkan korosi pada segel sendi jas EVA."),
            ("Gurun Atacama (Antofagasta, Cile)", "Wilayah paling kering di Bumi dengan kadar air mendekati 0% dan tanah kaya garam perchlorat beracun.", "Menjadi acuan protokol sterilisasi debu beracun perchlorat sebelum astronaut memasuki habitat dan uji kepekaan instrumen deteksi mikroba hidup.")
        ],
        "formulas": [
            {
                "title": "Fungsi Kemiripan Gaussian Multi-Kriteria Analogi Terestrial (MCDA)",
                "citation": "NASA Analogs & Field Testing Operations / Saaty Analytic Hierarchy Process",
                "eq_text": (
                    "Sim_Gaussian(val_A, val_B, σ) = exp( - (val_A - val_B)² / (2 · σ²) )\n"
                    "Skor Dimensi Kemiripan Analogi:\n"
                    "S_thermal = Sim(I_mars, I_earth, σ=140 tiu) · 100\n"
                    "S_slope = Sim(θ_mars, θ_earth, σ=5.5°) · 100\n"
                    "S_mineral = (0.35 · Sim_sulf + 0.25 · Sim_hem + 0.25 · Sim_clay + 0.15 · Sim_perch) · 100\n"
                    "MatchScore_Total = w_th · S_thermal + w_sl · S_slope + w_min · S_mineral + w_rad · S_rad"
                ),
                "variables": [
                    ("σ_thermal", "Skala karakteristik variansi inersia termal regolith Gale Crater", "140.0 tiu"),
                    ("σ_slope", "Skala karakteristik variansi kemiringan topografi", "5.5 derajat"),
                    ("Sim_sulf, Sim_hem", "Indeks kemiripan fraksi kandungan sulfat dan hematit besi", "0.0 s/d 1.0"),
                    ("MatchScore_Total", "Skor kecocokan komposit akhir analogi laboratorium Bumi", "0 s/d 100%")
                ],
                "physical_interpretation": "Fungsi lonceng Gaussian memetakan kedekatan fisik parameter Mars terhadap sampel Bumi secara non-linear halus. Jika formasi batuan memiliki inersia termal 420 tiu dan Río Tinto memiliki 390 tiu, nilai kemiripannya mencapai >97%, membuktikan bahwa kekerasan mekanik batuan di kedua lokasi tersebut identik."
            },
            {
                "title": "Reaksi Biogeokimia Pelapukan Pirit & Presipitasi Jarosit Río Tinto",
                "citation": "Fernández-Remolar et al. (2005) Astrobiology Río Tinto / MSL ChemCam Science",
                "eq_text": (
                    "4 FeS₂(s) + 15 O₂(aq) + 14 H₂O(l)  ⟶  4 Fe(OH)₃(s) + 8 H₂SO₄(aq)\n"
                    "K⁺ + 3 Fe³⁺ + 2 SO₄²⁻ + 6 H₂O  ⟶  KFe₃(SO₄)₂(OH)₆(s) [Jarosit Asam] + 6 H⁺"
                ),
                "variables": [
                    ("FeS₂", "Mineral pirit sulfida besi purba", "Fasa padat"),
                    ("KFe₃(SO₄)₂(OH)₆", "Jarosit kalium besi hidroksi-sulfat (indikator asam ekstrem pH 1.5 - 2.5)", "Fasa padat kristal"),
                    ("H₂SO₄", "Asam sulfat hasil oksidasi air-batuan", "Larutan aqueous")
                ],
                "physical_interpretation": "Jarosit yang ditemukan oleh rover Curiosity di Mount Sharp adalah bukti bahwa lingkungan air purba Mars bersifat asam pekat dan kaya sulfat, persis seperti air sungai merah Río Tinto di Spanyol. Uji coba ketahanan material teflon dan karet silikon baju antariksa di Río Tinto menjamin segel kedap udara tidak bocor akibat abrasi debu asam Mars."
            }
        ],
        "sop_steps": [
            "Buka panel Analogi Bumi dengan mengklik ikon toolbar kiri atau tombol [ANALOGI BUMI] pada kartu inspeksi.",
            "Tinjau persentase kecocokan 4 laboratorium ekstrem terestrial yang dihasilkan oleh algoritma MCDA.",
            "Pilih kartu laboratorium dengan skor tertinggi (misal Río Tinto 87% untuk formasi batuan sulfat).",
            "Buka dokumen panduan operasional teruji untuk menerapkan SOP pengeboran dan penanganan debu yang telah distandarisasi."
        ],
        "safety_note": "MITIGASI DEBU KOROSIF: Batuan sulfat hasil analogi Río Tinto membuktikan bahwa debu Mars dapat mengikis lapisan teflon sambungan baju antariksa. Lakukan prosedur dekontaminasi kuas vakum sebelum airlock dimasuki."
    },
    {
        "id": "step07",
        "file": "step07_spatial_tools.png",
        "title": "Bab 7: Pengukuran Spasial, Viewshed 360°, & Profil Transek 5M (NASA MMGIS)",
        "page": "Panel Alat Spasial & Peta (/id/peta?tool=tools)",
        "role": "Petugas Kartografi Spasial / Komunikator Radio Habitat",
        "action": "Klik ikon penggaris/pensil di bilah kiri, pilih opsi [UKUR / PROFIL], dan klik tombol [DOCK TRANSEK 5M] di bagian bawah panel untuk membuka jendela visualisasi grafik irisan melintang elevasi medan.",
        "impact": "Grafik kontur elevasi melintang per 5 meter terbuka di bagian bawah layar memperlihatkan profil lereng secara akurat.",
        "desc": "Menghadirkan instrumen kartografi analitis NASA MMGIS: 1. Ukur / Profil Elevasi Melintang untuk menginspeksi ketinggian tiap 5 meter; 2. Viewshed 360° Line-of-Sight untuk menghitung poligon jarak pandang visual/radio dari ketinggian mata (1.7m); 3. Penandaan ZOI (Zone of Interest) pin permanen; 4. Sol Time-Travel Scrubber riwayat rover Sol 0 - 4180.",
        "info_items": [
            ("Alat Ukur Jarak & Profil Transek Elevasi", "Fitur menggambar garis transek sembarang pada kanvas peta untuk menghitung jarak linier dan elevasi melintang setiap interval 5 meter.", "Mendeteksi perubahan kemiringan mikro atau celah ngarai sempit yang tidak tertangkap oleh citra satelit makro, mencegah rover terjebak di tebing tersembunyi."),
            ("Kalkulasi Viewshed 360° Line-of-Sight", "Perhitungan poligon keterlihatan pandang visual dan gelombang radio UHF langsung dari ketinggian mata astronaut (1.7 meter AGL) dengan memperhitungkan halangan bukit.", "Menjamin keselamatan komunikasi radio tim penjelajah; memastikan astronaut selalu berada di dalam zona kontak radio langsung dengan antena pemancar habitat tanpa titik buta sinyal (radio blindspot)."),
            ("Penandaan Titik Target ZOI (+ TANDAI ZOI)", "Fitur penancapan pin Zone of Interest permanen pada koordinat kawah dengan label nama kustom dan kategori geologi.", "Menyimpan lokasi singkapan batuan langka atau anomali magnetik tinggi sebagai target pengumpulan sampel untuk kru ekspedisi berikutnya."),
            ("Sol Time-Travel Scrubber (Sol 0 s/d Sol 4180)", "Bilah penelusuran riwayat perjalanan rover Curiosity dari hari pendaratan Sol 0 hingga penemuan Boxwork Sol 4180.", "Memungkinkan kru mempelajari perubahan morfologi debu dan memvalidasi rute-rute yang telah berhasil dilalui oleh rover NASA selama 12 tahun."),
            ("Jendela Dock Profil Transek 5M", "Grafik penampang melintang elevasi bawah layar yang memetakan kontur ketinggian vertikal terhadap jarak horizontal.", "Memberikan gambaran visual langsung mengenai kecuraman lereng kepada pengemudi rover sebelum melintasi suatu bukit atau jurang.")
        ],
        "formulas": [
            {
                "title": "Jarak Horizon Garis Pandang Gelombang Radio UHF (Radio Line-of-Sight)",
                "citation": "NASA AMMOS MMGIS Technical Architecture (Paper 2541) / ITU-R P.528",
                "eq_text": (
                    "d_LOS = √( 2 · R_mars · h_antenna ) + √( 2 · R_mars · h_astronaut )\n"
                    "dengan R_mars = 3389.5 km,  h_antenna = 5.0 m = 0.005 km,  h_astronaut = 1.7 m = 0.0017 km\n"
                    "d₁ = √( 2 · 3389.5 · 0.005 ) = √33.895 ≈ 5.822 km\n"
                    "d₂ = √( 2 · 3389.5 · 0.0017 ) = √11.524 ≈ 3.395 km\n"
                    "d_LOS_total = 5.822 km + 3.395 km ≈ 9.217 km"
                ),
                "variables": [
                    ("h_antenna", "Ketinggian tiang pemancar radio UHF pangkalan Habitat Alpha", "5.0 meter"),
                    ("h_astronaut", "Tinggi posisi antena transreceiver kaca helm astronaut", "1.7 meter"),
                    ("R_mars", "Radius planet Mars (kelengkungan sferoid)", "3389.5 km"),
                    ("d_LOS", "Batas jarak jangkauan komunikasi radio langsung tanpa halangan", "Kilometer (km)")
                ],
                "physical_interpretation": "Karena Mars memiliki diameter hanya separuh Bumi (kelengkungan permukaan dua kali lebih melengkung), jarak horizon di Mars jauh lebih pendek daripada di Bumi. Pada tanah datar, komunikasi radio UHF terputus pada jarak 9.2 km. Jika astronaut melangkah ke balik punggungan bukit sebelum mencapai jarak ini, tebing bukit akan memblokir sinyal (diffraction shadow), mewajibkan pemasangan stasiun pengulang radio (repeater)."
            },
            {
                "title": "Hamburan Fotometrik Lambertian & Perhitungan Panjang Bayangan Tebing",
                "citation": "Hapke (2012) Theory of Reflectance Spectroscopy & Planetary Photometry (Paper 2132)",
                "eq_text": (
                    "μ₀ = cos(θ_zenith) = sin(α_elevation)\n"
                    "L_shadow = h_tebing / tan(α_elevation)\n"
                    "Indeks Kontras Medan Visual:  C_terrain = round((1 - μ₀) · 100%)\n"
                    "Indeks Gangguan Silau Matahari:  G_glare = α_elev < 25° ? round((1 - α_elev/25)·85 + 15) : round((1 - α_elev/90)·40)"
                ),
                "variables": [
                    ("α_elevation", "Sudut elevasi ketinggian matahari di atas ufuk Mars", "Derajat busur (deg)"),
                    ("θ_zenith", "Sudut zenith penyinaran matahari (90° - α_elevation)", "Derajat busur (deg)"),
                    ("h_tebing", "Tinggi vertikal tebing atau bongkahan batu besar rintangan", "Meter (m)"),
                    ("L_shadow", "Panjang bayangan gelap yang diproyeksikan oleh tebing", "Meter (m)")
                ],
                "physical_interpretation": "Ketika matahari Mars berada rendah di ufuk barat (<25°), kontras permukaan melonjak dan panjang bayangan tebing meningkat drastis (L_shadow > 2.5 × h). Daerah bayangan gelap ini menyembunyikan lubang dan jebakan pasir lepas dari penglihatan astronaut, sehingga platform MMGIS memperingatkan tim navigasi untuk memperlambat laju rover."
            }
        ],
        "sop_steps": [
            "Klik ikon toolbar [ALAT SPASIAL] di bilah navigasi kiri.",
            "Klik tombol [UKUR / PROFIL] lalu klik dua titik di atas peta untuk menarik garis transek penampang.",
            "Klik tombol [DOCK TRANSEK 5M] di bagian bawah panel untuk menampilkan grafik irisan profil elevasi melintang.",
            "Klik tombol [VIEWSHED 360°] dan letakkan pin pada lokasi stasiun antena habitat untuk memverifikasi jangkauan sinyal radio."
        ],
        "safety_note": "ZONA BUTA RADIO (RADIO SHADOW): Jika hasil kalkulasi Viewshed menunjukkan rute berada di luar area hijau keterlihatan, astronaut wajib memasang modul relay radio repeater portabel di puncak punggungan bukit."
    },
    {
        "id": "step08",
        "file": "step08_marswalk_route.png",
        "title": "Bab 8: Navigasi Taktis Rute Aman Marswalk A* (3D Route HUD)",
        "page": "Cockpit Peta Operasional dengan Navigasi Rute Aktif (/id/peta)",
        "role": "Navigator Utama EVA / Pengemudi Rover Kargo Mule",
        "action": "Amati rute lintasan hijau yang terbentang di peta. Klik tombol [ STEPS ▼ ] pada bilah navigasi atas untuk membuka panduan manuver belokan navigasi langkah-demi-langkah (turn-by-turn maneuvers).",
        "impact": "Astronaut dan pengemudi rover memperoleh instruksi arah presisi yang menjamin kelangsungan hidup sebelum oksigen menyentuh batas kritis.",
        "desc": "Algoritma Terrain-Aware Marswalk A* menghitung rute teraman dari Habitat Alpha menuju target batuan dengan menerapkan penalti kelerengan kuadratik (menghindari lereng >15° dan jebakan pasir lepas). Bilah HUD Navigasi Atas menyajikan: Total Jarak (DIST: 55.86 KM), Estimasi Waktu (EST: 12.29 H EVA), Sisa Oksigen (O2: 82%), Daya Baterai (BATT: 0% / RTG), Kekuatan Perisai Magnetik (SHIELD: 59 nT), dan Indikator Status Keselamatan.",
        "info_items": [
            ("Nama Rute & Mode Mobilitas Kru", "Label judul navigasi: MarsForAll -> Mount Sharp Boxwork Formations (Curiosity 2025 Site) [PAIRED + MULE].", "Mengonfirmasi konfigurasi perjalanan lapangan: dua orang astronaut berjalan kaki didampingi satu unit rover pengangkut kargo Mule berbobot 450 kg untuk membawa sampel dan cadangan hidup."),
            ("DIST (Total Jarak Tempuh Lintasan: 55.86 KM)", "Panjang total rute perjalanan non-linier yang telah disesuaikan dengan kontur topografi kawah.", "Menjadi dasar perhitungan konsumsi daya motor listrik rover dan keausan fisik tapak roda logam di atas batuan tajam Mars."),
            ("EST (Estimasi Durasi Perjalanan: 12.29 H EVA)", "Waktu tempuh yang diproyeksikan dengan memperhitungkan kecepatan jalan kaki 2.5 km/jam dan waktu perhentian inspeksi geologi.", "Memastikan jadwal misi tidak melampaui batas maksimal shift kerja luar ruangan astronaut (maksimal 14 jam) demi mencegah penurunan konsentrasi akibat kelelahan fisik."),
            ("O2 (Proyeksi Sisa Cadangan Oksigen: 82%)", "Persentase sisa oksigen yang tersedia di dalam tabung PLSS setelah seluruh perjalanan pulang-pergi diselesaikan.", "Ambang batas keselamatan hidup paling kritis; sistem secara otomatis menolak rute jika sisa oksigen kepulangan diproyeksikan di bawah 25% (reserve margin)."),
            ("BATT (Status Daya Baterai Rover & Baju: 0% / RTG)", "Tingkat keterisian daya baterai sekunder atau ketersediaan generator termoelektrik radioisotop (RTG).", "Memantau ketersediaan energi untuk sistem pemanas jas antariksa dan motor penggerak roda kargo selama melintasi suhu malam kawah (-70°C)."),
            ("SHIELD (Rata-rata Kekuatan Perisai Magnet Kerak: 59 nT)", "Nilai rata-rata proteksi anomali magnetik kerak Mars yang dilalui di sepanjang koridor rute.", "Memverifikasi bahwa lintasan sengaja diarahkan melintasi kantong magnetik alami Gunung Sharp guna mereduksi dosis serapan radiasi kosmik kru secara kumulatif."),
            ("Status Integritas Rute [100% VERIFIED SAFE // ZERO CLIFFS]", "Label verifikasi otomatis bahwa rute 100% bebas dari tebing kelerengan >15° dan bebas dari zona pasir lepas.", "Memberikan kepastian mutlak bagi komandan misi untuk menandatangani otorisasi keberangkatan kru ke luar habitat."),
            ("Panduan Manuver Belokan Turn-by-Turn [ STEPS ▼ ]", "Daftar instruksi navigasi langkah-demi-langkah (misal: 'Maju 450m arah Azimuth 142°, belok kiri menghindari gundukan pasir').", "Memandu tim navigasi di setiap persimpangan medan agar tetap berada pada koridor aman tanpa menyimpang ke zona bahaya tersembunyi.")
        ],
        "formulas": [
            {
                "title": "Fungsi Evaluasi Biaya Least-Cost Algoritma A* & Heuristik Oktil",
                "citation": "Hart, Nilsson, & Raphael (1968) A* Algorithm / Dijkstra Graph Verification",
                "eq_text": (
                    "f(n) = g(n) + h(n)\n"
                    "Biaya Akumulasi Riil dari Node Awal:  g(n) = g(n_parent) + C_step(n_parent, n)\n"
                    "Heuristik Jarak Oktil Admissible 8-Arah:\n"
                    "h(n) = d_diag · min(Δx, Δy) + d_straight · |Δx - Δy|\n"
                    "dengan d_straight = 1.0,  d_diag = √2 ≈ 1.4142"
                ),
                "variables": [
                    ("g(n)", "Biaya riil perjalanan dari stasiun awal ke node saat ini", "Nilai biaya bobot"),
                    ("h(n)", "Estimasi biaya heuristik optimis menuju koordinat target (admissible)", "Nilai biaya bobot"),
                    ("f(n)", "Total estimasi biaya terkecil yang dievaluasi dalam priority queue", "Nilai biaya bobot"),
                    ("C_step", "Biaya impedansi langkah lokal melintasi sel grid medan", "Nilai biaya bobot")
                ],
                "physical_interpretation": "Karena heuristik jarak oktil bersifat admissible (h(n) ≤ biaya riil), algoritma A* dijamin secara matematis selalu menemukan rute dengan biaya energi terendah. Validator Dijkstra dijalankan paralel untuk menjamin rute pulang (return cost) memiliki nilai yang konsisten."
            },
            {
                "title": "Formula Penalti Kelerengan Terestrial (S_base, S_sec) & Multiplier Langkah",
                "citation": "NASA Space Apps 2026 Gale-01 Computational Specification (Slide 5)",
                "eq_text": (
                    "S_base = (θ < 15.0°) ? 100 : ((θ ≤ 25.0°) ? max(30, round(100 - (θ - 15.0) × 6.5)) : 5)\n"
                    "S_sec = (SandTrap == HIGH) ? max(10, S_base - 25) : ((SandTrap == MODERATE) ? max(20, S_base - 10) : S_base)\n"
                    "Multiplier Impedansi Langkah (Step Impedance Cost):\n"
                    "C_step = Δd · ( 1.0 + (θ / 15.0°)² + P_sand + P_radiation )\n"
                    "dengan P_sand = 15.0 (jika Sand Trap Risk) dan P_radiation = (1.0 - B_crust / 120.0) · 0.25"
                ),
                "variables": [
                    ("θ", "Sudut kemiringan lereng topografi pada segmen tersebut", "Derajat (deg)"),
                    ("S_base", "Skor dasar keselamatan kelerengan (100 = aman, 5 = tebing fatal)", "Skala 5 s/d 100"),
                    ("S_sec", "Skor keselamatan sekunder setelah penalti risiko pasir amblas", "Skala 10 s/d 100"),
                    ("C_step", "Biaya impedansi efektif yang dihindari oleh pencari rute A*", "Bobot langkah")
                ],
                "physical_interpretation": "Persamaan penalti kuadratik (θ/15°)² menyebabkan nilai biaya melonjak drastis saat lereng melebihi 15 derajat. Jika lereng menyentuh tebing >25°, skor jatuh ke 5 dan multiplier menuju tak hingga, memaksa algoritma A* membelokkan rute memutar mencari celah landai daripada memotong tebing curam."
            },
            {
                "title": "Model Dinamika Konsumsi Oksigen Metabolik & Cadangan Baterai",
                "citation": "NASA Human Integration Design Handbook (HIDH) / MSL EVA Operational Rules",
                "eq_text": (
                    "Laju Konsumsi Oksigen Pernapasan Astronaut:\n"
                    "V_O2_rate (L/min) = V_base + k_slope · θ_slope\n"
                    "Mode Solo Astronaut:  V_O2 = 1.60 L/min + (0.085 · θ) L/min\n"
                    "Mode Paired + Mule:   V_O2 = 1.15 L/min + (0.045 · θ) L/min  [Beban diangkut Rover]\n"
                    "Daya Listrik Traksi & Pemanas:  P_watt = 450.0 W + (18.0 · θ) W\n"
                    "Kriteria Keputusan GO / NO-GO Cadangan Kepulangan:\n"
                    "O2_remaining(%) = ( (TankCapacity - Σ V_consumed) / TankCapacity ) · 100% ≥ 25.0%"
                ),
                "variables": [
                    ("TankCapacity", "Kapasitas total tangki oksigen sistem buffer (Mule: 4800 Liter)", "Liter (L)"),
                    ("V_consumed", "Total volume gas O₂ murni yang dihirup selama durasi EVA", "Liter (L)"),
                    ("O2_remaining", "Persentase sisa cadangan oksigen setelah rute selesai", "Persen (%)"),
                    ("P_watt", "Daya listrik motor penggerak roda dan pemanas sistem", "Watt (W)")
                ],
                "physical_interpretation": "Pada mode Paired + Mule Rover, ransel pendukung kehidupan astronaut diringankan karena muatan tangki O₂ 4800L dan baterai 5400Wh dibawa oleh sasis rover. Akibatnya laju pernapasan turun dari 1.6 L/min menjadi 1.15 L/min. Sistem memverifikasi bahwa proyeksi sisa O₂ kepulangan adalah 82%, jauh melampaui batas darurat wajib 25%."
            }
        ],
        "sop_steps": [
            "Periksa bilah HUD Navigasi Hijau di bagian atas layar untuk memverifikasi nilai DIST, EST, dan O2.",
            "Pastikan sisa oksigen kepulangan (O2) berada di atas angka 80% dan status rute menampilkan [100% VERIFIED SAFE].",
            "Klik tombol [ STEPS ▼ ] untuk membuka menu dropdown daftar manuver belokan navigasi.",
            "Kirimkan ringkasan rute ke komputer navigasi rover Mule sebelum kru melangkah melewati pintu airlock habitat."
        ],
        "safety_note": "BATASAN DARURAT OKSIGEN: Jika selama perjalanan di lapangan pembacaan sisa O2 turun lebih cepat dari proyeksi simulasi A* (margin cadangan menyentuh 30%), astronaut wajib segera berbalik arah kembali ke habitat atau menyambungkan selang darurat ke tangki cadangan rover Mule."
    },
    {
        "id": "step09",
        "file": "step09_aerial_scout.png",
        "title": "Bab 9: Simulasi Pengintaian Udara Drone Mars (Aerial Recon Scout)",
        "page": "Modal Simulator Drone Pengintai Mars (/id/peta)",
        "role": "Pilot Drone Atmosfer / Petugas Pengintai Taktis",
        "action": "Klik tombol [AERIAL SCOUT] di bilah navigasi atas (atau ikon pesawat di toolbar kiri), pilih koordinat stasiun target penerbangan, dan klik tombol [ TERBANGKAN DRONE PENGINTAI ].",
        "impact": "Helikopter drone Ingenuity melakukan simulasi penerbangan pengintaian dan memverifikasi bahwa koridor rute bebas dari rintangan batu tajam.",
        "desc": "Simulasi helikopter drone pengintai kelas Ingenuity berdaya jelajah tinggi. Fitur ini memungkinkan astronaut melakukan pengintaian udara (aerial reconnaissance) atas koridor lintasan sebelum kru keluar dari airlock habitat, memvalidasi kondisi visual permukaan dan potensi rintangan batuan besar.",
        "info_items": [
            ("Profil Aerodinamika Atmosfer Tipis Mars", "Spesifikasi penerbangan helikopter drone kelas Ingenuity: putaran baling-baling rotor ganda koaksial 2400 RPM untuk menghasilkan gaya angkat pada atmosfer bermassa jenis 0.020 kg/m3.", "Memvalidasi kelayakan terbang drone dalam kondisi kerapatan atmosfer kawah yang hanya 1% atmosfer Bumi, memastikan wahana tidak kehilangan daya angkat (stall)."),
            ("Ketinggian Terbang Jelajah (350 m AGL)", "Ketinggian penerbangan di atas permukaan tanah (Above Ground Level) dengan kecepatan jelajah 10 m/s.", "Menyediakan sudut pandang ortofoto miring yang optimal untuk memindai kontur medan sejauh 500 meter di depan rombongan astronaut."),
            ("Preset Lokasi Sasaran Pengintaian", "Pilihan cepat destinasi terbang: Bradbury Landing, Boxwork Discovery Site, Gediz Vallis Ridge, dan Pahrump Hills.", "Mempercepat penugasan drone ke lokasi-lokasi kritis yang memiliki potensi rintangan geologi tertinggi sebelum tim ekspedisi tiba di lokasi."),
            ("Kamera Pengintai Sensorik Udara Top-Down", "Tampilan video resolusi tinggi berarah vertikal yang memperlihatkan koridor rute A* di antara celah batuan.", "Mendeteksi bongkahan batu besar baru hasil runtuhan tebing (rockfall) atau rekahan tanah sempit yang dapat mematahkan as roda rover Mule."),
            ("Tombol Luncurkan [ TERBANGKAN DRONE PENGINTAI ]", "Tombol pemicu sekuens peluncuran otonom dari dek pendaratan drone habitat.", "Menjalankan misi penerbangan pengintaian otomatis dan mengalirkan telemetri langsung ke layar kendali astronaut.")
        ],
        "formulas": [
            {
                "title": "Aerodinamika Daya Angkat Helikopter Rotorcraft di Atmosfer Renggang Mars",
                "citation": "NASA JPL Ingenuity Mars Helicopter Aerodynamics & Balaram et al. (2018)",
                "eq_text": (
                    "L = 0.5 · ρ_mars · v_tip² · S_blade · C_L = M_drone · g_mars\n"
                    "Kecepatan Ujung Bilah Baling-Baling (Tip Speed):\n"
                    "v_tip = ω_rotor · R_rotor = ( 2π · N_rpm / 60 ) · R_rotor\n"
                    "dengan N_rpm = 2400 RPM,  R_rotor = 0.60 m:\n"
                    "v_tip = ( 2π · 2400 / 60 ) · 0.60 ≈ 251.32 rad/s · 0.60 m ≈ 150.8 m/s\n"
                    "Angka Mach Ujung Bilah (Kecepatan Suara Mars c_sound ≈ 240 m/s):\n"
                    "Mach_tip = v_tip / c_sound = 150.8 / 240.0 ≈ 0.628 (Kondisi Kompresibel Subsonik)"
                ),
                "variables": [
                    ("ρ_mars", "Massa jenis atmosfer CO₂ Kawah Gale", "0.020 kg/m³ (~1% Bumi)"),
                    ("g_mars", "Percepatan gravitasi Mars", "3.72 m/s²"),
                    ("M_drone", "Massa total helikopter drone pengintai", "1.8 kg (Berat di Mars = 6.70 N)"),
                    ("v_tip", "Kecepatan linear ujung bilah baling-baling serat karbon", "150.8 m/s"),
                    ("Mach_tip", "Bilangan Mach aerodinamis ujung bilah (batas aman < 0.75)", "0.628")
                ],
                "physical_interpretation": "Karena massa jenis atmosfer Mars hanya 1% atmosfer Bumi (0.020 kg/m³), helikopter harus memutar baling-baling rotornya pada 2400 RPM (5 kali lebih cepat daripada helikopter Bumi) untuk menghasilkan gaya angkat 6.7 Newton yang menopang bobot drone 1.8 kg. Ujung bilah bergerak pada Mach 0.63, tetap berada di bawah batas gelombang kejut transonik (shockwave) yang dapat merusak bilah."
            },
            {
                "title": "Daya Induksi Terbang Mengambang (Hover Induced Power)",
                "citation": "Leishman (2006) Principles of Helicopter Aerodynamics in Planetary Environments",
                "eq_text": (
                    "P_induced = T^(1.5) / √( 2 · ρ_mars · A_disc )\n"
                    "dengan gaya dorong dorong T = M · g = 6.70 N,  Luas piringan A_disc = π · (0.60)² ≈ 1.131 m²:\n"
                    "P_induced = (6.70)^(1.5) / √( 2 · 0.020 · 1.131 ) = 17.34 / √0.04524 = 17.34 / 0.2127 ≈ 81.5 Watt\n"
                    "Total Daya Termasuk Kerugian Profil:  P_total ≈ 1.35 · P_induced + P_profile ≈ 280 Watt"
                ),
                "variables": [
                    ("T", "Gaya dorong angkat rotorcraft yang menyeimbangkan gravitasi", "6.70 N"),
                    ("A_disc", "Luas area sapuan piringan baling-baling rotor", "1.131 m²"),
                    ("P_induced", "Daya listrik minimum yang dikonsumsi motor tanpa sikat (brushless)", "Watt (W)")
                ],
                "physical_interpretation": "Daya terbang mengambang (hover) di Mars membutuhkan daya listrik yang intensif (~280 Watt). Oleh karena itu, simulasi penerbangan drone membatasi durasi sortie maksimum pada 180 detik per penerbangan sebelum baterai lithium-ion 35 Wh drone memerlukan pengisian ulang daya melalui panel surya di atas piringan habitat."
            }
        ],
        "sop_steps": [
            "Klik tombol [AERIAL SCOUT] pada bilah navigasi atas cockpit peta.",
            "Pilih stasiun target penerbangan dari menu preset (misal: Mount Sharp Boxwork Site).",
            "Verifikasi kondisi angin permukaan tidak melebihi batas toleransi terbang drone (maksimal 15 m/s).",
            "Klik tombol [ TERBANGKAN DRONE PENGINTAI ] dan amati hasil pemindaian visual koridor jalur rute."
        ],
        "safety_note": "PEMERIKSAAN HALANGAN BATU BESAR: Jika kamera drone mendeteksi bongkahan batu tajam berdiameter >50 cm di tengah jalur rute A*, navigator wajib melakukan penyesuaian rute kecil untuk memintas batu tersebut."
    },
    {
        "id": "step10",
        "file": "step10_360_pov.png",
        "title": "Bab 10: Eksplorasi Visual Permukaan Nyata (Surface 360° Cylindrical POV)",
        "page": "Penampil Permukaan 360° WebGL Three.js (/id/peta)",
        "role": "Astronaut Lapangan EVA / Spesialis Orientasi Spasial Medan",
        "action": "Klik tombol [360° POV] pada bilah navigasi atau pin kamera [📷 360] di peta. Geser kursor untuk memutar kamera 360°, beralih antara [PANORAMA 360° NYATA] dan [PERMUKAAN 3D], serta gunakan tombol tur stasiun (STN-01 s/d STN-04) di bagian bawah.",
        "impact": "Astronaut memperoleh pengenalan tanda medan (landmarks) visual setinggi mata sebelum melaksanakan ekspedisi fisik.",
        "desc": "Simulator penampil 360° permukaan Mars berbasis WebGL silindris dengan garis horizon 100% rata, datar, dan bebas dari distorsi tong melengkung. Menggunakan mozaik panorama asli Mastcam NASA (Sol 0, Sol 2137 Vera Rubin, Sol 1310 Glen Torridon, Sol 4180 Boxwork 2025). Dilengkapi pergerakan langkah astronaut (1.7m) dan audio tiupan angin atmosfer Mars InSight.",
        "info_items": [
            ("Orientasi Sudut Pandang Kamera (AZ, PITCH, FOV)", "Pembacaan telemetri sudut kamera: Azimuth horisontal (AZ: 13°), Sudut kemiringan vertikal (PITCH: 37.7°), dan Bidang pandang optik manusia (FOV: 65°).", "Memberikan orientasi spasial matematis yang presisi; astronaut dapat menyamakan pembacaan derajat azimuth di layar dengan kompas helm saat berada di medan asli."),
            ("Horizon Datar 100% (Flat Horizon Cylindrical WebGL)", "Proyeksi silindris fotorealistik khusus yang menjamin garis horizon kawah tampak 100% rata tanpa efek lengkung cembung tong (barrel distortion).", "Menyajikan proporsi bentang alam yang akurat dan alami, mencegah disorientasi visual serta menghilangkan mabuk simulator (simulator sickness) pada kru pelatihan."),
            ("Mode Rendering [PANORAMA 360° NYATA] vs [PERMUKAAN 3D]", "Sakelar pengalih antara mozaik fotorealistik asli Mastcam dan model elevasi mesh geometri 3D bertekstur batuan.", "Memungkinkan astronaut memisahkan antara warna permukaan visual dengan bentuk geometri fisik kemiringan lereng yang sesungguhnya."),
            ("Kontrol Melangkah Pejalan Kaki [ KLIK TANAH: PINDAH EVA (1.7M) ]", "Mekanisme perpindahan posisi setinggi mata astronaut (1.7 meter) dengan mengklik langsung pada permukaan tanah.", "Mensimulasikan ritme pergerakan melangkah manusia di atas permukaan tanah Mars pada gravitasi 0.38 g sebelum ekspedisi fisik dilakukan."),
            ("Bilah Stasiun Cekpoin Sejarah (STN-01 s/d STN-04)", "Empat stasiun observasi kunci: STN-01 (Sol 0 Bradbury Landing), STN-02 (Sol 1800 Vera Rubin Hematite Ridge), STN-03 (Sol 2300 Glen Torridon Clay Trough), dan STN-04 (Sol 4180 Boxwork Discovery Site).", "Memberikan pemahaman mendalam tentang transisi geologi Mount Sharp dari dasar danau berlempung purba hingga lapisan sulfat kering."),
            ("Audio Angin Atmosfer Mars InSight (AUDIO MARS: AKTIF / MATI)", "Rekaman tiupan angin atmosfer Mars asli dari sensor mikrofon tekanan udara wahana NASA InSight Lander.", "Melatih respon psikologis dan sensorik astronaut terhadap keterpencilan akustik di lingkungan atmosfer Mars bertekanan rendah (~600 Pa).")
        ],
        "formulas": [
            {
                "title": "Transformasi Geometri Proyeksi Silindris WebGL Horizon Rata",
                "citation": "Three.js WebGL Core & Cylindrical Panorama Projection Mathematics",
                "eq_text": (
                    "x = R_cylinder · sin(φ_azimuth) · cos(θ_pitch)\n"
                    "y = R_cylinder · sin(θ_pitch)\n"
                    "z = R_cylinder · cos(φ_azimuth) · cos(θ_pitch)\n"
                    "dengan koordinat tekstur silindris normal (u, v):\n"
                    "u = 0.5 + (arctan2(z, x) / 2π),   v = 0.5 - (arcsin(y / R_cylinder) / π)"
                ),
                "variables": [
                    ("φ_azimuth", "Sudut hadap mata angin horisontal (0° Utara s/d 360°)", "Radian (rad)"),
                    ("θ_pitch", "Sudut tengadah / tunduk pandangan mata astronaut (-90° s/d +90°)", "Radian (rad)"),
                    ("R_cylinder", "Jari-jari radius silinder geometri proyeksi WebGL (500 meter simulasi)", "Meter (m)"),
                    ("u, v", "Koordinat pemetaan tekstur UV kanvas mozaik Mastcam", "Skala 0.0 s/d 1.0")
                ],
                "physical_interpretation": "Proyeksi silindris ini mempertahankan garis horizon y = 0 tetap sejajar dengan mata manusia pada elevasi 1.7m tanpa lengkungan distorsi cembung tong (barrel distortion) yang biasa terjadi pada proyeksi bola biasa. Hal ini memastikan puncak Gunung Sharp terlihat proporsional dan akurat untuk penilaian jarak visual."
            },
            {
                "title": "Kriteria Resolusi Sudut Ketajaman Mata Manusia di Mars",
                "citation": "Rayleigh Criterion of Optical Resolution / NASA Human Factor Architecture",
                "eq_text": (
                    "θ_res = 1.22 · λ_cahaya / D_pupil\n"
                    "dengan panjang gelombang spektrum tampak λ = 550 nm = 5.5 × 10⁻⁷ m,  D_pupil = 4.0 mm = 0.004 m:\n"
                    "θ_res = 1.22 · (5.5 × 10⁻⁷ m) / 0.004 m ≈ 1.677 × 10⁻⁴ rad ≈ 0.576 arcmin ≈ 1 menit busur\n"
                    "Ukuran Rintangan Terkecil yang Dapat Dideteksi pada Jarak 500 meter:\n"
                    "S_min = 500 m · θ_res ≈ 500 m · 1.677 × 10⁻⁴ rad ≈ 0.084 m = 8.4 cm"
                ),
                "variables": [
                    ("D_pupil", "Diameter pupil mata astronaut di balik kaca helm terpolarisasi", "4.0 mm"),
                    ("λ_cahaya", "Panjang gelombang cahaya tampak puncak spektrum matahari Mars", "550 nm (Hijau-Kuning)"),
                    ("S_min", "Dimensi terkecil bongkahan batu yang dapat dibedakan mata manusia", "Sentimeter (cm)")
                ],
                "physical_interpretation": "Pada jarak 500 meter, mata manusia dengan ketajaman normal mampu mengenali rintangan batu berdiameter ~8.4 cm. Pelatihan visual 360° di dalam simulator WebGL membiasakan mata mengenali siluet tanda medan alami (landmark) sebagai cadangan navigasi visual primer apabila sistem penentuan posisi digital (GPS/inersial) mengalami gangguan."
            }
        ],
        "sop_steps": [
            "Buka penampil panorama 360° dengan mengklik tombol [360° POV] pada bilah navigasi atau pin kamera di peta.",
            "Klik dan geser (drag) kursor ke kiri dan kanan untuk memutar pandangan 360° mengelilingi puncak Mount Sharp.",
            "Klik tombol stasiun [STN-04: SOL 4180] di bilah bawah untuk melihat pemandangan formasi urat mineral Boxwork 2025.",
            "Klik opsi [AUDIO MARS: AKTIF] untuk menguji kesiapan sensorik pendengaran dalam simulasi kondisi lapangan."
        ],
        "safety_note": "PELATIHAN MEDAN VISUAL: Seluruh kru EVA wajib menyelesaikan simulasi peninjauan 360° di 4 stasiun utama untuk menghafal bentuk siluet puncak bukit sebagai penanda arah alami jika sistem navigasi digital mengalami gangguan."
    },
    {
        "id": "step11",
        "file": "step11_visor_hud.png",
        "title": "Bab 11: Uji Lapangan Kaca Helm Astronaut (Astronaut Visor HUD)",
        "page": "Mode Sudut Pandang Visor Helm Astronaut (/id/peta)",
        "role": "Astronaut Lapangan EVA / Petugas Dukungan Hidup Medis",
        "action": "Klik tombol [HUD VISOR ASTRONOT] di bilah navigasi atas untuk mengaktifkan tampilan kaca helm, dan amati respon instrumen kompas serta telemetri pendukung kehidupan terhadap pergerakan arah pandang.",
        "impact": "Menguji ergonomi pembacaan arah navigasi dan peringatan keselamatan saat astronaut berada langsung di medan Mars.",
        "desc": "Beralih dari tampilan kendali stasiun GIS ke simulasi Heads-Up Display (HUD) di dalam kaca helm baju antariksa. Menyajikan kompas taktis militer 360° di bagian atas, horizon buatan pitch & roll, batas peringatan bahaya medan, serta telemetri konsumsi oksigen dan daya baterai real-time.",
        "info_items": [
            ("Pita Kompas Taktis Militer 360° (Tactical Ribbon Compass)", "Indikator kompas pita bergerak di bagian atas kaca helm yang menampilkan derajat arah kardinal (N, NE, E, SE, S, SW, W, NW) beserta retikel target navigasi.", "Memandu langkah astronaut secara bebas tangan (hands-free); astronaut cukup menjaga tanda target tetap di tengah pita kompas tanpa perlu menunduk memegang peta gawai."),
            ("Horizon Buatan & Skala Kemiringan Tubuh (Pitch/Roll Ladder)", "Garis acuan horizon digital yang menunjukkan sudut kemiringan postur tubuh astronaut terhadap gaya tarik gravitasi Mars (0.38 g).", "Mencegah disorientasi gravitasi di tengah badai debu atau saat mendaki tebing di mana batas garis horizon asli tertutup kabut debu."),
            ("Telemetri Dukungan Hidup PLSS (Life Support Telemetry)", "Panel status biologis astronaut: Tekanan Jas (29.6 kPa), Konsumsi O2 (0.48 L/min), Detak Jantung (99 BPM), dan Baterai PLSS (88% / ~7.4 jam).", "Parameter hidup-mati paling vital; memberikan alarm instan jika terjadi dekompresi baju antariksa (tekanan <20 kPa) atau kelelahan jantung ekstrem (>140 BPM)."),
            ("Stasiun Cuaca Lingkungan REMS (Rover Environmental Station)", "Parameter cuaca permukaan luar: Suhu Udara (-62°C), Tekanan Atmosfer (712 Pa), Ketebalan Debu (Tau: 0.32), dan Laju Radiasi MSL RAD (0.027 mSv/jam).", "Memperingatkan kedatangan badai debu lokal jika indeks Optical Depth Tau meningkat tajam, serta memantau akumulasi dosis radiasi secara langsung pada tubuh."),
            ("Indikator Peringatan Bahaya Medan [SLOPE SAFE: 4.2°]", "Status kelerengan tanah yang sedang dipijak oleh sepatu astronaut beserta kekuatan perisai magnetik kerak saat ini (64 nT).", "Memberikan kewaspadaan situasional mikro agar astronaut tidak melangkah ke permukaan miring licin yang berisiko merusak baju antariksa.")
        ],
        "formulas": [
            {
                "title": "Termodinamika Tekanan Diferensial Jas Antariksa & Batas Armstrong",
                "citation": "NASA EVA Suit Design Handbook (EMU/xEMU Standards) & Armstrong Limit Physiology",
                "eq_text": (
                    "ΔP_suit = P_internal - P_ambient\n"
                    "dengan P_internal = 29.6 kPa (100% O₂ murni),  P_ambient = 0.712 kPa (Kawah Gale):\n"
                    "ΔP_suit = 29.600 kPa - 0.712 kPa = 28.888 kPa\n"
                    "Batas Titik Didih Cairan Tubuh Suhu Badan 37°C (Batas Kritis Armstrong):\n"
                    "P_Armstrong = 6.30 kPa  ⟶  Ambang Alarm Kebocoran Darurat: P_suit < 20.0 kPa"
                ),
                "variables": [
                    ("P_internal", "Tekanan gas oksigen murni di dalam rongga pakaian antariksa", "29.6 kPa"),
                    ("P_ambient", "Tekanan atmosfer luar lingkungan permukaan Kawah Gale", "0.712 kPa = 712 Pa"),
                    ("ΔP_suit", "Beban tekanan diferensial struktur kain dan segel sendi baju", "28.89 kPa"),
                    ("P_Armstrong", "Batas tekanan uap air jenuh tubuh manusia (ebullism threshold)", "6.30 kPa")
                ],
                "physical_interpretation": "Tekanan 29.6 kPa oksigen murni memberikan tekanan parsial alveolar yang setara dengan bernapas di permukaan laut Bumi tanpa menimbulkan risiko penyakit dekompresi (bends). Jika jas robek dan tekanan turun di bawah batas Armstrong 6.3 kPa, air liur, darah, dan cairan tubuh akan mendidih secara spontan pada suhu tubuh manusia normal (37°C). Alarm HUD berbunyi pada 20.0 kPa untuk memberikan waktu 60 detik mencari perlindungan ke modul rover."
            },
            {
                "title": "Hukum Beer-Lambert Kepunahan Cahaya oleh Ketebalan Optik Debu (Tau)",
                "citation": "MSL REMS Dust Opacity & Solar Radiation Team / Lemmon et al. (2015)",
                "eq_text": (
                    "I_surface = I_top · exp( - τ_dust / cos(θ_zenith) )\n"
                    "dengan I_top = 590 W/m² (Konstanta surya Mars),  θ_zenith = 35° (cos 35° ≈ 0.819):\n"
                    "Kondisi Langit Cerah Nominal (τ_dust = 0.32):\n"
                    "I_surface = 590 · exp( - 0.32 / 0.819 ) = 590 · exp(-0.3907) ≈ 399.1 W/m²\n"
                    "Kondisi Badai Debu Regional (τ_dust = 1.80):\n"
                    "I_surface = 590 · exp( - 1.80 / 0.819 ) = 590 · exp(-2.1978) ≈ 65.4 W/m² (Daya Panel Drop 83%)"
                ),
                "variables": [
                    ("τ_dust", "Ketebalan optik debu atmosfer (Optical Depth Tau)", "Tanpa satuan"),
                    ("θ_zenith", "Sudut zenith penyinaran matahari terhadap sumbu vertikal", "Derajat (deg)"),
                    ("I_surface", "Intensitas radiasi fluks surya yang mencapai tanah", "W/m²"),
                    ("I_top", "Fluks radiasi surya di puncak lapisan atmosfer Mars", "590 W/m²")
                ],
                "physical_interpretation": "Indeks Tau mengukur seberapa pekat debu tersuspensi di udara Mars. Kenaikan Tau dari 0.32 ke 1.80 memotong 83% pasokan energi cahaya matahari ke panel surya pangkalan dan menurunkan jarak pandang mata secara drastis. Visor HUD memantau metrik Tau ini secara real-time dan memperingatkan astronaut untuk segera membatalkan ekspedisi jika Tau meningkat di atas ambang bahaya 0.8."
            }
        ],
        "sop_steps": [
            "Klik tombol [HUD VISOR ASTRONOT] di bilah navigasi atas cockpit peta.",
            "Periksa pembacaan kotak kiri telemetri PLSS: pastikan tekanan jas berada pada rentang aman 28 - 32 kPa.",
            "Perhatikan pita kompas atas dan sesuaikan arah tubuh agar retikel sasaran mengarah ke sudut azimuth rute.",
            "Amati kotak kanan stasiun cuaca REMS: pastikan Optical Depth Tau berada di bawah ambang batas bahaya 0.8."
        ],
        "safety_note": "ALARM TEKANAN JAS ANTARIKSA: Jika indikator tekanan jas antariksa berkedip merah dan turun di bawah 20 kPa, astronaut wajib segera mengaktifkan pasokan O2 darurat sekunder dan masuk ke modul rover Mule dalam waktu <60 detik."
    },
    {
        "id": "step12",
        "file": "step12_export_eva.png",
        "title": "Bab 12: Ekspor Paket Dokumen Operasional Misi (GeoJSON Package)",
        "page": "Cockpit Kendali Habitat Mars (/id/peta)",
        "role": "Petugas Integrasi Sistem Data Misi / Komandan Lapangan",
        "action": "Arahkan kursor ke sudut paling kanan atas bilah navigasi dan klik tombol hijau [EKSPOR EVA] untuk mengunduh paket data kartografi misi secara lengkap.",
        "impact": "Sistem menghasilkan dan mengunduh berkas GeoJSON terkompresi yang siap diimpor langsung ke komputer navigasi rover dan gawai astronaut.",
        "desc": "Langkah final sebelum misi lapangan diluncurkan adalah mengekspor paket data kartografi terintegrasi. Berkas standar GeoJSON yang diunduh mencakup seluruh koordinat titik waypoint, rute navigasi A*, batas zona bahaya kelerengan, fitur ZOI geologi, serta profil elevasi 5 meter.",
        "info_items": [
            ("Standar Format Terbuka GeoJSON RFC 7946", "Format pertukaran data geospasial berbasis JSON yang mematuhi standar universal International Open Geospatial Consortium (OGC).", "Memastikan interoperabilitas mutlak; data dapat langsung dimuat ke berbagai platform GIS seperti NASA MMGIS, QGIS, ArcGIS, maupun komputer navigasi rover buatan berbagai kontraktor antariksa."),
            ("Entitas Lintasan Rute Optimal (MultiLineString)", "Rangkaian koordinat garis lintasan rute A* lengkap dengan atribut jarak sub-segmen, profil elevasi, dan timestamp proyeksi waktu tempuh.", "Dimasukkan ke sistem autopilot navigasi otonom rover pengangkut kargo Mule agar dapat melaju mendampingi astronaut secara mandiri tanpa perlu dikemudikan manual."),
            ("Koleksi Titik Waypoint Ilmiah (FeatureCollection of Points)", "Daftar koordinat presisi stasiun geologi, titik awal Habitat Alpha, lokasi Boxwork 2025, dan lokasi singkapan mineral lempung.", "Menjadi panduan titik perhentian wajib bagi kru untuk melakukan pengeboran sampel, pemasangan sensor seismik, dan pemotretan makro batuan."),
            ("Poligon Masker Bahaya Geofisika (Polygon FeatureCollection)", "Batas koordinat zona tebing curam (>15° dan >25°) serta poligon cekungan pasir hisap Morgan et al. (2020).", "Berfungsi sebagai pagar virtual keselamatan (virtual geofence) di dalam sistem kemudi rover yang secara otomatis mematikan motor penggerak jika rover mendekati zona berbahaya tersebut."),
            ("Manifest Logistik & Telemetri Dukungan Hidup", "Dokumen data terstruktur yang mencantumkan total estimasi kebutuhan oksigen, air pendingin sublimator, dan baterai cadangan per kilometer.", "Menjadi dokumen audit keselamatan resmi yang wajib diverifikasi dan ditandatangani oleh Komandan Misi sebelum izin pembukaan pintu airlock habitat diterbitkan."),
            ("Karakteristik 100% Offline-First Resiliency", "Seluruh struktur data GeoJSON yang diekspor tersimpan di penyimpanan lokal perangkat tanpa memerlukan koneksi jaringan internet atau satelit pengulang orbit.", "Menghilangkan risiko kegagalan sistem navigasi di tengah permukaan Mars akibat putusnya koneksi jaringan komunikasi satelit antariksa.")
        ],
        "formulas": [
            {
                "title": "Algoritma Ray Casting Geofencing Poligon Keselamatan Spasial",
                "citation": "Shimrat (1962) Algorithm 112: Position of Point Relative to Polygon / RFC 7946",
                "eq_text": (
                    "Uji Titik Berada di Dalam Poligon Bahaya P = { (x₁, y₁), ..., (x_k, y_k) }:\n"
                    "inside = FALSE\n"
                    "Untuk setiap sisi segmen i dari 1 s/d k (dengan j = k saat i = 0):\n"
                    "Jika ( (y_i > y_rover) ≠ (y_j > y_rover) ) DAN\n"
                    "     ( x_rover < (x_j - x_i) · (y_rover - y_i) / (y_j - y_i) + x_i ):\n"
                    "     inside = NOT inside\n"
                    "Aksi Intervensi:  Jika inside == TRUE  ⟶  TRIGGER MOTOR EMERGENCY E-STOP"
                ),
                "variables": [
                    ("(x_rover, y_rover)", "Koordinat bujur dan lintang aktual rover Mule di permukaan", "Derajat bujur/lintang"),
                    ("(x_i, y_i)", "Titik verteks pembentuk poligon zona bahaya tebing >25° atau pasir amblas", "Koordinat bujur/lintang"),
                    ("inside", "Status boolean apakah rover berada di dalam zona terlarang", "TRUE / FALSE")
                ],
                "physical_interpretation": "Algoritma Ray Casting menghitung jumlah perpotongan garis sinar horizontal imajiner dari titik rover ke batas poligon geofence. Jika jumlah perpotongan ganjil, rover terbukti berada di dalam poligon bahaya. Komputer kemudi autopilot rover Mule seketika mengaktifkan rem darurat (E-Stop) untuk mencegah rover terperosok ke jurang tebing."
            }
        ],
        "sop_steps": [
            "Pastikan seluruh perencanaan rute, inspeksi titik, dan verifikasi lapisan keselamatan telah selesai dilakukan.",
            "Klik tombol hijau [EKSPOR EVA] di sudut kanan atas bilah navigasi.",
            "Simpan berkas GeoJSON hasil unduhan ke dalam media penyimpanan lokal komputer habitat.",
            "Unggah berkas GeoJSON ke komputer autopilot rover Mule dan unit HUD baju antariksa sebelum memulai ekspedisi."
        ],
        "safety_note": "VERIFIKASI INTEGRITAS BERKAS: Sebelum melangkah keluar dari habitat, lakukan uji muat (load test) berkas GeoJSON pada konsol rover Mule untuk memastikan seluruh waypoint dan batas geofence terbaca 100% tanpa galat."
    }
]

print("generate_full_data loaded successfully with all 12 chapters.")
