#!/usr/bin/env python3
"""Framed Google Play screenshots (1080x1920, 9:16) with a caption on top.

Usage: python3 tools/android/store-compose.py <raw_dir> <out_dir>
raw_dir holds pt-BR/ and en-US/ from tools/android/store-screens.cjs."""
import os
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAW, OUT = sys.argv[1], sys.argv[2]
W, H = 1080, 1920
PAPER = (242, 239, 231)
INK = (27, 25, 20)
GREEN = (30, 106, 80)

CAPTIONS = {
    '1-tabela': {'pt-BR': ('Tabela periódica completa', 'Com a cor real de cada elemento'), 'en-US': ('The full periodic table', 'Showing each element’s real colour')},
    '2-laboratorio': {'pt-BR': ('Laboratório virtual', 'Prepare soluções e veja reações acontecerem'), 'en-US': ('Virtual chemistry lab', 'Make solutions and watch reactions happen')},
    '3-isomeria': {'pt-BR': ('Todos os isômeros', 'De qualquer fórmula, com o nome IUPAC'), 'en-US': ('Every isomer', 'For any formula, with its IUPAC name')},
    '4-elemento': {'pt-BR': ('118 elementos', 'Dados de IUPAC, NIST e CODATA'), 'en-US': ('All 118 elements', 'Data from IUPAC, NIST and CODATA')},
    '5-moleculas': {'pt-BR': ('Moléculas em 3D', 'Gire, compare e monte qualquer molécula'), 'en-US': ('Molecules in 3D', 'Rotate, compare and build any molecule')},
    '6-calculadoras': {'pt-BR': ('Calculadoras passo a passo', 'Massa molar, pH, diluição e gases'), 'en-US': ('Step-by-step calculators', 'Molar mass, pH, dilution and gases')},
    '7-modelos-atomicos': {'pt-BR': ('Modelos atômicos', 'De Dalton ao modelo quântico'), 'en-US': ('Atomic models', 'From Dalton to the quantum model')},
    '8-inicio': {'pt-BR': ('Química pra entender', 'Grátis, sem conta e funciona offline'), 'en-US': ('Chemistry you understand', 'Free, no account, works offline')},
}


def font(size, bold):
    names = ['LiberationSans-Bold.ttf', 'DejaVuSans-Bold.ttf'] if bold else ['LiberationSans-Regular.ttf', 'DejaVuSans.ttf']
    for base in ['/usr/share/fonts/truetype/liberation', '/usr/share/fonts/truetype/dejavu', '/Library/Fonts', 'C:/Windows/Fonts']:
        for n in names:
            if os.path.exists(os.path.join(base, n)):
                return ImageFont.truetype(os.path.join(base, n), size)
    return ImageFont.load_default()


TITLE, SUB = font(72, True), font(40, False)


def centred(draw, y, text, f, fill):
    w = draw.textlength(text, font=f)
    draw.text(((W - w) / 2, y), text, font=f, fill=fill)


def compose(src, title, sub, dest):
    canvas = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(canvas)
    centred(d, 120, title, TITLE, INK)
    centred(d, 222, sub, SUB, GREEN)
    shot = Image.open(src).convert('RGB')
    sw = 860
    sh = int(shot.height * sw / shot.width)
    shot = shot.resize((sw, sh), Image.LANCZOS)
    top = 330
    visible = min(sh, H - top + 40)
    shot = shot.crop((0, 0, sw, visible))
    radius = 44
    mask = Image.new('L', (sw, visible), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, sw - 1, visible + radius), radius=radius, fill=255)
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(((W - sw) // 2 - 4, top + 10, (W + sw) // 2 + 4, H + radius), radius=radius + 4, fill=(20, 18, 14, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    canvas = Image.alpha_composite(canvas.convert('RGBA'), shadow).convert('RGB')
    frame = Image.new('RGB', (sw + 12, visible + 12), (216, 210, 191))
    fmask = Image.new('L', frame.size, 0)
    ImageDraw.Draw(fmask).rounded_rectangle((0, 0, frame.width - 1, frame.height + radius), radius=radius + 6, fill=255)
    canvas.paste(frame, ((W - sw) // 2 - 6, top - 6), fmask)
    canvas.paste(shot, ((W - sw) // 2, top), mask)
    canvas.save(dest, optimize=True)


for lang in ['pt-BR', 'en-US']:
    os.makedirs(os.path.join(OUT, lang), exist_ok=True)
    for sid, caps in CAPTIONS.items():
        src = os.path.join(RAW, lang, sid + '.png')
        if not os.path.exists(src):
            continue
        title, sub = caps[lang]
        compose(src, title, sub, os.path.join(OUT, lang, sid + '.png'))

# Feature graphic (1024x500) per language and the 512 icon.
from PIL import Image as _I
MARK = _I.open(os.path.join(os.path.dirname(__file__), '..', '..', 'assets/brand/atomurus-mark-512.png')).convert('RGBA')
TAGS = {'pt-BR': ('Tabela periódica, laboratório,', 'isomeria e calculadoras'), 'en-US': ('Periodic table, virtual lab,', 'isomers and calculators')}
BIG, SMALL = font(92, True), font(34, False)
for lang, (l1, l2) in TAGS.items():
    fg = _I.new('RGBA', (1024, 500), PAPER + (255,))
    fg.alpha_composite(MARK.resize((360, 360), _I.LANCZOS), (90, 70))
    dr = ImageDraw.Draw(fg)
    dr.text((500, 150), 'Atomurus', fill=INK, font=BIG)
    dr.text((504, 262), l1, fill=GREEN, font=SMALL)
    dr.text((504, 306), l2, fill=GREEN, font=SMALL)
    fg.convert('RGB').save(os.path.join(OUT, lang, 'feature-graphic-1024x500.png'), optimize=True)
icon = os.path.join(os.path.dirname(__file__), '..', '..', 'android/store/play-icon-512.png')
if os.path.exists(icon):
    _I.open(icon).convert('RGB').save(os.path.join(OUT, 'play-icon-512.png'))
print('store screenshots, feature graphics and icon written to', OUT)
