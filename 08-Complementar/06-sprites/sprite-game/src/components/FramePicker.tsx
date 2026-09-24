import { useMemo } from "react";
import type { SpriteSheetMeta } from "../types";
import { getFrameCount, getFrameRect } from "../game/sliceSheet";

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
    return Array.from({ length: getFrameCount(meta) }, (_, index) => ({
      index,
      rect: getFrameRect(meta, index),
    })).filter((frame): frame is { index: number; rect: NonNullable<ReturnType<typeof getFrameRect>> } => Boolean(frame.rect));
  }, [meta]);

  const displayFrame = 48; // px per cell in the picker

  return (
    <div className="overflow-auto rounded-lg border border-slate-700 bg-slate-950/60 p-2">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${meta.frameRects?.length ? Math.min(8, Math.max(1, meta.frameRects.length)) : meta.columns}, ${displayFrame}px)`,
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
          const cellW = displayFrame;
          const cellH = displayFrame * (f.rect.height / Math.max(1, f.rect.width));
          const sourceScale = cellW / Math.max(1, f.rect.width);
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
                backgroundPosition: `-${f.rect.x * sourceScale}px -${
                  f.rect.y * sourceScale
                }px`,
                backgroundSize: `${meta.imageWidth * sourceScale}px ${
                  meta.imageHeight * sourceScale
                }px`,
                backgroundRepeat: "no-repeat",
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
