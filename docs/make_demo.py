"""Generate docs/demo.gif — a 10-frame schematic growth animation (PROJECT.md §8).

Run: python docs/make_demo.py  →  docs/demo.gif
Draws the Lumen City network appearing line by line on paper.
"""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 800, 400
BG = (255, 255, 255)
INK = (17, 17, 17)

STATIONS = {
    "s1": (120, 220), "s2": (280, 220), "s3": (440, 220),
    "s4": (440, 90), "s5": (440, 350), "s6": (620, 90),
    "s7": (620, 220), "s8": (620, 350),
}
LINES = [
    ("#E00034", [("s1", "s2"), ("s2", "s3"), ("s3", "s7")]),
    ("#0067C0", [("s4", "s3"), ("s3", "s5"), ("s5", "s8")]),
    ("#009444", [("s4", "s6"), ("s6", "s7"), ("s7", "s8")]),
]
ORDER = []
for _, segs in LINES:
    ORDER.extend(segs)
# Frames: 0 = header, then one segment per frame, last 2 = hold with labels.
FRAME_SEGS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

def draw_frame(n_segs, with_labels, title=True):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    # grid
    for x in range(0, W, 40):
        d.line([(x, 0), (x, H)], fill=(235, 235, 235), width=1)
    for y in range(0, H, 40):
        d.line([(0, y), (W, y)], fill=(235, 235, 235), width=1)
    if title:
        d.text((24, 16), "Nodal — Lumen City (example)", fill=INK)
    segs = ORDER[:n_segs] if n_segs <= len(ORDER) else ORDER
    color_of = {seg: col for col, ss in LINES for seg in ss}
    for seg in segs:
        a, b = STATIONS[seg[0]], STATIONS[seg[1]]
        d.line([a, b], fill=color_of[seg], width=8)
    for k, (x, y) in STATIONS.items():
        d.ellipse([x - 8, y - 8, x + 8, y + 8], fill=(255, 255, 255), outline=INK, width=2)
        if k in ("s3",):
            d.ellipse([x - 15, y - 15, x + 15, y + 15], outline=INK, width=2)
        if with_labels:
            names = {"s1": "Harbor", "s2": "Market", "s3": "Central", "s4": "Garden", "s5": "University", "s6": "North Gate", "s7": "East Loop", "s8": "Museum"}
            d.text((x + 12, y - 8), names[k], fill=INK)
    return img

frames = []
for n in FRAME_SEGS[:-2]:
    frames.append(draw_frame(n, with_labels=False))
for _ in range(3):
    frames.append(draw_frame(len(ORDER), with_labels=True))

out = os.path.join(os.path.dirname(__file__), "demo.gif")
frames[0].save(out, save_all=True, append_images=frames[1:], duration=350, loop=0, optimize=True)
print(f"wrote {out} ({os.path.getsize(out)} bytes, {len(frames)} frames)")
