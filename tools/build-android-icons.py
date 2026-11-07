#!/usr/bin/env python3
"""Generate Android launcher icons and splash images from the Atomurus brand assets.

Run from the repo root after changing assets/brand or assets/icons:
    python3 tools/build-android-icons.py
Outputs are committed under android/app/src/main/res.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / 'android/app/src/main/res'
ICON = Image.open(ROOT / 'assets/icons/icon-512.png').convert('RGBA')
MASKABLE = Image.open(ROOT / 'assets/icons/icon-maskable-512.png').convert('RGBA')
MARK = Image.open(ROOT / 'assets/brand/atomurus-mark-512.png').convert('RGBA')
BG = MASKABLE.getpixel((2, 2))[:3]
DENSITIES = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}


def resized(im, size):
    return im.resize((size, size), Image.LANCZOS)


def centered(canvas_size, mark, mark_size, bg=None):
    canvas = Image.new('RGBA', canvas_size, bg + (255,) if bg else (0, 0, 0, 0))
    m = resized(mark, mark_size)
    canvas.alpha_composite(m, ((canvas_size[0] - mark_size) // 2, (canvas_size[1] - mark_size) // 2))
    return canvas


for name, k in DENSITIES.items():
    folder = RES / f'mipmap-{name}'
    folder.mkdir(parents=True, exist_ok=True)
    legacy = round(48 * k)
    resized(ICON, legacy).save(folder / 'ic_launcher.png')
    round_icon = resized(MASKABLE, legacy)
    mask = Image.new('L', (legacy, legacy), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, legacy - 1, legacy - 1), fill=255)
    round_icon.putalpha(mask)
    round_icon.save(folder / 'ic_launcher_round.png')
    # Adaptive foreground: 108dp canvas, mark inside the 66dp safe zone.
    fg = round(108 * k)
    centered((fg, fg), MARK, round(60 * k)).save(folder / 'ic_launcher_foreground.png')

(RES / 'values/ic_launcher_background.xml').write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
    f'    <color name="ic_launcher_background">#{BG[0]:02X}{BG[1]:02X}{BG[2]:02X}</color>\n</resources>\n'
)

# Splash backgrounds: same files and sizes Capacitor generated, brand colour + centred mark.
for splash in sorted(RES.glob('drawable*/splash.png')):
    w, h = Image.open(splash).size
    centered((w, h), MARK, round(min(w, h) * 0.32), BG).convert('RGB').save(splash)

print(f'android icons + splash written (background #{BG[0]:02X}{BG[1]:02X}{BG[2]:02X})')
