import type { ProjectConfig } from "../types";
import { getFrameCount, getFrameRect } from "./sliceSheet";
import { hasEmbeddedImage, normalizeProject } from "./projectSchema";

function download(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Alguns browsers ainda precisam que o object URL sobreviva ao click.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function exportConfigJson(config: ProjectConfig) {
  // strip the heavy dataUrl from meta for a lighter config (keep frame info)
  const clone: ProjectConfig = JSON.parse(JSON.stringify(config));
  if (clone.meta) {
    clone.meta.dataUrl = "<REPLACE_WITH_YOUR_SPRITESHEET_PATH>";
  }
  download("spritelab-config.json", JSON.stringify(clone, null, 2), "application/json");
}

export function exportFullProject(config: ProjectConfig) {
  // Projeto completo (inclui o dataUrl para reimportar depois)
  download(
    "spritelab-project.json",
    JSON.stringify(config, null, 2),
    "application/json"
  );
}

export function importProject(file: File): Promise<ProjectConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(reader.result as string);
        const project = normalizeProject(parsed);
        if (!hasEmbeddedImage(project)) {
          reject(
            new Error(
              "O arquivo não contém um spritesheet incorporado. Importe um Projeto completo (.json)."
            )
          );
          return;
        }
        resolve(project);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler projeto."));
    reader.readAsText(file);
  });
}

export function exportSpriteSheetImage(config: ProjectConfig) {
  if (!config.meta) return;
  const a = document.createElement("a");
  a.href = config.meta.dataUrl;
  a.download = config.meta.fileName || "spritesheet.png";
  a.click();
}

function getRuntimeProject(config: ProjectConfig): ProjectConfig {
  const clone = JSON.parse(JSON.stringify(config)) as ProjectConfig;
  if (clone.meta) {
    clone.meta.dataUrl = `/assets/${clone.meta.fileName || "spritesheet.png"}`;
  }
  return clone;
}

/** Manifesto leve para ser carregado por jogos web, sem embutir a imagem. */
export function exportRuntimeManifest(config: ProjectConfig) {
  download(
    "spritelab-runtime.json",
    JSON.stringify(getRuntimeProject(config), null, 2),
    "application/json"
  );
}

/** Atlas JSON compatível com Phaser e outros runtimes que aceitam hash de frames. */
export function exportAtlasJson(config: ProjectConfig) {
  if (!config.meta) return;
  const meta = config.meta;
  const frameEntries: [string, object][] = [];
  for (let index = 0; index < getFrameCount(meta); index += 1) {
    const rect = getFrameRect(meta, index);
    if (!rect) continue;
    frameEntries.push([
      `frame-${index}`,
      {
        frame: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: rect.width, h: rect.height },
        sourceSize: { w: rect.width, h: rect.height },
      },
    ]);
  }

  download(
    "spritelab-atlas.json",
    JSON.stringify(
      {
        frames: Object.fromEntries(frameEntries),
        meta: {
          app: "SpriteLab",
          version: config.version,
          image: meta.fileName,
          size: { w: meta.imageWidth, h: meta.imageHeight },
          scale: "1",
        },
      },
      null,
      2
    ),
    "application/json"
  );
}

/**
 * Exporta uma API pequena para integrar o editor a scripts de gameplay.
 * O arquivo registra atlas/animações, aplica overrides por frame, expõe
 * hitboxes e dispara os eventos criados na timeline.
 */
