import { useEffect, useRef, useState } from "react";
import type { FrameRect, SpriteSheetMeta } from "../types";

const MIN_SIZE = 2;

type Corner = "nw" | "ne" | "sw" | "se";
type Operation =
  | {
      kind: "draw";
      index: number;
      startX: number;
      startY: number;
    }
  | {
      kind: "move" | "resize";
      index: number;
      startX: number;
      startY: number;
      original: FrameRect;
      corner?: Corner;
    };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeRect(rect: FrameRect, meta: SpriteSheetMeta): FrameRect {
  const x = clamp(Math.floor(rect.x), 0, Math.max(0, meta.imageWidth - 1));
  const y = clamp(Math.floor(rect.y), 0, Math.max(0, meta.imageHeight - 1));
  return {
    x,
    y,
    width: clamp(
      Math.floor(rect.width),
      MIN_SIZE,
      Math.max(MIN_SIZE, meta.imageWidth - x)
    ),
    height: clamp(
      Math.floor(rect.height),
      MIN_SIZE,
      Math.max(MIN_SIZE, meta.imageHeight - y)
    ),
  };
}

function makeGrid(meta: SpriteSheetMeta): FrameRect[] {
  const count = Math.max(1, meta.totalFrames);
  const output: FrameRect[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % Math.max(1, meta.columns);
    const row = Math.floor(i / Math.max(1, meta.columns));
    output.push(
      normalizeRect(
        {
          x: meta.marginX + col * (meta.frameWidth + meta.spacingX),
          y: meta.marginY + row * (meta.frameHeight + meta.spacingY),
          width: meta.frameWidth,
          height: meta.frameHeight,
        },
        meta
      )
    );
  }
  return output;
}

