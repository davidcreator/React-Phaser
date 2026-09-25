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

/** Estatísticas da fase no momento da conclusão (base do rank/pontuação). */
export interface LevelClearStats {
  kills: number;
  lives: number;
  health: number;
}

export type GameSignal =
  | { type: "ready" }
  | { type: "level"; level: number }
  | { type: "levelClear"; level: number; stats: LevelClearStats }
  | { type: "nextLevel"; state: GameStartState }
  | { type: "gameOver" }
  | { type: "victory"; level: number; lives: number; kills: number; stats: LevelClearStats }
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
  homeY: number;
  calmUntil: number;
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

interface LevelPalette {
  camera: string;
  sky: number[];
  moonColor: number;
  moonX: number;
  moonRadius: number;
  cloud: number;
  temple: number;
  templeX: number;
  haze: number;
  surface: number;
  ground: number;
  ledge: number;
  obstacle: number;
  pit: number;
  pitGlow: number;
  lanternBody: number;
  lanternGlow: number;
  bamboo: number;
  bambooLeaf: number;
  torii: number;
  grass: number;
}

interface LevelConfig {
  id: number;
  name: string;
  flavor: string;
  worldWidth: number;
  palette: LevelPalette;
  ground: Array<[number, number, number, number]>;
  ledges: Array<[number, number, number, number]>;
  obstacles: Array<[number, number, number, number]>;
  gaps: Array<[number, number]>;
  lanterns: number[];
  toriis: number[];
  checkpoints: number[];
  spawns: Array<[number, number, number]>;
}

/**
 * EXPANSAO 6 FASES: layouts, paletas e spawns por configuracao.
 * Coordenadas: ground/ledges/obstacles = [cx, cy, w, h]; gaps = [x, largura];
 * spawns = [x, y, rank].
 */
