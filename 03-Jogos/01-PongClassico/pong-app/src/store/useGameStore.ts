/**
 * Store global (Zustand) — fonte única de verdade do estado da aplicação.
 *
 * Arquitetura de estados (elimina os bugs P0 do diagnóstico por construção):
 *   screen:    title → menu → controls/ranking → game → (game over) → menu
 *   status:    running ⇄ paused → over   (FSM sem alert(), sem setTimeout solto)
 *
 * A cena Phaser é a ÚNICA mutadora de score/vidas durante a partida;
 * React apenas lê o estado para renderizar o HUD e os overlays.
 */

import { create } from 'zustand';
import {
  DEFAULT_SETTINGS,
  type GameStatus,
  type PlayerState,
  type Screen,
  type Session,
  type Settings,
  type Side,
} from '../types';
import { MULTIPLIER, SCORING } from '../game/constants';
import { lsGet, lsSet } from '../services/storage';

const SETTINGS_KEY = 'pong-settings-v1';

function loadSettings(): Settings {
  const raw = lsGet(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function freshPlayer(lives: number): PlayerState {
  return { score: 0, goals: 0, hits: 0, lives };
}

function freshSession(lives: number): Session {
  return {
    p1: freshPlayer(lives),
    p2: freshPlayer(lives),
    timeSeconds: 0,
    winner: null,
    savedToRanking: false,
  };
}

interface GameState {
  screen: Screen;
  status: GameStatus;
  /** Incrementado a cada partida — a UI usa para reiniciar a cena Phaser */
  matchId: number;
  settings: Settings;
  session: Session;

  setScreen: (screen: Screen) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  /** Prepara uma nova partida (session limpa, status running) */
  startMatch: () => void;
  togglePause: () => void;
  setPaused: (paused: boolean) => void;
  /** Segundos de jogo efetivo (chamado pela cena, máx. 1x/seg) */
  setTime: (seconds: number) => void;
  /** Rally acertado — pontua para o lado informado */
  addHit: (side: Side) => void;
  /**
   * Gol marcado: +10×multiplicador para o marcador, −1 vida para quem sofreu.
   * Se as vidas chegarem a 0 → status 'over' e winner definido.
   */
  addGoal: (scorer: Side) => { gameOver: boolean };
  markSavedToRanking: () => void;
}

export const useGameStore = create<GameState>()((set, get) => ({
  screen: 'title',
  status: 'running',
  matchId: 0,
  settings: loadSettings(),
  session: freshSession(loadSettings().lives),

  setScreen: (screen) => set({ screen }),

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    lsSet(SETTINGS_KEY, JSON.stringify(settings));
    // Vidas só valem para a PRÓXIMA partida — a session atual não é tocada
    set({ settings });
  },

  startMatch: () => {
    const { settings, matchId } = get();
    set({
      screen: 'game',
      status: 'running',
      matchId: matchId + 1,
      session: freshSession(settings.lives),
    });
  },

  togglePause: () => {
    const { screen, status } = get();
    if (screen !== 'game') return;
    if (status === 'running') set({ status: 'paused' });
    else if (status === 'paused') set({ status: 'running' });
  },

  setPaused: (paused) => {
    const { screen, status } = get();
    if (screen !== 'game' || status === 'over') return;
    set({ status: paused ? 'paused' : 'running' });
  },

  setTime: (seconds) => {
    if (get().session.timeSeconds === seconds) return;
    set((s) => ({ session: { ...s.session, timeSeconds: seconds } }));
  },

  addHit: (side) => {
    const { status, settings } = get();
    if (status !== 'running') return;
    const mult = MULTIPLIER[settings.difficulty];
    set((s) => {
      const player = { ...s.session[side] };
      player.hits += 1;
      player.score += SCORING.hit * mult;
      return { session: { ...s.session, [side]: player } as Session };
    });
  },

  addGoal: (scorer) => {
    const { status, settings } = get();
    if (status !== 'running') return { gameOver: false };

    const mult = MULTIPLIER[settings.difficulty];
    const conceeded: Side = scorer === 'p1' ? 'p2' : 'p1';

    set((s) => {
      const scorerState = { ...s.session[scorer] };
      scorerState.goals += 1;
      scorerState.score += SCORING.goal * mult;

      const conceededState = { ...s.session[conceeded] };
      conceededState.lives = Math.max(0, conceededState.lives - 1);

      const gameOver = conceededState.lives <= 0;

      return {
        session: {
          ...s.session,
          [scorer]: scorerState,
          [conceeded]: conceededState,
          winner: gameOver ? scorer : null,
          status: gameOver ? 'over' : s.status,
        } as Session,
        status: gameOver ? 'over' : s.status,
      };
    });

    return { gameOver: get().status === 'over' };
  },

  markSavedToRanking: () =>
    set((s) => ({ session: { ...s.session, savedToRanking: true } })),
}));

/** Multiplicador da dificuldade ativa (atalho para UI) */
export const currentMultiplier = (settings: Settings): number =>
  MULTIPLIER[settings.difficulty];