export function exportRuntimeScript(config: ProjectConfig) {
  const projectLiteral = JSON.stringify(getRuntimeProject(config), null, 2);
  const code = `import Phaser from "phaser";

// SpriteLab Runtime API — gerado automaticamente.
// Copie este arquivo para seu projeto Phaser e coloque a imagem em /assets.
export const SPRITELAB_PROJECT = ${projectLiteral} as const;

function rectsFor(project) {
  const meta = project.meta;
  if (!meta) return [];
  if (meta.frameRects && meta.frameRects.length) return meta.frameRects;
  return Array.from({ length: meta.totalFrames }, (_, index) => {
    const column = index % Math.max(1, meta.columns);
    const row = Math.floor(index / Math.max(1, meta.columns));
    return {
      x: meta.marginX + column * (meta.frameWidth + meta.spacingX),
      y: meta.marginY + row * (meta.frameHeight + meta.spacingY),
      width: meta.frameWidth,
      height: meta.frameHeight,
    };
  });
}

export function registerSpriteLabAtlas(scene, sourceImage, textureKey = "sprite", project = SPRITELAB_PROJECT) {
  const rects = rectsFor(project);
  if (scene.textures.exists(textureKey)) scene.textures.remove(textureKey);
  scene.textures.addAtlasJSONHash(textureKey, sourceImage, {
    frames: Object.fromEntries(rects.map((rect, index) => [
      \`frame-\${index}\`,
      { frame: { x: rect.x, y: rect.y, w: rect.width, h: rect.height }, rotated: false, trimmed: false },
    ])),
    meta: { image: project.meta?.fileName ?? "spritesheet.png", scale: "1" },
  });
  return textureKey;
}

export function registerSpriteLabAtlasFromLoadedImage(scene, sourceKey, textureKey = "sprite", project = SPRITELAB_PROJECT) {
  const source = scene.textures.get(sourceKey).getSourceImage();
  return registerSpriteLabAtlas(scene, source, textureKey, project);
}

function indexesFor(animation) {
  if (animation.frameOrder && animation.frameOrder.length) return animation.frameOrder;
  const step = animation.startFrame <= animation.endFrame ? 1 : -1;
  const indexes = [];
  for (let frame = animation.startFrame; step > 0 ? frame <= animation.endFrame : frame >= animation.endFrame; frame += step) indexes.push(frame);
  return indexes;
}

export function createSpriteLabAnimations(scene, textureKey = "sprite", project = SPRITELAB_PROJECT) {
  project.animations.forEach((animation) => {
    const key = \`anim-\${animation.id}\`;
    if (scene.anims.exists(key)) scene.anims.remove(key);
    scene.anims.create({
      key,
      frames: indexesFor(animation).map((frame) => ({ key: textureKey, frame: \`frame-\${frame}\` })),
      frameRate: animation.frameRate,
      repeat: animation.repeat,
      yoyo: animation.yoyo,
    });
  });
}

function animationFor(project, nameOrState) {
  const mapped = project.animMapping[nameOrState] ?? nameOrState;
  return project.animations.find((animation) => animation.id === mapped || animation.name === mapped) ?? null;
}

export function applySpriteLabFrame(sprite, project = SPRITELAB_PROJECT, frameIndex = 0) {
  const base = project.character;
  const edit = project.frameEdits[String(frameIndex)] ?? {};
  sprite.setScale(
    base.scale * (base.scaleX / 100) * (edit.scaleX ?? 1),
    base.scale * (base.scaleY / 100) * (edit.scaleY ?? 1),
  );
  sprite.setOrigin(edit.originX ?? base.originX, edit.originY ?? base.originY);
  sprite.setAngle(base.rotation + (edit.rotation ?? 0));
  sprite.setAlpha(base.opacity * (edit.alpha ?? 1));
  sprite.setFlipY(Boolean(edit.flipY));
  return sprite;
}

export function getSpriteLabHitboxes(project = SPRITELAB_PROJECT, frameIndex = 0) {
  return project.hitboxes.filter((hitbox) => hitbox.enabled && (hitbox.frame === null || hitbox.frame === frameIndex));
}

export class SpriteLabController {
  listeners = new Set();
  lastEventKey = "";

  constructor(scene, sprite, project = SPRITELAB_PROJECT) {
    this.scene = scene;
    this.sprite = sprite;
    this.project = project;
    this.onAnimationUpdate = this.onAnimationUpdate.bind(this);
    sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, this.onAnimationUpdate);
    applySpriteLabFrame(sprite, project, 0);
  }

  on(handler) {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  play(nameOrState, ignoreIfPlaying = true) {
    const animation = animationFor(this.project, nameOrState);
    if (!animation) return false;
    const key = \`anim-\${animation.id}\`;
    if (this.scene.anims.exists(key)) {
      this.sprite.play(key, ignoreIfPlaying);
      return true;
    }
    return false;
  }

  setState(state) {
    return this.play(state);
  }

  getFrame() {
    const match = /frame-(\\d+)/.exec(String(this.sprite.frame?.name ?? ""));
    return match ? Number(match[1]) : Number(this.sprite.frame?.name ?? 0) || 0;
  }

  getHitboxes() {
    return getSpriteLabHitboxes(this.project, this.getFrame());
  }

  onAnimationUpdate(animation, frame) {
    const frameIndex = Number(/frame-(\\d+)/.exec(String(frame?.frame?.name ?? ""))?.[1] ?? 0);
    applySpriteLabFrame(this.sprite, this.project, frameIndex);
    const definition = this.project.animations.find((item) => \`anim-\${item.id}\` === animation.key);
    if (!definition) return;
    const eventKey = \`\${animation.key}:\${frameIndex}:\${frame?.frame?.name}\`;
    if (eventKey === this.lastEventKey) return;
    this.lastEventKey = eventKey;
    (definition.events ?? []).filter((event) => event.frame === frameIndex).forEach((event) => {
      const detail = { animation: definition.name, frame: frameIndex, ...event };
      this.listeners.forEach((handler) => handler(detail));
    });
  }

  destroy() {
    this.sprite.off(Phaser.Animations.Events.ANIMATION_UPDATE, this.onAnimationUpdate);
    this.listeners.clear();
  }
}
`;
  download("SpriteLabRuntime.ts", code, "text/plain");
}

