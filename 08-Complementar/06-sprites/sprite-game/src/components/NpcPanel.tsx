import type { NpcInstance, AnimationConfig } from "../types";
import { Slider, Select, ColorField, Toggle } from "./ui";

export function NpcPanel({
  npcs,
  animations,
  onAdd,
  onUpdate,
  onDelete,
}: {
  npcs: NpcInstance[];
  animations: AnimationConfig[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<NpcInstance>) => void;
  onDelete: (id: string) => void;
}) {
  const animOptions = [
    { value: "", label: "— nenhuma —" },
    ...animations.map((a) => ({ value: a.id, label: a.name })),
  ];

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-slate-500">
        Adicione NPCs ao palco (estilo Unity/Godot). Cada um usa uma animação e
        um comportamento de IA simples.
      </p>
      <button
        onClick={onAdd}
        className="w-full rounded-lg border border-dashed border-emerald-600 bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
      >
        + Adicionar NPC
      </button>

      {npcs.length === 0 && (
        <p className="py-2 text-center text-xs text-slate-500">
          Nenhum NPC no palco.
        </p>
      )}

      {npcs.map((npc, i) => (
        <div
          key={npc.id}
          className="space-y-2 rounded-lg border border-slate-700 bg-slate-800/40 p-2.5"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">🧍</span>
            <input
              value={npc.label}
              onChange={(e) => onUpdate(npc.id, { label: e.target.value })}
              className="min-w-0 flex-1 rounded bg-slate-900 px-2 py-1 text-xs text-slate-100 focus:outline-none"
            />
            <span className="shrink-0 text-[10px] text-slate-500">#{i + 1}</span>
            <button
              onClick={() => onDelete(npc.id)}
              className="shrink-0 rounded bg-rose-500/20 px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/30"
            >
              🗑
            </button>
          </div>
          <Select
            label="Animação"
            value={npc.animId ?? ""}
            options={animOptions}
            onChange={(v) => onUpdate(npc.id, { animId: v || null })}
          />
          <Select
            label="Comportamento"
            value={npc.behavior}
            options={[
              { value: "idle", label: "Parado" },
              { value: "patrol", label: "Patrulha" },
              { value: "follow", label: "Seguir jogador" },
              { value: "wander", label: "Vagar" },
            ]}
            onChange={(v) => onUpdate(npc.id, { behavior: v })}
          />
          {(npc.behavior === "patrol" ||
            npc.behavior === "follow" ||
            npc.behavior === "wander") && (
            <Slider
              label="Velocidade"
              value={npc.speed}
              min={10}
              max={300}
              onChange={(v) => onUpdate(npc.id, { speed: v })}
            />
          )}
          {npc.behavior === "patrol" && (
            <Slider
              label="Alcance patrulha"
              value={npc.patrolRange}
              min={20}
              max={400}
              onChange={(v) => onUpdate(npc.id, { patrolRange: v })}
            />
          )}
          <Slider
            label="Escala"
            value={npc.scale}
            min={0.5}
            max={8}
            step={0.5}
            suffix="x"
            onChange={(v) => onUpdate(npc.id, { scale: v })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Slider
              label="Pos X"
              value={npc.x}
              min={0}
              max={1200}
              onChange={(v) => onUpdate(npc.id, { x: v })}
            />
            <Slider
              label="Pos Y"
              value={npc.y}
              min={0}
              max={800}
              onChange={(v) => onUpdate(npc.id, { y: v })}
            />
          </div>
          <Toggle
            label="Espelhar"
            value={npc.flipX}
            onChange={(v) => onUpdate(npc.id, { flipX: v })}
          />
          <Toggle
            label="Aplicar tint"
            value={npc.tintEnabled}
            onChange={(v) => onUpdate(npc.id, { tintEnabled: v })}
          />
          {npc.tintEnabled && (
            <ColorField
              label="Cor"
              value={npc.tint}
              onChange={(v) => onUpdate(npc.id, { tint: v })}
            />
          )}
        </div>
      ))}
    </div>
  );
}
