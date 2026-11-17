import os
import sys
import subprocess
import time
import json
import urllib.request
import asyncio
import websockets
import base64
from PIL import Image, ImageDraw
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "screenshots_flow")
DOCX_PATH = os.path.join(BASE_DIR, "PANDUAN_USER_FLOW_DAN_PENGGUNAAN_MARSFORALL.docx")
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

STEPS = [
    {
        "id": "step01",
        "file": "step01_landing.png",
        "url": "http://localhost:3001/id",
        "wait": 3.0,
        "title": "Bab 1: Eksplorasi Beranda Utama & Relief Global 3D Planet Mars",
        "page": "Halaman Beranda Utama (/id)",
        "role": "Astronaut Lapangan / Komandan Misi / Peneliti Planetologi",
        "action": (
            "Arahkan kursor ke tombol aksi navigasi utama di bilah navigasi atas (Top Navbar) "
            "dan klik tombol [ BUKA PETA MARS -> ] (atau klik tombol [ JELAJAHI PETA MARS ] pada banner pahlawan)."
        ),
        "impact": "Sistem segera menginisialisasi modul WebGL GIS dan mengalihkan antarmuka langsung ke Cockpit Kendali Habitat Mars (/id/peta).",
        "desc": (
            "Halaman beranda merupakan pintu gerbang orientasi makro penjelajahan planet Mars. "
            "Di sini sistem menyajikan model 3D Bola Planet Mars interaktif (Mars Global Relief) yang memproyeksikan "
            "topografi Kawah Gale dan Kawah Jezero, sorotan ilmiah penemuan urat mineral Boxwork 2025 oleh rover Curiosity, "
            "serta parameter lingkungan antariksa Mars terkini."
        ),
        "boxes": [
            {"rect": (1030, 14, 1225, 48), "label": "KLIK: [ BUKA PETA MARS -> ]"}
        ],
        "info_items": [
            (
                "Model 3D Bola Mars Interaktif (Three.js WebGL)",
                "Proyeksi bola planet Mars 3D interaktif bertekstur elevasi MOLA yang dapat diputar 360°, menampilkan relief Kawah Gale, Kawah Jezero, Valles Marineris, dan Olympus Mons.",
                "Memberikan pemahaman orientasi geografis makro bagi astronaut sebelum turun ke skala taktis medan kawah, serta memvisualisasikan sudut pencahayaan insolasi matahari untuk operasional panel surya."
            ),
            (
                "Koordinat Pendaratan Misi (Lat: -5.4453°, Lon: 137.8414°)",
                "Titik koordinat geodetik standar planet Mars untuk lokasi pendaratan Bradbury Landing dan kaki Gunung Sharp (Aeolis Mons) di Kawah Gale.",
                "Menjadi titik datum nol mutlak (reference origin) bagi seluruh perhitungan navigasi inersial, lintasan penjelajahan rover, dan koridor pendaratan kapsul kru."
            ),
            (
                "Jarak Bumi - Mars (225.000.000 km)",
                "Jarak langsung aktual antara Bumi dan Mars berdasarkan kalkulasi orbit elips antar-planet pada saat misi berjalan.",
                "Menjadi dasar estimasi logistik perjalanan wahana transfer antariksawan dan penentuan jendela peluncuran transit Hohmann."
            ),
            (
                "Latensi Sinyal Komunikasi (~12.5 menit / 750 detik)",
                "Waktu tempuh rambat gelombang radio elektromagnetik satu arah dari Mars ke stasiun Deep Space Network (DSN) di Bumi.",
                "Menegaskan urgensi operasional otonom di permukaan Mars; astronaut dan sistem habitat tidak dapat menunggu bantuan kendali Bumi saat menghadapi keadaan darurat di medan lapangan."
            ),
            (
                "Laju Radiasi Kosmik Permukaan (0.65 mSv/sol)",
                "Fluks radiasi rata-rata harian dari Galactic Cosmic Rays (GCR) dan Solar Particle Events (SEP) di permukaan Mars.",
                "Menjadi batas parameter dosimetri keselamatan hayati; menentukan batas durasi jam aman seorang astronaut berada di luar airlock habitat (EVA) sebelum mencapai batas dosis tahunan 100 mSv."
            ),
            (
                "Sorotan Ilmiah: Penemuan Boxwork 2025",
                "Temuan terbaru struktur urat mineral retikuler kalsium sulfat oleh rover Curiosity yang membuktikan sirkulasi fluida hidrotermal purba di bawah tanah Gunung Sharp.",
                "Menetapkan target ilmiah utama misi ekspedisi untuk pengumpulan sampel inti batuan yang berpotensi menyimpan fosil jejak kehidupan mikroba purba (biosignatures)."
            ),
            (
                "Tombol Aksi [ BUKA PETA MARS -> ]",
                "Tombol interaksi navigasi berlatar solid oranye kontras tinggi pada sudut kanan atas bilah navigasi.",
                "Memuat instrumen peta interaktif resolusi tinggi dan mengaktifkan sub-sistem telemetri habitat secara real-time."
            ),
            (
                "Pemilih Bahasa Dual-Language (ID / EN)",
                "Pengalih bahasa antarmuka internasional yang mendukung Bahasa Indonesia dan Bahasa Inggris secara penuh.",
                "Memastikan protokol operasional dapat dipahami secara instan oleh seluruh anggota kru multinasional tanpa kendala bahasa."
            )
        ],
        "sop_steps": [
            "Buka peramban dan akses alamat portal resmi platform pada URL http://localhost:3001/id.",
            "Lakukan observasi visual pada bola Mars 3D untuk mengidentifikasi cekungan Kawah Gale di belahan selatan Mars.",
            "Baca metrik lingkungan antariksa (jarak, latensi sinyal, laju radiasi) untuk memahami batasan komunikasi dan radiasi saat ini.",
            "Klik tombol aksi navigasi utama [ BUKA PETA MARS -> ] pada bilah navigasi kanan atas untuk memasuki Cockpit Kendali Habitat."
        ],
        "safety_note": (
            "PERINGATAN OPERASIONAL: Latensi komunikasi 12.5 menit mewajibkan seluruh protokol keselamatan "
            "menggunakan sistem komputasi deterministik otonom di dalam habitat. Seluruh keputusan penentuan rute "
            "harus diverifikasi secara lokal melalui algoritma Terrain-Aware A* sebelum pintu airlock dibuka."
        )
    },
    {
        "id": "step02",
        "file": "step02_map_overview.png",
        "url": "http://localhost:3001/id/peta",
        "wait": 5.5,
        "title": "Bab 2: Tinjauan Cockpit Kendali Habitat & Seleksi Situs Misi",
        "page": "Cockpit Kendali Habitat Mars (/id/peta)",
        "role": "Pengendali Misi Habitat / Navigator Lapangan EVA",
        "action": (
            "Pada Bilah Navigasi Atas (Top Navbar), pastikan tombol pemilih situs [SITE-01: GALE (MSL)] aktif "
            "(berwarna oranye cerah), atau klik tombol tersebut untuk memfokuskan kamera orbital ke Aeolis Mons (Mount Sharp)."
        ),
        "impact": "Kanvas peta secara otomatis melakukan fly-to dan memuat tile orbital Kawah Gale pada koordinat Lat: -5.4453°, Lon: 137.8414°.",
        "desc": (
            "Setelah masuk ke peta, layar menyajikan Cockpit Kendali Habitat Mars berbasis GIS 2.5D. "
            "Informasi yang tersedia mencakup kanvas satelit HiRISE/CTX, grid topografi MOLA dengan rentang datum "
            "-4500m hingga -3500m, status kekerasan tanah, serta bilah telemetri kursor koordinat real-time."
        ),
        "boxes": [
            {"rect": (18, 12, 178, 44), "label": "SELEKTOR SITUS: [SITE-01: GALE (MSL)]"},
            {"rect": (15, 672, 680, 715), "label": "BILAH TELEMETRI REAL-TIME & DATUM"}
        ],
        "info_items": [
            (
                "Selektor Situs Misi [SITE-01: GALE] vs [SITE-02: JEZERO]",
                "Sakelar pengalih konteks penelitian antara Kawah Gale (MSL Curiosity) dan Kawah Jezero (M2020 Perseverance).",
                "Memfokuskan seluruh katalog data geologi, rute navigasi, dan layer satelit ke situs penjelajahan yang dituju: stratigrafi sedimen danau Gale atau delta sungai purba Jezero."
            ),
            (
                "Kanvas Citra Satelit Orbital (HiRISE 25cm/px & CTX 6m/px)",
                "Citra ortofoto resolusi super tinggi hasil tangkapan instrumen High Resolution Imaging Science Experiment dan Context Camera pada wahana MRO.",
                "Menampilkan tekstur medan permukaan secara fotorealistik, memungkinkan kru mengidentifikasi gundukan pasir, bongkahan batu besar, dan batas tebing berbahaya secara visual."
            ),
            (
                "Bilah Datum Topografi MOLA (-4500 m s/d -3500 m)",
                "Gradasi bar elevasi digital Mars Orbiter Laser Altimeter yang mengukur kedalaman medan terhadap rata-rata gravitasi datum Mars.",
                "Dasar Kawah Gale berada pada kedalaman ekstrem (-4.5 km), di mana kolom atmosfer lebih tebal (~750 Pa vs puncak 100 Pa) sehingga memberikan ketahanan aerodinamis parasut lebih baik dan sedikit pelindung radiasi alami."
            ),
            (
                "Bilah Koordinat Kursor Real-Time (Lat & Lon)",
                "Tampilan koordinat lintang dan bujur posisi penunjuk kursor di atas permukaan peta dengan presisi empat angka desimal.",
                "Memungkinkan operator menentukan titik pendaratan darurat, koordinat penempatan instrumen bor, atau titik evakuasi kru dengan presisi sub-meter."
            ),
            (
                "Status Cepat Kekerasan Tanah [BEDROCK FIRM] / [SAND TRAP]",
                "Indikator cepat daya dukung mekanis regolith tepat di bawah kursor mouse berdasarkan integrasi termal TES.",
                "Memberikan peringatan dini instan bagi pengemudi rover manual agar tidak mengarahkan rute menuju wilayah pasir lepas yang berisiko menenggelamkan roda sasis."
            ),
            (
                "Toolbar Navigasi Cepat Sisi Kiri",
                "Panel bilah alat vertikal yang menampung tombol pintas ke modul Layer Ilmiah, Alat Spasial, Prospektor ML, Analogi Bumi, dan Drone.",
                "Memberikan akses satu-klik ke seluruh fungsi analisis geofisika tanpa menutupi visualisasi peta utama."
            )
        ],
        "sop_steps": [
            "Periksa bilah navigasi atas dan pastikan indikator tombol situs terkunci pada [SITE-01: GALE (MSL)].",
            "Gunakan roda mouse untuk melakukan pembesaran (zoom) dan geser (pan) pada area kaki barat laut Gunung Sharp.",
            "Amati pembacaan datum elevasi pada bilah bawah layar saat kursor digerakkan melintasi dasar kawah menuju punggungan bukit.",
            "Verifikasi status kekerasan tanah pada bilah telemetri kursor untuk memastikan kursor berada di atas lapisan batuan kokoh [BEDROCK FIRM]."
        ],
        "safety_note": (
            "PROTOKOL SITUS: Perpindahan situs ke Jezero akan mengubah seluruh acuan elevasi datum dan katalog "
            "mineralogi. Jangan beralih situs ketika rute perjalanan aktif sedang dieksekusi oleh astronaut di lapangan."
        )
    },
    {
        "id": "step03",
        "file": "step03_layers.png",
        "url": "http://localhost:3001/id/peta?tool=layers",
        "wait": 4.0,
        "title": "Bab 3: Mengaktifkan 5 Lapisan Operasional Ilmiah NASA (Scientific Layers)",
        "page": "Panel Lapisan Ilmiah NASA (/id/peta?tool=layers)",
        "role": "Petugas Analisis Data Geofisika / Spesialis Keselamatan Misi",
        "action": (
            "Klik ikon tumpukan layer pada bilah alat vertikal di sisi paling kiri, kemudian aktifkan sakelar "
            "Layer 2 (DEM Slope Hazard) dan Layer 3 (Detektor Jebakan Pasir) ke posisi AKTIF, serta atur slider opasitas sesuai kebutuhan."
        ),
        "impact": "Kanvas peta menampilkan masker warna zona bahaya kelerengan dan wilayah pasir hisap untuk memastikan rute yang direncanakan 100% aman.",
        "desc": (
            "Panel laci kiri ini menyajikan 5 Lapisan Operasional Ilmiah NASA berstandar Mars Trek & MMGIS:\n"
            "• Layer 1: Citra Optik HiRISE 25cm & Poligon Geologi USGS (Noachian, Hesperian, Amazonian, urat Boxwork).\n"
            "• Layer 2: Topografi DEM 1m & Masker Bahaya Kelerengan (<15° Aman, 15°-25° Waspada, >25° Bahaya Impassable).\n"
            "• Layer 3: Detektor Jebakan Pasir Termal THEMIS/TES (Morgan et al. 2020: Bedrock Padat vs Pasir Amblas).\n"
            "• Layer 4: Mineralogi Terhidrasi CRISM & Hidrogen Ekuivalen Air (WEH % Smektit, Sulfat, Hematit).\n"
            "• Layer 5: Lingkungan Radiasi MSL RAD & Perisai Magnetik Kerak MGS MAG (nT)."
        ),
        "boxes": [
            {"rect": (0, 68, 42, 108), "label": "IKON TOOLBAR: [LAPISAN DATA]"},
            {"rect": (44, 40, 394, 680), "label": "LACI 5 LAPISAN ILMIAH NASA & SLIDER"}
        ],
        "info_items": [
            (
                "Layer 1: Citra Optik & Unit Geologi USGS",
                "Poligon klasifikasi stratigrafi Noachian (>3.7 Ga), Hesperian (3.7-3.0 Ga), dan Amazonian (<3.0 Ga), termasuk formasi urat mineral retikuler Boxwork 2025.",
                "Memberikan kronologi usia batuan bagi astronaut untuk mengambil sampel inti dari era geologi saat Mars masih memiliki air permukaan cair berlimpah."
            ),
            (
                "Layer 2: Topografi DEM 1m & Masker Kelerengan (<15°, 15-25°, >25°)",
                "Model elevasi digital 1 meter dengan pewarnaan zona keselamatan lereng: Hijau (<15° [SAFE]), Kuning (15°-25° [CAUTION]), dan Merah (>25° [HAZARD IMPASSABLE]).",
                "Mencegah kecelakaan fatal rover terbalik (rollover hazard) dan kelelahan otot parah pada astronaut pejalan kaki; menyaring lereng curam secara otomatis dari jalur pergerakan."
            ),
            (
                "Layer 3: Detektor Jebakan Pasir Termal (Morgan et al. 2020)",
                "Peta inersia termal THEMIS Night IR & TES yang mengklasifikasikan batuan padat (>=350 tiu [BEDROCK FIRM]) vs cekungan pasir lepas (<200 tiu [SOFT SAND TRAP RISK]).",
                "Mencegah roda rover kargo berbobot 450 kg tenggelam di pasir amblas seperti yang dialami rover NASA Spirit pada tahun 2009; menjamin permukaan lintasan memiliki daya dukung tanah kokoh."
            ),
            (
                "Layer 4: Mineralogi Terhidrasi CRISM & Air Ekuivalen (WEH %)",
                "Sebaran spektrometri mineral terhidrasi Compact Reconnaissance Imaging Spectrometer (Smektit, Sulfat Polihidrat, Hematit) dan persentase kandungan air setara hidrogen.",
                "Peta panduan utama In-Situ Resource Utilization (ISRU); memandu astronaut ke lokasi penambangan mineral sulfat kaya air yang dapat disuling menjadi air minum dan propelan roket."
            ),
            (
                "Layer 5: Lingkungan Radiasi MSL RAD & Perisai Magnetik MGS MAG",
                "Peta intensitas medan magnet sisa purba kerak Mars (nanotesla / nT) yang dipadukan dengan data dosimeter radiasi permukaan MSL RAD (mSv/sol).",
                "Mengidentifikasi koridor anomali magnet kerak lokal (>40 nT) yang bertindak sebagai deflektor alami partikel angin matahari berbahaya, memberikan rute teraman bagi kesehatan DNA astronaut."
            ),
            (
                "Slider Opasitas Interaktif (0% - 100%)",
                "Penggeser transparansi individual untuk masing-masing dari 5 lapisan ilmiah.",
                "Memungkinkan operator melakukan analisis tumpang-tindih (cross-overlay) antara data geofisika analitis dengan tekstur visual medan satelit resolusi tinggi."
            )
        ],
        "sop_steps": [
            "Klik ikon toolbar [LAPISAN DATA] di bilah kiri atas untuk memunculkan laci panel 5 layer ilmiah.",
            "Aktifkan sakelar Layer 2 (DEM Topografi & Kelerengan) untuk memunculkan lapisan masker kelerengan.",
            "Aktifkan sakelar Layer 3 (Detektor Jebakan Pasir Termal) untuk memeriksa sebaran pasir amblas di sekitar kaki bukit.",
            "Sesuaikan slider opasitas kedua layer ke tingkat 65% agar kontur citra satelit di bawahnya tetap terlihat jelas."
        ],
        "safety_note": (
            "KRITERIA KESELAMATAN WAJIB: Jangan pernah menonaktifkan Layer 2 dan Layer 3 saat memverifikasi "
            "rute pergerakan rover kargo Mule. Rute yang melintasi zona merah (>25°) atau zona pasir hisap "
            "dilarang keras untuk dieksekusi dalam kondisi cuaca apa pun."
        )
    },
    {
        "id": "step04",
        "file": "step04_inspector.png",
        "url": "http://localhost:3001/id/peta?inspect=boxwork",
        "wait": 4.0,
        "title": "Bab 4: Inspeksi Titik Lapangan & Forensik Geologi (Point Inspector)",
        "page": "Instrumen Point Inspector Cockpit (/id/peta)",
        "role": "Spesialis Geologi Lapangan / Astronaut Operator EVA",
        "action": (
            "Klik sembarang titik batuan pada peta (misal stasiun Sol 4180 Boxwork) atau tombol [INSPEKSI] pada navbar. "
            "Setelah panel data forensik terbuka, klik tombol hijau utama: [ RENCANAKAN RUTE MARSWALK A* KE SINI ]."
        ),
        "impact": "Koordinat dan parameter fisik titik target terkunci ke dalam sistem navigasi taktis dan siap dihitung lintasannya oleh algoritma A*.",
        "desc": (
            "Instrumen Point Inspector dirancang dengan latar belakang solid flat matte berkontras tinggi untuk "
            "menguji kelayakan fisik batuan di titik mana pun pada kawah Mars. "
            "Data telemetri yang disajikan mencakup nama formasi geologi, elevasi MOLA, kemiringan lereng dengan tag keselamatan, "
            "status kekerasan tanah, perisai medan magnetik kerak, koordinat presisi, serta komposisi mineralogi terhidrasi."
        ),
        "boxes": [
            {"rect": (44, 40, 394, 680), "label": "PANEL LACI INSPEKSI TITIK & GEOLOGI"},
            {"rect": (55, 520, 380, 554), "label": "KLIK: [ RENCANAKAN RUTE MARSWALK A* KE SINI ]"}
        ],
        "info_items": [
            (
                "LOCATION & GEOLOGY (Unit Geologi)",
                "Nama unit stratigrafi batuan dan perkiraan era terbentuknya (misal: Mt Sharp Flank Layered Sulfate Unit, Hesperian ~3.3 Ga).",
                "Mengonfirmasi identitas ilmiah target pengamatan untuk pencatatan sampel geologi resmi dan memastikan batuan berasal dari horizon stratigrafi yang relevan."
            ),
            (
                "MOLA ELEVATION (Elevasi MOLA)",
                "Nilai ketinggian vertikal titik tersebut terhadap datum referensi nol Mars (misal: -3473 m).",
                "Menentukan perbedaan ketinggian pendakian yang harus diatasi kru; perbedaan elevasi vertikal secara langsung melipatgandakan konsumsi daya motor rover dan laju pernapasan O2 astronaut."
            ),
            (
                "SLOPE / LERENG (Kemiringan Medan)",
                "Derajat kemiringan sudut permukaan lokal beserta bracket status keselamatan (misal: 6.5° [SAFE <15°]).",
                "Memverifikasi bahwa titik pemberhentian cukup datar untuk memarkir rover tanpa risiko tergelincir dan aman bagi astronaut untuk meletakkan wadah sampel."
            ),
            (
                "GROUND FIRMNESS (Kekerasan Tanah)",
                "Status mekanis daya dukung tanah regolith (misal: [BEDROCK FIRM] atau [SOFT SAND TRAP RISK]).",
                "Memastikan titik tersebut memiliki landasan batuan keras padat yang mampu menopang bobot pendaratan kaki astronaut atau pilar penyangga modul eksperimen tanpa amblas."
            ),
            (
                "MAG SHIELDING (Perisai Magnetik Kerak)",
                "Nilai kekuatan intensitas anomali medan magnet sisa purba lokal dalam satuan nanotesla (misal: 38 nT).",
                "Mengindikasikan tingkat perlindungan magnetik alami terhadap radiasi partikel bermuatan kosmik saat astronaut bekerja diam di titik tersebut."
            ),
            (
                "COORDINATES (Koordinat Geodetik)",
                "Koordinat garis lintang dan bujur dengan presisi empat digit desimal (misal: Lat -4.7371°, Lon 137.4966°).",
                "Koordinat presisi tinggi yang dimasukkan ke sistem inersial helm astronaut dan unit autopilot rover untuk memandu pergerakan menuju sasaran."
            ),
            (
                "HYDRATED MINERALOGY (Mineral Terhidrasi)",
                "Daftar komposisi mineral terdeteksi oleh spektrometer CRISM (misal: Hematite, Sulfates & Amorphous Silica).",
                "Menilai nilai ekonomis ekstraksi air setempat (ISRU) dan potensi keawetan fosil molekuler organik di dalam matriks kristal mineral tersebut."
            ),
            (
                "Tombol Aksi Lapangan Terintegrasi",
                "Kumpulan tombol aksi operasional: [ RENCANAKAN RUTE MARSWALK A* KE SINI ], [ BUKA POV 360° ], [ ANALISIS PROSPEKTOR ], [ ANALOGI BUMI ], dan [ DOCK TRANSEK 5M ].",
                "Menghubungkan titik inspeksi secara langsung dengan seluruh subsistem komputasi platform hanya dengan satu klik."
            )
        ],
        "sop_steps": [
            "Arahkan kursor ke titik formasi batuan target di kaki Gunung Sharp pada kanvas peta.",
            "Klik kiri sekali pada permukaan batuan untuk membuka jendela panel Point Inspector.",
            "Evaluasi seluruh parameter telemetri: pastikan SLOPE berstatus [SAFE <15°] dan GROUND FIRMNESS berstatus [BEDROCK FIRM].",
            "Klik tombol hijau [ RENCANAKAN RUTE MARSWALK A* KE SINI ] untuk menetapkan titik ini sebagai destinasi akhir rute navigasi."
        ],
        "safety_note": (
            "BATASAN LERENG MAKSIMUM: Jangan pernah mengklik titik dengan kemiringan >15° sebagai titik henti perkemahan "
            "atau area pemindahan kargo rover. Titik dengan kemiringan di atas batas aman rentan terhadap guguran batu lepas."
        )
    },
    {
        "id": "step05",
        "file": "step05_prospector.png",
        "url": "http://localhost:3001/id/peta?tool=prospector",
        "wait": 4.0,
        "title": "Bab 5: Penilaian Potensi Sumber Daya In-Situ (Prospector ML Data Fusion)",
        "page": "Panel Prospektor Sumber Daya Mars (/id/peta?tool=prospector)",
        "role": "Insinyur Sistem Pendukung Kehidupan ISRU / Perencana Koloni",
        "action": (
            "Klik ikon segitiga peringatan/prospektor di toolbar kiri atau tombol [ANALISIS PROSPEKTOR] di kartu inspeksi, "
            "kemudian geser slider pembobotan prioritas (misal menaikkan bobot ekstraksi air atau stabilitas batuan dasar)."
        ),
        "impact": "Algoritma machine learning menghitung ulang Resource Promise Score dan Uncertainty Index secara deterministik.",
        "desc": (
            "Mesin kecerdasan buatan Prospector ML menggabungkan 35 parameter geofisika Mars untuk mengevaluasi "
            "potensi pemanfaatan sumber daya setempat (In-Situ Resource Utilization / ISRU). "
            "Menghitung Resource Promise Score (0 - 100%) dan Model Uncertainty Index (±%), dengan rincian potensi "
            "ekstraksi air dari mineral terhidrasi, stabilitas batuan pondasi, dan proteksi radiasi magnetik alami."
        ),
        "boxes": [
            {"rect": (0, 185, 42, 225), "label": "IKON TOOLBAR: [PROSPEKTOR ML]"},
            {"rect": (44, 40, 394, 680), "label": "PANEL FUSI 35 PARAMETER & SKOR RESOURCE"}
        ],
        "info_items": [
            (
                "Resource Promise Score (0 - 100%)",
                "Skor komposit probabilitas keberhasilan pemanfaatan sumber daya dan pendirian tapak habitat jangka panjang.",
                "Menjadi indeks kuantitatif utama bagi Dewan Misi dalam memutuskan apakah lokasi tersebut layak dijadikan lokasi pabrik penyulingan bahan bakar roket atau tapak kubah habitat sekunder."
            ),
            (
                "Model Uncertainty Index (± %)",
                "Margin ketidakpastian matematis model statistik berdasarkan kerapatan dan konsistensi data satelit (misal: ± 4.2%).",
                "Menentukan tingkat keyakinan data; jika nilai uncertainty >12%, kru diwajibkan mengirim wahana robotik tanpa awak terlebih dahulu untuk verifikasi tanah sebelum investasi peralatan berat dimulai."
            ),
            (
                "Subsurface Water Ice Mapping (SWIM Index)",
                "Indeks 5-term keberadaan hidrogen dan kantong es bawah tanah dari sensor radar SHARAD dan neutron GRS/DAN.",
                "Mengarahkan titik pengeboran geofisika langsung ke cadangan es air bawah tanah untuk memasok kebutuhan air minum kru dan elektrolisis oksigen pangkalan."
            ),
            (
                "ChemCam Elemental Oxide Composition",
                "Komposisi persentase berat oksida utama hasil tembikan laser spektrometer ChemCam (SiO2, FeOT, Al2O3, MgO, CaO, SO3).",
                "Menyediakan data geokimia untuk proses peleburan regolith menjadi bahan bangunan cetak 3D (batu bata geopolimer Mars) dan formulasi mineral untuk nutrisi rumah kaca hidroponik."
            ),
            (
                "Slider Pembobotan Kriteria Prioritas (MCDA Sliders)",
                "Empat penggeser bobot interaktif: Ekstraksi Air (WEH %), Batuan Dasar (Firmness), Perisai Radiasi (Magnetic), dan Akses Kelerengan (Low Slope).",
                "Memberikan fleksibilitas bagi insinyur misi untuk menyesuaikan evaluasi berdasarkan prioritas mendesak saat itu (misal: mode darurat air vs mode stabilitas pendaratan modul berat)."
            )
        ],
        "sop_steps": [
            "Buka panel Prospektor ML melalui toolbar kiri atau klik tombol [ANALISIS PROSPEKTOR] pada panel inspeksi titik.",
            "Tinjau persentase komposisi unsur oksida ChemCam untuk memastikan keberadaan mineral silika dan sulfat.",
            "Atur slider pembobotan sesuai kebutuhan misi saat ini (misal: tingkatkan bobot Ekstraksi Air ke 40% dan Batuan Dasar ke 30%).",
            "Amati nilai akhir Resource Promise Score: pastikan nilai melebihi ambang batas kelayakan minimum 70% sebelum menyetujui pendirian stasiun."
        ],
        "safety_note": (
            "BATAS KELAYAKAN MINIMUM: Lokasi dengan skor Resource Promise di bawah 50% atau nilai Uncertainty di atas 15% "
            "dilarang ditetapkan sebagai tapak instalasi pendukung kehidupan permanen karena risiko kekurangan air dan tanah labil."
        )
    },
    {
        "id": "step06",
        "file": "step06_analogue.png",
        "url": "http://localhost:3001/id/peta?tool=analogue",
        "wait": 4.0,
        "title": "Bab 6: Validasi Uji Terestrial di Bumi (Earth Analogue Matcher)",
        "page": "Panel Pencocok Analogi Bumi (/id/peta?tool=analogue)",
        "role": "Spesialis Geokimia / Perencana Pelatihan Misi Terestrial",
        "action": (
            "Klik ikon kompas analogi di toolbar kiri atau tombol [ANALOGI BUMI] di kartu inspeksi, "
            "lalu evaluasi kartu analogi yang memiliki skor kecocokan tertinggi untuk mempelajari prosedur operasionalnya."
        ),
        "impact": "Astronaut memperoleh panduan protokol pengujian alat dan prosedur keselamatan yang telah terverifikasi di Bumi.",
        "desc": (
            "Algoritma Multi-Criteria Decision Analysis (MCDA) mencocokkan kondisi geologi Mars dengan 4 laboratorium "
            "lingkungan ekstrem di Bumi yang menjadi tempat uji coba baju astronaut dan rover NASA:\n"
            "• Kawah Haughton (Pulau Devon, Arktik): Uji coba batuan impak dan permafrost.\n"
            "• Death Valley (Mojave): Uji coba kipas aluvial kering dan sedimen garam.\n"
            "• Río Tinto (Spanyol): Uji coba air asam hidrotermal purba kaya zat besi dan sulfat.\n"
            "• Gurun Atacama (Cile): Uji coba tanah hiper-arid dan batas kehidupan mikroorganisme."
        ),
        "boxes": [
            {"rect": (0, 226, 42, 266), "label": "IKON TOOLBAR: [ANALOGI BUMI]"},
            {"rect": (44, 40, 394, 680), "label": "SKOR KECOCOKAN 4 LAB EKSTREM BUMI"}
        ],
        "info_items": [
            (
                "Skor Kecocokan Analogi (Analogue Match %)",
                "Indeks persentase tingkat kemiripan geokimia, mineralogi, dan iklim antara formasi batuan Mars dengan lokasi uji coba di Bumi.",
                "Memberikan kepastian ilmiah bahwa kondisi fisik yang dihadapi astronaut di Mars memiliki rujukan lapangan konkret yang telah diuji selama puluhan tahun di Bumi."
            ),
            (
                "Kawah Haughton (Pulau Devon, Nunavut, Arktik Kanada)",
                "Struktur kawah impak meteorit di lingkungan kutub beku abadi, kaya akan breksi tumbukan dan pola drainase permafrost.",
                "Menjadi rujukan prosedur penjelajahan di medan batuan retak dan protokol penanganan peralatan bor saat menembus lapisan regolith beku abadi."
            ),
            (
                "Death Valley (Gurun Mojave, California, AS)",
                "Cekungan kipas aluvial kering ekstrem dengan sedimentasi garam boraks masif dan fluktuasi panas terik tinggi.",
                "Memberikan SOP pergerakan melintasi kerak sedimen garam rapuh dan manajemen beban termal pada sistem pendingin baju antariksa."
            ),
            (
                "Río Tinto (Andalusia, Spanyol)",
                "Daerah aliran air asam ekstrem alami yang kaya akan zat besi teroksidasi, jarosit, dan mineral sulfat.",
                "Rujukan operasional paling krusial untuk formasi sulfat Gunung Sharp; menyediakan pedoman penanganan debu sulfat asam yang dapat menimbulkan korosi pada segel sendi jas EVA."
            ),
            (
                "Gurun Atacama (Antofagasta, Cile)",
                "Wilayah paling kering di Bumi dengan kadar air mendekati 0% dan tanah kaya garam perchlorat beracun.",
                "Menjadi acuan protokol sterilisasi debu beracun perchlorat sebelum astronaut memasuki habitat dan uji kepekaan instrumen deteksi mikroba hidup."
            )
        ],
        "sop_steps": [
            "Buka panel Analogi Bumi dengan mengklik ikon toolbar kiri atau tombol [ANALOGI BUMI] pada kartu inspeksi.",
            "Tinjau persentase kecocokan 4 laboratorium ekstrem terestrial yang dihasilkan oleh algoritma MCDA.",
            "Pilih kartu laboratorium dengan skor tertinggi (misal Río Tinto 87% untuk formasi batuan sulfat).",
            "Buka dokumen panduan operasional teruji untuk menerapkan SOP pengeboran dan penanganan debu yang telah distandarisasi."
        ],
        "safety_note": (
            "MITIGASI DEBU KOROSIF: Batuan sulfat hasil analogi Río Tinto membuktikan bahwa debu Mars dapat "
            "mengikis lapisan teflon sambungan baju antariksa. Lakukan prosedur dekontaminasi kuas vakum sebelum airlock dimasuki."
        )
    },
    {
        "id": "step07",
        "file": "step07_spatial_tools.png",
        "url": "http://localhost:3001/id/peta?tool=tools",
        "wait": 4.0,
        "title": "Bab 7: Pengukuran Spasial, Viewshed 360°, & Profil Transek 5M (NASA MMGIS)",
        "page": "Panel Alat Spasial & Peta (/id/peta?tool=tools)",
        "role": "Petugas Kartografi Spasial / Komunikator Radio Habitat",
        "action": (
            "Klik ikon penggaris/pensil di bilah kiri, pilih opsi [UKUR / PROFIL], dan klik tombol [DOCK TRANSEK 5M] "
            "di bagian bawah panel untuk membuka jendela visualisasi grafik irisan melintang elevasi medan."
        ),
        "impact": "Grafik kontur elevasi melintang per 5 meter terbuka di bagian bawah layar memperlihatkan profil lereng secara akurat.",
        "desc": (
            "Menghadirkan instrumen kartografi analitis NASA MMGIS:\n"
            "1. Ukur / Profil Elevasi Melintang: Menggambar garis transek untuk menginspeksi ketinggian tiap 5 meter.\n"
            "2. Viewshed 360° Line-of-Sight: Menghitung poligon jarak pandang visual dari ketinggian mata astronaut (1.7m).\n"
            "3. Penandaan ZOI (Zone of Interest): Menaruh pin target riset geologi permanen.\n"
            "4. Sol Time-Travel Scrubber: Memilih checkpoint penjelajahan rover Curiosity dari Sol 0 hingga Sol 4180."
        ),
        "boxes": [
            {"rect": (0, 109, 42, 149), "label": "IKON TOOLBAR: [ALAT SPASIAL]"},
            {"rect": (44, 40, 394, 680), "label": "MENU TRANSEK, VIEWSHED, & ZOI"}
        ],
        "info_items": [
            (
                "Alat Ukur Jarak & Profil Transek Elevasi",
                "Fitur menggambar garis transek sembarang pada kanvas peta untuk menghitung jarak linier dan elevasi melintang setiap interval 5 meter.",
                "Mendeteksi perubahan kemiringan mikro atau celah ngarai sempit yang tidak tertangkap oleh citra satelit makro, mencegah rover terjebak di tebing tersembunyi."
            ),
            (
                "Kalkulasi Viewshed 360° Line-of-Sight",
                "Perhitungan poligon keterlihatan pandang visual dan gelombang radio UHF langsung dari ketinggian mata astronaut (1.7 meter AGL) dengan memperhitungkan halangan bukit.",
                "Menjamin keselamatan komunikasi radio tim penjelajah; memastikan astronaut selalu berada di dalam zona kontak radio langsung dengan antena pemancar habitat tanpa titik buta sinyal (radio blindspot)."
            ),
            (
                "Penandaan Titik Target ZOI (+ TANDAI ZOI)",
                "Fitur penancapan pin Zone of Interest permanen pada koordinat kawah dengan label nama kustom dan kategori geologi.",
                "Menyimpan lokasi singkapan batuan langka atau anomali magnetik tinggi sebagai target pengumpulan sampel untuk kru ekspedisi berikutnya."
            ),
            (
                "Sol Time-Travel Scrubber (Sol 0 s/d Sol 4180)",
                "Bilah penelusuran riwayat perjalanan rover Curiosity dari hari pendaratan Sol 0 hingga penemuan Boxwork Sol 4180.",
                "Memungkinkan kru mempelajari perubahan morfologi debu dan memvalidasi rute-rute yang telah berhasil dilalui oleh rover NASA selama 12 tahun."
            ),
            (
                "Jendela Dock Profil Transek 5M",
                "Grafik penampang melintang elevasi bawah layar yang memetakan kontur ketinggian vertikal terhadap jarak horizontal.",
                "Memberikan gambaran visual langsung mengenai kecuraman lereng kepada pengemudi rover sebelum melintasi suatu bukit atau jurang."
            )
        ],
        "sop_steps": [
            "Klik ikon toolbar [ALAT SPASIAL] di bilah navigasi kiri.",
            "Klik tombol [UKUR / PROFIL] lalu klik dua titik di atas peta untuk menarik garis transek penampang.",
            "Klik tombol [DOCK TRANSEK 5M] di bagian bawah panel untuk menampilkan grafik irisan profil elevasi melintang.",
            "Klik tombol [VIEWSHED 360°] dan letakkan pin pada lokasi stasiun antena habitat untuk memverifikasi jangkauan sinyal radio."
        ],
        "safety_note": (
            "ZONA BUTA RADIO (RADIO SHADOW): Jika hasil kalkulasi Viewshed menunjukkan rute berada di luar "
            "area hijau keterlihatan, astronaut wajib memasang modul relay radio repeater portabel di puncak punggungan bukit."
        )
    },
    {
        "id": "step08",
        "file": "step08_marswalk_route.png",
        "url": "http://localhost:3001/id/peta?route=sample",
        "wait": 4.5,
        "title": "Bab 8: Navigasi Taktis Rute Aman Marswalk A* (3D Route HUD)",
        "page": "Cockpit Peta Operasional dengan Navigasi Rute Aktif (/id/peta)",
        "role": "Navigator Utama EVA / Pengemudi Rover Kargo Mule",
        "action": (
            "Amati rute lintasan hijau yang terbentang di peta. Klik tombol [ STEPS ▼ ] pada bilah navigasi atas "
            "untuk membuka panduan manuver belokan navigasi langkah-demi-langkah (turn-by-turn maneuvers)."
        ),
        "impact": "Astronaut dan pengemudi rover memperoleh instruksi arah presisi yang menjamin kelangsungan hidup sebelum oksigen menyentuh batas kritis.",
        "desc": (
            "Algoritma Terrain-Aware Marswalk A* menghitung rute teraman dari Habitat Alpha menuju target batuan "
            "dengan menerapkan penalti kelerengan kuadratik (menghindari lereng >15° dan jebakan pasir lepas). "
            "Bilah HUD Navigasi Atas menyajikan: Total Jarak (DIST: km), Estimasi Waktu (EST: h), Sisa Oksigen (O2: %), "
            "Daya Baterai (BATT: %), Kekuatan Perisai Magnetik (SHIELD: nT), dan Indikator Status Keselamatan."
        ),
        "boxes": [
            {"rect": (50, 46, 750, 114), "label": "BILAH HUD NAVIGASI 3D MARSWALK & TELEMETRI"},
            {"rect": (420, 240, 780, 580), "label": "LINTASAN RUTE A* BEBAS TEBING & AMBLAS"}
        ],
        "info_items": [
            (
                "Nama Rute & Mode Mobilitas Kru",
                "Label judul navigasi: MarsForAll -> Mount Sharp Boxwork Formations (Curiosity 2025 Site) [PAIRED + MULE].",
                "Mengonfirmasi konfigurasi perjalanan lapangan: dua orang astronaut berjalan kaki didampingi satu unit rover pengangkut kargo Mule berbobot 450 kg untuk membawa sampel dan cadangan hidup."
            ),
            (
                "DIST (Total Jarak Tempuh Lintasan: 55.86 KM)",
                "Panjang total rute perjalanan non-linier yang telah disesuaikan dengan kontur topografi kawah.",
                "Menjadi dasar perhitungan konsumsi daya motor listrik rover dan keausan fisik tapak roda logam di atas batuan tajam Mars."
            ),
            (
                "EST (Estimasi Durasi Perjalanan: 12.29 H EVA)",
                "Waktu tempuh yang diproyeksikan dengan memperhitungkan kecepatan jalan kaki 2.5 km/jam dan waktu perhentian inspeksi geologi.",
                "Memastikan jadwal misi tidak melampaui batas maksimal shift kerja luar ruangan astronaut (maksimal 14 jam) demi mencegah penurunan konsentrasi akibat kelelahan fisik."
            ),
            (
                "O2 (Proyeksi Sisa Cadangan Oksigen: 82%)",
                "Persentase sisa oksigen yang tersedia di dalam tabung PLSS setelah seluruh perjalanan pulang-pergi diselesaikan.",
                "Ambang batas keselamatan hidup paling kritis; sistem secara otomatis menolak rute jika sisa oksigen kepulangan diproyeksikan di bawah 25% (reserve margin)."
            ),
            (
                "BATT (Status Daya Baterai Rover & Baju: 0% / RTG)",
                "Tingkat keterisian daya baterai sekunder atau ketersediaan generator termoelektrik radioisotop (RTG).",
                "Memantau ketersediaan energi untuk sistem pemanas jas antariksa dan motor penggerak roda kargo selama melintasi suhu malam kawah (-70°C)."
            ),
            (
                "SHIELD (Rata-rata Kekuatan Perisai Magnet Kerak: 59 nT)",
                "Nilai rata-rata proteksi anomali magnetik kerak Mars yang dilalui di sepanjang koridor rute.",
                "Memverifikasi bahwa lintasan sengaja diarahkan melintasi kantong magnetik alami Gunung Sharp guna mereduksi dosis serapan radiasi kosmik kru secara kumulatif."
            ),
            (
                "Status Integritas Rute [100% VERIFIED SAFE // ZERO CLIFFS]",
                "Label verifikasi otomatis bahwa rute 100% bebas dari tebing kelerengan >15° dan bebas dari zona pasir lepas.",
                "Memberikan kepastian mutlak bagi komandan misi untuk menandatangani otorisasi keberangkatan kru ke luar habitat."
            ),
            (
                "Panduan Manuver Belokan Turn-by-Turn [ STEPS ▼ ]",
                "Daftar instruksi navigasi langkah-demi-langkah (misal: 'Maju 450m arah Azimuth 142°, belok kiri menghindari gundukan pasir').",
                "Memandu tim navigasi di setiap persimpangan medan agar tetap berada pada koridor aman tanpa menyimpang ke zona bahaya tersembunyi."
            )
        ],
        "sop_steps": [
            "Periksa bilah HUD Navigasi Hijau di bagian atas layar untuk memverifikasi nilai DIST, EST, dan O2.",
            "Pastikan sisa oksigen kepulangan (O2) berada di atas angka 80% dan status rute menampilkan [100% VERIFIED SAFE].",
            "Klik tombol [ STEPS ▼ ] untuk membuka menu dropdown daftar manuver belokan navigasi.",
            "Kirimkan ringkasan rute ke komputer navigasi rover Mule sebelum kru melangkah melewati pintu airlock habitat."
        ],
        "safety_note": (
            "BATASAN DARURAT OKSIGEN: Jika selama perjalanan di lapangan pembacaan sisa O2 turun lebih cepat dari "
            "proyeksi simulasi A* (margin cadangan menyentuh 30%), astronaut wajib segera berbalik arah kembali ke habitat "
            "atau menyambungkan selang darurat ke tangki cadangan rover Mule."
        )
    },
    {
        "id": "step09",
        "file": "step09_aerial_scout.png",
        "url": "http://localhost:3001/id/peta?drone=true",
        "wait": 4.0,
        "title": "Bab 9: Simulasi Pengintaian Udara Drone Mars (Aerial Recon Scout)",
        "page": "Modal Simulator Drone Pengintai Mars (/id/peta)",
        "role": "Pilot Drone Atmosfer / Petugas Pengintai Taktis",
        "action": (
            "Klik tombol [AERIAL SCOUT] di bilah navigasi atas (atau ikon pesawat di toolbar kiri), "
            "pilih koordinat stasiun target penerbangan, dan klik tombol [ TERBANGKAN DRONE PENGINTAI ]."
        ),
        "impact": "Helikopter drone Ingenuity melakukan simulasi penerbangan pengintaian dan memverifikasi bahwa koridor rute bebas dari rintangan batu tajam.",
        "desc": (
            "Simulasi helikopter drone pengintai kelas Ingenuity berdaya jelajah tinggi. "
            "Fitur ini memungkinkan astronaut melakukan pengintaian udara (aerial reconnaissance) atas koridor lintasan "
            "sebelum kru keluar dari airlock habitat, memvalidasi kondisi visual permukaan dan potensi rintangan batuan besar."
        ),
        "boxes": [
            {"rect": (690, 12, 805, 46), "label": "KLIK: [AERIAL SCOUT] DI NAVBAR ATAS"},
            {"rect": (915, 65, 1260, 455), "label": "MODAL KONTROL PENERBANGAN DRONE INGENUITY"},
            {"rect": (925, 410, 1250, 450), "label": "KLIK: [ TERBANGKAN DRONE PENGINTAI ]"}
        ],
        "info_items": [
            (
                "Profil Aerodinamika Atmosfer Tipis Mars",
                "Spesifikasi penerbangan helikopter drone kelas Ingenuity: putaran baling-baling rotor ganda koaksial 2400 RPM untuk menghasilkan gaya angkat pada atmosfer bermassa jenis 0.020 kg/m3.",
                "Memvalidasi kelayakan terbang drone dalam kondisi kerapatan atmosfer kawah yang hanya 1% atmosfer Bumi, memastikan wahana tidak kehilangan daya angkat (stall)."
            ),
            (
                "Ketinggian Terbang Jelajah (350 m AGL)",
                "Ketinggian penerbangan di atas permukaan tanah (Above Ground Level) dengan kecepatan jelajah 10 m/s.",
                "Menyediakan sudut pandang ortofoto miring yang optimal untuk memindai kontur medan sejauh 500 meter di depan rombongan astronaut."
            ),
            (
                "Preset Lokasi Sasaran Pengintaian",
                "Pilihan cepat destinasi terbang: Bradbury Landing, Boxwork Discovery Site, Gediz Vallis Ridge, dan Pahrump Hills.",
                "Mempercepat penugasan drone ke lokasi-lokasi kritis yang memiliki potensi rintangan geologi tertinggi sebelum tim ekspedisi tiba di lokasi."
            ),
            (
                "Kamera Pengintai Sensorik Udara Top-Down",
                "Tampilan video resolusi tinggi berarah vertikal yang memperlihatkan koridor rute A* di antara celah batuan.",
                "Mendeteksi bongkahan batu besar baru hasil runtuhan tebing (rockfall) atau rekahan tanah sempit yang dapat mematahkan as roda rover Mule."
            ),
            (
                "Tombol Luncurkan [ TERBANGKAN DRONE PENGINTAI ]",
                "Tombol pemicu sekuens peluncuran otonom dari dek pendaratan drone habitat.",
                "Menjalankan misi penerbangan pengintaian otomatis dan mengalirkan telemetri langsung ke layar kendali astronaut."
            )
        ],
        "sop_steps": [
            "Klik tombol [AERIAL SCOUT] pada bilah navigasi atas cockpit peta.",
            "Pilih stasiun target penerbangan dari menu preset (misal: Mount Sharp Boxwork Site).",
            "Verifikasi kondisi angin permukaan tidak melebihi batas toleransi terbang drone (maksimal 15 m/s).",
            "Klik tombol [ TERBANGKAN DRONE PENGINTAI ] dan amati hasil pemindaian visual koridor jalur rute."
        ],
        "safety_note": (
            "PEMERIKSAAN HALANGAN BATU BESAR: Jika kamera drone mendeteksi bongkahan batu tajam berdiameter "
            ">50 cm di tengah jalur rute A*, navigator wajib melakukan penyesuaian rute kecil untuk memintas batu tersebut."
        )
    },
    {
        "id": "step10",
        "file": "step10_360_pov.png",
        "url": "http://localhost:3001/id/peta?pov=true&stn=1",
        "wait": 4.5,
        "title": "Bab 10: Eksplorasi Visual Permukaan Nyata (Surface 360° Cylindrical POV)",
        "page": "Penampil Permukaan 360° WebGL Three.js (/id/peta)",
        "role": "Astronaut Lapangan EVA / Spesialis Orientasi Spasial Medan",
        "action": (
            "Klik tombol [360° POV] pada bilah navigasi atau pin kamera [📷 360] di peta. "
            "Geser kursor untuk memutar kamera 360°, beralih antara [PANORAMA 360° NYATA] dan [PERMUKAAN 3D], "
            "serta gunakan tombol tur stasiun (STN-01 s/d STN-04) di bagian bawah."
        ),
        "impact": "Astronaut memperoleh pengenalan tanda medan (landmarks) visual setinggi mata sebelum melaksanakan ekspedisi fisik.",
        "desc": (
            "Simulator penampil 360° permukaan Mars berbasis WebGL silindris dengan garis horizon 100% rata, datar, "
            "dan bebas dari distorsi tong melengkung. Menggunakan mozaik panorama asli Mastcam NASA (Sol 0, Sol 2137 Vera Rubin, "
            "Sol 1310 Glen Torridon, Sol 4180 Boxwork 2025). "
            "Dilengkapi pergerakan langkah astronaut (1.7m) dan audio tiupan angin atmosfer Mars InSight."
        ),
        "boxes": [
            {"rect": (630, 8, 980, 44), "label": "MODE WARNA: [PANORAMA NYATA] // [PERMUKAAN 3D]"},
            {"rect": (430, 674, 870, 714), "label": "BILAH TUR STASIUN CEKPOIN (STN-01 S/D STN-04)"}
        ],
        "info_items": [
            (
                "Orientasi Sudut Pandang Kamera (AZ, PITCH, FOV)",
                "Pembacaan telemetri sudut kamera: Azimuth horisontal (AZ: 13°), Sudut kemiringan vertikal (PITCH: 37.7°), dan Bidang pandang optik manusia (FOV: 65°).",
                "Memberikan orientasi spasial matematis yang presisi; astronaut dapat menyamakan pembacaan derajat azimuth di layar dengan kompas helm saat berada di medan asli."
            ),
            (
                "Horizon Datar 100% (Flat Horizon Cylindrical WebGL)",
                "Proyeksi silindris fotorealistik khusus yang menjamin garis horizon kawah tampak 100% rata tanpa efek lengkung cembung tong (barrel distortion).",
                "Menyajikan proporsi bentang alam yang akurat dan alami, mencegah disorientasi visual serta menghilangkan mabuk simulator (simulator sickness) pada kru pelatihan."
            ),
            (
                "Mode Rendering [PANORAMA 360° NYATA] vs [PERMUKAAN 3D]",
                "Sakelar pengalih antara mozaik fotorealistik asli Mastcam dan model elevasi mesh geometri 3D bertekstur batuan.",
                "Memungkinkan astronaut memisahkan antara warna permukaan visual dengan bentuk geometri fisik kemiringan lereng yang sesungguhnya."
            ),
            (
                "Kontrol Melangkah Pejalan Kaki [ KLIK TANAH: PINDAH EVA (1.7M) ]",
                "Mekanisme perpindahan posisi setinggi mata astronaut (1.7 meter) dengan mengklik langsung pada permukaan tanah.",
                "Mensimulasikan ritme pergerakan melangkah manusia di atas permukaan tanah Mars pada gravitasi 0.38 g sebelum ekspedisi fisik dilakukan."
            ),
            (
                "Bilah Stasiun Cekpoin Sejarah (STN-01 s/d STN-04)",
                "Empat stasiun observasi kunci: STN-01 (Sol 0 Bradbury Landing), STN-02 (Sol 1800 Vera Rubin Hematite Ridge), STN-03 (Sol 2300 Glen Torridon Clay Trough), dan STN-04 (Sol 4180 Boxwork Discovery Site).",
                "Memberikan pemahaman mendalam tentang transisi geologi Mount Sharp dari dasar danau berlempung purba hingga lapisan sulfat kering."
            ),
            (
                "Audio Angin Atmosfer Mars InSight (AUDIO MARS: AKTIF / MATI)",
                "Rekaman tiupan angin atmosfer Mars asli dari sensor mikrofon tekanan udara wahana NASA InSight Lander.",
                "Melatih respon psikologis dan sensorik astronaut terhadap keterpencilan akustik di lingkungan atmosfer Mars bertekanan rendah (~600 Pa)."
            )
        ],
        "sop_steps": [
            "Buka penampil panorama 360° dengan mengklik tombol [360° POV] pada bilah navigasi atau pin kamera di peta.",
            "Klik dan geser (drag) kursor ke kiri dan kanan untuk memutar pandangan 360° mengelilingi puncak Mount Sharp.",
            "Klik tombol stasiun [STN-04: SOL 4180] di bilah bawah untuk melihat pemandangan formasi urat mineral Boxwork 2025.",
            "Klik opsi [AUDIO MARS: AKTIF] untuk menguji kesiapan sensorik pendengaran dalam simulasi kondisi lapangan."
        ],
        "safety_note": (
            "PELATIHAN MEDAN VISUAL: Seluruh kru EVA wajib menyelesaikan simulasi peninjauan 360° di 4 stasiun utama "
            "untuk menghafal bentuk siluet puncak bukit sebagai penanda arah alami jika sistem navigasi digital mengalami gangguan."
        )
    },
    {
        "id": "step11",
        "file": "step11_visor_hud.png",
        "url": "http://localhost:3001/id/peta?view=visor",
        "wait": 4.0,
        "title": "Bab 11: Uji Lapangan Kaca Helm Astronaut (Astronaut Visor HUD)",
        "page": "Mode Sudut Pandang Visor Helm Astronaut (/id/peta)",
        "role": "Astronaut Lapangan EVA / Petugas Dukungan Hidup Medis",
        "action": (
            "Klik tombol [HUD VISOR ASTRONOT] di bilah navigasi atas untuk mengaktifkan tampilan kaca helm, "
            "dan amati respon instrumen kompas serta telemetri pendukung kehidupan terhadap pergerakan arah pandang."
        ),
        "impact": "Menguji ergonomi pembacaan arah navigasi dan peringatan keselamatan saat astronaut berada langsung di medan Mars.",
        "desc": (
            "Beralih dari tampilan kendali stasiun GIS ke simulasi Heads-Up Display (HUD) di dalam kaca helm baju antariksa. "
            "Menyajikan kompas taktis militer 360° di bagian atas, horizon buatan pitch & roll, batas peringatan bahaya medan, "
            "serta telemetri konsumsi oksigen dan daya baterai real-time."
        ),
        "boxes": [
            {"rect": (538, 12, 680, 46), "label": "KLIK: [HUD VISOR ASTRONOT] DI NAVBAR"},
            {"rect": (500, 95, 760, 142), "label": "KOMPAS TAKTIS TERAJUT 360°"},
            {"rect": (15, 85, 335, 330), "label": "TELEMETRI DUKUNGAN HIDUP PLSS"},
            {"rect": (940, 85, 1265, 330), "label": "KONDISI LINGKUNGAN & CUACA SOL 4180"}
        ],
        "info_items": [
            (
                "Pita Kompas Taktis Militer 360° (Tactical Ribbon Compass)",
                "Indikator kompas pita bergerak di bagian atas kaca helm yang menampilkan derajat arah kardinal (N, NE, E, SE, S, SW, W, NW) beserta retikel target navigasi.",
                "Memandu langkah astronaut secara bebas tangan (hands-free); astronaut cukup menjaga tanda target tetap di tengah pita kompas tanpa perlu menunduk memegang peta gawai."
            ),
            (
                "Horizon Buatan & Skala Kemiringan Tubuh (Pitch/Roll Ladder)",
                "Garis acuan horizon digital yang menunjukkan sudut kemiringan postur tubuh astronaut terhadap gaya tarik gravitasi Mars (0.38 g).",
                "Mencegah disorientasi gravitasi di tengah badai debu atau saat mendaki tebing di mana batas garis horizon asli tertutup kabut debu."
            ),
            (
                "Telemetri Dukungan Hidup PLSS (Life Support Telemetry)",
                "Panel status biologis astronaut: Tekanan Jas (29.6 kPa), Konsumsi O2 (0.48 L/min), Detak Jantung (99 BPM), dan Baterai PLSS (88% / ~7.4 jam).",
                "Parameter hidup-mati paling vital; memberikan alarm instan jika terjadi dekompresi baju antariksa (tekanan <20 kPa) atau kelelahan jantung ekstrem (>140 BPM)."
            ),
            (
                "Stasiun Cuaca Lingkungan REMS (Rover Environmental Station)",
                "Parameter cuaca permukaan luar: Suhu Udara (-62°C), Tekanan Atmosfer (712 Pa), Ketebalan Debu (Tau: 0.32), dan Laju Radiasi MSL RAD (0.027 mSv/jam).",
                "Memperingatkan kedatangan badai debu lokal jika indeks Optical Depth Tau meningkat tajam, serta memantau akumulasi dosis radiasi secara langsung pada tubuh."
            ),
            (
                "Indikator Peringatan Bahaya Medan [SLOPE SAFE: 4.2°]",
                "Status kelerengan tanah yang sedang dipijak oleh sepatu astronaut beserta kekuatan perisai magnetik kerak saat ini (64 nT).",
                "Memberikan kewaspadaan situasional mikro agar astronaut tidak melangkah ke permukaan miring licin yang berisiko merusak baju antariksa."
            )
        ],
        "sop_steps": [
            "Klik tombol [HUD VISOR ASTRONOT] di bilah navigasi atas cockpit peta.",
            "Periksa pembacaan kotak kiri telemetri PLSS: pastikan tekanan jas berada pada rentang aman 28 - 32 kPa.",
            "Perhatikan pita kompas atas dan sesuaikan arah tubuh agar retikel sasaran mengarah ke sudut azimuth rute.",
            "Amati kotak kanan stasiun cuaca REMS: pastikan Optical Depth Tau berada di bawah ambang batas bahaya 0.8."
        ],
        "safety_note": (
            "ALARM TEKANAN JAS ANTARIKSA: Jika indikator tekanan jas antariksa berkedip merah dan turun di bawah "
            "20 kPa, astronaut wajib segera mengaktifkan pasokan O2 darurat sekunder dan masuk ke modul rover Mule dalam waktu <60 detik."
        )
    },
    {
        "id": "step12",
        "file": "step12_export_eva.png",
        "url": "http://localhost:3001/id/peta",
        "wait": 4.0,
        "title": "Bab 12: Ekspor Paket Dokumen Operasional Misi (GeoJSON Package)",
        "page": "Cockpit Kendali Habitat Mars (/id/peta)",
        "role": "Petugas Integrasi Sistem Data Misi / Komandan Lapangan",
        "action": (
            "Arahkan kursor ke sudut paling kanan atas bilah navigasi dan klik tombol hijau [EKSPOR EVA] "
            "untuk mengunduh paket data kartografi misi secara lengkap."
        ),
        "impact": "Sistem menghasilkan dan mengunduh berkas GeoJSON terkompresi yang siap diimpor langsung ke komputer navigasi rover dan gawai astronaut.",
        "desc": (
            "Langkah final sebelum misi lapangan diluncurkan adalah mengekspor paket data kartografi terintegrasi. "
            "Berkas standar GeoJSON yang diunduh mencakup seluruh koordinat titik waypoint, rute navigasi A*, "
            "batas zona bahaya kelerengan, fitur ZOI geologi, serta profil elevasi 5 meter."
        ),
        "boxes": [
            {"rect": (878, 14, 958, 46), "label": "KLIK: [EKSPOR EVA] DI NAVBAR ATAS"}
        ],
        "info_items": [
            (
                "Standar Format Terbuka GeoJSON RFC 7946",
                "Format pertukaran data geospasial berbasis JSON yang mematuhi standar universal International Open Geospatial Consortium (OGC).",
                "Memastikan interoperabilitas mutlak; data dapat langsung dimuat ke berbagai platform GIS seperti NASA MMGIS, QGIS, ArcGIS, maupun komputer navigasi rover buatan berbagai kontraktor antariksa."
            ),
            (
                "Entitas Lintasan Rute Optimal (MultiLineString)",
                "Rangkaian koordinat garis lintasan rute A* lengkap dengan atribut jarak sub-segmen, profil elevasi, dan timestamp proyeksi waktu tempuh.",
                "Dimasukkan ke sistem autopilot navigasi otonom rover pengangkut kargo Mule agar dapat melaju mendampingi astronaut secara mandiri tanpa perlu dikemudikan manual."
            ),
            (
                "Koleksi Titik Waypoint Ilmiah (FeatureCollection of Points)",
                "Daftar koordinat presisi stasiun geologi, titik awal Habitat Alpha, lokasi Boxwork 2025, dan lokasi singkapan mineral lempung.",
                "Menjadi panduan titik perhentian wajib bagi kru untuk melakukan pengeboran sampel, pemasangan sensor seismik, dan pemotretan makro batuan."
            ),
            (
                "Poligon Masker Bahaya Geofisika (Polygon FeatureCollection)",
                "Batas koordinat zona tebing curam (>15° dan >25°) serta poligon cekungan pasir hisap Morgan et al. (2020).",
                "Berfungsi sebagai pagar virtual keselamatan (virtual geofence) di dalam sistem kemudi rover yang secara otomatis mematikan motor penggerak jika rover mendekati zona berbahaya tersebut."
            ),
            (
                "Manifest Logistik & Telemetri Dukungan Hidup",
                "Dokumen data terstruktur yang mencantumkan total estimasi kebutuhan oksigen, air pendingin sublimator, dan baterai cadangan per kilometer.",
                "Menjadi dokumen audit keselamatan resmi yang wajib diverifikasi dan ditandatangani oleh Komandan Misi sebelum izin pembukaan pintu airlock habitat diterbitkan."
            ),
            (
                "Karakteristik 100% Offline-First Resiliency",
                "Seluruh struktur data GeoJSON yang diekspor tersimpan di penyimpanan lokal perangkat tanpa memerlukan koneksi jaringan internet atau satelit pengulang orbit.",
                "Menghilangkan risiko kegagalan sistem navigasi di tengah permukaan Mars akibat putusnya koneksi jaringan komunikasi satelit antariksa."
            )
        ],
        "sop_steps": [
            "Pastikan seluruh perencanaan rute, inspeksi titik, dan verifikasi lapisan keselamatan telah selesai dilakukan.",
            "Klik tombol hijau [EKSPOR EVA] di sudut kanan atas bilah navigasi.",
            "Simpan berkas GeoJSON hasil unduhan ke dalam media penyimpanan lokal komputer habitat.",
            "Unggah berkas GeoJSON ke komputer autopilot rover Mule dan unit HUD baju antariksa sebelum memulai ekspedisi."
        ],
        "safety_note": (
            "VERIFIKASI INTEGRITAS BERKAS: Sebelum melangkah keluar dari habitat, lakukan uji muat (load test) "
            "berkas GeoJSON pada konsol rover Mule untuk memastikan seluruh waypoint dan batas geofence terbaca 100% tanpa galat."
        )
    }
]

