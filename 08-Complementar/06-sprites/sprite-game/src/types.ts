// ===================================================================
// SpriteLab — tipos de dados
// Inspirado em engines: Aseprite (timeline/onion), Unity Animator
// (state machine), Spine/DragonBones (transform/blend), fighting-game
// engines (hitboxes), Phaser (runtime).
// ===================================================================

export type EaseType =
  | "Linear"
  | "Sine.easeInOut"
  | "Quad.easeInOut"
  | "Cubic.easeInOut"
  | "Back.easeOut"
  | "Bounce.easeOut"
  | "Elastic.easeOut";

export interface AnimationConfig {
  id: string;
  name: string;
  startFrame: number;
  endFrame: number;
  frameRate: number;
  repeat: number; // -1 = loop forever
  yoyo: boolean;
  // avançado
  frameOrder: number[] | null; // ordem customizada dos frames (override)
  color: string; // cor da faixa na timeline
}

export type MovementMode = "topdown" | "platformer";

export interface SpriteSheetMeta {
  fileName: string;
  dataUrl: string;
  imageWidth: number;
  imageHeight: number;
  frameWidth: number;
  frameHeight: number;
  totalFrames: number;
  columns: number;
  rows: number;
  // slicing avançado
  marginX: number;
  marginY: number;
  spacingX: number;
  spacingY: number;
}

export type BlendMode = "NORMAL" | "ADD" | "MULTIPLY" | "SCREEN" | "ERASE";

export interface FxConfig {
  trailEnabled: boolean;
  trailAlpha: number;
  trailCount: number;
  trailColor: string;
  particlesOnMove: boolean;
  particleColor: string;
  particleCount: number;
  particleSpeed: number;
  particleLifespan: number;
  shakeOnAction: boolean;
  shakeIntensity: number;
  flashOnAction: boolean;
  glowEnabled: boolean;
  glowColor: string;
  glowStrength: number;
  blendMode: BlendMode;
  squashStretch: boolean; // deformação ao pular/aterrissar
}

export interface SoundConfig {
  masterVolume: number;
  stepEnabled: boolean;
  stepFreq: number;
  actionEnabled: boolean;
  actionFreq: number;
  jumpFreq: number;
  ambientEnabled: boolean;
  waveform: OscillatorType;
}

export interface CharacterConfig {
  scale: number; // escala uniforme
  scaleX: number; // escala X extra (%)
  scaleY: number; // escala Y extra (%)
  rotation: number; // graus
  offsetX: number;
  offsetY: number;
  speed: number;
  accel: number; // aceleração (0-1, suavização)
  jumpPower: number;
  gravity: number;
  airControl: number; // 0-1
  doubleJump: boolean;
  movementMode: MovementMode;
  flipOnDirection: boolean;
  tint: string;
  tintEnabled: boolean;
  opacity: number;
  originX: number;
  originY: number;
  animBlendEase: EaseType;
}

export interface HitboxConfig {
  id: string;
  name: string;
  type: "hurtbox" | "hitbox" | "collision";
  x: number; // relativo ao frame (0-1)
  y: number;
  w: number; // 0-1 relativo ao frame
  h: number;
  color: string;
}

export interface StageConfig {
  bgColor: string;
  bgGradient: boolean;
  bgColor2: string;
  showGrid: boolean;
  gridSize: number;
  showFloor: boolean;
  floorHeight: number;
  parallax: boolean;
  zoom: number; // câmera zoom
  showHitboxes: boolean;
}

// ---- NPCs adicionados dinamicamente ao palco ----
export interface NpcInstance {
  id: string;
  label: string;
  animId: string | null; // animação usada
  x: number;
  y: number;
  scale: number;
  tint: string;
  tintEnabled: boolean;
  flipX: boolean;
  behavior: "idle" | "patrol" | "follow" | "wander";
  patrolRange: number;
  speed: number;
}

export interface ProjectConfig {
  version: string;
  meta: SpriteSheetMeta | null;
  character: CharacterConfig;
  animations: AnimationConfig[];
  animMapping: {
    idle: string | null;
    walk: string | null;
    run: string | null;
    jump: string | null;
    fall: string | null;
    action: string | null;
    hurt: string | null;
  };
  hitboxes: HitboxConfig[];
  npcs: NpcInstance[];
  fx: FxConfig;
  sound: SoundConfig;
  stage: StageConfig;
}

export const defaultCharacter: CharacterConfig = {
  scale: 3,
  scaleX: 100,
  scaleY: 100,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  speed: 200,
  accel: 0.2,
  jumpPower: 520,
  gravity: 980,
  airControl: 0.7,
  doubleJump: false,
  movementMode: "platformer",
  flipOnDirection: true,
  tint: "#ffffff",
  tintEnabled: false,
  opacity: 1,
  originX: 0.5,
  originY: 0.5,
  animBlendEase: "Sine.easeInOut",
};

export const defaultFx: FxConfig = {
  trailEnabled: false,
  trailAlpha: 0.35,
  trailCount: 6,
  trailColor: "#60a5fa",
  particlesOnMove: true,
  particleColor: "#7dd3fc",
  particleCount: 6,
  particleSpeed: 80,
  particleLifespan: 500,
  shakeOnAction: true,
  shakeIntensity: 0.008,
  flashOnAction: false,
  glowEnabled: false,
  glowColor: "#a78bfa",
  glowStrength: 4,
  blendMode: "NORMAL",
  squashStretch: true,
};

export const defaultSound: SoundConfig = {
  masterVolume: 0.5,
  stepEnabled: true,
  stepFreq: 220,
  actionEnabled: true,
  actionFreq: 520,
  jumpFreq: 660,
  ambientEnabled: false,
  waveform: "square",
};

export const defaultStage: StageConfig = {
  bgColor: "#0f172a",
  bgGradient: true,
  bgColor2: "#1e1b4b",
  showGrid: true,
  gridSize: 32,
  showFloor: true,
  floorHeight: 60,
  parallax: false,
  zoom: 1,
  showHitboxes: false,
};

export const emptyProject = (): ProjectConfig => ({
  version: "2.0.0",
  meta: null,
  character: { ...defaultCharacter },
  animations: [],
  animMapping: {
    idle: null,
    walk: null,
    run: null,
    jump: null,
    fall: null,
    action: null,
    hurt: null,
  },
  hitboxes: [],
  npcs: [],
  fx: { ...defaultFx },
  sound: { ...defaultSound },
  stage: { ...defaultStage },
});

export const EASE_OPTIONS: { value: EaseType; label: string }[] = [
  { value: "Linear", label: "Linear" },
  { value: "Sine.easeInOut", label: "Sine (suave)" },
  { value: "Quad.easeInOut", label: "Quad" },
  { value: "Cubic.easeInOut", label: "Cubic" },
  { value: "Back.easeOut", label: "Back (overshoot)" },
  { value: "Bounce.easeOut", label: "Bounce" },
  { value: "Elastic.easeOut", label: "Elastic" },
];

export const ANIM_COLORS = [
  "#38bdf8",
  "#a78bfa",
  "#f472b6",
  "#fbbf24",
  "#34d399",
  "#fb7185",
  "#22d3ee",
  "#c084fc",
];
