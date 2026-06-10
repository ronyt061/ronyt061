#!/usr/bin/env python3
"""Generate the NeoTokyo AI/ML Server proposal for Chinmaya College."""

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
    TableStyle, HRFlowable, PageBreak, NextPageTemplate, KeepTogether,
)

OUT = "Chinmaya_College_AI-ML_Server_Proposal.pdf"

# ---- Brand palette -------------------------------------------------------
INK = colors.HexColor("#0B1F3A")      # deep navy
ACCENT = colors.HexColor("#E6007E")   # neon magenta (NeoTokyo vibe)
STEEL = colors.HexColor("#3A4A63")
LIGHT = colors.HexColor("#F2F4F8")
LINE = colors.HexColor("#C9D2E0")
MUTED = colors.HexColor("#5B6B82")

# ---- Static content ------------------------------------------------------
VENDOR = {
    "name": "NeoTokyo",
    "addr": "2nd Floor, Koroth Arcade, Opposite V-Guard Industries,\n"
            "Vennala High School, Vennala, Kochi, Ernakulam, Kerala – 682028",
    "email": "accounts@neotokyo.in",
    "web": "www.neotokyo.in",
    "gstin": "32AASFN1853C1ZF",
    "pan": "AASFN1853C",
}

CLIENT = {
    "name": "Chinmaya Vishwa Vidyapeeth (Chinmaya College) – IEDC",
    "addr": "Anthiyal–Onakkoor Road, Ernakulam, Kerala – 686667",
    "mobile": "+91 70349 61505",
    "pos": "Kerala",
}

PROPOSAL = {
    "no": "NT-PROP-7734",
    "date": "10 June 2026",
    "valid": "10 July 2026",
    "ref_quote": "7733",
}

# Bill of materials: (component, specification)
BOM = [
    ("Processor (CPU)", "AMD EPYC 9124 — 16 Core / 32 Thread, 3.0 GHz base, Socket SP5"),
    ("Server Motherboard", "ASUS K14PA-U12 with ASMB11 (Socket SP5) remote management"),
    ("CPU Cooling", "Enterprise-grade TR5/SP6 closed-loop liquid cooler"),
    ("Memory (RAM)", "Samsung 128 GB DDR5-4800 MT/s RDIMM ECC, dual-channel"),
    ("OS / Boot SSD", "Kioxia Exceria Plus G3 1 TB PCIe Gen4 NVMe M.2"),
    ("Scratch / Dataset SSD", "Kioxia Exceria Plus G3 2 TB PCIe Gen4 M.2 2280 (RAID 0)"),
    ("Bulk Storage HDD", "8 TB Enterprise 3.5\" SATA, 7200 RPM, 512e, 256 MB cache"),
    ("GPU Accelerator", "NVIDIA RTX PRO 5000 — 48 GB GDDR7, 512-bit memory bus"),
    ("Power Supply", "Super Flower Leadex Titanium 1600W ATX 3.1, fully modular"),
    ("Chassis Cooling", "Noctua NF-F12 iPPC-2000 IP67 PWM 120 mm fan"),
    ("Server Chassis", "SilverStone RM44 — 4U rackmount server chassis"),
    ("Software Stack", "Ubuntu Server + Python, TensorFlow, PyTorch, JupyterHub, Docker"),
]

# Pricing (mirrors source quotation 7733)
TAXABLE = 1352934.75
CGST = 121764.13
SGST = 121764.13
TOTAL = 1596463.00
AMOUNT_WORDS = ("Fifteen Lakh Ninety-Six Thousand Four Hundred Sixty-Three "
                "Rupees Only")


def inr(x):
    s = f"{x:,.2f}"
    # Convert to Indian numbering grouping
    whole, dec = s.replace(",", "").split(".")
    neg = whole.startswith("-")
    whole = whole.lstrip("-")
    if len(whole) > 3:
        last3 = whole[-3:]
        rest = whole[:-3]
        parts = []
        while len(rest) > 2:
            parts.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            parts.insert(0, rest)
        grouped = ",".join(parts) + "," + last3
    else:
        grouped = whole
    return ("-" if neg else "") + "Rs. " + grouped + "." + dec


# ---- Styles --------------------------------------------------------------
ss = getSampleStyleSheet()


def S(name, **kw):
    base = kw.pop("parent", ss["Normal"])
    return ParagraphStyle(name, parent=base, **kw)


title_style = S("Title", fontName="Helvetica-Bold", fontSize=30, textColor=INK,
                leading=34)
subtitle_style = S("Sub", fontName="Helvetica", fontSize=13, textColor=ACCENT,
                   leading=18, spaceBefore=4)
