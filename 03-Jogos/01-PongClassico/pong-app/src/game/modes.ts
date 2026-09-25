/**
 * Modos de jogo (modalidades herdadas do projeto original,
 * agora com dados puros e sem lógica embutida — a cena consome estas definições).
 */

import type { ModeId } from '../types';

export interface ModeDef {
  id: ModeId;
  name: string;
  icon: string;
  description: string;
  /** true = o Jogador 2 é controlado pela CPU */
  cpu: boolean;
  /** Quantidade de bolas no saque inicial */
  initialBalls: number;
  obstacles: boolean;
  powerUps: boolean;
  /** Modo Velocidade: bola acelera continuamente até o teto */
  speedRamp: boolean;
}

export const MODES: ModeDef[] = [
  {
    id: 'classic',
    name: 'Clássico',
    icon: '🏓',
    description: 'Jogador vs CPU no formato tradicional',
    cpu: true,
    initialBalls: 1,
    obstacles: false,
    powerUps: false,
    speedRamp: false,
  },
  {
    id: 'multiplayer',
    name: '2 Jogadores',
    icon: '👥',
    description: 'Duelo local: Jogador 1 vs Jogador 2',
    cpu: false,
    initialBalls: 1,
    obstacles: false,
    powerUps: false,
    speedRamp: false,
  },
  {
    id: 'speed',
    name: 'Velocidade',
    icon: '⚡',
    description: 'A bola acelera constantemente até o limite',
    cpu: true,
    initialBalls: 1,
    obstacles: false,
    powerUps: false,
    speedRamp: true,
  },
  {
    id: 'multi-ball',
    name: 'Multi-Bola',
    icon: '⚽',
    description: 'Três bolas em campo ao mesmo tempo',
    cpu: true,
    initialBalls: 3,
    obstacles: false,
    powerUps: false,
    speedRamp: false,
  },
  {
    id: 'obstacles',
    name: 'Obstáculos',
    icon: '🧱',
    description: 'Blocos no meio do campo que quebram em 3 hits',
    cpu: true,
    initialBalls: 1,
    obstacles: true,
    powerUps: false,
    speedRamp: false,
  },
  {
    id: 'power-ups',
    name: 'Power-ups',
    icon: '⭐',
    description: 'Colete poderes especiais durante a partida',
    cpu: true,
    initialBalls: 1,
    obstacles: false,
    powerUps: true,
    speedRamp: false,
  },
];

export const MODE_MAP: Record<ModeId, ModeDef> = MODES.reduce(
  (acc, mode) => {
    acc[mode.id] = mode;
    return acc;
  },
  {} as Record<ModeId, ModeDef>,
);
