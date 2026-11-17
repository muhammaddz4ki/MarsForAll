import os
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
        "title": "Langkah 1: Mengakses Beranda & Eksplorasi Relief 3D Planet Mars",
        "page": "Halaman Beranda Utama (/id)",
        "desc": (
            "Halaman beranda merupakan pintu gerbang orientasi misi penjelajahan Mars. "
            "Di sini sistem menyajikan model 3D Bola Planet Mars interaktif (Mars Global Relief) yang memproyeksikan "
            "topografi Kawah Gale dan Kawah Jezero, sorotan ilmiah penemuan urat mineral Boxwork 2025 oleh rover Curiosity, "
            "serta parameter lingkungan antariksa Mars (jarak 225 juta km, radiasi 0.65 mSv/sol)."
        ),
        "action": (
            "Arahkan kursor ke tombol aksi utama di layar, lalu klik tombol "
            "[ BUKA PETA MARS -> ] di bilah navigasi atas atau [ JELAJAHI PETA MARS ] di tengah layar."
        ),
        "impact": "Sistem langsung mengarahkan Anda ke Cockpit Kendali Habitat Mars (/id/peta) dengan muatan data kartografi resolusi tinggi.",
        "boxes": [
            {"rect": (1030, 14, 1225, 48), "label": "KLIK: [ BUKA PETA MARS -> ]"}
        ]
    },
    {
        "id": "step02",
        "file": "step02_map_overview.png",
        "url": "http://localhost:3001/id/peta",
        "wait": 5.5,
        "title": "Langkah 2: Tinjauan Cockpit Kendali Habitat & Seleksi Situs Misi",
        "page": "Peta Operasional Kendali Habitat (/id/peta)",
        "desc": (
            "Setelah masuk ke peta, layar menampilkan Cockpit Kendali Habitat Mars berbasis GIS 2.5D. "
            "Informasi yang tersedia mencakup kanvas satelit HiRISE/CTX, grid topografi MOLA dengan rentang datum "
            "-4500m hingga -3500m, status kekerasan tanah, serta bilah telemetri kursor koordinat real-time."
        ),
        "action": (
            "Pada Bilah Navigasi Atas (Top Navbar), pastikan tombol [SITE-01: GALE (MSL)] terpilih aktif "
            "(berwarna oranye cerah), atau klik untuk memfokuskan kamera orbital ke Aeolis Mons (Mount Sharp)."
        ),
        "impact": "Kanvas peta secara otomatis melakukan fly-to dan memuat tile orbital Kawah Gale pada koordinat Lat: -5.4453°, Lon: 137.8414°.",
        "boxes": [
            {"rect": (18, 12, 178, 44), "label": "SELEKTOR SITUS: [SITE-01: GALE (MSL)]"},
            {"rect": (15, 672, 680, 715), "label": "BILAH TELEMETRI REAL-TIME & DATUM"}
        ]
    },
    {
        "id": "step03",
        "file": "step03_layers.png",
        "url": "http://localhost:3001/id/peta?tool=layers",
        "wait": 4.0,
        "title": "Langkah 3: Mengaktifkan 5 Lapisan Data Ilmiah NASA (Scientific Layers)",
        "page": "Panel Lapisan Ilmiah NASA (/id/peta?tool=layers)",
        "desc": (
            "Panel laci kiri ini menyajikan 5 Lapisan Operasional Ilmiah NASA berstandar Mars Trek & MMGIS:\n"
            "• Layer 1: Citra Optik HiRISE 25cm & Poligon Geologi USGS (Noachian, Hesperian, Amazonian, urat Boxwork).\n"
            "• Layer 2: Topografi DEM 1m & Masker Bahaya Kelerengan (<15° Aman, 15°-25° Waspada, >25° Bahaya Impassable).\n"
            "• Layer 3: Detektor Jebakan Pasir Termal THEMIS/TES (Morgan et al. 2020: Bedrock Padat vs Pasir Amblas).\n"
            "• Layer 4: Mineralogi Terhidrasi CRISM & Hidrogen Ekuivalen Air (WEH % Smektit, Sulfat, Hematit).\n"
            "• Layer 5: Lingkungan Radiasi MSL RAD & Perisai Magnetik Kerak MGS MAG (nT)."
        ),
        "action": (
            "Klik ikon tumpukan layer pada bilah alat vertikal di sisi paling kiri, kemudian atur sakelar "
            "Layer 2 (DEM Hazard) dan Layer 3 (Detektor Jebakan Pasir) ke posisi AKTIF, serta sesuaikan slider opasitas."
        ),
        "impact": "Peta langsung menampilkan masker warna zona bahaya kelerengan dan wilayah pasir hisap untuk memastikan rute yang direncanakan 100% aman.",
        "boxes": [
            {"rect": (0, 68, 42, 108), "label": "IKON TOOLBAR: [LAPISAN DATA]"},
            {"rect": (44, 40, 394, 680), "label": "LACI 5 LAPISAN ILMIAH NASA & SLIDER"}
        ]
    },
    {
        "id": "step04",
        "file": "step04_inspector.png",
        "url": "http://localhost:3001/id/peta?inspect=boxwork",
        "wait": 4.0,
        "title": "Langkah 4: Inspeksi Titik Lapangan & Geologi Batuan (Point Inspector)",
        "page": "Instrumen Point Inspector (/id/peta)",
        "desc": (
            "Instrumen Point Inspector dirancang dengan latar belakang solid flat matte berkontras tinggi untuk "
            "menguji kelayakan fisik batuan di titik mana pun pada kawah Mars. "
            "Data telemetri yang ditampilkan mencakup: Elevasi MOLA (-3912 m), Kelerengan Lereng (11.4° [AMAN <15°]), "
            "Kekerasan Tanah ([BATUAN DASAR PADAT]), Perisai Magnetik Kerak (72 nT), Koordinat Lat/Lon, dan Komposisi Mineralogi."
        ),
        "action": (
            "Klik stasiun geologi (misal Sol 4180 Boxwork) atau klik tombol [INSPEKSI] di navbar atas. "
            "Setelah informasi terbaca, klik tombol hijau utama: [ RENCANAKAN RUTE MARSWALK A* KE SINI ]."
        ),
        "impact": "Titik target terkunci di sistem navigasi dan siap dihitung lintasannya oleh algoritma A* Pathfinding.",
        "boxes": [
            {"rect": (44, 40, 394, 680), "label": "PANEL LACI INSPEKSI TITIK & GEOLOGI"},
            {"rect": (55, 520, 380, 554), "label": "KLIK: [ RENCANAKAN RUTE MARSWALK A* KE SINI ]"}
        ]
    },
    {
        "id": "step05",
        "file": "step05_prospector.png",
        "url": "http://localhost:3001/id/peta?tool=prospector",
        "wait": 4.0,
        "title": "Langkah 5: Penilaian Potensi Sumber Daya In-Situ (Prospector ML Data Fusion)",
        "page": "Panel Prospektor Sumber Daya Mars (/id/peta?tool=prospector)",
        "desc": (
            "Mesin kecerdasan buatan Prospector ML menggabungkan 35 parameter geofisika Mars untuk mengevaluasi "
            "potensi pemanfaatan sumber daya setempat (In-Situ Resource Utilization / ISRU). "
            "Menghitung Resource Promise Score (0 - 100%) dan Model Uncertainty Index (±%), dengan rincian potensi "
            "ekstraksi air dari mineral terhidrasi, stabilitas batuan pondasi, dan proteksi radiasi magnetik alami."
        ),
        "action": (
            "Klik ikon segitiga peringatan/prospektor di toolbar kiri atau tombol [PROSPEKTOR ML] di Point Inspector. "
            "Gunakan slider prioritas untuk menaikkan bobot ekstraksi air (WEH %) atau stabilitas habitat."
        ),
        "impact": "Skor janji sumber daya terkalkulasi ulang secara deterministik dan menjadi rujukan utama pemilihan tapak habitat.",
        "boxes": [
            {"rect": (0, 185, 42, 225), "label": "IKON TOOLBAR: [PROSPEKTOR ML]"},
            {"rect": (44, 40, 394, 680), "label": "PANEL FUSI 35 PARAMETER & SKOR RESOURCE"}
        ]
    },
    {
        "id": "step06",
        "file": "step06_analogue.png",
        "url": "http://localhost:3001/id/peta?tool=analogue",
        "wait": 4.0,
        "title": "Langkah 6: Validasi Uji Terestrial di Bumi (Earth Analogue Matcher)",
        "page": "Panel Pencocok Analogi Bumi (/id/peta?tool=analogue)",
        "desc": (
            "Algoritma Multi-Criteria Decision Analysis (MCDA) mencocokkan kondisi geologi Mars dengan 4 laboratorium "
            "lingkungan ekstrem di Bumi yang menjadi tempat uji coba baju astronaut dan rover NASA:\n"
            "• Kawah Haughton (Pulau Devon, Arktik): Uji coba batuan impak dan permafrost.\n"
            "• Death Valley (Mojave): Uji coba kipas aluvial kering dan sedimen garam.\n"
            "• Río Tinto (Spanyol): Uji coba air asam hidrotermal purba kaya zat besi dan sulfat.\n"
            "• Gurun Atacama (Cile): Uji coba tanah hiper-arid dan batas kehidupan mikroorganisme."
        ),
        "action": (
            "Klik ikon kompas analogi di toolbar kiri atau tombol [ANALOGI BUMI] di kartu inspeksi, "
            "lalu evaluasi kartu analogi yang memiliki skor kecocokan tertinggi."
        ),
        "impact": "Astronaut memperoleh panduan protokol pengujian alat dan prosedur keselamatan yang telah terverifikasi di Bumi.",
        "boxes": [
            {"rect": (0, 226, 42, 266), "label": "IKON TOOLBAR: [ANALOGI BUMI]"},
            {"rect": (44, 40, 394, 680), "label": "SKOR KECOCOKAN 4 LAB EKSTREM BUMI"}
        ]
    },
    {
        "id": "step07",
        "file": "step07_spatial_tools.png",
        "url": "http://localhost:3001/id/peta?tool=tools",
        "wait": 4.0,
        "title": "Langkah 7: Pengukuran Spasial, Viewshed 360°, & Profil Transek 5M (MMGIS)",
        "page": "Panel Alat Spasial & Peta (/id/peta?tool=tools)",
        "desc": (
            "Menghadirkan instrumen kartografi analitis NASA MMGIS:\n"
            "1. Ukur / Profil Elevasi Melintang: Menggambar garis transek untuk menginspeksi ketinggian tiap 5 meter.\n"
            "2. Viewshed 360° Line-of-Sight: Menghitung poligon jarak pandang visual dari ketinggian mata astronaut (1.7m).\n"
            "3. Penandaan ZOI (Zone of Interest): Menaruh pin target riset geologi permanen.\n"
            "4. Sol Time-Travel Scrubber: Memilih checkpoint penjelajahan rover Curiosity dari Sol 0 hingga Sol 4180."
        ),
        "action": (
            "Klik ikon penggaris/pensil di bilah kiri, pilih opsi [UKUR / PROFIL], dan klik tombol [DOCK TRANSEK 5M] "
            "di bagian bawah untuk membuka grafik elevasi melintang."
        ),
        "impact": "Grafik kontur elevasi melintang 5 meter terbuka di bagian bawah layar memperlihatkan profil lereng secara akurat.",
        "boxes": [
            {"rect": (0, 109, 42, 149), "label": "IKON TOOLBAR: [ALAT SPASIAL]"},
            {"rect": (44, 40, 394, 680), "label": "MENU TRANSEK, VIEWSHED, & ZOI"}
        ]
    },
    {
        "id": "step08",
        "file": "step08_marswalk_route.png",
        "url": "http://localhost:3001/id/peta?route=sample",
        "wait": 4.5,
        "title": "Langkah 8: Navigasi Taktis Rute Aman Marswalk A* (3D Route HUD)",
        "page": "Peta Operasional dengan Navigasi Rute Aktif (/id/peta)",
        "desc": (
            "Algoritma Terrain-Aware Marswalk A* menghitung rute teraman dari Habitat Alpha menuju target batuan "
            "dengan menerapkan penalti kelerengan kuadratik (menghindari lereng >15° dan jebakan pasir lepas). "
            "Bilah HUD Navigasi Atas menyajikan: Total Jarak (DIST: km), Estimasi Waktu (EST: h), Sisa Oksigen (O2: %), "
            "Daya Baterai (BATT: %), Kekuatan Perisai Magnetik (SHIELD: nT), dan Indikator Status Keselamatan."
        ),
        "action": (
            "Amati rute lintasan hijau di peta. Klik tombol [ STEPS ▼ ] pada bilah navigasi untuk membuka "
            "panduan manuver belokan navigasi langkah-demi-langkah (turn-by-turn maneuvers)."
        ),
        "impact": "Astronaut dan pengemudi rover mendapatkan instruksi arah presisi yang menjamin kelangsungan hidup sebelum oksigen menyentuh batas kritis.",
        "boxes": [
            {"rect": (50, 46, 750, 114), "label": "BILAH HUD NAVIGASI 3D MARSWALK & TELEMETRI"},
            {"rect": (420, 240, 780, 580), "label": "LINTASAN RUTE A* BEBAS TEBING & AMBLAS"}
        ]
    },
    {
        "id": "step09",
        "file": "step09_aerial_scout.png",
        "url": "http://localhost:3001/id/peta?drone=true",
        "wait": 4.0,
        "title": "Langkah 9: Simulasi Pengintaian Udara Drone Mars (Aerial Recon Scout)",
        "page": "Modal Drone Pengintai Mars (/id/peta)",
        "desc": (
            "Simulasi helikopter drone pengintai kelas Ingenuity berdaya jelajah tinggi. "
            "Fitur ini memungkinkan astronaut melakukan pengintaian udara (aerial reconnaissance) atas koridor lintasan "
            "sebelum kru keluar dari airlock habitat, memvalidasi kondisi visual permukaan dan potensi rintangan batuan besar."
        ),
        "action": (
            "Klik tombol [AERIAL SCOUT] di navbar atas atau ikon pesawat di toolbar kiri, "
            "pilih koordinat stasiun target, dan tekan tombol luncurkan penerbangan simulasi."
        ),
        "impact": "Drone melakukan pemindaian terbang lintas dari ketinggian pandang atas dan mengirimkan rekaman citra ke sistem navigasi.",
        "boxes": [
            {"rect": (690, 12, 805, 46), "label": "KLIK: [AERIAL SCOUT] DI NAVBAR ATAS"},
            {"rect": (915, 65, 1260, 455), "label": "MODAL KONTROL PENERBANGAN DRONE INGENUITY"},
            {"rect": (925, 410, 1250, 450), "label": "KLIK: [ TERBANGKAN DRONE PENGINTAI ]"}
        ]
    },
    {
        "id": "step10",
        "file": "step10_360_pov.png",
        "url": "http://localhost:3001/id/peta?pov=true&stn=1",
        "wait": 4.5,
        "title": "Langkah 10: Eksplorasi Visual Permukaan Nyata (Surface 360° Cylindrical POV)",
        "page": "Penampil Permukaan 360° WebGL Three.js (/id/peta)",
        "desc": (
            "Simulator penampil 360° permukaan Mars berbasis WebGL silindris dengan garis horizon 100% rata, datar, "
            "dan bebas dari distorsi tong melengkung. Menggunakan mozaik panorama asli Mastcam NASA (Sol 0, Sol 2137 Vera Rubin, "
            "Sol 1310 Glen Torridon, Sol 4180 Boxwork 2025). "
            "Dilengkapi pergerakan langkah astronaut (1.7m) dan audio tiupan angin atmosfer Mars InSight."
        ),
        "action": (
            "Klik tombol [360° POV] pada bilah navigasi atau pin kamera [📷 360] di peta. "
            "Geser kursor untuk memutar kamera 360°, beralih antara [PANORAMA 360° NYATA] dan [PERMUKAAN 3D], "
            "serta gunakan tombol tur stasiun (STN-01 s/d STN-04) di bagian bawah."
        ),
        "impact": "Astronaut memperoleh pengenalan tanda medan (landmarks) visual setinggi mata sebelum melaksanakan ekspedisi fisik.",
        "boxes": [
            {"rect": (630, 8, 980, 44), "label": "MODE WARNA: [PANORAMA NYATA] // [PERMUKAAN 3D]"},
            {"rect": (430, 674, 870, 714), "label": "BILAH TUR STASIUN CEKPOIN (STN-01 S/D STN-04)"}
        ]
    },
    {
        "id": "step11",
        "file": "step11_visor_hud.png",
        "url": "http://localhost:3001/id/peta?view=visor",
        "wait": 4.0,
        "title": "Langkah 11: Uji Lapangan Kaca Helm Astronaut (Astronaut Visor HUD)",
        "page": "Mode Sudut Pandang Visor Helm Astronaut (/id/peta)",
        "desc": (
            "Beralih dari tampilan kendali stasiun GIS ke simulasi Heads-Up Display (HUD) di dalam kaca helm baju antariksa. "
            "Menyajikan kompas taktis militer 360° di bagian atas, horizon buatan pitch & roll, batas peringatan bahaya medan, "
            "serta telemetri konsumsi oksigen dan daya baterai real-time."
        ),
        "action": (
            "Klik tombol [HUD VISOR ASTRONOT] di bilah navigasi atas untuk mengaktifkan tampilan kaca helm, "
            "dan amati respon instrumen terhadap pergerakan arah kompas."
        ),
        "impact": "Menguji ergonomi pembacaan arah navigasi dan peringatan keselamatan saat astronaut berada langsung di medan Mars.",
        "boxes": [
            {"rect": (538, 12, 680, 46), "label": "KLIK: [HUD VISOR ASTRONOT] DI NAVBAR"},
            {"rect": (500, 95, 760, 142), "label": "KOMPAS TAKTIS TERAJUT 360°"},
            {"rect": (15, 85, 335, 330), "label": "TELEMETRI DUKUNGAN HIDUP PLSS"},
            {"rect": (940, 85, 1265, 330), "label": "KONDISI LINGKUNGAN & CUACA SOL 4180"}
        ]
    },
    {
        "id": "step12",
        "file": "step12_export_eva.png",
        "url": "http://localhost:3001/id/peta",
        "wait": 4.0,
        "title": "Langkah 12: Ekspor Paket Dokumen Operasional Misi (GeoJSON Package)",
        "page": "Peta Operasional Kendali Habitat (/id/peta)",
        "desc": (
            "Langkah final sebelum misi lapangan diluncurkan adalah mengekspor paket data kartografi terintegrasi. "
            "Berkas standar GeoJSON yang diunduh mencakup seluruh koordinat titik waypoint, rute navigasi A*, "
            "batas zona bahaya kelerengan, fitur ZOI geologi, serta profil elevasi 5 meter."
        ),
        "action": (
            "Klik tombol hijau [EKSPOR EVA] di sudut paling kanan atas bilah navigasi."
        ),
        "impact": "Sistem menghasilkan dan mengunduh berkas GeoJSON terkompresi yang siap diimpor langsung ke komputer navigasi rover dan gawai astronaut.",
        "boxes": [
            {"rect": (878, 14, 958, 46), "label": "KLIK: [EKSPOR EVA] DI NAVBAR ATAS"}
        ]
    }
]

