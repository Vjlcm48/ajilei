"""
Process rey_*.jpg cards: auto-crop background, normalize size, save as PNG.
Output size matches PlayingCard: 76x118px (upscale for quality: 228x354 = 3x)
"""
from PIL import Image
import numpy as np
import os

INPUT_DIR = r'c:\Users\victo\OneDrive\Documents\ajilei\src\assets\cards'
OUTPUT_DIR = INPUT_DIR
TARGET_W, TARGET_H = 228, 354  # 3x card display size for crisp rendering
PADDING = 8  # extra pixels to crop inward after finding boundary

CARDS = ['rey_oros', 'rey_copas', 'rey_espadas', 'rey_bastos']

def find_bg_color(arr):
    # Average of all four 30x30 corners
    corners = [
        arr[:30, :30],
        arr[:30, -30:],
        arr[-30:, :30],
        arr[-30:, -30:],
    ]
    samples = np.concatenate([c.reshape(-1, 3) for c in corners], axis=0)
    return samples.mean(axis=0)

def is_background(arr, bg, thresh=45):
    diff = np.abs(arr.astype(np.int32) - bg.astype(np.int32))
    return diff.max(axis=2) < thresh

def find_card_bounds(arr, bg, thresh=45):
    mask = ~is_background(arr, bg, thresh)
    h, w = mask.shape

    # Find rows and columns with at least 5% non-background pixels
    row_coverage = mask.sum(axis=1) / w
    col_coverage = mask.sum(axis=0) / h

    rows = np.where(row_coverage > 0.05)[0]
    cols = np.where(col_coverage > 0.05)[0]

    if len(rows) == 0 or len(cols) == 0:
        return 0, 0, w, h

    return cols[0], rows[0], cols[-1], rows[-1]

def process(name):
    src = os.path.join(INPUT_DIR, f'{name}.jpg')
    dst = os.path.join(OUTPUT_DIR, f'{name}.png')

    img = Image.open(src).convert('RGB')
    arr = np.array(img)

    bg = find_bg_color(arr)
    print(f'{name}: bg={bg.astype(int)} size={img.size}')

    x0, y0, x1, y1 = find_card_bounds(arr, bg)
    print(f'  raw bounds: ({x0},{y0}) - ({x1},{y1})  size: {x1-x0}x{y1-y0}')

    # Add small padding inside to avoid border artifacts
    pad = PADDING
    x0 = max(0, x0 + pad)
    y0 = max(0, y0 + pad)
    x1 = min(img.width - 1, x1 - pad)
    y1 = min(img.height - 1, y1 - pad)
    print(f'  cropped: ({x0},{y0}) - ({x1},{y1})  size: {x1-x0}x{y1-y0}')

    # Crop and resize to target
    cropped = img.crop((x0, y0, x1+1, y1+1))

    # Rotate if landscape (card photographed on its side) — always CCW to portrait
    cw2, ch2 = cropped.size
    if cw2 > ch2:
        cropped = cropped.rotate(90, expand=True)
        print(f'  rotated 90° CCW -> {cropped.size[0]}x{cropped.size[1]}')

    # Maintain aspect ratio, letterbox/pillarbox if needed
    cw, ch = cropped.size
    scale = min(TARGET_W / cw, TARGET_H / ch)
    nw, nh = int(cw * scale), int(ch * scale)

    resized = cropped.resize((nw, nh), Image.LANCZOS)

    # Paste centered on cream background
    out = Image.new('RGB', (TARGET_W, TARGET_H), (253, 246, 227))
    ox = (TARGET_W - nw) // 2
    oy = (TARGET_H - nh) // 2
    out.paste(resized, (ox, oy))

    out.save(dst, 'PNG', optimize=True)
    print(f'  saved -> {dst}')

if __name__ == '__main__':
    for c in CARDS:
        process(c)
    print('\nDone.')
