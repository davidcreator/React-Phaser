import Phaser from "phaser";
import type {
  ProjectConfig,
  SpriteSheetMeta,
  AnimationConfig,
  AnimationEvent,
  NpcInstance,
} from "../types";
import { getFrameCount, getFrameRect } from "./sliceSheet";
import * as audio from "../audio";

export interface AnimationEventTrigger {
  animationId: string;
  animationName: string;
  frame: number;
  event: AnimationEvent;
}

export interface SceneCallbacks {
  onState: (s: LiveGameState) => void;
  onError?: (msg: string) => void;
  onReady?: () => void;
  onAnimationEvent?: (trigger: AnimationEventTrigger) => void;
}

export interface LiveGameState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  currentAnim: string;
  onGround: boolean;
  fps: number;
  gamepadConnected: boolean;
  activeFrame: number;
  jumps: number;
}

const BLEND: Record<string, Phaser.BlendModes> = {
  NORMAL: Phaser.BlendModes.NORMAL,
  ADD: Phaser.BlendModes.ADD,
  MULTIPLY: Phaser.BlendModes.MULTIPLY,
  SCREEN: Phaser.BlendModes.SCREEN,
  ERASE: Phaser.BlendModes.ERASE,
};

interface NpcObj {
  sprite: Phaser.GameObjects.Sprite;
  data: NpcInstance;
  dir: number;
  originX: number;
}

export class SpriteScene extends Phaser.Scene {
  private config!: ProjectConfig;
  private callbacks!: SceneCallbacks;
  private player?: Phaser.GameObjects.Sprite;
  private physicsBody?: Phaser.Physics.Arcade.Body;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<string, Phaser.Input.Keyboard.Key>;
  private gridGraphics?: Phaser.GameObjects.Graphics;
  private gradientGraphics?: Phaser.GameObjects.Graphics;
  private hitboxGraphics?: Phaser.GameObjects.Graphics;
  private bgRect?: Phaser.GameObjects.Rectangle;
  private floor?: Phaser.GameObjects.Rectangle;
  private trailGroup: Phaser.GameObjects.Image[] = [];
  private particleEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private npcs: NpcObj[] = [];
  private lastStep = 0;
  private currentAnimName = "-";
  private facingLeft = false;
  private ready = false;
  private stateTimer = 0;
  private overrideAnim: string | null = null;
  private jumpsUsed = 0;
  private padJumpPrev = false;
  private padActionPrev = false;
  private velX = 0;
  private lastGroundedAt = 0;
  private hasGroundedOnce = false;
  private wasGroundedLastFrame = false;
  private jumpQueuedUntil = 0;
  private timelineFrame: number | null = null; // scrubbing manual
  private isPaused = false;
  private squashTween?: Phaser.Tweens.Tween;
  private sceneReady = false;
  private pendingConfig: ProjectConfig | null = null;
  private texSeq = 0; // sequência para gerar keys únicos por spritesheet
  private currentTexKey = "";
  private sheetLoadId = 0;
  private currentFrameCount = 0;
  private animationKeys = new Set<string>();
  private lastDispatchedFrame = "";

  constructor() {
    super("SpriteScene");
  }

  init(data: { config: ProjectConfig; callbacks: SceneCallbacks }) {
    this.config = data.config;
    this.callbacks = data.callbacks;
  }

  preload() {}