def annotate_image(image_path, boxes):
    if not os.path.exists(image_path):
        print(f"File not found for annotation: {image_path}")
        return
    img = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(img)

    for box in boxes:
        rect = box["rect"]
        label = box.get("label", "")
        for w in range(5):
            draw.rectangle(
                [rect[0] - w, rect[1] - w, rect[2] + w, rect[3] + w],
                outline="#ef4444"
            )
        if label:
            pad_x, pad_y = 6, 3
            text_w = len(label) * 7 + 14
            text_h = 18
            bg_x0 = max(10, min(rect[0], 1280 - text_w - 10))
            if rect[1] > 24:
                bg_y0 = rect[1] - text_h - 4
            else:
                bg_y0 = rect[3] + 4
            bg_x1 = bg_x0 + text_w
            bg_y1 = bg_y0 + text_h

            draw.rectangle([bg_x0, bg_y0, bg_x1, bg_y1], fill="#ef4444")
            draw.text((bg_x0 + pad_x, bg_y0 + pad_y), label, fill="#ffffff")

    img.save(image_path, quality=95)
    print(f"Annotated: {os.path.basename(image_path)}")

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    for child in list(tcPr):
        if child.tag.endswith('shd'):
            tcPr.remove(child)
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    for child in list(tcPr):
        if child.tag.endswith('tcMar'):
            tcPr.remove(child)
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, color="cbd5e1", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    for child in list(tblPr):
        if child.tag.endswith('tblBorders'):
            tblPr.remove(child)
    borders_xml = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders_xml)

