#!/usr/bin/env python3
"""Build editable, Tiled-compatible 32 px tilesets for the four campaign stages.

Each stage receives an SVG source, a transparent PNG atlas, a Tiled TSX file,
and a JSON manifest with stable tile IDs shared across all four atlases.
"""
from __future__ import annotations

from html import escape
import argparse
import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "tilesets" / "stages"
TILE = 32
COLS = 8
ROWS = 6
WIDTH = TILE * COLS
HEIGHT = TILE * ROWS

TILES = [
    ("asfalto_base", "Asfalto base", "pavimento"),
    ("asfalto_trincado", "Asfalto trincado", "pavimento"),
    ("asfalto_remendado", "Asfalto remendado", "pavimento"),
    ("faixa_central", "Faixa central", "pavimento"),
    ("borda_asfalto", "Borda do asfalto", "pavimento"),
    ("terra_compactada", "Terra compactada", "terreno"),
    ("brita", "Brita", "terreno"),
    ("entulho", "Entulho baixo", "terreno"),
    ("concreto", "Concreto", "pavimento"),
    ("concreto_quebrado", "Concreto rachado", "pavimento"),
    ("chapa_metal", "Chapa metálica", "pavimento"),
    ("chapa_enferrujada", "Chapa enferrujada", "pavimento"),
    ("lama", "Lama", "terreno"),
    ("grama", "Grama", "terreno"),
    ("marcas_pneu", "Marcas de pneu", "terreno"),
    ("grade_drenagem", "Grade de drenagem", "pavimento"),
    ("muro", "Muro baixo", "estrutura"),
    ("muro_rachado", "Muro rachado", "estrutura"),
    ("barreira_concreto", "Barreira de concreto", "estrutura"),
    ("guardrail", "Guardrail", "estrutura"),
    ("bloqueio", "Bloqueio de estrada", "estrutura"),
    ("rampa", "Rampa de sucata", "estrutura"),
    ("pilar", "Pilar de sustentação", "estrutura"),
    ("borda_quebrada", "Borda de ponte quebrada", "estrutura"),
    ("tambor", "Tambor", "objeto"),
    ("caixa", "Caixa de suprimentos", "objeto"),
    ("pilha_sucata", "Pilha de sucata", "objeto"),
    ("cone", "Cone de sinalização", "objeto"),
    ("placa_rota", "Placa de rota", "objeto"),
    ("bomba", "Bomba de combustível abandonada", "objeto"),
    ("poste", "Poste de iluminação", "objeto"),
    ("destroco", "Destroços", "objeto"),
    ("marco_a", "Marco de fase A", "marco"),
    ("marco_b", "Marco de fase B", "marco"),
    ("marco_c", "Marco de fase C", "marco"),
    ("marco_d", "Marco de fase D", "marco"),
    ("marco_e", "Marco de fase E", "marco"),
    ("marco_f", "Marco de fase F", "marco"),
    ("marco_g", "Marco de fase G", "marco"),
    ("marco_h", "Marco de fase H", "marco"),
    ("arbusto", "Arbusto", "vegetação"),
    ("arvore_seca", "Árvore seca", "vegetação"),
    ("arvore", "Árvore", "vegetação"),
    ("cipos", "Cipós", "vegetação"),
    ("pedregulho", "Pedregulho", "rocha"),
    ("rocha", "Rocha", "rocha"),
    ("refletor", "Refletor", "objeto"),
    ("placa_quebrada", "Placa quebrada", "objeto"),
]

