/**
 * Paleta (paddle) — retângulo com "glow" fake (retângulo translúcido atrás)
 * e buffs temporários de tamanho/velocidade.
 *
 * O relógio (clock) da cena é passado explicitamente nas chamadas:
 * quando o jogo pausa, o clock congela e os buffs pausam junto —
 * sem timers paralelos fora do game loop (anti P0-2/P0-3).
 */

import Phaser from 'phaser';
import { H, PADDLE_BOOST_H, PADDLE_H, PADDLE_W } from '../constants';

export class Paddle {
  x: number;
  y: number;
  readonly baseWidth = PADDLE_W;
  readonly baseHeight = PADDLE_H;
  readonly color: number;

  /** Instante (clock da cena) em que o efeito expira; -1 = sem efeito */
  sizeBoostUntil = -1;
  speedBoostUntil = -1;

  /** Retângulo de colisão reaproveitado (zero alocação por frame) */
  readonly bounds = new Phaser.Geom.Rectangle(0, 0, PADDLE_W, PADDLE_H);

  private readonly body: Phaser.GameObjects.Rectangle;
  private readonly glow: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number) {
    this.x = x;
    this.y = y;
    this.color = color;

    this.glow = scene.add
      .rectangle(x + PADDLE_W / 2, y + PADDLE_H / 2, PADDLE_W + 10, PADDLE_H + 10, color, 0.16)
      .setDepth(3);
    this.body = scene.add
      .rectangle(x + PADDLE_W / 2, y + PADDLE_H / 2, PADDLE_W, PADDLE_H, color)
      .setDepth(4);

    this.sync(0);
  }

  heightAt(clock: number): number {
    return clock < this.sizeBoostUntil ? PADDLE_BOOST_H : this.baseHeight;
  }

  speedAt(baseSpeed: number, clock: number): number {
    return clock < this.speedBoostUntil ? baseSpeed * 1.6 : baseSpeed;
  }

  applySizeBoost(clock: number, duration: number): void {
    this.sizeBoostUntil = clock + duration;
  }

  applySpeedBoost(clock: number, duration: number): void {
    this.speedBoostUntil = clock + duration;
  }

  /** Limita Y ao campo e redesenha (retângulo de colisão incluso) */
  clampAndSync(clock: number): void {
    this.y = Phaser.Math.Clamp(this.y, 0, H - this.heightAt(clock));
    this.sync(clock);
  }

  sync(clock: number): void {
    const h = this.heightAt(clock);
    const cx = this.x + this.baseWidth / 2;
    const cy = this.y + h / 2;
    this.body.setSize(this.baseWidth, h).setPosition(cx, cy);
    this.glow.setSize(this.baseWidth + 10, h + 10).setPosition(cx, cy);
    this.bounds.setPosition(this.x, this.y).setSize(this.baseWidth, h);
  }

  destroy(): void {
    this.body.destroy();
    this.glow.destroy();
  }
}
