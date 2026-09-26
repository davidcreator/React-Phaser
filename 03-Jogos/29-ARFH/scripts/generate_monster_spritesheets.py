#!/usr/bin/env python3
"""Generate four editable, non-graphic pixel-art monster spritesheets.

Each SVG/PNG is a four-frame horizontal walk cycle using 64 x 64 frames.
"""
from __future__ import annotations

from html import escape
import argparse
import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "sprites" / "monsters"
FRAME_W = 64
FRAME_H = 64
FRAMES = 4

POSES = [
    {"left_leg": -3, "right_leg": 3, "left_arm": 2, "right_arm": -2, "bob": 0},
    {"left_leg": -1, "right_leg": 1, "left_arm": 0, "right_arm": 0, "bob": -1},
    {"left_leg": 3, "right_leg": -3, "left_arm": -2, "right_arm": 2, "bob": 0},
    {"left_leg": 1, "right_leg": -1, "left_arm": 0, "right_arm": 0, "bob": -1},
]

MONSTERS = {
    "errante": {
        "kind": "walker", "name": "Errante",
        "outline": "#202a25", "skin": "#627b57", "skin_hi": "#9daa70", "skin_shadow": "#3e5445",
        "cloth": "#735d45", "cloth_hi": "#b18a55", "pants": "#414d43", "detail": "#bdc08b", "eyes": "#efd26c",
    },
    "corredor": {
        "kind": "runner", "name": "Corredor",
        "outline": "#242a27", "skin": "#777a63", "skin_hi": "#b1ae7b", "skin_shadow": "#515b50",
        "cloth": "#58625a", "cloth_hi": "#a35e3b", "pants": "#3c4844", "detail": "#c9b870", "eyes": "#f1d977",
    },
    "saltador": {
        "kind": "leaper", "name": "Saltador",
        "outline": "#202a28", "skin": "#5e7e77", "skin_hi": "#a7c0a0", "skin_shadow": "#3a5b58",
        "cloth": "#6d6451", "cloth_hi": "#b3955c", "pants": "#3b4c49", "detail": "#d1c37b", "eyes": "#f3d77b",
    },
    "blindado": {
        "kind": "armored", "name": "Blindado",
        "outline": "#252a26", "skin": "#6c6e56", "skin_hi": "#a9a377", "skin_shadow": "#454e43",
        "cloth": "#554f40", "cloth_hi": "#a08c58", "pants": "#363f3b", "detail": "#d0b758", "eyes": "#f0cf63",
    },
}


def rect(x: int, y: int, w: int, h: int, color: str) -> str:
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}"/>'


def poly(points: list[tuple[int, int]], color: str, outline: str | None = None) -> str:
    coords = " ".join(f"{x},{y}" for x, y in points)
    edge = f' stroke="{outline}" stroke-width="2" stroke-linejoin="miter"' if outline else ""
    return f'<polygon points="{coords}" fill="{color}"{edge}/>'


def path(d: str, color: str) -> str:
    return f'<path d="{d}" fill="{color}"/>'


def draw_legs(p: dict, pose: dict, top: int = 41, wide: int = 7, boot: int = 10) -> str:
    left, right = pose["left_leg"], pose["right_leg"]
    o, pants, hi, skin = p["outline"], p["pants"], p["cloth_hi"], p["skin"]
    return (
        poly([(24, top), (31, top), (31 + left, 56), (26 + left, 59), (21 + left, 54)], pants, o)
        + poly([(34, top), (41, top), (43 + right, 54), (38 + right, 59), (33 + right, 55)], pants, o)
        + rect(23 + left, 49, 3, 7, hi)
        + rect(36 + right, 49, 3, 6, skin)
        + poly([(17 + left, 56), (28 + left, 56), (30 + left, 61), (17 + left, 61)], o)
        + rect(18 + left, 56, boot, 2, hi)
        + poly([(33 + right, 56), (45 + right, 56), (47 + right, 61), (34 + right, 61)], o)
        + rect(35 + right, 56, boot, 2, hi)
    )


def draw_arms(p: dict, pose: dict) -> str:
    o, skin, shade, hi = p["outline"], p["skin"], p["skin_shadow"], p["skin_hi"]
    la, ra = pose["left_arm"], pose["right_arm"]
    return (
        poly([(22, 28), (17, 29), (12 + la, 37), (14 + la, 41), (19, 38), (25, 33)], shade, o)
        + poly([(42, 28), (47, 29), (52 + ra, 36), (50 + ra, 40), (45, 37), (39, 33)], skin, o)
        + rect(12 + la, 38, 5, 4, hi)
        + rect(48 + ra, 37, 5, 4, hi)
    )


