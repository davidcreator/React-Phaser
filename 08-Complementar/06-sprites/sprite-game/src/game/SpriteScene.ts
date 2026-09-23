import Phaser from "phaser";
import type {
  ProjectConfig,
  SpriteSheetMeta,
  AnimationConfig,
  NpcInstance,
} from "../types";
import * as audio from "../audio";

export interface SceneCallbacks {
  onState: (s: LiveGameState) => void;
  onError?: (msg: string) => void;
  onReady?: () => void;
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
  private timelineFrame: number | null = null; // scrubbing manual
  private isPaused = false;
  private squashTween?: Phaser.Tweens.Tween;
  private sceneReady = false;
  private pendingConfig: ProjectConfig | null = null;
  private texSeq = 0; // sequência para gerar keys únicos por spritesheet
  private currentTexKey = "";

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
      if (this.physicsBody) {
        this.physics.world.setBounds(
          0,
          0,
          this.scale.width,
          this.scale.height -
            (this.config.stage.showFloor ? this.config.stage.floorHeight : 0)
        );
      }
    });
  }

  private buildStage() {
    this.bgRect = this.add
      .rectangle(0, 0, 10, 10, 0x0f172a)
      .setOrigin(0, 0)
      .setDepth(-10);
    this.gridGraphics = this.add.graphics().setDepth(-8);
    this.floor = this.add
      .rectangle(0, 0, 10, 10, 0x1e293b)
      .setOrigin(0, 0)
      .setDepth(-5);
    this.hitboxGraphics = this.add.graphics().setDepth(20);
    this.drawStageDecor();
  }

  private drawStageDecor() {
    const w = this.scale.width;
    const h = this.scale.height;
    const { stage } = this.config;

    if (this.bgRect) {
      this.bgRect.setSize(w, h);
      this.bgRect.setFillStyle(
        Phaser.Display.Color.HexStringToColor(stage.bgColor).color
      );
    }
    this.cameras.main.setBackgroundColor(stage.bgColor);

    if (this.floor) {
      if (stage.showFloor) {
        this.floor.setVisible(true);
        this.floor.setPosition(0, h - stage.floorHeight);
        this.floor.setSize(w, stage.floorHeight);
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
    const newKey = `spritesheet_${++this.texSeq}`;
    const img = new Image();
    img.onload = () => {
      try {
        // valida dimensões do frame contra a imagem realmente decodificada
        const fw = Math.max(1, Math.min(meta.frameWidth, img.naturalWidth));
        const fh = Math.max(1, Math.min(meta.frameHeight, img.naturalHeight));
        if (this.textures.exists(newKey)) this.textures.remove(newKey);
        this.textures.addSpriteSheet(newKey, img, {
          frameWidth: fw,
          frameHeight: fh,
          margin: meta.marginX || 0,
          spacing: meta.spacingX || 0,
        });
        const frameTotal = this.textures.get(newKey).frameTotal - 1; // -1 = __BASE
        if (frameTotal <= 0) {
          console.warn("[SpriteLab] spritesheet gerou 0 frames.");
          cb(false);
          return;
        }
        // remove a textura antiga só depois que a nova está pronta
        const old = this.currentTexKey;
        this.currentTexKey = newKey;
        if (old && old !== newKey && this.textures.exists(old)) {
          this.textures.remove(old);
        }
        cb(true);
      } catch (err) {
        console.error("[SpriteLab] erro ao fatiar spritesheet:", err);
        cb(false);
      }
    };
    img.onerror = () => {
      console.error("[SpriteLab] falha ao carregar a imagem do spritesheet.");
      cb(false);
    };
    img.src = meta.dataUrl;
  }

  rebuildFromConfig(config: ProjectConfig) {
    this.config = config;
    if (!this.sceneReady) {
      // create() ainda não rodou — guarda para aplicar depois
      this.pendingConfig = config;
      return;
    }
    this.drawStageDecor();
    audio.setMasterVolume(config.sound.masterVolume);

    if (!config.meta) {
      this.ready = false;
      if (this.player) {
        this.player.destroy();
        this.player = undefined;
      }
      this.clearNpcs();
      return;
    }

    this.ready = false;
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
    audio.setMasterVolume(config.sound.masterVolume);
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
          this.scale.height - (config.stage.showFloor ? config.stage.floorHeight : 0)
        );
        if (prevMode !== config.character.movementMode) {
          this.physicsBody.setVelocity(0, 0);
        }
      }
    }
    this.cameras.main.setZoom(config.stage.zoom);
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
  }

  private buildAnimations(anims: AnimationConfig[]) {
    const tex = this.currentTexKey;
    if (!tex || !this.textures.exists(tex)) return;
    // total real de frames disponíveis (frameTotal inclui o __BASE)
    const maxFrame = Math.max(0, this.textures.get(tex).frameTotal - 2);

    anims.forEach((a) => {
      const key = `anim-${a.id}`;
      if (this.anims.exists(key)) this.anims.remove(key);
      try {
        let frames: Phaser.Types.Animations.AnimationFrame[];
        if (a.frameOrder && a.frameOrder.length) {
          frames = a.frameOrder
            .map((f) => Phaser.Math.Clamp(f, 0, maxFrame))
            .map((f) => ({ key: tex, frame: f }));
        } else {
          // clampa o range para nunca pedir frames inexistentes
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
          frames = this.anims.generateFrameNumbers(tex, { start, end });
        }
        if (!frames.length) return;
        this.anims.create({
          key,
          frames,
          frameRate: Math.max(1, a.frameRate),
          repeat: a.repeat,
          yoyo: a.yoyo,
        });
      } catch (err) {
        console.warn(`[SpriteLab] falha ao criar animação "${a.name}":`, err);
      }
    });
  }

  private spawnPlayer() {
    const c = this.config.character;
    const startX = this.scale.width / 2;
    const startY =
      c.movementMode === "platformer"
        ? this.scale.height -
          (this.config.stage.showFloor ? this.config.stage.floorHeight : 0) -
          (this.config.meta!.frameHeight * c.scale) / 2
        : this.scale.height / 2;

    if (this.player) this.player.destroy();
    this.player = this.add
      .sprite(startX, startY, this.currentTexKey, 0)
      .setDepth(10);
    this.applyPlayerTransform();
    this.physics.add.existing(this.player);
    this.physicsBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.physicsBody.setCollideWorldBounds(true);
    this.physics.world.setBounds(
      0,
      0,
      this.scale.width,
      this.scale.height -
        (this.config.stage.showFloor ? this.config.stage.floorHeight : 0)
    );
    const plat = c.movementMode === "platformer";
    this.physicsBody.setAllowGravity(plat);
    if (plat) this.physicsBody.setGravityY(c.gravity);
    this.cameras.main.setZoom(this.config.stage.zoom);
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
      blendMode: "ADD",
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
          .sprite(data.x, data.y, this.currentTexKey, 0)
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
      if (wantKey && cur !== wantKey) s.play(wantKey);
      else if (!wantKey) s.stop();
    });
  }

  private rebuildNpcs() {
    if (!this.currentTexKey || !this.textures.exists(this.currentTexKey)) return;
    this.clearNpcs();
    this.config.npcs.forEach((data) => {
      const sprite = this.add
        .sprite(data.x, data.y, this.currentTexKey, 0)
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
          n.sprite.x += dir * d.speed * dt;
          n.sprite.setFlipX(dir < 0);
        }
      } else if (d.behavior === "wander") {
        if (Math.random() < 0.01) n.dir *= -1;
        n.sprite.x += n.dir * d.speed * 0.5 * dt;
        n.sprite.setFlipX(n.dir < 0);
        n.sprite.x = Phaser.Math.Clamp(n.sprite.x, 20, this.scale.width - 20);
      }
    });
  }

  private playMapped(slot: keyof ProjectConfig["animMapping"]) {
    if (this.timelineFrame !== null || this.isPaused) return;
    const id = this.config.animMapping[slot];
    if (!id || !this.player) return;
    const key = `anim-${id}`;
    if (!this.anims.exists(key)) return;
    if (this.currentAnimName !== key) {
      this.player.play(key, true);
      this.currentAnimName = key;
    }
  }

  // ---- API externa (timeline / preview) ----
  playAnimation(id: string) {
    if (!this.player) return;
    const key = `anim-${id}`;
    if (this.anims.exists(key)) {
      this.timelineFrame = null;
      this.isPaused = false;
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
    if (!this.player) return;
    this.isPaused = true;
    this.timelineFrame = frameIndex;
    this.player.anims.pause();
    this.player.setFrame(frameIndex);
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
    const baseX = c.scale * (c.scaleX / 100);
    const baseY = c.scale * (c.scaleY / 100);
    this.squashTween?.stop();
    this.player.setScale(baseX * sx, baseY * sy);
    this.squashTween = this.tweens.add({
      targets: this.player,
      scaleX: baseX,
      scaleY: baseY,
      duration: 200,
      ease: "Back.easeOut",
    });
  }

  triggerAction() {
    if (!this.player) return;
    this.playMapped("action");
    if (this.config.sound.actionEnabled)
      audio.playAction(this.config.sound.actionFreq);
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
    this.config.hitboxes.forEach((hb) => {
      const col = Phaser.Display.Color.HexStringToColor(hb.color).color;
      g.lineStyle(2, col, 0.9);
      g.fillStyle(col, 0.15);
      const rx = left + hb.x * w;
      const ry = top + hb.y * h;
      const rw = hb.w * w;
      const rh = hb.h * h;
      g.fillRect(rx, ry, rw, rh);
      g.strokeRect(rx, ry, rw, rh);
    });
  }

  private getGamepad(): Gamepad | null {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) if (p) return p;
    return null;
  }

  resetPlayer() {
    if (!this.player || !this.physicsBody) return;
    const c = this.config.character;
    const y =
      c.movementMode === "platformer"
        ? this.scale.height / 2
        : this.scale.height / 2;
    this.player.setPosition(this.scale.width / 2, y);
    this.physicsBody.setVelocity(0, 0);
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

    const speed = c.speed * (run ? 1.7 : 1);
    let moving = false;
    const onGround = body.blocked.down || body.touching.down;

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

      if (onGround) this.jumpsUsed = 0;
      const maxJumps = c.doubleJump ? 2 : 1;
      if (jump && this.jumpsUsed < maxJumps) {
        body.setVelocityY(-c.jumpPower);
        this.jumpsUsed++;
        this.playMapped("jump");
        this.overrideAnim = null;
        if (this.config.sound.actionEnabled)
          audio.playTone(this.config.sound.jumpFreq, 0.15, this.config.sound.waveform, 0.25);
        this.doSquash(0.8, 1.25);
      }
    } else {
      body.setVelocity(0, 0);
      if (left) {
        body.setVelocityX(-speed);
        moving = true;
        this.facingLeft = true;
      }
      if (right) {
        body.setVelocityX(speed);
        moving = true;
        this.facingLeft = false;
      }
      if (up) {
        body.setVelocityY(-speed);
        moving = true;
      }
      if (down) {
        body.setVelocityY(speed);
        moving = true;
      }
      if (moving && left === right && up === down) {
        // normalize diagonal
        body.velocity.normalize().scale(speed);
      }
    }

    if (action) {
      this.triggerAction();
      this.overrideAnim = null;
    }

    if (c.flipOnDirection && !c.rotation) this.player.setFlipX(this.facingLeft);

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
          audio.playStep(this.config.sound.stepFreq);
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

    if (this.stateTimer > 70) {
      this.stateTimer = 0;
      this.emitState();
    }
  }

  private emitState() {
    const p = this.player;
    const body = this.physicsBody;
    this.callbacks.onState({
      x: p ? Math.round(p.x) : 0,
      y: p ? Math.round(p.y) : 0,
      vx: body ? Math.round(body.velocity.x) : 0,
      vy: body ? Math.round(body.velocity.y) : 0,
      currentAnim: this.currentAnimName.replace("anim-", ""),
      onGround: body ? body.blocked.down || body.touching.down : false,
      fps: Math.round(this.game.loop.actualFps),
      gamepadConnected: !!this.getGamepad(),
      activeFrame: p ? parseInt(p.frame.name) || 0 : 0,
      jumps: this.jumpsUsed,
    });
  }
}
