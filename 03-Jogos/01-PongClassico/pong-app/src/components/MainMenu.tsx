import { useGameStore, currentMultiplier } from '../store/useGameStore';
import { MODES } from '../game/modes';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../game/difficulty';
import { LIVES_OPTIONS, type Difficulty, type ModeId } from '../types';
import { playerLabel } from './labels';
import { sfx } from '../game/sfx';

/**
 * Menu principal: modalidades, nível (dificuldade), vidas,
 * atalhos para controles/ranking e botão de iniciar.
 */
export function MainMenu() {
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const startMatch = useGameStore((s) => s.startMatch);
  const setScreen = useGameStore((s) => s.setScreen);

  const mode = MODES.find((m) => m.id === settings.mode) ?? MODES[0];
  const diff = DIFFICULTIES[settings.difficulty];

  const pickMode = (id: ModeId) => {
    sfx.click();
    updateSettings({ mode: id });
  };
  const pickDifficulty = (id: Difficulty) => {
    sfx.click();
    updateSettings({ difficulty: id });
  };
  const pickLives = (lives: number) => {
    sfx.click();
    updateSettings({ lives });
  };
  const play = () => {
    sfx.unlock();
    sfx.click();
    startMatch();
  };

  return (
    <section className="screen menu-screen">
      <header className="menu-header">
        <h1>🏓 PONG CLÁSSICO</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => setScreen('title')}>
          ← Início
        </button>
      </header>

      <div className="menu-grid">
        <div className="menu-main">
          {/* ── Modalidades ── */}
          <h2 className="section-title">🎯 Modo de Jogo</h2>
          <div className="mode-grid" role="radiogroup" aria-label="Modo de jogo">
            {MODES.map((m) => (
              <button
                key={m.id}
                role="radio"
                aria-checked={settings.mode === m.id}
                className={`mode-card${settings.mode === m.id ? ' selected' : ''}`}
                onClick={() => pickMode(m.id)}
              >
                <span className="mode-icon">{m.icon}</span>
                <h3>{m.name}</h3>
                <p>{m.description}</p>
              </button>
            ))}
          </div>

          {/* ── Nível / Dificuldade ── */}
          <h2 className="section-title">🎚️ Nível</h2>
          <div className="seg" role="radiogroup" aria-label="Nível de dificuldade">
            {DIFFICULTY_ORDER.map((id) => (
              <button
                key={id}
                role="radio"
                aria-checked={settings.difficulty === id}
                className={settings.difficulty === id ? 'active' : ''}
                onClick={() => pickDifficulty(id)}
              >
                {DIFFICULTIES[id].name}
                <small>×{DIFFICULTIES[id].multiplier}</small>
              </button>
            ))}
          </div>
          <p className="field-hint">{diff.blurb}</p>

          {/* ── Vidas ── */}
          <h2 className="section-title">❤️ Vidas por Jogador</h2>
          <div className="seg" role="radiogroup" aria-label="Quantidade de vidas">
            {LIVES_OPTIONS.map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={settings.lives === n}
                className={settings.lives === n ? 'active' : ''}
                onClick={() => pickLives(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="field-hint">
            Ao sofrer um gol, o jogador perde 1 vida. Zerou vidas, perdeu a partida.
          </p>
        </div>

        {/* ── Resumo da partida ── */}
        <aside className="menu-summary panel">
          <h3>Resumo</h3>
          <dl>
            <div>
              <dt>Modo</dt>
              <dd>
                {mode.icon} {mode.name}
              </dd>
            </div>
            <div>
              <dt>Nível</dt>
              <dd>
                {diff.name} (×{diff.multiplier})
              </dd>
            </div>
            <div>
              <dt>Vidas</dt>
              <dd>❤️ × {settings.lives}</dd>
            </div>
            <div>
              <dt>Placar</dt>
              <dd>
                {playerLabel('p1', settings.mode)} vs {playerLabel('p2', settings.mode)}
              </dd>
            </div>
            <div>
              <dt>Pontos</dt>
              <dd>
                gol +{10 * currentMultiplier(settings)} · rally +
                {1 * currentMultiplier(settings)}
              </dd>
            </div>
          </dl>

          <div className="summary-actions">
            <button className="btn btn-ghost btn-block" onClick={() => { sfx.click(); setScreen('controls'); }}>
              ⌨️ Configurar Controles
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => { sfx.click(); setScreen('ranking'); }}>
              🏆 Ver Ranking
            </button>
          </div>

          <button className="btn btn-primary btn-xl btn-block" onClick={play}>
            ▶ INICIAR PARTIDA
          </button>
        </aside>
      </div>
    </section>
  );
}
