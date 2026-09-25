import { useState } from 'react';
import { clearRanking, getRanking, type RankEntry } from '../services/ranking';
import { MODE_MAP } from '../game/modes';
import { DIFFICULTIES } from '../game/difficulty';
import { useGameStore } from '../store/useGameStore';
import { sfx } from '../game/sfx';

/** Ranking top 10 persistido em localStorage. */
export function RankingScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const [entries, setEntries] = useState<RankEntry[]>(() => getRanking());
  const [confirmingClear, setConfirmingClear] = useState(false);

  const back = () => {
    sfx.click();
    setScreen('menu');
  };

  const doClear = () => {
    sfx.click();
    clearRanking();
    setEntries([]);
    setConfirmingClear(false);
  };

  return (
    <section className="screen ranking-screen">
      <header className="menu-header">
        <h1>🏆 Ranking</h1>
        <button className="btn btn-ghost btn-sm" onClick={back}>
          ← Menu
        </button>
      </header>

      {entries.length === 0 ? (
        <div className="panel empty-state">
          <p className="big">🎯</p>
          <p>Nenhuma partida pontuada ainda.</p>
          <p className="muted">Jogue uma partida e salve sua pontuação para entrar no ranking!</p>
        </div>
      ) : (
        <div className="panel table-wrap">
          <table className="ranking-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Jogador</th>
                <th>Pontos</th>
                <th>Modo</th>
                <th>Nível</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id} className={i < 3 ? 'top' : ''}>
                  <td className="medal">{['🥇', '🥈', '🥉'][i] ?? i + 1}</td>
                  <td className="name-cell">{e.name}</td>
                  <td className="score-cell">{e.score}</td>
                  <td>{MODE_MAP[e.mode]?.icon ?? '🏓'} {MODE_MAP[e.mode]?.name ?? e.mode}</td>
                  <td>{DIFFICULTIES[e.difficulty]?.name ?? e.difficulty}</td>
                  <td className="muted">
                    {new Date(e.date).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="screen-actions space-between">
        {entries.length > 0 &&
          (confirmingClear ? (
            <span className="confirm-row">
              <span className="muted">Apagar todo o ranking?</span>
              <button className="btn btn-danger btn-sm" onClick={doClear}>
                Sim, apagar
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmingClear(false)}>
                Cancelar
              </button>
            </span>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => { sfx.click(); setConfirmingClear(true); }}>
              🗑 Limpar ranking
            </button>
          ))}
        <button className="btn btn-primary" onClick={back}>
          Voltar ao Menu
        </button>
      </div>
    </section>
  );
}
