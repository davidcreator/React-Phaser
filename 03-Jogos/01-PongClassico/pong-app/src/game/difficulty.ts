/**
 * Definições de dificuldade (níveis).
 * Afeta: velocidade da bola/máxima, velocidade da CPU, qualidade da IA
 * e o multiplicador de pontuação usado no ranking.
 */

import type { Difficulty } from '../types';

export type AIMode = 'chase' | 'track' | 'predict';

export interface DifficultyDef {
  id: Difficulty;
  name: string;
  blurb: string;
  /** Multiplicador aplicado a gols e rallys na pontuação final */
  multiplier: number;
  /** Velocidade inicial da bola (px/s) */
  ballSpeed: number;
  /** Velocidade máxima da bola (px/s) */
  ballMax: number;
  /** Velocidade da paleta do jogador (px/s) */
  playerSpeed: number;
  /** Velocidade da paleta da CPU (px/s) */
  cpuSpeed: number;
  aiMode: AIMode;
  /** Margem morta da IA (px) — maior = IA mais "humana" */
  aiDeadzone: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyDef> = {
  easy: {
    id: 'easy',
    name: 'Fácil',
    blurb: 'CPU lenta, bola calma — para treinar',
    multiplier: 1,
    ballSpeed: 260,
    ballMax: 430,
    playerSpeed: 430,
    cpuSpeed: 190,
    aiMode: 'chase',
    aiDeadzone: 48,
  },
  medium: {
    id: 'medium',
    name: 'Médio',
    blurb: 'Rivalidade equilibrada e ritmo clássico',
    multiplier: 2,
    ballSpeed: 320,
    ballMax: 540,
    playerSpeed: 440,
    cpuSpeed: 300,
    aiMode: 'track',
    aiDeadzone: 22,
  },
  hard: {
    id: 'hard',
    name: 'Difícil',
    blurb: 'CPU prevê trajetória — sofrimento garantido',
    multiplier: 3,
    ballSpeed: 380,
    ballMax: 680,
    playerSpeed: 450,
    cpuSpeed: 410,
    aiMode: 'predict',
    aiDeadzone: 8,
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];
