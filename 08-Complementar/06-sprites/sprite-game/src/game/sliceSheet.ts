import type { SpriteSheetMeta } from "../types";

export function loadImageFromFile(
  file: File
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () =>
        resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = dataUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function buildMeta(
  fileName: string,
  dataUrl: string,
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
  marginX = 0,
  marginY = 0,
  spacingX = 0,
  spacingY = 0
): SpriteSheetMeta {
  const usableW = imageWidth - marginX * 2 + spacingX;
  const usableH = imageHeight - marginY * 2 + spacingY;
  const columns = Math.max(1, Math.floor(usableW / (frameWidth + spacingX)));
  const rows = Math.max(1, Math.floor(usableH / (frameHeight + spacingY)));
  return {
    fileName,
    dataUrl,
    imageWidth,
    imageHeight,
    frameWidth,
    frameHeight,
    marginX,
    marginY,
    spacingX,
    spacingY,
    columns,
    rows,
    totalFrames: columns * rows,
  };
}

// Auto guess: try to find a square-ish frame that divides evenly.
export function guessFrameSize(w: number, h: number): { fw: number; fh: number } {
  const candidates = [8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256];
  const divisors = candidates.filter((c) => w % c === 0 && h % c === 0);
  if (divisors.length) {
    for (const c of divisors) {
      if (w / c >= 2 && w / c <= 20) return { fw: c, fh: c };
    }
    return {
      fw: divisors[divisors.length - 1],
      fh: divisors[divisors.length - 1],
    };
  }
  return { fw: Math.floor(w / 4), fh: h };
}
