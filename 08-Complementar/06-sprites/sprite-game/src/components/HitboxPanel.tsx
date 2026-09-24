import type { HitboxConfig } from "../types";
import { NumberField, Slider, Select, Toggle } from "./ui";
import { TYPE_COLORS } from "./hitboxConstants";

export function HitboxPanel({
  hitboxes,
  frameCount,
  showHitboxes,
  onToggleShow,
  onAdd,
  onUpdate,
  onDelete,
}: {
  hitboxes: HitboxConfig[];
  frameCount: number;
  showHitboxes: boolean;
  onToggleShow: (v: boolean) => void;
  onAdd: (type: HitboxConfig["type"]) => void;
  onUpdate: (id: string, patch: Partial<HitboxConfig>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] text-slate-500">
        Defina caixas de colisão sobre o sprite (estilo engines de luta:{" "}
        <span className="text-emerald-400">hurtbox</span>,{" "}
        <span className="text-red-400">hitbox</span>,{" "}
        <span className="text-blue-400">colisão</span>). Valores são relativos ao
        frame (0–1).
      </p>
      <Toggle
        label="Exibir caixas no palco"
        value={showHitboxes}
        onChange={onToggleShow}
      />
      <div className="grid grid-cols-3 gap-1.5">
        <AddBtn color="#22c55e" onClick={() => onAdd("hurtbox")}>
          + Hurt
        </AddBtn>
        <AddBtn color="#ef4444" onClick={() => onAdd("hitbox")}>
          + Hit
        </AddBtn>
        <AddBtn color="#3b82f6" onClick={() => onAdd("collision")}>
          + Colisão
        </AddBtn>
      </div>

      {hitboxes.length === 0 && (
        <p className="py-2 text-center text-xs text-slate-500">
          Nenhuma caixa definida.
        </p>
      )}

      {hitboxes.map((hb) => (
        <div
          key={hb.id}
          className="space-y-2 rounded-lg border p-2.5"
          style={{ borderColor: hb.color + "66", background: hb.color + "0d" }}
        >
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ background: hb.color }}
            />
            <input
              value={hb.name}
              onChange={(e) => onUpdate(hb.id, { name: e.target.value })}
              className="min-w-0 flex-1 rounded bg-slate-900 px-2 py-1 text-xs text-slate-100 focus:outline-none"
            />
            <button
              onClick={() => onDelete(hb.id)}
              className="shrink-0 rounded bg-rose-500/20 px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/30"
            >
              🗑
            </button>
          </div>
          <Select
            label="Tipo"
            value={hb.type}
            options={[
              { value: "hurtbox", label: "Hurtbox (recebe dano)" },
              { value: "hitbox", label: "Hitbox (causa dano)" },
              { value: "collision", label: "Colisão física" },
            ]}
            onChange={(v) =>
              onUpdate(hb.id, {
                type: v,
                color: TYPE_COLORS[v as HitboxConfig["type"]],
              })
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Frame (-1 = todos)"
              value={hb.frame ?? -1}
              min={-1}
              max={Math.max(-1, frameCount - 1)}
              onChange={(v) => onUpdate(hb.id, { frame: v < 0 ? null : v })}
            />
            <Toggle
              label="Ativa"
              value={hb.enabled}
              onChange={(v) => onUpdate(hb.id, { enabled: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Slider
              label="X"
              value={hb.x}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => onUpdate(hb.id, { x: v })}
            />
            <Slider
              label="Y"
              value={hb.y}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => onUpdate(hb.id, { y: v })}
            />
            <Slider
              label="Larg."
              value={hb.w}
              min={0.02}
              max={1}
              step={0.01}
              onChange={(v) => onUpdate(hb.id, { w: v })}
            />
            <Slider
              label="Alt."
              value={hb.h}
              min={0.02}
              max={1}
              step={0.01}
              onChange={(v) => onUpdate(hb.id, { h: v })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AddBtn({
  children,
  color,
  onClick,
}: {
  children: React.ReactNode;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg py-1.5 text-[11px] font-semibold"
      style={{ background: color + "22", color }}
    >
      {children}
    </button>
  );
}
