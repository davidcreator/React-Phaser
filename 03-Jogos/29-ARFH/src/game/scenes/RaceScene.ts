import Phaser from 'phaser';
import type { CarDefinition, MonsterKind, StageDefinition } from '../content';
import { isTouchActionActive, type GameAction, type KeyBindings } from '../input';
import { createStageLayout, type MonsterLayout, type ObstacleLayout, type PickupLayout, type RampLayout } from '../stageLayout';
import type { RaceCallbacks, RaceOutcome, RaceResult } from '../types';
import { MONSTER_SPRITES } from '../monsters/registry';
import { STAGE_TILESETS } from '../tilesets/registry';
import type { UpgradeLevels } from '../upgrades';

const VIEW_WIDTH = 1280;
const VIEW_HEIGHT = 720;
const ROAD_Y_BASE = 520;
const CAR_HALF_HEIGHT = 27;
const FIXED_STEP = 1 / 60;
const MONSTER_SCORE = 500;
const SCRAP_PICKUP_VALUE = 20;
const COMPLETION_SCRAP_BONUS = 45;

interface Projectile { x: number; y: number; damage: number }

interface VehicleState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  grounded: boolean;
}

const MONSTER_STYLE: Record<MonsterKind, { name: string; body: number; light: number; accent: number }> = {
  walker: { name: 'Errante', body: 0x536b55, light: 0x82926b, accent: 0xe3c967 },
  runner: { name: 'Corredor', body: 0x5f6558, light: 0x909178, accent: 0xe8d46e },
  leaper: { name: 'Saltador', body: 0x596c65, light: 0x91a99a, accent: 0xf0d279 },
  armored: { name: 'Blindado', body: 0x625d4c, light: 0x99906b, accent: 0xf0c75e },
};

export class RaceScene extends Phaser.Scene {
  private readonly callbacks: RaceCallbacks;
  private readonly bindings: KeyBindings;
  private readonly upgrades: UpgradeLevels;
  private readonly stage: StageDefinition;
  private readonly vehicle: CarDefinition;
  private readonly ramps: RampLayout[];
  private readonly pickups: PickupLayout[];
  private readonly obstacles: ObstacleLayout[];
  private readonly monsters: MonsterLayout[];

  private get worldWidth(): number { return this.stage.length; }
  private get finishX(): number { return this.stage.length - 230; }
  private get damageMultiplier(): number { return Math.max(0.25, 1 - this.vehicle.armor - this.upgrades.bumper * 0.16); }
  private readonly car: VehicleState = {
    x: 100,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVelocity: 0,
    grounded: true,
  };

  private keys!: Record<GameAction, Phaser.Input.Keyboard.Key[]>;
  private carGraphic: Phaser.GameObjects.Graphics | null = null;
  private carSprite: Phaser.GameObjects.Sprite | null = null;
  private trackGraphic!: Phaser.GameObjects.Graphics;
  private pickupGraphic!: Phaser.GameObjects.Graphics;
  private monsterGraphic!: Phaser.GameObjects.Graphics;
  private monsterHealthGraphic!: Phaser.GameObjects.Graphics;
  private projectileGraphic!: Phaser.GameObjects.Graphics;
  private readonly monsterSprites = new Map<MonsterLayout, Phaser.GameObjects.Sprite>();
  private readonly projectiles: Projectile[] = [];
  private hudGraphic!: Phaser.GameObjects.Graphics;
  private hudStats!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private accumulator = 0;
  private elapsed = 0;
  private fuel = 100;
  private fuelCapacity = 100;
  private condition = 100;
  private nitro = 100;
  private ammoCapacity = 26;
  private ammo = 26;
  private fireCooldown = 0;
  private emptyAmmoCooldown = 0;
  private muzzleFlash = 0;
  private shieldTimer = 0;
  private scrap = 0;
  private score = 0;
  private jumps = 0;
  private tricks = 0;
  private monsterKills = 0;
  private airTime = 0;
  private airStartAngle = 0;
  private airRotation = 0;
  private hornWasDown = false;
  private hornPulse = 0;
  private feedbackTimer = 0;
  private feedback = 'Acelere e controle a inclinação nas rampas.';
  private completed = false;

  private get carTextureKey(): string { return `car-${this.vehicle.id}`; }

  constructor(callbacks: RaceCallbacks, bindings: KeyBindings, upgrades: UpgradeLevels, stage: StageDefinition, vehicle: CarDefinition) {
    super({ key: 'RaceScene' });
    this.callbacks = callbacks;
    this.bindings = bindings;
    this.upgrades = upgrades;
    this.stage = stage;
    this.vehicle = vehicle;
    const layout = createStageLayout(stage);
    this.ramps = layout.ramps;
    this.pickups = layout.pickups;
    this.obstacles = layout.obstacles;
    this.monsters = layout.monsters;
  }

