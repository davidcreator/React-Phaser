import { useMemo } from "react";
import type { SpriteSheetMeta } from "../types";

export function FramePicker({
  meta,
  activeFrame,
  selectStart,
  selectEnd,
  onFrameClick,
}: {
  meta: SpriteSheetMeta;
  activeFrame?: number;
  selectStart?: number;
  selectEnd?: number;
  onFrameClick?: (index: number) => void;
}) {
  const frames = useMemo(() => {
    const out: { index: number; col: number; row: number }[] = [];
    let i = 0;
    for (let r = 0; r < meta.rows; r++) {
      for (let c = 0; c < meta.columns; c++) {
        out.push({ index: i, col: c, row: r });
        i++;
      }
    }
    return out;
  }, [meta]);

  const displayFrame = 48; // px per cell in the picker
  const aspect = meta.frameHeight / meta.frameWidth;
  const cellW = displayFrame;
  const cellH = displayFrame * aspect;

  return (
    <div className="overflow-auto rounded-lg border border-slate-700 bg-slate-950/60 p-2">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${meta.columns}, ${cellW}px)`,
          width: "fit-content",
        }}
      >
        {frames.map((f) => {
          const inRange =
            selectStart !== undefined &&
            selectEnd !== undefined &&
            f.index >= Math.min(selectStart, selectEnd) &&
            f.index <= Math.max(selectStart, selectEnd);
          const isActive = activeFrame === f.index;
          return (
            <button
              key={f.index}
              type="button"
              onClick={() => onFrameClick?.(f.index)}
              title={`Frame ${f.index}`}
              className={`relative shrink-0 rounded border transition-all ${
                isActive
                  ? "border-amber-400 ring-2 ring-amber-400/50"
                  : inRange
                    ? "border-sky-500 ring-1 ring-sky-500/60"
                    : "border-slate-700 hover:border-slate-500"
              }`}
              style={{
                width: cellW,
                height: cellH,
                backgroundImage: `url(${meta.dataUrl})`,
                backgroundPosition: `-${f.col * cellW}px -${f.row * cellH}px`,
                backgroundSize: `${meta.columns * cellW}px ${meta.rows * cellH}px`,
                imageRendering: "pixelated",
              }}
            >
              <span className="absolute bottom-0 right-0 rounded-tl bg-slate-950/80 px-1 text-[9px] font-mono text-slate-300">
                {f.index}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
