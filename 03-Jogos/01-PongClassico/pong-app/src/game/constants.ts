/**
 * Constantes de gameplay e fórmula de pontuação.
 * Fonte única de verdade — UI e cena leiam sempre daqui.
 */

import type { Difficulty } from '../types';

export const W = 800;
export const H = 400;

export const PADDLE_W = 15;
export const PADDLE_H = 100;
export const PADDLE_BOOST_H = 150;
export const PADDLE_MARGIN = 20;

export const BALL_R = 11;

/** Pontos base — multiplicados pelo multiplicador da dificuldade */
export const SCORING = {
  /** por gol marcado */
  goal: 10,
  /** por rally (acerto na paleta) */
  hit: 1,
} as const;

export const MULTIPLIER: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export const COLORS = {
  green: '#00ff88',
  red: '#ff6b6b',
  yellow: '#ffeb3b',
  blue: '#45b7d1',
  teal: '#4ecdc4',
  mint: '#96ceb4',
  white: '#f4f7ff',
  line: '#2c3140',
} as const;

export const COLOR_HEX = {
  green: 0x00ff88,
  red: 0xff6b6b,
  yellow: 0xffeb3b,
  blue: 0x45b7d1,
  teal: 0x4ecdc4,
  mint: 0x96ceb4,
  white: 0xf4f7ff,
} as const;

/** Duração dos efeitos de power-up (segundos) */
export const POWERUP = {
  buffDuration: 8,
  slowDuration: 6,
  spawnMin: 8,
  spawnVar: 5,
  maxOnField: 2,
} as const;
