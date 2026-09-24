import { useEffect, useRef, useState } from "react";
import type { AnimationConfig, SpriteSheetMeta } from "../types";
import { getFrameCount, getFrameRect } from "../game/sliceSheet";

// Timeline de animação estilo Aseprite / Unity Animator:
// - playhead / scrubbing
// - play, pause, step, loop
// - onion skinning (frames fantasma antes/depois)
// - miniaturas de cada frame

export function Timeline({
  meta,
  anim,
  onScrub,
  onPlay,
  onPause,
  onStep,
  onStop,
}: {
  meta: SpriteSheetMeta;
  anim: AnimationConfig | null;
  onScrub: (frameIndex: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onStep: (frameIndex: number) => void;
  onStop: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0); // índice dentro da sequência
  const [onion, setOnion] = useState(false);
  const rafRef = useRef<number | null>(null);
  const posRef = useRef(0);
  const accRef = useRef(0);
  const lastRef = useRef(0);

  const sequence = anim
    ? anim.frameOrder && anim.frameOrder.length
      ? anim.frameOrder
      : range(anim.startFrame, anim.endFrame)
    : [];

  // parar playback quando muda de animação
  useEffect(() => {
    setPlaying(false);
    setPos(0);
    posRef.current = 0;
    accRef.current = 0;
    lastRef.current = 0;
  }, [anim?.id, anim?.startFrame, anim?.endFrame, anim?.frameOrder?.join(",")]);

  useEffect(() => {
    if (!playing || !anim || sequence.length === 0) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      accRef.current = 0;
      lastRef.current = 0;
      return;
    }
    const step = (t: number) => {
      if (!lastRef.current) lastRef.current = t;
      const dt = t - lastRef.current;
      lastRef.current = t;
      accRef.current += dt;
      const frameDur = 1000 / Math.max(1, anim.frameRate);
      while (accRef.current >= frameDur) {
        accRef.current -= frameDur;
        const next = (posRef.current + 1) % sequence.length;
        posRef.current = next;
        setPos(next);
        onStep(sequence[next]);
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      accRef.current = 0;
      lastRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, anim?.id, anim?.frameRate, sequence.join(",")]);

  if (!anim) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-slate-500">
        Selecione ou crie uma animação para ver a timeline
      </div>
    );
  }

  const currentFrame = sequence[pos] ?? sequence[0];
  const events = anim.events ?? [];

  const handlePlay = () => {
    onPlay();
    setPlaying(true);
  };
  const handlePause = () => {
    onPause();
    setPlaying(false);
  };
  const handleStop = () => {
    onStop();
    setPlaying(false);
    posRef.current = 0;
    setPos(0);
  };
  const stepBy = (delta: number) => {
    if (sequence.length === 0) return;
    setPlaying(false);
    onPause();
    const next =
      (posRef.current + delta + sequence.length) % sequence.length;
    posRef.current = next;
    setPos(next);
    onStep(sequence[next]);
  };

  const aspect = meta.frameHeight / meta.frameWidth;
  const cellW = 46;
  const cellH = cellW * aspect;

  return (
    <div className="flex h-full flex-col">
      {/* transport controls */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 px-3 py-1.5">
        <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: anim.color }}
          />
          {anim.name}
        </span>
        <TButton onClick={handleStop} title="Parar (voltar ao início)">
          ⏮
        </TButton>
        <TButton onClick={() => stepBy(-1)} title="Frame anterior">
          ◀
        </TButton>
        {playing ? (
          <TButton onClick={handlePause} title="Pausar" primary>
            ⏸
          </TButton>
        ) : (
          <TButton onClick={handlePlay} title="Reproduzir" primary>
            ▶
          </TButton>
        )}
        <TButton onClick={() => stepBy(1)} title="Próximo frame">
          ▶|
        </TButton>
        <div className="mx-2 h-4 w-px bg-slate-700" />
        <button
          onClick={() => setOnion((o) => !o)}
          className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
            onion
              ? "bg-purple-500/25 text-purple-300"
              : "bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
          title="Onion skinning: mostra frames vizinhos como fantasma"
        >
          🧅 Onion
        </button>
        <div className="ml-auto flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span>
            frame <span className="text-amber-300">{currentFrame}</span>
          </span>
          <span>
            {pos + 1}/{sequence.length}
          </span>
          <span>{anim.frameRate} fps</span>
        </div>
      </div>

      {events.length > 0 && (
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto border-b border-slate-800 bg-fuchsia-500/5 px-3 py-1.5 text-[10px]">
          <span className="shrink-0 font-semibold text-fuchsia-200">⚑ Gatilhos</span>
          {events.map((event) => {
            const eventPos = sequence.findIndex((frame) => frame === event.frame);
            return (
              <button
                key={event.id}
                type="button"
                title={`${event.name} · frame ${event.frame}`}
                onClick={() => {
                  if (eventPos >= 0) {
                    setPlaying(false);
                    onPause();
                    posRef.current = eventPos;
                    setPos(eventPos);
                  }
                  onScrub(event.frame);
                }}
                className="shrink-0 rounded border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-fuchsia-100 hover:bg-fuchsia-500/20"
              >
                {event.name} <span className="font-mono text-fuchsia-300">@{event.frame}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* preview + onion */}
      <div className="flex items-center gap-4 px-3 py-2">
        <div className="flex items-end gap-1">
          {onion && sequence[pos - 1] !== undefined && (
            <FrameThumb
              meta={meta}
              frame={sequence[pos - 1]}
              size={cellW * 1.4}
              ghost="prev"
            />
          )}
          <FrameThumb
            meta={meta}
            frame={currentFrame}
            size={cellW * 2}
            active
          />
          {onion && sequence[pos + 1] !== undefined && (
            <FrameThumb
              meta={meta}
              frame={sequence[pos + 1]}
              size={cellW * 1.4}
              ghost="next"
            />
          )}
        </div>
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={Math.max(0, sequence.length - 1)}
            value={pos}
            onChange={(e) => {
              const p = parseInt(e.target.value);
              setPlaying(false);
              onPause();
              posRef.current = p;
              setPos(p);
              onScrub(sequence[p]);
            }}
            className="w-full accent-amber-400"
          />
          <p className="mt-1 text-[10px] text-slate-500">
            Arraste para navegar frame a frame (scrubbing)
          </p>
        </div>
      </div>

      {/* frame strip */}
      <div className="flex-1 overflow-x-auto border-t border-slate-800 px-3 py-2">
        <div className="flex items-center gap-1">
          {sequence.map((f, i) => (
            <button
              key={i}
              onClick={() => {
                setPlaying(false);
                onPause();
                posRef.current = i;
                setPos(i);
                onScrub(f);
              }}
              className={`relative shrink-0 rounded border transition-all ${
                i === pos
                  ? "border-amber-400 ring-2 ring-amber-400/40"
                  : "border-slate-700 hover:border-slate-500"
              }`}
              style={{ width: cellW, height: cellH }}
              title={`Frame ${f}`}
            >
              <FrameThumb meta={meta} frame={f} size={cellW} bare />
              <span className="absolute -top-0 left-0 rounded-br bg-slate-950/80 px-1 text-[8px] font-mono text-slate-300">
                {i}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TButton({
  children,
  onClick,
  title,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded px-2.5 py-1 text-xs transition-colors ${
        primary
          ? "bg-sky-500 text-white hover:bg-sky-400"
          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function FrameThumb({
  meta,
  frame,
  size,
  active,
  ghost,
  bare,
}: {
  meta: SpriteSheetMeta;
  frame: number;
  size: number;
  active?: boolean;
  ghost?: "prev" | "next";
  bare?: boolean;
}) {
  const safeFrame = Math.max(0, Math.min(getFrameCount(meta) - 1, Math.floor(frame)));
  const frameRect = getFrameRect(meta, safeFrame) ?? {
    x: 0,
    y: 0,
    width: meta.frameWidth,
    height: meta.frameHeight,
  };
  const w = size;
  const h = size * (frameRect.height / Math.max(1, frameRect.width));
  const sourceScale = w / Math.max(1, frameRect.width);
  const style: React.CSSProperties = {
    width: w,
    height: h,
    backgroundImage: `url(${meta.dataUrl})`,
    backgroundPosition: `-${frameRect.x * sourceScale}px -${
      frameRect.y * sourceScale
    }px`,
    backgroundSize: `${meta.imageWidth * sourceScale}px ${
      meta.imageHeight * sourceScale
    }px`,
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
    opacity: ghost ? 0.4 : 1,
    filter: ghost === "prev" ? "sepia(1) hue-rotate(150deg)" : ghost === "next" ? "sepia(1) hue-rotate(300deg)" : undefined,
  };
  if (bare) return <div style={style} />;
  return (
    <div
      className={`rounded border ${
        active ? "border-amber-400" : "border-slate-700"
      } bg-slate-950`}
      style={style}
    />
  );
}

function range(a: number, b: number): number[] {
  const out: number[] = [];
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  for (let i = lo; i <= hi; i++) out.push(i);
  return out;
}