STAGES = {
    "posto-7": {
        "name": "Posto 7",
        "region": "Anel Velho",
        "palette": {
            "road": "#343d3d", "road2": "#46504b", "road_hi": "#667166",
            "ground": "#596047", "ground2": "#7a7954", "concrete": "#777c6c",
            "metal": "#515c57", "metal_hi": "#93a087", "rust": "#995735",
            "accent": "#d4aa4a", "light": "#d5d8bf", "dark": "#242c2a",
            "plant": "#687b4e", "plant2": "#98a269", "sky": "#b1c6b2",
        },
        "landmarks": "urban",
    },
    "viaduto-caido": {
        "name": "Viaduto Caído",
        "region": "Anel Velho",
        "palette": {
            "road": "#303938", "road2": "#424b49", "road_hi": "#6e7770",
            "ground": "#4f5a53", "ground2": "#72776c", "concrete": "#858b82",
            "metal": "#4b5959", "metal_hi": "#a3aca0", "rust": "#9b5639",
            "accent": "#d38b42", "light": "#d1d6ca", "dark": "#222a29",
            "plant": "#62775d", "plant2": "#869778", "sky": "#a8b8b9",
        },
        "landmarks": "bridge",
    },
    "patio-sucata": {
        "name": "Pátio de Sucata",
        "region": "Pedreira Clara",
        "palette": {
            "road": "#393b38", "road2": "#514d43", "road_hi": "#81745b",
            "ground": "#766746", "ground2": "#a48a5c", "concrete": "#857c68",
            "metal": "#555c56", "metal_hi": "#a29875", "rust": "#a95733",
            "accent": "#e0b94e", "light": "#e1d1a3", "dark": "#292d2a",
            "plant": "#718054", "plant2": "#a2a266", "sky": "#c8b993",
        },
        "landmarks": "scrapyard",
    },
    "saida-anel": {
        "name": "Saída do Anel",
        "region": "Cinturão Verde",
        "palette": {
            "road": "#323d3b", "road2": "#43534a", "road_hi": "#71816d",
            "ground": "#405640", "ground2": "#65734c", "concrete": "#727b70",
            "metal": "#46554e", "metal_hi": "#9aa988", "rust": "#8f563a",
            "accent": "#d0bd64", "light": "#cbd5b2", "dark": "#202c29",
            "plant": "#48694d", "plant2": "#78945d", "sky": "#94b2a2",
        },
        "landmarks": "greenbelt",
    },
}


def rect(x: int, y: int, w: int, h: int, color: str, stroke: str | None = None, sw: int = 1) -> str:
    edge = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}"{edge}/>'


def path(d: str, color: str, stroke: str | None = None, sw: int = 1) -> str:
    edge = f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="miter"' if stroke else ""
    return f'<path d="{d}" fill="{color}"{edge}/>'


def line(d: str, color: str, sw: int = 1) -> str:
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="square"/>'


def ellipse(x: int, y: int, rx: int, ry: int, color: str, stroke: str | None = None, sw: int = 1) -> str:
    edge = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{color}"{edge}/>'


def texture_specks(tile_id: int, colors: list[str], count: int = 16, low: int = 2, high: int = 2) -> str:
    # Keep a one-pixel quiet border so texture variants join cleanly at tile edges.
    items = []
    seed = tile_id * 23 + 17
    for i in range(count):
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        x = 2 + seed % 27
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        y = 2 + seed % 27
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        w = low + seed % max(1, high - low + 1)
        h = 1 + (seed >> 5) % 2
        color = colors[i % len(colors)]
        items.append(rect(x, y, min(w, 31 - x), h, color))
    return "".join(items)


