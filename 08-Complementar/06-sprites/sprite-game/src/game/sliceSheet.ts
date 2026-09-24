import type { FrameRect, SpriteSheetMeta } from "../types";

function positiveInt(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.max(1, Math.floor(value)) : fallback;
}

function nonNegativeInt(value: number): number {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

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
      img.onerror = () => reject(new Error("Imagem inválida ou corrompida."));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler arquivo."));
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
  spacingY = 0,
  frameRects: FrameRect[] | null = null
): SpriteSheetMeta {
  const width = positiveInt(imageWidth, 1);
  const height = positiveInt(imageHeight, 1);
  const fw = Math.min(width, positiveInt(frameWidth, width));
  const fh = Math.min(height, positiveInt(frameHeight, height));
  const mx = Math.min(
    Math.floor(Math.max(0, width - fw) / 2),
    nonNegativeInt(marginX)
  );
  const my = Math.min(
    Math.floor(Math.max(0, height - fh) / 2),
    nonNegativeInt(marginY)
  );
  const sx = nonNegativeInt(spacingX);
  const sy = nonNegativeInt(spacingY);

  const customRects = frameRects
    ? frameRects
        .map((rect) => ({
          x: Math.max(0, Math.min(width - 1, Math.floor(rect.x))),
          y: Math.max(0, Math.min(height - 1, Math.floor(rect.y))),
          width: Math.max(1, Math.floor(rect.width)),
          height: Math.max(1, Math.floor(rect.height)),
        }))
        .map((rect) => ({
          ...rect,
          width: Math.min(rect.width, width - rect.x),
          height: Math.min(rect.height, height - rect.y),
        }))
        .filter((rect) => rect.width > 0 && rect.height > 0)
    : null;

  // Para n frames: 2 * margem + n * frame + (n - 1) * espaçamento.
  // Somar um espaçamento antes da divisão evita perder o último frame.
  const usableW = Math.max(0, width - mx * 2 + sx);
  const usableH = Math.max(0, height - my * 2 + sy);
  const columns = customRects?.length
    ? customRects.length
    : Math.max(1, Math.floor(usableW / (fw + sx)));
  const rows = customRects?.length
    ? 1
    : Math.max(1, Math.floor(usableH / (fh + sy)));

  return {
    fileName,
    dataUrl,
    imageWidth: width,
    imageHeight: height,
    frameWidth: fw,
    frameHeight: fh,
    marginX: mx,
    marginY: my,
    spacingX: sx,
    spacingY: sy,
    columns,
    rows,
    totalFrames: customRects?.length ?? columns * rows,
    frameRects: customRects,
  };
}

export function getFrameCount(meta: SpriteSheetMeta): number {
  return meta.frameRects?.length ?? meta.totalFrames;
}

/** Retorna o retângulo real usado para recortar um frame. */
export function getFrameRect(
  meta: SpriteSheetMeta,
  index: number
): FrameRect | null {
  const safeIndex = Math.floor(index);
  if (safeIndex < 0 || safeIndex >= getFrameCount(meta)) return null;
  const custom = meta.frameRects?.[safeIndex];
  if (custom) return custom;
  const col = safeIndex % meta.columns;
  const row = Math.floor(safeIndex / meta.columns);
  return {
    x: meta.marginX + col * (meta.frameWidth + meta.spacingX),
    y: meta.marginY + row * (meta.frameHeight + meta.spacingY),
    width: meta.frameWidth,
    height: meta.frameHeight,
  };
}

/**
 * Faz uma estimativa inicial da grade. Não existe como descobrir a divisão
 * correta de um spritesheet arbitrário apenas olhando suas dimensões, então a
 * função privilegia os formatos mais comuns e deixa os campos editáveis na UI.
 *
 * A versão anterior usava a altura inteira como frameHeight no fallback. Em
 * imagens geradas (por exemplo 1254x1254) isso produzia uma grade 4x1 em vez
 * da grade 4x4 esperada.
 */
export function guessFrameSize(w: number, h: number): { fw: number; fh: number } {
  const width = positiveInt(w, 1);
  const height = positiveInt(h, 1);
  const ratio = width / height;

  // Tiras horizontais/verticais são comuns em spritesheets simples.
  if (ratio >= 3) {
    const columns = Math.max(2, Math.min(16, Math.round(ratio)));
    return { fw: Math.max(1, Math.floor(width / columns)), fh: height };
  }
  if (ratio <= 1 / 3) {
    const rows = Math.max(2, Math.min(16, Math.round(1 / ratio)));
    return { fw: width, fh: Math.max(1, Math.floor(height / rows)) };
  }

  // A maioria dos sheets usados pelo SpriteLab é uma grade 4x4. Usar essa
  // heurística também funciona quando a imagem tem 1–2 pixels de sobra (algo
  // frequente em imagens geradas por IA e exportações com arredondamento).
  if (ratio >= 0.75 && ratio <= 1.5) {
    return {
      fw: Math.max(1, Math.floor(width / 4)),
      fh: Math.max(1, Math.floor(height / 4)),
    };
  }

  // Para proporções intermediárias, use uma grade 4x4 como ponto de partida;
  // o usuário ainda pode corrigir largura/altura no painel Grade de Frames.
  return {
    fw: Math.max(1, Math.floor(width / 4)),
    fh: Math.max(1, Math.floor(height / 4)),
  };
}
