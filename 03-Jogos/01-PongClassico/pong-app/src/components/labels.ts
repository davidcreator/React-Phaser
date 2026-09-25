import type { ModeId, Side } from '../types';
import { MODE_MAP } from '../game/modes';
import type { Session, Settings } from '../types';

/** Rótulo do jogador no HUD/placar, conforme o modo. */
export function playerLabel(side: Side, mode: ModeId): string {
  if (side === 'p1') return mode === 'multiplayer' ? 'JOGADOR 1' : 'VOCÊ';
  return MODE_MAP[mode].cpu ? 'CPU' : 'JOGADOR 2';
}

/** Frase de vitória no fim de partida. */
export function winnerPhrase(settings: Settings, session: Session): string {
  if (!session.winner) return 'EMPATE';
  if (settings.mode === 'multiplayer') {
    return session.winner === 'p1' ? 'JOGADOR 1 VENCEU!' : 'JOGADOR 2 VENCEU!';
  }
  return session.winner === 'p1' ? 'VITÓRIA! 🏆' : 'A CPU VENCEU 💀';
}

/** Nome padrão sugerido no formulário do ranking. */
export function defaultPlayerName(settings: Settings): string {
  if (settings.mode !== 'multiplayer') return 'VOCÊ';
  return 'JOGADOR 1';
}

/** Tempo mm:ss */
export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
