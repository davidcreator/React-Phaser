/**
 * GameScene — coração do Pong refatorado.
 *
 * Princípios aplicados (direto do diagnóstico P0/P1):
 *  • Nenhum setTimeout/alert dentro do loop: spawn de power-ups, saques e
 *    efeitos usam acumuladores de delta-time (anti P0-2).
 *  • Power-up 'slow' tem reversão garantida por timer de estado (anti P0-3).
 *  • Colisão com obstáculos resolve penetração + 1 hit por evento (anti P0-4).
 *  • Pontuação/vidas vivem no store Zustand; a cena só emite eventos
 *    (anti P0-1/P0-5: sem alert, sem reset duplicado, timer consistente).
 *  • Tudo em px/segundo com sub-stepping → comportamento idêntico em 30/60/144 Hz.
 */

import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import { DIFFICULTIES, type DifficultyDef } from '../difficulty';
import { MODE_MAP, type ModeDef } from '../modes';
import {
  BALL_R,
  COLOR_HEX,
  COLORS,
  H,
  PADDLE_H,
  PADDLE_MARGIN,
  PADDLE_W,
  POWERUP,
  W,
} from '../constants';
import { sfx } from '../sfx';
import { ensureTextures } from '../textures';
import { Paddle } from '../entities/Paddle';
import { Ball } from '../entities/Ball';
import type { Settings, Side } from '../../types';

type PowerUpType = 'speed' | 'size' | 'slow' | 'extra';

interface PowerUpDef {
  type: PowerUpType;
  color: number;
  icon: string;
  label: string;
}

const POWERUP_DEFS: PowerUpDef[] = [
  { type: 'speed', color: COLOR_HEX.red, icon: '⚡', label: 'Velocidade' },
  { type: 'size', color: COLOR_HEX.teal, icon: '📏', label: 'Paleta grande' },
  { type: 'slow', color: COLOR_HEX.blue, icon: '🐌', label: 'Bola lenta' },
  { type: 'extra', color: COLOR_HEX.mint, icon: '⚽', label: 'Bola extra' },
];

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  hits: number;
  maxHits: number;
  gfx: Phaser.GameObjects.Rectangle;
}

interface PowerUp {
  x: number;
  y: number;
  w: number;
  h: number;
  def: PowerUpDef;
  rot: number;
  pulse: number;
  gfx: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Text;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}

const MAX_PARTICLES = 260;
const OBSTACLE_LAYOUT = [30, 96, 162, 228, 294, 360];

export class GameScene extends Phaser.Scene {
  private settings!: Settings;
  private mode!: ModeDef;
  private diff!: DifficultyDef;

  private p1!: Paddle;
  private p2!: Paddle;
  private balls: Ball[] = [];
  private obstacles: Obstacle[] = [];
  private powerUps: PowerUp[] = [];
  private particles: Particle[] = [];

  private fx!: Phaser.GameObjects.Graphics;
  private serveText!: Phaser.GameObjects.Text;

  private phase: 'serve' | 'play' | 'over' = 'serve';
  private serveTimer = 0;
  private serveTo: Side = 'p1';

  /** Relógio de efeitos — avança só quando status === 'running' */
  private clock = 0;
  /** Tempo de jogo efetivo (só durante a bola em jogo) */
  private elapsed = 0;
  private lastSecond = -1;
  private powerUpTimer: number = POWERUP.spawnMin;

  private p1Ups: Phaser.Input.Keyboard.Key[] = [];
  private p1Downs: Phaser.Input.Keyboard.Key[] = [];
  private p2Ups: Phaser.Input.Keyboard.Key[] = [];
  private p2Downs: Phaser.Input.Keyboard.Key[] = [];

  /** Círculo reaproveitado nas checagens de colisão (zero alocação) */
  private readonly ballGeom = new Phaser.Geom.Circle(0, 0, BALL_R);

  constructor() {
    super('Pong');
  }

  // ───────────────────────── lifecycle ─────────────────────────

