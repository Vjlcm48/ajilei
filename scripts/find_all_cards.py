"""
Find ALL card-sized rects in baraja2.svg regardless of group ID.
Looks for rect elements with width≈207 height≈318.
"""
import xml.etree.ElementTree as ET
import re

SVG_FILE = r'c:\Users\victo\OneDrive\Documents\ajilei\src\assets\baraja2.svg'
SVG_NS = 'http://www.w3.org/2000/svg'

def parse_translate(t):
    if not t: return 0.0, 0.0
    m = re.search(r'translate\(\s*([+-]?\d+\.?\d*)\s*,\s*([+-]?\d+\.?\d*)\s*\)', t)
    if m: return float(m.group(1)), float(m.group(2))
    m = re.search(r'translate\(\s*([+-]?\d+\.?\d*)\s*\)', t)
    if m: return float(m.group(1)), 0.0
    return 0.0, 0.0

def collect_transforms(root):
    """Returns list of (element, cumulative_tx, cumulative_ty, depth_id_path)"""
    results = []
    def walk(el, tx, ty, id_path):
        el_tx, el_ty = parse_translate(el.get('transform', ''))
        new_tx = tx + el_tx
        new_ty = ty + el_ty
        eid = el.get('id', '')
        new_path = id_path + [eid] if eid else id_path

        tag = el.tag.split('}')[-1] if '}' in el.tag else el.tag
        if tag == 'rect':
            try:
                w = float(el.get('width', 0))
                h = float(el.get('height', 0))
                if 200 <= w <= 215 and 310 <= h <= 325:
                    rx = float(el.get('x', 0))
                    ry = float(el.get('y', 0))
                    vx = new_tx + rx
                    vy = new_ty + ry
                    results.append({
                        'id': eid,
                        'parent_ids': '/'.join(new_path[:-1]) if len(new_path) > 1 else '',
                        'vx': vx, 'vy': vy, 'w': w, 'h': h
                    })
            except (ValueError, TypeError):
                pass

        for child in el:
            walk(child, new_tx, new_ty, new_path)
    walk(root, 0, 0, [])
    return results

tree = ET.parse(SVG_FILE)
root = tree.getroot()

cards = collect_transforms(root)
# Deduplicate by approximate viewport position
seen = set()
unique = []
for c in cards:
    key = (round(c['vx']/10)*10, round(c['vy']/10)*10)
    if key not in seen:
        seen.add(key)
        unique.append(c)

# Sort by row then column
unique.sort(key=lambda c: (round(c['vy']/100), round(c['vx']/100)))

print(f'Found {len(unique)} unique card-sized rects:\n')
print(f'{"parent_id":<30} {"rect_id":<15} {"vx":>8} {"vy":>8}')
print('-'*70)
for c in unique:
    print(f'{c["parent_ids"]:<30} {c["id"]:<15} {c["vx"]:>8.1f} {c["vy"]:>8.1f}')

# Row grouping
print('\n=== Rows (grouped by y) ===')
rows = {}
for c in unique:
    row = round(c['vy'] / 319)
    rows.setdefault(row, []).append(c)
for row in sorted(rows):
    print(f'Row {row} (y≈{row*319}):')
    for c in sorted(rows[row], key=lambda x: x['vx']):
        print(f'  x={c["vx"]:>6.1f}  parent={c["parent_ids"]}')