def landmark(tile_id: int, mode: str, p: dict[str, str]) -> str:
    d, m, mh, rust, a, light, dark, plant, plant2 = (
        p["dark"], p["metal"], p["metal_hi"], p["rust"], p["accent"],
        p["light"], p["dark"], p["plant"], p["plant2"],
    )
    if mode == "urban":
        options = [
            rect(2, 14, 28, 18, d) + rect(5, 18, 9, 14, m) + rect(17, 17, 11, 15, p["concrete"]) + rect(7, 20, 4, 4, a) + rect(19, 20, 4, 5, light),
            rect(3, 6, 26, 5, mh) + rect(7, 11, 18, 4, m) + rect(9, 15, 5, 17, d) + rect(19, 15, 5, 17, d) + rect(11, 17, 3, 3, a) + rect(20, 19, 3, 8, rust),
            rect(3, 18, 26, 14, m) + rect(6, 8, 9, 12, p["concrete"]) + rect(17, 11, 9, 9, mh) + rect(7, 11, 4, 4, light) + rect(19, 14, 4, 4, a),
            rect(2, 13, 28, 19, p["concrete"]) + rect(5, 17, 9, 15, d) + rect(17, 16, 10, 16, m) + rect(20, 7, 6, 9, rust),
            rect(4, 9, 24, 23, d) + rect(7, 12, 8, 20, m) + rect(17, 17, 9, 15, mh) + rect(9, 15, 4, 4, light) + rect(19, 20, 4, 3, a),
            rect(5, 5, 22, 4, rust) + rect(8, 9, 4, 23, d) + rect(21, 9, 4, 23, d) + rect(11, 13, 10, 12, p["concrete"]) + rect(13, 16, 6, 3, a),
            rect(2, 21, 28, 11, m) + rect(7, 12, 8, 19, mh) + rect(18, 7, 7, 24, d) + rect(8, 15, 4, 4, a) + rect(20, 10, 3, 3, rust),
            rect(4, 7, 24, 4, a) + rect(9, 11, 4, 21, d) + rect(21, 11, 4, 21, d) + rect(12, 17, 8, 7, p["concrete"]) + rect(13, 19, 5, 2, light),
        ]
    elif mode == "bridge":
        options = [
            rect(2, 7, 28, 7, p["concrete"]) + rect(5, 14, 5, 18, d) + rect(22, 14, 5, 18, d) + line("M10 18h12M10 23h12M10 28h12", mh, 2),
            rect(4, 7, 24, 8, m) + rect(8, 15, 4, 17, d) + rect(20, 15, 4, 17, d) + line("M12 17l4 5 4-5", rust, 2) + rect(13, 26, 7, 4, a),
            rect(1, 14, 30, 7, p["concrete"]) + rect(4, 21, 4, 11, d) + rect(24, 21, 4, 11, d) + rect(9, 10, 6, 4, rust) + rect(19, 8, 8, 6, m),
            rect(3, 18, 26, 14, m) + rect(7, 8, 5, 24, d) + rect(21, 7, 5, 25, d) + path("M12 12l8 8-3 4-6-6z", rust) + rect(14, 25, 5, 3, a),
            rect(4, 4, 24, 7, p["concrete"]) + rect(7, 11, 5, 21, d) + rect(20, 11, 5, 21, d) + rect(13, 16, 7, 3, mh) + rect(14, 24, 7, 3, rust),
            rect(2, 22, 28, 10, d) + rect(5, 10, 6, 22, m) + rect(21, 6, 6, 26, m) + line("M11 15h10M11 20h10", a, 2),
            rect(3, 8, 26, 8, p["concrete"]) + rect(5, 16, 6, 16, d) + rect(21, 16, 6, 16, d) + rect(13, 18, 7, 4, rust) + rect(13, 26, 7, 3, mh),
            rect(1, 19, 30, 13, d) + rect(5, 8, 5, 24, m) + rect(22, 11, 5, 21, m) + path("M10 13l8 5-3 4-5-3z", rust) + rect(17, 26, 4, 3, a),
        ]
    elif mode == "scrapyard":
        options = [
            rect(2, 24, 28, 8, d) + rect(5, 13, 22, 11, m) + rect(8, 7, 15, 6, rust) + ellipse(9, 26, 4, 4, d, mh, 2) + ellipse(23, 26, 4, 4, d, mh, 2),
            rect(3, 8, 26, 4, mh) + rect(7, 12, 3, 20, d) + rect(22, 12, 3, 20, d) + line("M10 16h12M10 20h12", rust, 2) + rect(13, 14, 6, 5, a),
            rect(3, 23, 26, 9, m) + rect(6, 17, 9, 8, rust) + rect(15, 12, 11, 13, mh) + rect(18, 8, 5, 5, a) + line("M8 28h16", d, 2),
            rect(4, 7, 5, 25, d) + rect(23, 7, 5, 25, d) + rect(3, 6, 27, 5, rust) + rect(8, 14, 16, 4, mh) + line("M10 19h12M12 24h8", a, 2),
            rect(3, 19, 26, 13, m) + rect(7, 12, 9, 8, rust) + rect(17, 8, 11, 12, mh) + rect(19, 11, 6, 4, a) + line("M6 26h20", d, 2),
            rect(4, 10, 24, 22, d) + rect(7, 13, 18, 6, rust) + rect(8, 21, 5, 7, mh) + rect(18, 21, 6, 7, m) + rect(14, 15, 4, 13, a),
            rect(2, 24, 28, 8, d) + rect(7, 18, 18, 8, m) + rect(10, 12, 12, 6, rust) + rect(13, 6, 6, 8, mh) + line("M5 29h22", a, 2),
            rect(4, 25, 24, 7, d) + path("M5 25l4-10h5l3 7 4-12h5l4 15z", m) + rect(9, 17, 4, 3, rust) + rect(21, 15, 4, 3, a),
        ]
    else:
        options = [
            rect(4, 17, 24, 15, d) + rect(7, 20, 18, 12, m) + path("M7 21h18v9H7z", plant) + rect(10, 23, 4, 4, plant2) + rect(19, 24, 3, 5, light),
            rect(3, 25, 26, 7, d) + rect(7, 11, 5, 21, p["concrete"]) + rect(20, 11, 5, 21, p["concrete"]) + path("M7 12h18v3H7z", plant) + line("M12 19h8M12 24h8", plant2, 2),
            rect(2, 24, 28, 8, d) + rect(5, 14, 6, 18, m) + rect(21, 14, 6, 18, m) + rect(10, 12, 12, 8, plant) + rect(13, 14, 5, 3, a),
            rect(3, 7, 26, 5, rust) + rect(7, 12, 4, 20, d) + rect(21, 12, 4, 20, d) + line("M11 16h10M11 22h10", plant2, 2) + rect(15, 27, 3, 5, a),
            rect(4, 20, 24, 12, d) + rect(8, 10, 7, 12, p["concrete"]) + rect(17, 14, 8, 8, m) + rect(9, 12, 4, 4, plant2) + rect(19, 16, 4, 3, a),
            rect(2, 23, 28, 9, d) + rect(5, 14, 6, 11, m) + rect(12, 9, 8, 16, plant) + rect(21, 16, 6, 9, p["concrete"]) + rect(14, 13, 4, 4, plant2),
            rect(3, 21, 26, 11, d) + rect(6, 15, 6, 11, m) + rect(14, 8, 5, 18, plant) + rect(21, 13, 6, 13, p["concrete"]) + rect(15, 12, 3, 4, a),
            rect(4, 22, 24, 10, d) + rect(7, 15, 18, 8, m) + rect(11, 10, 10, 9, plant) + rect(14, 12, 4, 3, a) + line("M8 26h16", plant2, 2),
        ]
    return options[(tile_id - 32) % len(options)]