  create(): void {
    // scene.restart() preserva a instância da Scene: referências a objetos
    // destruídos no shutdown devem ser descartadas antes de reconstruir.
    this.balls = [];
    this.obstacles = [];
    this.powerUps = [];
    this.particles = [];
    this.p1Ups = [];
    this.p1Downs = [];
    this.p2Ups = [];
    this.p2Downs = [];

    const state = useGameStore.getState();
    this.settings = { ...state.settings };
    this.mode = MODE_MAP[this.settings.mode];
    this.diff = DIFFICULTIES[this.settings.difficulty];

    ensureTextures(this);
    this.buildField();

    this.p1 = new Paddle(this, PADDLE_MARGIN, H / 2 - PADDLE_H / 2, COLOR_HEX.green);
    this.p2 = new Paddle(
      this,
      W - PADDLE_MARGIN - PADDLE_W,
      H / 2 - PADDLE_H / 2,
      COLOR_HEX.red,
    );

    this.setupKeys();

    if (this.mode.obstacles) this.createObstacles();

    this.clock = 0;
    this.elapsed = 0;
    this.lastSecond = -1;
    this.powerUpTimer = POWERUP.spawnMin;
    this.startServe('p1', true);
  }

  update(time: number, delta: number): void {
    const { status } = useGameStore.getState();
    // Pausa: congela TUDO (sim, efeitos e redraw) sem cancelar RAF —
    // substitui o controle manual de requestAnimationFrame do código antigo.
    if (status === 'paused') return;

    const dt = Math.min(delta, 50) / 1000;
    this.updateParticles(dt);

    if (status === 'running') this.simulate(time, dt);

    this.drawFx(time);
  }

  // ───────────────────────── construção ─────────────────────────

