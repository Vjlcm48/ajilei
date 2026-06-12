"""
Analyze baraja2.svg to find viewport positions of all card groups.
"""
import xml.etree.ElementTree as ET
import re

SVG_FILE = r'c:\Users\victo\OneDrive\Documents\ajilei\src\assets\baraja2.svg'

NS = {
    'svg': 'http://www.w3.org/2000/svg',
    'xlink': 'http://www.w3.org/1999/xlink',
    'inkscape': 'http://www.inkscape.org/namespaces/inkscape',
}

def parse_translate(transform_str):
    if not transform_str:
        return 0.0, 0.0
    m = re.search(r'translate\(\s*([+-]?\d+\.?\d*)\s*,\s*([+-]?\d+\.?\d*)\s*\)', transform_str)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r'translate\(\s*([+-]?\d+\.?\d*)\s*\)', transform_str)
    if m:
        return float(m.group(1)), 0.0
    return 0.0, 0.0

tree = ET.parse(SVG_FILE)
root = tree.getroot()

svg_ns = 'http://www.w3.org/2000/svg'

CARD_IDS = [
    'jack_diamond', 'queen_diamond', 'king_diamond',
    'jack_heart',   'queen_heart',   'king_heart',
    'jack_club',    'queen_club',    'king_club',
    'jack_spade',   'queen_spade',   'king_spade',
]

# Walk all elements, track ancestor transforms
def find_with_ancestors(root, target_id, ancestors=None):
    if ancestors is None:
        ancestors = []
    for child in root:
        child_id = child.get('id', '')
        child_transform = child.get('transform', '')
        new_ancestors = ancestors + [(child_id, child_transform)]
        if child_id == target_id:
            return child, new_ancestors
        result = find_with_ancestors(child, target_id, new_ancestors)
        if result:
            return result
    return None

print(f'SVG size: {root.get("width")} x {root.get("height")}')
print()

for card_id in CARD_IDS:
    result = find_with_ancestors(root, card_id)
    if result is None:
        print(f'{card_id}: NOT FOUND')
        continue

    el, ancestors = result

    # Sum up all ancestor translates
    total_tx, total_ty = 0.0, 0.0
    for (aid, atransform) in ancestors:
        tx, ty = parse_translate(atransform)
        total_tx += tx
        total_ty += ty

    # Find the card body rect inside this group
    rect = None
    for child in el.iter(f'{{{svg_ns}}}rect'):
        cid = child.get('id', '')
        if 'card_body' in cid or 'use7556' in cid or cid.startswith('use'):
            rect = child
            break
    if rect is None:
        # Take first rect
        rect = el.find(f'.//{{{svg_ns}}}rect')

    if rect is not None:
        rx = float(rect.get('x', 0))
        ry = float(rect.get('y', 0))
        rw = rect.get('width', '?')
        rh = rect.get('height', '?')
        vx = total_tx + rx
        vy = total_ty + ry
        print(f'{card_id:20s} translate=({total_tx:.1f}, {total_ty:.1f})  rect=({rx:.1f},{ry:.1f})  viewport=({vx:.1f}, {vy:.1f})  size={rw}x{rh}')
    else:
        print(f'{card_id:20s} translate=({total_tx:.1f}, {total_ty:.1f})  no rect found')
        print(f'  ancestors: {[(a[0], a[1][:40] if a[1] else "") for a in ancestors[-3:]]}')
