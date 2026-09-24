import { useEffect, useRef, useState } from "react";
import type {
  AnimationConfig,
  AnimationEvent,
  AnimationEventKind,
  SpriteSheetMeta,
} from "../types";
import { FramePicker } from "./FramePicker";
import { NumberField, Toggle, Slider, Select } from "./ui";

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
  onPreviewFrame,
  activeFrame,
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
  onPreviewFrame?: (frame: number) => void;
  activeFrame?: number;
}) {
  const editing = animations.find((a) => a.id === editingId);
  const rangeAnchorRef = useRef<{ id: string; frame: number } | null>(null);
  const [eventFrame, setEventFrame] = useState(activeFrame ?? 0);

  useEffect(() => {
    if (!editing) return;
    setEventFrame(
      Math.max(
        editing.startFrame,
        Math.min(editing.endFrame, activeFrame ?? editing.startFrame)
      )
    );
  }, [editing?.id, editing?.startFrame, editing?.endFrame, activeFrame]);

  const events = editing?.events ?? [];
  const updateEvents = (next: AnimationEvent[]) => {
    if (editing) onUpdate(editing.id, { events: next });
  };
  const addEvent = () => {
    if (!editing) return;
    const frame = Math.max(0, Math.min(meta.totalFrames - 1, eventFrame));
    updateEvents([
      ...events,
      {
        id: `event-${Date.now()}-${events.length}`,
        frame,
        kind: "script",
        name: "event",
        payload: "",
      },
    ]);
    onPreviewFrame?.(frame);
  };
  const updateEvent = (id: string, patch: Partial<AnimationEvent>) => {
    updateEvents(events.map((event) => (event.id === id ? { ...event, ...patch } : event)));
  };
  const deleteEvent = (id: string) => {
    updateEvents(events.filter((event) => event.id !== id));
  };

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
            Clique no início e depois no fim para definir o intervalo.
          </p>
          <FramePicker
            meta={meta}
            selectStart={editing.startFrame}
            selectEnd={editing.endFrame}
            onFrameClick={(i) => {
              onPreviewFrame?.(i);
              const anchor = rangeAnchorRef.current;
              if (!anchor || anchor.id !== editing.id) {
                // Primeiro clique define o frame âncora; o segundo completa o
                // intervalo. Isso permite escolher um início à direita do
                // intervalo atual, algo que a lógica anterior não permitia.
                rangeAnchorRef.current = { id: editing.id, frame: i };
                onUpdate(editing.id, {
                  startFrame: i,
                  endFrame: i,
                  frameOrder: null,
                });
                return;
              }
              rangeAnchorRef.current = null;
              onUpdate(editing.id, {
                startFrame: Math.min(anchor.frame, i),
                endFrame: Math.max(anchor.frame, i),
                frameOrder: null,
              });
            }}
          />
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Início"
              value={editing.startFrame}
              min={0}
              max={meta.totalFrames - 1}
              onChange={(v) => {
                rangeAnchorRef.current = null;
                onUpdate(editing.id, { startFrame: v, frameOrder: null });
              }}
            />
            <NumberField
              label="Fim"
              value={editing.endFrame}
              min={0}
              max={meta.totalFrames - 1}
              onChange={(v) => {
                rangeAnchorRef.current = null;
                onUpdate(editing.id, { endFrame: v, frameOrder: null });
              }}
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
          <label className="block text-xs">
            <span className="mb-1 block text-slate-400">Ordem customizada</span>
            <input
              value={editing.frameOrder?.join(",") ?? ""}
              placeholder="ex.: 0,1,2,1"
              onChange={(event) => {
                const value = event.target.value.trim();
                if (!value) {
                  onUpdate(editing.id, { frameOrder: null });
                  return;
                }
                const frames = value
                  .split(",")
                  .map((item) => Number(item.trim()))
                  .filter((item) => Number.isInteger(item) && item >= 0);
                onUpdate(editing.id, { frameOrder: frames.length ? frames : null });
              }}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
            />
            <span className="mt-1 block text-[10px] text-slate-500">
              Permite repetição, hold e ordem reversa. Deixe vazio para usar início/fim.
            </span>
          </label>
          <Toggle
            label="Yoyo (ida e volta)"
            value={editing.yoyo}
            onChange={(v) => onUpdate(editing.id, { yoyo: v })}
          />

          <div className="space-y-2 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/5 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-fuchsia-200">⚑ Eventos de gameplay</p>
                <p className="text-[10px] text-slate-400">
                  Gatilhos por frame para scripts, som, FX e hitboxes.
                </p>
              </div>
              <button
                type="button"
                onClick={addEvent}
                className="shrink-0 rounded bg-fuchsia-500/20 px-2 py-1 text-[10px] font-semibold text-fuchsia-200 hover:bg-fuchsia-500/30"
              >
                + Marcador
              </button>
            </div>
            <NumberField
              label="Frame do novo marcador"
              value={eventFrame}
              min={0}
              max={meta.totalFrames - 1}
              onChange={(value) => {
                setEventFrame(value);
                onPreviewFrame?.(value);
              }}
            />
            {events.length === 0 ? (
              <p className="rounded bg-slate-900/70 px-2 py-2 text-[10px] text-slate-500">
                Ex.: adicione <b>attack_start</b> no primeiro frame do golpe e
                reaja a ele no seu código do jogo.
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="rounded-md border border-slate-700 bg-slate-900/80 p-2">
                    <div className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={meta.totalFrames - 1}
                        value={event.frame}
                        onChange={(e) => {
                          const value = Math.max(
                            0,
                            Math.min(meta.totalFrames - 1, e.target.valueAsNumber || 0)
                          );
                          updateEvent(event.id, { frame: value });
                          onPreviewFrame?.(value);
                        }}
                        className="w-full rounded border border-slate-700 bg-slate-950 px-1.5 py-1 text-right font-mono text-xs text-slate-100"
                        aria-label="Frame do evento"
                      />
                      <input
                        value={event.name}
                        onChange={(e) => updateEvent(event.id, { name: e.target.value })}
                        className="min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                        placeholder="nome_do_evento"
                        aria-label="Nome do evento"
                      />
                      <button
                        type="button"
                        onClick={() => deleteEvent(event.id)}
                        className="rounded bg-rose-500/15 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/25"
                        title="Remover evento"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      <Select<AnimationEventKind>
                        label="Tipo"
                        value={event.kind}
                        options={[
                          { value: "script", label: "Script" },
                          { value: "sound", label: "Som" },
                          { value: "hitbox", label: "Hitbox" },
                          { value: "fx", label: "FX" },
                        ]}
                        onChange={(value) => updateEvent(event.id, { kind: value })}
                      />
                      <input
                        value={event.payload}
                        onChange={(e) => updateEvent(event.id, { payload: e.target.value })}
                        className="min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
                        placeholder="payload opcional"
                        aria-label="Payload do evento"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
