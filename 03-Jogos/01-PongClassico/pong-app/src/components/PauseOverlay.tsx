import { useGameStore } from '../store/useGameStore';
import { sfx } from '../game/sfx';

/** Overlay de pausa — pausa de verdade (a cena congela via store.status). */
export function PauseOverlay() {
  const togglePause = useGameStore((s) => s.togglePause);
  const startMatch = useGameStore((s) => s.startMatch);
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div className="overlay" role="dialog" aria-label="Jogo pausado">
      <div className="overlay-card">
        <h2>⏸ PAUSADO</h2>
        <div className="overlay-actions">
          <button className="btn btn-primary" onClick={() => { sfx.click(); togglePause(); }}>
            ▶ Continuar
          </button>
          <button className="btn btn-ghost" onClick={() => { sfx.click(); startMatch(); }}>
            🔄 Reiniciar partida
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              sfx.click();
              setScreen('menu');
            }}
          >
            🏠 Sair para o menu
          </button>
        </div>
        <p className="muted small">Esc ou P para pausar/continuar</p>
      </div>
    </div>
  );
}