  preload(): void {
    this.load.spritesheet(
      this.carTextureKey,
      `/assets/sprites/cars/${this.vehicle.id}.png`,
      { frameWidth: 96, frameHeight: 80 },
    );

    const tileset = STAGE_TILESETS[this.stage.id];
    this.load.spritesheet(tileset.key, tileset.url, {
      frameWidth: tileset.frameWidth,
      frameHeight: tileset.frameHeight,
    });
    for (const sheet of Object.values(MONSTER_SPRITES)) {
      this.load.spritesheet(sheet.key, sheet.url, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    }
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, this.worldWidth, VIEW_HEIGHT);
    this.fuelCapacity = this.vehicle.fuelCapacity + this.upgrades.tank * 40;
    this.fuel = this.fuelCapacity;
    this.ammoCapacity = 26 + this.upgrades.weapon * 10;
    this.ammo = this.ammoCapacity;
    this.drawBackground();
    this.drawStageTilesetScenery();
    this.drawTrack();
    this.drawStaticProps();

    this.car.y = this.roadY(this.car.x) - CAR_HALF_HEIGHT;
    if (this.textures.exists(this.carTextureKey)) {
      this.textures.get(this.carTextureKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
      this.carSprite = this.add.sprite(this.car.x, this.car.y, this.carTextureKey, 0)
        .setOrigin(0.5, 0.5875)
        .setDepth(12);
    } else {
      // Fallback vetorial mantém o carro visível se um arquivo de spritesheet falhar ao carregar.
      this.carGraphic = this.add.graphics().setDepth(12);
      this.drawCar();
    }

    this.pickupGraphic = this.add.graphics().setDepth(8);
    this.monsterGraphic = this.add.graphics().setDepth(8.8);
    this.monsterHealthGraphic = this.add.graphics().setDepth(10);
    this.prepareMonsterSprites();
    this.projectileGraphic = this.add.graphics().setDepth(14);
    this.hudGraphic = this.add.graphics().setScrollFactor(0).setDepth(100);
    this.hudStats = this.add.text(42, 34, '', {
      color: '#f2f0e6',
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      lineSpacing: 4,
    }).setScrollFactor(0).setDepth(101);
    this.feedbackText = this.add.text(640, 30, '', {
      color: '#bde9da',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      align: 'center',
      backgroundColor: '#16201ed9',
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);

    this.createKeyboardMap();
    this.input.keyboard?.addCapture([
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.J,
    ]);

    this.add.text(24, VIEW_HEIGHT - 36, `${this.stage.code}  •  ${this.stage.name.toUpperCase()}  /  ${this.vehicle.name.toUpperCase()}`, {
      color: '#eef0df',
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setScrollFactor(0).setDepth(101);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.updateHud();
  }

  update(_time: number, delta: number): void {
    if (this.completed) return;

    this.accumulator += Math.min(delta / 1000, 0.1);
    while (this.accumulator >= FIXED_STEP) {
      this.simulate(FIXED_STEP);
      this.accumulator -= FIXED_STEP;
      if (this.completed) break;
    }
    if (this.completed) return;

    if (this.carSprite) {
      this.carSprite.setPosition(this.car.x, this.car.y).setRotation(this.car.angle);
      const wheelFrameRate = Phaser.Math.Clamp(this.car.vx / 65, 1.2, 8);
      this.carSprite.setFrame(this.car.vx > 12 ? Math.floor(this.elapsed * wheelFrameRate) % 4 : 0);
    } else {
      this.carGraphic?.setPosition(this.car.x, this.car.y).setRotation(this.car.angle);
    }
    this.cameras.main.scrollX = Phaser.Math.Clamp(this.car.x - 300, 0, this.worldWidth - VIEW_WIDTH);
    this.drawPickups();
    this.drawMonsters();
    this.drawProjectiles();
    this.updateHud();
  }

  private createKeyboardMap(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      this.keys = {
        accelerate: [], brake: [], tiltLeft: [], tiltRight: [], nitro: [], horn: [], fire: [],
      };
      return;
    }

    const aliases: Record<string, string> = {
      ArrowUp: 'UP',
      ArrowDown: 'DOWN',
      ArrowLeft: 'LEFT',
      ArrowRight: 'RIGHT',
      Space: 'SPACE',
      Shift: 'SHIFT',
    }; 
    const keyCodes = Phaser.Input.Keyboard.KeyCodes as unknown as Record<string, number>;
    const resolveCode = (key: string): number | undefined => {
      const code = keyCodes[aliases[key] ?? key.toUpperCase()];
      return Number.isInteger(code) ? code : undefined;
    };
    const arrows: Record<GameAction, number[]> = {
      accelerate: [Phaser.Input.Keyboard.KeyCodes.UP],
      brake: [Phaser.Input.Keyboard.KeyCodes.DOWN],
      tiltLeft: [Phaser.Input.Keyboard.KeyCodes.LEFT],
      tiltRight: [Phaser.Input.Keyboard.KeyCodes.RIGHT],
      nitro: [],
      horn: [],
      fire: [],
    };
    const bind = (action: GameAction): Phaser.Input.Keyboard.Key[] => {
      const configured = resolveCode(this.bindings[action]);
      const codes = [...new Set([configured, ...arrows[action]].filter((code): code is number => typeof code === 'number'))];
      return codes.map((code) => keyboard.addKey(code));
    };

    this.keys = {
      accelerate: bind('accelerate'),
      brake: bind('brake'),
      tiltLeft: bind('tiltLeft'),
      tiltRight: bind('tiltRight'),
      nitro: bind('nitro'),
      horn: bind('horn'),
      fire: bind('fire'),
    };
  }

  private pressed(action: GameAction): boolean {
    return isTouchActionActive(action) || this.keys[action].some((key) => key.isDown);
  }

  private simulate(dt: number): void {
    this.elapsed += dt;
    this.hornPulse = Math.max(0, this.hornPulse - dt);
    this.feedbackTimer = Math.max(0, this.feedbackTimer - dt);
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.emptyAmmoCooldown = Math.max(0, this.emptyAmmoCooldown - dt);
    this.muzzleFlash = Math.max(0, this.muzzleFlash - dt);
    this.shieldTimer = Math.max(0, this.shieldTimer - dt);

    const accelerating = this.pressed('accelerate') && this.fuel > 0;
    const braking = this.pressed('brake');
    const leaningLeft = this.pressed('tiltLeft');
    const leaningRight = this.pressed('tiltRight');
    const usingNitro = this.pressed('nitro');
    const hornDown = this.pressed('horn');
    const fireDown = this.pressed('fire');

    if (hornDown && !this.hornWasDown) this.activateHorn();
    this.hornWasDown = hornDown;
    if (fireDown && this.fireCooldown <= 0) this.fireWeapon();

    const previousX = this.car.x;
    const enginePower = this.vehicle.acceleration * (1 + this.upgrades.engine * 0.1);
    const maxSpeed = this.vehicle.topSpeed + this.upgrades.engine * 20;
    if (accelerating) this.car.vx += enginePower * dt;
    else this.car.vx -= 34 * dt;
    if (braking) this.car.vx -= 640 * dt;

    if (usingNitro && this.nitro > 0 && this.fuel > 0) {
      this.car.vx += 265 * dt;
      this.nitro = Math.max(0, this.nitro - 42 * dt);
      this.fuel = Math.max(0, this.fuel - 0.38 * this.stage.fuelBurnMultiplier * this.vehicle.fuelBurnMultiplier * dt);
    } else {
      this.nitro = Math.min(100, this.nitro + 13 * dt);
    }

    const rollingLoss = Math.max(0.11, this.vehicle.rollingLoss * this.stage.roughness - this.upgrades.tires * 0.025);
    this.car.vx = Phaser.Math.Clamp(this.car.vx, 0, maxSpeed);
    this.car.vx *= Math.max(0, 1 - rollingLoss * dt);
    if (this.car.vx > 15) {
      const consumption = (0.47 + this.car.vx / 720) * this.stage.fuelBurnMultiplier * this.vehicle.fuelBurnMultiplier;
      this.fuel = Math.max(0, this.fuel - consumption * dt);
    }
    this.car.x += this.car.vx * dt;

    for (const ramp of this.ramps) {
      if (!ramp.used && previousX < ramp.x && this.car.x >= ramp.x && this.car.grounded && this.car.vx > 150) {
        ramp.used = true;
        this.car.grounded = false;
        this.airTime = 0;
        this.airStartAngle = this.car.angle;
        this.airRotation = 0;
        this.car.vy = -395 - ramp.height * 1.85;
        this.car.angularVelocity = 0;
        this.setFeedback('SALTO! Incline no ar para tentar uma manobra.', 1.6);
      }
    }

    if (this.car.grounded) {
      const slope = Math.atan((this.roadY(this.car.x + 8) - this.roadY(this.car.x - 8)) / 16);
      const targetAngle = Phaser.Math.Clamp(slope, -0.24, 0.24);
      this.car.angle += (targetAngle - this.car.angle) * Math.min(1, dt * 7);
      this.car.y = this.roadY(this.car.x) - CAR_HALF_HEIGHT;
    } else {
      this.airTime += dt;
      const turn = Number(leaningRight) - Number(leaningLeft);
      const airControl = this.vehicle.airControl + this.upgrades.suspension * 0.85;
      this.car.angularVelocity += turn * airControl * dt;
      this.car.angularVelocity *= Math.pow(0.99, dt * 60);
      this.car.angle += this.car.angularVelocity * dt;
      this.airRotation = this.car.angle - this.airStartAngle;
      this.car.vy += 760 * dt;
      this.car.y += this.car.vy * dt;
      const landingY = this.roadY(this.car.x) - CAR_HALF_HEIGHT;
      if (this.car.y >= landingY && this.car.vy > 0) this.landJump(landingY);
    }

    this.updateProjectiles(dt);
    this.checkPickups();
    this.checkObstacles();
    this.checkMonsters();
    if (this.completed) return;

    if (this.fuel <= 0 && this.car.vx < 35) {
      this.finishRace('failure', `O combustível acabou antes de alcançar ${this.stage.name}.`);
      return;
    }
    if (this.condition <= 0) {
      this.finishRace('failure', 'O veículo quebrou com o dano acumulado. A sucata recuperada continua disponível na oficina.');
      return;
    }
    if (this.car.x >= this.finishX) this.finishRace('success');
  }

  private landJump(landingY: number): void {
    const orientation = Phaser.Math.Angle.Wrap(this.car.angle);
    const impactSpeed = Math.abs(this.car.vy);
    const fullTurns = Math.floor((Math.abs(this.airRotation) + 0.35) / (Math.PI * 2));
    const safeAngle = this.vehicle.landingTolerance + this.upgrades.suspension * 0.11;
    const wheelsOnGround = Math.abs(orientation) <= safeAngle;
    const overturned = Math.abs(orientation) > Math.PI * 0.58;
    this.jumps += 1;

    const airtimePoints = 100 + Math.round(Math.min(this.airTime, 3) * 70);
    const landingPoints = wheelsOnGround ? 100 : 0;
    const trickCount = wheelsOnGround ? Math.min(3, fullTurns) : 0;
    const trickPoints = trickCount * 500;
    const jumpPoints = airtimePoints + landingPoints + trickPoints;
    this.score += jumpPoints;
    this.tricks += trickCount;

    this.car.y = landingY;
    this.car.vy = 0;
    this.car.grounded = true;
    this.car.angularVelocity = 0;
    // A recuperação arcade recoloca o carro sobre as rodas, mas não apaga o dano do impacto.
    this.car.angle = wheelsOnGround ? orientation : 0;

    if (!wheelsOnGround) {
      const landingDamage = 13 + Math.min(15, Math.round(impactSpeed * 0.018)) + (overturned ? 15 : 0);
      this.car.vx *= overturned ? 0.52 : 0.68;
      const damage = this.applyDamage(landingDamage);
      this.setFeedback(
        damage === 0
          ? 'O escudo absorveu o impacto do capotamento/pouso ruim; carro recuperado sobre as rodas.'
          : overturned
            ? `Capotamento! ${damage} de dano ao carro; recuperação sobre as rodas.`
            : `Pouso sem as rodas no chão · ${damage} de dano ao carro.`,
        2,
      );
    } else if (trickCount > 0) {
      this.setFeedback(`Manobra limpa! ${trickCount} cambalhota${trickCount > 1 ? 's' : ''} · +${jumpPoints} pontos.`, 1.8);
    } else {
      this.setFeedback(`Salto limpo · +${jumpPoints} pontos.`, 1.5);
    }
    this.showScorePopup(this.car.x, this.car.y - 55, jumpPoints, trickCount > 0 ? 'MANOBRA' : 'SALTO');
  }

  private roadY(x: number): number {
    return ROAD_Y_BASE + Math.sin(x / 190) * 18 + Math.sin(x / 470) * 15 + Math.sin(x / 92) * 3;
  }

  private prepareMonsterSprites(): void {
    for (const sheet of Object.values(MONSTER_SPRITES)) {
      if (this.textures.exists(sheet.key)) {
        this.textures.get(sheet.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }

    for (const monster of this.monsters) {
      const sheet = MONSTER_SPRITES[monster.kind];
      if (!this.textures.exists(sheet.key)) continue;
      const sprite = this.add.sprite(0, 0, sheet.key, 0)
        .setOrigin(0.5, 0.52)
        .setDepth(9)
        .setVisible(false);
      this.monsterSprites.set(monster, sprite);
    }
  }

  private drawStageTilesetScenery(): void {
    const tileset = STAGE_TILESETS[this.stage.id];
    if (!this.textures.exists(tileset.key)) return;
    this.textures.get(tileset.key).setFilter(Phaser.Textures.FilterMode.NEAREST);

    // The atlas remains independently editable in Tiled; these landmark cells
    // are only a light parallax pass behind the road and gameplay props.
    const parallax = 0.36;
    const count = 54;
    const visibleWorldSpan = this.worldWidth * parallax;
    const step = visibleWorldSpan / (count + 1);
    for (let index = 0; index < count; index += 1) {
      const frame = tileset.backdropFrames[(index * 5 + Math.floor(index / 3)) % tileset.backdropFrames.length];
      const x = step * (index + 1);
      const y = 432 + Math.sin(index * 1.73) * 31 + (index % 3) * 5;
      this.add.image(x, y, tileset.key, frame)
        .setOrigin(0.5, 1)
        .setScale(4)
        .setScrollFactor(parallax, 1)
        .setDepth(-4);
    }
  }

  private drawBackground(): void {
    const palette = this.stage.palette;
    const sky = this.add.graphics().setDepth(-30);
    sky.fillStyle(palette.sky, 1).fillRect(0, 0, this.worldWidth, VIEW_HEIGHT);
    sky.fillStyle(palette.near, 0.12).fillRect(0, 0, this.worldWidth, VIEW_HEIGHT);
    for (const sunX of [this.worldWidth * 0.18, this.worldWidth * 0.51, this.worldWidth * 0.82]) {
      sky.fillStyle(0xdab96f, 0.13).fillCircle(sunX, 142, 86);
      sky.fillStyle(0xe3d7ad, 0.54).fillCircle(sunX, 142, 48);
    }

    const distant = this.add.graphics().setDepth(-20);
    distant.fillStyle(palette.distant, 1);
    distant.beginPath();
    distant.moveTo(0, 425);
    for (let x = 0; x <= this.worldWidth; x += 170) {
      distant.lineTo(x + 85, 280 + Math.sin(x / 380) * 35);
      distant.lineTo(x + 170, 425 + Math.sin(x / 160) * 12);
    }
    distant.lineTo(this.worldWidth, VIEW_HEIGHT);
    distant.lineTo(0, VIEW_HEIGHT);
    distant.closePath();
    distant.fillPath();

    const near = this.add.graphics().setDepth(-10);
    near.fillStyle(palette.near, 0.78);
    near.beginPath();
    near.moveTo(0, 472);
    for (let x = 0; x <= this.worldWidth; x += 220) {
      near.lineTo(x + 110, 367 + Math.sin(x / 210) * 22);
      near.lineTo(x + 220, 472 + Math.sin(x / 330) * 15);
    }
    near.lineTo(this.worldWidth, VIEW_HEIGHT);
    near.lineTo(0, VIEW_HEIGHT);
    near.closePath();
    near.fillPath();

    const silhouettes = this.add.graphics().setDepth(-5);
    const spacing = this.stage.theme === 'urban' ? 520 : 680;
    for (let x = 180; x < this.worldWidth; x += spacing) {
      const variant = Math.floor(x / spacing) % 4;
      if (this.stage.theme === 'urban') {
        const height = 65 + variant * 19;
        silhouettes.fillStyle(palette.silhouettes, 0.76);
        silhouettes.fillRect(x, 445 - height, 54 + (variant % 2) * 17, height + 75);
        silhouettes.fillRect(x + 68, 423 - (variant % 3) * 13, 24, 101 + variant * 9);
        silhouettes.fillStyle(palette.marking, 0.35);
        silhouettes.fillRect(x + 11, 394 - height / 2, 7, 9);
        silhouettes.fillRect(x + 34, 418 - height / 2, 7, 9);
      } else if (this.stage.theme === 'bridge') {
        silhouettes.fillStyle(palette.silhouettes, 0.76);
        silhouettes.fillRect(x + 22, 342, 12, 143);
        silhouettes.fillRect(x + 8, 348, 41, 7);
        silhouettes.fillRect(x + 75, 373, 12, 112);
        silhouettes.fillRect(x + 61, 379, 42, 7);
        silhouettes.lineStyle(9, palette.silhouettes, 0.75);
        silhouettes.beginPath();
        silhouettes.moveTo(x - 20, 348 + variant * 3);
        silhouettes.lineTo(x + 11, 348 + variant * 3);
        silhouettes.moveTo(x + 43, 354 + variant * 5);
        silhouettes.lineTo(x + 78, 372 + variant * 4);
        silhouettes.strokePath();
      } else if (this.stage.theme === 'quarry') {
        silhouettes.fillStyle(palette.silhouettes, 0.78);
        silhouettes.fillTriangle(x - 15, 468, x + 47, 366 + variant * 13, x + 112, 468);
        silhouettes.fillTriangle(x + 66, 468, x + 115, 403 + variant * 10, x + 171, 468);
        silhouettes.fillStyle(palette.marking, 0.32);
        silhouettes.fillRect(x + 45, 432, 38, 5);
      } else {
        silhouettes.fillStyle(palette.silhouettes, 0.78);
        silhouettes.fillRect(x + 27, 381 + variant * 8, 13, 105);
        silhouettes.fillCircle(x + 33, 369 + variant * 8, 34 + (variant % 2) * 8);
        silhouettes.fillRect(x + 101, 402 + (variant % 3) * 8, 11, 84);
        silhouettes.fillCircle(x + 106, 394 + (variant % 3) * 8, 28);
      }
    }
  }

  private drawTrack(): void {
    const palette = this.stage.palette;
    const ground = this.add.graphics().setDepth(0);
    ground.fillStyle(palette.ground, 1);
    ground.beginPath();
    ground.moveTo(0, this.roadY(0));
    for (let x = 0; x <= this.worldWidth; x += 12) ground.lineTo(x, this.roadY(x));
    ground.lineTo(this.worldWidth, VIEW_HEIGHT + 100);
    ground.lineTo(0, VIEW_HEIGHT + 100);
    ground.closePath();
    ground.fillPath();

    const asphalt = this.add.graphics().setDepth(1);
    asphalt.lineStyle(42, palette.asphalt, 1);
    asphalt.beginPath();
    asphalt.moveTo(0, this.roadY(0));
    for (let x = 0; x <= this.worldWidth; x += 12) asphalt.lineTo(x, this.roadY(x));
    asphalt.strokePath();

    const markings = this.add.graphics().setDepth(2);
    markings.lineStyle(3, palette.marking, 0.68);
    for (let x = 30; x < this.worldWidth; x += 132) {
      markings.beginPath();
      markings.moveTo(x, this.roadY(x));
      markings.lineTo(x + 50, this.roadY(x + 50));
      markings.strokePath();
    }

    const finish = this.add.graphics().setDepth(4);
    const finishX = this.worldWidth - 245;
    const finishY = this.roadY(finishX);
    finish.fillStyle(0xf2b347, 1);
    finish.fillRect(finishX - 5, finishY - 190, 10, 190);
    finish.fillRect(finishX + 75, finishY - 190, 10, 190);
    finish.fillStyle(0xf3eee0, 1);
    finish.fillRect(finishX - 5, finishY - 190, 85, 18);
    finish.fillStyle(0x27312e, 1);
    finish.fillRect(finishX + 37, finishY - 190, 43, 18);
    finish.fillRect(finishX - 5, finishY - 172, 42, 18);
    this.add.text(finishX + 37, finishY - 202, this.stage.shortName, {
      color: '#27312e',
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5, 1).setDepth(5);
  }

  private drawStaticProps(): void {
    const props = this.add.graphics().setDepth(5);
    const palette = this.stage.palette;
    for (const ramp of this.ramps) {
      const y = this.roadY(ramp.x);
      props.fillStyle(palette.ramp, 1);
      props.fillTriangle(ramp.x - 35, y - 10, ramp.x + 82, y - ramp.height, ramp.x + 75, y + 10);
      props.lineStyle(3, palette.marking, 0.8);
      props.beginPath();
      props.moveTo(ramp.x - 30, y - 12);
      props.lineTo(ramp.x + 75, y - ramp.height);
      props.strokePath();
    }

    for (const obstacle of this.obstacles) {
      const y = this.roadY(obstacle.x);
      props.fillStyle(0x6e7770, 1);
      props.fillRoundedRect(obstacle.x - 26, y - 19, 52, 17, 4);
      props.fillStyle(palette.marking, 1);
      props.fillRect(obstacle.x - 18, y - 17, 12, 4);
      props.fillRect(obstacle.x + 6, y - 17, 12, 4);
    }

    const routeSigns = [
      { x: this.worldWidth * 0.09, label: this.stage.region.toUpperCase() },
      { x: this.worldWidth * 0.36, label: `ROTA ${this.stage.code}` },
      { x: this.worldWidth * 0.67, label: this.stage.shortName },
      { x: this.worldWidth * 0.88, label: 'EVACUAÇÃO' },
    ];
    for (const sign of routeSigns) {
      const signY = this.roadY(sign.x);
      props.fillStyle(palette.silhouettes, 1);
      props.fillRect(sign.x, signY - 118, 8, 118);
      props.fillStyle(palette.marking, 1);
      props.fillRoundedRect(sign.x - 47, signY - 146, 120, 36, 5);
      props.fillStyle(palette.asphalt, 1);
      this.add.text(sign.x + 13, signY - 128, sign.label, {
        color: '#202a26',
        fontFamily: 'Arial, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5, 0.5).setDepth(6);
    }
  }

  private drawCar(): void {
    const graphic = this.carGraphic;
    if (!graphic) return;
    const paint = this.vehicle.paint;
    const glass = this.vehicle.glass;
    const trim = this.vehicle.trim;
    const rearWheel = this.vehicle.bodyStyle === 'rescue' ? -30 : -25;
    const frontWheel = this.vehicle.bodyStyle === 'van' ? 27 : 25;

    graphic.clear();
    graphic.fillStyle(0x202725, 1);
    graphic.fillCircle(rearWheel, 17, this.vehicle.bodyStyle === 'rescue' ? 12 : 11);
    graphic.fillCircle(frontWheel, 17, this.vehicle.bodyStyle === 'rescue' ? 12 : 11);
    graphic.fillStyle(0x98a29b, 1);
    graphic.fillCircle(rearWheel, 17, 5);
    graphic.fillCircle(frontWheel, 17, 5);
    graphic.fillStyle(paint, 1);

    if (this.vehicle.bodyStyle === 'pickup') {
      graphic.fillRoundedRect(-42, -20, 84, 24, 6);
      graphic.fillRoundedRect(-20, -35, 38, 18, 7);
      graphic.fillStyle(glass, 1);
      graphic.fillRoundedRect(-14, -31, 13, 10, 3);
      graphic.fillRoundedRect(4, -31, 10, 10, 3);
    } else if (this.vehicle.bodyStyle === 'van') {
      graphic.fillRoundedRect(-44, -29, 88, 33, 6);
      graphic.fillRoundedRect(-35, -38, 63, 14, 5);
      graphic.fillStyle(glass, 1);
      graphic.fillRoundedRect(-29, -34, 19, 13, 3);
      graphic.fillRoundedRect(-6, -34, 27, 13, 3);
      graphic.fillStyle(trim, 1);
      graphic.fillRect(-37, -3, 18, 2);
    } else if (this.vehicle.bodyStyle === 'buggy') {
      graphic.fillRoundedRect(-42, -17, 84, 21, 5);
      graphic.fillRoundedRect(-17, -33, 37, 18, 6);
      graphic.lineStyle(4, trim, 1);
      graphic.beginPath();
      graphic.moveTo(-21, -12);
      graphic.lineTo(-13, -35);
      graphic.lineTo(22, -35);
      graphic.lineTo(34, -11);
      graphic.strokePath();
      graphic.fillStyle(glass, 1);
      graphic.fillRoundedRect(-10, -30, 22, 10, 3);
    } else {
      graphic.fillRoundedRect(-44, -25, 88, 29, 5);
      graphic.fillRoundedRect(-32, -36, 44, 18, 5);
      graphic.fillRoundedRect(-42, -33, 29, 17, 3);
      graphic.fillStyle(glass, 1);
      graphic.fillRoundedRect(-27, -32, 21, 12, 3);
      graphic.fillRoundedRect(-1, -32, 8, 10, 2);
      graphic.fillStyle(trim, 1);
      graphic.fillRect(-40, -22, 25, 2);
    }

    graphic.fillStyle(0x36413b, 1);
    graphic.fillRoundedRect(9, -43, 28, 8, 3);
    graphic.fillRoundedRect(31, -41, 25, 4, 2);
    graphic.fillStyle(this.upgrades.weapon > 0 ? 0xd7b154 : 0x858a72, 1);
    graphic.fillCircle(19, -39, 5);
    graphic.fillStyle(0xf0d171, 1);
    graphic.fillRoundedRect(35, -13, 8, 7, 2);
    graphic.fillStyle(trim, 1);
    graphic.fillRoundedRect(-45, 0, 9, 7, 2);
    graphic.lineStyle(2, trim, 0.78);
    graphic.strokeRoundedRect(-44, -20, 88, 24, 6);
  }

  private drawPickups(): void {
    this.pickupGraphic.clear();
    for (const pickup of this.pickups) {
      if (pickup.collected) continue;
      const y = this.roadY(pickup.x) - 78;
      if (pickup.kind === 'fuel') {
        this.pickupGraphic.fillStyle(0x6dd4b4, 1);
        this.pickupGraphic.fillRoundedRect(pickup.x - 13, y - 14, 26, 28, 5);
        this.pickupGraphic.fillStyle(0x17332c, 1);
        this.pickupGraphic.fillRect(pickup.x - 5, y - 6, 10, 12);
        this.pickupGraphic.fillRect(pickup.x + 6, y - 16, 7, 5);
      } else if (pickup.kind === 'scrap') {
        this.pickupGraphic.fillStyle(0xf4bd54, 1);
        this.pickupGraphic.fillPoints([
          { x: pickup.x, y: y - 17 },
          { x: pickup.x + 15, y },
          { x: pickup.x, y: y + 17 },
          { x: pickup.x - 15, y },
        ], true);
        this.pickupGraphic.fillStyle(0xfff0b1, 1);
        this.pickupGraphic.fillCircle(pickup.x, y, 4);
      } else if (pickup.kind === 'ammo') {
        this.pickupGraphic.fillStyle(0xd5a94e, 1);
        this.pickupGraphic.fillRoundedRect(pickup.x - 16, y - 12, 32, 24, 4);
        this.pickupGraphic.fillStyle(0x27312b, 1);
        this.pickupGraphic.fillRect(pickup.x - 10, y - 6, 5, 13);
        this.pickupGraphic.fillRect(pickup.x - 2, y - 6, 5, 13);
        this.pickupGraphic.fillRect(pickup.x + 6, y - 6, 5, 13);
      } else if (pickup.kind === 'repair') {
        this.pickupGraphic.fillStyle(0x75ca83, 1);
        this.pickupGraphic.fillCircle(pickup.x, y, 17);
        this.pickupGraphic.fillStyle(0x1d392c, 1);
        this.pickupGraphic.fillRoundedRect(pickup.x - 4, y - 11, 8, 22, 2);
        this.pickupGraphic.fillRoundedRect(pickup.x - 11, y - 4, 22, 8, 2);
      } else {
        this.pickupGraphic.fillStyle(0x71c9d1, 0.19);
        this.pickupGraphic.fillCircle(pickup.x, y, 20);
        this.pickupGraphic.lineStyle(3, 0x71d9df, 0.96);
        this.pickupGraphic.strokeCircle(pickup.x, y, 15);
        this.pickupGraphic.fillStyle(0xe1ffff, 1);
        this.pickupGraphic.fillCircle(pickup.x, y, 4);
      }
    }
  }

  private monsterPosition(monster: MonsterLayout): { x: number; y: number } {
    const phase = this.elapsed * 2.5 + monster.x * 0.002;
    const wandering = monster.kind === 'walker' ? Math.sin(phase) * 9
      : monster.kind === 'runner' ? Math.sin(phase * 1.4) * 20 : 0;
    const hopping = monster.kind === 'leaper' ? Math.abs(Math.sin(phase)) * 28 : 0;
    const bob = monster.kind === 'armored' ? Math.sin(phase) * 3 : 0;
    const x = monster.x + wandering;
    return { x, y: this.roadY(x) - 34 - hopping - bob };
  }

  private drawMonsters(): void {
    this.monsterGraphic.clear();
    this.monsterHealthGraphic.clear();

    for (const monster of this.monsters) {
      const sprite = this.monsterSprites.get(monster);
      if (monster.defeated || monster.diverted || monster.contacted) {
        sprite?.setVisible(false);
        continue;
      }

      const { x, y } = this.monsterPosition(monster);
      const style = MONSTER_STYLE[monster.kind];
      const width = monster.kind === 'armored' ? 44 : monster.kind === 'runner' ? 29 : 35;
      this.monsterGraphic.fillStyle(0x1e2923, 0.24);
      this.monsterGraphic.fillEllipse(x, this.roadY(x) - 4, width + 10, 10);

      if (sprite) {
        const sheet = MONSTER_SPRITES[monster.kind];
        const frame = Math.floor(this.elapsed * sheet.walkRate + monster.x * 0.001) % sheet.frameCount;
        sprite.setVisible(true).setPosition(x, y + 1).setFrame(frame);
      } else {
        // Procedural vector fallback keeps encounters visible if a PNG is missing.
        this.drawMonsterFallback(monster, x, y, style);
      }

      if (monster.maxHealth > 1 && monster.health < monster.maxHealth) {
        this.monsterHealthGraphic.fillStyle(0x24312b, 0.92);
        this.monsterHealthGraphic.fillRoundedRect(x - 18, y - 42, 36, 5, 2);
        this.monsterHealthGraphic.fillStyle(0xf0c75e, 1);
        this.monsterHealthGraphic.fillRoundedRect(x - 17, y - 41, 34 * monster.health / monster.maxHealth, 3, 1);
      }
    }
  }

  private drawMonsterFallback(
    monster: MonsterLayout,
    x: number,
    y: number,
    style: { name: string; body: number; light: number; accent: number },
  ): void {
    const armored = monster.kind === 'armored';
    const runner = monster.kind === 'runner';
    const width = armored ? 44 : runner ? 29 : 35;
    const headRadius = armored ? 15 : 14;

    // Simplified, friendly silhouettes; no wounds, blood or realistic injury.
    this.monsterGraphic.lineStyle(6, style.body, 1);
    this.monsterGraphic.beginPath();
    this.monsterGraphic.moveTo(x - 8, y + 15);
    this.monsterGraphic.lineTo(x - 13, y + 29);
    this.monsterGraphic.moveTo(x + 8, y + 15);
    this.monsterGraphic.lineTo(x + 13, y + 29);
    this.monsterGraphic.moveTo(x - 11, y - 5);
    this.monsterGraphic.lineTo(x - 21, y + 8);
    this.monsterGraphic.moveTo(x + 11, y - 5);
    this.monsterGraphic.lineTo(x + 21, y + 5);
    this.monsterGraphic.strokePath();

    this.monsterGraphic.fillStyle(style.body, 1);
    this.monsterGraphic.fillEllipse(x, y + 7, width, armored ? 33 : 31);
    this.monsterGraphic.fillCircle(x, y - 12, headRadius);
    this.monsterGraphic.fillStyle(style.light, 1);
    if (monster.kind === 'walker') {
      this.monsterGraphic.fillEllipse(x - 13, y - 1, 8, 13);
      this.monsterGraphic.fillEllipse(x + 12, y + 10, 10, 7);
    } else if (runner) {
      this.monsterGraphic.fillRoundedRect(x - 5, y + 1, 22, 5, 2);
      this.monsterGraphic.fillCircle(x + 7, y - 21, 3);
    } else if (monster.kind === 'leaper') {
      this.monsterGraphic.fillEllipse(x - 16, y + 19, 13, 8);
      this.monsterGraphic.fillEllipse(x + 16, y + 19, 13, 8);
      this.monsterGraphic.fillTriangle(x - 10, y - 22, x - 7, y - 37, x - 1, y - 20);
    } else {
      this.monsterGraphic.fillRoundedRect(x - 21, y - 4, 42, 20, 7);
      this.monsterGraphic.lineStyle(2, style.body, 0.95);
      this.monsterGraphic.beginPath();
      this.monsterGraphic.moveTo(x - 12, y - 3);
      this.monsterGraphic.lineTo(x - 10, y + 12);
      this.monsterGraphic.moveTo(x, y - 4);
      this.monsterGraphic.lineTo(x + 1, y + 13);
      this.monsterGraphic.moveTo(x + 12, y - 3);
      this.monsterGraphic.lineTo(x + 13, y + 10);
      this.monsterGraphic.strokePath();
    }

    this.monsterGraphic.fillStyle(style.accent, 1);
    this.monsterGraphic.fillCircle(x - 5, y - 13, 3);
    this.monsterGraphic.fillCircle(x + 5, y - 13, 3);
    this.monsterGraphic.fillStyle(0x24312b, 1);
    this.monsterGraphic.fillCircle(x - 5, y - 13, 1.3);
    this.monsterGraphic.fillCircle(x + 5, y - 13, 1.3);
  }

  private drawProjectiles(): void {
    this.projectileGraphic.clear();
    if (this.shieldTimer > 0) {
      this.projectileGraphic.lineStyle(2, 0x7bdde0, 0.42 + Math.sin(this.elapsed * 9) * 0.14);
      this.projectileGraphic.strokeEllipse(this.car.x, this.car.y - 3, 112, 66);
    }
    for (const projectile of this.projectiles) {
      this.projectileGraphic.fillStyle(0xf8d36b, 0.22);
      this.projectileGraphic.fillEllipse(projectile.x - 4, projectile.y, 24, 11);
      this.projectileGraphic.fillStyle(0xffef9a, 1);
      this.projectileGraphic.fillRoundedRect(projectile.x - 8, projectile.y - 3, 15, 6, 3);
    }
    if (this.muzzleFlash > 0) {
      this.projectileGraphic.fillStyle(0xffed9b, 0.86);
      this.projectileGraphic.fillPoints([
        { x: this.car.x + 38, y: this.car.y - 36 },
        { x: this.car.x + 51, y: this.car.y - 41 },
        { x: this.car.x + 47, y: this.car.y - 35 },
        { x: this.car.x + 53, y: this.car.y - 31 },
        { x: this.car.x + 38, y: this.car.y - 31 }
      ], true);
    }
  }

  private fireWeapon(): void {
    this.fireCooldown = Math.max(0.14, 0.34 - this.upgrades.weapon * 0.055);
    if (this.ammo <= 0) {
      if (this.emptyAmmoCooldown <= 0) {
        this.setFeedback('Sem munição. Procure caixas amarelas de reposição.', 1.1);
        this.emptyAmmoCooldown = 1;
      }
      return;
    }
    this.ammo -= 1;
    this.muzzleFlash = 0.075;
    this.projectiles.push({
      x: this.car.x + 38,
      y: this.car.y - 36,
      damage: 1 + this.upgrades.weapon,
    });
  }

  private updateProjectiles(dt: number): void {
    const projectileSpeed = 1_180;
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];
      const startX = projectile.x;
      projectile.x += projectileSpeed * dt;
      let target: MonsterLayout | undefined;
      let targetX = Number.POSITIVE_INFINITY;

      for (const monster of this.monsters) {
        if (monster.defeated || monster.diverted || monster.contacted) continue;
        const position = this.monsterPosition(monster);
        const crossed = position.x + 24 >= startX && position.x - 24 <= projectile.x;
        if (!crossed || Math.abs(position.y - projectile.y) > 49) continue;
        if (position.x < targetX) {
          target = monster;
          targetX = position.x;
        }
      }

      if (target) {
        target.health = Math.max(0, target.health - projectile.damage);
        this.projectiles.splice(index, 1);
        const position = this.monsterPosition(target);
        const name = MONSTER_STYLE[target.kind].name;
        if (target.health === 0) {
          target.defeated = true;
          this.monsterKills += 1;
          this.score += MONSTER_SCORE;
          this.setFeedback(`${name} neutralizado · +${MONSTER_SCORE} pontos.`, 1.7);
          this.showScorePopup(position.x, position.y - 18, MONSTER_SCORE, 'ZUMBI');
        } else {
          this.setFeedback(`${name} atingido · ${target.health}/${target.maxHealth} de resistência.`, 1.1);
        }
      } else if (projectile.x > this.worldWidth + 100) {
        this.projectiles.splice(index, 1);
      }
    }
  }

  private applyDamage(baseAmount: number): number {
    if (this.shieldTimer > 0) return 0;
    const amount = Math.max(1, Math.round(baseAmount * this.damageMultiplier));
    this.condition = Math.max(0, this.condition - amount);
    return amount;
  }

  private checkPickups(): void {
    for (const pickup of this.pickups) {
      if (pickup.collected || Math.abs(this.car.x - pickup.x) > 38) continue;
      if (Math.abs(this.car.y - (this.roadY(pickup.x) - 78)) > 74) continue;
      pickup.collected = true;
      if (pickup.kind === 'fuel') {
        this.fuel = Math.min(this.fuelCapacity, this.fuel + this.fuelCapacity * 0.28);
        this.setFeedback('Combustível recuperado.', 1.3);
      } else if (pickup.kind === 'scrap') {
        this.scrap += SCRAP_PICKUP_VALUE;
        this.setFeedback(`Sucata recuperada · +${SCRAP_PICKUP_VALUE} para a oficina.`, 1.3);
      } else if (pickup.kind === 'ammo') {
        const refill = Math.max(8, Math.ceil(this.ammoCapacity * 0.3));
        this.ammo = Math.min(this.ammoCapacity, this.ammo + refill);
        this.setFeedback(`Munição recuperada · ${this.ammo}/${this.ammoCapacity}.`, 1.4);
      } else if (pickup.kind === 'repair') {
        this.condition = Math.min(100, this.condition + 24);
        this.setFeedback('Kit de reparo: condição do veículo restaurada.', 1.4);
      } else {
        this.shieldTimer = Math.max(this.shieldTimer, 8);
        this.setFeedback('Escudo ativo por 8 segundos: impactos não causam dano.', 1.7);
      }
    }
  }

  private checkObstacles(): void {
    for (const obstacle of this.obstacles) {
      if (obstacle.hit || Math.abs(this.car.x - obstacle.x) > 42) continue;
      if (!this.car.grounded || Math.abs(this.car.y - (this.roadY(obstacle.x) - CAR_HALF_HEIGHT)) > 35) continue;
      obstacle.hit = true;
      const damage = this.applyDamage(17);
      this.car.vx *= 0.62 + this.upgrades.bumper * 0.04;
      this.setFeedback(damage === 0 ? 'Escudo absorveu o impacto com a sucata.' : `Impacto com sucata · ${damage} de dano ao veículo.`, 1.8);
    }
  }

  private checkMonsters(): void {
    for (const monster of this.monsters) {
      if (monster.defeated || monster.diverted || monster.contacted) continue;
      const { x, y } = this.monsterPosition(monster);
      if (Math.abs(this.car.x - x) > 54 || Math.abs(this.car.y - y) > 70) continue;

      monster.contacted = true;
      const damage = this.applyDamage(18 + Math.round(this.car.vx / 70));
      this.car.vx *= 0.76 + this.upgrades.bumper * 0.035;
      const name = MONSTER_STYLE[monster.kind].name;
      this.setFeedback(
        damage === 0 ? `Escudo bloqueou o ataque do zumbi ${name.toLowerCase()}.` : `${name} atingiu o carro · ${damage} de dano. Dispare antes do contato.`,
        1.8,
      );
    }
  }

  private activateHorn(): void {
    this.hornPulse = 0.45;
    let diverted = 0;
    for (const monster of this.monsters) {
      if (monster.defeated || monster.diverted || monster.x < this.car.x || monster.x - this.car.x > 460) continue;
      monster.diverted = true;
      diverted += 1;
    }
    this.setFeedback(diverted > 0 ? `Buzina de rota: ${diverted} criatura${diverted > 1 ? 's' : ''} desviada${diverted > 1 ? 's' : ''}.` : 'Buzina de rota acionada.', 1.8);
  }

  private showScorePopup(x: number, y: number, points: number, label: string): void {
    const popup = this.add.text(x, y, `+${points}  ${label}`, {
      color: label === 'MONSTRO' || label === 'ZUMBI' ? '#f0d26f' : '#b6c85c',
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      fontStyle: 'bold',
      stroke: '#15201d',
      strokeThickness: 4,
      backgroundColor: '#16201ec7',
      padding: { x: 8, y: 5 },
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({
      targets: popup,
      y: y - 54,
      alpha: 0,
      scale: 1.08,
      duration: 950,
      ease: 'Cubic.Out',
      onComplete: () => popup.destroy(),
    });
  }

  private setFeedback(message: string, duration: number): void {
    this.feedback = message;
    this.feedbackTimer = duration;
  }

  private updateHud(): void {
    const progress = Phaser.Math.Clamp(this.car.x / this.finishX, 0, 1);
    const fuelPercent = this.fuelCapacity > 0 ? this.fuel / this.fuelCapacity : 0;
    this.hudGraphic.clear();
    this.hudGraphic.fillStyle(0x14201e, 0.9);
    this.hudGraphic.fillRoundedRect(20, 16, 520, 164, 12);

    this.hudGraphic.fillStyle(0x293735, 1);
    this.hudGraphic.fillRoundedRect(42, 145, 150, 8, 5);
    this.hudGraphic.fillStyle(0x72d3b5, 1);
    this.hudGraphic.fillRoundedRect(42, 145, 150 * fuelPercent, 8, 5);
    this.hudGraphic.fillStyle(0x293735, 1);
    this.hudGraphic.fillRoundedRect(210, 145, 120, 8, 5);
    this.hudGraphic.fillStyle(0xe6a045, 1);
    this.hudGraphic.fillRoundedRect(210, 145, 120 * (this.nitro / 100), 8, 5);
    this.hudGraphic.fillStyle(0x293735, 1);
    this.hudGraphic.fillRoundedRect(348, 145, 150, 8, 5);
    this.hudGraphic.fillStyle(this.condition < 30 ? 0xe27464 : 0xd4d6a0, 1);
    this.hudGraphic.fillRoundedRect(348, 145, 150 * (this.condition / 100), 8, 5);

    const shieldLabel = this.shieldTimer > 0 ? `ESCUDO ${this.shieldTimer.toFixed(1)}s` : 'ESCUDO —';
    this.hudStats.setText(
      `${this.stage.shortName} · ${this.vehicle.name.toUpperCase()}\nVEL ${Math.round(this.car.vx / 4)} km/h   PONTOS ${this.score.toLocaleString('pt-BR')}\nSUCATA ${this.scrap}   ZUMBIS ${this.monsterKills}/${this.monsters.length}   SALTOS ${this.jumps}   GIROS ${this.tricks}\nMUNIÇÃO ${this.ammo}/${this.ammoCapacity}   ${shieldLabel}`,
    );
    this.feedbackText.setText(this.feedbackTimer > 0 ? this.feedback : `Dispare com ${this.bindings.fire} · salte rampas e alcance ${this.stage.name}.`);
    this.feedbackText.setAlpha(this.feedbackTimer > 0 ? 1 : 0.82);

    this.hudGraphic.fillStyle(0x14201e, 0.86);
    this.hudGraphic.fillRoundedRect(VIEW_WIDTH - 250, 22, 218, 16, 8);
    this.hudGraphic.fillStyle(0xf3ae46, 1);
    this.hudGraphic.fillRoundedRect(VIEW_WIDTH - 247, 25, 212 * progress, 10, 5);
  }

  private finishRace(outcome: RaceOutcome, failureReason?: string): void {
    if (this.completed) return;
    this.completed = true;
    const result: RaceResult = {
      stageId: this.stage.id,
      carId: this.vehicle.id,
      outcome,
      failureReason,
      elapsedSeconds: this.elapsed,
      scrap: this.scrap + (outcome === 'success' ? COMPLETION_SCRAP_BONUS : 0),
      fuelPercent: Math.round((this.fuel / this.fuelCapacity) * 100),
      conditionPercent: Math.round(this.condition),
      score: this.score,
      monsterKills: this.monsterKills,
      jumps: this.jumps,
      tricks: this.tricks,
      distancePercent: Math.round(Phaser.Math.Clamp(this.car.x / this.finishX, 0, 1) * 100),
    };
    this.callbacks.onComplete(result);
  }

  private handleShutdown(): void {
    this.input.keyboard?.removeAllKeys(true);
  }
}
