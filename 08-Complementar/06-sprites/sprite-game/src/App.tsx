import { useEffect, useRef, useState } from "react";
import {
  emptyProject,
  ANIM_COLORS,
  EASE_OPTIONS,
  type ProjectConfig,
  type AnimationConfig,
  type NpcInstance,
  type HitboxConfig,
  type BlendMode,
  type FrameEdit,
  type FrameRect,
} from "./types";
import { useGame } from "./game/useGame";
import type {
  AnimationEventTrigger,
  LiveGameState,
} from "./game/SpriteScene";
import {
  loadImageFromFile,
  buildMeta,
  getFrameCount,
  getFrameRect,
  guessFrameSize,
} from "./game/sliceSheet";
import {
  exportConfigJson,
  exportPhaserComponent,
  exportSpriteSheetImage,
  exportFullProject,
  exportRuntimeManifest,
  exportRuntimeScript,
  exportAtlasJson,
  importProject,
} from "./game/exportProject";
import * as audio from "./audio";
import {
  Section,
  Slider,
  NumberField,
  Toggle,
  ColorField,
  Select,
} from "./components/ui";
import { AnimationsPanel } from "./components/AnimationsPanel";
import { FrameRectEditor } from "./components/FrameRectEditor";
import { NpcPanel } from "./components/NpcPanel";
import { HitboxPanel } from "./components/HitboxPanel";
import { TYPE_COLORS } from "./components/hitboxConstants";
import { Timeline } from "./components/Timeline";
import { HelpModal } from "./components/HelpModal";
import { PresetGallery } from "./components/PresetGallery";
import { loadPreset, type PresetDef } from "./presets";

let idCounter = 0;
const uid = () => `a${Date.now().toString(36)}${idCounter++}`;

type Tab = "anim" | "character" | "npc" | "hitbox" | "fx" | "sound" | "stage";
type UiScale = "normal" | "large" | "xlarge";
const UI_SCALES: UiScale[] = ["normal", "large", "xlarge"];

