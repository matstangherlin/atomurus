#!/usr/bin/env python3
"""Launcher icons, splash screens and Play Store graphics from the Atomurus mark.

Run from the repo root: python3 tools/android/make-android-icons.py
Writes into android/app/src/main/res and android/store/ (store listing art)."""
import os
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
RES = os.path.join(ROOT, 'android/app/src/main/res')
STORE = os.path.join(ROOT, 'android/store')
MARK = Image.open(os.path.join(ROOT, 'assets/brand/atomurus-mark-512.png')).convert('RGBA')
CREAM = (247, 244, 236, 255)   # #F7F4EC, the maskable icon background
PAPER = (242, 239, 231, 255)   # #F2EFE7, site background
GREEN = (30, 106, 80, 255)     # #1E6A50

DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}


def mark(size):
    return MARK.resize((size, size), Image.LANCZOS)


def on(bg, size, mark_frac, shape=None):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    base = Image.new('RGBA', (size, size), bg)
    if shape == 'circle':
        m = Image.new('L', (size, size), 0)
        ImageDraw.Draw(m).ellipse((0, 0, size - 1, size - 1), fill=255)
        img.paste(base, (0, 0), m)
    elif shape == 'rounded':
        m = Image.new('L', (size, size), 0)
        ImageDraw.Draw(m).rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * 0.22), fill=255)
        img.paste(base, (0, 0), m)
    else:
        img = base
    s = int(size * mark_frac)
    img.alpha_composite(mark(s), ((size - s) // 2, (size - s) // 2))
    return img


for name, k in DENS.items():
    d = os.path.join(RES, f'mipmap-{name}')
    os.makedirs(d, exist_ok=True)
    legacy = int(48 * k)
    on(CREAM, legacy, 0.74, 'rounded').save(os.path.join(d, 'ic_launcher.png'))
    on(CREAM, legacy, 0.70, 'circle').save(os.path.join(d, 'ic_launcher_round.png'))
    fg = int(108 * k)   # adaptive icon: 108dp canvas, 66dp safe zone
    img = Image.new('RGBA', (fg, fg), (0, 0, 0, 0))
    s = int(fg * 0.58)
    img.alpha_composite(mark(s), ((fg - s) // 2, (fg - s) // 2))
    img.save(os.path.join(d, 'ic_launcher_foreground.png'))

with open(os.path.join(RES, 'values/ic_launcher_background.xml'), 'w') as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#F7F4EC</color>\n</resources>\n')

# Splash (legacy drawable + Android 12+ SplashScreen uses the launcher icon).
for folder in os.listdir(RES):
    p = os.path.join(RES, folder, 'splash.png')
    if not (folder.startswith('drawable') and os.path.exists(p)):
        continue
    w, h = Image.open(p).size
    img = Image.new('RGBA', (w, h), PAPER)
    s = int(min(w, h) * 0.34)
    img.alpha_composite(mark(s), ((w - s) // 2, (h - s) // 2))
    img.convert('RGB').save(p)

# Play Store listing art.
os.makedirs(STORE, exist_ok=True)
on(CREAM, 512, 0.72).convert('RGB').save(os.path.join(STORE, 'play-icon-512.png'))
fg = Image.new('RGBA', (1024, 500), PAPER)
fg.alpha_composite(mark(360), (90, 70))
from PIL import ImageFont


def font(size, bold):
    names = ['LiberationSans-Bold.ttf', 'DejaVuSans-Bold.ttf'] if bold else ['LiberationSans-Regular.ttf', 'DejaVuSans.ttf']
    for base in ['/usr/share/fonts/truetype/liberation', '/usr/share/fonts/truetype/dejavu', '/Library/Fonts', 'C:/Windows/Fonts']:
        for n in names:
            if os.path.exists(os.path.join(base, n)):
                return ImageFont.truetype(os.path.join(base, n), size)
    return ImageFont.load_default()


big, small = font(92, True), font(34, False)
dr = ImageDraw.Draw(fg)
dr.text((500, 150), 'Atomurus', fill=(27, 25, 20, 255), font=big)
dr.text((504, 262), 'Tabela periódica, laboratório,', fill=GREEN, font=small)
dr.text((504, 306), 'isomeria e calculadoras', fill=GREEN, font=small)
fg.convert('RGB').save(os.path.join(STORE, 'feature-graphic-1024x500.png'))
print('icons, splash and store art written')
