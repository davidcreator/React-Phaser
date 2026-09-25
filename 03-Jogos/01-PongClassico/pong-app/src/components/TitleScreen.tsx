import { useGameStore } from '../store/useGameStore';
import { sfx } from '../game/sfx';

/** Tela inicial — primeiro estado da FSM de telas. */
export function TitleScreen() {
  const setScreen = useGameStore((s) => s.setScreen);

  const start = () => {
    sfx.unlock();
    sfx.click();
    setScreen('menu');
  };

  return (
    <section className="screen title-screen">
      <div className="title-logo">
        <span className="title-ball" aria-hidden="true" />
        <h1>PONG CLÁSSICO</h1>
      </div>
      <p className="title-sub">React + Phaser · Edição Refatorada 2026</p>

      <button className="btn btn-primary btn-xl" onClick={start}>
        ▶ COMEÇAR
      </button>

      <div className="title-features">
        <span>6 modos</span>
        <span>·</span>
        <span>níveis</span>
        <span>·</span>
        <span>vidas</span>
        <span>·</span>
        <span>ranking</span>
        <span>·</span>
        <span>gamepad</span>
      </div>

      <footer className="title-footer">
        Projeto educacional refatorado a partir do diagnóstico técnico —
        House Software · 2026
      </footer>
    </section>
  );
}
