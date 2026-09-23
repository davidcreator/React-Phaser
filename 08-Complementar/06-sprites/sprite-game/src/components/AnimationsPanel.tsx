import type { AnimationConfig, SpriteSheetMeta } from "../types";
import { FramePicker } from "./FramePicker";
import { NumberField, Toggle, Slider } from "./ui";

export function AnimationsPanel({
  meta,
  animations,
  editingId,
  selectedId,
  setEditingId,
  onSelect,
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  onPlay,
}: {
  meta: SpriteSheetMeta;
  animations: AnimationConfig[];
  editingId: string | null;
  selectedId: string | null;
  setEditingId: (id: string | null) => void;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<AnimationConfig>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPlay: (id: string) => void;
}) {
  const editing = animations.find((a) => a.id === editingId);

  return (
    <div className="space-y-3">
      <button
        onClick={onAdd}
        className="w-full rounded-lg border border-dashed border-sky-600 bg-sky-500/10 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/20"
      >
        + Nova animação
      </button>

      <div className="space-y-1.5">
        {animations.length === 0 && (
          <p className="py-2 text-center text-xs text-slate-500">
            Nenhuma animação ainda.
          </p>
        )}
        {animations.map((a) => (
          <div
            key={a.id}
            className={`rounded-lg border ${
              selectedId === a.id
                ? "border-amber-400/70 bg-slate-800"
                : editingId === a.id
                  ? "border-sky-500 bg-slate-800"
                  : "border-slate-700 bg-slate-800/40"
            }`}
          >
            <div className="flex items-center gap-1.5 p-2">
              <button
                onClick={() => onSelect(a.id)}
                title="Selecionar (timeline)"
                className="h-4 w-4 shrink-0 rounded-sm ring-1 ring-black/20"
                style={{ background: a.color }}
              />
              <input
                value={a.name}
                onChange={(e) => onUpdate(a.id, { name: e.target.value })}
                onFocus={() => onSelect(a.id)}
                className="min-w-0 flex-1 rounded bg-slate-900 px-2 py-1 text-xs text-slate-100 focus:outline-none"
              />
              <span className="shrink-0 rounded bg-slate-900 px-1.5 py-1 font-mono text-[10px] text-slate-400">
                {a.startFrame}-{a.endFrame}
              </span>
              <button
                onClick={() => onPlay(a.id)}
                title="Testar no palco"
                className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-1 text-xs text-emerald-400 hover:bg-emerald-500/30"
              >
                ▶
              </button>
              <button
                onClick={() => setEditingId(editingId === a.id ? null : a.id)}
                title="Editar frames"
                className="shrink-0 rounded bg-slate-700 px-1.5 py-1 text-xs text-slate-300 hover:bg-slate-600"
              >
                ✎
              </button>
              <button
                onClick={() => onDuplicate(a.id)}
                title="Duplicar"
                className="shrink-0 rounded bg-slate-700 px-1.5 py-1 text-xs text-slate-300 hover:bg-slate-600"
              >
                ⧉
              </button>
              <button
                onClick={() => onDelete(a.id)}
                title="Excluir"
                className="shrink-0 rounded bg-rose-500/20 px-1.5 py-1 text-xs text-rose-400 hover:bg-rose-500/30"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="space-y-3 rounded-lg border border-sky-700 bg-slate-900/60 p-3">
          <p className="text-xs font-semibold text-sky-300">
            Editando: {editing.name}
          </p>
          <p className="text-[10px] text-slate-500">
            Clique nos frames para definir início/fim.
          </p>
          <FramePicker
            meta={meta}
            selectStart={editing.startFrame}
            selectEnd={editing.endFrame}
            onFrameClick={(i) => {
              if (i < editing.startFrame) onUpdate(editing.id, { startFrame: i });
              else onUpdate(editing.id, { endFrame: i });
            }}
          />
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Início"
              value={editing.startFrame}
              min={0}
              max={meta.totalFrames - 1}
              onChange={(v) => onUpdate(editing.id, { startFrame: v })}
            />
            <NumberField
              label="Fim"
              value={editing.endFrame}
              min={0}
              max={meta.totalFrames - 1}
              onChange={(v) => onUpdate(editing.id, { endFrame: v })}
            />
          </div>
          <Slider
            label="FPS"
            value={editing.frameRate}
            min={1}
            max={60}
            onChange={(v) => onUpdate(editing.id, { frameRate: v })}
          />
          <NumberField
            label="Repeat (-1 = loop)"
            value={editing.repeat}
            min={-1}
            max={99}
            onChange={(v) => onUpdate(editing.id, { repeat: v })}
          />
          <Toggle
            label="Yoyo (ida e volta)"
            value={editing.yoyo}
            onChange={(v) => onUpdate(editing.id, { yoyo: v })}
          />
          <button
            onClick={() => onPlay(editing.id)}
            className="w-full rounded-lg bg-emerald-500 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400"
          >
            ▶ Testar animação
          </button>
        </div>
      )}
    </div>
  );
}