const LEVELS: LevelConfig[] = [
  {
    id: 1, name: "FORTALEZA INTERIOR", flavor: "treino de aco", worldWidth: 2400,
    palette: { camera: "#070a13", sky: [0x050812, 0x0b1120, 0x111a2a, 0x17212d, 0x1e2931, 0x263238], moonColor: 0xe6e2cb, moonX: 980, moonRadius: 82, cloud: 0xaab5b3, temple: 0x080a0e, templeX: 860, haze: 0x080d12, surface: 0x68716d, ground: 0x141b24, ledge: 0x222936, obstacle: 0x28231f, pit: 0x070a0f, pitGlow: 0x68888d, lanternBody: 0x712d27, lanternGlow: 0xd75936, bamboo: 0x111b1b, bambooLeaf: 0x33403a, torii: 0x2b1717, grass: 0x35423d },
    ground: [[340, 670, 680, 100], [1030, 670, 570, 100], [1645, 670, 580, 100], [2215, 670, 370, 100]],
    ledges: [[520, 510, 230, 26], [840, 430, 220, 26], [1290, 510, 250, 26], [1770, 420, 250, 26], [2060, 500, 170, 26]],
    obstacles: [[600, 588, 44, 64], [1460, 596, 72, 48], [1860, 580, 42, 80]],
    gaps: [[712, 57], [1335, 32], [1982, 87]],
    lanterns: [340, 1180, 1680, 2310], toriis: [950, 2150], checkpoints: [120, 790, 1390, 2070],
    spawns: [[480, 570, 0], [840, 360, 0], [1050, 570, 1], [1330, 440, 0], [1570, 570, 1], [1810, 350, 2], [2080, 570, 3], [2260, 570, 4]],
  },
  {
    id: 2, name: "LUA VERMELHA", flavor: "casta de elite", worldWidth: 2880,
    palette: { camera: "#14080c", sky: [0x10050a, 0x1a090e, 0x270d12, 0x351219, 0x3d1b20, 0x302326], moonColor: 0xd16c57, moonX: 250, moonRadius: 64, cloud: 0xc28d83, temple: 0x0b0708, templeX: 760, haze: 0x110a0c, surface: 0x6e5149, ground: 0x21151a, ledge: 0x302027, obstacle: 0x2b1c1b, pit: 0x10070a, pitGlow: 0xb23d35, lanternBody: 0x712d27, lanternGlow: 0xd75936, bamboo: 0x1b1515, bambooLeaf: 0x4a3230, torii: 0x351719, grass: 0x49342f },
    ground: [[300, 670, 600, 100], [930, 670, 560, 100], [1560, 670, 620, 100], [2230, 670, 620, 100], [2760, 670, 240, 100]],
    ledges: [[610, 480, 230, 26], [1030, 400, 220, 26], [1450, 510, 250, 26], [1880, 380, 250, 26], [2310, 490, 230, 26], [2600, 390, 200, 26]],
    obstacles: [[780, 592, 58, 56], [1335, 580, 42, 80], [2160, 590, 70, 60], [2480, 582, 42, 76]],
    gaps: [[625, 42], [1230, 32], [1895, 42], [2590, 92]],
    lanterns: [330, 970, 1760, 2440, 2780], toriis: [1180, 2260], checkpoints: [120, 680, 1280, 1950, 2670],
    spawns: [[430, 570, 0], [670, 410, 1], [880, 570, 0], [1090, 330, 2], [1280, 570, 1], [1500, 440, 3], [1690, 570, 0], [1900, 310, 2], [2110, 570, 3], [2350, 420, 1], [2760, 570, 4], [2640, 570, 4]],
  },
  {
    id: 3, name: "BAMBUZAL ESPECTRAL", flavor: "nevoa verde", worldWidth: 2640,
    palette: { camera: "#06110d", sky: [0x04100d, 0x081a15, 0x0d241c, 0x123023, 0x183a2b, 0x1f4434], moonColor: 0xd9f2d0, moonX: 700, moonRadius: 70, cloud: 0x9fc4ae, temple: 0x07120d, templeX: 900, haze: 0x0a1510, surface: 0x5f7a6a, ground: 0x11201a, ledge: 0x1f3329, obstacle: 0x1f2b20, pit: 0x05100b, pitGlow: 0x59b26a, lanternBody: 0x276048, lanternGlow: 0x59d68f, bamboo: 0x0f1f18, bambooLeaf: 0x2f4a3a, torii: 0x173325, grass: 0x2f5241 },
    ground: [[320, 670, 640, 100], [1020, 670, 600, 100], [1660, 670, 560, 100], [2340, 670, 420, 100]],
    ledges: [[560, 470, 230, 26], [980, 410, 220, 26], [1420, 500, 250, 26], [1900, 390, 250, 26], [2240, 480, 200, 26]],
    obstacles: [[760, 590, 56, 60], [1400, 582, 44, 76], [2060, 588, 64, 56], [2300, 592, 42, 64]],
    gaps: [[688, 60], [1350, 28], [2030, 98]],
    lanterns: [340, 1050, 1700, 2360], toriis: [860, 2050], checkpoints: [120, 780, 1420, 2190],
    spawns: [[420, 570, 0], [635, 400, 1], [900, 570, 0], [1050, 340, 2], [1660, 570, 1], [1505, 440, 2], [1880, 570, 0], [2300, 320, 2], [2380, 570, 3], [2520, 570, 4]],
  },
  {
    id: 4, name: "DOJO DE GELO", flavor: "frio cortante", worldWidth: 3120,
    palette: { camera: "#0a0f16", sky: [0x0a0f18, 0x0e1622, 0x131d2e, 0x182438, 0x1e2c44, 0x243450], moonColor: 0xdfe9f5, moonX: 520, moonRadius: 58, cloud: 0xaebfd4, temple: 0x0b1016, templeX: 780, haze: 0x10161f, surface: 0x8a97a8, ground: 0x18212e, ledge: 0x273348, obstacle: 0x232c3a, pit: 0x080d14, pitGlow: 0x6f9cc9, lanternBody: 0x3d5f8f, lanternGlow: 0x7fb0e8, bamboo: 0x16202c, bambooLeaf: 0x3a4a60, torii: 0x243043, grass: 0x44546c },
    ground: [[300, 670, 620, 100], [980, 670, 540, 100], [1580, 670, 600, 100], [2280, 670, 560, 100], [2960, 670, 200, 100]],
    ledges: [[540, 480, 230, 26], [1000, 420, 240, 26], [1460, 500, 250, 26], [1960, 380, 250, 26], [2380, 470, 230, 26], [2720, 390, 200, 26]],
    obstacles: [[820, 586, 64, 62], [1360, 580, 42, 80], [2140, 590, 70, 60], [2470, 584, 44, 74], [2820, 592, 40, 64]],
    gaps: [[660, 90], [1260, 28], [1940, 108], [2780, 68]],
    lanterns: [320, 1010, 1620, 2300, 2960], toriis: [900, 2340, 2980], checkpoints: [120, 780, 1360, 2080, 2860],
    spawns: [[400, 570, 1], [650, 410, 2], [880, 570, 1], [1120, 350, 2], [1470, 570, 1], [1580, 430, 3], [1800, 570, 2], [2040, 310, 2], [2260, 570, 3], [2455, 400, 2], [2960, 570, 4], [3040, 570, 4]],
  },
  {
    id: 5, name: "CRATERA DE CINZAS", flavor: "cinzas vivas", worldWidth: 3120,
    palette: { camera: "#0e0a12", sky: [0x0d0a12, 0x151019, 0x1d1622, 0x261c2d, 0x2f2437, 0x372a40], moonColor: 0xc9a7e8, moonX: 840, moonRadius: 66, cloud: 0xbfa9d1, temple: 0x0f0b14, templeX: 840, haze: 0x140f1a, surface: 0x7a6f85, ground: 0x1c1622, ledge: 0x2b2234, obstacle: 0x2a2030, pit: 0x0a0710, pitGlow: 0x8d6ab5, lanternBody: 0x6a3d8f, lanternGlow: 0xb07fe8, bamboo: 0x1a1420, bambooLeaf: 0x423354, torii: 0x2c1f3a, grass: 0x4a3d58 },
    ground: [[340, 670, 560, 100], [1000, 670, 620, 100], [1700, 670, 560, 100], [2360, 670, 620, 100], [3040, 670, 180, 100]],
    ledges: [[580, 440, 220, 26], [1060, 400, 240, 26], [1520, 510, 250, 26], [2020, 420, 250, 26], [2480, 380, 220, 26], [2820, 470, 200, 26]],
    obstacles: [[700, 588, 58, 56], [1220, 580, 44, 78], [1930, 586, 56, 62], [2560, 592, 42, 64], [2860, 584, 46, 72]],
    gaps: [[655, 33], [1350, 66], [2010, 38], [2740, 110]],
    lanterns: [360, 1030, 1740, 2400, 3020], toriis: [760, 2200, 2980], checkpoints: [120, 760, 1500, 2140, 2900],
    spawns: [[440, 570, 2], [650, 380, 2], [950, 570, 3], [1180, 330, 2], [1420, 570, 1], [1605, 440, 3], [1700, 570, 2], [2140, 320, 3], [2380, 570, 4], [2550, 390, 3], [3040, 570, 4], [3120, 570, 4]],
  },
  {
    id: 6, name: "CORACAO DO ECLIPSE", flavor: "olho da tempestade", worldWidth: 3360,
    palette: { camera: "#0b0804", sky: [0x0a0805, 0x141008, 0x1e180c, 0x281f10, 0x322613, 0x3c2d16], moonColor: 0xf0d488, moonX: 1100, moonRadius: 90, cloud: 0xcfb075, temple: 0x0d0a05, templeX: 1060, haze: 0x151006, surface: 0x9c8a5a, ground: 0x1e1808, ledge: 0x332a12, obstacle: 0x2e250e, pit: 0x0a0803, pitGlow: 0xc9a34f, lanternBody: 0x8f6a1f, lanternGlow: 0xf0c059, bamboo: 0x1c1608, bambooLeaf: 0x4a3c1a, torii: 0x33270e, grass: 0x5a4a20 },
    ground: [[300, 670, 620, 100], [1000, 670, 560, 100], [1640, 670, 620, 100], [2320, 670, 560, 100], [2960, 670, 460, 100]],
    ledges: [[520, 460, 230, 26], [960, 400, 240, 26], [1440, 510, 260, 26], [1900, 380, 260, 26], [2320, 470, 240, 26], [2680, 400, 220, 26], [3000, 490, 220, 26]],
    obstacles: [[780, 590, 62, 58], [1250, 582, 42, 76], [2010, 588, 60, 60], [2450, 584, 44, 74], [2820, 590, 52, 66], [3120, 586, 40, 70]],
    gaps: [[660, 100], [1300, 42], [1990, 88], [2660, 58]],
    lanterns: [320, 960, 1680, 2360, 3020, 3220], toriis: [860, 2320, 3160], checkpoints: [120, 780, 1420, 2140, 2820, 3200],
    spawns: [[380, 570, 2], [600, 400, 3], [820, 570, 2], [1040, 330, 3], [1000, 570, 2], [1480, 440, 4], [1700, 570, 3], [1920, 320, 2], [2140, 570, 4], [2360, 400, 3], [2580, 570, 4], [2750, 330, 3], [2960, 570, 4], [3040, 570, 4]],
  },
];