h2 = S("H2", fontName="Helvetica-Bold", fontSize=14, textColor=INK,
       spaceBefore=14, spaceAfter=6, leading=18)
body = S("Body", fontName="Helvetica", fontSize=10, textColor=STEEL,
         leading=15, alignment=TA_JUSTIFY)
small = S("Small", fontName="Helvetica", fontSize=8.5, textColor=MUTED, leading=12)
cell = S("Cell", fontName="Helvetica", fontSize=9, textColor=STEEL, leading=12)
cell_b = S("CellB", fontName="Helvetica-Bold", fontSize=9, textColor=INK, leading=12)
white_b = S("WhiteB", fontName="Helvetica-Bold", fontSize=9.5, textColor=colors.white,
            leading=12)


# ---- Page furniture ------------------------------------------------------
def cover_bg(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(INK)
    canvas.rect(0, h - 120 * mm, w, 120 * mm, fill=1, stroke=0)
    canvas.setFillColor(ACCENT)
    canvas.rect(0, h - 122 * mm, w, 2 * mm, fill=1, stroke=0)
    # Wordmark
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 22)
    canvas.drawString(20 * mm, h - 28 * mm, "Neo")
    tw = canvas.stringWidth("Neo", "Helvetica-Bold", 22)
    canvas.setFillColor(ACCENT)
    canvas.drawString(20 * mm + tw, h - 28 * mm, "Tokyo")
    canvas.setFillColor(colors.HexColor("#9FB0C9"))
    canvas.setFont("Helvetica", 8.5)
    canvas.drawString(20 * mm, h - 33 * mm, "High-Performance Computing  •  Workstations  •  AI Infrastructure")
    # footer
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(20 * mm, 12 * mm, f"{VENDOR['web']}   |   {VENDOR['email']}   |   GSTIN {VENDOR['gstin']}")
    canvas.restoreState()


def content_bg(canvas, doc):
    canvas.saveState()
    w, h = A4
    # header band
    canvas.setFillColor(INK)
    canvas.rect(0, h - 18 * mm, w, 18 * mm, fill=1, stroke=0)
    canvas.setFillColor(ACCENT)
    canvas.rect(0, h - 18.8 * mm, w, 0.8 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 11)
    canvas.drawString(20 * mm, h - 12 * mm, "NeoTokyo")
    canvas.setFillColor(colors.HexColor("#9FB0C9"))
    canvas.setFont("Helvetica", 8.5)
    canvas.drawRightString(w - 20 * mm, h - 12 * mm,
                           f"AI/ML Server Proposal  •  {PROPOSAL['no']}")
    # footer
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(20 * mm, 14 * mm, w - 20 * mm, 14 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(20 * mm, 9 * mm, "NeoTokyo — Kochi, Kerala")
    canvas.drawRightString(w - 20 * mm, 9 * mm, f"Page {doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(OUT, pagesize=A4,
                      leftMargin=20 * mm, rightMargin=20 * mm,
                      topMargin=24 * mm, bottomMargin=20 * mm,
                      title="AI/ML Server Proposal — Chinmaya College",
                      author="NeoTokyo")

w, h = A4
cover_frame = Frame(20 * mm, 20 * mm, w - 40 * mm, h - 135 * mm, id="cover")
content_frame = Frame(20 * mm, 18 * mm, w - 40 * mm, h - 42 * mm, id="content")
doc.addPageTemplates([
    PageTemplate(id="cover", frames=[cover_frame], onPage=cover_bg),
    PageTemplate(id="content", frames=[content_frame], onPage=content_bg),
])

story = []

# ---------- COVER ----------
story.append(Spacer(1, 6 * mm))
story.append(Paragraph("Technical & Commercial Proposal", subtitle_style))
story.append(Paragraph("AI / ML Compute Server", title_style))
story.append(Spacer(1, 4 * mm))
story.append(HRFlowable(width="30%", thickness=2, color=ACCENT, spaceAfter=10))

meta = [
    ["Prepared for", CLIENT["name"]],
    ["Attention", "IEDC — Innovation & Entrepreneurship Development Cell"],
    ["Proposal No.", PROPOSAL["no"]],
    ["Date", PROPOSAL["date"]],
    ["Valid Until", PROPOSAL["valid"]],
    ["Prepared by", "NeoTokyo, Kochi"],
]
mt = Table([[Paragraph(k, S("k", fontName="Helvetica-Bold", fontSize=9.5, textColor=INK)),
             Paragraph(v, S("v", fontName="Helvetica", fontSize=9.5, textColor=STEEL))]
            for k, v in meta], colWidths=[38 * mm, None])
mt.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ("LINEBELOW", (0, 0), (-1, -2), 0.4, LINE),
]))
story.append(mt)
story.append(Spacer(1, 10 * mm))
story.append(Paragraph(
    "This proposal presents a turnkey, rack-mountable AI/ML training and "
    "inference server purpose-built for the Chinmaya College IEDC. It "
    "supersedes reference quotation No. " + PROPOSAL["ref_quote"] + " and "
    "details the recommended configuration, rationale, commercials and "
    "terms of supply.", body))

