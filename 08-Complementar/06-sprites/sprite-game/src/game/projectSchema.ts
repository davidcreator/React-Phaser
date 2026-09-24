import {
  buildMeta,
} from "./sliceSheet";
import {
  defaultCharacter,
  defaultFx,
  defaultSound,
  defaultStage,
  emptyProject,
  type AnimationConfig,
  type AnimationEvent,
  type AnimationEventKind,
  type BlendMode,
  type CharacterConfig,
  type EaseType,
  type HitboxConfig,
  type MovementMode,
  type NpcInstance,
  type ProjectConfig,
  type SoundConfig,
  type StageConfig,
} from "../types";

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function finiteNumber(
  value: unknown,
  fallback: number,
  min = -Infinity,
  max = Infinity
): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function integer(
  value: unknown,
  fallback: number,
  min = -Infinity,
  max = Infinity
): number {
  return Math.floor(finiteNumber(value, fallback, min, max));
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function color(value: unknown, fallback: string): string {
  const candidate = typeof value === "string" ? value.trim() : "";
  return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : fallback;
}

function oneOf<T extends string>(
  value: unknown,
  options: readonly T[],
  fallback: T
): T {
  return typeof value === "string" && options.includes(value as T)
    ? (value as T)
    : fallback;
}

const movementModes = ["topdown", "platformer"] as const satisfies readonly MovementMode[];
const easeTypes = [
  "Linear",
  "Sine.easeInOut",
  "Quad.easeInOut",
  "Cubic.easeInOut",
  "Back.easeOut",
  "Bounce.easeOut",
  "Elastic.easeOut",
] as const satisfies readonly EaseType[];
const blendModes = [
  "NORMAL",
  "ADD",
  "MULTIPLY",
  "SCREEN",
  "ERASE",
] as const satisfies readonly BlendMode[];
const npcBehaviors = ["idle", "patrol", "follow", "wander"] as const;
const hitboxTypes = ["hurtbox", "hitbox", "collision"] as const;
const oscillatorTypes = ["sine", "square", "sawtooth", "triangle"] as const;
const animationEventKinds = ["script", "sound", "hitbox", "fx"] as const satisfies readonly AnimationEventKind[];

function normalizeMeta(value: unknown) {
  const raw = record(value);
  const dataUrl = text(raw.dataUrl, "");
  if (!dataUrl) return null;

  const imageWidth = integer(raw.imageWidth, 1, 1);
  const imageHeight = integer(raw.imageHeight, 1, 1);
  const frameRects = Array.isArray(raw.frameRects)
    ? raw.frameRects
        .map((item) => {
          const rect = record(item);
          return {
            x: integer(rect.x, 0, 0),
            y: integer(rect.y, 0, 0),
            width: integer(rect.width, 1, 1),
            height: integer(rect.height, 1, 1),
          };
        })
        .filter((rect) => rect.width > 0 && rect.height > 0)
    : null;
  const meta = buildMeta(
    text(raw.fileName, "spritesheet.png"),
    dataUrl,
    imageWidth,
    imageHeight,
    integer(raw.frameWidth, imageWidth, 1),
    integer(raw.frameHeight, imageHeight, 1),
    integer(raw.marginX, 0, 0),
    integer(raw.marginY, 0, 0),
    integer(raw.spacingX, 0, 0),
    integer(raw.spacingY, 0, 0),
    frameRects
  );
  return meta;
}

function normalizeCharacter(value: unknown): CharacterConfig {
  const raw = record(value);
  return {
    ...defaultCharacter,
    scale: finiteNumber(raw.scale, defaultCharacter.scale, 0.05, 50),
    scaleX: finiteNumber(raw.scaleX, defaultCharacter.scaleX, 1, 500),
    scaleY: finiteNumber(raw.scaleY, defaultCharacter.scaleY, 1, 500),
    rotation: finiteNumber(raw.rotation, defaultCharacter.rotation, -360, 360),
    offsetX: finiteNumber(raw.offsetX, defaultCharacter.offsetX, -10000, 10000),
    offsetY: finiteNumber(raw.offsetY, defaultCharacter.offsetY, -10000, 10000),
    speed: finiteNumber(raw.speed, defaultCharacter.speed, 0, 5000),
    runMultiplier: finiteNumber(raw.runMultiplier, defaultCharacter.runMultiplier, 1, 5),
    accel: finiteNumber(raw.accel, defaultCharacter.accel, 0, 1),
    maxFallSpeed: finiteNumber(raw.maxFallSpeed, defaultCharacter.maxFallSpeed, 50, 10000),
    coyoteTime: finiteNumber(raw.coyoteTime, defaultCharacter.coyoteTime, 0, 1000),
    jumpBuffer: finiteNumber(raw.jumpBuffer, defaultCharacter.jumpBuffer, 0, 1000),
    jumpPower: finiteNumber(raw.jumpPower, defaultCharacter.jumpPower, 0, 5000),
    gravity: finiteNumber(raw.gravity, defaultCharacter.gravity, 0, 10000),
    airControl: finiteNumber(raw.airControl, defaultCharacter.airControl, 0, 1),
    doubleJump: bool(raw.doubleJump, defaultCharacter.doubleJump),
    movementMode: oneOf(raw.movementMode, movementModes, defaultCharacter.movementMode),
    flipOnDirection: bool(raw.flipOnDirection, defaultCharacter.flipOnDirection),
    tint: color(raw.tint, defaultCharacter.tint),
    tintEnabled: bool(raw.tintEnabled, defaultCharacter.tintEnabled),
    opacity: finiteNumber(raw.opacity, defaultCharacter.opacity, 0, 1),
    originX: finiteNumber(raw.originX, defaultCharacter.originX, 0, 1),
    originY: finiteNumber(raw.originY, defaultCharacter.originY, 0, 1),
    animBlendEase: oneOf(raw.animBlendEase, easeTypes, defaultCharacter.animBlendEase),
  };
}

function normalizeAnimationEvents(value: unknown, totalFrames: number): AnimationEvent[] {
  const list = Array.isArray(value) ? value : [];
  const ids = new Set<string>();
  return list.map((item, index) => {
    const raw = record(item);
    const requestedId = text(raw.id, `event-${index + 1}`);
    let id = requestedId;
    let suffix = 2;
    while (ids.has(id)) id = `${requestedId}-${suffix++}`;
    ids.add(id);
    return {
      id,
      frame: integer(raw.frame, 0, 0, Math.max(0, totalFrames - 1)),
      kind: oneOf(raw.kind, animationEventKinds, "script"),
      name: text(raw.name, "event"),
      payload: typeof raw.payload === "string" ? raw.payload : "",
    };
  });
}

function normalizeAnimations(value: unknown, totalFrames: number) {
  const list = Array.isArray(value) ? value : [];
  const ids = new Set<string>();
  const sourceIds = new Map<string, string>();
  const sourceNames = new Map<string, string>();

  const animations: AnimationConfig[] = list.map((item, index) => {
    const raw = record(item);
    const requestedId = text(raw.id, `imported-anim-${index + 1}`);
    let id = requestedId;
    let suffix = 2;
    while (ids.has(id)) id = `${requestedId}-${suffix++}`;
    ids.add(id);
    sourceIds.set(requestedId, id);

    const name = text(raw.name, `anim_${index + 1}`);
    if (!sourceNames.has(name)) sourceNames.set(name, id);
    const lastFrame = Math.max(0, totalFrames - 1);
    const startFrame = integer(raw.startFrame, 0, 0, lastFrame);
    const endFrame = integer(raw.endFrame, Math.min(3, lastFrame), 0, lastFrame);
    const order = Array.isArray(raw.frameOrder)
      ? raw.frameOrder.map((frame) => integer(frame, 0, 0, lastFrame))
      : null;

    return {
      id,
      name,
      startFrame,
      endFrame,
      frameRate: finiteNumber(raw.frameRate, 10, 1, 240),
      repeat: integer(raw.repeat, -1, -1, 999),
      yoyo: bool(raw.yoyo, false),
      frameOrder: order && order.length > 0 ? order : null,
      color: color(raw.color, "#38bdf8"),
      events: normalizeAnimationEvents(raw.events, totalFrames),
    };
  });

  const resolveId = (value: unknown): string | null => {
    if (typeof value !== "string" || !value) return null;
    return sourceIds.get(value) ?? sourceNames.get(value) ?? (ids.has(value) ? value : null);
  };

  return { animations, resolveId };
}

function normalizeHitboxes(value: unknown, totalFrames: number): HitboxConfig[] {
  const list = Array.isArray(value) ? value : [];
  const ids = new Set<string>();
  return list.map((item, index) => {
    const raw = record(item);
    const requestedId = text(raw.id, `imported-hitbox-${index + 1}`);
    let id = requestedId;
    let suffix = 2;
    while (ids.has(id)) id = `${requestedId}-${suffix++}`;
    ids.add(id);
    const type = oneOf(raw.type, hitboxTypes, "hurtbox");
    return {
      id,
      name: text(raw.name, type),
      type,
      x: finiteNumber(raw.x, 0.3, 0, 1),
      y: finiteNumber(raw.y, 0.3, 0, 1),
      w: finiteNumber(raw.w, 0.4, 0.01, 1),
      h: finiteNumber(raw.h, 0.4, 0.01, 1),
      color: color(raw.color, type === "hitbox" ? "#ef4444" : type === "collision" ? "#3b82f6" : "#22c55e"),
      frame:
        raw.frame === null || raw.frame === undefined
          ? null
          : integer(raw.frame, 0, 0, Math.max(0, totalFrames - 1)),
      enabled: bool(raw.enabled, true),
    };
  });
}

function normalizeNpcs(value: unknown, resolveAnimation: (value: unknown) => string | null): NpcInstance[] {
  const list = Array.isArray(value) ? value : [];
  const ids = new Set<string>();
  return list.map((item, index) => {
    const raw = record(item);
    const requestedId = text(raw.id, `imported-npc-${index + 1}`);
    let id = requestedId;
    let suffix = 2;
    while (ids.has(id)) id = `${requestedId}-${suffix++}`;
    ids.add(id);
    return {
      id,
      label: text(raw.label, `NPC ${index + 1}`),
      animId: resolveAnimation(raw.animId),
      x: finiteNumber(raw.x, 150 + index * 90, -10000, 10000),
      y: finiteNumber(raw.y, 300, -10000, 10000),
      scale: finiteNumber(raw.scale, 3, 0.05, 50),
      tint: color(raw.tint, "#ffd6a5"),
      tintEnabled: bool(raw.tintEnabled, false),
      flipX: bool(raw.flipX, false),
      behavior: oneOf(raw.behavior, npcBehaviors, "idle"),
      patrolRange: finiteNumber(raw.patrolRange, 120, 0, 5000),
      speed: finiteNumber(raw.speed, 60, 0, 5000),
    };
  });
}

function normalizeFrameEdits(value: unknown, totalFrames: number) {
  const raw = record(value);
  const output: ProjectConfig["frameEdits"] = {};
  Object.entries(raw).forEach(([key, valueForFrame]) => {
    const frame = integer(key, -1, 0, Math.max(0, totalFrames - 1));
    if (frame < 0 || String(frame) !== key) return;
    const edit = record(valueForFrame);
    output[String(frame)] = {
      originX: finiteNumber(edit.originX, 0.5, 0, 1),
      originY: finiteNumber(edit.originY, 0.5, 0, 1),
      scaleX: finiteNumber(edit.scaleX, 1, 0.05, 10),
      scaleY: finiteNumber(edit.scaleY, 1, 0.05, 10),
      rotation: finiteNumber(edit.rotation, 0, -360, 360),
      alpha: finiteNumber(edit.alpha, 1, 0, 1),
      flipX: bool(edit.flipX, false),
      flipY: bool(edit.flipY, false),
    };
  });
  return output;
}

function normalizeFx(value: unknown) {
  const raw = record(value);
  return {
    ...defaultFx,
    trailEnabled: bool(raw.trailEnabled, defaultFx.trailEnabled),
    trailAlpha: finiteNumber(raw.trailAlpha, defaultFx.trailAlpha, 0, 1),
    trailCount: integer(raw.trailCount, defaultFx.trailCount, 1, 50),
    trailColor: color(raw.trailColor, defaultFx.trailColor),
    particlesOnMove: bool(raw.particlesOnMove, defaultFx.particlesOnMove),
    particleColor: color(raw.particleColor, defaultFx.particleColor),
    particleCount: integer(raw.particleCount, defaultFx.particleCount, 1, 200),
    particleSpeed: finiteNumber(raw.particleSpeed, defaultFx.particleSpeed, 0, 5000),
    particleLifespan: integer(raw.particleLifespan, defaultFx.particleLifespan, 1, 10000),
    shakeOnAction: bool(raw.shakeOnAction, defaultFx.shakeOnAction),
    shakeIntensity: finiteNumber(raw.shakeIntensity, defaultFx.shakeIntensity, 0, 1),
    flashOnAction: bool(raw.flashOnAction, defaultFx.flashOnAction),
    glowEnabled: bool(raw.glowEnabled, defaultFx.glowEnabled),
    glowColor: color(raw.glowColor, defaultFx.glowColor),
    glowStrength: finiteNumber(raw.glowStrength, defaultFx.glowStrength, 0, 50),
    blendMode: oneOf(raw.blendMode, blendModes, defaultFx.blendMode),
    squashStretch: bool(raw.squashStretch, defaultFx.squashStretch),
  };
}

function normalizeSound(value: unknown): SoundConfig {
  const raw = record(value);
  return {
    ...defaultSound,
    masterVolume: finiteNumber(raw.masterVolume, defaultSound.masterVolume, 0, 1),
    stepEnabled: bool(raw.stepEnabled, defaultSound.stepEnabled),
    stepFreq: finiteNumber(raw.stepFreq, defaultSound.stepFreq, 20, 5000),
    actionEnabled: bool(raw.actionEnabled, defaultSound.actionEnabled),
    actionFreq: finiteNumber(raw.actionFreq, defaultSound.actionFreq, 20, 5000),
    jumpEnabled: bool(raw.jumpEnabled, defaultSound.jumpEnabled),
    jumpFreq: finiteNumber(raw.jumpFreq, defaultSound.jumpFreq, 20, 5000),
    landEnabled: bool(raw.landEnabled, defaultSound.landEnabled),
    landFreq: finiteNumber(raw.landFreq, defaultSound.landFreq, 20, 5000),
    ambientEnabled: bool(raw.ambientEnabled, defaultSound.ambientEnabled),
    waveform: oneOf(raw.waveform, oscillatorTypes, defaultSound.waveform),
  };
}

function normalizeStage(value: unknown): StageConfig {
  const raw = record(value);
  return {
    ...defaultStage,
    bgColor: color(raw.bgColor, defaultStage.bgColor),
    bgGradient: bool(raw.bgGradient, defaultStage.bgGradient),
    bgColor2: color(raw.bgColor2, defaultStage.bgColor2),
    showGrid: bool(raw.showGrid, defaultStage.showGrid),
    gridSize: integer(raw.gridSize, defaultStage.gridSize, 4, 512),
    showFloor: bool(raw.showFloor, defaultStage.showFloor),
    floorHeight: integer(raw.floorHeight, defaultStage.floorHeight, 0, 2000),
    parallax: bool(raw.parallax, defaultStage.parallax),
    cameraFollow: bool(raw.cameraFollow, defaultStage.cameraFollow),
    cameraLerp: finiteNumber(raw.cameraLerp, defaultStage.cameraLerp, 0.01, 1),
    zoom: finiteNumber(raw.zoom, defaultStage.zoom, 0.1, 10),
    showHitboxes: bool(raw.showHitboxes, defaultStage.showHitboxes),
  };
}

/**
 * Migra projetos antigos/parciais para o schema atual. A função não confia no
 * JSON importado: todos os campos são validados e recebem defaults seguros.
 */
export function normalizeProject(value: unknown): ProjectConfig {
  const raw = record(value);
  const base = emptyProject();
  const meta = normalizeMeta(raw.meta);
  const totalFrames = meta?.totalFrames ?? 1;
  const { animations, resolveId } = normalizeAnimations(raw.animations, totalFrames);
  const animationIds = new Set(animations.map((animation) => animation.id));
  const mappingRaw = record(raw.animMapping);
  const resolveExistingId = (valueToResolve: unknown) => {
    const resolved = resolveId(valueToResolve);
    return resolved && animationIds.has(resolved) ? resolved : null;
  };

  return {
    version: text(raw.version, base.version),
    meta,
    frameEdits: normalizeFrameEdits(raw.frameEdits, totalFrames),
    character: normalizeCharacter(raw.character),
    animations,
    animMapping: {
      idle: resolveExistingId(mappingRaw.idle),
      walk: resolveExistingId(mappingRaw.walk),
      run: resolveExistingId(mappingRaw.run),
      jump: resolveExistingId(mappingRaw.jump),
      fall: resolveExistingId(mappingRaw.fall),
      action: resolveExistingId(mappingRaw.action),
      hurt: resolveExistingId(mappingRaw.hurt),
    },
    hitboxes: normalizeHitboxes(raw.hitboxes, totalFrames),
    npcs: normalizeNpcs(raw.npcs, resolveExistingId),
    fx: normalizeFx(raw.fx),
    sound: normalizeSound(raw.sound),
    stage: normalizeStage(raw.stage),
  };
}

export function hasEmbeddedImage(project: ProjectConfig): boolean {
  return Boolean(project.meta?.dataUrl && /^data:image\//i.test(project.meta.dataUrl));
}