def draw_tile(tile_id: int, p: dict[str, str], mode: str) -> str:
    road, road2, road_hi = p["road"], p["road2"], p["road_hi"]
    ground, ground2, concrete = p["ground"], p["ground2"], p["concrete"]
    metal, metal_hi, rust = p["metal"], p["metal_hi"], p["rust"]
    accent, light, dark = p["accent"], p["light"], p["dark"]
    plant, plant2 = p["plant"], p["plant2"]
    if tile_id == 0:
        return rect(0, 0, 32, 32, road) + texture_specks(0, [road2, road_hi], 14, 1, 3) + rect(1, 2, 3, 1, road_hi)
    if tile_id == 1:
        return rect(0, 0, 32, 32, road) + texture_specks(1, [road2, road_hi], 12, 1, 2) + line("M6 4l4 4-2 5 4 3-5 5 2 6", dark, 2) + rect(18, 21, 8, 2, road2)
    if tile_id == 2:
        return rect(0, 0, 32, 32, road) + rect(4, 6, 12, 7, road2) + rect(16, 6, 12, 7, road_hi) + rect(3, 17, 10, 9, road_hi) + rect(15, 17, 13, 9, road2) + line("M4 15h24", dark, 1)
    if tile_id == 3:
        return rect(0, 0, 32, 32, road) + rect(3, 14, 20, 4, accent) + rect(4, 15, 18, 1, light)
    if tile_id == 4:
        return rect(0, 0, 32, 32, road) + rect(0, 0, 5, 32, road_hi) + rect(5, 0, 2, 32, accent) + texture_specks(4, [road2], 8, 1, 2)
    if tile_id == 5:
        return rect(0, 0, 32, 32, ground) + texture_specks(5, [ground2, road2], 15, 1, 3) + rect(5, 6, 5, 2, ground2)
    if tile_id == 6:
        return rect(0, 0, 32, 32, ground2) + texture_specks(6, [concrete, light, dark], 18, 1, 2) + path("M6 9l4-3 3 4-4 3z", rust)
    if tile_id == 7:
        return rect(0, 0, 32, 32, ground) + path("M2 27l3-8 6-2 2-8 5 3 3-6 7 5 3 16z", ground2) + rect(8, 22, 5, 3, rust) + rect(19, 17, 4, 3, concrete) + rect(25, 24, 3, 2, metal)
    if tile_id == 8:
        return rect(0, 0, 32, 32, concrete) + rect(0, 0, 32, 2, metal_hi) + texture_specks(8, [metal, light], 10, 1, 2)
    if tile_id == 9:
        return rect(0, 0, 32, 32, concrete) + line("M5 2l4 8-3 5 6 5-4 10", dark, 2) + line("M9 10l8-3M12 20l8 3", rust, 1) + rect(22, 4, 5, 3, light)
    if tile_id == 10:
        return rect(0, 0, 32, 32, metal) + rect(1, 1, 30, 30, "none", metal_hi, 2) + line("M2 9h28M2 20h28", dark, 1) + rect(4, 4, 2, 2, accent) + rect(26, 4, 2, 2, accent) + rect(4, 26, 2, 2, accent)
    if tile_id == 11:
        return rect(0, 0, 32, 32, metal) + path("M2 18h9l3-9h5l2 6h9v9H2z", rust) + line("M3 8h9M22 5h6", metal_hi, 2) + rect(5, 23, 8, 2, dark)
    if tile_id == 12:
        return rect(0, 0, 32, 32, ground) + path("M2 21l6-4 5 2 6-5 5 3 6-2v13H2z", dark) + rect(8, 21, 4, 2, road_hi) + rect(20, 24, 7, 2, ground2)
    if tile_id == 13:
        return rect(0, 0, 32, 32, ground) + texture_specks(13, [ground2], 8, 1, 2) + path("M2 29l3-8 3 8 4-12 4 12 4-9 4 9 4-14 4 14z", plant) + rect(4, 24, 4, 3, plant2) + rect(21, 21, 4, 3, plant2)
    if tile_id == 14:
        return rect(0, 0, 32, 32, ground) + path("M5 0h5l4 7-2 3h-5l-4-7zM22 0h5l4 7-2 3h-5l-4-7zM2 17h5l4 7-2 3H4l-4-7zM20 17h5l4 7-2 3h-5l-4-7z", road2) + texture_specks(14, [ground2], 7, 1, 2)
    if tile_id == 15:
        return rect(0, 0, 32, 32, road) + rect(4, 8, 24, 16, dark) + rect(5, 9, 22, 2, metal_hi) + rect(5, 14, 22, 2, metal) + rect(5, 19, 22, 2, metal_hi) + rect(5, 23, 22, 1, metal)
    if tile_id == 16:
        return rect(0, 0, 32, 32, "none") + rect(1, 10, 30, 22, concrete) + rect(1, 9, 30, 3, metal_hi) + line("M4 18h6M17 24h10", dark, 2) + rect(4, 26, 3, 3, rust)
    if tile_id == 17:
        return rect(0, 0, 32, 32, "none") + rect(1, 10, 30, 22, concrete) + rect(1, 9, 30, 3, metal_hi) + line("M8 12l3 5-2 5 6 4-2 6M11 17l-5 2M15 26l6-2", dark, 2) + rect(23, 14, 4, 3, rust)
    if tile_id == 18:
        return path("M1 31V14l4-6h22l4 6v17z", concrete, dark, 2) + line("M4 16h24M9 17v11M22 17v11", metal_hi, 2) + rect(13, 20, 6, 4, accent)
    if tile_id == 19:
        return rect(0, 0, 32, 32, "none") + rect(0, 17, 32, 4, metal) + rect(0, 25, 32, 3, metal_hi) + rect(4, 21, 3, 11, dark) + rect(24, 21, 3, 11, dark) + rect(8, 18, 5, 2, accent) + rect(19, 18, 5, 2, accent)
    if tile_id == 20:
        return rect(0, 0, 32, 32, "none") + rect(2, 22, 28, 8, dark) + rect(5, 13, 5, 10, rust) + rect(12, 13, 5, 10, accent) + rect(19, 13, 5, 10, rust) + rect(26, 13, 4, 10, accent) + rect(4, 29, 3, 3, metal) + rect(25, 29, 3, 3, metal)
    if tile_id == 21:
        return rect(0, 0, 32, 32, "none") + path("M1 29L29 7l3 4L5 31z", rust, dark, 1) + line("M4 27l4 2M11 22l4 3M18 17l4 3M24 12l4 3", accent, 2) + rect(1, 29, 8, 3, metal)
    if tile_id == 22:
        return rect(0, 0, 32, 32, "none") + rect(3, 3, 26, 6, concrete) + rect(7, 9, 18, 23, concrete) + rect(10, 12, 3, 17, dark) + rect(19, 12, 3, 17, dark) + rect(5, 29, 22, 3, metal_hi)
    if tile_id == 23:
        return rect(0, 0, 32, 32, "none") + path("M0 8h22v5h-7v5h-5v5H5v9H0z", concrete, dark, 2) + rect(21, 8, 7, 3, rust) + path("M22 13l3 4-2 4 5 5-2 5", dark, None)
    if tile_id == 24:
        return rect(0, 0, 32, 32, "none") + rect(9, 7, 14, 23, rust, dark, 2) + rect(11, 4, 10, 4, metal_hi) + rect(11, 11, 10, 3, accent) + rect(12, 19, 8, 2, dark) + rect(9, 27, 14, 3, dark)
    if tile_id == 25:
        return rect(0, 0, 32, 32, "none") + rect(5, 12, 22, 17, rust, dark, 2) + rect(5, 11, 22, 4, metal_hi) + line("M8 16v11M16 16v11M24 16v11", dark, 2) + rect(3, 28, 26, 3, dark)
    if tile_id == 26:
        return rect(0, 0, 32, 32, "none") + path("M2 28h28v4H2zM4 24l3-9h8l4 7 3-13h7l2 15z", metal, dark, 1) + rect(7, 18, 5, 3, rust) + rect(20, 14, 4, 3, accent) + rect(15, 25, 9, 3, metal_hi)
    if tile_id == 27:
        return rect(0, 0, 32, 32, "none") + path("M13 6h6l7 23H6z", accent, dark, 2) + rect(10, 18, 12, 4, light) + rect(8, 28, 16, 3, dark)
    if tile_id == 28:
        return rect(0, 0, 32, 32, "none") + rect(15, 17, 3, 14, dark) + path("M4 4h25v14H4z", p["sky"], dark, 2) + line("M8 8h16M8 12h11", dark, 2) + path("M21 8l4 4-4 4", accent, None)
    if tile_id == 29:
        return rect(0, 0, 32, 32, "none") + rect(8, 5, 17, 25, metal, dark, 2) + rect(11, 8, 11, 8, p["sky"]) + rect(13, 10, 5, 3, light) + rect(17, 18, 5, 9, rust) + rect(7, 29, 20, 3, dark) + rect(11, 20, 4, 4, accent)
    if tile_id == 30:
        return rect(0, 0, 32, 32, "none") + rect(14, 4, 4, 28, dark) + rect(5, 4, 22, 4, metal) + rect(7, 8, 18, 2, metal_hi) + rect(9, 12, 14, 4, accent) + rect(12, 29, 8, 3, dark)
    if tile_id == 31:
        return rect(0, 0, 32, 32, "none") + path("M2 28l5-12 6 3 5-12 5 7 7-4 2 18z", metal, dark, 1) + rect(5, 24, 7, 3, rust) + rect(18, 20, 8, 3, accent) + rect(11, 12, 3, 3, light)
    if tile_id in range(32, 40):
        return rect(0, 0, 32, 32, "none") + landmark(tile_id, mode, p)
    if tile_id == 40:
        return rect(0, 0, 32, 32, "none") + path("M2 30v-7h4v-6h4v-6h5v5h4v-7h5v7h4v6h3v8z", plant, dark, 1) + rect(7, 19, 4, 3, plant2) + rect(19, 15, 4, 3, plant2)
    if tile_id == 41:
        return rect(0, 0, 32, 32, "none") + rect(14, 10, 4, 22, rust) + line("M16 14l-8-7M16 18l8-9M16 22l-9 1M16 13l1-9", dark, 3) + rect(5, 6, 4, 3, metal_hi) + rect(22, 7, 4, 3, rust)
    if tile_id == 42:
        return rect(0, 0, 32, 32, "none") + rect(14, 17, 5, 15, rust) + path("M4 21v-6h4v-5h5V5h9v5h5v5h3v9H4z", plant, dark, 1) + rect(8, 13, 5, 4, plant2) + rect(21, 12, 5, 4, plant2)
    if tile_id == 43:
        return rect(0, 0, 32, 32, "none") + line("M5 0v8l4 3-2 6 5 4-2 8M16 0v7l-4 5 5 4-2 5 5 7M27 0v10l-4 4 3 5-4 4 2 8", plant, 3) + rect(4, 10, 3, 3, plant2) + rect(18, 19, 3, 3, plant2)
    if tile_id == 44:
        return rect(0, 0, 32, 32, "none") + path("M3 29l2-12 7-3 4-8 8 4 3 7 4 4-2 9z", ground2, dark, 2) + rect(11, 17, 8, 3, light) + rect(22, 22, 4, 3, rust)
    if tile_id == 45:
        return rect(0, 0, 32, 32, "none") + path("M2 30l3-15 7-5 6 2 4-8 7 4 4 22z", concrete, dark, 2) + rect(8, 17, 4, 3, metal_hi) + rect(22, 13, 4, 4, rust)
    if tile_id == 46:
        return rect(0, 0, 32, 32, "none") + rect(14, 8, 3, 24, dark) + line("M15 10l-7-5", dark, 2) + rect(4, 3, 9, 5, metal) + rect(5, 4, 6, 2, accent) + rect(13, 30, 7, 2, dark)
    return rect(0, 0, 32, 32, "none") + rect(11, 6, 3, 25, dark) + path("M13 7h16v13H13z", p["sky"], dark, 2) + line("M16 10h8M16 14h5", rust, 2) + line("M25 16l-3 3", dark, 2)


