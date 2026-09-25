#!/usr/bin/env python3
"""
Pipeline offline de spritesheets — Shinobi Eclipse
====================================================
Corrige os 3 problemas dos assets originais:
  1. Fundo xadrez FALSO pintado nos pixels (RGB sem alpha) -> alpha real via
     flood-fill de borda (mesma heurística que o jogo usava em runtime).
  2. Frames desalinhados (personagem "patina": centro de massa desliza ~56px
     entre frames) -> recentraliza cada frame pelo centroide de alpha e alinha
     os pés numa linha de base comum.
  3. Peso: PNG RGB de 1254x1254 (~2MB cada) -> RGBA otimizado.

Executar:  python3 scripts/process_spritesheets.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

try:
    from scipy import ndimage

    HAVE_SCIPY = True
except ImportError:
    HAVE_SCIPY = False

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"

PLAYER_SHEETS = [
    "player/shinobi-movement.png",
    "player/shinobi-sword-combat.png",
    "player/shinobi-techniques.png",
]
ENEMY_SHEETS = [
    "enemies/crimson-kunai-ninja.png",
    "enemies/cobalt-chain-ninja.png",
    "enemies/violet-naginata-ninja.png",
    "enemies/ochre-kanabo-ninja.png",
    "enemies/onyx-elite-ninja.png",
]


def edge_matte_mask(rgb: np.ndarray) -> np.ndarray:
    """Pixels claros/cinza-claro conectados à borda = fundo xadrez falso."""
    minc = rgb.min(axis=2).astype(int)
    maxc = rgb.max(axis=2).astype(int)
    matte = (minc > 175) & ((maxc - minc) < 26)
    if not matte.any():
        return matte
    if HAVE_SCIPY:
        labels, _ = ndimage.label(matte)
        border = np.unique(
            np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]])
        )
        border = border[border != 0]
        if border.size == 0:
            return np.zeros_like(matte)
        return np.isin(labels, border)
    # Fallback sem scipy: propagação iterativa de fronteira
    reachable = np.zeros_like(matte)
    frontier = matte.copy()
    frontier[1:-1, 1:-1] = False  # semente: apenas bordas
    while frontier.any():
        reachable |= frontier
        neigh = np.zeros_like(matte)
        for axis, shift in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            neigh |= np.roll(frontier, shift, axis=axis)
        frontier = matte & neigh & ~reachable
    return reachable


def align_frames(rgba: np.ndarray) -> np.ndarray:
    """Recentraliza cada frame (centroide de alpha) e alinha os pés."""
    h, w = rgba.shape[:2]
    f = w // 4
    grid = [
        rgba[r * f : (r + 1) * f, c * f : (c + 1) * f]
        for r in range(4)
        for c in range(4)
    ]
    feet = []
    for frame in grid:
        ys, _ = np.nonzero(frame[..., 3] > 16)
        feet.append(int(ys.max()) if len(ys) else 0)
    live_feet = [y for y in feet if y > 0]
    baseline = int(np.mean(live_feet)) if live_feet else f - 8
    baseline = min(baseline, f - 8)

    out = np.zeros_like(rgba)
    for index, frame in enumerate(grid):
        ys, xs = np.nonzero(frame[..., 3] > 16)
        if len(ys) == 0:
            continue
        weights = frame[..., 3][ys, xs].astype(float)
        centroid_x = float((xs * weights).sum() / weights.sum())
        bottom = int(ys.max())
        dx = int(round(f / 2 - centroid_x))
        dy = int(round(baseline - bottom))
        dx = max(-f // 3, min(f // 3, dx))
        dy = max(-f // 3, min(f // 3, dy))

        target_row, target_col = divmod(index, 4)
        src_y0, src_x0 = max(0, -dy), max(0, -dx)
        dst_y0, dst_x0 = max(0, dy), max(0, dx)
        copy_h = min(f - src_y0, f - dst_y0)
        copy_w = min(f - src_x0, f - dst_x0)
        if copy_h <= 0 or copy_w <= 0:
            out[
                target_row * f : (target_row + 1) * f,
                target_col * f : (target_col + 1) * f,
            ] = frame
            continue
        out[
            target_row * f + dst_y0 : target_row * f + dst_y0 + copy_h,
            target_col * f + dst_x0 : target_col * f + dst_x0 + copy_w,
        ] = frame[src_y0 : src_y0 + copy_h, src_x0 : src_x0 + copy_w]
    return out


def process(relative: str, quantize: bool) -> None:
    path = ASSETS / relative
    image = Image.open(path).convert("RGBA")
    w, h = image.size
    image = image.crop((0, 0, (w // 4) * 4, (h // 4) * 4))
    pixels = np.array(image)

    matte = edge_matte_mask(pixels[..., :3])
    pixels[matte, 3] = 0
    pixels = align_frames(pixels)

    result = Image.fromarray(pixels, "RGBA")
    before = path.stat().st_size // 1024
    if quantize:
        result = result.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    result.save(path, optimize=True)
    after = path.stat().st_size // 1024
    print(f"  {relative}: matte={int(matte.sum())}px  {before}KB -> {after}KB")


def main() -> None:
    print(f"scipy: {'sim' if HAVE_SCIPY else 'não (fallback numpy)'}")
    print("Processando sheets do player (RGBA full)...")
    for relative in PLAYER_SHEETS:
        process(relative, quantize=False)
    print("Processando sheets de inimigos (quantizados p/ 256 cores)...")
    for relative in ENEMY_SHEETS:
        process(relative, quantize=True)
    print("Concluído.")


if __name__ == "__main__":
    main()