def create_word_document():
    doc = docx.Document()

    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Document Header Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run_badge = p_title.add_run("MARSFORALL // GALE-01\n")
    run_badge.font.name = "Consolas"
    run_badge.font.size = Pt(11)
    run_badge.font.bold = True
    run_badge.font.color.rgb = RGBColor(0xd9, 0x77, 0x06)

    run_main = p_title.add_run("BUKU PANDUAN OPERASIONAL & USER FLOW LENGKAP PLATFORM\n(ASTRONAUT & MISSION CONTROL FIELD GUIDE)")
    run_main.font.name = "Arial"
    run_main.font.size = Pt(20)
    run_main.font.bold = True
    run_main.font.color.rgb = RGBColor(0x0b, 0x0f, 0x17)

    p_sub = doc.add_paragraph()
    run_sub = p_sub.add_run(
        "Interplanetary Survival Guide: Peta Navigasi Taktis, Lapisan Ilmiah NASA, & Forensik Permukaan Mars\n"
        "Panduan Komprehensif Berstandar Misi Antariksa: Rincian Lengkap Seluruh Parameter Data, Fungsi Operasional, Tangkapan Layar Berkotak Merah, & SOP Lapangan"
    )
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(10.5)
    run_sub.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Metadata Table
    table_meta = doc.add_table(rows=6, cols=2)
    table_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_meta.autofit = False
    set_table_borders(table_meta, color="334155", sz="6")

    meta_data = [
        ("Acara & Misi", "NASA Space Apps Challenge 2026 // MarsForAll GALE-01"),
        ("Target Operasional", "Mount Sharp (Aeolis Mons), Kawah Gale, Mars (Lat: -5.4453°, Lon: 137.8414°)"),
        ("Fokus Ilmiah Misi", "Penemuan Urat Mineral Boxwork 2025, 5 Lapisan Operasional NASA, & Rute Marswalk A*"),
        ("Standar Desain & Data", "100% Flat Matte, Zero Gradients, Zero Emojis, Unit Satuan SI & Planetologi Lengkap"),
        ("Sumber Data Geofisika", "USGS Astrogeology, NASA AMMOS MMGIS, JPL Mars Trek, NASA Worldview, PDS Geosciences"),
        ("Klasifikasi Dokumen", "PANDUAN OPERASIONAL RESMI LAPANGAN (FLIGHT & EVA OPERATIONS MANUAL)")
    ]

    for idx, (label, val) in enumerate(meta_data):
        row = table_meta.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.7)
        set_cell_background(c0, "0b0f17")
        set_cell_background(c1, "1e293b")
        set_cell_margins(c0, 60, 60, 100, 100)
        set_cell_margins(c1, 60, 60, 100, 100)

        p0 = c0.paragraphs[0]
        r0 = p0.add_run(label)
        r0.font.name = "Consolas"
        r0.font.size = Pt(9.5)
        r0.font.bold = True
        r0.font.color.rgb = RGBColor(0x94, 0xa3, 0xb8)

        p1 = c1.paragraphs[0]
        r1 = p1.add_run(val)
        r1.font.name = "Arial"
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(0xf1, 0xf5, 0xf9)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Executive Overview
    h_ov = doc.add_heading("RINGKASAN EKSEKUTIF & ARSITEKTUR ALUR PENGGUNA", level=1)
    h_ov.runs[0].font.name = "Arial"
    h_ov.runs[0].font.size = Pt(14)
    h_ov.runs[0].font.bold = True
    h_ov.runs[0].font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

    p_ov = doc.add_paragraph(
        "Buku Panduan Operasional ini disusun sebagai acuan teknis lengkap bagi astronaut penjelajah permukaan Mars "
        "dan pengendali misi di stasiun habitat. Platform MARSFORALL // GALE-01 dirancang secara khusus untuk menjembatani "
        "data mentah ilmiah NASA (HiRISE, CTX, MOLA, THEMIS, CRISM, MGS MAG, MSL RAD) menjadi antarmuka taktis "
        "yang dapat dioperasikan secara cepat dan andal di medan ekstrem. "
        "Buku panduan ini mengupas secara tuntas 12 bab fungsional utama dari awal mengakses portal hingga ekspor dokumen navigasi. "
        "Setiap bab memuat ringkasan lokasi operasional, tangkapan layar beranotasi kotak merah, tabel rinci seluruh parameter telemetri "
        "beserta makna ilmiah dan fungsi operasionalnya bagi keselamatan kru, Standar Operasional Prosedur (SOP) tindakan operator, "
        "serta protokol mitigasi risiko misi."
    )
    p_ov.runs[0].font.name = "Arial"
    p_ov.runs[0].font.size = Pt(10)
    p_ov.runs[0].font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    doc.add_page_break()

    # Iterate Steps
    for idx, step in enumerate(STEPS, start=1):
        # Chapter Heading
        h_step = doc.add_heading(f"{step['title']}", level=1)
        h_step.runs[0].font.name = "Arial"
        h_step.runs[0].font.size = Pt(14)
        h_step.runs[0].font.bold = True
        h_step.runs[0].font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)
        h_step.paragraph_format.space_before = Pt(8)
        h_step.paragraph_format.space_after = Pt(4)

        # Overview Table
        tbl_info = doc.add_table(rows=4, cols=2)
        tbl_info.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl_info.autofit = False
        set_table_borders(tbl_info, color="cbd5e1", sz="4")

        info_rows = [
            ("Lokasi Halaman / URL", step["page"]),
            ("Peran Pengguna Operasional", step["role"]),
            ("Aksi Pengguna (Kotak Merah)", step["action"]),
            ("Dampak Operasional Sistem", step["impact"])
        ]
        for r_i, (lbl, val) in enumerate(info_rows):
            c0, c1 = tbl_info.rows[r_i].cells[0], tbl_info.rows[r_i].cells[1]
            c0.width = Inches(2.2)
            c1.width = Inches(4.7)
            set_cell_background(c0, "f1f5f9")
            set_cell_background(c1, "ffffff")
            set_cell_margins(c0, 50, 50, 80, 80)
            set_cell_margins(c1, 50, 50, 80, 80)

            p0 = c0.paragraphs[0]
            r0 = p0.add_run(lbl)
            r0.font.name = "Consolas"
            r0.font.size = Pt(9)
            r0.font.bold = True
            r0.font.color.rgb = RGBColor(0x1e, 0x29, 0x3b)

            p1 = c1.paragraphs[0]
            r1 = p1.add_run(val)
            r1.font.name = "Arial"
            r1.font.size = Pt(9)
            r1.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

        # Feature Summary
        p_desc = doc.add_paragraph()
        p_desc.paragraph_format.space_before = Pt(6)
        p_desc.paragraph_format.space_after = Pt(6)
        r_desc_lbl = p_desc.add_run("Uraian Fungsional Fitur: ")
        r_desc_lbl.font.name = "Arial"
        r_desc_lbl.font.size = Pt(9.5)
        r_desc_lbl.font.bold = True
        r_desc_lbl.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

        r_desc = p_desc.add_run(step["desc"])
        r_desc.font.name = "Arial"
        r_desc.font.size = Pt(9.5)
        r_desc.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

        # Annotated Screenshot
        img_path = os.path.join(SCREENSHOTS_DIR, step["file"])
        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(4)
            p_img.paragraph_format.space_after = Pt(2)
            run_img = p_img.add_run()
            run_img.add_picture(img_path, width=Inches(6.4))

            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_after = Pt(10)
            run_cap = p_cap.add_run(f"Gambar {idx}: Tangkapan Layar Beranotasi Kotak Merah — {step['title']}")
            run_cap.font.name = "Consolas"
            run_cap.font.size = Pt(8.5)
            run_cap.font.italic = True
            run_cap.font.color.rgb = RGBColor(0x64, 0x74, 0x8b)

        # Telemetry Information Table (The Guidebook Table!)
        p_tbl_heading = doc.add_paragraph()
        p_tbl_heading.paragraph_format.space_before = Pt(6)
        p_tbl_heading.paragraph_format.space_after = Pt(4)
        r_tbl_h = p_tbl_heading.add_run("TABEL RINCIAN INFORMASI FITUR & KEGUNAAN OPERASIONAL BAGI ASTRONAUT / MISI")
        r_tbl_h.font.name = "Arial"
        r_tbl_h.font.size = Pt(10)
        r_tbl_h.font.bold = True
        r_tbl_h.font.color.rgb = RGBColor(0x0b, 0x0f, 0x17)

        info_items = step.get("info_items", [])
        tbl_telemetry = doc.add_table(rows=len(info_items) + 1, cols=4)
        tbl_telemetry.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl_telemetry.autofit = False
        set_table_borders(tbl_telemetry, color="cbd5e1", sz="4")

        # Table Header Row
        headers = ["No", "Elemen / Parameter Informasi", "Makna & Definisi Ilmiah Data", "Fungsi & Kegunaan Operasional bagi Misi"]
        col_widths = [Inches(0.4), Inches(2.0), Inches(2.2), Inches(2.3)]

        hdr_row = tbl_telemetry.rows[0]
        for c_idx, h_text in enumerate(headers):
            cell = hdr_row.cells[c_idx]
            cell.width = col_widths[c_idx]
            set_cell_background(cell, "0b0f17")
            set_cell_margins(cell, 60, 60, 80, 80)
            p = cell.paragraphs[0]
            if c_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(h_text)
            r.font.name = "Consolas"
            r.font.size = Pt(8.5)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0xff, 0xff, 0xff)

        # Table Data Rows
        for item_idx, (param, meaning, utility) in enumerate(info_items, start=1):
            row = tbl_telemetry.rows[item_idx]
            row_bg = "f8fafc" if item_idx % 2 == 1 else "ffffff"

            # Col 0: No
            c0 = row.cells[0]
            c0.width = col_widths[0]
            set_cell_background(c0, row_bg)
            set_cell_margins(c0, 50, 50, 60, 60)
            p0 = c0.paragraphs[0]
            p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r0 = p0.add_run(str(item_idx))
            r0.font.name = "Consolas"
            r0.font.size = Pt(8.5)
            r0.font.bold = True
            r0.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

            # Col 1: Parameter
            c1 = row.cells[1]
            c1.width = col_widths[1]
            set_cell_background(c1, row_bg)
            set_cell_margins(c1, 50, 50, 80, 80)
            p1 = c1.paragraphs[0]
            r1 = p1.add_run(param)
            r1.font.name = "Consolas"
            r1.font.size = Pt(8.5)
            r1.font.bold = True
            r1.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

            # Col 2: Meaning
            c2 = row.cells[2]
            c2.width = col_widths[2]
            set_cell_background(c2, row_bg)
            set_cell_margins(c2, 50, 50, 80, 80)
            p2 = c2.paragraphs[0]
            r2 = p2.add_run(meaning)
            r2.font.name = "Arial"
            r2.font.size = Pt(8.5)
            r2.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

            # Col 3: Utility
            c3 = row.cells[3]
            c3.width = col_widths[3]
            set_cell_background(c3, row_bg)
            set_cell_margins(c3, 50, 50, 80, 80)
            p3 = c3.paragraphs[0]
            r3 = p3.add_run(utility)
            r3.font.name = "Arial"
            r3.font.size = Pt(8.5)
            r3.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

        # SOP Action Steps
        p_sop_h = doc.add_paragraph()
        p_sop_h.paragraph_format.space_before = Pt(8)
        p_sop_h.paragraph_format.space_after = Pt(2)
        r_sop_h = p_sop_h.add_run("STANDAR OPERASIONAL PROSEDUR (SOP) TINDAKAN OPERATOR:")
        r_sop_h.font.name = "Arial"
        r_sop_h.font.size = Pt(9.5)
        r_sop_h.font.bold = True
        r_sop_h.font.color.rgb = RGBColor(0x0b, 0x0f, 0x17)

        sop_steps = step.get("sop_steps", [])
        for s_idx, s_text in enumerate(sop_steps, start=1):
            p_step_item = doc.add_paragraph()
            p_step_item.paragraph_format.left_indent = Inches(0.2)
            p_step_item.paragraph_format.space_after = Pt(2)
            r_num = p_step_item.add_run(f"{s_idx}. ")
            r_num.font.name = "Consolas"
            r_num.font.size = Pt(9)
            r_num.font.bold = True
            r_num.font.color.rgb = RGBColor(0xd9, 0x77, 0x06)

            r_txt = p_step_item.add_run(s_text)
            r_txt.font.name = "Arial"
            r_txt.font.size = Pt(9)
            r_txt.font.color.rgb = RGBColor(0x1e, 0x29, 0x3b)

        # Safety & Risk Mitigation Callout
        safety_note = step.get("safety_note", "")
        if safety_note:
            tbl_safety = doc.add_table(rows=1, cols=1)
            tbl_safety.alignment = WD_TABLE_ALIGNMENT.CENTER
            tbl_safety.autofit = False
            cell_safe = tbl_safety.rows[0].cells[0]
            cell_safe.width = Inches(6.9)
            set_cell_background(cell_safe, "111827")
            set_cell_margins(cell_safe, 60, 60, 100, 100)
            set_table_borders(tbl_safety, color="e11d48", sz="8")

            p_safe = cell_safe.paragraphs[0]
            r_safe = p_safe.add_run(safety_note)
            r_safe.font.name = "Consolas"
            r_safe.font.size = Pt(8.5)
            r_safe.font.bold = True
            r_safe.font.color.rgb = RGBColor(0xfb, 0xbf, 0x24)

        if idx < len(STEPS):
            doc.add_page_break()

    # Final Chapter: Checklist Kesiapan Operasional Misi
    doc.add_page_break()
    h_close = doc.add_heading("BAB 13: CHECKLIST KESIAPAN OPERASIONAL MISI & INTEGRASI 5 LAPISAN NASA", level=1)
    h_close.runs[0].font.name = "Arial"
    h_close.runs[0].font.size = Pt(14)
    h_close.runs[0].font.bold = True
    h_close.runs[0].font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

    p_check = doc.add_paragraph(
        "Sebelum kru astronaut keluar dari airlock Habitat Alpha menuju medan permukaan Kawah Gale, "
        "seluruh parameter keselamatan berikut wajib diverifikasi melalui platform MARSFORALL // GALE-01 "
        "dan disahkan oleh Komandan Misi Lapangan:"
    )
    p_check.runs[0].font.name = "Arial"
    p_check.runs[0].font.size = Pt(10)
    p_check.runs[0].font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    checklist_items = [
        ("Layer 1 Poligon Geologi USGS", "Target sampel batuan berada pada zona formasi urat mineral Boxwork 2025 Hesperian."),
        ("Layer 2 DEM Kelerengan", "Seluruh segmen rute berada di bawah batas kritis <15° [SAFE] tanpa melintasi tebing terjal."),
        ("Layer 3 Detektor Pasir Termal", "Koridor lintasan memiliki inersia termal >=350 tiu berstatus [BEDROCK FIRM] bebas pasir amblas."),
        ("Layer 4 Mineral Terhidrasi CRISM", "Jalur memiliki potensi ekstraksi air (WEH %) optimal untuk suplai cadangan darurat ISRU."),
        ("Layer 5 Perisai Radiasi Alami", "Rute melintasi zona anomali magnetik kerak MGS MAG >=40 nT untuk mengurangi paparan radiasi kosmik."),
        ("Keseimbangan Cadangan Oksigen PLSS", "Proyeksi sisa oksigen kepulangan terverifikasi >=80%, jauh di atas batas cadangan darurat 25%."),
        ("Status Daya Baterai Rover Mule", "Sistem daya traksi rover dan pemanas jas terverifikasi prima dengan sokongan cadangan RTG aktif."),
        ("Hasil Pengintaian Udara Drone", "Penerbangan drone kelas Ingenuity mengonfirmasi koridor rute bebas dari bongkahan batu besar baru."),
        ("Orientasi Visual 360° Permukaan", "Tanda medan (landmarks) Mount Sharp dan Vera Rubin Ridge telah dipelajari melalui penampil 360°."),
        ("Kalibrasi Visor HUD Helm", "Pita kompas taktis 360°, horizon buatan, dan alarm tekanan jas antariksa terkalibrasi normal."),
        ("Ekspor Berkas GeoJSON Misi", "Paket navigasi GeoJSON telah diunduh, diverifikasi, dan tersinkronisasi ke komputer autopilot rover Mule.")
    ]

    for item, detail in checklist_items:
        p_item = doc.add_paragraph()
        p_item.paragraph_format.left_indent = Inches(0.2)
        p_item.paragraph_format.space_after = Pt(3)
        r_item_title = p_item.add_run(f"[{item}]: ")
        r_item_title.font.name = "Consolas"
        r_item_title.font.size = Pt(9.5)
        r_item_title.font.bold = True
        r_item_title.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

        r_item_desc = p_item.add_run(detail)
        r_item_desc.font.name = "Arial"
        r_item_desc.font.size = Pt(9.5)
        r_item_desc.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    try:
        doc.save(DOCX_PATH)
        print(f"\nSUCCESS: Operational Guidebook Document successfully created at:\n{DOCX_PATH}")
    except PermissionError:
        fallback_path = os.path.join(BASE_DIR, "PANDUAN_USER_FLOW_DAN_PENGGUNAAN_MARSFORALL_BARU.docx")
        doc.save(fallback_path)
        print(f"\nWARNING: {DOCX_PATH} is locked by Microsoft Word.")
        print(f"SUCCESS: Saved as fallback at:\n{fallback_path}")

def main():
    if "--capture-only" in sys.argv:
        print("=== Step 1: Capturing Screenshots via Single Chrome CDP Instance ===")
        asyncio.run(capture_all_cdp())
        return

    if "--doc-only" in sys.argv or os.path.exists(os.path.join(SCREENSHOTS_DIR, "step01_landing.png")):
        print("=== Screenshots already present. Compiling Operational Guidebook Document ===")
        create_word_document()
        return

    print("=== Step 1: Capturing Screenshots via Single Chrome CDP Instance ===")
    asyncio.run(capture_all_cdp())

    print("\n=== Step 2: Annotating Screenshots with Precision Red Boxes ===")
    for step in STEPS:
        img_file = os.path.join(SCREENSHOTS_DIR, step["file"])
        annotate_image(img_file, step["boxes"])

    print("\n=== Step 3: Compiling Microsoft Word Operational Guidebook Document ===")
    create_word_document()

if __name__ == "__main__":
    main()