def draw_head(p: dict, kind: str, bob: int) -> str:
    o, skin, hi, shade, eyes = p["outline"], p["skin"], p["skin_hi"], p["skin_shadow"], p["eyes"]
    y = 7 + bob
    head = (
        poly([(22, y), (39, y), (39, y + 3), (44, y + 3), (44, y + 8), (47, y + 8),
              (47, y + 19), (43, y + 19), (43, y + 24), (39, y + 27), (25, y + 27),
              (20, y + 23), (17, y + 19), (17, y + 10), (20, y + 10)], o)
        + poly([(23, y + 3), (38, y + 3), (38, y + 6), (42, y + 6), (43, y + 10),
                (44, y + 18), (40, y + 22), (26, y + 23), (21, y + 19), (20, y + 11)], skin)
        + rect(23, y + 5, 5, 3, hi)
        + rect(30, y + 7, 3, 2, shade)
        + rect(21, y + 15, 4, 4, shade)
        + rect(39, y + 15, 4, 4, shade)
        + rect(22, y + 14, 3, 2, eyes)
        + rect(40, y + 14, 3, 2, eyes)
        + rect(23, y + 14, 1, 1, o)
        + rect(41, y + 14, 1, 1, o)
        + rect(31, y + 19, 5, 2, o)
    )
    if kind == "walker":
        head += poly([(18, y + 5), (22, y + 3), (24, y + 8), (20, y + 13)], p["cloth"], o)
        head += rect(36, y + 23, 6, 2, p["detail"])
    elif kind == "runner":
        head += poly([(19, y + 9), (16, y + 13), (20, y + 16)], p["cloth_hi"])
        head += rect(42, y + 10, 4, 3, hi)
    elif kind == "leaper":
        head += poly([(21, y + 7), (18, y - 1), (26, y + 5)], p["detail"], o)
        head += poly([(38, y + 6), (44, y - 1), (43, y + 9)], p["detail"], o)
        head += rect(28, y + 3, 6, 3, hi)
    else:
        head += rect(18, y + 9, 4, 11, p["cloth_hi"])
        head += rect(42, y + 9, 4, 11, p["cloth_hi"])
        head += rect(25, y + 21, 16, 4, p["detail"])
    return head


def draw_torso(p: dict, kind: str) -> str:
    o, skin, hi, shade = p["outline"], p["skin"], p["cloth_hi"], p["skin_shadow"]
    cloth, detail = p["cloth"], p["detail"]
    if kind == "runner":
        torso = poly([(22, 27), (40, 27), (44, 31), (42, 44), (39, 49), (22, 46), (19, 41)], cloth, o)
        torso += poly([(25, 29), (38, 29), (40, 33), (37, 38), (25, 36)], skin)
        torso += path("M22 39l8 2 7-1 4 3-2 4-17-2z", shade)
        torso += poly([(23, 29), (29, 31), (27, 35), (21, 34)], hi)
        torso += rect(34, 40, 6, 3, detail)
    elif kind == "leaper":
        torso = poly([(21, 28), (42, 28), (46, 34), (43, 44), (47, 48), (42, 51), (20, 48), (17, 42)], skin, o)
        torso += poly([(25, 30), (37, 30), (40, 35), (36, 40), (24, 39)], hi)
        torso += rect(21, 39, 5, 6, shade)
        torso += rect(37, 42, 5, 4, cloth)
        torso += rect(29, 43, 5, 3, detail)
    elif kind == "armored":
        torso = poly([(19, 28), (44, 28), (49, 34), (46, 48), (42, 52), (20, 52), (15, 47), (15, 34)], cloth, o)
        torso += poly([(21, 31), (42, 31), (43, 44), (39, 48), (22, 48), (19, 43)], p["skin_shadow"])
        torso += poly([(15, 29), (23, 27), (28, 33), (26, 40), (16, 39)], hi, o)
        torso += poly([(40, 28), (48, 31), (49, 40), (42, 42), (38, 36)], detail, o)
        torso += rect(28, 34, 12, 4, p["metal"] if "metal" in p else p["detail"])
        torso += rect(25, 42, 15, 3, hi)
    else:
        torso = poly([(22, 28), (41, 28), (45, 33), (43, 47), (39, 52), (21, 50), (17, 44), (18, 34)], cloth, o)
        torso += poly([(23, 30), (39, 30), (41, 42), (37, 47), (23, 46), (20, 41)], skin)
        torso += poly([(19, 32), (25, 30), (27, 35), (23, 39), (18, 37)], hi)
        torso += rect(28, 38, 5, 4, shade)
        torso += rect(35, 43, 5, 3, detail)
        torso += path("M18 46h6l-3 8h-5zM39 47h5l4 7h-7z", cloth)
    return torso


