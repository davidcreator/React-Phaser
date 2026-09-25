/**
 * Tipos de domínio compartilhados entre React (UI) e Phaser (gameplay).
 * Mantidos em um único módulo para evitar ciclos de importação.
 */

export type Screen = 'title' | 'menu' | 'controls' | 'ranking' | 'game';

export type GameStatus = 'running' | 'paused' | 'over';

export type ModeId =
  | 'classic'
  | 'multiplayer'
  | 'speed'
  | 'multi-ball'
  | 'obstacles'
  | 'power-ups';

export type Difficulty = 'easy' | 'medium' | 'hard';

/** Esquema de teclas do Jogador 1 */
export type P1Scheme = 'wasd' | 'arrows' | 'both';

/** Esquema de teclas do Jogador 2 (modo 2 jogadores) */
export type P2Scheme = 'ik' | 'arrows';

export type Side = 'p1' | 'p2';

export interface Settings {
  mode: ModeId;
  difficulty: Difficulty;
  /** Quantas vidas cada jogador começa na partida */
  lives: number;
  p1Scheme: P1Scheme;
  p2Scheme: P2Scheme;
  gamepadEnabled: boolean;
}

/** Estado de um jogador dentro da partida atual */
export interface PlayerState {
  score: number;
  goals: number;
  hits: number;
  lives: number;
}

export interface Session {
  p1: PlayerState;
  p2: PlayerState;
  /** Tempo de jogo efetivo (segundos, exclui pausas e bolas paradas) */
  timeSeconds: number;
  winner: Side | null;
  savedToRanking: boolean;
}

export const LIVES_OPTIONS = [1, 3, 5, 7, 9] as const;
export const DEFAULT_SETTINGS: Settings = {
  mode: 'classic',
  difficulty: 'medium',
  lives: 5,
  p1Scheme: 'both',
  p2Scheme: 'ik',
  gamepadEnabled: true,
};