  private buildField(): void {
    this.fx = this.add.graphics().setDepth(0);
    this.serveText = this.add
      .text(W / 2, 56, 'PREPARE-SE', {
        fontFamily: 'Courier New, monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: COLORS.white,
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setVisible(false);
  }

  private setupKeys(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    const KC = Phaser.Input.Keyboard.KeyCodes;
    const mk = (code: number) => kb.addKey(code, false);

    const { p1Scheme, p2Scheme } = this.settings;
    if (p1Scheme === 'wasd' || p1Scheme === 'both') {
      this.p1Ups.push(mk(KC.W));
      this.p1Downs.push(mk(KC.S));
    }
    if (p1Scheme === 'arrows' || p1Scheme === 'both') {
      this.p1Ups.push(mk(KC.UP));
      this.p1Downs.push(mk(KC.DOWN));
    }
    if (p2Scheme === 'ik') {
      this.p2Ups.push(mk(KC.I));
      this.p2Downs.push(mk(KC.K));
    } else {
      this.p2Ups.push(mk(KC.UP));
      this.p2Downs.push(mk(KC.DOWN));
    }
  }

  private createObstacles(): void {
    const w = 20;
    const h = 20;
    const x = W / 2 - w / 2;
    for (const y of OBSTACLE_LAYOUT) {
      const gfx = this.add
        .rectangle(x + w / 2, y + h / 2, w, h, COLOR_HEX.red, 0.85)
        .setDepth(1);
      this.obstacles.push({ x, y, w, h, hits: 0, maxHits: 3, gfx });
    }
  }

  // ───────────────────────── saque / partida ─────────────────────────

  private startServe(to: Side, firstServe: boolean): void {
    this.phase = 'serve';
    this.serveTo = to;
    this.serveTimer = firstServe ? 1.5 : 1.1;

    for (const b of this.balls) b.destroy();
    this.balls = [];

    const maxSpeed = this.diff.ballMax * (this.mode.speedRamp ? 1.35 : 1);
    const n = this.mode.initialBalls;
    for (let i = 0; i < n; i++) {
      const offset = (i - (n - 1) / 2) * 90;
      const ball = new Ball(this, W / 2 + offset, H / 2, maxSpeed);
      ball.lastHitBy = to;
      ball.syncGraphics();
      this.balls.push(ball);
    }

    this.serveText.setText(firstServe ? 'PREPARE-SE' : 'SAQUE!').setVisible(true);
  }

  private launch(): void {
    this.balls.forEach((b, i) => {
      const dir =
        this.mode.initialBalls > 1
          ? i % 2 === 0
            ? 1
            : -1
          : this.serveTo === 'p1'
            ? -1
            : 1;
      const angle = Phaser.Math.DegToRad(Math.random() * 50 - 25);
      const sp = this.diff.ballSpeed + i * 15;
      b.vx = dir * sp * Math.cos(angle);
      b.vy = sp * Math.sin(angle);
      b.trail = [];
    });
    this.phase = 'play';
    this.serveText.setVisible(false);
  }

  // ───────────────────────── simulação ─────────────────────────

  private simulate(time: number, dt: number): void {
    this.clock += dt;
    this.handleInput(dt);

    if (this.phase === 'serve') {
      this.serveTimer -= dt;
      this.serveText.setAlpha(0.65 + Math.sin(time / 130) * 0.35);
      if (this.serveTimer <= 0) this.launch();
      return;
    }

    if (this.phase !== 'play') return; // 'over': congela o mundo

    this.elapsed += dt;
    const sec = Math.floor(this.elapsed);
    if (sec !== this.lastSecond) {
      this.lastSecond = sec;
      useGameStore.getState().setTime(sec);
    }

    this.updateBuffs(dt);
    if (this.mode.powerUps) this.updatePowerUps(dt);
    this.moveBalls(dt);
  }

  private updateBuffs(dt: number): void {
    for (const b of this.balls) {
      if (b.slowed) {
        b.slowRemaining -= dt;
        if (b.slowRemaining <= 0) b.endSlow(); // reversão garantida (P0-3)
      }
      if (this.mode.speedRamp) {
        if (b.speed < b.maxSpeed) {
          const f = 1 + 0.1 * dt;
          b.vx *= f;
          b.vy *= f;
          b.clampSpeed();
        }
      }
    }
  }

  // ───────────────────────── input ─────────────────────────

  private handleInput(dt: number): void {
    const clock = this.clock;

    // Jogador 1 — teclado
    let p1Dir = 0;
    if (anyDown(this.p1Ups)) p1Dir -= 1;
    if (anyDown(this.p1Downs)) p1Dir += 1;

    // Gamepads (configuráveis)
    let pads: (Gamepad | null)[] = [];
    if (this.settings.gamepadEnabled && navigator.getGamepads) {
      pads = Array.from(navigator.getGamepads());
    }
    p1Dir = clampDir(p1Dir + padAxis(pads[0]));

    this.p1.y +=
      p1Dir * this.p1.speedAt(this.diff.playerSpeed, clock) * dt;

    // Jogador 2
    if (this.mode.cpu) {
      this.updateAI(dt);
    } else {
      let p2Dir = 0;
      if (anyDown(this.p2Ups)) p2Dir -= 1;
      if (anyDown(this.p2Downs)) p2Dir += 1;
      p2Dir = clampDir(p2Dir + padAxis(pads[1]));
      this.p2.y +=
        p2Dir * this.p2.speedAt(this.diff.playerSpeed, clock) * dt;
    }

    // Pointer/touch: arrastar na metade esquerda controla P1;
    // na direita, P2 (somente no modo 2 jogadores). Torna o jogo
    // jogável em touch mesmo sem controles dedicados (P2-3).
    const pointer = this.input.activePointer;
    if (pointer.isDown && pointer.worldY >= 0 && pointer.worldY <= H) {
      if (pointer.worldX < W / 2) {
        this.p1.y = pointer.worldY - this.p1.heightAt(clock) / 2;
      } else if (!this.mode.cpu) {
        this.p2.y = pointer.worldY - this.p2.heightAt(clock) / 2;
      }
    }

    this.p1.clampAndSync(clock);
    this.p2.clampAndSync(clock);
  }

  private updateAI(dt: number): void {
    const target = this.aiTarget();
    const center = this.p2.y + this.p2.heightAt(this.clock) / 2;
    const delta = target - center;
    if (Math.abs(delta) > this.diff.aiDeadzone) {
      const maxStep = this.diff.cpuSpeed * dt;
      const step =
        Math.abs(delta) <= maxStep ? delta : Math.sign(delta) * maxStep;
      this.p2.y += step;
    }
    this.p2.clampAndSync(this.clock);
  }

  private aiTarget(): number {
    const ball = this.leadingBall();
    if (!ball) return H / 2;

    if (this.diff.aiMode === 'chase') return ball.y;
    if (ball.vx <= 0) return H / 2; // bola indo embora → guarda o centro
    if (this.diff.aiMode === 'track') return ball.y;

    // predict: prevê Y na linha da paleta, refletindo nas paredes
    const t = (this.p2.x - ball.x) / ball.vx;
    return foldToField(ball.y + ball.vy * t, H);
  }

  /** Bola mais próxima da paleta da CPU */
  private leadingBall(): Ball | null {
    let best: Ball | null = null;
    for (const b of this.balls) {
      if (!best || b.x > best.x) best = b;
    }
    return best;
  }

  // ───────────────────────── bola & colisões ─────────────────────────

  private moveBalls(dt: number): void {
    for (const ball of this.balls) {
      // Sub-stepping: passos de no máx. 6px → sem tunneling em nenhuma taxa
      const travel = Math.max(Math.abs(ball.vx), Math.abs(ball.vy)) * dt;
      const steps = Math.max(1, Math.ceil(travel / 6));
      const stepDt = dt / steps;

      for (let s = 0; s < steps; s++) {
        ball.x += ball.vx * stepDt;
        ball.y += ball.vy * stepDt;

        // Paredes
        if (ball.y - ball.radius < 0) {
          ball.y = ball.radius;
          ball.vy = Math.abs(ball.vy);
          this.wallFx(ball);
        } else if (ball.y + ball.radius > H) {
          ball.y = H - ball.radius;
          ball.vy = -Math.abs(ball.vy);
          this.wallFx(ball);
        }

        if (this.mode.obstacles) {
          for (const o of [...this.obstacles]) {
            if (this.hitObstacle(ball, o)) break;
          }
        }

        this.tryPaddleHit(ball);
        if (this.mode.powerUps) this.tryCollectPowerUp(ball);

        // Gols — imediatos na borda (sem os 50px de atraso do original)
        if (ball.x < 0) {
          this.onGoal('p2', ball.y);
          return;
        }
        if (ball.x > W) {
          this.onGoal('p1', ball.y);
          return;
        }
      }

      ball.pushTrail();
      ball.syncGraphics();
    }
  }

  private ballIntersects(ball: Ball, x: number, y: number, w: number, h: number): boolean {
    const cx = Phaser.Math.Clamp(ball.x, x, x + w);
    const cy = Phaser.Math.Clamp(ball.y, y, y + h);
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    return dx * dx + dy * dy <= ball.radius * ball.radius;
  }

  private hitObstacle(ball: Ball, o: Obstacle): boolean {
    if (!this.ballIntersects(ball, o.x, o.y, o.w, o.h)) return false;

    // Resolução de penetração no eixo de menor sobreposição:
    // a bola sai do bloco no mesmo frame → 1 hit por evento real (P0-4).
    const ovlL = ball.x + ball.radius - o.x;
    const ovlR = o.x + o.w - (ball.x - ball.radius);
    const ovlT = ball.y + ball.radius - o.y;
    const ovlB = o.y + o.h - (ball.y - ball.radius);
    const minX = Math.min(ovlL, ovlR);
    const minY = Math.min(ovlT, ovlB);

    if (minX < minY) {
      if (ovlL < ovlR) {
        ball.vx = Math.abs(ball.vx);
        ball.x = o.x - ball.radius;
      } else {
        ball.vx = -Math.abs(ball.vx);
        ball.x = o.x + o.w + ball.radius;
      }
    } else {
      if (ovlT < ovlB) {
        ball.vy = Math.abs(ball.vy);
        ball.y = o.y - ball.radius;
      } else {
        ball.vy = -Math.abs(ball.vy);
        ball.y = o.y + o.h + ball.radius;
      }
    }

    o.hits += 1;
    sfx.block();
    this.burst(ball.x, ball.y, COLOR_HEX.red, 6);

    if (o.hits >= o.maxHits) {
      o.gfx.destroy();
      this.obstacles = this.obstacles.filter((ob) => ob !== o);
      this.burst(o.x + o.w / 2, o.y + o.h / 2, COLOR_HEX.red, 16);
    } else {
      o.gfx.setAlpha(1 - (o.hits / o.maxHits) * 0.6);
    }
    return true;
  }

  private tryPaddleHit(ball: Ball): void {
    this.ballGeom.x = ball.x;
    this.ballGeom.y = ball.y;
    this.ballGeom.radius = ball.radius;

    if (
      ball.vx < 0 &&
      Phaser.Geom.Intersects.CircleToRectangle(this.ballGeom, this.p1.bounds)
    ) {
      this.deflect(ball, this.p1, 'p1', 1);
    } else if (
      ball.vx > 0 &&
      Phaser.Geom.Intersects.CircleToRectangle(this.ballGeom, this.p2.bounds)
    ) {
      this.deflect(ball, this.p2, 'p2', -1);
    }
  }

  private deflect(ball: Ball, paddle: Paddle, side: Side, dir: 1 | -1): void {
    const half = paddle.heightAt(this.clock) / 2;
    const rel = Phaser.Math.Clamp(
      (ball.y - (paddle.y + half)) / half,
      -1,
      1,
    );
    // Ângulo de saída controlado pelo ponto de impacto (Pong autêntico)
    const angle = rel * Phaser.Math.DegToRad(55);
    const sp = Math.min(
      Math.max(ball.speed * 1.05, this.diff.ballSpeed * 0.9),
      ball.maxSpeed,
    );

    ball.vx = dir * sp * Math.cos(angle);
    ball.vy = sp * Math.sin(angle);
    ball.x =
      dir > 0
        ? paddle.x + paddle.baseWidth + ball.radius
        : paddle.x - ball.radius;
    ball.lastHitBy = side;

    useGameStore.getState().addHit(side);
    sfx.paddle();
    this.burst(ball.x, ball.y, side === 'p1' ? COLOR_HEX.green : COLOR_HEX.red, 8);
  }

  // ───────────────────────── power-ups ─────────────────────────

  private updatePowerUps(dt: number): void {
    // Spawn por acumulador de tempo — nunca morre ao pausar/reiniciar (P0-2)
    if (this.phase === 'play') {
      this.powerUpTimer -= dt;
      if (this.powerUpTimer <= 0) {
        this.powerUpTimer = POWERUP.spawnMin + Math.random() * POWERUP.spawnVar;
        if (this.powerUps.length < POWERUP.maxOnField) this.spawnPowerUp();
      }
    }

    for (const pu of this.powerUps) {
      pu.rot += 1.4 * dt;
      pu.pulse += 4 * dt;
      const s = 1 + Math.sin(pu.pulse) * 0.1;
      pu.gfx.setRotation(pu.rot).setScale(s);
      pu.icon.setRotation(pu.rot).setScale(s);
    }
  }

  private spawnPowerUp(): void {
    const def = POWERUP_DEFS[Math.floor(Math.random() * POWERUP_DEFS.length)];
    const w = 30;
    const h = 30;
    const x = W * 0.25 + Math.random() * (W * 0.5 - w);
    const y = 50 + Math.random() * (H - 50 - h - 24);
    const gfx = this.add
      .rectangle(x + w / 2, y + h / 2, w, h, def.color, 0.92)
      .setDepth(2);
    const icon = this.add
      .text(x + w / 2, y + h / 2, def.icon, { fontSize: '16px' })
      .setOrigin(0.5)
      .setDepth(2);
    this.powerUps.push({ x, y, w, h, def, rot: 0, pulse: 0, gfx, icon });
  }

  private tryCollectPowerUp(ball: Ball): void {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      if (!this.ballIntersects(ball, pu.x, pu.y, pu.w, pu.h)) continue;

      // Creditado ao ÚLTIMO jogador que acertou a bola (dono do rally)
      this.applyPowerUp(ball.lastHitBy, pu);
      pu.gfx.destroy();
      pu.icon.destroy();
      this.powerUps.splice(i, 1);
      break;
    }
  }

  private applyPowerUp(side: Side, pu: PowerUp): void {
    const player = side === 'p1' ? this.p1 : this.p2;
    const clock = this.clock;

    switch (pu.def.type) {
      case 'speed':
        player.applySpeedBoost(clock, POWERUP.buffDuration);
        break;
      case 'size':
        player.applySizeBoost(clock, POWERUP.buffDuration);
        player.clampAndSync(clock);
        break;
      case 'slow':
        for (const b of this.balls) {
          if (!b.slowed) {
            b.vx *= 0.5;
            b.vy *= 0.5;
            b.slowed = true;
          }
          b.slowRemaining = POWERUP.slowDuration; // refresh, sem stacking
        }
        break;
      case 'extra':
        if (this.balls.length < 4) {
          const src = this.balls[0];
          const nb = new Ball(this, src.x, src.y, src.maxSpeed);
          nb.vx = src.vx !== 0 ? -src.vx : this.diff.ballSpeed;
          nb.vy = src.vy * 0.7 + (Math.random() - 0.5) * 160;
          nb.lastHitBy = side;
          nb.syncGraphics();
          this.balls.push(nb);
        }
        break;
    }

    sfx.powerUp();
    this.burst(pu.x + pu.w / 2, pu.y + pu.h / 2, pu.def.color, 14);
  }

  // ───────────────────────── pontuação / fim de jogo ─────────────────────────

  private onGoal(scorer: Side, ballY: number): void {
    const { addGoal } = useGameStore.getState();
    const { gameOver } = addGoal(scorer);
    const conceeded: Side = scorer === 'p1' ? 'p2' : 'p1';

    sfx.goal();
    this.cameras.main.shake(140, 0.004);
    const goalX = conceeded === 'p1' ? 4 : W - 4;
    this.burst(goalX, ballY, scorer === 'p1' ? COLOR_HEX.green : COLOR_HEX.red, 22);

    if (gameOver) {
      this.phase = 'over';
      for (const b of this.balls) {
        b.vx = 0;
        b.vy = 0;
      }
      // Confete de fim de partida (anima: partículas rodam fora do simulate)
      const colors = [
        COLOR_HEX.green,
        COLOR_HEX.red,
        COLOR_HEX.yellow,
        COLOR_HEX.blue,
        COLOR_HEX.mint,
      ];
      for (let i = 0; i < 6; i++) {
        this.burst(W * (0.15 + i * 0.14), H * 0.35, colors[i % colors.length], 14);
      }
      const winner = useGameStore.getState().session.winner;
      if (this.mode.cpu && winner === 'p2') sfx.lose();
      else sfx.win();
    } else {
      this.startServe(conceeded, false);
    }
  }

  // ───────────────────────── partículas & render ─────────────────────────

  private burst(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) this.particles.shift();
      const life = 0.4 + Math.random() * 0.5;
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 320,
        vy: (Math.random() - 0.5) * 320,
        life,
        maxLife: life,
        color,
        size: 1.5 + Math.random() * 2.5,
      });
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  private wallFx(ball: Ball): void {
    sfx.wall();
    this.burst(ball.x, ball.y, COLOR_HEX.yellow, 4);
  }

  private drawFx(time: number): void {
    const fx = this.fx;
    fx.clear();

    // Linha central tracejada animada
    fx.lineStyle(3, 0x2c3140, 1);
    const offset = (time / 60) % 30;
    for (let y = -30 + offset; y < H; y += 30) {
      fx.lineBetween(W / 2, y, W / 2, Math.min(y + 15, H));
    }

    // Rastros das bolas
    for (const b of this.balls) {
      const len = b.trail.length;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const p = b.trail[i];
        fx.fillStyle(COLOR_HEX.yellow, t * 0.35);
        fx.fillCircle(p.x, p.y, Math.max(1, b.radius * t * 0.9));
      }
    }

    // Partículas
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      fx.fillStyle(p.color, alpha);
      fx.fillCircle(p.x, p.y, p.size);
    }
  }
}

// ───────────────────────── helpers ─────────────────────────

function anyDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
  for (const k of keys) if (k.isDown) return true;
  return false;
}

function padAxis(pad: Gamepad | null | undefined): number {
  if (!pad) return 0;
  let axis = 0;
  const ay = pad.axes?.[1] ?? 0;
  if (Math.abs(ay) > 0.2) axis = ay;
  if (pad.buttons?.[12]?.pressed) axis = -1;
  if (pad.buttons?.[13]?.pressed) axis = 1;
  return axis;
}

function clampDir(v: number): number {
  return Phaser.Math.Clamp(v, -1, 1);
}

/** Reflete uma coordenada Y no intervalo [0, height] (bouncing nas paredes) */
function foldToField(y: number, height: number): number {
  const span = height * 2;
  let v = y % span;
  if (v < 0) v += span;
  if (v > height) v = span - v;
  return v;
}