story.append(NextPageTemplate("content"))
story.append(PageBreak())

# ---------- 1. COVER LETTER ----------
story.append(Paragraph("1.  Introduction", h2))
story.append(Paragraph(
    "Dear Sir/Madam,", body))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "Thank you for the opportunity to support the Innovation & "
    "Entrepreneurship Development Cell (IEDC) at Chinmaya College in "
    "building its in-house AI and Machine Learning capability. As the "
    "IEDC scales up student research, hackathons and incubated startups, "
    "a dedicated GPU server removes the recurring cost and data-governance "
    "concerns of public cloud rentals while giving your teams full control "
    "over model training, fine-tuning and deployment.", body))
story.append(Paragraph(
    "The configuration below pairs a 16-core AMD EPYC server platform with "
    "a 48 GB NVIDIA RTX PRO 5000 accelerator and ECC memory on a fully "
    "managed Ubuntu + PyTorch/TensorFlow software stack — delivered ready "
    "to run from day one, backed by a 3-year warranty.", body))

# ---------- 2. WHY THIS BUILD ----------
story.append(Paragraph("2.  Why This Configuration", h2))
why = [
    ("48 GB GPU memory", "The RTX PRO 5000 (48 GB GDDR7) holds large vision and "
     "language models in memory, enabling fine-tuning and batch training that "
     "consumer 8–24 GB cards cannot fit."),
    ("ECC server memory", "128 GB DDR5 ECC RDIMM protects long training runs "
     "from silent data corruption — essential for reproducible research."),
    ("Tiered storage", "Gen4 NVMe for OS, a fast RAID-0 NVMe scratch volume for "
     "active datasets, and 8 TB bulk HDD for archives and checkpoints."),
    ("Built to run 24/7", "Titanium-grade 1600W PSU, liquid CPU cooling and a 4U "
     "rackmount chassis suit a lab or server room operating continuously."),
    ("Ready-to-use stack", "Ubuntu Server pre-loaded with Python, TensorFlow, "
     "PyTorch, JupyterHub and Docker — students log in and start working."),
]
why_rows = [[Paragraph(t, cell_b), Paragraph(d, cell)] for t, d in why]
wt = Table(why_rows, colWidths=[42 * mm, None])
wt.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LINEBELOW", (0, 0), (-1, -2), 0.4, LINE),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
]))
story.append(wt)

# ---------- 3. SPECIFICATION ----------
story.append(Paragraph("3.  System Specification", h2))
story.append(Paragraph(
    "Item 1 — <b>NT AI/ML Server</b> &nbsp;|&nbsp; Quantity: 1 unit "
    "&nbsp;|&nbsp; Warranty: 3 years", S("specnote", fontName="Helvetica",
    fontSize=9.5, textColor=INK, spaceAfter=6)))

spec_rows = [[Paragraph("Component", white_b), Paragraph("Specification", white_b)]]
for comp, spec in BOM:
    spec_rows.append([Paragraph(comp, cell_b), Paragraph(spec, cell)])
st = Table(spec_rows, colWidths=[42 * mm, None], repeatRows=1)
st.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), INK),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("LINEBELOW", (0, 1), (-1, -1), 0.3, LINE),
    ("BOX", (0, 0), (-1, -1), 0.5, LINE),
]))
story.append(st)

# ---------- 4. COMMERCIALS ----------
story.append(Paragraph("4.  Commercial Summary", h2))
price_rows = [
    [Paragraph("Description", white_b), Paragraph("Qty", white_b),
     Paragraph("Unit Price", white_b), Paragraph("Amount", white_b)],
    [Paragraph("NT AI/ML Server (complete build, as specified above)", cell),
     Paragraph("1", cell), Paragraph(inr(TAXABLE), cell), Paragraph(inr(TAXABLE), cell)],
]
pt = Table(price_rows, colWidths=[None, 14 * mm, 38 * mm, 38 * mm])
pt.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), INK),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
    ("ALIGN", (1, 0), (1, -1), "CENTER"),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("BOX", (0, 0), (-1, -1), 0.5, LINE),
    ("LINEBELOW", (0, 0), (-1, 0), 0.5, LINE),
]))
story.append(pt)
story.append(Spacer(1, 4))