async def capture_all_cdp():
    user_data_dir = r"C:\Users\DELL\AppData\Local\Temp\chrome_cdp_profile"
    chrome_proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        f"--user-data-dir={user_data_dir}",
        "--disable-gpu",
        "--window-size=1280,720",
        "about:blank"
    ])
    await asyncio.sleep(2.0)

    try:
        req = urllib.request.urlopen("http://127.0.0.1:9222/json/list")
        tabs = [t for t in json.loads(req.read().decode()) if t.get("type") == "page"]
        ws_url = tabs[0]["webSocketDebuggerUrl"]
        print(f"Connected to Chrome CDP WebSocket: {ws_url}")

        async with websockets.connect(ws_url, max_size=20 * 1024 * 1024) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
            await ws.recv()
            await ws.send(json.dumps({
                "id": 2,
                "method": "Emulation.setDeviceMetricsOverride",
                "params": {
                    "width": 1280,
                    "height": 720,
                    "deviceScaleFactor": 1,
                    "mobile": False
                }
            }))
            await ws.recv()

            req_id = 10
            for step in STEPS:
                out_path = os.path.join(SCREENSHOTS_DIR, step["file"])
                print(f"\n--> Navigating to {step['url']} ({step['file']})...")
                req_id += 1
                await ws.send(json.dumps({"id": req_id, "method": "Page.navigate", "params": {"url": step["url"]}}))
                while True:
                    msg = json.loads(await ws.recv())
                    if msg.get("id") == req_id:
                        break

                print(f"Waiting {step['wait']}s for tiles & WebGL shaders to fully render...")
                await asyncio.sleep(step["wait"])

                req_id += 1
                await ws.send(json.dumps({"id": req_id, "method": "Page.captureScreenshot", "params": {"format": "png"}}))
                while True:
                    msg = json.loads(await ws.recv())
                    if msg.get("id") == req_id:
                        img_data = base64.b64decode(msg["result"]["data"])
                        with open(out_path, "wb") as f:
                            f.write(img_data)
                        print(f"Captured {step['file']} ({len(img_data)} bytes)")
                        break

    finally:
        chrome_proc.terminate()
        print("Chrome process terminated.")

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
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_word_document():
    doc = docx.Document()

    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Document Header
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run_badge = p_title.add_run("MARSFORALL // GALE-01\n")
    run_badge.font.name = "Consolas"
    run_badge.font.size = Pt(11)
    run_badge.font.bold = True
    run_badge.font.color.rgb = RGBColor(0xd9, 0x77, 0x06)

    run_main = p_title.add_run("PANDUAN OPERASIONAL & USER FLOW LENGKAP PLATFORM")
    run_main.font.name = "Arial"
    run_main.font.size = Pt(22)
    run_main.font.bold = True
    run_main.font.color.rgb = RGBColor(0x0b, 0x0f, 0x17)

    p_sub = doc.add_paragraph()
    run_sub = p_sub.add_run(
        "Interplanetary Survival Guide: Peta Navigasi Taktis & Analisis Ilmiah Mars\n"
        "Dokumentasi Langkah-demi-Langkah Penggunaan Seluruh Fitur beserta Tangkapan Layar Beranotasi Kotak Merah"
    )
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(11)
    run_sub.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Metadata Table
    table_meta = doc.add_table(rows=5, cols=2)
    table_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_meta.autofit = False

    meta_data = [
        ("Acara & Misi", "NASA Space Apps Challenge 2026 // MarsForAll GALE-01"),
        ("Target Operasional", "Mount Sharp (Aeolis Mons), Kawah Gale, Mars (Lat: -5.4453°, Lon: 137.8414°)"),
        ("Fokus Ilmiah", "Penemuan Urat Mineral Boxwork 2025, 5 Lapisan Operasional NASA, & Rute Marswalk"),
        ("Standar Desain & Data", "100% Flat Matte, Zero Gradients, Zero Emojis, Unit Satuan SI & Planetologi"),
        ("Sumber Data Ilmiah", "USGS Astrogeology, NASA AMMOS MMGIS, JPL Mars Trek, NASA Worldview, Raw Image Archive")
    ]

    for idx, (label, val) in enumerate(meta_data):
        row = table_meta.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        set_cell_background(c0, "111827")
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

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Executive Overview
    h_ov = doc.add_heading("RINGKASAN EKSEKUTIF ALUR PENGGUNA", level=1)
    h_ov.runs[0].font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

    p_ov = doc.add_paragraph(
        "Dokumen ini memandu seluruh rangkaian perjalanan pengguna (user flow) platform MARSFORALL // GALE-01 "
        "dari awal mengakses website hingga tahap penyelesaian evaluasi lapangan dan ekspor rencana misi. "
        "Setiap tahapan dilengkapi penjelasan fungsi halaman, informasi data geofisika yang disajikan, "
        "tindakan spesifik pengguna (tombol yang diklik), serta tangkapan layar beranotasi kotak merah "
        "yang menandai secara presisi elemen antarmuka yang dimaksud."
    )
    p_ov.runs[0].font.size = Pt(10.5)

    doc.add_page_break()

    # Iterate Steps
    for idx, step in enumerate(STEPS, start=1):
        h_step = doc.add_heading(f"{step['title']}", level=1)
        h_step.runs[0].font.name = "Arial"
        h_step.runs[0].font.size = Pt(15)
        h_step.runs[0].font.bold = True
        h_step.runs[0].font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)
        h_step.paragraph_format.space_before = Pt(12)
        h_step.paragraph_format.space_after = Pt(6)

        tbl_info = doc.add_table(rows=3, cols=2)
        tbl_info.alignment = WD_TABLE_ALIGNMENT.CENTER
        info_rows = [
            ("Lokasi Halaman / URL", step["page"]),
            ("Aksi Pengguna (Kotak Merah)", step["action"]),
            ("Dampak Operasional", step["impact"])
        ]
        for r_i, (lbl, val) in enumerate(info_rows):
            c0, c1 = tbl_info.rows[r_i].cells[0], tbl_info.rows[r_i].cells[1]
            c0.width = Inches(2.2)
            c1.width = Inches(4.3)
            set_cell_background(c0, "f8fafc")
            set_cell_background(c1, "ffffff")
            set_cell_margins(c0, 60, 60, 100, 100)
            set_cell_margins(c1, 60, 60, 100, 100)

            p0 = c0.paragraphs[0]
            r0 = p0.add_run(lbl)
            r0.font.name = "Consolas"
            r0.font.size = Pt(9)
            r0.font.bold = True
            r0.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

            p1 = c1.paragraphs[0]
            r1 = p1.add_run(val)
            r1.font.name = "Arial"
            r1.font.size = Pt(9.5)
            r1.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

        p_desc = doc.add_paragraph()
        p_desc.paragraph_format.space_before = Pt(8)
        p_desc.paragraph_format.space_after = Pt(8)
        run_desc_lbl = p_desc.add_run("Fungsi & Informasi yang Tersedia:\n")
        run_desc_lbl.font.name = "Arial"
        run_desc_lbl.font.size = Pt(10)
        run_desc_lbl.font.bold = True
        run_desc_lbl.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

        run_desc = p_desc.add_run(step["desc"])
        run_desc.font.name = "Arial"
        run_desc.font.size = Pt(10)
        run_desc.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

        img_path = os.path.join(SCREENSHOTS_DIR, step["file"])
        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(4)
            p_img.paragraph_format.space_after = Pt(2)
            run_img = p_img.add_run()
            run_img.add_picture(img_path, width=Inches(6.2))

            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_after = Pt(16)
            run_cap = p_cap.add_run(f"Gambar {idx}: Tangkapan Layar Beranotasi Kotak Merah — {step['title']}")
            run_cap.font.name = "Consolas"
            run_cap.font.size = Pt(8.5)
            run_cap.font.italic = True
            run_cap.font.color.rgb = RGBColor(0x64, 0x74, 0x8b)
        else:
            p_warn = doc.add_paragraph(f"[Screenshot {step['file']} sedang dimuat]")
            p_warn.runs[0].font.color.rgb = RGBColor(0xef, 0x44, 0x44)

        if idx < len(STEPS):
            doc.add_page_break()

    # Checklist Kesiapan
    h_close = doc.add_heading("CHECKLIST KESIAPAN OPERASIONAL MISI", level=1)
    h_close.runs[0].font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

    p_check = doc.add_paragraph(
        "Sebelum kru astronaut keluar dari airlock Habitat Alpha menuju medan permukaan Kawah Gale, "
        "pastikan protokol keselamatan berikut telah terverifikasi melalui platform:"
    )
    p_check.runs[0].font.size = Pt(10)

    checklist_items = [
        ("Layer 2 DEM Kelerengan", "Seluruh segmen rute berada di bawah batas kritis <15° [SAFE]."),
        ("Layer 3 Detektor Pasir", "Koridor lintasan memiliki inersia termal ≥350 tiu berstatus [BEDROCK FIRM]."),
        ("Layer 5 Perisai Radiasi", "Rute melintasi zona anomali magnetik kerak alami MGS MAG ≥40 nT."),
        ("Keseimbangan O2 & Baterai", "Margin cadangan oksigen kepulangan terverifikasi ≥20% pada simulasi A*."),
        ("Orientasi Visual 360°", "Tanda medan (landmarks) Mount Sharp telah dipelajari via Surface 360° Cylindrical Viewer."),
        ("Ekspor Berkas GeoJSON", "Paket data navigasi telah diunduh dan tersinkronisasi dengan komputer rover Mule.")
    ]

    for item, detail in checklist_items:
        p_item = doc.add_paragraph(style="List Bullet")
        r_item_title = p_item.add_run(f"[{item}]: ")
        r_item_title.font.name = "Consolas"
        r_item_title.font.size = Pt(9.5)
        r_item_title.font.bold = True
        r_item_title.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

        r_item_desc = p_item.add_run(detail)
        r_item_desc.font.name = "Arial"
        r_item_desc.font.size = Pt(9.5)
        r_item_desc.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    doc.save(DOCX_PATH)
    print(f"\nSUCCESS: Document successfully created at:\n{DOCX_PATH}")

def main():
    print("=== Step 1: Capturing Screenshots via Single Chrome CDP Instance ===")
    asyncio.run(capture_all_cdp())

    print("\n=== Step 2: Annotating Screenshots with Precision Red Boxes ===")
    for step in STEPS:
        img_file = os.path.join(SCREENSHOTS_DIR, step["file"])
        annotate_image(img_file, step["boxes"])

    print("\n=== Step 3: Compiling Microsoft Word Document ===")
    create_word_document()

if __name__ == "__main__":
    main()