const MAX_LEVEL = LEVELS.length;

/** Metadados para a UI React (selecao de areas, meta total, transicoes). */
export const LEVEL_META = LEVELS.map((level) => ({
  id: level.id,
  name: level.name,
  flavor: level.flavor,
  enemies: level.spawns.length,
}));

export class ShadowScene extends Phaser.Scene {
  private readonly settings: GameSettings;
  private readonly callbacks: SceneCallbacks;
  private readonly startState: GameStartState;
  private level = 1;
  private lives = 4;
  private kills = 0;
  private levelStartKills = 0;
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
  private previousPad = { jump: false, sword: false, shuriken: false, pause: false };
  private virtualInput = { left: false, right: false, jump: false, sword: false, shuriken: false };
  private levelTransitionTimer: number | null = null;
  private unstuckSince: number | null = null;
  private playerUpgraded = false;
  private swallowPauseUntil = 0;
  private handleBlur: () => void = () => {};
  private commandHandler: (event: Event) => void;

  private config(): LevelConfig {
    const index = Math.min(Math.max(this.level, 1), MAX_LEVEL) - 1;
    return LEVELS[index] ?? LEVELS[0];
  }

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
        if (action === "resume") {
          // FIX re-pausa: o mesmo ESC que retoma via React deixava um JustDown
          // pendente que re-pausava na frame seguinte. Consome o pressionamento.
          this.keys?.ESC?.reset();
          this.swallowPauseUntil = this.time.now + 300;
        }
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
    // Abates desta fase (o total é cumulativo entre as áreas da campanha).
    this.levelStartKills = this.kills;
    this.health = 100;
    this.worldWidth = this.config().worldWidth;
    this.transitioning = false;
    this.ended = false;
    this.paused = false;
    this.attacking = false;
    this.swordCombo = 0;
    this.lastGroundedAt = 0;
    this.jumpBufferedUntil = 0;
    this.levelTransitionTimer = null;
    this.unstuckSince = null;
    this.swallowPauseUntil = 0;
    this.playerUpgraded = false;
    this.virtualInput = { left: false, right: false, jump: false, sword: false, shuriken: false };
  }

  create() {
    this.createTextures();
    this.createAnimations();
    this.physics.world.setBounds(0, 0, this.worldWidth, 860);
    this.physics.world.TILE_BIAS = 40;
    this.cameras.main.setBounds(0, 0, this.worldWidth, 720);
    this.cameras.main.setBackgroundColor(this.config().palette.camera);

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
      window.removeEventListener("blur", this.handleBlur);
      if (this.levelTransitionTimer !== null) window.clearTimeout(this.levelTransitionTimer);
      this.levelTransitionTimer = null;
      this.enemies?.getChildren().forEach((child) => {
        (child as NinjaEnemy).healthBar?.destroy();
      });
    });
    // FIX alt-tab: pausa e solta as teclas ao perder o foco da janela.
    this.handleBlur = () => {
      if (this.ended || this.transitioning) return;
      Object.values(this.keys ?? {}).forEach((key) => key.reset());
      this.virtualInput = { left: false, right: false, jump: false, sword: false, shuriken: false };
      this.setPaused(true);
    };
    window.addEventListener("blur", this.handleBlur);
    // Handle de debug/teste: permite ao smoke test E2E (tests/e2e-smoke.mjs)
    // inspecionar e dirigir a cena de fora do canvas.
    (window as unknown as { __shadowScene?: ShadowScene }).__shadowScene = this;
    this.callbacks.onSignal({ type: "level", level: this.level });
    this.callbacks.onSignal({ type: "ready" });
    this.emitHud(true);
    // The procedural cast is ready immediately; detailed art upgrades it after play begins.
    this.time.delayedCall(700, () => this.loadDetailedSprites());
  }

  update(time: number) {
    if (this.ended || this.paused || !this.player?.active) return;
    this.handleInput(time);
    this.updateEnemies(time);
    this.updateProjectiles();
    if (this.player.y > 770 && time > this.invulnerableUntil) this.hitHazard(35);
    // FIX ciclo de vidas: watchdog — vitalidade zerada SEMPRE consume vida.
    if (this.health <= 0 && !this.ended && !this.transitioning) this.processDeath();
    if (!this.playerUpgraded) this.upgradeActiveSprites();
    this.updateUnstuck(time);
    this.emitHud();
  }

  /** FIX softlock: se o player é empurrado contra uma parede/fenda, realoca suavemente. */
  private updateUnstuck(time: number) {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const pinned = this.unstuckSince !== null && time - this.unstuckSince > 1100;
    if (body.blocked.down && (body.blocked.left || body.blocked.right) && Math.abs(body.velocity.x) < 4) {
      if (this.unstuckSince === null) this.unstuckSince = time;
      else if (pinned) {
        this.unstuckSince = null;
        this.player.setPosition(this.player.x > this.worldWidth / 2 ? this.player.x - 46 : this.player.x + 46, this.player.y - 34);
        this.player.setVelocity(0, 0);
        this.createDust(this.player.x, this.player.y + 26, 0x98a8b5);
      }
    } else {
      this.unstuckSince = null;
    }
  }

  private createPlayer() {
    const usesSheet = this.textures.exists("player-movement-sheet");
    this.player = this.physics.add.sprite(120, 550, usesSheet ? "player-movement-sheet" : "player-ninja", usesSheet ? "0" : undefined);
    this.player.setCollideWorldBounds(true).setDepth(20).setMaxVelocity(350, 1050);
    if (usesSheet) {
      this.player.setScale(0.34).play("player-idle");
      this.playerUpgraded = true;
    }
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
    this.physics.add.collider(this.projectiles, this.platforms, (member) => (member as Phaser.Physics.Arcade.Sprite).destroy());
    this.physics.add.collider(this.enemyProjectiles, this.platforms, (member) => (member as Phaser.Physics.Arcade.Sprite).destroy());
    this.physics.add.overlap(this.projectiles, this.enemies, (projectile, enemy) => {
      // Grupo vs grupo mantem a ordem (A, B), mas identificamos por seguranca.
      const shot = projectile as Phaser.Physics.Arcade.Sprite;
      const shotX = shot.x;
      shot.destroy();
      this.damageEnemy(enemy as NinjaEnemy, 34, shotX);
    });
    // FIX CRITICO (sprite destruido): o Arcade troca a ordem dos argumentos
    // quando o overlap e registrado como (grupo, sprite) — o callback recebia
    // o PLAYER como "projectile" e shot.destroy() DESTRUÍA O JOGADOR ao ser
    // atingido por uma shuriken inimiga (vida presa, sem respawn, sem perder
    // vida). Registro (player, grupo) = callback sempre (player, membro).
    this.physics.add.overlap(this.player, this.enemyProjectiles, (_player, member) => {
      const shot = member as Phaser.Physics.Arcade.Sprite;
      if (!shot?.active) return;
      const damage = Number(shot.getData?.("damage")) || 8;
      const shotX = shot.x;
      shot.destroy();
      this.damagePlayer(damage, shotX);
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
    if (!this.keys || this.transitioning || !this.player?.active) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down || body.touching.down;
    if (grounded) this.lastGroundedAt = time;
    let move = 0;
    let jumpPressed = false;
    let swordPressed = false;
    let shurikenPressed = false;
    let pausePressed = Phaser.Input.Keyboard.JustDown(this.keys.ESC) && time > this.swallowPauseUntil;

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
    if (!this.attacking && this.playerUpgraded && this.textures.exists("player-movement-sheet")) {
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
      if (this.playerUpgraded && this.anims.exists("player-jump")) this.player.play("player-jump", true);
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
    if (this.playerUpgraded && this.anims.exists("player-sword")) {
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
    if (this.playerUpgraded && this.anims.exists("player-throw")) this.player.play("player-throw", true);
    this.callbacks.onSound("shuriken");
    const shot = this.projectiles?.create(this.player.x + this.facing * 32, this.player.y - 5, "shuriken") as Phaser.Physics.Arcade.Sprite;
    if (!shot) return;
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

      // FIX leash de aggro: persegue apenas se razoavelmente próximo (dist/dy);
      // fora do alcance, o inimigo abandona a perseguição e volta ao posto.
      const leashed = distance < 640 && dy < 230;
      if (leashed && distance < 520 && dy < 170 && time >= enemy.calmUntil) {
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
        // FIX inimigos suicidas: patrulha só anda se houver chão à frente.
        const patrolDirection = enemy.x > enemy.homeX + 105 ? -1 : enemy.x < enemy.homeX - 105 ? 1 : (enemy.flipX ? -1 : 1);
        const probeX = enemy.x + patrolDirection * (enemy.displayWidth * 0.35 + 10);
        const probeY = enemy.y + 8;
        const groundAhead = this.platforms.getChildren().some((tile) => {
          const zone = tile as Phaser.GameObjects.Rectangle & { body?: Phaser.Physics.Arcade.StaticBody };
          const staticBody = zone.body;
          if (!staticBody) return false;
          return probeX >= staticBody.left - 4 && probeX <= staticBody.right + 4 && probeY >= staticBody.top - 22 && probeY <= staticBody.top + 22;
        });
        if (!groundAhead) {
          enemy.setVelocityX(0);
          enemy.setFlipX(patrolDirection > 0);
        } else {
          enemy.setFlipX(patrolDirection < 0).setVelocityX(patrolDirection * enemy.speed * 0.45);
        }
      }

      if (body.blocked.down && (body.blocked.left || body.blocked.right)) enemy.setVelocityY(-330);
      if (enemy.texture.key === enemyTextureKey(enemy.rank) && time >= enemy.attackingUntil) {
        enemy.play(`enemy-walk-${enemy.rank}`, true);
      }
      enemy.healthBar.setPosition(enemy.x, enemy.y - 49);
      this.drawEnemyBar(enemy);
      if (enemy.y > 780) this.damageEnemy(enemy, enemy.maxHp, enemy.x);
    });
  }

  private enemyThrow(enemy: NinjaEnemy, direction: number) {
    const shot = this.enemyProjectiles?.create(enemy.x + direction * 26, enemy.y - 4, "enemy-shuriken") as Phaser.Physics.Arcade.Sprite;
    if (!shot) return;
    // FIX corrida: dano registrado ANTES de qualquer fisica/movimento do projetil.
    shot.setData("damage", Math.round(enemy.damage * 0.72));
    shot.setDepth(18).setVelocity(direction * (310 + enemy.rank * 32), -12).setAngularVelocity(direction * 700);
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

  private damagePlayer(amount: number, sourceX: number): boolean {
    if (this.ended || this.transitioning || !this.player?.active || this.time.now < this.invulnerableUntil) return false;
    this.health = Math.max(0, this.health - Math.round(amount));
    this.invulnerableUntil = this.time.now + 900;
    // FIX softlock: knockback horizontal menor (+ prioridade vertical) para o
    // player não ser empurrado para dentro de caixas/fossos ao apanhar.
    this.player.setVelocity(sourceX < this.player.x ? 175 : -175, -250).setTint(0xff6961);
    if (this.playerUpgraded && this.anims.exists("player-hurt")) {
      this.attacking = true;
      this.player.play("player-hurt", true);
      this.time.delayedCall(460, () => { this.attacking = false; });
    }
    this.callbacks.onSound("hurt");
    this.cameras.main.shake(150, 0.008);
    this.time.delayedCall(130, () => this.player.active && this.player.clearTint());
    this.tweens.add({ targets: this.player, alpha: 0.35, yoyo: true, repeat: 4, duration: 80, onComplete: () => this.player.setAlpha(1) });

    const consumedLife = this.health <= 0;
    if (consumedLife) this.processDeath();
    this.emitHud(true);
    return consumedLife;
  }

  /**
   * FIX ciclo de vidas: fluxo de morte isolado e idempotente. Chamado pelo
   * damagePlayer e tambem por um watchdog no update() — se QUALQUER condicao
   * de borda (corrida de eventos, frame drop, teardown de plugin) interromper
   * o processamento, o frame seguinte executa a morte/respawn de qualquer forma.
   * A vitalidade nunca pode ficar presa em 0% sem consumir vida.
   */
  private processDeath() {
    if (this.ended || this.transitioning || !this.player?.active) return;
    this.lives -= 1;
    if (this.lives <= 0) {
      this.ended = true;
      this.physics.pause();
      this.player.clearTint().setAngle(0).setAlpha(1);
      if (this.playerUpgraded && this.anims.exists("player-defeated")) this.player.play("player-defeated", true);
      else this.player.setTint(0x4a4a55).setAngle(90);
      this.showWorldMessage("FIM DA MISSAO", "Todas as vidas foram perdidas", 0xd34b43);
      this.callbacks.onSignal({ type: "gameOver" });
      // Rede de seguranca: reenvia o sinal caso o React perca o primeiro
      // ( corrida de boot/teardown ). setOverlay e idempotente no App.
      this.time.delayedCall(1200, () => {
        if (this.ended && this.scene?.isActive()) this.callbacks.onSignal({ type: "gameOver" });
      });
    } else {
      // Perdeu uma vida: vitalidade cheia, posicao segura e invulnerabilidade
      // estendida para nao morrer em cascata no respawn.
      this.health = 100;
      this.attacking = false;
      this.player.setPosition(this.config().checkpoints[0], 520).setVelocity(0, 0).setAngle(0).clearTint().setAlpha(1);
      this.invulnerableUntil = this.time.now + 2200;
      this.tweens.add({ targets: this.player, alpha: 0.35, yoyo: true, repeat: 9, duration: 110, onComplete: () => this.player.setAlpha(1) });
      this.cameras.main.flash(320, 190, 34, 34);
      // Anti spawn-camp: inimigos vivos voltam aos seus postos originais.
      // Sem isso eles acampam o ponto de respawn e as 4 vidas evaporam.
      this.enemies.getChildren().forEach((child) => {
        const enemy = child as NinjaEnemy;
        if (enemy.dead || !enemy.active) return;
        enemy.setPosition(enemy.homeX, enemy.homeY).setVelocity(0, 0);
        enemy.attackAt = this.time.now + 900;
        enemy.rangedAt = Math.max(enemy.rangedAt, this.time.now + 1400);
        // Nao perseguir durante a janela de respawn — o player respira.
        enemy.calmUntil = this.time.now + 3600;
        enemy.healthBar.setPosition(enemy.x, enemy.y - 49);
      });
      this.showWorldMessage("RETORNO DAS SOMBRAS", `${this.lives} ${this.lives === 1 ? "vida restante" : "vidas restantes"}`, 0xd34b43);
    }
    this.emitHud(true);
  }

  private hitHazard(damage: number) {
    if (this.time.now < this.invulnerableUntil || this.ended || this.transitioning) return;
    const fallX = this.player.x;
    const consumedLife = this.damagePlayer(damage, fallX);
    // FIX: se a queda consumiu uma vida, o respawn (base + reset de inimigos)
    // ja realocou o player — nao sobrescrever com o checkpoint do fosso.
    if (!this.ended && !consumedLife) {
      this.player.setPosition(this.respawnX(fallX), 520).setVelocity(0, 0);
      this.cameras.main.flash(160, 120, 24, 24);
    }
  }

  private respawnX(fallX: number) {
    const checkpoints = this.config().checkpoints;
    // FIX respawn punitivo: nunca devolve o player mais longe que 300px do ponto da queda.
    const target = checkpoints.reduce((safeX, checkpoint) => checkpoint < fallX - 40 ? checkpoint : safeX, checkpoints[0]);
    return Math.max(target, fallX - 300);
  }

  private completeLevel() {
    if (this.transitioning || this.ended) return;
    this.transitioning = true;
    this.player?.setVelocityX(0);
    // Estatísticas desta fase alimentam o rank/pontuação no React.
    const stats: LevelClearStats = {
      kills: this.kills - this.levelStartKills,
      lives: this.lives,
      health: this.health,
    };
    if (this.level < MAX_LEVEL) {
      // Área intermediária: registra progresso e segue para a próxima.
      this.callbacks.onSignal({ type: "levelClear", level: this.level, stats });
      const next = LEVELS[this.level];
      this.showWorldMessage("AREA SEGURA", `${next.name} aguarda`, 0xd8c06a);
      this.player.setVelocity(0, 0);
      this.cameras.main.fadeOut(450, 5, 5, 10);
      const nextLevel: GameStartState = { level: this.level + 1, lives: this.lives, kills: this.kills, rewardedAt: this.rewardedAt };

      // React replaces the entire Phaser instance, avoiding browser-specific scene restart deadlocks.
      this.levelTransitionTimer = window.setTimeout(() => {
        this.levelTransitionTimer = null;
        this.callbacks.onSignal({ type: "nextLevel", state: nextLevel });
      }, 650);
    } else {
      // Última área: vitória final da campanha.
      this.ended = true;
      this.physics.pause();
      this.callbacks.onSound("victory");
      this.callbacks.onSignal({ type: "victory", level: this.level, lives: this.lives, kills: this.kills, stats });
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
    // FIX GC churn: comparação campo a campo em vez de JSON.stringify por frame.
    if (
      force ||
      data.health !== this.lastHudData.health ||
      data.lives !== this.lastHudData.lives ||
      data.kills !== this.lastHudData.kills ||
      data.enemies !== this.lastHudData.enemies ||
      data.level !== this.lastHudData.level ||
      data.shurikenReady !== this.lastHudData.shurikenReady
    ) {
      this.lastHudData = data;
      this.callbacks.onHud(data);
    }
  }

  private lastHudData: HudData = { health: -1, lives: -1, kills: -1, enemies: -1, level: -1, shurikenReady: true };

  private countLivingEnemies() {
    let count = 0;
    this.enemies?.getChildren().forEach((child) => {
      if (!(child as NinjaEnemy).dead) count += 1;
    });
    return count;
  }

  private spawnEnemies() {
    this.config().spawns.forEach(([x, y, rank]) => this.createEnemy(x, y, rank));
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
    enemy.homeY = y;
    enemy.calmUntil = 0;
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
    const cfg = this.config();
    cfg.ground.forEach(([x, y, width, height]) => this.addPlatform(x, y, width, height, true));
    cfg.ledges.forEach(([x, y, width, height]) => this.addPlatform(x, y, width, height, false));
    cfg.obstacles.forEach(([x, y, width, height]) => this.addObstacle(x, y, width, height));
    cfg.gaps.forEach(([x, width]) => this.addHazard(x, 712, width));
    this.drawWorldDetails();
  }

  private addPlatform(x: number, y: number, width: number, height: number, ground: boolean) {
    const palette = this.config().palette;
    const color = ground ? palette.ground : palette.ledge;
    const block = this.add.rectangle(x, y, width, height, color).setStrokeStyle(1, 0x48515b, 0.55).setDepth(10);
    this.platforms.add(block);
    const surfaceY = y - height / 2;
    const surfaceColor = palette.surface;
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
    const block = this.add.rectangle(x, y, width, height, this.config().palette.obstacle).setDepth(12) as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.StaticBody };
    block.setStrokeStyle(2, 0x7b5940, 0.8);
    // FIX softlock: caixas agora são "step-over" — sem colisão lateral o player
    // nunca fica empurrado contra/preso dentro da geometria; dá para subir nelas.
    this.platforms.add(block);
    block.body.checkCollision.left = false;
    block.body.checkCollision.right = false;
    this.add.line(x, y, -width / 2, -height / 2, width / 2, height / 2, 0x8a6447, 0.65).setOrigin(0.5).setDepth(13);
    this.add.line(x, y, width / 2, -height / 2, -width / 2, height / 2, 0x8a6447, 0.65).setOrigin(0.5).setDepth(13);
  }

  private addHazard(x: number, y: number, width: number) {
    const zone = this.add.rectangle(x, y - 48, width, 90, 0xff0000, 0);
    this.hazards.add(zone);
    this.add.rectangle(x, 670, width + 4, 100, this.config().palette.pit, 0.96).setDepth(8);
    for (let offset = -width / 2 + 6; offset <= width / 2 - 6; offset += 13) {
      this.add.triangle(x + offset, 644, 0, 31, 8, 0, 16, 31, 0x8b9298).setDepth(12);
    }
    const warningGlow = this.add.ellipse(x, 680, width, 13, this.config().palette.pitGlow, 0.11).setDepth(9);
    this.tweens.add({ targets: warningGlow, alpha: 0.25, scaleX: 0.82, yoyo: true, repeat: -1, duration: 1250 });
  }

  private drawBackdrop() {
    const palette = this.config().palette;
    palette.sky.forEach((color, index) => {
      this.add.rectangle(640, 60 + index * 120, 1280, 122, color).setScrollFactor(0).setDepth(-30);
    });
    const moonX = palette.moonX;
    const moonColor = palette.moonColor;
    this.add.circle(moonX, 145, palette.moonRadius, moonColor, 0.08).setScrollFactor(0).setDepth(-28);
    this.add.circle(moonX, 145, Math.round(palette.moonRadius * 0.75), moonColor, 0.84).setScrollFactor(0).setDepth(-27);
    this.add.circle(moonX + 18, 130, 9, 0x8e8878, 0.16).setScrollFactor(0).setDepth(-26);
    this.add.circle(moonX - 19, 162, 6, 0x8e8878, 0.13).setScrollFactor(0).setDepth(-26);

    const random = new Phaser.Math.RandomDataGenerator([`level-${this.level}`]);
    for (let index = 0; index < 56; index += 1) {
      this.add.circle(random.between(5, 1275), random.between(24, 330), random.realInRange(0.5, 1.4), 0xe8e1cf, random.realInRange(0.2, 0.7))
        .setScrollFactor(0).setDepth(-25);
    }
    this.add.polygon(480, 420, [0, 220, 230, 30, 390, 170, 570, 0, 820, 220], 0x090e17, 0.85).setScrollFactor(0.08).setDepth(-22);
    this.add.polygon(910, 470, [0, 180, 190, 20, 330, 135, 520, 0, 750, 180], 0x0c1118, 0.94).setScrollFactor(0.16).setDepth(-21);
    this.add.rectangle(640, 590, 1280, 230, palette.haze, 0.76).setScrollFactor(0).setDepth(-19);
    this.drawCloudBank(random, palette.cloud);
    this.drawSilhouetteTemple(palette.templeX, palette.temple);
  }

  private drawCloudBank(random: Phaser.Math.RandomDataGenerator, cloudColor: number) {
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

  private drawSilhouetteTemple(x: number, color: number) {
    const depth = -17;
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
    const cfg = this.config();
    const palette = cfg.palette;
    cfg.lanterns.forEach((x, index) => {
      this.add.rectangle(x, 520, 7, 200, 0x211b18).setDepth(3);
      this.add.rectangle(x, 445, 40, 34, palette.lanternBody, 0.9).setStrokeStyle(2, 0x1b1210).setDepth(4);
      const glow = this.add.circle(x, 445, 34, palette.lanternGlow, 0.08).setDepth(2);
      this.tweens.add({ targets: glow, alpha: 0.18, scale: 1.18, yoyo: true, repeat: -1, duration: 1300 + index * 120 });
    });
    for (let x = 80; x < this.worldWidth; x += 420) {
      this.add.rectangle(x, 475, 13, 310, palette.bamboo).setRotation(indexedLean(x)).setDepth(1);
      for (let y = 365; y < 590; y += 48) this.add.rectangle(x + 2, y, 18, 3, palette.bambooLeaf, 0.55).setDepth(2);
    }
    cfg.toriis.forEach((x) => this.drawToriiGate(x, palette.torii));
    for (let x = 190; x < this.worldWidth; x += 330) this.drawGrassTuft(x, 614, palette.grass);
  }

  private drawToriiGate(x: number, color: number) {
    this.add.rectangle(x - 48, 515, 11, 205, color).setDepth(4);
    this.add.rectangle(x + 48, 515, 11, 205, color).setDepth(4);
    this.add.rectangle(x, 418, 138, 12, color).setDepth(4);
    this.add.rectangle(x, 438, 112, 8, 0x140e0f).setDepth(4);
    this.add.triangle(x - 77, 414, 0, 8, 16, 0, 16, 8, color).setDepth(4);
    this.add.triangle(x + 77, 414, 0, 0, 16, 8, 0, 8, color).setDepth(4);
  }

  private drawGrassTuft(x: number, y: number, color: number) {
    for (let offset = -12; offset <= 12; offset += 6) {
      this.add.line(x + offset, y, 0, 0, offset / 2, -Phaser.Math.Between(12, 28), color, 0.55)
        .setOrigin(0.5, 1).setDepth(13);
    }
  }

  private showWorldMessage(title: string, subtitle: string, color: number) {
    // FIX código morto: mensagem sempre centralizada no viewport (scrollFactor 0).
    const titleText = this.add.text(640, 250, title, {
      fontFamily: "Arial Black, sans-serif", fontSize: "34px", color: `#${color.toString(16).padStart(6, "0")}`,
      stroke: "#08090d", strokeThickness: 7, letterSpacing: 4,
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
    const subText = this.add.text(640, 294, subtitle.toUpperCase(), {
      fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#d7d5ce", letterSpacing: 3,
    }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
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
      () => this.registerDetailedSheet("player-movement-source", "player-movement-sheet"),
      () => this.registerDetailedSheet("player-sword-source", "player-sword-sheet"),
      () => this.registerDetailedSheet("player-techniques-source", "player-techniques-sheet"),
      ...ENEMY_TYPES.map((_enemy, rank) => () => this.registerDetailedSheet(enemySourceKey(rank), enemyTextureKey(rank))),
    ];

    // Uma folha por tick evita um pico unico de GPU/upload na main thread.
    tasks.forEach((task, index) => {
      this.time.delayedCall(index * 90, () => {
        try {
          task();
          this.createAnimations();
          this.upgradeActiveSprites();
        } catch {
          // Cada folha tem fallback procedural independente.
        }
      });
    });
  }

  /**
   * FIX jank: assets processados pelo pipeline offline (scripts/process_spritesheets.py)
   * ja tem alpha real e entram direto na TextureManager — sem flood-fill de 1,5M px
   * travando o gameplay apos o inicio da partida. Sheets legados (xadrez falso)
   * ainda sao detectados e passam pelo caminho lento automaticamente.
   */
  private registerDetailedSheet(sourceKey: string, targetKey: string) {
    if (this.textures.exists(targetKey) || !this.textures.exists(sourceKey)) return;
    const source = this.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
    const width = source.naturalWidth || source.width;
    const height = source.naturalHeight || source.height;
    if (!width || !height) return;
    if (this.sheetNeedsMatteRemoval(source, width, height)) {
      this.createTransparentSheet(sourceKey, targetKey);
      return;
    }
    const texture = this.textures.addImage(targetKey, source);
    if (!texture) return;
    this.addSheetFrames(texture, width, height);
  }

  /** Amostra os 4 cantos: alpha real ou cinza-claro (matte) decidem o caminho. */
  private sheetNeedsMatteRemoval(source: HTMLImageElement, width: number, height: number): boolean {
    const probe = document.createElement("canvas");
    probe.width = 2;
    probe.height = 2;
    const context = probe.getContext("2d", { willReadFrequently: true });
    if (!context) return false;
    const corners: Array<[number, number]> = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];
    for (const [x, y] of corners) {
      context.clearRect(0, 0, 2, 2);
      context.drawImage(source, x, y, 1, 1, 0, 0, 1, 1);
      const data = context.getImageData(0, 0, 1, 1).data;
      if (data[3] < 10) return false;
      const brightest = Math.max(data[0], data[1], data[2]);
      const darkest = Math.min(data[0], data[1], data[2]);
      if (!(darkest > 175 && brightest - darkest < 26)) return false;
    }
    return true;
  }

  private addSheetFrames(texture: Phaser.Textures.Texture, width: number, height: number) {
    const frameWidth = Math.floor(width / 4);
    const frameHeight = Math.floor(height / 4);
    for (let frame = 0; frame < 16; frame += 1) {
      texture.add(String(frame), 0, (frame % 4) * frameWidth, Math.floor(frame / 4) * frameHeight, frameWidth, frameHeight);
    }
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
    if (!this.player?.active || this.playerUpgraded) {
      // fallback de recuperação: textura detalhada aplicada sem o scale correto
      // (estado impossível no fluxo novo, mas protege contra corridas antigas).
      if (this.playerUpgraded && this.player?.active && Math.abs(this.player.scaleX - 0.34) > 0.01 && this.player.texture.key === "player-movement-sheet") {
        this.player.setScale(0.34);
        (this.player.body as Phaser.Physics.Arcade.Body).setSize(82, 174).setOffset(87, 50);
      }
    }
    // FIX pop visual + sprite gigante: a troca só acontece em momento seguro
    // (no chão, sem ataque) e o retry acontece no update() ate conseguir —
    // nunca aplica frame detalhado em quem ainda tem scale de sprite procedural.
    const body = this.player?.body as Phaser.Physics.Arcade.Body | undefined;
    const safeMoment = !this.attacking && !this.transitioning && Boolean(body?.blocked.down || body?.touching.down);
    if (safeMoment && !this.playerUpgraded && this.textures.exists("player-movement-sheet")) {
      this.playerUpgraded = true;
      this.attacking = true;
      this.tweens.add({
        targets: this.player,
        alpha: 0,
        duration: 90,
        onComplete: () => {
          if (!this.player?.active) return;
          this.player.setTexture("player-movement-sheet", "0").setScale(0.34).setAlpha(1).play("player-idle");
          (this.player.body as Phaser.Physics.Arcade.Body).setSize(82, 174).setOffset(87, 50);
          this.tweens.add({ targets: this.player, alpha: 1, duration: 90, onComplete: () => { this.attacking = false; } });
        },
      });
    }
    this.enemies?.getChildren().forEach((child) => {
      const enemy = child as NinjaEnemy;
      const archetype = ENEMY_TYPES[enemy.rank];
      const textureKey = enemyTextureKey(enemy.rank);
      if (!enemy.active || !this.textures.exists(textureKey) || enemy.texture.key === textureKey) return;
      if (this.time.now < enemy.attackingUntil) return;
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
    this.addSheetFrames(texture, width, height);
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