def make_svg(stage_id: str, data: dict) -> str:
    p = data["palette"]
    groups = []
    for tile_id, (slug, label, category) in enumerate(TILES):
        x = (tile_id % COLS) * TILE
        y = (tile_id // COLS) * TILE
        groups.append(
            f'<g id="{slug}" data-tile="{tile_id}" data-category="{escape(category)}" '
            f'transform="translate({x} {y})" shape-rendering="crispEdges">'
            f'{draw_tile(tile_id, p, data["landmarks"])}</g>'
        )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" '
        f'viewBox="0 0 {WIDTH} {HEIGHT}" shape-rendering="crispEdges">\n'
        f'  <title>Tileset {escape(data["name"])} — Apocalypse Race: Fleeing Hell</title>\n'
        f'  <desc>48 tiles originais de 32 por 32 pixels, em uma grade de 8 colunas e 6 linhas.\n'
        f'  IDs semânticos são os mesmos nas quatro fases. Fonte vetorial editável.</desc>\n'
        + "\n".join(groups)
        + "\n</svg>\n"
    )


def make_tsx(stage_id: str, data: dict) -> str:
    tiles = []
    for tile_id, (slug, label, category) in enumerate(TILES):
        tiles.append(
            f'  <tile id="{tile_id}" type="{escape(slug)}">\n'
            f'    <properties>\n'
            f'      <property name="nome_pt" value="{escape(label)}"/>\n'
            f'      <property name="categoria" value="{escape(category)}"/>\n'
            f'      <property name="fase" value="{escape(data["name"])}"/>\n'
            f'    </properties>\n'
            f'  </tile>'
        )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<tileset version="1.10" tiledversion="1.10.2" name="{escape(stage_id)}" '
        f'tilewidth="{TILE}" tileheight="{TILE}" tilecount="{len(TILES)}" columns="{COLS}">\n'
        f' <image source="tileset.png" width="{WIDTH}" height="{HEIGHT}"/>\n'
        + "\n".join(tiles)
        + "\n</tileset>\n"
    )


