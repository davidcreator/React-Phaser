/**
 * Teste da FSM + pontuação/vidas (store Zustand) — roda em Node puro.
 * Verifica os itens: gol reduz vida, game over ao zerar vidas,
 * multiplicadores por nível, pausa e rematch.
 */
import assert from 'node:assert';
import { useGameStore } from '../src/store/useGameStore';
import { MULTIPLIER, SCORING } from '../src/game/constants';

const store = useGameStore.getState;

// 1) Estado inicial
assert.equal(store().screen, 'title', 'deve iniciar na tela title');

// 2) Configurações
store().updateSettings({ mode: 'classic', difficulty: 'hard', lives: 3 });
assert.equal(store().settings.difficulty, 'hard');
assert.equal(MULTIPLIER[store().settings.difficulty], 3);

// 3) Iniciar partida zera o session e vai para game/running
store().startMatch();
assert.equal(store().screen, 'game');
assert.equal(store().status, 'running');
assert.equal(store().session.p1.lives, 3);
assert.equal(store().session.p1.score, 0);
const match1 = store().matchId;

// 4) Rally pontua 1×multiplicador
store().addHit('p1');
assert.equal(store().session.p1.score, SCORING.hit * 3, 'rally = 1×3');
assert.equal(store().session.p1.hits, 1);

// 5) Gol pontua 10×multiplicador e remove vida do adversário
const r1 = store().addGoal('p1');
assert.equal(r1.gameOver, false);
assert.equal(store().session.p1.score, SCORING.hit * 3 + SCORING.goal * 3);
assert.equal(store().session.p2.lives, 2, 'P2 perde 1 vida');
assert.equal(store().session.winner, null);

// 6) Pausa
store().setPaused(true);
assert.equal(store().status, 'paused');
const blocked = store().addGoal('p1');
assert.equal(blocked.gameOver, false, 'meta não pontua pausado');
assert.equal(store().session.p1.goals, 1, 'gol pausado foi ignorado');
store().setPaused(false);
assert.equal(store().status, 'running');

// 7) Zerar vidas → game over + winner
store().addGoal('p1'); // 1 vida
store().addGoal('p1'); // 0 vidas
assert.equal(store().session.p2.lives, 0);
assert.equal(store().status, 'over', 'status vira over');
assert.equal(store().session.winner, 'p1');
assert.equal(
  store().session.p1.score,
  SCORING.hit * 3 + SCORING.goal * 3 * 3,
  '3 gols × 10 × 3 + rally',
);

// 8) Metas ignoradas depois do game over
const after = store().addGoal('p1');
assert.equal(after.gameOver, false);
assert.equal(store().session.p1.goals, 3);

// 9) Rematch zera tudo e incrementa matchId
store().startMatch();
assert.equal(store().status, 'running');
assert.equal(store().session.p1.score, 0);
assert.equal(store().session.p1.lives, 3);
assert.ok(store().matchId > match1, 'matchId avança para restart da cena');

// 10) Timer guarda só inteiros diferentes
store().setTime(1);
store().setTime(1);
store().setTime(2);
assert.equal(store().session.timeSeconds, 2);

console.log('✅ store.test: 10/10 asserções passaram');