def detail_marks(p: dict, kind: str, frame: int) -> str:
    detail, hi, shade, outline = p["detail"], p["cloth_hi"], p["skin_shadow"], p["outline"]
    marks = rect(25, 33, 2, 2, hi) + rect(37, 34, 2, 2, shade)
    if kind == "walker":
        marks += rect(24 + (frame % 2), 42, 4, 3, p["skin_hi"])
        marks += rect(33, 46, 6, 2, p["cloth_hi"])
        marks += rect(19, 52, 4, 3, outline)
    elif kind == "runner":
        marks += rect(24, 37, 12, 2, p["cloth_hi"])
        marks += rect(28, 42, 5, 2, detail)
        marks += rect(38, 45, 4, 3, outline)
    elif kind == "leaper":
        marks += rect(23, 41, 4, 5, hi)
        marks += rect(38, 40, 4, 4, shade)
        marks += rect(29, 47, 6, 3, detail)
    else:
        marks += rect(19, 36, 6, 3, detail)
        marks += rect(41, 36, 5, 3, hi)
        marks += rect(30, 42, 8, 4, outline)
        marks += rect(32, 43, 4, 2, p["eyes"])
    return marks


def frame_svg(monster_id: str, p: dict, frame: int) -> str:
    pose = POSES[frame]
    kind = p["kind"]
    # Leaper alternates a tucked and extended crouch; the game also animates its hop vertically.
    bob = pose["bob"] + (-1 if kind == "leaper" and frame in (1, 3) else 0)
    art = draw_legs(p, pose)
    art += draw_arms(p, pose)
    art += draw_torso(p, kind)
    art += detail_marks(p, kind, frame)
    art += draw_head(p, kind, bob)
    if kind == "walker":
        art += rect(16 + frame % 2, 34, 4, 5, p["cloth_hi"])
        art += rect(45, 37 + (frame % 2), 3, 4, p["skin_hi"])
        art += rect(30, 52, 4, 2, p["detail"])
    elif kind == "runner":
        art += path("M18 30l-7 4-5 1 3 3 7-2z", p["cloth_hi"])
        art += rect(22, 31, 3, 3, p["eyes"])
    elif kind == "leaper":
        art += rect(14, 44, 7, 4, p["detail"])
        art += rect(43, 44, 7, 4, p["detail"])
        art += rect(28, 28, 8, 2, p["skin_hi"])
    else:
        art += rect(14, 32, 7, 8, p["cloth_hi"])
        art += rect(43, 32, 7, 8, p["cloth_hi"])
        art += rect(25, 46, 4, 3, p["detail"])
    return f'<g id="frame-{frame}" transform="translate({frame * FRAME_W} 0)" shape-rendering="crispEdges">{art}</g>'


def make_svg(monster_id: str, p: dict) -> str:
    frames = "\n".join(frame_svg(monster_id, p, frame) for frame in range(FRAMES))
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{FRAME_W * FRAMES}" height="{FRAME_H}" '
        f'viewBox="0 0 {FRAME_W * FRAMES} {FRAME_H}" shape-rendering="crispEdges">\n'
        f' <title>{escape(p["name"])} — spritesheet pixel art</title>\n'
        ' <desc>Quatro quadros transparentes de caminhada, 64 por 64 pixels cada.\n'
        ' Silhueta fantástica, estilizada e não gráfica; fonte vetorial editável.</desc>\n'
        f' {frames}\n'
        '</svg>\n'
    )


def rasterize(svg_path: Path, png_path: Path) -> None:
    magick, convert = shutil.which("magick"), shutil.which("convert")
    if magick:
        command = [magick, "-background", "none", str(svg_path), str(png_path)]
    elif convert:
        command = [convert, "-background", "none", str(svg_path), str(png_path)]
    else:
        raise SystemExit("ImageMagick (magick ou convert) é necessário para exportar os PNGs.")
    subprocess.run(command, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--force",
        action="store_true",
        help="recreate editable SVGs from the Python templates, replacing manual edits",
    )
    args = parser.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {"frameWidth": FRAME_W, "frameHeight": FRAME_H, "frameCount": FRAMES, "layout": "horizontal", "monsters": []}
    for monster_id, p in MONSTERS.items():
        svg_path = OUT / f"{monster_id}.svg"
        png_path = OUT / f"{monster_id}.png"
        if args.force or not svg_path.exists():
            svg_path.write_text(make_svg(monster_id, p), encoding="utf-8")
        rasterize(svg_path, png_path)
        manifest["monsters"].append({
            "id": monster_id, "kind": p["kind"], "name": p["name"],
            "png": png_path.name, "svg": svg_path.name,
        })
        print(f"{p['name']}: {FRAME_W * FRAMES}x{FRAME_H} -> {png_path.relative_to(ROOT)}")
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
