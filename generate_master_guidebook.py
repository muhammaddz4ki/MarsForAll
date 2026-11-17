import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "screenshots_flow")
DOCX_PATH = os.path.join(BASE_DIR, "PANDUAN_USER_FLOW_DAN_PENGGUNAAN_MARSFORALL.docx")

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    for child in list(tcPr):
        if child.tag.endswith('shd'):
            tcPr.remove(child)
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=70, bottom=70, left=100, right=100):
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

from generate_full_data import ALL_CHAPTERS, MASTER_FORMULAS, PLANETARY_CONSTANTS

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
    run_badge = p_title.add_run("MARSFORALL // GALE-01 // NASA SPACE APPS CHALLENGE 2026\n")
    run_badge.font.name = "Consolas"
    run_badge.font.size = Pt(11)
    run_badge.font.bold = True
    run_badge.font.color.rgb = RGBColor(0xd9, 0x77, 0x06)

    run_main = p_title.add_run("BUKU PANDUAN OPERASIONAL LAPANGAN & ENSIKLOPEDIA TEKNIS\n(ASTRONAUT & MISSION CONTROL FIELD GUIDE)")
    run_main.font.name = "Arial"
    run_main.font.size = Pt(20)
    run_main.font.bold = True
    run_main.font.color.rgb = RGBColor(0x0b, 0x0f, 0x17)

    p_sub = doc.add_paragraph()
    run_sub = p_sub.add_run(
        "Interplanetary Survival Guide: Peta Navigasi Taktis, Lapisan Ilmiah NASA, & Forensik Permukaan Mars\n"
        "Panduan Terpadu: Tangkapan Layar Berkotak Merah, Rincian Telemetri Lengkap, Landasan Teori Ilmiah, & Persamaan Matematika Geofisika"
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
        ("Standar Desain & Data", "100% Flat Matte, Zero Gradients, Zero Emojis, Satuan SI & Planetologi Lengkap"),
        ("Sumber Data Geofisika", "USGS Astrogeology, NASA AMMOS MMGIS, JPL Mars Trek, NASA Worldview, PDS Geosciences"),
        ("Klasifikasi Dokumen", "PANDUAN OPERASIONAL & ENSIKLOPEDIA FORMULA RESMI (OPERATIONAL & SCIENTIFIC MANUAL)")
    ]

    for idx, (label, val) in enumerate(meta_data):
        row = table_meta.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.7)
        set_cell_background(c0, "0b0f17")
        set_cell_background(c1, "1e293b")
        set_cell_margins(c0, 50, 50, 80, 80)
        set_cell_margins(c1, 50, 50, 80, 80)

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
    h_ov = doc.add_heading("RINGKASAN EKSEKUTIF & ARSITEKTUR PLATFORM", level=1)
    h_ov.runs[0].font.name = "Arial"
    h_ov.runs[0].font.size = Pt(14)
    h_ov.runs[0].font.bold = True
    h_ov.runs[0].font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

    p_ov = doc.add_paragraph(
        "Buku Panduan Operasional ini disusun sebagai acuan teknis lengkap bagi astronaut penjelajah permukaan Mars "
        "dan pengendali misi di stasiun habitat. Platform MARSFORALL // GALE-01 menjembatani data mentah ilmiah satelit NASA "
        "(HiRISE, CTX, MOLA, THEMIS, CRISM, MGS MAG, MSL RAD) menjadi antarmuka taktis deterministik yang andal di medan ekstrem. "
        "Dokumen ini mengupas secara komprehensif 12 bab alur fitur, di mana setiap bab diperkaya dengan tangkapan layar berkotak merah, "
        "tabel rincian telemetri dan kegunaan operasional, landasan teori ilmiah, formulasi matematika dan persamaan fisika lengkap, "
        "Standar Operasional Prosedur (SOP) operator, serta protokol mitigasi risiko misi. "
        "Pada bagian akhir, dokumen ini menyajikan Checklist Kesiapan Pra-EVA (Bab 13) dan Ensiklopedia Matematika & Fisika Planetologi (Bab 14)."
    )
    p_ov.runs[0].font.name = "Arial"
    p_ov.runs[0].font.size = Pt(10)
    p_ov.runs[0].font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    doc.add_page_break()

    # Iterate Chapters
    for idx, step in enumerate(ALL_CHAPTERS, start=1):
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
            set_cell_margins(c0, 40, 40, 80, 80)
            set_cell_margins(c1, 40, 40, 80, 80)

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

        # Telemetry Information Table
        p_tbl_heading = doc.add_paragraph()
        p_tbl_heading.paragraph_format.space_before = Pt(6)
        p_tbl_heading.paragraph_format.space_after = Pt(4)
        r_tbl_h = p_tbl_heading.add_run("TABEL RINCIAN INFORMASI TELEMETRI & KEGUNAAN OPERASIONAL")
        r_tbl_h.font.name = "Arial"
        r_tbl_h.font.size = Pt(10)
        r_tbl_h.font.bold = True
        r_tbl_h.font.color.rgb = RGBColor(0x0b, 0x0f, 0x17)

        info_items = step.get("info_items", [])
        tbl_telemetry = doc.add_table(rows=len(info_items) + 1, cols=4)
        tbl_telemetry.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl_telemetry.autofit = False
        set_table_borders(tbl_telemetry, color="cbd5e1", sz="4")

        headers = ["No", "Elemen / Parameter Informasi", "Makna & Definisi Ilmiah Data", "Fungsi & Kegunaan Operasional bagi Misi"]
        col_widths = [Inches(0.4), Inches(2.0), Inches(2.2), Inches(2.3)]

        hdr_row = tbl_telemetry.rows[0]
        for c_idx, h_text in enumerate(headers):
            cell = hdr_row.cells[c_idx]
            cell.width = col_widths[c_idx]
            set_cell_background(cell, "0b0f17")
            set_cell_margins(cell, 50, 50, 80, 80)
            p = cell.paragraphs[0]
            if c_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(h_text)
            r.font.name = "Consolas"
            r.font.size = Pt(8.5)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0xff, 0xff, 0xff)

        for item_idx, (param, meaning, utility) in enumerate(info_items, start=1):
            row = tbl_telemetry.rows[item_idx]
            row_bg = "f8fafc" if item_idx % 2 == 1 else "ffffff"

            c0 = row.cells[0]
            c0.width = col_widths[0]
            set_cell_background(c0, row_bg)
            set_cell_margins(c0, 40, 40, 60, 60)
            p0 = c0.paragraphs[0]
            p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r0 = p0.add_run(str(item_idx))
            r0.font.name = "Consolas"
            r0.font.size = Pt(8.5)
            r0.font.bold = True
            r0.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

            c1 = row.cells[1]
            c1.width = col_widths[1]
            set_cell_background(c1, row_bg)
            set_cell_margins(c1, 40, 40, 80, 80)
            p1 = c1.paragraphs[0]
            r1 = p1.add_run(param)
            r1.font.name = "Consolas"
            r1.font.size = Pt(8.5)
            r1.font.bold = True
            r1.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

            c2 = row.cells[2]
            c2.width = col_widths[2]
            set_cell_background(c2, row_bg)
            set_cell_margins(c2, 40, 40, 80, 80)
            p2 = c2.paragraphs[0]
            r2 = p2.add_run(meaning)
            r2.font.name = "Arial"
            r2.font.size = Pt(8.5)
            r2.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

            c3 = row.cells[3]
            c3.width = col_widths[3]
            set_cell_background(c3, row_bg)
            set_cell_margins(c3, 40, 40, 80, 80)
            p3 = c3.paragraphs[0]
            r3 = p3.add_run(utility)
            r3.font.name = "Arial"
            r3.font.size = Pt(8.5)
            r3.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

        # Mathematical Formulas & Scientific Theories Section
        formulas = step.get("formulas", [])
        if formulas:
            p_form_h = doc.add_paragraph()
            p_form_h.paragraph_format.space_before = Pt(8)
            p_form_h.paragraph_format.space_after = Pt(4)
            r_form_h = p_form_h.add_run("LANDASAN TEORI ILMIAH, FORMULASI MATEMATIKA, & PERSAMAAN FISIKA")
            r_form_h.font.name = "Arial"
            r_form_h.font.size = Pt(10)
            r_form_h.font.bold = True
            r_form_h.font.color.rgb = RGBColor(0xd9, 0x77, 0x06)

            for f_idx, formula in enumerate(formulas, start=1):
                tbl_f = doc.add_table(rows=1, cols=1)
                tbl_f.alignment = WD_TABLE_ALIGNMENT.CENTER
                tbl_f.autofit = False
                c_f = tbl_f.rows[0].cells[0]
                c_f.width = Inches(6.9)
                set_cell_background(c_f, "0b0f17")
                set_cell_margins(c_f, 60, 60, 100, 100)
                set_table_borders(tbl_f, color="d97706", sz="6")

                p_f_body = c_f.paragraphs[0]
                r_f_title = p_f_body.add_run(f"Persamaan {idx}.{f_idx}: {formula['title']}\n")
                r_f_title.font.name = "Consolas"
                r_f_title.font.size = Pt(9.5)
                r_f_title.font.bold = True
                r_f_title.font.color.rgb = RGBColor(0xfb, 0xbf, 0x24)

                r_f_cite = p_f_body.add_run(f"Referensi / Sitasi Ilmiah: {formula['citation']}\n\n")
                r_f_cite.font.name = "Arial"
                r_f_cite.font.size = Pt(8)
                r_f_cite.font.italic = True
                r_f_cite.font.color.rgb = RGBColor(0x94, 0xa3, 0xb8)

                r_f_eq = p_f_body.add_run(f"{formula['eq_text']}\n")
                r_f_eq.font.name = "Consolas"
                r_f_eq.font.size = Pt(9.5)
                r_f_eq.font.bold = True
                r_f_eq.font.color.rgb = RGBColor(0x38, 0xbd, 0xf8)

                # Variable Breakdown Table
                var_items = formula.get("variables", [])
                if var_items:
                    tbl_var = doc.add_table(rows=len(var_items) + 1, cols=3)
                    tbl_var.alignment = WD_TABLE_ALIGNMENT.CENTER
                    tbl_var.autofit = False
                    set_table_borders(tbl_var, color="cbd5e1", sz="2")

                    var_headers = ["Variabel / Simbol", "Definisi Fisis Parameter", "Satuan SI / Planetologi"]
                    var_widths = [Inches(1.5), Inches(3.4), Inches(2.0)]

                    v_hdr = tbl_var.rows[0]
                    for vc_i, vh_t in enumerate(var_headers):
                        c = v_hdr.cells[vc_i]
                        c.width = var_widths[vc_i]
                        set_cell_background(c, "1e293b")
                        set_cell_margins(c, 30, 30, 60, 60)
                        p = c.paragraphs[0]
                        r = p.add_run(vh_t)
                        r.font.name = "Consolas"
                        r.font.size = Pt(8)
                        r.font.bold = True
                        r.font.color.rgb = RGBColor(0xf1, 0xf5, 0xf9)

                    for v_idx, (v_sym, v_def, v_unit) in enumerate(var_items, start=1):
                        v_row = tbl_var.rows[v_idx]
                        v_bg = "f8fafc" if v_idx % 2 == 1 else "ffffff"
                        for col_i, text_val in enumerate([v_sym, v_def, v_unit]):
                            cell = v_row.cells[col_i]
                            cell.width = var_widths[col_i]
                            set_cell_background(cell, v_bg)
                            set_cell_margins(cell, 30, 30, 60, 60)
                            p = cell.paragraphs[0]
                            r = p.add_run(text_val)
                            r.font.name = "Consolas" if col_i != 1 else "Arial"
                            r.font.size = Pt(8)
                            r.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

                # Physical Interpretation
                p_interp = doc.add_paragraph()
                p_interp.paragraph_format.space_before = Pt(4)
                p_interp.paragraph_format.space_after = Pt(6)
                r_int_lbl = p_interp.add_run("Makna Fisis & Peran Operasional bagi Kru: ")
                r_int_lbl.font.name = "Arial"
                r_int_lbl.font.size = Pt(9)
                r_int_lbl.font.bold = True
                r_int_lbl.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

                r_int_val = p_interp.add_run(formula["physical_interpretation"])
                r_int_val.font.name = "Arial"
                r_int_val.font.size = Pt(9)
                r_int_val.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

        # SOP Action Steps
        p_sop_h = doc.add_paragraph()
        p_sop_h.paragraph_format.space_before = Pt(6)
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

        # Safety Callout
        safety_note = step.get("safety_note", "")
        if safety_note:
            tbl_safety = doc.add_table(rows=1, cols=1)
            tbl_safety.alignment = WD_TABLE_ALIGNMENT.CENTER
            tbl_safety.autofit = False
            cell_safe = tbl_safety.rows[0].cells[0]
            cell_safe.width = Inches(6.9)
            set_cell_background(cell_safe, "111827")
            set_cell_margins(cell_safe, 50, 50, 80, 80)
            set_table_borders(tbl_safety, color="e11d48", sz="8")

            p_safe = cell_safe.paragraphs[0]
            r_safe = p_safe.add_run(safety_note)
            r_safe.font.name = "Consolas"
            r_safe.font.size = Pt(8.5)
            r_safe.font.bold = True
            r_safe.font.color.rgb = RGBColor(0xfb, 0xbf, 0x24)

        if idx < len(ALL_CHAPTERS):
            doc.add_page_break()

    # Final Chapter 13: Checklist Kesiapan Operasional Misi
    doc.add_page_break()
    h_c13 = doc.add_heading("BAB 13: CHECKLIST KESIAPAN OPERASIONAL MISI & INTEGRASI 5 LAPISAN NASA", level=1)
    h_c13.runs[0].font.name = "Arial"
    h_c13.runs[0].font.size = Pt(14)
    h_c13.runs[0].font.bold = True
    h_c13.runs[0].font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

    p_c13 = doc.add_paragraph(
        "Sebelum kru astronaut keluar dari airlock Habitat Alpha menuju medan permukaan Kawah Gale, "
        "seluruh parameter keselamatan berikut wajib diverifikasi melalui platform MARSFORALL // GALE-01 "
        "dan disahkan oleh Komandan Misi Lapangan:"
    )
    p_c13.runs[0].font.name = "Arial"
    p_c13.runs[0].font.size = Pt(10)
    p_c13.runs[0].font.color.rgb = RGBColor(0x33, 0x41, 0x55)

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

    # Master Chapter 14: Comprehensive Encyclopedia of Mathematical & Physical Formulations
    doc.add_page_break()
    h_c14 = doc.add_heading("BAB 14: ENSIKLOPEDIA MATEMATIKA, FISIKA, & MODEL KOMPUTASI GEOFISIKA GALE-01", level=1)
    h_c14.runs[0].font.name = "Arial"
    h_c14.runs[0].font.size = Pt(14)
    h_c14.runs[0].font.bold = True
    h_c14.runs[0].font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

    p_c14 = doc.add_paragraph(
        "Bab penutup ini mengonsolidasikan seluruh himpunan persamaan matematika, model geofisika, dan konstanta planet "
        "yang menjadi fondasi komputasi deterministik platform MARSFORALL // GALE-01. Seluruh formulasi disarikan dari "
        "literatur ilmiah teruji NASA dan diimplementasikan secara langsung di dalam kode sumber aplikasi."
    )
    p_c14.runs[0].font.name = "Arial"
    p_c14.runs[0].font.size = Pt(10)
    p_c14.runs[0].font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    # Planetary Constants Table
    p_const_h = doc.add_paragraph()
    p_const_h.paragraph_format.space_before = Pt(8)
    p_const_h.paragraph_format.space_after = Pt(4)
    r_c_h = p_const_h.add_run("TABEL 14.1: KONSTANTA FISIKA & PLANETOLOGI MARS TERKALIBRASI (GALE CRATER)")
    r_c_h.font.name = "Arial"
    r_c_h.font.size = Pt(10)
    r_c_h.font.bold = True
    r_c_h.font.color.rgb = RGBColor(0x0b, 0x0f, 0x17)

    tbl_const = doc.add_table(rows=len(PLANETARY_CONSTANTS) + 1, cols=4)
    tbl_const.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_const.autofit = False
    set_table_borders(tbl_const, color="cbd5e1", sz="4")

    c_headers = ["Parameter Fisika", "Simbol", "Nilai Numerik Terverifikasi", "Satuan SI / Planetologi"]
    c_widths = [Inches(2.2), Inches(1.0), Inches(2.2), Inches(1.5)]

    ch_row = tbl_const.rows[0]
    for c_i, c_text in enumerate(c_headers):
        cell = ch_row.cells[c_i]
        cell.width = c_widths[c_i]
        set_cell_background(cell, "0b0f17")
        set_cell_margins(cell, 40, 40, 60, 60)
        p = cell.paragraphs[0]
        r = p.add_run(c_text)
        r.font.name = "Consolas"
        r.font.size = Pt(8.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xff, 0xff, 0xff)

    for p_idx, (p_name, p_sym, p_val, p_unit) in enumerate(PLANETARY_CONSTANTS, start=1):
        row = tbl_const.rows[p_idx]
        r_bg = "f8fafc" if p_idx % 2 == 1 else "ffffff"
        for col_i, text_val in enumerate([p_name, p_sym, p_val, p_unit]):
            cell = row.cells[col_i]
            cell.width = c_widths[col_i]
            set_cell_background(cell, r_bg)
            set_cell_margins(cell, 35, 35, 60, 60)
            p = cell.paragraphs[0]
            r = p.add_run(text_val)
            r.font.name = "Consolas" if col_i in [1, 2] else "Arial"
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

    # Master Formulas Table
    p_mf_h = doc.add_paragraph()
    p_mf_h.paragraph_format.space_before = Pt(12)
    p_mf_h.paragraph_format.space_after = Pt(4)
    r_mf_h = p_mf_h.add_run("TABEL 14.2: MATRIKS 15 FORMULASI UTAMA KOMPUTASI DETERMINISTIK PLATFORM")
    r_mf_h.font.name = "Arial"
    r_mf_h.font.size = Pt(10)
    r_mf_h.font.bold = True
    r_mf_h.font.color.rgb = RGBColor(0x0b, 0x0f, 0x17)

    tbl_mf = doc.add_table(rows=len(MASTER_FORMULAS) + 1, cols=4)
    tbl_mf.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_mf.autofit = False
    set_table_borders(tbl_mf, color="cbd5e1", sz="4")

    mf_headers = ["No", "Nama Model / Modul Komputasi", "Persamaan Matematika Inti", "Peran Operasional Misi"]
    mf_widths = [Inches(0.4), Inches(2.0), Inches(2.3), Inches(2.2)]

    mfh_row = tbl_mf.rows[0]
    for c_i, c_text in enumerate(mf_headers):
        cell = mfh_row.cells[c_i]
        cell.width = mf_widths[c_i]
        set_cell_background(cell, "0b0f17")
        set_cell_margins(cell, 40, 40, 60, 60)
        p = cell.paragraphs[0]
        if c_i == 0:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(c_text)
        r.font.name = "Consolas"
        r.font.size = Pt(8.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xff, 0xff, 0xff)

    for m_idx, (m_name, m_eq, m_role) in enumerate(MASTER_FORMULAS, start=1):
        row = tbl_mf.rows[m_idx]
        r_bg = "f8fafc" if m_idx % 2 == 1 else "ffffff"

        c0 = row.cells[0]
        c0.width = mf_widths[0]
        set_cell_background(c0, r_bg)
        set_cell_margins(c0, 35, 35, 40, 40)
        p0 = c0.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r0 = p0.add_run(str(m_idx))
        r0.font.name = "Consolas"
        r0.font.size = Pt(8.5)
        r0.font.bold = True

        c1 = row.cells[1]
        c1.width = mf_widths[1]
        set_cell_background(c1, r_bg)
        set_cell_margins(c1, 35, 35, 60, 60)
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(m_name)
        r1.font.name = "Consolas"
        r1.font.size = Pt(8.5)
        r1.font.bold = True
        r1.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

        c2 = row.cells[2]
        c2.width = mf_widths[2]
        set_cell_background(c2, r_bg)
        set_cell_margins(c2, 35, 35, 60, 60)
        p2 = c2.paragraphs[0]
        r2 = p2.add_run(m_eq)
        r2.font.name = "Consolas"
        r2.font.size = Pt(8)
        r2.font.bold = True
        r2.font.color.rgb = RGBColor(0xd9, 0x77, 0x06)

        c3 = row.cells[3]
        c3.width = mf_widths[3]
        set_cell_background(c3, r_bg)
        set_cell_margins(c3, 35, 35, 60, 60)
        p3 = c3.paragraphs[0]
        r3 = p3.add_run(m_role)
        r3.font.name = "Arial"
        r3.font.size = Pt(8.5)
        r3.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    try:
        doc.save(DOCX_PATH)
        print(f"\nSUCCESS: Master Guidebook with Mathematical Encyclopedia successfully saved at:\n{DOCX_PATH}")
    except PermissionError:
        fallback_path = os.path.join(BASE_DIR, "PANDUAN_USER_FLOW_DAN_PENGGUNAAN_MARSFORALL_BARU.docx")
        doc.save(fallback_path)
        print(f"\nWARNING: {DOCX_PATH} is locked. Saved as fallback at:\n{fallback_path}")

if __name__ == "__main__":
    create_word_document()
