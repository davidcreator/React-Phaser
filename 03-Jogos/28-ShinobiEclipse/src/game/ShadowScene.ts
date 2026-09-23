import Phaser from "phaser";
import type { SoundEffect } from "./audio";

export type Difficulty = "easy" | "normal" | "hard";
export type ControlMode = "keyboard" | "gamepad";

export interface GameSettings {
  difficulty: Difficulty;
  control: ControlMode;
}

export interface HudData {
  health: number;
  lives: number;
  kills: number;
  enemies: number;
  level: number;
  shurikenReady: boolean;
}

export interface GameStartState {
  level: number;
  lives: number;
  kills: number;
  rewardedAt: number;
}

export type GameSignal =
  | { type: "ready" }
  | { type: "level"; level: number }
  | { type: "levelClear"; level: number }
  | { type: "nextLevel"; state: GameStartState }
  | { type: "gameOver" }
  | { type: "victory"; lives: number; kills: number }
  | { type: "pause"; paused: boolean };

interface SceneCallbacks {
  onHud: (data: HudData) => void;
  onSignal: (signal: GameSignal) => void;
  onSound: (sound: SoundEffect) => void;
}

type NinjaEnemy = Phaser.Physics.Arcade.Sprite & {
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  rank: number;
  homeX: number;
  attackAt: number;
  rangedAt: number;
  attackingUntil: number;
  healthBar: Phaser.GameObjects.Graphics;
  dead: boolean;
};

interface EnemyArchetype {
  key: string;
  asset: string;
  hp: number;
  damage: number;
  speed: number;
  scale: number;
  bodyWidth: number;
  bodyHeight: number;
  bodyOffsetX: number;
  bodyOffsetY: number;
  meleeRange: number;
  ranged: boolean;
  barColor: number;
}

interface KeyBindings {
  A: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
  W: Phaser.Input.Keyboard.Key;
  LEFT: Phaser.Input.Keyboard.Key;
  RIGHT: Phaser.Input.Keyboard.Key;
  UP: Phaser.Input.Keyboard.Key;
  SPACE: Phaser.Input.Keyboard.Key;
  J: Phaser.Input.Keyboard.Key;
  K: Phaser.Input.Keyboard.Key;
  X: Phaser.Input.Keyboard.Key;
  C: Phaser.Input.Keyboard.Key;
  ESC: Phaser.Input.Keyboard.Key;
}

interface GameCommandDetail {
  action: "pause" | "resume" | "left" | "right" | "jump" | "sword" | "shuriken";
  pressed?: boolean;
}

export const gameCommands = new EventTarget();

const DIFFICULTY = {
  easy: { hp: 0.78, damage: 0.7, speed: 0.84, cooldown: 1.2 },
  normal: { hp: 1, damage: 1, speed: 1, cooldown: 1 },
  hard: { hp: 1.28, damage: 1.32, speed: 1.18, cooldown: 0.78 },
};

const ENEMY_TYPES: readonly EnemyArchetype[] = [
  { key: "crimson", asset: "crimson-kunai-ninja.png", hp: 52, damage: 11, speed: 136, scale: 0.29, bodyWidth: 72, bodyHeight: 170, bodyOffsetX: 89, bodyOffsetY: 49, meleeRange: 60, ranged: false, barColor: 0xd74b43 },
  { key: "cobalt", asset: "cobalt-chain-ninja.png", hp: 82, damage: 15, speed: 106, scale: 0.32, bodyWidth: 84, bodyHeight: 174, bodyOffsetX: 84, bodyOffsetY: 48, meleeRange: 92, ranged: true, barColor: 0x4f86c6 },
  { key: "violet", asset: "violet-naginata-ninja.png", hp: 118, damage: 19, speed: 88, scale: 0.36, bodyWidth: 66, bodyHeight: 194, bodyOffsetX: 94, bodyOffsetY: 34, meleeRange: 116, ranged: false, barColor: 0xa36bc4 },
  { key: "ochre", asset: "ochre-kanabo-ninja.png", hp: 172, damage: 25, speed: 64, scale: 0.39, bodyWidth: 120, bodyHeight: 164, bodyOffsetX: 68, bodyOffsetY: 59, meleeRange: 82, ranged: false, barColor: 0xb29348 },
  { key: "onyx", asset: "onyx-elite-ninja.png", hp: 235, damage: 29, speed: 84, scale: 0.38, bodyWidth: 92, bodyHeight: 194, bodyOffsetX: 82, bodyOffsetY: 34, meleeRange: 108, ranged: true, barColor: 0xd1b45f },
] as const;

export class ShadowScene extends Phaser.Scene {
  private readonly settings: GameSettings;
  private readonly callbacks: SceneCallbacks;
  private readonly startState: GameStartState;
  private level = 1;
  private lives = 4;
  private kills = 0;
  private rewardedAt = 0;
  private health = 100;
  private worldWidth = 2400;
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private enemyProjectiles!: Phaser.Physics.Arcade.Group;
  private hazards!: Phaser.Physics.Arcade.StaticGroup;
  private keys!: KeyBindings;
  private facing = 1;
  private swordCombo = 0;
  private swordReadyAt = 0;
  private shurikenReadyAt = 0;
  private invulnerableUntil = 0;
  private lastGroundedAt = 0;
  private jumpBufferedUntil = 0;
  private attacking = false;
  private transitioning = false;
  private ended = false;
  private paused = false;
  private lastHud = "";
  private previousPad = { jump: false, sword: false, shuriken: false, pause: false };
  private virtualInput = { left: false, right: false, jump: false, sword: false, shuriken: false };
  private levelTransitionTimer: number | null = null;
  private commandHandler: (event: Event) => void;

  constructor(settings: GameSettings, callbacks: SceneCallbacks, startState?: Partial<GameStartState>) {
    super("shadow-run");
    this.settings = settings;
    this.callbacks = callbacks;
    this.startState = {
      level: startState?.level ?? 1,
      lives: startState?.lives ?? 4,
      kills: startState?.kills ?? 0,
      rewardedAt: startState?.rewardedAt ?? 0,
    };
    this.commandHandler = (event: Event) => {
      const { action, pressed = true } = (event as CustomEvent<GameCommandDetail>).detail;
      if (action === "pause" || action === "resume") {
        this.setPaused(action === "pause");
        return;
      }
      if (action === "left" || action === "right") this.virtualInput[action] = pressed;
      if (pressed && (action === "jump" || action === "sword" || action === "shuriken")) this.virtualInput[action] = true;
    };
  }

  init(data: Partial<GameStartState>) {
    this.level = data.level ?? this.startState.level;
    this.lives = data.lives ?? this.startState.lives;
    this.kills = data.kills ?? this.startState.kills;
    this.rewardedAt = data.rewardedAt ?? this.startState.rewardedAt;
    this.health = 100;
    this.worldWidth = this.level === 1 ? 2400 : 2880;
    this.transitioning = false;
    this.ended = false;
    this.paused = false;
    this.lastHud = "";
    this.attacking = false;
    this.swordCombo = 0;
    this.lastGroundedAt = 0;
    this.jumpBufferedUntil = 0;
    this.levelTransitionTimer = null;
    this.virtualInput = { left: false, right: false, jump: false, sword: false, shuriken: false };
  }

