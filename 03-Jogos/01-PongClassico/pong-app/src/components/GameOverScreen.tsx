import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { addEntry } from '../services/ranking';
import { DIFFICULTIES } from '../game/difficulty';
import { SCORING } from '../game/constants';
import { lsGet, lsSet } from '../services/storage';
import { defaultPlayerName, formatTime, winnerPhrase } from './labels';
import { sfx } from '../game/sfx';

const NAME_KEY = 'pong-player-name';

/**
 * Fim de partida: resultado, estatísticas, formulário de nome e
 * gravação no ranking (substitui os alert() bloqueantes do código antigo).
 */
export function GameOverScreen() {
  const session = useGameStore((s) => s.session);
  const settings = useGameStore((s) => s.settings);
  const startMatch = useGameStore((s) => s.startMatch);
  const setScreen = useGameStore((s) => s.setScreen);
  const markSaved = useGameStore((s) => s.markSavedToRanking);

  const winner = session.winner ?? 'p1';
  const stats = winner === 'p1' ? session.p1 : session.p2;
  const mult = DIFFICULTIES[settings.difficulty].multiplier;

  const [name, setName] = useState(
    () => lsGet(NAME_KEY) ?? defaultPlayerName(settings),
  );
  const [savedRank, setSavedRank] = useState<number | null>(null);
  const saved = session.savedToRanking;

  const save = () => {
    if (saved) return;
    const clean = name.trim().slice(0, 18) || defaultPlayerName(settings);
    lsSet(NAME_KEY, clean);
    const { rank } = addEntry({
      name: clean,
      score: stats.score,
      goals: stats.goals,
      hits: stats.hits,
      mode: settings.mode,
      difficulty: settings.difficulty,
      lives: settings.lives,
      date: new Date().toISOString(),
    });
    setSavedRank(rank);
    markSaved();
    sfx.powerUp();
  };

  return (
    <div className="overlay" role="dialog" aria-label="Fim de partida">
      <div className="overlay-card gameover-card">
        <h2 className={session.winner === 'p1' ? 'win' : 'lose'}>
          {winnerPhrase(settings, session)}
        </h2>

        <div className="go-stats">
          <div>
            <span className="muted">Pontuação</span>
            <strong className="big-score">{stats.score}</strong>
          </div>
          <div>
            <span className="muted">Gols</span>
            <strong>{stats.goals}</strong>
          </div>
          <div>
            <span className="muted">Rallys</span>
            <strong>{stats.hits}</strong>
          </div>
          <div>
            <span className="muted">Tempo</span>
            <strong>{formatTime(session.timeSeconds)}</strong>
          </div>
        </div>

        <p className="go-formula">
          ({stats.goals} gols × {SCORING.goal} + {stats.hits} rallys × {SCORING.hit})
          × nível {mult} = <b>{stats.score} pts</b>
        </p>

        {!saved ? (
          <div className="go-save">
            <input
              className="name-input"
              value={name}
              maxLength={18}
              placeholder="Seu nome (máx. 18)"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save();
              }}
            />
            <button className="btn btn-primary" onClick={save}>
              🏆 Salvar no ranking
            </button>
            <p className="muted small">
              Sua pontuação ainda não foi salva — não saia sem garantir a vaga! 😉
            </p>
          </div>
        ) : (
          <p className="saved-msg">
            ✅ Salvo no ranking
            {(savedRank ?? 0) > 0 ? ` na posição #${savedRank}!` : ' (fora do top 10)'}
          </p>
        )}

        <div className="overlay-actions">
          <button className="btn btn-primary" onClick={() => { sfx.click(); startMatch(); }}>
            🔄 Jogar novamente
          </button>
          <button className="btn btn-ghost" onClick={() => { sfx.click(); setScreen('ranking'); }}>
            🏆 Ver ranking
          </button>
          <button className="btn btn-ghost" onClick={() => { sfx.click(); setScreen('menu'); }}>
            🏠 Menu
          </button>
        </div>
      </div>
    </div>
  );
}
