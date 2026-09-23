import { PRESETS, type PresetDef } from "../presets";

// Galeria de modelos base (spritesheets prontos).
export function PresetGallery({
  onSelect,
  compact,
}: {
  onSelect: (p: PresetDef) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "grid grid-cols-2 gap-2"
          : "grid grid-cols-2 gap-3 sm:grid-cols-4"
      }
    >
      {PRESETS.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p)}
          className="group pointer-events-auto flex flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-800/60 text-left transition-all hover:border-sky-500 hover:bg-slate-800"
          style={{ boxShadow: `inset 0 -2px 0 ${p.accent}55` }}
        >
          <div
            className="relative aspect-square w-full overflow-hidden"
            style={{
              backgroundImage:
                "linear-gradient(45deg,#1e293b 25%,transparent 25%),linear-gradient(-45deg,#1e293b 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1e293b 75%),linear-gradient(-45deg,transparent 75%,#1e293b 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
              backgroundColor: "#0f172a",
            }}
          >
            {/* mostra só o primeiro frame (idle) como thumbnail */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${p.file})`,
                backgroundSize: "400% 400%",
                backgroundPosition: "0% 0%",
                imageRendering: "pixelated",
                transform: "scale(0.92)",
              }}
            />
            <span className="absolute right-1 top-1 rounded bg-slate-950/70 px-1.5 py-0.5 text-xs">
              {p.emoji}
            </span>
          </div>
          <div className="p-2">
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: p.accent }}
              />
              <span className="text-xs font-semibold text-slate-100">
                {p.name}
              </span>
            </div>
            {!compact && (
              <p className="mt-0.5 text-[10px] leading-tight text-slate-400">
                {p.description}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