  create() {
    this.createTextures();
    this.createAnimations();
    this.physics.world.setBounds(0, 0, this.worldWidth, 860);
    this.physics.world.TILE_BIAS = 40;
    this.cameras.main.setBounds(0, 0, this.worldWidth, 720);
    this.cameras.main.setBackgroundColor(this.level === 1 ? "#070a13" : "#14080c");

    this.drawBackdrop();
    this.platforms = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();
    this.buildLevel();
    this.createPlayer();
    this.spawnEnemies();
    this.configurePhysics();
    this.configureInput();

    this.cameras.main.startFollow(this.player, true, 0.085, 0.085, -180, 70);
    this.cameras.main.fadeIn(700, 6, 8, 15);
    gameCommands.addEventListener("game-command", this.commandHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameCommands.removeEventListener("game-command", this.commandHandler);
      if (this.levelTransitionTimer !== null) window.clearTimeout(this.levelTransitionTimer);
      this.levelTransitionTimer = null;
      this.enemies?.getChildren().forEach((child) => {
        (child as NinjaEnemy).healthBar?.destroy();
      });
    });
    this.callbacks.onSignal({ type: "level", level: this.level });
    this.callbacks.onSignal({ type: "ready" });
    this.emitHud(true);
    // The procedural cast is ready immediately; detailed art upgrades it after play begins.
    this.time.delayedCall(700, () => this.loadDetailedSprites());
  }

  update(time: number) {
    if (this.ended || this.paused) return;
    this.handleInput(time);
    this.updateEnemies(time);
    this.updateProjectiles();
    if (this.player.y > 770 && time > this.invulnerableUntil) this.hitHazard(35);
    this.emitHud();
  }

  private createPlayer() {
    const usesSheet = this.textures.exists("player-movement-sheet");
    this.player = this.physics.add.sprite(120, 550, usesSheet ? "player-movement-sheet" : "player-ninja", usesSheet ? "0" : undefined);
    this.player.setCollideWorldBounds(true).setDepth(20).setMaxVelocity(350, 1050);
    if (usesSheet) this.player.setScale(0.34).play("player-idle");
    this.player.setDragX(1000);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (usesSheet) body.setSize(82, 174).setOffset(87, 50);
    else body.setSize(29, 55).setOffset(10, 7);
  }

  private configurePhysics() {
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.overlap(this.player, this.hazards, () => this.hitHazard(30));
    this.physics.add.collider(this.projectiles, this.platforms, (projectile) => projectile.destroy());
    this.physics.add.collider(this.enemyProjectiles, this.platforms, (projectile) => projectile.destroy());
    this.physics.add.overlap(this.projectiles, this.enemies, (projectile, enemy) => {
      projectile.destroy();
      this.damageEnemy(enemy as NinjaEnemy, 34, (projectile as Phaser.Physics.Arcade.Sprite).x);
    });
    this.physics.add.overlap(this.enemyProjectiles, this.player, (projectile) => {
      const shot = projectile as Phaser.Physics.Arcade.Sprite;
      const damage = Number(shot.getData("damage")) || 12;
      shot.destroy();
      this.damagePlayer(damage, shot.x);
    });
  }

  private configureInput() {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.A, Phaser.Input.Keyboard.KeyCodes.D, Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.LEFT, Phaser.Input.Keyboard.KeyCodes.RIGHT, Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.SPACE, Phaser.Input.Keyboard.KeyCodes.J, Phaser.Input.Keyboard.KeyCodes.K,
      Phaser.Input.Keyboard.KeyCodes.X, Phaser.Input.Keyboard.KeyCodes.C,
    ]);
    this.keys = keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
      RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      UP: Phaser.Input.Keyboard.KeyCodes.UP,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
      J: Phaser.Input.Keyboard.KeyCodes.J,
      K: Phaser.Input.Keyboard.KeyCodes.K,
      X: Phaser.Input.Keyboard.KeyCodes.X,
      C: Phaser.Input.Keyboard.KeyCodes.C,
      ESC: Phaser.Input.Keyboard.KeyCodes.ESC,
    }) as KeyBindings;
  }

  private handleInput(time: number) {
    if (!this.keys || this.transitioning) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;
    if (grounded) this.lastGroundedAt = time;
    let move = 0;
    let jumpPressed = false;
    let swordPressed = false;
    let shurikenPressed = false;
    let pausePressed = Phaser.Input.Keyboard.JustDown(this.keys.ESC);

    // Keyboard stays active as a fallback even when gamepad is selected.
    if (this.keys.A.isDown || this.keys.LEFT.isDown || this.virtualInput.left) move -= 1;
    if (this.keys.D.isDown || this.keys.RIGHT.isDown || this.virtualInput.right) move += 1;
    jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.keys.UP) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || this.virtualInput.jump;
    swordPressed = Phaser.Input.Keyboard.JustDown(this.keys.J) || Phaser.Input.Keyboard.JustDown(this.keys.X) || this.virtualInput.sword;
    shurikenPressed = Phaser.Input.Keyboard.JustDown(this.keys.K) || Phaser.Input.Keyboard.JustDown(this.keys.C) || this.virtualInput.shuriken;
    this.virtualInput.jump = false;
    this.virtualInput.sword = false;
    this.virtualInput.shuriken = false;

    const pad = this.input.gamepad?.getPad(0);
    const jumpDown = Boolean(pad?.A);
    const swordDown = Boolean(pad?.X);
    const shurikenDown = Boolean(pad?.B);
    const pauseDown = Boolean(pad?.buttons[9]?.pressed);
    if (pad) {
      const axis = Math.abs(pad.leftStick.x) > 0.2 ? pad.leftStick.x : 0;
      if (axis !== 0) move = axis;
      else if (pad.left) move = -1;
      else if (pad.right) move = 1;
    }
    jumpPressed = jumpPressed || (jumpDown && !this.previousPad.jump);
    swordPressed = swordPressed || (swordDown && !this.previousPad.sword);
    shurikenPressed = shurikenPressed || (shurikenDown && !this.previousPad.shuriken);
    pausePressed = pausePressed || (pauseDown && !this.previousPad.pause);
    this.previousPad = { jump: jumpDown, sword: swordDown, shuriken: shurikenDown, pause: pauseDown };

    if (pausePressed) {
      this.setPaused(true);
      return;
    }
    if (move !== 0) {
      this.player.setVelocityX(move * 270);
      this.facing = move > 0 ? 1 : -1;
      this.player.setFlipX(this.facing < 0);
      this.player.setAngle(Phaser.Math.Linear(this.player.angle, move * 2.5, 0.16));
    } else {
      this.player.setAngle(Phaser.Math.Linear(this.player.angle, 0, 0.2));
    }
    if (!this.attacking && this.textures.exists("player-movement-sheet")) {
      if (!grounded) {
        if (body.velocity.y < -90) this.player.setTexture("player-movement-sheet", "9");
        else if (body.velocity.y < 160) this.player.setTexture("player-movement-sheet", "10");
        else this.player.setTexture("player-movement-sheet", "11");
      }
      else if (Math.abs(move) > 0.1) this.player.play("player-run", true);
      else this.player.play("player-idle", true);
    }
    if (jumpPressed) this.jumpBufferedUntil = time + 140;
    const canJump = grounded || time - this.lastGroundedAt <= 120;
    if (time <= this.jumpBufferedUntil && canJump) {
      this.jumpBufferedUntil = 0;
      this.lastGroundedAt = -1000;
      this.player.setVelocityY(-680);
      if (this.anims.exists("player-jump")) this.player.play("player-jump", true);
      this.callbacks.onSound("jump");
      this.createDust(this.player.x, this.player.y + 28, 0x98a8b5);
    }
    if (swordPressed && time >= this.swordReadyAt) this.swordAttack(time);
    if (shurikenPressed && time >= this.shurikenReadyAt) this.throwShuriken(time);
  }

  private swordAttack(time: number) {
    this.swordReadyAt = time + 380;
    this.attacking = true;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (this.anims.exists("player-sword")) {
      const grounded = body.blocked.down || body.touching.down;
      const groundCombos = ["player-sword", "player-sword-upper", "player-sword-finisher"];
      const animation = grounded ? groundCombos[this.swordCombo % groundCombos.length] : "player-sword-air";
      this.player.play(animation, true);
      this.swordCombo = grounded ? this.swordCombo + 1 : this.swordCombo;
    }
    this.callbacks.onSound("sword");
    const slash = this.add.graphics().setDepth(30);
    slash.lineStyle(5, 0xf5e9cc, 0.95);
    slash.beginPath();
    slash.arc(0, 0, 48, -1.18, 1.12, false);
    slash.strokePath();
    slash.setPosition(this.player.x + this.facing * 22, this.player.y - 3).setScale(this.facing, 1);
    this.tweens.add({ targets: slash, alpha: 0, scaleX: this.facing * 1.35, scaleY: 1.35, duration: 170, onComplete: () => slash.destroy() });
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as NinjaEnemy;
      if (enemy.dead) return;
      const dx = (enemy.x - this.player.x) * this.facing;
      if (dx > -12 && dx < 82 && Math.abs(enemy.y - this.player.y) < 62) this.damageEnemy(enemy, 48, this.player.x);
    });
    this.time.delayedCall(330, () => { this.attacking = false; });
  }

  private throwShuriken(time: number) {
    this.shurikenReadyAt = time + 720;
    this.attacking = true;
    if (this.anims.exists("player-throw")) this.player.play("player-throw", true);
    this.callbacks.onSound("shuriken");
    const shot = this.projectiles.create(this.player.x + this.facing * 32, this.player.y - 5, "shuriken") as Phaser.Physics.Arcade.Sprite;
    shot.setDepth(18).setVelocity(this.facing * 650, -18).setAngularVelocity(this.facing * 900);
    const body = shot.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false).setCircle(8, 4, 4);
    this.time.delayedCall(360, () => { this.attacking = false; });
  }

  private updateProjectiles() {
    const camera = this.cameras.main;
    [this.projectiles, this.enemyProjectiles].forEach((group) => {
      group.getChildren().forEach((child) => {
        const shot = child as Phaser.Physics.Arcade.Sprite;
        shot.rotation += 0.22;
        if (shot.x < camera.scrollX - 120 || shot.x > camera.scrollX + 1400 || shot.y > 760) shot.destroy();
      });
    });
  }

  private updateEnemies(time: number) {
    const difficulty = DIFFICULTY[this.settings.difficulty];
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as NinjaEnemy;
      if (enemy.dead || !enemy.active) return;
      const dx = this.player.x - enemy.x;
      const dy = Math.abs(this.player.y - enemy.y);
      const distance = Math.abs(dx);
      const direction = dx > 0 ? 1 : -1;
      const body = enemy.body as Phaser.Physics.Arcade.Body;

      if (distance < 520 && dy < 170) {
        enemy.setFlipX(direction < 0);
        const archetype = ENEMY_TYPES[enemy.rank];
        if (distance > archetype.meleeRange - 6) enemy.setVelocityX(direction * enemy.speed);
        else enemy.setVelocityX(0);
        if (distance < archetype.meleeRange && dy < 72 && time >= enemy.attackAt) {
          enemy.attackAt = time + (1120 + enemy.rank * 100) * difficulty.cooldown;
          enemy.attackingUntil = time + 520;
          if (this.anims.exists(`enemy-attack-${enemy.rank}`)) enemy.play(`enemy-attack-${enemy.rank}`, true);
          enemy.setTint(0xffd7cc);
          this.time.delayedCall(100, () => enemy.active && enemy.clearTint());
          this.damagePlayer(enemy.damage, enemy.x);
        }
        if (archetype.ranged && distance > 180 && distance < 470 && dy < 130 && time >= enemy.rangedAt) {
          enemy.rangedAt = time + (2600 - enemy.rank * 250) * difficulty.cooldown;
          enemy.attackingUntil = time + 520;
          if (this.anims.exists(`enemy-attack-${enemy.rank}`)) enemy.play(`enemy-attack-${enemy.rank}`, true);
          this.enemyThrow(enemy, direction);
        }
      } else {
        const patrolDirection = enemy.x > enemy.homeX + 105 ? -1 : enemy.x < enemy.homeX - 105 ? 1 : (enemy.flipX ? -1 : 1);
        enemy.setFlipX(patrolDirection < 0).setVelocityX(patrolDirection * enemy.speed * 0.45);
      }

      if (body.blocked.down && (body.blocked.left || body.blocked.right)) enemy.setVelocityY(-330);
      if (this.textures.exists(enemyTextureKey(enemy.rank)) && time >= enemy.attackingUntil) {
        enemy.play(`enemy-walk-${enemy.rank}`, true);
      }
      enemy.healthBar.setPosition(enemy.x, enemy.y - 49);
      this.drawEnemyBar(enemy);
      if (enemy.y > 780) this.damageEnemy(enemy, enemy.maxHp, enemy.x);
    });
  }

  private enemyThrow(enemy: NinjaEnemy, direction: number) {
    const shot = this.enemyProjectiles.create(enemy.x + direction * 26, enemy.y - 4, "enemy-shuriken") as Phaser.Physics.Arcade.Sprite;
    shot.setDepth(18).setVelocity(direction * (310 + enemy.rank * 32), -12).setAngularVelocity(direction * 700);
    shot.setData("damage", Math.round(enemy.damage * 0.72));
    (shot.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setCircle(8, 4, 4);
  }

  private damageEnemy(enemy: NinjaEnemy, amount: number, sourceX: number) {
    if (!enemy.active || enemy.dead) return;
    enemy.hp -= amount;
    enemy.setVelocityX(enemy.x > sourceX ? 185 : -185).setVelocityY(-80).setTint(0xffffff);
    this.callbacks.onSound("hit");
    enemy.attackingUntil = this.time.now + 180;
    if (this.anims.exists(`enemy-hit-${enemy.rank}`)) enemy.play(`enemy-hit-${enemy.rank}`, true);
    this.createSparks(enemy.x, enemy.y, enemy.rank === 4 ? 0xd8c7a0 : ENEMY_TYPES[enemy.rank].barColor);
    this.time.delayedCall(80, () => enemy.active && enemy.clearTint());
    if (enemy.hp <= 0) this.defeatEnemy(enemy);
  }

  private defeatEnemy(enemy: NinjaEnemy) {
    enemy.dead = true;
    enemy.disableBody(false, false);
    enemy.healthBar.destroy();
    this.kills += 1;
    this.callbacks.onSound("enemyDown");
    enemy.setVisible(true);
    if (this.anims.exists(`enemy-defeated-${enemy.rank}`)) enemy.play(`enemy-defeated-${enemy.rank}`, true);
    this.tweens.add({ targets: enemy, alpha: 0, delay: 420, duration: 300, onComplete: () => enemy.destroy() });

    if (this.kills > 0 && this.kills % 20 === 0 && this.rewardedAt < this.kills) {
      this.rewardedAt = this.kills;
      this.lives += 1;
      this.callbacks.onSound("life");
      this.showWorldMessage("VIDA EXTRA", "20 inimigos eliminados", 0xd8c06a);
    }
    this.emitHud(true);
    if (this.countLivingEnemies() === 0) this.completeLevel();
  }

  private damagePlayer(amount: number, sourceX: number) {
    if (this.ended || this.transitioning || this.time.now < this.invulnerableUntil) return;
    this.health = Math.max(0, this.health - Math.round(amount));
    this.invulnerableUntil = this.time.now + 900;
    this.player.setVelocity(sourceX < this.player.x ? 250 : -250, -240).setTint(0xff6961);
    if (this.anims.exists("player-hurt")) {
      this.attacking = true;
      this.player.play("player-hurt", true);
      this.time.delayedCall(460, () => { this.attacking = false; });
    }
    this.callbacks.onSound("hurt");
    this.cameras.main.shake(150, 0.008);
    this.time.delayedCall(130, () => this.player.active && this.player.clearTint());
    this.tweens.add({ targets: this.player, alpha: 0.35, yoyo: true, repeat: 4, duration: 80, onComplete: () => this.player.setAlpha(1) });

    if (this.health <= 0) {
      this.lives -= 1;
      if (this.lives <= 0) {
        this.ended = true;
        this.physics.pause();
        this.player.clearTint().setAngle(0);
        if (this.anims.exists("player-defeated")) this.player.play("player-defeated", true);
        else this.player.setTint(0x4a4a55).setAngle(90);
        this.callbacks.onSignal({ type: "gameOver" });
      } else {
        this.health = 100;
        this.player.setPosition(this.level === 1 ? 120 : 130, 520).setVelocity(0, 0);
        this.cameras.main.flash(320, 190, 34, 34);
        this.showWorldMessage("RETORNO DAS SOMBRAS", `${this.lives} vidas restantes`, 0xd34b43);
      }
    }
    this.emitHud(true);
  }

  private hitHazard(damage: number) {
    if (this.time.now < this.invulnerableUntil || this.ended || this.transitioning) return;
    const fallX = this.player.x;
    this.damagePlayer(damage, fallX);
    if (!this.ended) {
      this.player.setPosition(this.respawnX(fallX), 520).setVelocity(0, 0);
      this.cameras.main.flash(160, 120, 24, 24);
    }
  }

  private respawnX(fallX: number) {
    const checkpoints = this.level === 1 ? [120, 790, 1390, 2070] : [120, 680, 1280, 1950, 2670];
    return checkpoints.reduce((safeX, checkpoint) => checkpoint < fallX - 40 ? checkpoint : safeX, checkpoints[0]);
  }

  private completeLevel() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.player.setVelocityX(0);
    if (this.level === 1) {
      this.callbacks.onSignal({ type: "levelClear", level: 1 });
      this.showWorldMessage("AREA SEGURA", "A fortaleza interior aguarda", 0xd8c06a);
      this.player.setVelocity(0, 0);
      this.cameras.main.fadeOut(450, 5, 5, 10);
      const nextLevel: GameStartState = { level: 2, lives: this.lives, kills: this.kills, rewardedAt: this.rewardedAt };

      // React replaces the entire Phaser instance, avoiding browser-specific scene restart deadlocks.
      this.levelTransitionTimer = window.setTimeout(() => {
        this.levelTransitionTimer = null;
        this.callbacks.onSignal({ type: "nextLevel", state: nextLevel });
      }, 650);
    } else {
      this.ended = true;
      this.physics.pause();
      this.callbacks.onSound("victory");
      this.callbacks.onSignal({ type: "victory", lives: this.lives, kills: this.kills });
    }
  }

  private setPaused(paused: boolean) {
    if (this.ended || this.transitioning || this.paused === paused) return;
    this.paused = paused;
    if (paused) {
      this.physics.pause();
      this.tweens.pauseAll();
    } else {
      this.physics.resume();
      this.tweens.resumeAll();
    }
    this.callbacks.onSignal({ type: "pause", paused });
  }

  private emitHud(force = false) {
    const data: HudData = {
      health: this.health,
      lives: this.lives,
      kills: this.kills,
      enemies: this.countLivingEnemies(),
      level: this.level,
      shurikenReady: this.time.now >= this.shurikenReadyAt,
    };
    const signature = JSON.stringify(data);
    if (force || signature !== this.lastHud) {
      this.lastHud = signature;
      this.callbacks.onHud(data);
    }
  }

  private countLivingEnemies() {
    let count = 0;
    this.enemies?.getChildren().forEach((child) => {
      if (!(child as NinjaEnemy).dead) count += 1;
    });
    return count;
  }

  private spawnEnemies() {
    const spawns = this.level === 1
      ? [
          [480, 570, 0], [840, 360, 0], [1050, 570, 1], [1330, 440, 0],
          [1570, 570, 1], [1810, 350, 2], [2080, 570, 3], [2260, 570, 4],
        ]
      : [
          [430, 570, 0], [670, 410, 1], [880, 570, 0], [1090, 330, 2],
          [1280, 570, 1], [1500, 440, 3], [1690, 570, 0], [1900, 310, 2],
          [2110, 570, 3], [2350, 420, 1], [2590, 570, 4], [2760, 570, 4],
        ];
    spawns.forEach(([x, y, rank]) => this.createEnemy(x, y, rank));
  }

  private createEnemy(x: number, y: number, rank: number) {
    const spec = ENEMY_TYPES[rank];
    const difficulty = DIFFICULTY[this.settings.difficulty];
    const textureKey = enemyTextureKey(rank);
    const usesSheet = this.textures.exists(textureKey);
    const enemy = this.enemies.create(x, y, usesSheet ? textureKey : `enemy-${spec.key}`, usesSheet ? "0" : undefined) as NinjaEnemy;
    enemy.hp = Math.round(spec.hp * difficulty.hp);
    enemy.maxHp = enemy.hp;
    enemy.damage = Math.round(spec.damage * difficulty.damage);
    enemy.speed = spec.speed * difficulty.speed;
    enemy.rank = rank;
    enemy.homeX = x;
    enemy.attackAt = 0;
    enemy.rangedAt = this.time.now + Phaser.Math.Between(900, 1900);
    enemy.attackingUntil = 0;
    enemy.dead = false;
    enemy.healthBar = this.add.graphics().setDepth(25);
    enemy.setDepth(16).setCollideWorldBounds(false).setMaxVelocity(240, 800);
    if (usesSheet) {
      enemy.setScale(spec.scale).play(`enemy-walk-${rank}`);
      (enemy.body as Phaser.Physics.Arcade.Body).setSize(spec.bodyWidth, spec.bodyHeight).setOffset(spec.bodyOffsetX, spec.bodyOffsetY);
    } else {
      (enemy.body as Phaser.Physics.Arcade.Body).setSize(30, 53).setOffset(9, 8);
    }
    this.drawEnemyBar(enemy);
  }

  private drawEnemyBar(enemy: NinjaEnemy) {
    const ratio = Phaser.Math.Clamp(enemy.hp / enemy.maxHp, 0, 1);
    enemy.healthBar.clear();
    enemy.healthBar.fillStyle(0x080a0f, 0.85).fillRect(-21, -3, 42, 5);
    enemy.healthBar.fillStyle(ENEMY_TYPES[enemy.rank].barColor, 1).fillRect(-20, -2, 40 * ratio, 3);
  }

  private buildLevel() {
    const ground = this.level === 1
      ? [[340, 670, 680, 100], [1030, 670, 570, 100], [1645, 670, 580, 100], [2215, 670, 370, 100]]
      : [[300, 670, 600, 100], [930, 670, 560, 100], [1560, 670, 620, 100], [2230, 670, 620, 100], [2760, 670, 240, 100]];
    const ledges = this.level === 1
      ? [[520, 510, 230, 26], [840, 430, 220, 26], [1290, 510, 250, 26], [1770, 420, 250, 26], [2060, 500, 170, 26]]
      : [[610, 480, 230, 26], [1030, 400, 220, 26], [1450, 510, 250, 26], [1880, 380, 250, 26], [2310, 490, 230, 26], [2600, 390, 200, 26]];
    ground.forEach(([x, y, width, height]) => this.addPlatform(x, y, width, height, true));
    ledges.forEach(([x, y, width, height]) => this.addPlatform(x, y, width, height, false));

    const obstacles = this.level === 1
      ? [[600, 588, 44, 64], [1460, 596, 72, 48], [1860, 580, 42, 80]]
      : [[780, 592, 58, 56], [1335, 580, 42, 80], [2160, 590, 70, 60], [2480, 582, 42, 76]];
    obstacles.forEach(([x, y, width, height]) => this.addObstacle(x, y, width, height));

    const gaps = this.level === 1
      ? [[712, 57], [1335, 32], [1982, 87]]
      : [[625, 42], [1230, 32], [1895, 42], [2590, 92]];
    gaps.forEach(([x, width]) => this.addHazard(x, 712, width));
    this.drawWorldDetails();
  }

  private addPlatform(x: number, y: number, width: number, height: number, ground: boolean) {
    const color = this.level === 1 ? (ground ? 0x141b24 : 0x222936) : (ground ? 0x21151a : 0x302027);
    const block = this.add.rectangle(x, y, width, height, color).setStrokeStyle(1, 0x48515b, 0.55).setDepth(10);
    this.platforms.add(block);
    const surfaceY = y - height / 2;
    const surfaceColor = this.level === 1 ? 0x68716d : 0x6e5149;
    this.add.rectangle(x, surfaceY + 3, width, 6, surfaceColor).setDepth(11);
    this.add.rectangle(x, surfaceY + 9, width, 2, 0x090c10, 0.65).setDepth(11);

    // Stone and timber seams make the collider boundaries readable to the player.
    const seamSpacing = ground ? 64 : 36;
    for (let px = x - width / 2 + seamSpacing; px < x + width / 2; px += seamSpacing) {
      const seamHeight = ground ? Math.min(24, height - 14) : 10;
      this.add.line(px, surfaceY + 8, 0, 0, ground ? -5 : 0, seamHeight, 0x080b0e, ground ? 0.38 : 0.55)
        .setOrigin(0.5, 0).setDepth(11);
    }
    if (!ground) {
      this.add.rectangle(x, y + height / 2 - 3, width - 10, 4, 0x11151a, 0.9).setDepth(11);
      const leftSupport = x - width / 2 + 18;
      const rightSupport = x + width / 2 - 18;
      this.add.line(leftSupport, y + height / 2, 0, 0, 20, 38, 0x12161a, 0.8).setOrigin(0.5, 0).setDepth(9);
      this.add.line(rightSupport, y + height / 2, 0, 0, -20, 38, 0x12161a, 0.8).setOrigin(0.5, 0).setDepth(9);
    }
  }

  private addObstacle(x: number, y: number, width: number, height: number) {
    const block = this.add.rectangle(x, y, width, height, this.level === 1 ? 0x28231f : 0x2b1c1b).setDepth(12);
    block.setStrokeStyle(2, 0x7b5940, 0.8);
    this.platforms.add(block);
    this.add.line(x, y, -width / 2, -height / 2, width / 2, height / 2, 0x8a6447, 0.65).setOrigin(0.5).setDepth(13);
    this.add.line(x, y, width / 2, -height / 2, -width / 2, height / 2, 0x8a6447, 0.65).setOrigin(0.5).setDepth(13);
  }

  private addHazard(x: number, y: number, width: number) {
    const zone = this.add.rectangle(x, y - 48, width, 90, 0xff0000, 0);
    this.hazards.add(zone);
    this.add.rectangle(x, 670, width + 4, 100, this.level === 1 ? 0x070a0f : 0x10070a, 0.96).setDepth(8);
    for (let offset = -width / 2 + 6; offset <= width / 2 - 6; offset += 13) {
      this.add.triangle(x + offset, 644, 0, 31, 8, 0, 16, 31, 0x8b9298).setDepth(12);
    }
    const warningGlow = this.add.ellipse(x, 680, width, 13, this.level === 1 ? 0x68888d : 0xb23d35, 0.11).setDepth(9);
    this.tweens.add({ targets: warningGlow, alpha: 0.25, scaleX: 0.82, yoyo: true, repeat: -1, duration: 1250 });
  }

  private drawBackdrop() {
    const skyColors = this.level === 1
      ? [0x050812, 0x0b1120, 0x111a2a, 0x17212d, 0x1e2931, 0x263238]
      : [0x10050a, 0x1a090e, 0x270d12, 0x351219, 0x3d1b20, 0x302326];
    skyColors.forEach((color, index) => {
      this.add.rectangle(640, 60 + index * 120, 1280, 122, color).setScrollFactor(0).setDepth(-30);
    });
    const moonX = this.level === 1 ? 980 : 250;
    const moonColor = this.level === 1 ? 0xe6e2cb : 0xd16c57;
    this.add.circle(moonX, 145, this.level === 1 ? 82 : 64, moonColor, 0.08).setScrollFactor(0).setDepth(-28);
    this.add.circle(moonX, 145, this.level === 1 ? 61 : 48, moonColor, 0.84).setScrollFactor(0).setDepth(-27);
    this.add.circle(moonX + 18, 130, 9, 0x8e8878, 0.16).setScrollFactor(0).setDepth(-26);
    this.add.circle(moonX - 19, 162, 6, 0x8e8878, 0.13).setScrollFactor(0).setDepth(-26);

    const random = new Phaser.Math.RandomDataGenerator([`level-${this.level}`]);
    for (let index = 0; index < 56; index += 1) {
      this.add.circle(random.between(5, 1275), random.between(24, 330), random.realInRange(0.5, 1.4), 0xe8e1cf, random.realInRange(0.2, 0.7))
        .setScrollFactor(0).setDepth(-25);
    }
    this.add.polygon(480, 420, [0, 220, 230, 30, 390, 170, 570, 0, 820, 220], 0x090e17, 0.85).setScrollFactor(0.08).setDepth(-22);
    this.add.polygon(910, 470, [0, 180, 190, 20, 330, 135, 520, 0, 750, 180], 0x0c1118, 0.94).setScrollFactor(0.16).setDepth(-21);
    this.add.rectangle(640, 590, 1280, 230, this.level === 1 ? 0x080d12 : 0x110a0c, 0.76).setScrollFactor(0).setDepth(-19);
    this.drawCloudBank(random);
    this.drawSilhouetteTemple();
  }

  private drawCloudBank(random: Phaser.Math.RandomDataGenerator) {
    const cloudColor = this.level === 1 ? 0xaab5b3 : 0xc28d83;
    for (let index = 0; index < 12; index += 1) {
      const cloud = this.add.ellipse(
        random.between(-80, 1360),
        random.between(245, 515),
        random.between(130, 310),
        random.between(18, 42),
        cloudColor,
        random.realInRange(0.015, 0.055),
      ).setScrollFactor(random.realInRange(0.04, 0.2)).setDepth(-18);
      this.tweens.add({
        targets: cloud,
        x: cloud.x + random.between(45, 120),
        alpha: cloud.alpha * 0.55,
        yoyo: true,
        repeat: -1,
        duration: random.between(9000, 16000),
      });
    }
  }

  private drawSilhouetteTemple() {
    const x = this.level === 1 ? 860 : 760;
    const depth = -17;
    const color = this.level === 1 ? 0x080a0e : 0x0b0708;
    this.add.rectangle(x, 455, 230, 165, color).setScrollFactor(0.28).setDepth(depth);
    this.add.triangle(x, 342, 0, 100, 150, 20, 300, 100, color).setScrollFactor(0.28).setDepth(depth);
    this.add.rectangle(x, 360, 330, 11, color).setScrollFactor(0.28).setDepth(depth);
    this.add.triangle(x, 292, 0, 80, 125, 18, 250, 80, color).setScrollFactor(0.28).setDepth(depth);
    this.add.rectangle(x, 312, 275, 9, color).setScrollFactor(0.28).setDepth(depth);
    for (let offset = -90; offset <= 90; offset += 60) {
      this.add.rectangle(x + offset, 451, 7, 140, 0x1f1819, 0.8).setScrollFactor(0.28).setDepth(depth + 1);
    }
  }

  private drawWorldDetails() {
    const lanternPositions = this.level === 1 ? [340, 1180, 1680, 2310] : [330, 970, 1760, 2440, 2780];
    lanternPositions.forEach((x, index) => {
      this.add.rectangle(x, 520, 7, 200, 0x211b18).setDepth(3);
      this.add.rectangle(x, 445, 40, 34, 0x712d27, 0.9).setStrokeStyle(2, 0x1b1210).setDepth(4);
      const glow = this.add.circle(x, 445, 34, 0xd75936, 0.08).setDepth(2);
      this.tweens.add({ targets: glow, alpha: 0.18, scale: 1.18, yoyo: true, repeat: -1, duration: 1300 + index * 120 });
    });
    for (let x = 80; x < this.worldWidth; x += 420) {
      const bambooColor = this.level === 1 ? 0x111b1b : 0x1b1515;
      this.add.rectangle(x, 475, 13, 310, bambooColor).setRotation(indexedLean(x)).setDepth(1);
      for (let y = 365; y < 590; y += 48) this.add.rectangle(x + 2, y, 18, 3, 0x33403a, 0.55).setDepth(2);
    }
    const gatePositions = this.level === 1 ? [950, 2150] : [1180, 2260];
    gatePositions.forEach((x) => this.drawToriiGate(x));
    for (let x = 190; x < this.worldWidth; x += 330) this.drawGrassTuft(x, 614);
  }

  private drawToriiGate(x: number) {
    const color = this.level === 1 ? 0x2b1717 : 0x351719;
    this.add.rectangle(x - 48, 515, 11, 205, color).setDepth(4);
    this.add.rectangle(x + 48, 515, 11, 205, color).setDepth(4);
    this.add.rectangle(x, 418, 138, 12, color).setDepth(4);
    this.add.rectangle(x, 438, 112, 8, 0x140e0f).setDepth(4);
    this.add.triangle(x - 77, 414, 0, 8, 16, 0, 16, 8, color).setDepth(4);
    this.add.triangle(x + 77, 414, 0, 0, 16, 8, 0, 8, color).setDepth(4);
  }

  private drawGrassTuft(x: number, y: number) {
    const color = this.level === 1 ? 0x35423d : 0x49342f;
    for (let offset = -12; offset <= 12; offset += 6) {
      this.add.line(x + offset, y, 0, 0, offset / 2, -Phaser.Math.Between(12, 28), color, 0.55)
        .setOrigin(0.5, 1).setDepth(13);
    }
  }

  private showWorldMessage(title: string, subtitle: string, color: number) {
    const x = this.cameras.main.midPoint.x;
    const titleText = this.add.text(x, 250, title, {
      fontFamily: "Arial Black, sans-serif", fontSize: "34px", color: `#${color.toString(16).padStart(6, "0")}`,
      stroke: "#08090d", strokeThickness: 7, letterSpacing: 4,
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
    const subText = this.add.text(x, 294, subtitle.toUpperCase(), {
      fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#d7d5ce", letterSpacing: 3,
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
    titleText.setX(640);
    subText.setX(640);
    this.tweens.add({ targets: [titleText, subText], alpha: 0, y: "-=16", delay: 1050, duration: 700, onComplete: () => { titleText.destroy(); subText.destroy(); } });
  }

  private createDust(x: number, y: number, color: number) {
    for (let index = 0; index < 5; index += 1) {
      const mote = this.add.circle(x + Phaser.Math.Between(-15, 15), y, Phaser.Math.Between(2, 5), color, 0.5).setDepth(22);
      this.tweens.add({ targets: mote, x: mote.x + Phaser.Math.Between(-25, 25), y: mote.y - Phaser.Math.Between(4, 20), alpha: 0, duration: 320, onComplete: () => mote.destroy() });
    }
  }

  private createSparks(x: number, y: number, color: number) {
    for (let index = 0; index < 6; index += 1) {
      const spark = this.add.rectangle(x, y, Phaser.Math.Between(3, 8), 2, color).setDepth(32).setRotation(Phaser.Math.FloatBetween(-2, 2));
      this.tweens.add({ targets: spark, x: x + Phaser.Math.Between(-38, 38), y: y + Phaser.Math.Between(-32, 30), alpha: 0, duration: 240, onComplete: () => spark.destroy() });
    }
  }

  private processDetailedSprites() {
    const tasks: Array<() => void> = [
      () => this.createTransparentSheet("player-movement-source", "player-movement-sheet"),
      () => this.createTransparentSheet("player-sword-source", "player-sword-sheet"),
      () => this.createTransparentSheet("player-techniques-source", "player-techniques-sheet"),
      ...ENEMY_TYPES.map((_enemy, rank) => () => this.createTransparentSheet(enemySourceKey(rank), enemyTextureKey(rank))),
    ];

    // Converting one sheet per tick prevents a multi-megabyte alpha pass from freezing the game.
    tasks.forEach((task, index) => {
      this.time.delayedCall(index * 120, () => {
        try {
          task();
          this.createAnimations();
          this.upgradeActiveSprites();
        } catch {
          // Every sheet has an independent procedural fallback.
        }
      });
    });
  }

  /** Detailed art is optional and never blocks the playable procedural scene. */
  private loadDetailedSprites() {
    const playerSources = ["player-movement-source", "player-sword-source", "player-techniques-source"];
    const enemySources = ENEMY_TYPES.map((_enemy, rank) => enemySourceKey(rank));
    const allEnemySheetsReady = ENEMY_TYPES.every((_enemy, rank) => this.textures.exists(enemyTextureKey(rank)));
    if (this.textures.exists("player-movement-sheet") && allEnemySheetsReady) return;
    const applyLoadedArt = () => {
      this.processDetailedSprites();
    };
    if (playerSources.every((key) => this.textures.exists(key)) && enemySources.every((key) => this.textures.exists(key))) {
      applyLoadedArt();
      return;
    }

    if (!this.textures.exists("player-movement-source")) this.load.image("player-movement-source", "./assets/player/shinobi-movement.png");
    if (!this.textures.exists("player-sword-source")) this.load.image("player-sword-source", "./assets/player/shinobi-sword-combat.png");
    if (!this.textures.exists("player-techniques-source")) this.load.image("player-techniques-source", "./assets/player/shinobi-techniques.png");
    ENEMY_TYPES.forEach((enemy, rank) => {
      const sourceKey = enemySourceKey(rank);
      if (!this.textures.exists(sourceKey)) this.load.image(sourceKey, `./assets/enemies/${enemy.asset}`);
    });
    this.load.once(Phaser.Loader.Events.COMPLETE, applyLoadedArt);
    this.load.start();
  }

  private upgradeActiveSprites() {
    if (this.player?.active && this.textures.exists("player-movement-sheet") && this.player.texture.key !== "player-movement-sheet") {
      this.player.setTexture("player-movement-sheet", "0").setScale(0.34).play("player-idle");
      (this.player.body as Phaser.Physics.Arcade.Body).setSize(82, 174).setOffset(87, 50);
    }
    this.enemies?.getChildren().forEach((child) => {
      const enemy = child as NinjaEnemy;
      const archetype = ENEMY_TYPES[enemy.rank];
      const textureKey = enemyTextureKey(enemy.rank);
      if (!enemy.active || !this.textures.exists(textureKey) || enemy.texture.key === textureKey) return;
      enemy.setTexture(textureKey, "0").setScale(archetype.scale).play(`enemy-walk-${enemy.rank}`);
      (enemy.body as Phaser.Physics.Arcade.Body)
        .setSize(archetype.bodyWidth, archetype.bodyHeight)
        .setOffset(archetype.bodyOffsetX, archetype.bodyOffsetY);
    });
  }

  /** Removes the generated checkerboard with an edge flood-fill and exposes a real alpha texture. */
  private createTransparentSheet(sourceKey: string, targetKey: string) {
    if (this.textures.exists(targetKey) || !this.textures.exists(sourceKey)) return;
    const source = this.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
    const width = source.naturalWidth || source.width;
    const height = source.naturalHeight || source.height;
    if (!width || !height) return;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    context.drawImage(source, 0, 0, width, height);
    const image = context.getImageData(0, 0, width, height);
    const pixels = image.data;
    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let head = 0;
    let tail = 0;

    const isChecker = (pixel: number) => {
      const offset = pixel * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const brightest = Math.max(red, green, blue);
      const darkest = Math.min(red, green, blue);
      return darkest > 178 && brightest - darkest < 24;
    };
    const enqueue = (pixel: number) => {
      if (pixel < 0 || pixel >= visited.length || visited[pixel] || !isChecker(pixel)) return;
      visited[pixel] = 1;
      queue[tail] = pixel;
      tail += 1;
    };

    for (let x = 0; x < width; x += 1) {
      enqueue(x);
      enqueue((height - 1) * width + x);
    }
    for (let y = 0; y < height; y += 1) {
      enqueue(y * width);
      enqueue(y * width + width - 1);
    }
    while (head < tail) {
      const pixel = queue[head];
      head += 1;
      pixels[pixel * 4 + 3] = 0;
      const x = pixel % width;
      if (x > 0) enqueue(pixel - 1);
      if (x < width - 1) enqueue(pixel + 1);
      enqueue(pixel - width);
      enqueue(pixel + width);
    }
    context.putImageData(image, 0, 0);

    const texture = this.textures.addCanvas(targetKey, canvas);
    if (!texture) return;
    const frameWidth = Math.floor(width / 4);
    const frameHeight = Math.floor(height / 4);
    for (let frame = 0; frame < 16; frame += 1) {
      texture.add(String(frame), 0, (frame % 4) * frameWidth, Math.floor(frame / 4) * frameHeight, frameWidth, frameHeight);
    }
  }

  private createAnimations() {
    if (this.textures.exists("player-movement-sheet")) {
      if (!this.anims.exists("player-idle")) {
        this.anims.create({ key: "player-idle", frames: this.anims.generateFrameNames("player-movement-sheet", { start: 0, end: 3 }), frameRate: 5, repeat: -1 });
        this.anims.create({ key: "player-run", frames: this.anims.generateFrameNames("player-movement-sheet", { start: 4, end: 7 }), frameRate: 11, repeat: -1 });
        this.anims.create({ key: "player-jump", frames: this.anims.generateFrameNames("player-movement-sheet", { start: 8, end: 11 }), frameRate: 8, repeat: 0 });
        this.anims.create({ key: "player-roll", frames: this.anims.generateFrameNames("player-movement-sheet", { start: 12, end: 15 }), frameRate: 12, repeat: 0 });
      }
    }
    if (this.textures.exists("player-sword-sheet") && !this.anims.exists("player-sword")) {
      this.anims.create({ key: "player-sword", frames: this.anims.generateFrameNames("player-sword-sheet", { start: 0, end: 3 }), frameRate: 13, repeat: 0 });
      this.anims.create({ key: "player-sword-upper", frames: this.anims.generateFrameNames("player-sword-sheet", { start: 4, end: 7 }), frameRate: 13, repeat: 0 });
      this.anims.create({ key: "player-sword-air", frames: this.anims.generateFrameNames("player-sword-sheet", { start: 8, end: 11 }), frameRate: 13, repeat: 0 });
      this.anims.create({ key: "player-sword-finisher", frames: this.anims.generateFrameNames("player-sword-sheet", { start: 12, end: 15 }), frameRate: 12, repeat: 0 });
    }
    if (this.textures.exists("player-techniques-sheet") && !this.anims.exists("player-throw")) {
      this.anims.create({ key: "player-throw", frames: this.anims.generateFrameNames("player-techniques-sheet", { start: 0, end: 3 }), frameRate: 12, repeat: 0 });
      this.anims.create({ key: "player-dash", frames: this.anims.generateFrameNames("player-techniques-sheet", { start: 4, end: 7 }), frameRate: 14, repeat: 0 });
      this.anims.create({ key: "player-hurt", frames: this.anims.generateFrameNames("player-techniques-sheet", { start: 8, end: 11 }), frameRate: 9, repeat: 0 });
      this.anims.create({ key: "player-defeated", frames: this.anims.generateFrameNames("player-techniques-sheet", { start: 12, end: 15 }), frameRate: 5, repeat: 0 });
    }
    ENEMY_TYPES.forEach((_enemy, rank) => {
      const textureKey = enemyTextureKey(rank);
      if (this.textures.exists(textureKey)) {
        const key = `enemy-walk-${rank}`;
        if (!this.anims.exists(key)) {
          this.anims.create({ key: `enemy-idle-${rank}`, frames: this.anims.generateFrameNames(textureKey, { start: 0, end: 3 }), frameRate: rank === 3 ? 3 : 5, repeat: -1 });
          this.anims.create({ key, frames: this.anims.generateFrameNames(textureKey, { start: 4, end: 7 }), frameRate: rank === 0 ? 10 : rank === 3 ? 4 : 6, repeat: -1 });
          this.anims.create({ key: `enemy-attack-${rank}`, frames: this.anims.generateFrameNames(textureKey, { start: 8, end: 11 }), frameRate: rank === 3 ? 7 : 10, repeat: 0 });
          this.anims.create({ key: `enemy-hit-${rank}`, frames: this.anims.generateFrameNames(textureKey, { start: 12, end: 13 }), frameRate: 9, repeat: 0 });
          this.anims.create({ key: `enemy-defeated-${rank}`, frames: this.anims.generateFrameNames(textureKey, { start: 12, end: 15 }), frameRate: 6, repeat: 0 });
        }
      }
    });
  }

  private createTextures() {
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    if (!this.textures.exists("player-movement-sheet") && !this.textures.exists("player-ninja")) {
      this.drawNinjaTexture(graphics, "player-ninja", 0x8f969d, 0xc9423a, 0xdde2df);
    }
    ENEMY_TYPES.forEach((enemy, rank) => {
      const palettes = [
        [0xa83232, 0x3a1114, 0xf2b36e],
        [0x27558f, 0x142440, 0x9ecbdb],
        [0x6b3c88, 0x281536, 0xd7afd9],
        [0x75612e, 0x302b19, 0xe0c274],
        [0x191b23, 0x06070a, 0xd3b85d],
      ];
      const [cloth, dark, eye] = palettes[rank];
      if (!this.textures.exists(enemyTextureKey(rank)) && !this.textures.exists(`enemy-${enemy.key}`)) {
        this.drawNinjaTexture(graphics, `enemy-${enemy.key}`, cloth, dark, eye);
      }
    });
    if (!this.textures.exists("shuriken")) {
      graphics.clear();
      graphics.fillStyle(0xd9dde1, 1);
      graphics.fillTriangle(12, 0, 16, 12, 12, 9);
      graphics.fillTriangle(24, 12, 12, 16, 15, 12);
      graphics.fillTriangle(12, 24, 8, 12, 12, 15);
      graphics.fillTriangle(0, 12, 12, 8, 9, 12);
      graphics.fillStyle(0x424750, 1).fillCircle(12, 12, 4);
      graphics.generateTexture("shuriken", 24, 24);
    }
    if (!this.textures.exists("enemy-shuriken")) {
      graphics.clear();
      graphics.fillStyle(0xd04542, 1);
      graphics.fillTriangle(12, 0, 16, 12, 12, 9);
      graphics.fillTriangle(24, 12, 12, 16, 15, 12);
      graphics.fillTriangle(12, 24, 8, 12, 12, 15);
      graphics.fillTriangle(0, 12, 12, 8, 9, 12);
      graphics.fillStyle(0x17090a, 1).fillCircle(12, 12, 4);
      graphics.generateTexture("enemy-shuriken", 24, 24);
    }
    graphics.destroy();
  }

  private drawNinjaTexture(graphics: Phaser.GameObjects.Graphics, key: string, cloth: number, accent: number, eye: number) {
    graphics.clear();
    graphics.fillStyle(0x11141a, 1).fillRoundedRect(9, 46, 13, 15, 3).fillRoundedRect(27, 46, 13, 15, 3);
    graphics.fillStyle(cloth, 1).fillRoundedRect(10, 25, 30, 29, 7);
    graphics.fillStyle(accent, 1).fillRect(10, 37, 30, 5);
    graphics.fillStyle(0x11141a, 1).fillRoundedRect(7, 28, 8, 24, 3).fillRoundedRect(35, 28, 8, 24, 3);
    graphics.fillStyle(cloth, 1).fillRoundedRect(9, 5, 32, 29, 11);
    graphics.fillStyle(0x11141a, 1).fillRect(9, 16, 32, 13);
    graphics.fillStyle(eye, 1).fillTriangle(16, 20, 23, 18, 22, 22).fillTriangle(34, 20, 27, 18, 28, 22);
    graphics.fillStyle(accent, 1).fillTriangle(39, 26, 48, 30, 39, 33);
    graphics.fillStyle(0x3e444c, 1).fillRoundedRect(38, 37, 4, 24, 2);
    graphics.fillStyle(0xc0c5c8, 1).fillRect(39, 27, 2, 18);
    graphics.generateTexture(key, 50, 64);
  }
}

function indexedLean(x: number) {
  return x % 840 === 80 ? -0.035 : 0.025;
}

function enemyTextureKey(rank: number) {
  return `enemy-${ENEMY_TYPES[rank]?.key ?? ENEMY_TYPES[0].key}-sheet`;
}

function enemySourceKey(rank: number) {
  return `enemy-${ENEMY_TYPES[rank]?.key ?? ENEMY_TYPES[0].key}-source`;
}