export function exportPhaserComponent(config: ProjectConfig) {
  const meta = config.meta;
  const customRects = meta?.frameRects?.length ? meta.frameRects : null;
  const frameLiteral = (frame: number) =>
    customRects ? JSON.stringify(`frame-${frame}`) : String(frame);
  const anims = config.animations
    .map((a) => {
      const rangeFrames = Array.from(
        { length: Math.max(1, Math.abs(a.endFrame - a.startFrame) + 1) },
        (_, index) =>
          a.startFrame <= a.endFrame
            ? a.startFrame + index
            : a.startFrame - index
      );
      const frames =
        a.frameOrder && a.frameOrder.length
          ? `[${a.frameOrder
              .map((frame) => `{ key: TEX, frame: ${frameLiteral(frame)} }`)
              .join(", ")}]`
          : customRects
            ? `[${rangeFrames
                .map((frame) => `{ key: TEX, frame: ${frameLiteral(frame)} }`)
                .join(", ")}]`
            : `this.anims.generateFrameNumbers(TEX, { start: ${a.startFrame}, end: ${a.endFrame} })`;
      return `      this.anims.create({
        key: ${JSON.stringify(a.name)},
        frames: ${frames},
        frameRate: ${a.frameRate},
        repeat: ${a.repeat},
        yoyo: ${a.yoyo},
      });`;
    })
    .join("\n");

  const map = config.animMapping;
  const nameOf = (id: string | null | undefined) => {
    const found = config.animations.find((a) => a.id === id);
    return found ? JSON.stringify(found.name) : "null";
  };

  const code = `import { useEffect, useRef } from "react";
import Phaser from "phaser";

// ===================================================================
// Auto-gerado por SpriteLab. Coloque seu spritesheet em /public e
// aponte SHEET_URL para ele. Frame: ${meta ? meta.frameWidth + "x" + meta.frameHeight : "??"}
// ===================================================================

const SHEET_URL = "/spritesheet.png"; // <-- ajuste o caminho
const TEX = "player";
const SHEET_SOURCE = "player-source";

const FRAME = { width: ${meta?.frameWidth ?? 32}, height: ${meta?.frameHeight ?? 32} };
const CUSTOM_RECTS = ${JSON.stringify(customRects ?? [])};
const PLAYER_FRAME = ${JSON.stringify(customRects ? "frame-0" : "0")};

const ANIM_MAP = {
  idle: ${nameOf(map.idle)},
  walk: ${nameOf(map.walk)},
  jump: ${nameOf(map.jump)},
  action: ${nameOf(map.action)},
};

const CHARACTER = ${JSON.stringify(config.character, null, 2)};

class PlayerScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private body!: Phaser.Physics.Arcade.Body;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyJump!: Phaser.Input.Keyboard.Key;
  private keyAction!: Phaser.Input.Keyboard.Key;
  private current = "";

  constructor() { super("PlayerScene"); }

  preload() {
    ${customRects ? "this.load.image(SHEET_SOURCE, SHEET_URL);" : "this.load.spritesheet(TEX, SHEET_URL, FRAME);"}
  }

  create() {
    ${
      customRects
        ? `const source = this.textures.get(SHEET_SOURCE).getSourceImage();
    this.textures.addAtlasJSONHash(TEX, source, {
      frames: Object.fromEntries(CUSTOM_RECTS.map((rect, index) => [
        \`frame-\${index}\`,
        { frame: { x: rect.x, y: rect.y, w: rect.width, h: rect.height }, rotated: false, trimmed: false },
      ])),
    });`
        : ""
    }
${anims}

    this.player = this.add.sprite(400, 300, TEX, PLAYER_FRAME).setScale(CHARACTER.scale);
    this.physics.add.existing(this.player);
    this.body = this.player.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
    ${config.character.movementMode === "platformer" ? "this.body.setGravityY(CHARACTER.gravity);" : "this.body.setAllowGravity(false);"}
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    this.cursors = keyboard.createCursorKeys();
    this.keyJump = keyboard.addKey("SPACE");
    this.keyAction = keyboard.addKey("J");
    if (ANIM_MAP.idle) this.player.play(ANIM_MAP.idle);
  }

  play(name) {
    if (name && this.anims.exists(name) && this.current !== name) {
      this.player.play(name, true);
      this.current = name;
    }
  }

  update() {
    const b = this.body;
    let moving = false;
    ${
      config.character.movementMode === "platformer"
        ? `b.setVelocityX(0);
    if (this.cursors.left.isDown) { b.setVelocityX(-CHARACTER.speed); this.player.setFlipX(true); moving = true; }
    else if (this.cursors.right.isDown) { b.setVelocityX(CHARACTER.speed); this.player.setFlipX(false); moving = true; }
    const onGround = b.blocked.down || b.touching.down;
    if (Phaser.Input.Keyboard.JustDown(this.keyJump) && onGround) b.setVelocityY(-CHARACTER.jumpPower);
    if (!onGround) this.play(ANIM_MAP.jump);
    else if (moving) this.play(ANIM_MAP.walk);
    else this.play(ANIM_MAP.idle);`
        : `b.setVelocity(0);
    if (this.cursors.left.isDown) { b.setVelocityX(-CHARACTER.speed); this.player.setFlipX(true); moving = true; }
    if (this.cursors.right.isDown) { b.setVelocityX(CHARACTER.speed); this.player.setFlipX(false); moving = true; }
    if (this.cursors.up.isDown) { b.setVelocityY(-CHARACTER.speed); moving = true; }
    if (this.cursors.down.isDown) { b.setVelocityY(CHARACTER.speed); moving = true; }
    if (moving) this.play(ANIM_MAP.walk); else this.play(ANIM_MAP.idle);`
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyAction)) this.play(ANIM_MAP.action);
  }
}

export default function PhaserSprite() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: ref.current!,
      width: 800,
      height: 600,
      pixelArt: true,
      backgroundColor: ${JSON.stringify(config.stage.bgColor)},
      physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 } } },
      scene: [PlayerScene],
    });
    return () => game.destroy(true);
  }, []);
  return <div ref={ref} />;
}
`;
  download("PhaserSprite.tsx", code, "text/plain");
}