export default function App() {
  const [config, setConfig] = useState<ProjectConfig>(emptyProject());
  const [live, setLive] = useState<LiveGameState>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    currentAnim: "-",
    onGround: false,
    fps: 0,
    gamepadConnected: false,
    activeFrame: 0,
    jumps: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectedFrame, setInspectedFrame] = useState(0);
  const [tab, setTab] = useState<Tab>("anim");
  const [showHelp, setShowHelp] = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showPresets, setShowPresets] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uiScale, setUiScale] = useState<UiScale>("normal");
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);
  configRef.current = config;
  // trava a aplicação de config parciais enquanto um sheet novo carrega
  const loadingRef = useRef(false);
  const loadRequestRef = useRef(0);

  const callbacks = useRef({
    onState: (s: LiveGameState) => {
      setLive(s);
      setInspectedFrame(s.activeFrame);
    },
    onError: (msg: string) => {
      setErrorMsg(msg);
      setLoading(false);
      loadingRef.current = false;
    },
    onReady: () => {
      setLoading(false);
      loadingRef.current = false;
      // reaplica config parcial (transformações, fx) já com o sheet pronto
      const scene = sceneRef.current;
      if (scene && configRef.current.meta) scene.applyConfig(configRef.current);
    },
    onAnimationEvent: ({ event, animationName, frame }: AnimationEventTrigger) => {
      setLastEvent(`${event.name} · ${animationName} · frame ${frame}`);
    },
  }).current;

  const { sceneRef } = useGame(stageRef, config, callbacks);

  // carrega um novo spritesheet de forma segura (com estado de loading/erro)
  const loadSheet = (newConfig: ProjectConfig) => {
    const requestId = ++loadRequestRef.current;
    setErrorMsg(null);
    setLoading(true);
    loadingRef.current = true;
    setConfig(newConfig);
    // aguarda o React commitar; a cena aplica via pendingConfig se ainda não
    // estiver pronta. onReady/onError encerram o estado de loading.
    requestAnimationFrame(() => {
      sceneRef.current?.rebuildFromConfig(newConfig);
    });
    // fallback de segurança caso onReady/onError nunca disparem
    window.setTimeout(() => {
      if (requestId === loadRequestRef.current && loadingRef.current) {
        setLoading(false);
        loadingRef.current = false;
      }
    }, 5000);
  };

  useEffect(() => {
    const scene = sceneRef.current;
    // não aplica config parcial enquanto um sheet novo está carregando
    if (scene && config.meta && !loadingRef.current) scene.applyConfig(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.character,
    config.animations,
    config.animMapping,
    config.fx,
    config.sound,
    config.stage,
    config.npcs,
    config.hitboxes,
    config.frameEdits,
  ]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("spritelab-ui-scale");
      if (stored === "normal" || stored === "large" || stored === "xlarge") {
        setUiScale(stored);
      }
    } catch {
      // Alguns contextos privados bloqueiam localStorage; use a escala padrão.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("spritelab-ui-scale", uiScale);
    } catch {
      // Preferência visual não deve impedir o uso do editor.
    }
  }, [uiScale]);

  useEffect(() => {
    if (!lastEvent) return;
    const timer = window.setTimeout(() => setLastEvent(null), 1800);
    return () => window.clearTimeout(timer);
  }, [lastEvent]);

  useEffect(() => {
    if (config.sound.ambientEnabled) audio.startAmbient();
    else audio.stopAmbient();
  }, [config.sound.ambientEnabled]);

  // patchers
  const patchCharacter = (p: Partial<ProjectConfig["character"]>) =>
    setConfig((c) => ({ ...c, character: { ...c.character, ...p } }));
  const patchFx = (p: Partial<ProjectConfig["fx"]>) =>
    setConfig((c) => ({ ...c, fx: { ...c.fx, ...p } }));
  const patchSound = (p: Partial<ProjectConfig["sound"]>) =>
    setConfig((c) => ({ ...c, sound: { ...c.sound, ...p } }));
  const patchStage = (p: Partial<ProjectConfig["stage"]>) =>
    setConfig((c) => ({ ...c, stage: { ...c.stage, ...p } }));

  // ---- upload / demo ----
  const handleUpload = async (file: File) => {
    audio.resumeAudio();
    try {
      const { dataUrl, width, height } = await loadImageFromFile(file);
      const { fw, fh } = guessFrameSize(width, height);
      const meta = buildMeta(file.name, dataUrl, width, height, fw, fh);
      // começa do zero para não herdar animações do sheet anterior
      const newConfig = { ...emptyProject(), meta };
      setSelectedId(null);
      setEditingId(null);
      setInspectedFrame(0);
      loadSheet(newConfig);
    } catch (e) {
      console.error(e);
      setErrorMsg("Não foi possível ler este arquivo de imagem.");
    }
  };

  const applyPreset = async (preset: PresetDef) => {
    audio.resumeAudio();
    setErrorMsg(null);
    setLoading(true);
    try {
      const newConfig = await loadPreset(preset);
      setSelectedId(newConfig.animations[0]?.id ?? null);
      setEditingId(null);
      setInspectedFrame(0);
      setShowPresets(false);
      loadSheet(newConfig);
    } catch (e) {
      console.error(e);
      setLoading(false);
      setErrorMsg("Falha ao carregar o modelo. Verifique sua conexão.");
    }
  };

  const handleImportProject = async (file: File) => {
    setErrorMsg(null);
    try {
      const project = await importProject(file);
      setSelectedId(project.animations[0]?.id ?? null);
      setEditingId(null);
      setInspectedFrame(0);
      loadSheet(project);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Arquivo de projeto inválido.";
      setErrorMsg(message);
      console.error(e);
    }
  };

  const rebuildImage = (patch: Partial<{
    fw: number;
    fh: number;
    mx: number;
    my: number;
    sx: number;
    sy: number;
    frameRects: FrameRect[] | null;
  }>) => {
    if (!config.meta) return;
    const m = config.meta;
    const meta = buildMeta(
      m.fileName,
      m.dataUrl,
      m.imageWidth,
      m.imageHeight,
      patch.fw ?? m.frameWidth,
      patch.fh ?? m.frameHeight,
      patch.mx ?? m.marginX,
      patch.my ?? m.marginY,
      patch.sx ?? m.spacingX,
      patch.sy ?? m.spacingY,
      "frameRects" in patch ? patch.frameRects : m.frameRects
    );
    const maxFrame = Math.max(0, meta.totalFrames - 1);
    const animations = configRef.current.animations.map((animation) => ({
      ...animation,
      startFrame: Math.min(maxFrame, Math.max(0, animation.startFrame)),
      endFrame: Math.min(maxFrame, Math.max(0, animation.endFrame)),
      frameOrder: animation.frameOrder?.map((frame) =>
        Math.min(maxFrame, Math.max(0, frame))
      ) ?? null,
    }));
    const frameEdits = Object.fromEntries(
      Object.entries(configRef.current.frameEdits).filter(
        ([frame]) => Number(frame) >= 0 && Number(frame) <= maxFrame
      )
    );
    const hitboxes = configRef.current.hitboxes.map((hitbox) => ({
      ...hitbox,
      frame:
        hitbox.frame === null || hitbox.frame <= maxFrame ? hitbox.frame : null,
    }));
    const newConfig = {
      ...configRef.current,
      meta,
      animations,
      frameEdits,
      hitboxes,
    };
    loadSheet(newConfig);
  };

  const enterFreeFrameMode = () => {
    if (!config.meta || config.meta.frameRects?.length) return;
    const rects = Array.from({ length: config.meta.totalFrames }, (_, index) =>
      getFrameRect(config.meta!, index)
    ).filter((rect): rect is FrameRect => Boolean(rect));
    rebuildImage({ frameRects: rects });
  };

  const updateFrameRects = (rects: FrameRect[]) => {
    rebuildImage({ frameRects: rects });
  };

  const patchFrameEdit = (frame: number, patch: Partial<FrameEdit>) => {
    const safeFrame = Math.max(0, Math.floor(frame));
    setInspectedFrame(safeFrame);
    // Ao começar um ajuste, congela o frame alvo. Assim o slider nunca grava
    // valores em quadros diferentes porque a animação continuou tocando.
    sceneRef.current?.setFrame(safeFrame);
    const key = String(safeFrame);
    setConfig((current) => ({
      ...current,
      frameEdits: {
        ...current.frameEdits,
        [key]: { ...current.frameEdits[key], ...patch },
      },
    }));
  };

  const clearFrameEdit = (frame: number) => {
    const key = String(Math.max(0, Math.floor(frame)));
    setConfig((current) => {
      const frameEdits = { ...current.frameEdits };
      delete frameEdits[key];
      return { ...current, frameEdits };
    });
  };

  const clearFrameOrigin = (frame: number) => {
    const safeFrame = Math.max(0, Math.floor(frame));
    setInspectedFrame(safeFrame);
    sceneRef.current?.setFrame(safeFrame);
    const key = String(safeFrame);
    setConfig((current) => {
      const edit = current.frameEdits[key];
      if (!edit) return current;
      const nextEdit = { ...edit };
      delete nextEdit.originX;
      delete nextEdit.originY;
      const frameEdits = { ...current.frameEdits };
      if (Object.keys(nextEdit).length) frameEdits[key] = nextEdit;
      else delete frameEdits[key];
      return { ...current, frameEdits };
    });
  };

  // ---- animations ----
  const addAnimation = () => {
    if (!config.meta) return;
    const a: AnimationConfig = {
      id: uid(),
      name: `anim_${config.animations.length + 1}`,
      startFrame: 0,
      endFrame: Math.min(3, config.meta.totalFrames - 1),
      frameRate: 10,
      repeat: -1,
      yoyo: false,
      frameOrder: null,
      color: ANIM_COLORS[config.animations.length % ANIM_COLORS.length],
    };
    setConfig((c) => ({ ...c, animations: [...c.animations, a] }));
    setEditingId(a.id);
    setSelectedId(a.id);
  };
  const updateAnimation = (id: string, p: Partial<AnimationConfig>) =>
    setConfig((c) => ({
      ...c,
      animations: c.animations.map((a) => (a.id === id ? { ...a, ...p } : a)),
    }));
  const duplicateAnimation = (id: string) => {
    const src = config.animations.find((a) => a.id === id);
    if (!src) return;
    const copy: AnimationConfig = {
      ...src,
      id: uid(),
      name: src.name + "_copy",
      color: ANIM_COLORS[config.animations.length % ANIM_COLORS.length],
    };
    setConfig((c) => ({ ...c, animations: [...c.animations, copy] }));
    setSelectedId(copy.id);
  };
  const deleteAnimation = (id: string) => {
    setConfig((c) => ({
      ...c,
      animations: c.animations.filter((a) => a.id !== id),
      animMapping: Object.fromEntries(
        Object.entries(c.animMapping).map(([k, v]) => [k, v === id ? null : v])
      ) as ProjectConfig["animMapping"],
      npcs: c.npcs.map((n) => (n.animId === id ? { ...n, animId: null } : n)),
    }));
    if (editingId === id) setEditingId(null);
    if (selectedId === id) setSelectedId(null);
  };
  const playAnimation = (id: string) => {
    audio.resumeAudio();
    setSelectedId(id);
    sceneRef.current?.playAnimation(id);
  };

  // ---- npc ----
  const addNpc = () => {
    if (!config.meta) return;
    const npc: NpcInstance = {
      id: uid(),
      label: `NPC ${config.npcs.length + 1}`,
      animId: config.animMapping.idle ?? config.animations[0]?.id ?? null,
      x: 150 + config.npcs.length * 90,
      y: 300,
      scale: 3,
      tint: "#ffd6a5",
      tintEnabled: false,
      flipX: false,
      behavior: "patrol",
      patrolRange: 120,
      speed: 60,
    };
    setConfig((c) => ({ ...c, npcs: [...c.npcs, npc] }));
  };
  const updateNpc = (id: string, p: Partial<NpcInstance>) =>
    setConfig((c) => ({
      ...c,
      npcs: c.npcs.map((n) => (n.id === id ? { ...n, ...p } : n)),
    }));
  const deleteNpc = (id: string) =>
    setConfig((c) => ({ ...c, npcs: c.npcs.filter((n) => n.id !== id) }));

  // ---- hitboxes ----
  const addHitbox = (type: HitboxConfig["type"]) => {
    const hb: HitboxConfig = {
      id: uid(),
      name: type,
      type,
      x: 0.3,
      y: 0.3,
      w: 0.4,
      h: 0.4,
      color: TYPE_COLORS[type],
      frame: null,
      enabled: true,
    };
    setConfig((c) => ({
      ...c,
      hitboxes: [...c.hitboxes, hb],
      stage: { ...c.stage, showHitboxes: true },
    }));
  };
  const updateHitbox = (id: string, p: Partial<HitboxConfig>) =>
    setConfig((c) => ({
      ...c,
      hitboxes: c.hitboxes.map((h) => (h.id === id ? { ...h, ...p } : h)),
    }));
  const deleteHitbox = (id: string) =>
    setConfig((c) => ({
      ...c,
      hitboxes: c.hitboxes.filter((h) => h.id !== id),
    }));

  const animOptions = [
    { value: "", label: "— nenhuma —" },
    ...config.animations.map((a) => ({ value: a.id, label: a.name })),
  ];
  const setMapping = (slot: keyof ProjectConfig["animMapping"], v: string) =>
    setConfig((c) => ({
      ...c,
      animMapping: { ...c.animMapping, [slot]: v || null },
    }));

  const selectFrame = (frame: number) => {
    setInspectedFrame(Math.max(0, Math.floor(frame)));
    sceneRef.current?.setFrame(frame);
  };

  const selectedAnim = config.animations.find((a) => a.id === selectedId) ?? null;
  const activeFrame = config.meta
    ? Math.max(0, Math.min(config.meta.totalFrames - 1, inspectedFrame))
    : 0;
  const activeFrameEdit = config.frameEdits[String(activeFrame)] ?? {};

  return (
    <div
      className={`ui-root ui-scale-${uiScale} flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-slate-950 text-slate-100`}
      onClick={() => audio.resumeAudio()}
    >
      {/* Header */}
      <header className="flex min-h-14 flex-wrap items-center gap-3 border-b border-slate-800 bg-slate-900 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎮</span>
          <h1 className="text-lg font-bold tracking-tight">
            Sprite<span className="text-sky-400">Lab</span>
          </h1>
          <span className="hidden rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 lg:inline">
            Animation Studio · React + Phaser
          </span>
        </div>
        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
        <StatusPill
          ok={live.gamepadConnected}
          label={live.gamepadConnected ? "🎮 Controle" : "🎮 Sem controle"}
        />
        <StatusPill ok label={`${live.fps} FPS`} neutral />
        <button
          type="button"
          title="Aumentar o tamanho das letras"
          aria-label={`Tamanho do texto: ${uiScale}. Clique para alterar`}
          onClick={() =>
            setUiScale((current) => {
              const index = UI_SCALES.indexOf(current);
              return UI_SCALES[(index + 1) % UI_SCALES.length];
            })
          }
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
        >
          Aa <span className="hidden sm:inline">{uiScale === "normal" ? "100%" : uiScale === "large" ? "115%" : "130%"}</span>
        </button>
        <button
          onClick={() => setShowPresets(true)}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          🗂️ Modelos
        </button>
        <button
          onClick={() => setShowHelp(true)}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          📖 Ajuda
        </button>
        <label className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800">
          📂 Importar
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.currentTarget.value = "";
              if (file) void handleImportProject(file);
            }}
          />
        </label>
        <div className="relative">
          <button
            onClick={() => setExportOpen((o) => !o)}
            disabled={!config.meta}
            className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-400 disabled:opacity-40"
          >
            ⬇ Exportar
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-72 max-w-[calc(100vw-1rem)] rounded-lg border border-slate-700 bg-slate-800 p-1 shadow-xl">
              <ExportItem
                title="Projeto completo (.json)"
                sub="Reimportável (inclui imagem)"
                onClick={() => {
                  exportFullProject(config);
                  setExportOpen(false);
                }}
              />
              <ExportItem
                title="config.json"
                sub="Configurações (sem imagem)"
                onClick={() => {
                  exportConfigJson(config);
                  setExportOpen(false);
                }}
              />
              <ExportItem
                title="Atlas JSON"
                sub="Retângulos de frames para Phaser/web"
                onClick={() => {
                  exportAtlasJson(config);
                  setExportOpen(false);
                }}
              />
              <ExportItem
                title="Runtime manifest (.json)"
                sub="Configuração leve para seu jogo"
                onClick={() => {
                  exportRuntimeManifest(config);
                  setExportOpen(false);
                }}
              />
              <ExportItem
                title="SpriteLabRuntime.ts"
                sub="API Phaser com eventos e hitboxes"
                onClick={() => {
                  exportRuntimeScript(config);
                  setExportOpen(false);
                }}
              />
              <ExportItem
                title="PhaserSprite.tsx"
                sub="Componente React + Phaser"
                onClick={() => {
                  exportPhaserComponent(config);
                  setExportOpen(false);
                }}
              />
              <ExportItem
                title="Spritesheet (PNG)"
                sub="Imagem original"
                onClick={() => {
                  exportSpriteSheetImage(config);
                  setExportOpen(false);
                }}
              />
            </div>
          )}
        </div>
        </div>
      </header>

      {/* Body */}
      <div className="workspace-layout flex min-h-0 flex-1 flex-col overflow-x-hidden lg:flex-row">
        {/* Stage + timeline */}
        <main className="stage-main flex min-h-0 min-w-0 flex-1 flex-col bg-slate-900">
          <div className="stage-viewport relative flex min-h-0 flex-1 flex-col">
            <div ref={stageRef} className="stage-canvas min-h-0 w-full flex-1" />

            {/* overlay de carregamento */}
            {loading && (
              <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950/40 backdrop-blur-[1px]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-sky-400" />
                <p className="text-sm font-medium text-slate-200">
                  Carregando spritesheet…
                </p>
              </div>
            )}

            {/* toast de erro */}
            {errorMsg && (
              <div className="absolute left-1/2 top-4 z-30 flex max-w-md -translate-x-1/2 items-center gap-3 rounded-lg border border-rose-500/40 bg-rose-500/15 px-4 py-2.5 text-sm text-rose-200 shadow-lg backdrop-blur">
                <span>⚠️</span>
                <span className="flex-1">{errorMsg}</span>
                <button
                  onClick={() => setErrorMsg(null)}
                  className="rounded px-2 py-0.5 text-rose-300 hover:bg-rose-500/20"
                >
                  ✕
                </button>
              </div>
            )}

            {!config.meta && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-auto p-6 text-center">
                <div>
                  <div className="mb-1 text-5xl">🎮</div>
                  <p className="text-lg font-semibold">
                    Escolha um modelo base para testar
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Spritesheets prontos com fundo transparente e animações
                    pré-configuradas
                  </p>
                </div>
                <div className="w-full max-w-2xl">
                  <PresetGallery onSelect={applyPreset} />
                </div>
                <div className="pointer-events-auto flex items-center gap-3">
                  <label className="cursor-pointer rounded-xl bg-sky-500 px-5 py-2.5 font-semibold text-white hover:bg-sky-400">
                    📤 Enviar meu spritesheet
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.currentTarget.value = "";
                        if (file) void handleUpload(file);
                      }}
                    />
                  </label>
                  <button
                    className="text-xs text-slate-400 underline"
                    onClick={() => setShowHelp(true)}
                  >
                    Ver guia de uso
                  </button>
                </div>
              </div>
            )}

            {config.meta && (
              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 rounded-lg bg-slate-950/70 px-2.5 py-1.5 font-mono text-[11px] text-slate-300 backdrop-blur">
                <span>x:{live.x}</span>
                <span>y:{live.y}</span>
                <span className="text-cyan-300">
                  vx:{live.vx} vy:{live.vy}
                </span>
                <span className="text-sky-300">anim:{live.currentAnim}</span>
                <span className="text-amber-300">frame:{live.activeFrame}</span>
                <span
                  className={
                    live.onGround ? "text-emerald-400" : "text-slate-500"
                  }
                >
                  {live.onGround ? "no chão" : "no ar"}
                </span>
              </div>
            )}

            {lastEvent && config.meta && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-lg border border-fuchsia-400/40 bg-fuchsia-950/80 px-3 py-1.5 text-xs font-medium text-fuchsia-100 shadow-lg backdrop-blur">
                ⚑ {lastEvent}
              </div>
            )}

            {/* zoom quick control */}
            {config.meta && (
              <div className="absolute right-3 top-3 flex items-center gap-2 rounded-lg bg-slate-950/70 px-3 py-1.5 backdrop-blur">
                <span className="text-xs text-slate-400">🔍</span>
                <input
                  type="range"
                  min={0.3}
                  max={3}
                  step={0.1}
                  value={config.stage.zoom}
                  onChange={(e) =>
                    patchStage({ zoom: parseFloat(e.target.value) })
                  }
                  className="w-28 accent-sky-500"
                />
                <span className="w-8 font-mono text-[11px] text-slate-200">
                  {config.stage.zoom.toFixed(1)}x
                </span>
              </div>
            )}
          </div>

          {/* control hint bar */}
          {config.meta && (
            <div className="border-t border-slate-800 bg-slate-950/80 px-4 py-2">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                <Hint k="← → / A D" d="mover" />
                <Hint k="↑ ↓ / W S" d="cima/baixo" />
                <Hint k="Shift" d="correr" />
                <Hint k="Espaço / K" d="pular" />
                <Hint k="J" d="ação" />
                <Hint k="🎮" d="controle USB" />
                <button
                  onClick={() => setShowTimeline((s) => !s)}
                  className="ml-auto rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                >
                  {showTimeline ? "▼ Timeline" : "▲ Timeline"}
                </button>
                <button
                  onClick={() => sceneRef.current?.resetPlayer()}
                  className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                >
                  ↺ Reset
                </button>
              </div>
            </div>
          )}

          {/* Timeline */}
          {config.meta && showTimeline && (
            <div className="stage-timeline h-48 shrink-0 border-t border-slate-800 bg-slate-900 sm:h-52">
              <Timeline
                meta={config.meta}
                anim={selectedAnim}
                onScrub={selectFrame}
                onStep={selectFrame}
                onPlay={() =>
                  selectedAnim && sceneRef.current?.playAnimation(selectedAnim.id)
                }
                onPause={() => sceneRef.current?.pauseAnimation()}
                onStop={() => sceneRef.current?.resetPlayer()}
              />
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="stage-sidebar flex min-h-0 max-h-[48dvh] w-full shrink-0 flex-col overflow-hidden border-t border-slate-800 bg-slate-900 lg:max-h-none lg:w-80 lg:border-l lg:border-t-0">
          <div className="border-b border-slate-800 p-3">
            <label className="block cursor-pointer rounded-lg border border-dashed border-slate-600 bg-slate-800/40 py-2.5 text-center text-xs font-semibold text-slate-300 hover:border-sky-500 hover:text-sky-300">
              {config.meta ? "🔄 Trocar spritesheet" : "📤 Enviar Spritesheet"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.currentTarget.value = "";
                  if (file) void handleUpload(file);
                }}
              />
            </label>
            {config.meta && (
              <p className="mt-2 truncate text-center text-[10px] text-slate-500">
                {config.meta.fileName} · {config.meta.imageWidth}×
                {config.meta.imageHeight} · {config.meta.totalFrames} frames
              </p>
            )}
          </div>

          {config.meta ? (
            <>
              {/* tabs */}
              <div className="flex flex-wrap gap-1 border-b border-slate-800 p-2">
                <TabBtn active={tab === "anim"} onClick={() => setTab("anim")}>
                  🎬 Anim
                </TabBtn>
                <TabBtn
                  active={tab === "character"}
                  onClick={() => setTab("character")}
                >
                  🏃 Player
                </TabBtn>
                <TabBtn active={tab === "npc"} onClick={() => setTab("npc")}>
                  🧍 NPCs
                </TabBtn>
                <TabBtn
                  active={tab === "hitbox"}
                  onClick={() => setTab("hitbox")}
                >
                  🟩 Boxes
                </TabBtn>
                <TabBtn active={tab === "fx"} onClick={() => setTab("fx")}>
                  ✨ FX
                </TabBtn>
                <TabBtn active={tab === "sound"} onClick={() => setTab("sound")}>
                  🔊 Som
                </TabBtn>
                <TabBtn active={tab === "stage"} onClick={() => setTab("stage")}>
                  🎨 Cena
                </TabBtn>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {tab === "anim" && (
                  <>
                    <Section title="Leitura do Spritesheet" icon="🔲" defaultOpen={false}>
                      {!config.meta.frameRects?.length ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <NumberField
                              label="Larg. frame"
                              value={config.meta.frameWidth}
                              min={1}
                              onChange={(v) => rebuildImage({ fw: v || 1 })}
                            />
                            <NumberField
                              label="Alt. frame"
                              value={config.meta.frameHeight}
                              min={1}
                              onChange={(v) => rebuildImage({ fh: v || 1 })}
                            />
                            <NumberField
                              label="Margem"
                              value={config.meta.marginX}
                              min={0}
                              onChange={(v) => rebuildImage({ mx: v, my: v })}
                            />
                            <NumberField
                              label="Espaço"
                              value={config.meta.spacingX}
                              min={0}
                              onChange={(v) => rebuildImage({ sx: v, sy: v })}
                            />
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {config.meta.columns} col × {config.meta.rows} lin ={" "}
                            {config.meta.totalFrames} frames
                          </p>
                          <button
                            type="button"
                            onClick={enterFreeFrameMode}
                            className="w-full rounded-lg border border-amber-500/40 bg-amber-500/10 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                          >
                            ✨ Editar áreas livremente
                          </button>
                          <p className="text-[10px] text-slate-500">
                            Crie, mova e redimensione cada quadro diretamente sobre a imagem.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] text-amber-200/80">
                            Modo livre ativo: cada quadro possui posição e tamanho independentes.
                          </p>
                          <FrameRectEditor
                            meta={config.meta}
                            onChange={updateFrameRects}
                            onSelectFrame={selectFrame}
                          />
                          <button
                            type="button"
                            onClick={() => rebuildImage({ frameRects: null })}
                            className="w-full rounded-lg bg-slate-800 py-2 text-xs text-slate-300 hover:bg-slate-700"
                          >
                            ↺ Voltar para grade uniforme
                          </button>
                        </>
                      )}
                    </Section>

                    <Section title="Ajuste do quadro ativo" icon="🎯" defaultOpen={false}>
                      <p className="text-[10px] text-slate-500">
                        Frame {activeFrame}: ajustes adicionais sem alterar a imagem original.
                        A origem X/Y fica na seção Transformação do Sprite.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Slider
                          label="Escala X"
                          value={activeFrameEdit.scaleX ?? 1}
                          min={0.1}
                          max={3}
                          step={0.05}
                          onChange={(v) => patchFrameEdit(activeFrame, { scaleX: v })}
                        />
                        <Slider
                          label="Escala Y"
                          value={activeFrameEdit.scaleY ?? 1}
                          min={0.1}
                          max={3}
                          step={0.05}
                          onChange={(v) => patchFrameEdit(activeFrame, { scaleY: v })}
                        />
                      </div>
                      <Slider
                        label="Rotação"
                        value={activeFrameEdit.rotation ?? 0}
                        min={-180}
                        max={180}
                        onChange={(v) => patchFrameEdit(activeFrame, { rotation: v })}
                      />
                      <Slider
                        label="Opacidade"
                        value={activeFrameEdit.alpha ?? 1}
                        min={0}
                        max={1}
                        step={0.05}
                        onChange={(v) => patchFrameEdit(activeFrame, { alpha: v })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Toggle
                          label="Flip X"
                          value={activeFrameEdit.flipX ?? false}
                          onChange={(v) => patchFrameEdit(activeFrame, { flipX: v })}
                        />
                        <Toggle
                          label="Flip Y"
                          value={activeFrameEdit.flipY ?? false}
                          onChange={(v) => patchFrameEdit(activeFrame, { flipY: v })}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => clearFrameEdit(activeFrame)}
                        className="w-full rounded bg-slate-800 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
                      >
                        Limpar ajustes do frame
                      </button>
                    </Section>

                    <Section title="Animações" icon="🎬">
                      <AnimationsPanel
                        meta={config.meta}
                        animations={config.animations}
                        editingId={editingId}
                        selectedId={selectedId}
                        setEditingId={setEditingId}
                        onSelect={setSelectedId}
                        onAdd={addAnimation}
                        onUpdate={updateAnimation}
                        onDelete={deleteAnimation}
                        onDuplicate={duplicateAnimation}
                        onPlay={playAnimation}
                        onPreviewFrame={selectFrame}
                        activeFrame={activeFrame}
                      />
                    </Section>

                    <Section title="Máquina de Estados" icon="🕹️">
                      <p className="mb-1 text-[10px] text-slate-500">
                        Associe animações a estados (estilo Unity Animator). O
                        motor troca automaticamente conforme o movimento.
                      </p>
                      {(
                        [
                          "idle",
                          "walk",
                          "run",
                          "jump",
                          "fall",
                          "action",
                          "hurt",
                        ] as const
                      ).map((slot) => (
                        <Select
                          key={slot}
                          label={slot}
                          value={config.animMapping[slot] ?? ""}
                          options={animOptions}
                          onChange={(v) => setMapping(slot, v)}
                        />
                      ))}
                    </Section>
                  </>
                )}

                {tab === "character" && (
                  <>
                    <Section title="Movimento & Física" icon="🏃">
                      <Select
                        label="Modo"
                        value={config.character.movementMode}
                        options={[
                          {
                            value: "platformer",
                            label: "Plataforma (gravidade)",
                          },
                          { value: "topdown", label: "Top-down (livre)" },
                        ]}
                        onChange={(v) => patchCharacter({ movementMode: v })}
                      />
                      <Slider
                        label="Velocidade"
                        value={config.character.speed}
                        min={20}
                        max={600}
                        onChange={(v) => patchCharacter({ speed: v })}
                      />
                      <Slider
                        label="Multiplicador de corrida"
                        value={config.character.runMultiplier}
                        min={1}
                        max={3.5}
                        step={0.05}
                        suffix="x"
                        onChange={(v) => patchCharacter({ runMultiplier: v })}
                      />
                      <Slider
                        label="Aceleração (suavização)"
                        value={config.character.accel}
                        min={0.02}
                        max={1}
                        step={0.02}
                        onChange={(v) => patchCharacter({ accel: v })}
                      />
                      {config.character.movementMode === "platformer" && (
                        <>
                          <Slider
                            label="Força do pulo"
                            value={config.character.jumpPower}
                            min={100}
                            max={1200}
                            onChange={(v) => patchCharacter({ jumpPower: v })}
                          />
                          <Slider
                            label="Gravidade"
                            value={config.character.gravity}
                            min={100}
                            max={2500}
                            onChange={(v) => patchCharacter({ gravity: v })}
                          />
                          <Slider
                            label="Velocidade máxima de queda"
                            value={config.character.maxFallSpeed}
                            min={100}
                            max={3000}
                            onChange={(v) => patchCharacter({ maxFallSpeed: v })}
                          />
                          <Slider
                            label="Coyote time"
                            value={config.character.coyoteTime}
                            min={0}
                            max={300}
                            step={10}
                            suffix=" ms"
                            onChange={(v) => patchCharacter({ coyoteTime: v })}
                          />
                          <Slider
                            label="Buffer do pulo"
                            value={config.character.jumpBuffer}
                            min={0}
                            max={300}
                            step={10}
                            suffix=" ms"
                            onChange={(v) => patchCharacter({ jumpBuffer: v })}
                          />
                          <Slider
                            label="Controle no ar"
                            value={config.character.airControl}
                            min={0}
                            max={1}
                            step={0.05}
                            onChange={(v) => patchCharacter({ airControl: v })}
                          />
                          <Toggle
                            label="Pulo duplo"
                            value={config.character.doubleJump}
                            onChange={(v) => patchCharacter({ doubleJump: v })}
                          />
                        </>
                      )}
                    </Section>

                    <Section title="Transformação do Sprite" icon="📐">
                      <Slider
                        label="Escala geral"
                        value={config.character.scale}
                        min={0.5}
                        max={10}
                        step={0.25}
                        suffix="x"
                        onChange={(v) => patchCharacter({ scale: v })}
                      />
                      <Slider
                        label="Escala X"
                        value={config.character.scaleX}
                        min={20}
                        max={200}
                        suffix="%"
                        onChange={(v) => patchCharacter({ scaleX: v })}
                      />
                      <Slider
                        label="Escala Y"
                        value={config.character.scaleY}
                        min={20}
                        max={200}
                        suffix="%"
                        onChange={(v) => patchCharacter({ scaleY: v })}
                      />
                      <Slider
                        label="Rotação"
                        value={config.character.rotation}
                        min={-180}
                        max={180}
                        suffix="°"
                        onChange={(v) => patchCharacter({ rotation: v })}
                      />
                      <Slider
                        label="Opacidade"
                        value={config.character.opacity}
                        min={0.1}
                        max={1}
                        step={0.05}
                        onChange={(v) => patchCharacter({ opacity: v })}
                      />
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2">
                        <p className="mb-2 text-[10px] text-amber-200/80">
                          Origem do frame ativo: <b>{activeFrame}</b>. Estes controles
                          não alteram os outros quadros.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Slider
                            label="Origem X"
                            value={activeFrameEdit.originX ?? config.character.originX}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(v) => patchFrameEdit(activeFrame, { originX: v })}
                          />
                          <Slider
                            label="Origem Y"
                            value={activeFrameEdit.originY ?? config.character.originY}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(v) => patchFrameEdit(activeFrame, { originY: v })}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => clearFrameOrigin(activeFrame)}
                          className="mt-2 w-full rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-700"
                        >
                          Usar origem padrão neste frame
                        </button>
                      </div>
                    </Section>

                    <Section title="Aparência" icon="🎨">
                      <Toggle
                        label="Espelhar ao virar"
                        value={config.character.flipOnDirection}
                        onChange={(v) =>
                          patchCharacter({ flipOnDirection: v })
                        }
                      />
                      <Toggle
                        label="Aplicar tint"
                        value={config.character.tintEnabled}
                        onChange={(v) => patchCharacter({ tintEnabled: v })}
                      />
                      {config.character.tintEnabled && (
                        <ColorField
                          label="Cor tint"
                          value={config.character.tint}
                          onChange={(v) => patchCharacter({ tint: v })}
                        />
                      )}
                      <Select
                        label="Ease do squash"
                        value={config.character.animBlendEase}
                        options={EASE_OPTIONS}
                        onChange={(v) =>
                          patchCharacter({ animBlendEase: v })
                        }
                      />
                    </Section>
                  </>
                )}

                {tab === "npc" && (
                  <Section title="NPCs no Palco" icon="🧍">
                    <NpcPanel
                      npcs={config.npcs}
                      animations={config.animations}
                      onAdd={addNpc}
                      onUpdate={updateNpc}
                      onDelete={deleteNpc}
                    />
                  </Section>
                )}

                {tab === "hitbox" && (
                  <Section title="Caixas de Colisão" icon="🟩">
                    <HitboxPanel
                      hitboxes={config.hitboxes}
                      frameCount={getFrameCount(config.meta)}
                      showHitboxes={config.stage.showHitboxes}
                      onToggleShow={(v) => patchStage({ showHitboxes: v })}
                      onAdd={addHitbox}
                      onUpdate={updateHitbox}
                      onDelete={deleteHitbox}
                    />
                  </Section>
                )}

                {tab === "fx" && (
                  <Section title="Efeitos Visuais" icon="✨">
                    <Toggle
                      label="Rastro (trail)"
                      value={config.fx.trailEnabled}
                      onChange={(v) => patchFx({ trailEnabled: v })}
                    />
                    {config.fx.trailEnabled && (
                      <>
                        <Slider
                          label="Opacidade rastro"
                          value={config.fx.trailAlpha}
                          min={0.05}
                          max={0.8}
                          step={0.05}
                          onChange={(v) => patchFx({ trailAlpha: v })}
                        />
                        <Slider
                          label="Qtd. rastros"
                          value={config.fx.trailCount}
                          min={2}
                          max={20}
                          onChange={(v) => patchFx({ trailCount: v })}
                        />
                        <ColorField
                          label="Cor rastro"
                          value={config.fx.trailColor}
                          onChange={(v) => patchFx({ trailColor: v })}
                        />
                      </>
                    )}
                    <Toggle
                      label="Partículas ao mover"
                      value={config.fx.particlesOnMove}
                      onChange={(v) => patchFx({ particlesOnMove: v })}
                    />
                    {config.fx.particlesOnMove && (
                      <>
                        <ColorField
                          label="Cor partícula"
                          value={config.fx.particleColor}
                          onChange={(v) => patchFx({ particleColor: v })}
                        />
                        <Slider
                          label="Qtd (na ação)"
                          value={config.fx.particleCount}
                          min={2}
                          max={40}
                          onChange={(v) => patchFx({ particleCount: v })}
                        />
                        <Slider
                          label="Velocidade"
                          value={config.fx.particleSpeed}
                          min={20}
                          max={300}
                          onChange={(v) => patchFx({ particleSpeed: v })}
                        />
                        <Slider
                          label="Vida (ms)"
                          value={config.fx.particleLifespan}
                          min={100}
                          max={2000}
                          step={50}
                          onChange={(v) => patchFx({ particleLifespan: v })}
                        />
                      </>
                    )}
                    <Toggle
                      label="Squash & Stretch"
                      value={config.fx.squashStretch}
                      onChange={(v) => patchFx({ squashStretch: v })}
                    />
                    <Toggle
                      label="Shake na ação"
                      value={config.fx.shakeOnAction}
                      onChange={(v) => patchFx({ shakeOnAction: v })}
                    />
                    {config.fx.shakeOnAction && (
                      <Slider
                        label="Intensidade shake"
                        value={config.fx.shakeIntensity}
                        min={0.002}
                        max={0.03}
                        step={0.002}
                        onChange={(v) => patchFx({ shakeIntensity: v })}
                      />
                    )}
                    <Toggle
                      label="Flash na ação"
                      value={config.fx.flashOnAction}
                      onChange={(v) => patchFx({ flashOnAction: v })}
                    />
                    <Select
                      label="Blend mode"
                      value={config.fx.blendMode}
                      options={[
                        { value: "NORMAL", label: "Normal" },
                        { value: "ADD", label: "Add (brilho)" },
                        { value: "MULTIPLY", label: "Multiply" },
                        { value: "SCREEN", label: "Screen" },
                      ]}
                      onChange={(v) =>
                        patchFx({ blendMode: v as BlendMode })
                      }
                    />
                    <Toggle
                      label="Glow (WebGL)"
                      value={config.fx.glowEnabled}
                      onChange={(v) => patchFx({ glowEnabled: v })}
                    />
                    {config.fx.glowEnabled && (
                      <>
                        <ColorField
                          label="Cor glow"
                          value={config.fx.glowColor}
                          onChange={(v) => patchFx({ glowColor: v })}
                        />
                        <Slider
                          label="Força glow"
                          value={config.fx.glowStrength}
                          min={0}
                          max={20}
                          step={0.5}
                          onChange={(v) => patchFx({ glowStrength: v })}
                        />
                      </>
                    )}
                  </Section>
                )}

                {tab === "sound" && (
                  <Section title="Áudio Procedural" icon="🔊">
                    <p className="mb-1 text-[10px] text-slate-500">
                      Sons sintetizados em tempo real (Web Audio) — sem arquivos.
                    </p>
                    <Slider
                      label="Volume master"
                      value={config.sound.masterVolume}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(v) => patchSound({ masterVolume: v })}
                    />
                    <Select
                      label="Forma de onda"
                      value={config.sound.waveform}
                      options={[
                        { value: "square", label: "Square (8-bit)" },
                        { value: "sawtooth", label: "Sawtooth" },
                        { value: "triangle", label: "Triangle" },
                        { value: "sine", label: "Sine" },
                      ]}
                      onChange={(v) =>
                        patchSound({ waveform: v as OscillatorType })
                      }
                    />
                    <Toggle
                      label="Som de passo"
                      value={config.sound.stepEnabled}
                      onChange={(v) => patchSound({ stepEnabled: v })}
                    />
                    {config.sound.stepEnabled && (
                      <SoundRow
                        label="Freq. passo"
                        value={config.sound.stepFreq}
                        onChange={(v) => patchSound({ stepFreq: v })}
                        onTest={() =>
                          audio.previewTone(
                            config.sound.stepFreq,
                            config.sound.waveform
                          )
                        }
                      />
                    )}
                    <Toggle
                      label="Som de ação"
                      value={config.sound.actionEnabled}
                      onChange={(v) => patchSound({ actionEnabled: v })}
                    />
                    {config.sound.actionEnabled && (
                      <SoundRow
                        label="Freq. ação"
                        value={config.sound.actionFreq}
                        onChange={(v) => patchSound({ actionFreq: v })}
                        onTest={() =>
                          audio.playAction(
                            config.sound.actionFreq,
                            config.sound.waveform
                          )
                        }
                      />
                    )}
                    <Toggle
                      label="Som de pulo"
                      value={config.sound.jumpEnabled}
                      onChange={(v) => patchSound({ jumpEnabled: v })}
                    />
                    {config.sound.jumpEnabled && (
                      <SoundRow
                        label="Freq. pulo"
                        value={config.sound.jumpFreq}
                        onChange={(v) => patchSound({ jumpFreq: v })}
                        onTest={() =>
                          audio.previewTone(
                            config.sound.jumpFreq,
                            config.sound.waveform
                          )
                        }
                      />
                    )}
                    <Toggle
                      label="Som de aterrissagem"
                      value={config.sound.landEnabled}
                      onChange={(v) => patchSound({ landEnabled: v })}
                    />
                    {config.sound.landEnabled && (
                      <SoundRow
                        label="Freq. aterrissagem"
                        value={config.sound.landFreq}
                        onChange={(v) => patchSound({ landFreq: v })}
                        onTest={() =>
                          audio.previewTone(
                            config.sound.landFreq,
                            config.sound.waveform
                          )
                        }
                      />
                    )}
                    <Toggle
                      label="Som ambiente"
                      value={config.sound.ambientEnabled}
                      onChange={(v) => patchSound({ ambientEnabled: v })}
                    />
                  </Section>
                )}

                {tab === "stage" && (
                  <Section title="Cenário & Câmera" icon="🎨">
                    <Slider
                      label="Zoom da câmera"
                      value={config.stage.zoom}
                      min={0.3}
                      max={3}
                      step={0.1}
                      suffix="x"
                      onChange={(v) => patchStage({ zoom: v })}
                    />
                    <Toggle
                      label="Câmera acompanha player"
                      value={config.stage.cameraFollow}
                      onChange={(v) => patchStage({ cameraFollow: v })}
                    />
                    {config.stage.cameraFollow && (
                      <Slider
                        label="Suavidade da câmera"
                        value={config.stage.cameraLerp}
                        min={0.01}
                        max={0.5}
                        step={0.01}
                        onChange={(v) => patchStage({ cameraLerp: v })}
                      />
                    )}
                    <ColorField
                      label="Cor de fundo"
                      value={config.stage.bgColor}
                      onChange={(v) => patchStage({ bgColor: v })}
                    />
                    <Toggle
                      label="Gradiente de fundo"
                      value={config.stage.bgGradient}
                      onChange={(v) => patchStage({ bgGradient: v })}
                    />
                    {config.stage.bgGradient && (
                      <ColorField
                        label="Cor inferior"
                        value={config.stage.bgColor2}
                        onChange={(v) => patchStage({ bgColor2: v })}
                      />
                    )}
                    <Toggle
                      label="Mostrar grade"
                      value={config.stage.showGrid}
                      onChange={(v) => patchStage({ showGrid: v })}
                    />
                    {config.stage.showGrid && (
                      <Slider
                        label="Tam. grade"
                        value={config.stage.gridSize}
                        min={8}
                        max={128}
                        step={8}
                        onChange={(v) => patchStage({ gridSize: v })}
                      />
                    )}
                    <Toggle
                      label="Mostrar chão"
                      value={config.stage.showFloor}
                      onChange={(v) => patchStage({ showFloor: v })}
                    />
                    {config.stage.showFloor && (
                      <Slider
                        label="Altura do chão"
                        value={config.stage.floorHeight}
                        min={10}
                        max={200}
                        onChange={(v) => patchStage({ floorHeight: v })}
                      />
                    )}
                    <Toggle
                      label="Mostrar hitboxes"
                      value={config.stage.showHitboxes}
                      onChange={(v) => patchStage({ showHitboxes: v })}
                    />
                  </Section>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 text-center">
              <p className="text-xs text-slate-500">
                Escolha um modelo base para começar:
              </p>
              <PresetGallery onSelect={applyPreset} compact />
            </div>
          )}
        </aside>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {showPresets && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-2 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setShowPresets(false)}
        >
          <div
            className="my-2 max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl sm:my-0 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  🗂️ Modelos base
                </h2>
                <p className="text-xs text-slate-400">
                  Spritesheets prontos (fundo transparente) com animações já
                  configuradas.
                </p>
              </div>
              <button
                onClick={() => setShowPresets(false)}
                className="rounded-lg px-3 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>
            <PresetGallery onSelect={applyPreset} />
            <p className="mt-4 text-center text-[11px] text-slate-500">
              Ao escolher um modelo, o projeto atual será substituído.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({
  ok,
  label,
  neutral,
}: {
  ok: boolean;
  label: string;
  neutral?: boolean;
}) {
  return (
    <span
      className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium md:inline-flex ${
        neutral
          ? "bg-slate-800 text-slate-300"
          : ok
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-slate-800 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          neutral ? "bg-slate-400" : ok ? "bg-emerald-400" : "bg-slate-600"
        }`}
      />
      {label}
    </span>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
        active
          ? "bg-sky-500 text-white"
          : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function SoundRow({
  label,
  value,
  onChange,
  onTest,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onTest: () => void;
}) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Slider
          label={label}
          value={value}
          min={80}
          max={900}
          suffix="Hz"
          onChange={onChange}
        />
      </div>
      <button
        onClick={onTest}
        className="mb-1 shrink-0 rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/30"
        title="Testar som"
      >
        ▶
      </button>
    </div>
  );
}

function ExportItem({
  title,
  sub,
  onClick,
}: {
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-md px-3 py-2 text-left hover:bg-slate-700"
    >
      <div className="text-xs font-semibold text-slate-100">{title}</div>
      <div className="text-[10px] text-slate-400">{sub}</div>
    </button>
  );
}

function Hint({ k, d }: { k: string; d: string }) {
  return (
    <span className="flex items-center gap-1">
      <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-sky-300">
        {k}
      </kbd>
      <span>{d}</span>
    </span>
  );
}