export function FrameRectEditor({
  meta,
  onChange,
  onSelectFrame,
}: {
  meta: SpriteSheetMeta;
  onChange: (rects: FrameRect[]) => void;
  onSelectFrame?: (index: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const operationRef = useRef<Operation | null>(null);
  const rectanglesRef = useRef<FrameRect[]>(meta.frameRects ?? makeGrid(meta));
  const [rectangles, setRectangles] = useState<FrameRect[]>(
    meta.frameRects ?? makeGrid(meta)
  );
  const [selected, setSelected] = useState(0);
  const [scale, setScale] = useState(1);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const next = meta.frameRects ?? makeGrid(meta);
    rectanglesRef.current = next;
    setRectangles(next);
    setSelected((value) => Math.min(value, Math.max(0, next.length - 1)));
  }, [meta]);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      draw();
    };
    image.src = meta.dataUrl;
    return () => {
      image.onload = null;
    };
    // draw is intentionally resolved from the latest refs/state below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.dataUrl]);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rectangles, selected, scale, zoom, meta.imageWidth, meta.imageHeight]);

  function commit(next: FrameRect[]) {
    const normalized = next.map((rect) => normalizeRect(rect, meta));
    rectanglesRef.current = normalized;
    setRectangles(normalized);
    onChange(normalized);
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maxWidth = 560;
    const maxHeight = 360;
    const baseScale = Math.min(
      1,
      maxWidth / Math.max(1, meta.imageWidth),
      maxHeight / Math.max(1, meta.imageHeight)
    );
    const nextScale = baseScale * zoom;
    const width = Math.max(1, Math.round(meta.imageWidth * nextScale));
    const height = Math.max(1, Math.round(meta.imageHeight * nextScale));
    canvas.width = width;
    canvas.height = height;
    setScale((current) => (Math.abs(current - nextScale) > 0.001 ? nextScale : current));

    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#0f172a";
    context.fillRect(0, 0, width, height);
    if (imageRef.current) context.drawImage(imageRef.current, 0, 0, width, height);

    rectanglesRef.current.forEach((rect, index) => {
      const isSelected = index === selected;
      context.fillStyle = isSelected ? "rgba(56,189,248,.18)" : "rgba(15,23,42,.12)";
      context.strokeStyle = isSelected ? "#fbbf24" : "rgba(226,232,240,.78)";
      context.lineWidth = isSelected ? 2 : 1;
      context.fillRect(rect.x * nextScale, rect.y * nextScale, rect.width * nextScale, rect.height * nextScale);
      context.strokeRect(rect.x * nextScale, rect.y * nextScale, rect.width * nextScale, rect.height * nextScale);
      context.fillStyle = isSelected ? "#fbbf24" : "#e2e8f0";
      context.font = "11px monospace";
      context.fillText(String(index), rect.x * nextScale + 3, rect.y * nextScale + 13);
      if (isSelected) {
        const handle = 5;
        for (const point of getCorners(rect)) {
          context.fillStyle = "#f8fafc";
          context.fillRect(
            point.x * nextScale - handle / 2,
            point.y * nextScale - handle / 2,
            handle,
            handle
          );
        }
      }
    });
  }

  function toImagePoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const bounds = canvas.getBoundingClientRect();
    return {
      x: clamp(
        ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * meta.imageWidth,
        0,
        meta.imageWidth
      ),
      y: clamp(
        ((event.clientY - bounds.top) / Math.max(1, bounds.height)) * meta.imageHeight,
        0,
        meta.imageHeight
      ),
    };
  }

  function hitTest(point: { x: number; y: number }) {
    const tolerance = 10 / Math.max(0.01, scale);
    for (let index = rectanglesRef.current.length - 1; index >= 0; index--) {
      const rect = rectanglesRef.current[index];
      const corner = getCorners(rect).find((candidate) =>
        Math.abs(candidate.x - point.x) <= tolerance && Math.abs(candidate.y - point.y) <= tolerance
      );
      if (corner) {
        const name = getCorners(rect).indexOf(corner);
        return { index, corner: (["nw", "ne", "sw", "se"] as Corner[])[name] };
      }
      if (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
      ) {
        return { index };
      }
    }
    return null;
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = toImagePoint(event);
    const hit = hitTest(point);
    if (hit) {
      setSelected(hit.index);
      onSelectFrame?.(hit.index);
      const original = rectanglesRef.current[hit.index];
      operationRef.current = {
        kind: hit.corner ? "resize" : "move",
        index: hit.index,
        startX: point.x,
        startY: point.y,
        original,
        corner: hit.corner,
      };
    } else {
      const index = rectanglesRef.current.length;
      setSelected(index);
      onSelectFrame?.(index);
      rectanglesRef.current = [
        ...rectanglesRef.current,
        normalizeRect({ x: point.x, y: point.y, width: MIN_SIZE, height: MIN_SIZE }, meta),
      ];
      operationRef.current = {
        kind: "draw",
        index,
        startX: point.x,
        startY: point.y,
      };
      setRectangles(rectanglesRef.current);
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const operation = operationRef.current;
    if (!operation) return;
    const point = toImagePoint(event);
    const next = [...rectanglesRef.current];
    if (operation.kind === "draw") {
      next[operation.index] = normalizeRect(
        {
          x: Math.min(operation.startX, point.x),
          y: Math.min(operation.startY, point.y),
          width: Math.abs(point.x - operation.startX),
          height: Math.abs(point.y - operation.startY),
        },
        meta
      );
    } else if (operation.kind === "move") {
      const original = operation.original;
      next[operation.index] = normalizeRect(
        {
          ...original,
          x: original.x + point.x - operation.startX,
          y: original.y + point.y - operation.startY,
        },
        meta
      );
    } else {
      next[operation.index] = resizeRect(
        operation.original,
        operation.corner ?? "se",
        point,
        meta
      );
    }
    rectanglesRef.current = next;
    setRectangles(next);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!operationRef.current) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const next = rectanglesRef.current.filter(
      (rect) => rect.width >= MIN_SIZE && rect.height >= MIN_SIZE
    );
    operationRef.current = null;
    commit(next);
    setSelected((value) => Math.min(value, Math.max(0, next.length - 1)));
  }

  function removeSelected() {
    if (!rectanglesRef.current.length) return;
    const next = rectanglesRef.current.filter((_, index) => index !== selected);
    commit(next.length ? next : makeGrid({ ...meta, frameRects: null, totalFrames: 1, columns: 1, rows: 1 }));
    setSelected(Math.max(0, selected - 1));
  }

  function tightenToTransparency() {
    const image = imageRef.current;
    if (!image || !rectanglesRef.current.length) return;
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || meta.imageWidth;
    canvas.height = image.naturalHeight || meta.imageHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const next = rectanglesRef.current.map((rect) => {
      let minX = rect.width;
      let minY = rect.height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < rect.height; y++) {
        for (let x = 0; x < rect.width; x++) {
          const px = rect.x + x;
          const py = rect.y + y;
          const alpha = pixels[(py * canvas.width + px) * 4 + 3];
          if (alpha > 8) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
      return maxX < 0
        ? rect
        : normalizeRect(
            {
              x: rect.x + minX,
              y: rect.y + minY,
              width: maxX - minX + 1,
              height: maxY - minY + 1,
            },
            meta
          );
    });
    commit(next);
  }

  return (
    <div className="space-y-2 rounded-lg border border-amber-500/30 bg-slate-950/60 p-2">
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
        <span className="font-semibold text-amber-300">Editor livre</span>
        <span>{rectangles.length} quadro(s)</span>
        <label className="ml-auto flex items-center gap-1">
          Zoom
          <input
            type="range"
            min={1}
            max={4}
            step={0.25}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-20 accent-amber-400"
          />
          <span className="w-7 font-mono text-amber-300">{zoom.toFixed(2)}x</span>
        </label>
        <span className="w-full">Arraste para mover · cantos para redimensionar · clique vazio para criar</span>
      </div>
      <div className="overflow-auto rounded border border-slate-800 bg-slate-900 p-1">
        <canvas
          ref={canvasRef}
          className="cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
      <div className="flex items-center gap-2 text-[10px] text-slate-400">
        <span>Selecionado: {rectangles.length ? selected : "—"}</span>
        <button
          type="button"
          onClick={removeSelected}
          disabled={!rectangles.length}
          className="rounded bg-rose-500/15 px-2 py-1 text-rose-300 disabled:opacity-40"
        >
          Excluir quadro
        </button>
        <button
          type="button"
          onClick={tightenToTransparency}
          disabled={!rectangles.length}
          className="rounded bg-emerald-500/15 px-2 py-1 text-emerald-300 disabled:opacity-40"
          title="Reduz cada retângulo até os pixels com alpha"
        >
          ✨ Ajustar pela transparência
        </button>
      </div>
    </div>
  );
}

function getCorners(rect: FrameRect) {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x, y: rect.y + rect.height },
    { x: rect.x + rect.width, y: rect.y + rect.height },
  ];
}

function resizeRect(
  original: FrameRect,
  corner: Corner,
  point: { x: number; y: number },
  meta: SpriteSheetMeta
) {
  const right = original.x + original.width;
  const bottom = original.y + original.height;
  let x = original.x;
  let y = original.y;
  let nextRight = right;
  let nextBottom = bottom;
  if (corner.includes("w")) x = Math.min(point.x, right - MIN_SIZE);
  if (corner.includes("e")) nextRight = Math.max(point.x, original.x + MIN_SIZE);
  if (corner.includes("n")) y = Math.min(point.y, bottom - MIN_SIZE);
  if (corner.includes("s")) nextBottom = Math.max(point.y, original.y + MIN_SIZE);
  return normalizeRect(
    { x, y, width: nextRight - x, height: nextBottom - y },
    meta
  );
}
