/**
 * Bola — posição/velocidade em px/segundo (delta-time based, sem
 * dependência de FPS). Guarda rastro, estado de slow e último jogador
 * que acertou (donora dos power-ups coletados).
 */

import Phaser from 'phaser';
import { BALL_R, COLOR_HEX } from '../constants';

export class Ball {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  readonly radius = BALL_R;
  maxSpeed: number;

  /** Power-up 'slow' ativo (com timer para reversão automática) */
  slowed = false;
  slowRemaining = 0;

  /** Lado que detém a bola agora (creditado por power-ups) */
  lastHitBy: 'p1' | 'p2' = 'p1';

  trail: { x: number; y: number }[] = [];

  readonly circle: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number, maxSpeed: number) {
    this.x = x;
    this.y = y;
    this.maxSpeed = maxSpeed;
    this.circle = scene.add
      .circle(x, y, BALL_R, COLOR_HEX.yellow)
      .setDepth(5);
  }

  get speed(): number {
    return Math.hypot(this.vx, this.vy);
  }

  pushTrail(): void {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 9) this.trail.shift();
  }

  /** Restaura o slow dobrando a velocidade de volta (sem stacking) */
  endSlow(): void {
    if (!this.slowed) return;
    this.vx *= 2;
    this.vy *= 2;
    this.slowed = false;
    this.slowRemaining = 0;
    this.clampSpeed();
  }

  clampSpeed(): void {
    const m = this.speed;
    if (m > this.maxSpeed && m > 0) {
      const f = this.maxSpeed / m;
      this.vx *= f;
      this.vy *= f;
    }
  }

  syncGraphics(): void {
    this.circle.setPosition(this.x, this.y);
  }

  destroy(): void {
    this.circle.destroy();
  }
}
