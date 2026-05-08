#!/usr/bin/env python3
"""La Methode 97% — Livre Blanc Enomia (full storytelling preserved)"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    Table, TableStyle, Flowable, NextPageTemplate
)
import os

# Try to register Inter / Newsreader if available
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONT_SERIF, FONT_SERIF_BOLD, FONT_SERIF_ITALIC = "Times-Roman", "Times-Bold", "Times-Italic"
FONT_SANS, FONT_SANS_BOLD, FONT_SANS_ITALIC = "Helvetica", "Helvetica-Bold", "Helvetica-Oblique"

# Try macOS system fonts for nicer rendering with French accents
def try_register():
    global FONT_SERIF, FONT_SERIF_BOLD, FONT_SERIF_ITALIC
    global FONT_SANS, FONT_SANS_BOLD, FONT_SANS_ITALIC
    candidates = [
        ("Inter", "/System/Library/Fonts/Supplemental/Helvetica.ttc"),
    ]
    # Use Georgia (serif) and Helvetica Neue (sans) which support full French accents
    georgia_paths = [
        "/Library/Fonts/Georgia.ttf",
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
    ]
    georgia_bold = [
        "/Library/Fonts/Georgia Bold.ttf",
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    ]
    georgia_italic = [
        "/Library/Fonts/Georgia Italic.ttf",
        "/System/Library/Fonts/Supplemental/Georgia Italic.ttf",
    ]
    for p in georgia_paths:
        if os.path.exists(p):
            try:
                pdfmetrics.registerFont(TTFont("Georgia", p))
                FONT_SERIF = "Georgia"
                break
            except: pass
    for p in georgia_bold:
        if os.path.exists(p):
            try:
                pdfmetrics.registerFont(TTFont("Georgia-Bold", p))
                FONT_SERIF_BOLD = "Georgia-Bold"
                break
            except: pass
    for p in georgia_italic:
        if os.path.exists(p):
            try:
                pdfmetrics.registerFont(TTFont("Georgia-Italic", p))
                FONT_SERIF_ITALIC = "Georgia-Italic"
                break
            except: pass

try_register()

# Colors
C_CREAM    = HexColor("#f7f6f3")
C_CREAM2   = HexColor("#f0efec")
C_DARK     = HexColor("#2b2d2b")
C_DARK2    = HexColor("#343634")
C_GREEN    = HexColor("#3fbd71")
C_GREEN_D  = HexColor("#2fa05e")
C_GREEN_L  = HexColor("#e8f5ee")
C_GREEN_XL = HexColor("#f0faf4")
C_TEXT     = HexColor("#1a1a1a")
C_TEXT2    = HexColor("#52524e")
C_TEXT3    = HexColor("#8a8985")
C_BORDER   = HexColor("#e5e3de")
C_WHITE    = HexColor("#ffffff")
C_RED      = HexColor("#e05252")
C_RED_L    = HexColor("#fef2f2")

PW, PH = A4
ML, MR, MT, MB = 28*mm, 28*mm, 30*mm, 22*mm
CW = PW - ML - MR


# ─── Flowables ───
class GreenRule(Flowable):
    def __init__(self, w=None, t=1.5, c=None):
        Flowable.__init__(self); self._w=w or CW; self._t=t; self._c=c or C_GREEN
    def wrap(self,aW,aH): return (min(self._w,aW), self._t+4)
    def draw(self):
        self.canv.setStrokeColor(self._c); self.canv.setLineWidth(self._t)
        self.canv.line(0,2,self._w,2)


class QuoteBox(Flowable):
    def __init__(self, text, w=None):
        Flowable.__init__(self); self.text=text; self._w=w or CW
    def wrap(self,aW,aH):
        self._w = min(self._w,aW)
        st = ParagraphStyle('_q', fontName=FONT_SERIF_ITALIC, fontSize=11, leading=18, textColor=C_TEXT2)
        self._p = Paragraph(self.text, st)
        pw,ph = self._p.wrap(self._w-22*mm, aH)
        self._ph = ph; self._h = ph+15*mm
        return (self._w, self._h)
    def draw(self):
        c = self.canv; h=self._h; w=self._w
        c.setFillColor(C_GREEN_XL); c.roundRect(4*mm,0,w-4*mm,h,5,fill=1,stroke=0)
        c.setFillColor(C_GREEN); c.roundRect(0,3,3,h-6,1.5,fill=1,stroke=0)
        c.setFont(FONT_SERIF_BOLD,36); c.setFillColor(HexColor("#c8e6d5"))
        c.drawString(8*mm, h-13*mm, "\u00ab")
        self._p.drawOn(c, 12*mm, 7*mm)


class StatCard(Flowable):
    def __init__(self, lines, w=None, title=None):
        Flowable.__init__(self); self.lines=lines; self._w=w or CW; self.title=title
    def wrap(self,aW,aH):
        self._w = min(self._w,aW)
        th = 10*mm if self.title else 0
        self._h = len(self.lines)*8*mm + 10*mm + th
        return (self._w, self._h)
    def draw(self):
        c=self.canv; h=self._h; w=self._w
        c.setFillColor(HexColor("#e8e6e1")); c.roundRect(2,-2,w,h,6,fill=1,stroke=0)
        c.setFillColor(C_WHITE); c.roundRect(0,0,w,h,6,fill=1,stroke=0)
        c.setStrokeColor(C_BORDER); c.setLineWidth(0.5); c.roundRect(0,0,w,h,6,fill=0,stroke=1)
        c.setFillColor(C_GREEN); c.roundRect(0,h-3,w,3,1.5,fill=1,stroke=0)
        y = h-8*mm
        if self.title:
            c.setFont(FONT_SANS_BOLD,10); c.setFillColor(C_GREEN_D)
            c.drawString(5*mm,y,self.title); y -= 10*mm
        for label,value in self.lines:
            c.setFont(FONT_SANS,9); c.setFillColor(C_TEXT3)
            c.drawString(5*mm,y,label)
            c.setFont(FONT_SANS_BOLD,10); c.setFillColor(C_TEXT)
            vw = c.stringWidth(value, FONT_SANS_BOLD, 10)
            c.drawString(w-5*mm-vw, y, value)
            y -= 8*mm


class RuleBox(Flowable):
    def __init__(self, title, text, color=None, w=None):
        Flowable.__init__(self); self.title=title; self.text=text
        self._color=color or C_GREEN; self._w=w or CW
    def wrap(self,aW,aH):
        self._w = min(self._w,aW)
        st = ParagraphStyle('_rb', fontName=FONT_SANS, fontSize=10, leading=15, textColor=C_TEXT)
        self._p = Paragraph(self.text, st)
        pw,ph = self._p.wrap(self._w-24*mm, aH)
        self._ph = ph; self._h = ph+20*mm
        return (self._w, self._h)
    def draw(self):
        c=self.canv; h=self._h; w=self._w; col=self._color
        bg = C_GREEN_XL if col == C_GREEN else C_RED_L
        c.setFillColor(bg); c.roundRect(0,0,w,h,6,fill=1,stroke=0)
        c.setFillColor(col); c.roundRect(0,0,4,h,2,fill=1,stroke=0)
        c.setFillColor(col); c.circle(12*mm, h-10*mm, 4*mm, fill=1, stroke=0)
        c.setFont(FONT_SANS_BOLD,12); c.setFillColor(C_WHITE)
        sym = "!" if col != C_GREEN else "\u2713"
        sw = c.stringWidth(sym, FONT_SANS_BOLD, 12)
        c.drawString(12*mm-sw/2, h-11.5*mm, sym)
        c.setFont(FONT_SANS_BOLD,11); c.setFillColor(C_TEXT)
        c.drawString(20*mm, h-11*mm, self.title)
        self._p.drawOn(c, 12*mm, 5*mm)


class ModuleOpener(Flowable):
    def __init__(self, number, title, subtitle=None, w=None):
        Flowable.__init__(self); self.number=number; self.title=title
        self.subtitle=subtitle; self._w=w or CW
    def wrap(self,aW,aH):
        self._w = min(self._w,aW)
        self._h = 36*mm if self.subtitle else 28*mm
        return (self._w, self._h)
    def draw(self):
        c=self.canv; h=self._h; w=self._w
        c.setFillColor(C_DARK); c.roundRect(-ML+5*mm, 0, PW-10*mm, h, 0, fill=1, stroke=0)
        c.setFillColor(C_GREEN); c.rect(-ML+5*mm, 0, PW-10*mm, 3, fill=1, stroke=0)
        if self.number:
            c.setFillColor(C_GREEN); c.roundRect(3*mm, h-10*mm, 32*mm, 10*mm, 3, fill=1, stroke=0)
            c.setFont(FONT_SANS_BOLD,9); c.setFillColor(C_WHITE)
            c.drawString(6*mm, h-7*mm, f"MODULE {self.number}")
        c.setFont(FONT_SERIF_BOLD,24); c.setFillColor(C_WHITE)
        ty = 8*mm if not self.subtitle else 14*mm
        c.drawString(5*mm, ty, self.title)
        if self.subtitle:
            c.setFont(FONT_SANS,10); c.setFillColor(HexColor("#a0a09c"))
            c.drawString(5*mm, 6*mm, self.subtitle)
        c.setFillColor(HexColor("#3e403e")); c.circle(w-15*mm, h-8*mm, 12*mm, fill=1, stroke=0)
        c.setFillColor(HexColor("#454745")); c.circle(w-8*mm, h-14*mm, 8*mm, fill=1, stroke=0)


class CoverPage(Flowable):
    def wrap(self,aW,aH): return (0,0)
    def draw(self):
        c = self.canv
        c.setFillColor(C_DARK); c.rect(0,0,PW,PH,fill=1,stroke=0)
        c.setFillColor(C_DARK2); c.circle(PW*0.75, PH*0.65, 180, fill=1, stroke=0)
        c.setFillColor(HexColor("#313331")); c.circle(PW*0.8, PH*0.6, 120, fill=1, stroke=0)
        c.setFillColor(C_GREEN)
        for x,y,r in [(0.12,0.82,4),(0.15,0.79,2.5),(0.88,0.25,3),(0.85,0.22,5)]:
            c.circle(PW*x, PH*y, r, fill=1, stroke=0)
        line_y = PH*0.58
        c.setStrokeColor(C_GREEN); c.setLineWidth(2.5)
        c.line(PW*0.35, line_y, PW*0.65, line_y)
        c.setFont(FONT_SANS_BOLD,13); c.setFillColor(C_GREEN)
        brand = "E N O M I A"; bw = c.stringWidth(brand, FONT_SANS_BOLD, 13)
        c.drawString((PW-bw)/2, PH*0.72, brand)
        c.setFont(FONT_SERIF_BOLD,48); c.setFillColor(C_WHITE)
        title = "La M\u00e9thode 97%"; tw = c.stringWidth(title, FONT_SERIF_BOLD, 48)
        c.drawString((PW-tw)/2, PH*0.63, title)
        c.setFont(FONT_SERIF,16); c.setFillColor(HexColor("#a0a09c"))
        sub = "Par Marc Chenut"; sw = c.stringWidth(sub, FONT_SERIF, 16)
        c.drawString((PW-sw)/2, PH*0.54, sub)
        c.setFont(FONT_SANS,12); c.setFillColor(C_GREEN)
        url = "enomia.app"; uw = c.stringWidth(url, FONT_SANS, 12)
        c.drawString((PW-uw)/2, PH*0.50, url)
        c.setFont(FONT_SERIF_ITALIC,13); c.setFillColor(HexColor("#7a7a76"))
        for txt, y in [("Automatisez votre gestion locative.", 0.38),
                       ("Maximisez vos rendements.", 0.35)]:
            tw = c.stringWidth(txt, FONT_SERIF_ITALIC, 13)
            c.drawString((PW-tw)/2, PH*y, txt)
        c.setFillColor(HexColor("#232523")); c.rect(0,0,PW,35,fill=1,stroke=0)
        c.setFillColor(C_GREEN); c.rect(0,35,PW,1.5,fill=1,stroke=0)
        c.setFont(FONT_SANS,8.5); c.setFillColor(HexColor("#6e6b65"))
        ver = "Document de travail  |  Version 0.2  |  Avril 2026"
        vw = c.stringWidth(ver, FONT_SANS, 8.5)
        c.drawString((PW-vw)/2, 13, ver)


# ─── Page templates ───
def draw_cover_bg(canvas_obj, doc): pass

def draw_content_bg(canvas_obj, doc):
    c = canvas_obj; c.saveState()
    c.setFillColor(C_CREAM); c.rect(0,0,PW,PH,fill=1,stroke=0)
    c.setFillColor(C_WHITE); c.rect(0,PH-18*mm,PW,18*mm,fill=1,stroke=0)
    c.setStrokeColor(C_BORDER); c.setLineWidth(0.4)
    c.line(0, PH-18*mm, PW, PH-18*mm)
    c.setFont(FONT_SANS_BOLD,7.5); c.setFillColor(C_TEXT3)
    c.drawString(ML, PH-12*mm, "LA M\u00c9THODE 97%")
    c.setFillColor(C_GREEN); c.circle(ML-4*mm, PH-11.5*mm, 2, fill=1, stroke=0)
    c.setFont(FONT_SANS,7.5); c.setFillColor(C_GREEN)
    ew = c.stringWidth("enomia.app", FONT_SANS, 7.5)
    c.drawString(PW-MR-ew, PH-12*mm, "enomia.app")
    c.setFillColor(C_WHITE); c.rect(0,0,PW,15*mm,fill=1,stroke=0)
    c.setStrokeColor(C_BORDER); c.line(0,15*mm,PW,15*mm)
    c.setFont(FONT_SANS,8); c.setFillColor(C_TEXT3)
    num = str(doc.page); nw = c.stringWidth(num, FONT_SANS, 8)
    c.drawString((PW-nw)/2, 5.5*mm, num)
    c.setFillColor(C_GREEN)
    c.circle((PW-nw)/2-4*mm, 7*mm, 1.5, fill=1, stroke=0)
    c.circle((PW+nw)/2+4*mm, 7*mm, 1.5, fill=1, stroke=0)
    c.restoreState()

def draw_toc_bg(canvas_obj, doc):
    c = canvas_obj; c.saveState()
    c.setFillColor(C_CREAM); c.rect(0,0,PW,PH,fill=1,stroke=0)
    c.setFillColor(C_GREEN); c.rect(0,0,5,PH,fill=1,stroke=0)
    c.setFillColor(C_DARK); c.rect(5,0,20*mm,PH,fill=1,stroke=0)
    c.setFont(FONT_SANS_BOLD,9); c.setFillColor(HexColor("#5a5c5a"))
    c.saveState(); c.translate(14*mm, PH*0.5); c.rotate(90)
    c.drawCentredString(0,0,"SOMMAIRE"); c.restoreState()
    c.setFont(FONT_SANS,8); c.setFillColor(C_TEXT3)
    c.drawCentredString(PW/2, 6*mm, "2"); c.restoreState()


# ─── Styles ───
def make_styles():
    S = {}
    S['body'] = ParagraphStyle('Body', fontName=FONT_SANS, fontSize=10, leading=16.5,
                                textColor=C_TEXT, alignment=TA_JUSTIFY, spaceAfter=7, spaceBefore=2)
    S['body_b'] = ParagraphStyle('BodyB', parent=S['body'], fontName=FONT_SANS_BOLD)
    S['lead'] = ParagraphStyle('Lead', fontName=FONT_SERIF_ITALIC, fontSize=12, leading=19,
                                textColor=C_TEXT2, alignment=TA_LEFT, spaceAfter=10, spaceBefore=4)
    S['h1'] = ParagraphStyle('H1', fontName=FONT_SERIF_BOLD, fontSize=22, leading=28,
                              textColor=C_DARK, spaceBefore=4, spaceAfter=4)
    S['h2'] = ParagraphStyle('H2', fontName=FONT_SERIF_BOLD, fontSize=16, leading=22,
                              textColor=C_DARK, spaceBefore=14, spaceAfter=6)
    S['h3'] = ParagraphStyle('H3', fontName=FONT_SANS_BOLD, fontSize=11.5, leading=16,
                              textColor=C_TEXT, spaceBefore=12, spaceAfter=4)
    S['small'] = ParagraphStyle('Sm', fontName=FONT_SANS, fontSize=8.5, leading=12,
                                 textColor=C_TEXT3, spaceAfter=4)
    S['bullet'] = ParagraphStyle('Bul', fontName=FONT_SANS, fontSize=10, leading=16,
                                  textColor=C_TEXT, leftIndent=12*mm, bulletIndent=5*mm,
                                  spaceBefore=2, spaceAfter=2)
    S['toc_h'] = ParagraphStyle('TocH', fontName=FONT_SERIF_BOLD, fontSize=28, leading=34,
                                 textColor=C_DARK, spaceBefore=8, spaceAfter=14)
    S['toc_line'] = ParagraphStyle('TocL', fontName=FONT_SANS, fontSize=11, leading=24, textColor=C_TEXT)
    return S


def bullet(story, S, text):
    story.append(Paragraph(f"<font color='#3fbd71'>\u2022</font>  {text}", S['bullet']))

def p(story, S, text, style='body'):
    story.append(Paragraph(text, S[style]))

def h3(story, S, text):
    story.append(Paragraph(f"<b>{text}</b>", S['h3']))


# Will be split into chunks via build_part1, build_part2, etc.
