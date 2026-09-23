import {
  emptyProject,
  ANIM_COLORS,
  type ProjectConfig,
  type AnimationConfig,
} from "./types";
import { loadImageFromFile, buildMeta } from "./game/sliceSheet";

export interface PresetDef {
  id: string;
  name: string;
  emoji: string;
  file: string; // caminho em /public
  description: string;
  accent: string;
  // grade 4x4 padrão: idle(0-3), walk(4-7), jump/fly(8-11), action(12-15)
  anims: {
    name: string;
    start: number;
    end: number;
    fps: number;
    repeat: number;
  }[];
  // mapeamento de estados
  mapping: Partial<Record<string, string>>; // slot -> nome da anim
}

export const PRESETS: PresetDef[] = [
  {
    id: "hero",
    name: "Herói",
    emoji: "🦸",
    file: "./sheets/hero.png",
    description: "Cavaleiro aventureiro — jogável",
    accent: "#38bdf8",
    anims: [
      { name: "idle", start: 0, end: 3, fps: 6, repeat: -1 },
      { name: "walk", start: 4, end: 7, fps: 10, repeat: -1 },
      { name: "jump", start: 8, end: 11, fps: 10, repeat: 0 },
      { name: "attack", start: 12, end: 15, fps: 14, repeat: 0 },
    ],
    mapping: { idle: "idle", walk: "walk", jump: "jump", action: "attack" },
  },
  {
    id: "ogre",
    name: "Ogro",
    emoji: "👹",
    file: "./sheets/ogre.png",
    description: "Monstro bruto com clava",
    accent: "#84cc16",
    anims: [
      { name: "idle", start: 0, end: 3, fps: 5, repeat: -1 },
      { name: "walk", start: 4, end: 7, fps: 8, repeat: -1 },
      { name: "smash", start: 8, end: 11, fps: 12, repeat: 0 },
      { name: "roar", start: 12, end: 15, fps: 8, repeat: 0 },
    ],
    mapping: { idle: "idle", walk: "walk", jump: "smash", action: "smash" },
  },
  {
    id: "slime",
    name: "Slime",
    emoji: "🟢",
    file: "./sheets/slime.png",
    description: "Gosma saltitante fofa",
    accent: "#22c55e",
    anims: [
      { name: "idle", start: 0, end: 3, fps: 6, repeat: -1 },
      { name: "hop", start: 4, end: 7, fps: 10, repeat: -1 },
      { name: "jump", start: 8, end: 11, fps: 12, repeat: 0 },
      { name: "attack", start: 12, end: 15, fps: 12, repeat: 0 },
    ],
    mapping: { idle: "idle", walk: "hop", jump: "jump", action: "attack" },
  },
  {
    id: "dragon",
    name: "Dragão",
    emoji: "🐉",
    file: "./sheets/dragon.png",
    description: "Dragão vermelho — chefe",
    accent: "#ef4444",
    anims: [
      { name: "idle", start: 0, end: 3, fps: 5, repeat: -1 },
      { name: "fly", start: 4, end: 7, fps: 10, repeat: -1 },
      { name: "firebreath", start: 8, end: 11, fps: 12, repeat: 0 },
      { name: "roar", start: 12, end: 15, fps: 8, repeat: 0 },
    ],
    mapping: { idle: "idle", walk: "fly", jump: "firebreath", action: "firebreath" },
  },
];

let presetCounter = 0;
const puid = () => `p${Date.now().toString(36)}${presetCounter++}`;

// Carrega um preset e retorna um ProjectConfig pronto.
export async function loadPreset(preset: PresetDef): Promise<ProjectConfig> {
  const resp = await fetch(preset.file);
  const blob = await resp.blob();
  const file = new File([blob], `${preset.id}.png`, { type: "image/png" });
  const { dataUrl, width, height } = await loadImageFromFile(file);
  const fw = Math.floor(width / 4);
  const fh = Math.floor(height / 4);
  const meta = buildMeta(`${preset.id}.png`, dataUrl, width, height, fw, fh);

  const animObjs: AnimationConfig[] = preset.anims.map((a, i) => ({
    id: puid(),
    name: a.name,
    startFrame: a.start,
    endFrame: a.end,
    frameRate: a.fps,
    repeat: a.repeat,
    yoyo: false,
    frameOrder: null,
    color: ANIM_COLORS[i % ANIM_COLORS.length],
  }));

  const nameToId = (name?: string) =>
    animObjs.find((a) => a.name === name)?.id ?? null;

  const base = emptyProject();
  return {
    ...base,
    meta,
    animations: animObjs,
    animMapping: {
      idle: nameToId(preset.mapping.idle),
      walk: nameToId(preset.mapping.walk),
      run: null,
      jump: nameToId(preset.mapping.jump),
      fall: null,
      action: nameToId(preset.mapping.action),
      hurt: null,
    },
  };
}