# Totals block (right aligned)
def trow(label, value, bold=False, accent=False):
    ls = S("tl", fontName="Helvetica-Bold" if bold else "Helvetica",
           fontSize=10 if not bold else 10.5,
           textColor=colors.white if accent else STEEL, alignment=TA_RIGHT)
    vs = S("tv", fontName="Helvetica-Bold" if bold else "Helvetica",
           fontSize=10 if not bold else 10.5,
           textColor=colors.white if accent else INK, alignment=TA_RIGHT)
    return [Paragraph(label, ls), Paragraph(value, vs)]

totals = Table([
    trow("Taxable Amount", inr(TAXABLE)),
    trow("CGST @ 9%", inr(CGST)),
    trow("SGST @ 9%", inr(SGST)),
    trow("Total Amount", inr(TOTAL), bold=True, accent=True),
], colWidths=[50 * mm, 40 * mm], hAlign="RIGHT")
totals.setStyle(TableStyle([
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("LINEBELOW", (0, 0), (-1, -2), 0.4, LINE),
    ("BACKGROUND", (0, 3), (-1, 3), ACCENT),
]))
story.append(totals)
story.append(Spacer(1, 4))
story.append(Paragraph("Total in words: <b>" + AMOUNT_WORDS + "</b>",
                       S("words", fontName="Helvetica", fontSize=9.5,
                         textColor=STEEL)))
story.append(Paragraph("All prices are in INR and inclusive of 18% GST. "
                       "Place of supply: Kerala.", small))

# ---------- 5. TERMS ----------
story.append(Paragraph("5.  Terms & Conditions", h2))
terms = [
    "<b>Contract:</b> Build begins only after 100% advance payment is received.",
    "<b>Payment:</b> 100% upfront, GST inclusive. EFT preferred; card payments "
    "attract a 2.5% surcharge.",
    "<b>Orders:</b> Confirmed orders cannot be cancelled.",
    "<b>Validity:</b> This proposal is valid until " + PROPOSAL["valid"] + ".",
    "<b>Warranty:</b> 3 years as per respective manufacturer terms. Misuse or "
    "unauthorized modifications void the warranty.",
    "<b>Liability:</b> NeoTokyo is not liable for delays or damages arising from "
    "force majeure events.",
]
for t in terms:
    story.append(Paragraph("•&nbsp;&nbsp;" + t, S("term", fontName="Helvetica",
                 fontSize=9.5, textColor=STEEL, leading=14, spaceAfter=3,
                 leftIndent=6)))

# ---------- 6. PAYMENT + SIGN ----------
story.append(Paragraph("6.  Payment Details & Acceptance", h2))
bank = Table([
    [Paragraph("Account Name", cell_b), Paragraph("NeoTokyo", cell),
     Paragraph("Bank", cell_b), Paragraph("HDFC Bank, Cochin – Palarivattam", cell)],
    [Paragraph("Account No.", cell_b), Paragraph("50200115683856", cell),
     Paragraph("IFSC", cell_b), Paragraph("HDFC0000520", cell)],
    [Paragraph("GSTIN", cell_b), Paragraph(VENDOR["gstin"], cell),
     Paragraph("PAN", cell_b), Paragraph(VENDOR["pan"], cell)],
], colWidths=[26 * mm, None, 16 * mm, 52 * mm])
bank.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("BOX", (0, 0), (-1, -1), 0.5, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.white),
]))
story.append(bank)
story.append(Spacer(1, 14 * mm))

sign = Table([
    [Paragraph("For <b>NeoTokyo</b>", cell),
     Paragraph("Accepted for <b>" + CLIENT["name"] + "</b>", cell)],
    [Spacer(1, 12 * mm), Spacer(1, 12 * mm)],
    [Paragraph("Authorized Signatory", small),
     Paragraph("Authorized Signatory / Seal & Date", small)],
], colWidths=[None, None])
sign.setStyle(TableStyle([
    ("LINEABOVE", (0, 2), (0, 2), 0.6, STEEL),
    ("LINEABOVE", (1, 2), (1, 2), 0.6, STEEL),
    ("TOPPADDING", (0, 2), (-1, 2), 3),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (0, -1), 14),
]))
story.append(sign)
story.append(Spacer(1, 6 * mm))
story.append(Paragraph(
    "We look forward to partnering with Chinmaya College IEDC. For any "
    "clarification or an on-site demonstration, please reach us at "
    + VENDOR["email"] + ".", small))

doc.build(story)
print("Wrote", OUT)