def rasterize(svg_path: Path, png_path: Path) -> None:
    magick = shutil.which("magick")
    convert = shutil.which("convert")
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
        help="recreate editable SVG/TSX/JSON files from the Python templates, replacing manual edits",
    )
    args = parser.parse_args()

    for stage_id, data in STAGES.items():
        folder = OUT / stage_id
        folder.mkdir(parents=True, exist_ok=True)
        svg_path = folder / "tileset.svg"
        tsx_path = folder / "tileset.tsx"
        json_path = folder / "tileset.json"
        if args.force or not svg_path.exists():
            svg_path.write_text(make_svg(stage_id, data), encoding="utf-8")
        if args.force or not tsx_path.exists():
            tsx_path.write_text(make_tsx(stage_id, data), encoding="utf-8")
        if args.force or not json_path.exists():
            json_path.write_text(
                json.dumps({
                    "stageId": stage_id,
                    "stageName": data["name"],
                    "region": data["region"],
                    "tileWidth": TILE,
                    "tileHeight": TILE,
                    "columns": COLS,
                    "rows": ROWS,
                    "tileCount": len(TILES),
                    "tiledTileset": "tileset.tsx",
                    "atlasPng": "tileset.png",
                    "atlasSvg": "tileset.svg",
                    "tiles": [
                        {"id": tile_id, "key": slug, "name": label, "category": category}
                        for tile_id, (slug, label, category) in enumerate(TILES)
                    ],
                }, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
        # SVG is the editable source: always export the current source, but do
        # not replace it (or Tiled metadata) unless the author asks for --force.
        rasterize(svg_path, folder / "tileset.png")
        print(f"{data['name']}: {len(TILES)} tiles -> {folder.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
