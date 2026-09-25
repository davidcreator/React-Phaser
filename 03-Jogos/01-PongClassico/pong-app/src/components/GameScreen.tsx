import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { PhaserGame } from './PhaserGame';
import { Hud } from './Hud';
import { PauseOverlay } from './PauseOverlay';
import { GameOverScreen } from './GameOverScreen';

/**
 * Tela da partida = HUD + canvas Phaser + overlays.
 * Responsável pelos atalhos globais do jogo:
 *  • Esc/P → pausar/continuar
 *  • auto-pause ao perder o foco da aba/janela (corrige P2-4)
 *  • preventDefault nas setas só aqui (corrige P1-2 sem quebrar inputs)
 */
export function GameScreen() {
  const status = useGameStore((s) => s.status);
  const mode = useGameStore((s) => s.settings.mode);

  // Pausa via teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        useGameStore.getState().togglePause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Auto-pause quando a aba/janela perde o foco
  useEffect(() => {
    const pause = () => useGameStore.getState().setPaused(true);
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', pause);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', pause);
    };
  }, []);

  // As setas não podem rolar a página durante a partida…
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      ) {
        return; // …mas digitando no campo de nome, elas seguem normais
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section className="screen game-screen">
      <Hud />
      <div className="stage">
        <PhaserGame />
        {status === 'paused' && <PauseOverlay />}
        {status === 'over' && <GameOverScreen />}
      </div>
      <footer className="game-hints">
        <span>
          {mode === 'multiplayer' ? 'P1: ' : ''}
          {hintFor(mode)}
        </span>
        <span>Esc/P: pausar</span>
        <span>Arrastar no campo: toque</span>
      </footer>
    </section>
  );
}

function hintFor(mode: string): string {
  if (mode === 'multiplayer') return 'W/S ou ↑↓ · P2: I/K ou ↑↓';
  return 'Mover: W/S ou ↑↓ · Gamepad: analógico/D-pad';
}
