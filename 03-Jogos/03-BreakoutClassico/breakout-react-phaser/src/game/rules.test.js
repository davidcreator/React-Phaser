import { describe, expect, it } from 'vitest';
import {
  BALL,
  BRICK,
  MODES,
  WORLD,
  buildBrickLayout,
  calculatePaddleBounce,
  launchSpeedForLevel,
  movementDirection,
  startingLives,
  winnerForEscape,
} from './rules.js';

describe('regras determinísticas do Breakout', () => {
  it('gera uma formação válida dentro do campo e sem power-ups no duelo', () => {
    const bricks = buildBrickLayout(1, MODES.MULTIPLAYER, () => 0);
    expect(bricks).toHaveLength(BRICK.columns * BRICK.rows);
    expect(bricks.every((brick) => brick.hasPowerUp === false)).toBe(true);
    expect(bricks.every((brick) => brick.x - brick.width / 2 >= 0)).toBe(true);
    expect(bricks.every((brick) => brick.x + brick.width / 2 <= WORLD.width)).toBe(true);
  });

  it('aumenta a resistência por nível sem ultrapassar o máximo configurado', () => {
    const early = buildBrickLayout(1, MODES.CLASSIC, () => 1);
    const late = buildBrickLayout(13, MODES.CLASSIC, () => 1);
    expect(late[0].hits).toBe(4);
    expect(late[0].hits).toBeGreaterThan(early[0].hits);
    expect(Math.max(...late.map((brick) => brick.hits))).toBe(4);
  });

  it('faz a bola rebater para cima/baixo e mantém a velocidade pedida', () => {
    const up = calculatePaddleBounce(0.6, 400, 'up');
    const down = calculatePaddleBounce(-0.6, 400, 'down');
    expect(up.y).toBeLessThan(0);
    expect(down.y).toBeGreaterThan(0);
    expect(Math.hypot(up.x, up.y)).toBeCloseTo(400, 5);
    expect(Math.hypot(down.x, down.y)).toBeCloseTo(400, 5);
    expect(calculatePaddleBounce(2, 400).x).toBeCloseTo(
      calculatePaddleBounce(1, 400).x,
      5,
    );
  });

  it('atribui ponto de forma simétrica no multiplayer', () => {
    expect(winnerForEscape('top')).toBe('player1');
    expect(winnerForEscape('bottom')).toBe('player2');
    expect(winnerForEscape('left')).toBeNull();
  });

  it('recalcula a direção com inputs atuais sem reter o gamepad solto', () => {
    expect(movementDirection({ left: false, right: true })).toBe(1);
    expect(movementDirection({ left: false, right: false })).toBe(0);
    expect(movementDirection({ left: true, right: true })).toBe(0);
  });

  it('define a quantidade inicial de vidas conforme o modo', () => {
    expect(startingLives(MODES.CLASSIC)).toBe(3);
    expect(startingLives(MODES.SURVIVAL)).toBe(1);
    expect(startingLives(MODES.MULTIPLAYER)).toBeNull();
  });

  it('limita a velocidade por nível ao teto de segurança', () => {
    expect(launchSpeedForLevel(1)).toBe(BALL.launchSpeed);
    expect(launchSpeedForLevel(100)).toBe(BALL.maxSpeed);
  });
});