  create() {
    this.buildStage();
    this.setupInput();
    this.sceneReady = true;
    // se algum config chegou antes do create(), aplica agora
    const cfg = this.pendingConfig ?? this.config;
    this.pendingConfig = null;
    this.rebuildFromConfig(cfg);
    this.scale.on("resize", () => {
      this.drawStageDecor();
      this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);
      if (this.physicsBody) {
        this.physics.world.setBounds(
          0,
          0,
          this.scale.width,
          this.getWorldHeight()
        );
        this.keepActorsVisible();
      }
      this.syncCamera();
    });
  }

  private buildStage() {
    this.bgRect = this.add
      .rectangle(0, 0, 10, 10, 0x0f172a)
      .setOrigin(0, 0)
      .setDepth(-10);
    this.gradientGraphics = this.add.graphics().setDepth(-9);
    this.gridGraphics = this.add.graphics().setDepth(-8);
    this.floor = this.add
      .rectangle(0, 0, 10, 10, 0x1e293b)
      .setOrigin(0, 0)
      .setDepth(-5);
    this.hitboxGraphics = this.add.graphics().setDepth(20);
    this.drawStageDecor();
  }

  private getFloorHeight() {
    if (!this.config.stage.showFloor) return 0;
    return Math.min(
      Math.max(0, this.config.stage.floorHeight),
      Math.max(0, this.scale.height - 1)
    );
  }

  private getWorldHeight() {
    return Math.max(1, this.scale.height - this.getFloorHeight());
  }

  private frameName(index: number) {
    return `frame-${Math.max(0, Math.floor(index))}`;
  }

  private frameIndexFromName(name: string) {
    const match = /^frame-(\d+)$/.exec(name);
    return match ? Number(match[1]) : Math.max(0, parseInt(name, 10) || 0);
  }

  private currentFrameIndex() {
    return this.frameIndexFromName(this.player?.frame.name ?? "");
  }

  private drawStageDecor() {
    const w = this.scale.width;
    const h = this.scale.height;
    const { stage } = this.config;

    const bgColor = Phaser.Display.Color.HexStringToColor(stage.bgColor).color;
    const bgColor2 = Phaser.Display.Color.HexStringToColor(stage.bgColor2).color;
    if (this.bgRect) {
      this.bgRect.setSize(w, h);
      this.bgRect.setFillStyle(bgColor);
    }
    if (this.gradientGraphics) {
      this.gradientGraphics.clear();
      if (stage.bgGradient) {
        this.gradientGraphics.fillGradientStyle(
          bgColor,
          bgColor,
          bgColor2,
          bgColor2,
          1,
          1,
          1,
          1
        );
        this.gradientGraphics.fillRect(0, 0, w, h);
      }
    }
    this.cameras.main.setBackgroundColor(stage.bgColor);

    if (this.floor) {
      if (stage.showFloor) {
        const floorHeight = Math.min(Math.max(0, stage.floorHeight), h);
        this.floor.setVisible(true);
        this.floor.setPosition(0, h - floorHeight);
        this.floor.setSize(w, floorHeight);
        this.floor.setFillStyle(
          Phaser.Display.Color.HexStringToColor(stage.bgColor).darken(35).color
        );
      } else {
        this.floor.setVisible(false);
      }
    }

    const g = this.gridGraphics;
    if (g) {
      g.clear();
      if (stage.showGrid) {
        g.lineStyle(1, 0xffffff, 0.06);
        for (let x = 0; x <= w; x += stage.gridSize) g.lineBetween(x, 0, x, h);
        for (let y = 0; y <= h; y += stage.gridSize) g.lineBetween(0, y, w, y);
        g.lineStyle(1, 0x38bdf8, 0.22);
        g.lineBetween(w / 2, 0, w / 2, h);
        g.lineBetween(0, h / 2, w, h / 2);
      }
    }
  }

  private setupInput() {
    if (!this.input.keyboard) return;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys(
      "W,A,S,D,SPACE,J,K,SHIFT"
    ) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  loadSpriteSheet(meta: SpriteSheetMeta, cb: (ok: boolean) => void) {
    // Usa um key novo a cada carga para nunca reutilizar textura removida
    // (evita frames "fantasma" e erros de referência ao trocar de sheet).
    // O token também impede que uma imagem antiga, carregada fora de ordem,
    // sobrescreva o spritesheet escolhido por último.
    const loadId = ++this.sheetLoadId;
    const newKey = `spritesheet_${++this.texSeq}`;
    const img = new Image();
    img.onload = () => {
      if (loadId !== this.sheetLoadId) return;
      try {
        // Sempre montamos um atlas JSON. Assim o modo tradicional de grade e
        // o modo livre usam exatamente o mesmo runtime e cada quadro pode ter
        // um retângulo independente.
        const sourceMeta = {
          ...meta,
          imageWidth: img.naturalWidth,
          imageHeight: img.naturalHeight,
        };
        const count = getFrameCount(meta);
        const rects = Array.from({ length: count }, (_, index) => {
          const rect = getFrameRect(sourceMeta, index);
          if (!rect) return null;
          const x = Math.max(0, Math.min(img.naturalWidth - 1, rect.x));
          const y = Math.max(0, Math.min(img.naturalHeight - 1, rect.y));
          return {
            x,
            y,
            w: Math.max(1, Math.min(rect.width, img.naturalWidth - x)),
            h: Math.max(1, Math.min(rect.height, img.naturalHeight - y)),
          };
        }).filter((rect): rect is { x: number; y: number; w: number; h: number } => Boolean(rect));
        if (!rects.length) {
          console.warn("[SpriteLab] spritesheet não possui quadros válidos.");
          cb(false);
          return;
        }
        if (this.textures.exists(newKey)) this.textures.remove(newKey);
        const frames = Object.fromEntries(
          rects.map((rect, index) => [
            this.frameName(index),
            {
              frame: rect,
              rotated: false,
              trimmed: false,
            },
          ])
        );
        this.textures.addAtlasJSONHash(newKey, img, {
          frames,
          meta: {
            image: meta.fileName,
            size: { w: img.naturalWidth, h: img.naturalHeight },
            scale: "1",
          },
        });
        const frameTotal = this.textures.get(newKey).frameTotal - 1; // -1 = __BASE
        if (frameTotal <= 0) {
          console.warn("[SpriteLab] spritesheet gerou 0 frames.");
          this.textures.remove(newKey);
          cb(false);
          return;
        }
        this.currentFrameCount = Math.min(rects.length, frameTotal);
        // remove a textura antiga só depois que a nova está pronta
        const old = this.currentTexKey;
        this.currentTexKey = newKey;
        if (old && old !== newKey && this.textures.exists(old)) {
          this.textures.remove(old);
        }
        cb(true);
      } catch (err) {
        console.error("[SpriteLab] erro ao fatiar spritesheet:", err);
        if (this.textures.exists(newKey)) this.textures.remove(newKey);
        cb(false);
      }
    };
    img.onerror = () => {
      if (loadId !== this.sheetLoadId) return;
      console.error("[SpriteLab] falha ao carregar a imagem do spritesheet.");
      cb(false);
    };
    img.src = meta.dataUrl;
  }

  private setAudioVolume(volume: number) {
    try {
      audio.setMasterVolume(volume);
    } catch (error) {
      // Web Audio pode não existir (ou estar bloqueado) em alguns browsers.
      console.warn("[SpriteLab] áudio indisponível:", error);
    }
  }

  private clearTrails() {
    this.trailGroup.forEach((ghost) => ghost.destroy());
    this.trailGroup = [];
  }

  rebuildFromConfig(config: ProjectConfig) {
    this.config = config;
    if (!this.sceneReady) {
      // create() ainda não rodou — guarda para aplicar depois
      this.pendingConfig = config;
      return;
    }
    this.drawStageDecor();
    this.setAudioVolume(config.sound.masterVolume);
    this.sheetLoadId++;
    this.timelineFrame = null;
    this.isPaused = false;
    this.overrideAnim = null;
    this.currentAnimName = "-";
    this.lastDispatchedFrame = "";
    this.lastGroundedAt = 0;
    this.hasGroundedOnce = false;
    this.wasGroundedLastFrame = false;
    this.jumpQueuedUntil = 0;
    this.clearTrails();

    if (!config.meta) {
      this.ready = false;
      this.player?.destroy();
      this.player = undefined;
      this.physicsBody = undefined;
      this.clearNpcs();
      this.particleEmitter?.destroy();
      this.particleEmitter = undefined;
      this.animationKeys.forEach((key) => {
        if (this.anims.exists(key)) this.anims.remove(key);
      });
      this.animationKeys.clear();
      if (this.currentTexKey && this.textures.exists(this.currentTexKey)) {
        this.textures.remove(this.currentTexKey);
      }
      this.currentTexKey = "";
      this.currentFrameCount = 0;
      return;
    }

    // Mantém a cena em estado de loading até a nova textura estar pronta; isso
    // evita que física, hitboxes e NPCs continuem usando frames antigos.
    this.ready = false;
    this.player?.destroy();
    this.player = undefined;
    this.physicsBody = undefined;
    this.clearNpcs();
    if (this.particleEmitter) {
      this.particleEmitter.destroy();
      this.particleEmitter = undefined;
    }
    this.loadSpriteSheet(config.meta, (ok) => {
      if (!ok) {
        this.callbacks.onError?.("Não foi possível fatiar este spritesheet.");
        return;
      }
      this.buildAnimations(config.animations);
      this.spawnPlayer();
      this.setupParticles();
      this.rebuildNpcs();
      this.ready = true;
      this.callbacks.onReady?.();
    });
  }

  applyConfig(config: ProjectConfig) {
    const prevMode = this.config.character.movementMode;
    this.config = config;
    this.drawStageDecor();
    this.setAudioVolume(config.sound.masterVolume);
    if (this.currentTexKey && this.textures.exists(this.currentTexKey))
      this.buildAnimations(config.animations);

    if (this.player) {
      this.applyPlayerTransform();
      if (this.physicsBody) {
        const plat = config.character.movementMode === "platformer";
        this.physicsBody.setAllowGravity(plat);
        this.physicsBody.setGravityY(plat ? config.character.gravity : 0);
        this.physics.world.setBounds(
          0,
          0,
          this.scale.width,
          this.getWorldHeight()
        );
        if (prevMode !== config.character.movementMode) {
          this.physicsBody.setVelocity(0, 0);
        }
      }
    }
    this.cameras.main.setZoom(config.stage.zoom);
    this.syncCamera();
    this.setupParticles();
    this.syncNpcs();
  }

  private applyPlayerTransform() {
    if (!this.player) return;
    const c = this.config.character;
    this.player.setScale(
      c.scale * (c.scaleX / 100),
      c.scale * (c.scaleY / 100)
    );
    this.player.setOrigin(c.originX, c.originY);
    this.player.setAngle(c.rotation);
    this.player.setAlpha(c.opacity);
    this.player.setBlendMode(BLEND[this.config.fx.blendMode]);
    if (c.tintEnabled) {
      this.player.setTint(
        Phaser.Display.Color.HexStringToColor(c.tint).color
      );
    } else {
      this.player.clearTint();
    }

    // Glow é um Pre FX do Phaser 3.60+. Ele é ignorado em renderizadores
    // Canvas, mas não deve impedir o teste do sprite nesses ambientes.
    if (this.player.preFX) {
      this.player.preFX.clear();
      if (this.config.fx.glowEnabled) {
        try {
          this.player.preFX.addGlow(
            Phaser.Display.Color.HexStringToColor(this.config.fx.glowColor).color,
            this.config.fx.glowStrength,
            0
          );
        } catch {
          // Pre FX só existe no pipeline WebGL.
        }
      }
    }
    this.applyFrameEdit();
  }

  private applyFrameEdit() {
    if (!this.player) return;
    const c = this.config.character;
    const edit = this.config.frameEdits[String(this.currentFrameIndex())];
    const scaleX = c.scale * (c.scaleX / 100) * (edit?.scaleX ?? 1);
    const scaleY = c.scale * (c.scaleY / 100) * (edit?.scaleY ?? 1);
    this.player.setScale(scaleX, scaleY);
    this.player.setOrigin(edit?.originX ?? c.originX, edit?.originY ?? c.originY);
    this.player.setAngle(c.rotation + (edit?.rotation ?? 0));
    this.player.setAlpha(c.opacity * (edit?.alpha ?? 1));
    const facing = c.flipOnDirection ? this.facingLeft : false;
    this.player.setFlipX(facing !== Boolean(edit?.flipX));
    this.player.setFlipY(Boolean(edit?.flipY));
  }

  private applyNpcFrameEdit(npc: NpcObj) {
    const edit = this.config.frameEdits[String(this.frameIndexFromName(npc.sprite.frame.name))];
    const scaleX = npc.data.scale * (edit?.scaleX ?? 1);
    const scaleY = npc.data.scale * (edit?.scaleY ?? 1);
    npc.sprite.setScale(scaleX, scaleY);
    npc.sprite.setOrigin(edit?.originX ?? 0.5, edit?.originY ?? 0.5);
    npc.sprite.setAngle(edit?.rotation ?? 0);
    npc.sprite.setAlpha(edit?.alpha ?? 1);
    const behaviorFlip =
      npc.data.behavior === "idle" ? npc.data.flipX : npc.dir < 0;
    npc.sprite.setFlipX(Boolean(behaviorFlip) !== Boolean(edit?.flipX));
    npc.sprite.setFlipY(Boolean(edit?.flipY));
  }

  private keepActorsVisible() {
    const width = Math.max(1, this.scale.width);
    const height = Math.max(1, this.scale.height);
    const playerFloor =
      this.config.character.movementMode === "platformer"
        ? this.getWorldHeight()
        : height;

    const clampSprite = (sprite: Phaser.GameObjects.Sprite, bottom: number) => {
      const displayWidth = Math.max(1, sprite.displayWidth);
      const displayHeight = Math.max(1, sprite.displayHeight);
      const minX = displayWidth >= width ? width / 2 : displayWidth * sprite.originX;
      const maxX =
        displayWidth >= width
          ? width / 2
          : width - displayWidth * (1 - sprite.originX);
      const minY = displayHeight >= bottom ? bottom / 2 : displayHeight * sprite.originY;
      const maxY =
        displayHeight >= bottom
          ? bottom / 2
          : bottom - displayHeight * (1 - sprite.originY);
      sprite.x = Phaser.Math.Clamp(sprite.x, minX, Math.max(minX, maxX));
      sprite.y = Phaser.Math.Clamp(sprite.y, minY, Math.max(minY, maxY));
    };

    if (this.player) {
      const beforeX = this.player.x;
      const beforeY = this.player.y;
      clampSprite(this.player, playerFloor);
      if (this.physicsBody && (beforeX !== this.player.x || beforeY !== this.player.y)) {
        this.physicsBody.updateFromGameObject();
        this.physicsBody.setVelocity(0, 0);
        this.velX = 0;
      }
    }

    this.npcs.forEach((npc) => clampSprite(npc.sprite, height));
  }

  private syncCamera() {
    if (!this.player) return;
    this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);
    if (this.config.stage.cameraFollow) {
      this.cameras.main.startFollow(
        this.player,
        true,
        this.config.stage.cameraLerp,
        this.config.stage.cameraLerp
      );
    } else {
      this.cameras.main.stopFollow();
      this.cameras.main.centerOn(this.scale.width / 2, this.scale.height / 2);
    }
  }

  private buildAnimations(anims: AnimationConfig[]) {
    const tex = this.currentTexKey;
    if (!tex || !this.textures.exists(tex)) return;
    // Interrompe a animação antiga antes de remover/recriar as definições.
    // Sem isso, o sprite podia continuar preso a um objeto Animation removido.
    const previousKey = this.currentAnimName;
    this.player?.anims.stop();
    this.currentAnimName = "-";
    // total real de frames disponíveis (o atlas também possui __BASE)
    const maxFrame = Math.max(0, this.currentFrameCount - 1);
    this.animationKeys.forEach((key) => {
      if (this.anims.exists(key)) this.anims.remove(key);
    });
    this.animationKeys.clear();

    anims.forEach((a) => {
      const key = `anim-${a.id}`;
      if (this.anims.exists(key)) this.anims.remove(key);
      try {
        let frames: Phaser.Types.Animations.AnimationFrame[];
        if (a.frameOrder && a.frameOrder.length) {
          frames = a.frameOrder
            .map((f) => Phaser.Math.Clamp(f, 0, maxFrame))
            .map((f) => ({ key: tex, frame: this.frameName(f) }));
        } else {
          // Atlases usam nomes de frame, portanto generateFrameNumbers não é
          // adequado aqui. Mantemos a mesma semântica de início/fim.
          const start = Phaser.Math.Clamp(
            Math.min(a.startFrame, a.endFrame),
            0,
            maxFrame
          );
          const end = Phaser.Math.Clamp(
            Math.max(a.startFrame, a.endFrame),
            start,
            maxFrame
          );
          frames = Array.from({ length: end - start + 1 }, (_, offset) => ({
            key: tex,
            frame: this.frameName(start + offset),
          }));
        }
        if (!frames.length) return;
        this.anims.create({
          key,
          frames,
          frameRate: Math.max(1, a.frameRate),
          repeat: a.repeat,
          yoyo: a.yoyo,
        });
        this.animationKeys.add(key);
      } catch (err) {
        console.warn(`[SpriteLab] falha ao criar animação "${a.name}":`, err);
      }
    });

    if (this.player) {
      if (this.timelineFrame !== null) {
        const safeFrame = Phaser.Math.Clamp(this.timelineFrame, 0, maxFrame);
        this.timelineFrame = safeFrame;
        this.player.setFrame(this.frameName(safeFrame));
        this.player.anims.pause();
        this.applyFrameEdit();
      } else if (previousKey !== "-" && this.anims.exists(previousKey)) {
        this.player.play(previousKey, true);
        this.currentAnimName = previousKey;
      }
    }
  }

  private spawnPlayer() {
    const c = this.config.character;
    const startX = this.scale.width / 2 + c.offsetX;
    const startY =
      (c.movementMode === "platformer"
        ? this.scale.height -
          this.getFloorHeight() -
          (this.config.meta!.frameHeight * c.scale) / 2
        : this.scale.height / 2) + c.offsetY;

    if (this.player) this.player.destroy();
    this.player = this.add
      .sprite(startX, startY, this.currentTexKey, this.frameName(0))
      .setDepth(10);
    this.applyPlayerTransform();
    this.physics.add.existing(this.player);
    this.physicsBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.physicsBody.setCollideWorldBounds(true);
    this.physics.world.setBounds(
      0,
      0,
      this.scale.width,
      this.getWorldHeight()
    );
    const plat = c.movementMode === "platformer";
    this.physicsBody.setAllowGravity(plat);
    if (plat) this.physicsBody.setGravityY(c.gravity);
    this.cameras.main.setZoom(this.config.stage.zoom);
    this.syncCamera();
    this.playMapped("idle");
  }

  private setupParticles() {
    if (this.particleEmitter) {
      this.particleEmitter.destroy();
      this.particleEmitter = undefined;
    }
    if (!this.config.fx.particlesOnMove) return;
    const key = "particle-dot";
    if (!this.textures.exists(key)) {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture(key, 8, 8);
      g.destroy();
    }
    const color = Phaser.Display.Color.HexStringToColor(
      this.config.fx.particleColor
    ).color;
    this.particleEmitter = this.add.particles(0, 0, key, {
      speed: { min: 20, max: this.config.fx.particleSpeed },
      scale: { start: 0.7, end: 0 },
      lifespan: this.config.fx.particleLifespan,
      quantity: 1,
      frequency: -1,
      tint: color,
      blendMode: this.config.fx.blendMode === "NORMAL" ? "NORMAL" : "ADD",
    });
    this.particleEmitter.setDepth(5);
  }

  // ------------- NPCs -------------
  private clearNpcs() {
    this.npcs.forEach((n) => n.sprite.destroy());
    this.npcs = [];
  }

  // Sincroniza NPCs de forma incremental (evita flicker ao editar config)
  private syncNpcs() {
    if (!this.currentTexKey || !this.textures.exists(this.currentTexKey)) return;
    const ids = new Set(this.config.npcs.map((n) => n.id));
    // remover os que saíram
    this.npcs = this.npcs.filter((n) => {
      if (!ids.has(n.data.id)) {
        n.sprite.destroy();
        return false;
      }
      return true;
    });
    this.config.npcs.forEach((data) => {
      let obj = this.npcs.find((n) => n.data.id === data.id);
      if (!obj) {
        const sprite = this.add
          .sprite(data.x, data.y, this.currentTexKey, this.frameName(0))
          .setDepth(8);
        obj = { sprite, data, dir: 1, originX: data.x };
        this.npcs.push(obj);
      }
      const s = obj.sprite;
      const prev = obj.data;
      obj.data = data;
      s.setScale(data.scale);
      s.setFlipX(data.flipX);
      if (data.tintEnabled) {
        s.setTint(Phaser.Display.Color.HexStringToColor(data.tint).color);
      } else {
        s.clearTint();
      }
      // só reposiciona se o usuário mudou X/Y via slider (comportamento estático)
      if (prev.x !== data.x || data.behavior === "idle") s.x = data.x;
      if (prev.y !== data.y || true) s.y = data.y;
      obj.originX = data.x;
      const key = data.animId ? `anim-${data.animId}` : null;
      const wantKey = key && this.anims.exists(key) ? key : null;
      const cur = s.anims.currentAnim?.key ?? null;
      if (wantKey && (cur !== wantKey || !s.anims.isPlaying)) s.play(wantKey);
      else if (!wantKey) s.stop();
      this.applyNpcFrameEdit(obj);
    });
  }

  private rebuildNpcs() {
    if (!this.currentTexKey || !this.textures.exists(this.currentTexKey)) return;
    this.clearNpcs();
    this.config.npcs.forEach((data) => {
      const sprite = this.add
        .sprite(data.x, data.y, this.currentTexKey, this.frameName(0))
        .setDepth(8);
      sprite.setScale(data.scale);
      sprite.setFlipX(data.flipX);
      if (data.tintEnabled) {
        sprite.setTint(Phaser.Display.Color.HexStringToColor(data.tint).color);
      }
      const key = data.animId ? `anim-${data.animId}` : null;
      if (key && this.anims.exists(key)) sprite.play(key);
      this.npcs.push({ sprite, data, dir: 1, originX: data.x });
    });
  }

  private updateNpcs(delta: number) {
    if (!this.player) return;
    this.npcs.forEach((n) => {
      const d = n.data;
      const dt = delta / 1000;
      if (d.behavior === "patrol") {
        n.sprite.x += n.dir * d.speed * dt;
        if (Math.abs(n.sprite.x - n.originX) > d.patrolRange) {
          n.dir *= -1;
          n.sprite.setFlipX(n.dir < 0);
        }
      } else if (d.behavior === "follow" && this.player) {
        const dx = this.player.x - n.sprite.x;
        if (Math.abs(dx) > 30) {
          const dir = Math.sign(dx);
          n.dir = dir;
          n.sprite.x += dir * d.speed * dt;
          n.sprite.setFlipX(dir < 0);
        }
      } else if (d.behavior === "wander") {
        if (Math.random() < 0.01) n.dir *= -1;
        n.sprite.x += n.dir * d.speed * 0.5 * dt;
        n.sprite.setFlipX(n.dir < 0);
        n.sprite.x = Phaser.Math.Clamp(n.sprite.x, 20, this.scale.width - 20);
      }
      this.applyNpcFrameEdit(n);
    });
  }

  private playMapped(slot: keyof ProjectConfig["animMapping"]): boolean {
    if (this.timelineFrame !== null || this.isPaused) return false;
    const id = this.config.animMapping[slot];
    if (!id || !this.player) return false;
    const key = `anim-${id}`;
    if (!this.anims.exists(key)) return false;
    if (this.currentAnimName !== key || !this.player.anims.isPlaying) {
      this.lastDispatchedFrame = "";
      this.player.play(key, true);
      this.currentAnimName = key;
    }
    return true;
  }

  // ---- API externa (timeline / preview) ----
  playAnimation(id: string) {
    if (!this.player) return;
    const key = `anim-${id}`;
    if (this.anims.exists(key)) {
      this.timelineFrame = null;
      this.isPaused = false;
      this.lastDispatchedFrame = "";
      this.player.play(key, true);
      this.currentAnimName = key;
      this.overrideAnim = key;
    }
  }

  pauseAnimation() {
    this.isPaused = true;
    this.player?.anims.pause();
  }

  resumeAnimation() {
    this.isPaused = false;
    this.timelineFrame = null;
    this.player?.anims.resume();
  }

  // define frame manual (scrubbing / step)
  setFrame(frameIndex: number) {
    if (!this.player || !this.currentTexKey || !this.textures.exists(this.currentTexKey)) return;
    const maxFrame = Math.max(0, this.currentFrameCount - 1);
    const safeFrame = Phaser.Math.Clamp(Math.floor(frameIndex), 0, maxFrame);
    this.isPaused = true;
    this.timelineFrame = safeFrame;
    this.lastDispatchedFrame = "";
    this.player.anims.pause();
    this.player.setFrame(this.frameName(safeFrame));
    this.applyFrameEdit();
  }

  clearFrameLock() {
    this.timelineFrame = null;
    this.isPaused = false;
  }

  private spawnTrail() {
    if (!this.player || !this.config.fx.trailEnabled) return;
    if (this.trailGroup.length >= this.config.fx.trailCount) return;
    const ghost = this.add.image(
      this.player.x,
      this.player.y,
      this.currentTexKey,
      this.player.frame.name
    );
    ghost.setScale(this.player.scaleX, this.player.scaleY);
    ghost.setFlipX(this.player.flipX);
    ghost.setAngle(this.player.angle);
    ghost.setOrigin(this.player.originX, this.player.originY);
    ghost.setAlpha(this.config.fx.trailAlpha);
    ghost.setTint(
      Phaser.Display.Color.HexStringToColor(this.config.fx.trailColor).color
    );
    ghost.setDepth(6);
    this.trailGroup.push(ghost);
    this.tweens.add({
      targets: ghost,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        ghost.destroy();
        this.trailGroup = this.trailGroup.filter((g) => g !== ghost);
      },
    });
  }

  private doSquash(sx: number, sy: number) {
    if (!this.player || !this.config.fx.squashStretch) return;
    const c = this.config.character;
    const edit = this.config.frameEdits[String(this.currentFrameIndex())];
    const baseX = c.scale * (c.scaleX / 100) * (edit?.scaleX ?? 1);
    const baseY = c.scale * (c.scaleY / 100) * (edit?.scaleY ?? 1);
    this.squashTween?.stop();
    this.player.setScale(baseX * sx, baseY * sy);
    this.squashTween = this.tweens.add({
      targets: this.player,
      scaleX: baseX,
      scaleY: baseY,
      duration: 200,
      ease: c.animBlendEase,
    });
  }

  triggerAction() {
    if (!this.player) return;
    // Bloqueia a máquina de estados até a animação de ação terminar. Antes,
    // overrideAnim era zerado pelo update imediatamente após este método e o
    // ataque era substituído por idle/walk no mesmo frame.
    this.overrideAnim = this.playMapped("action")
      ? this.currentAnimName
      : null;
    if (this.config.sound.actionEnabled)
      audio.playAction(this.config.sound.actionFreq, this.config.sound.waveform);
    if (this.config.fx.shakeOnAction)
      this.cameras.main.shake(150, this.config.fx.shakeIntensity);
    if (this.config.fx.flashOnAction)
      this.cameras.main.flash(120, 255, 255, 255);
    if (this.particleEmitter)
      this.particleEmitter.explode(
        this.config.fx.particleCount * 2,
        this.player.x,
        this.player.y
      );
    this.doSquash(1.25, 0.8);
  }

  private dispatchAnimationEvents() {
    if (!this.player || this.timelineFrame !== null) return;
    const animationId = this.currentAnimName.replace("anim-", "");
    const animation = this.config.animations.find((item) => item.id === animationId);
    if (!animation?.events?.length) {
      this.lastDispatchedFrame = "";
      return;
    }
    const frame = this.currentFrameIndex();
    const marker = `${this.currentAnimName}:${frame}:${this.player.frame.name}`;
    if (marker === this.lastDispatchedFrame) return;
    this.lastDispatchedFrame = marker;
    animation.events
      .filter((event) => event.frame === frame)
      .forEach((event) => {
        this.callbacks.onAnimationEvent?.({
          animationId: animation.id,
          animationName: animation.name,
          frame,
          event,
        });
      });
  }

  private drawHitboxes() {
    const g = this.hitboxGraphics;
    if (!g) return;
    g.clear();
    if (!this.config.stage.showHitboxes || !this.player) return;
    const p = this.player;
    const w = p.displayWidth;
    const h = p.displayHeight;
    const left = p.x - w * p.originX;
    const top = p.y - h * p.originY;
    const frame = this.currentFrameIndex();
    this.config.hitboxes.forEach((hb) => {
      if (!hb.enabled || (hb.frame !== null && hb.frame !== frame)) return;
      const col = Phaser.Display.Color.HexStringToColor(hb.color).color;
      g.lineStyle(2, col, 0.9);
      g.fillStyle(col, 0.15);
      const rx = p.flipX
        ? left + (1 - hb.x - hb.w) * w
        : left + hb.x * w;
      const ry = top + hb.y * h;
      const rw = hb.w * w;
      const rh = hb.h * h;
      g.fillRect(rx, ry, rw, rh);
      g.strokeRect(rx, ry, rw, rh);
    });
  }

  private getGamepad(): Gamepad | null {
    if (typeof navigator === "undefined" || !navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    for (const p of pads) if (p) return p;
    return null;
  }

  resetPlayer() {
    if (!this.player || !this.physicsBody) return;
    const c = this.config.character;
    const x = this.scale.width / 2 + c.offsetX;
    const y =
      (c.movementMode === "platformer"
        ? this.scale.height -
          this.getFloorHeight() -
          (this.config.meta ? (this.config.meta.frameHeight * c.scale) / 2 : 0)
        : this.scale.height / 2) + c.offsetY;
    this.player.setPosition(x, y);
    this.physicsBody.setVelocity(0, 0);
    this.velX = 0;
    this.facingLeft = false;
    this.lastGroundedAt = 0;
    this.hasGroundedOnce = false;
    this.wasGroundedLastFrame = false;
    this.jumpQueuedUntil = 0;
    this.player.setFlipX(false);
    this.overrideAnim = null;
    this.jumpsUsed = 0;
    this.clearFrameLock();
  }

  update(time: number, delta: number) {
    this.stateTimer += delta;
    this.drawHitboxes();
    this.updateNpcs(delta);

    if (!this.ready || !this.player || !this.physicsBody) {
      if (this.stateTimer > 100) {
        this.stateTimer = 0;
        this.emitState();
      }
      return;
    }

    // scrubbing / pausado: não processa física de animação
    if (this.timelineFrame !== null) {
      if (this.stateTimer > 80) {
        this.stateTimer = 0;
        this.emitState();
      }
      return;
    }

    const c = this.config.character;
    const body = this.physicsBody;
    const gp = this.getGamepad();

    let left = false,
      right = false,
      up = false,
      down = false,
      jump = false,
      action = false,
      run = false;

    if (this.cursors && this.keys) {
      left = this.cursors.left.isDown || this.keys.A.isDown;
      right = this.cursors.right.isDown || this.keys.D.isDown;
      up = this.cursors.up.isDown || this.keys.W.isDown;
      down = this.cursors.down.isDown || this.keys.S.isDown;
      run = this.keys.SHIFT.isDown;
      jump =
        Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
        Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
        Phaser.Input.Keyboard.JustDown(this.keys.K);
      action = Phaser.Input.Keyboard.JustDown(this.keys.J);
    }

    if (gp) {
      const ax = gp.axes[0] ?? 0;
      const ay = gp.axes[1] ?? 0;
      if (ax < -0.3 || gp.buttons[14]?.pressed) left = true;
      if (ax > 0.3 || gp.buttons[15]?.pressed) right = true;
      if (ay < -0.3 || gp.buttons[12]?.pressed) up = true;
      if (ay > 0.3 || gp.buttons[13]?.pressed) down = true;
      if (gp.buttons[5]?.pressed || gp.buttons[7]?.pressed) run = true;
      if (gp.buttons[0]?.pressed && !this.padJumpPrev) jump = true;
      this.padJumpPrev = gp.buttons[0]?.pressed ?? false;
      if (gp.buttons[2]?.pressed && !this.padActionPrev) action = true;
      this.padActionPrev = gp.buttons[2]?.pressed ?? false;
    }

    const speed = c.speed * (run ? c.runMultiplier : 1);
    let moving = false;
    const onGround =
      c.movementMode === "topdown" || body.blocked.down || body.touching.down;
    const landed =
      c.movementMode === "platformer" &&
      onGround &&
      this.hasGroundedOnce &&
      !this.wasGroundedLastFrame;

    if (c.movementMode === "platformer") {
      let target = 0;
      if (left) {
        target = -speed;
        moving = true;
        this.facingLeft = true;
      } else if (right) {
        target = speed;
        moving = true;
        this.facingLeft = false;
      }
      const control = onGround ? 1 : c.airControl;
      const lerp = Phaser.Math.Clamp(c.accel * control * 2, 0.02, 1);
      this.velX = Phaser.Math.Linear(this.velX, target, lerp);
      if (Math.abs(this.velX) < 2 && target === 0) this.velX = 0;
      body.setVelocityX(this.velX);

      if (onGround) {
        this.jumpsUsed = 0;
        this.lastGroundedAt = time;
        this.hasGroundedOnce = true;
      }
      if (jump) this.jumpQueuedUntil = time + c.jumpBuffer;
      const inCoyoteWindow =
        this.hasGroundedOnce && time - this.lastGroundedAt <= c.coyoteTime;
      const jumpPending = jump || this.jumpQueuedUntil > time;
      const groundedJumpAvailable =
        (onGround || inCoyoteWindow) && this.jumpsUsed === 0;
      const airJumpAvailable = c.doubleJump && !onGround && this.jumpsUsed < 2;
      if (jumpPending && (groundedJumpAvailable || airJumpAvailable)) {
        body.setVelocityY(-c.jumpPower);
        this.jumpsUsed++;
        this.jumpQueuedUntil = 0;
        this.playMapped("jump");
        this.overrideAnim = null;
        if (this.config.sound.jumpEnabled)
          audio.playTone(
            this.config.sound.jumpFreq,
            0.15,
            this.config.sound.waveform,
            0.25
          );
        this.doSquash(0.8, 1.25);
      }
      if (body.velocity.y > c.maxFallSpeed) body.setVelocityY(c.maxFallSpeed);
    } else {
      let inputX = Number(right) - Number(left);
      let inputY = Number(down) - Number(up);
      moving = inputX !== 0 || inputY !== 0;
      if (moving) {
        const length = Math.hypot(inputX, inputY);
        inputX /= length;
        inputY /= length;
        if (inputX < 0) this.facingLeft = true;
        if (inputX > 0) this.facingLeft = false;
      }
      const targetX = inputX * speed;
      const targetY = inputY * speed;
      const lerp = Phaser.Math.Clamp(c.accel * 2, 0.02, 1);
      body.setVelocity(
        Phaser.Math.Linear(body.velocity.x, targetX, lerp),
        Phaser.Math.Linear(body.velocity.y, targetY, lerp)
      );
    }

    if (landed) {
      if (this.config.sound.landEnabled) {
        audio.playTone(
          this.config.sound.landFreq,
          0.1,
          this.config.sound.waveform,
          0.2
        );
      }
      this.doSquash(1.2, 0.8);
    }

    if (action) {
      this.triggerAction();
    }

    this.applyFrameEdit();
    this.dispatchAnimationEvents();

    const inAir = c.movementMode === "platformer" && !onGround;
    const falling = inAir && body.velocity.y > 30;

    if (!this.overrideAnim) {
      if (falling && this.config.animMapping.fall) {
        this.playMapped("fall");
      } else if (inAir) {
        this.playMapped("jump");
      } else if (moving) {
        if (run && this.config.animMapping.run) this.playMapped("run");
        else this.playMapped("walk");
        const stepInterval = run ? 180 : 260;
        if (this.config.sound.stepEnabled && time - this.lastStep > stepInterval) {
          audio.playStep(
            this.config.sound.stepFreq,
            this.config.sound.waveform
          );
          this.lastStep = time;
        }
        if (this.particleEmitter && Math.random() > 0.6) {
          this.particleEmitter.emitParticleAt(
            this.player.x,
            this.player.y + (this.player.displayHeight * (1 - this.player.originY)) / 2,
            1
          );
        }
        this.spawnTrail();
      } else {
        this.playMapped("idle");
      }
    } else if (!this.player.anims.isPlaying) {
      this.overrideAnim = null;
    }

    this.wasGroundedLastFrame = onGround;
    if (this.stateTimer > 70) {
      this.stateTimer = 0;
      this.emitState();
    }
  }

  private emitState() {
    const p = this.player;
    const body = this.physicsBody;
    const animationId = this.currentAnimName.replace("anim-", "");
    const animation = this.config.animations.find((a) => a.id === animationId);
    this.callbacks.onState({
      x: p ? Math.round(p.x) : 0,
      y: p ? Math.round(p.y) : 0,
      vx: body ? Math.round(body.velocity.x) : 0,
      vy: body ? Math.round(body.velocity.y) : 0,
      // A UI deve exibir o nome legível, não o id interno gerado pelo editor.
      currentAnim: animation?.name ?? (this.currentAnimName === "-" ? "-" : animationId),
      onGround:
        this.config.character.movementMode === "topdown"
          ? true
          : body
            ? body.blocked.down || body.touching.down
            : false,
      fps: Math.round(this.game.loop.actualFps),
      gamepadConnected: !!this.getGamepad(),
      activeFrame: p ? this.currentFrameIndex() : 0,
      jumps: this.jumpsUsed,
    });
  }
}
