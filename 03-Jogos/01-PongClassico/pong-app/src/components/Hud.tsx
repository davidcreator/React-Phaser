import { useGameStore } from '../store/useGameStore';
import { MODE_MAP } from '../game/modes';
import { DIFFICULTIES } from '../game/difficulty';
import { formatTime, playerLabel } from './labels';

function Hearts({ lives, total }: { lives: number; total: number }) {
  return (
    <span className="hearts" aria-label={`${lives} de ${total} vidas`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < lives ? 'heart on' : 'heart'}>
          {i < lives ? '❤️' : '🖤'}
        </span>
      ))}
    </span>
  );
}

/**
 * HUD da partida — 100% React, sobreposto ao canvas do Phaser.
 * Placar, vidas, cronômetro, modo, nível e botão de pausar.
 */
export function Hud() {
  const session = useGameStore((s) => s.session);
  const settings = useGameStore((s) => s.settings);
  const status = useGameStore((s) => s.status);
  const togglePause = useGameStore((s) => s.togglePause);

  const mode = MODE_MAP[settings.mode];
  const diff = DIFFICULTIES[settings.difficulty];
  const paused = status === 'paused';

  return (
    <div className="hud">
      <div className="hud-side left">
        <div className="hud-label">{playerLabel('p1', settings.mode)}</div>
        <div className="hud-score green">{session.p1.score}</div>
        <Hearts lives={session.p1.lives} total={settings.lives} />
      </div>

      <div className="hud-center">
        <div className="hud-badge">
          {mode.icon} {mode.name} · {diff.name} ×{diff.multiplier}
        </div>
        <div className="hud-timer">⏱ {formatTime(session.timeSeconds)}</div>
      </div>

      <div className="hud-side right">
        <div className="hud-label">{playerLabel('p2', settings.mode)}</div>
        <div className="hud-score red">{session.p2.score}</div>
        <Hearts lives={session.p2.lives} total={settings.lives} />
      </div>

      <button
        className="btn btn-ghost btn-sm hud-pause"
        onClick={togglePause}
        disabled={status === 'over'}
      >
        {paused ? '▶' : '⏸'}
      </button>
    </div>
  );
}
