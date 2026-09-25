import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { BRICK, MODES } from './game/rules.js';

const PhaserCanvas = lazy(() => import('./game/PhaserCanvas.jsx'));

const MODE_CARDS = [
  {
    id: MODES.CLASSIC,
    number: '01',
    icon: '▦',
    title: 'Clássico',
    description: 'Quebre os blocos, preserve suas vidas e avance por níveis cada vez mais difíceis.',
    tag: '3 VIDAS',
  },
  {
    id: MODES.SURVIVAL,
    number: '02',
    icon: '◈',
    title: 'Sobrevivência',
    description: 'Uma vida. Ondas infinitas. Cada nível aumenta a resistência dos blocos e a velocidade.',
    tag: 'UMA VIDA',
  },
  {
    id: MODES.MULTIPLAYER,
    number: '03',
    icon: '⇄',
    title: 'Duelo local',
    description: 'Dois jogadores, uma bola e uma partida até cinco pontos. O duelo é simétrico.',
    tag: '2 JOGADORES',
  },
];

const EMPTY_HUD = {
  mode: MODES.CLASSIC,
  score: 0,
  lives: 3,
  level: 1,
  bricksRemaining: 80,
  player1Score: 0,
  player2Score: 0,
  paused: false,
  ready: true,
  effects: [],
};

function ModeCard({ card, onStart }) {
  return (
    <button className={`mode-card mode-${card.id}`} onClick={() => onStart(card.id)}>
      <span className="mode-card-top">
        <span className="mode-number">{card.number} / MODE</span>
        <span className="mode-tag">{card.tag}</span>
      </span>
      <span className="mode-icon" aria-hidden="true">{card.icon}</span>
      <span className="mode-title">{card.title}</span>
      <span className="mode-description">{card.description}</span>
      <span className="mode-cta">JOGAR <span aria-hidden="true">↗</span></span>
    </button>
  );
}

export default function App() {
  const sceneRef = useRef(null);
  const [screen, setScreen] = useState('menu');
  const [mode, setMode] = useState(MODES.CLASSIC);
  const [hud, setHud] = useState(EMPTY_HUD);
  const [result, setResult] = useState(null);

  const receiveHud = useCallback((nextHud) => setHud(nextHud), []);
  const receiveGameOver = useCallback((nextResult) => setResult(nextResult), []);
  const receiveScene = useCallback((scene) => { sceneRef.current = scene; }, []);

  const startGame = useCallback((nextMode) => {
    setMode(nextMode);
    setHud({ ...EMPTY_HUD, mode: nextMode, lives: nextMode === MODES.SURVIVAL ? 1 : nextMode === MODES.MULTIPLAYER ? null : 3 });
    setResult(null);
    setScreen('game');
  }, []);

  const returnToMenu = useCallback(() => {
    setResult(null);
    setScreen('menu');
  }, []);

  const launchOrPause = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (hud.ready) scene.launchBall();
    else scene.togglePause();
  }, [hud.ready]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={returnToMenu} aria-label="Voltar ao início">
          <span className="brand-mark">DC</span>
          <span className="brand-copy"><strong>DAVID CREATOR</strong><small>ARCADE LAB · 2D</small></span>
        </button>
        <div className="topbar-status"><span className="status-dot" /> BUILD 01.26 <span className="topbar-divider">/</span> REACT × PHASER</div>
      </header>

      {screen === 'menu' ? (
        <section className="landing">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="eyebrow"><span>✳</span> UM CLÁSSICO, REFEITO PARA JOGAR</div>
              <h1>Quebre tudo.<br /><em>Não deixe cair.</em></h1>
              <p className="hero-lede">Três maneiras de testar seus reflexos. Uma barra, uma bola e aquela vontade de acertar só mais uma rebatida.</p>
              <div className="hero-meta">
                <span><b>60</b><small>FPS FIXOS</small></span>
                <span><b>03</b><small>MODOS</small></span>
                <span><b>∞</b><small>REPLAYS</small></span>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one" /><div className="orbit orbit-two" />
              <div className="hero-brick brick-a" /><div className="hero-brick brick-b" /><div className="hero-brick brick-c" />
              <div className="hero-brick brick-d" /><div className="hero-brick brick-e" />
              <div className="hero-ball" /><div className="hero-paddle" />
              <span className="art-label art-label-top">BREAK<br />THE PATTERN</span>
              <span className="art-label art-label-bottom">EST. 1976<br />REBUILT 2026</span>
            </div>
          </div>

          <div className="section-heading">
            <div><span className="eyebrow">ESCOLHA SUA PARTIDA</span><h2>Selecione um modo</h2></div>
            <span className="section-index">01 — 03</span>
          </div>
          <div className="mode-grid">
            {MODE_CARDS.map((card) => <ModeCard key={card.id} card={card} onStart={startGame} />)}
          </div>

          <section className="controls-strip">
            <div className="controls-title"><span className="controls-icon">⌘</span><div><b>CONTROLES</b><small>Escolha seu jeito de jogar</small></div></div>
            <div className="control-item"><span className="keycap">A</span><span className="keycap">D</span><small>MOVER</small></div>
            <div className="control-item"><span className="keycap key-wide">← →</span><small>MOVER / J2 NO DUELO</small></div>
            <div className="control-item"><span className="keycap key-wide">ESPAÇO</span><small>LANÇAR / PAUSAR</small></div>
            <div className="control-item"><span className="keycap">R</span><small>REINICIAR</small></div>
            <div className="touch-note">TOUCH <span>arraste a barra</span></div>
          </section>
          <p className="footnote">Desenvolvido para teclado, gamepad e telas sensíveis ao toque.</p>
        </section>
      ) : (
        <section className="game-page">
          <div className="game-page-heading">
            <button className="back-link" onClick={returnToMenu}><span aria-hidden="true">←</span> MODOS</button>
            <div className="game-title-block">
              <span className="eyebrow">{mode === MODES.MULTIPLAYER ? 'DUEL MODE · 2 PLAYERS' : mode === MODES.SURVIVAL ? 'SURVIVAL MODE · ENDLESS' : 'CLASSIC MODE · SOLO'}</span>
              <h1>Breakout <em>{MODE_CARDS.find((card) => card.id === mode)?.title}</em></h1>
            </div>
            <div className="game-actions-top">
              <button className="icon-button" onClick={() => { setResult(null); sceneRef.current?.restartGame(); }} title="Reiniciar partida" aria-label="Reiniciar partida">↻</button>
              <button className="icon-button" onClick={returnToMenu} title="Sair para o menu" aria-label="Sair para o menu">×</button>
            </div>
          </div>

          <div className="game-layout">
            <div className="game-main-column">
              <div className="hud-bar">
                {mode === MODES.MULTIPLAYER ? (
                  <>
                    <HudMetric label="JOGADOR 1" value={hud.player1Score ?? 0} accent="mint" />
                    <span className="duel-divider">×</span>
                    <HudMetric label="JOGADOR 2" value={hud.player2Score ?? 0} accent="coral" />
                    <div className="hud-spacer" />
                    <HudMetric label="ALVO" value="05" accent="muted" />
                  </>
                ) : (
                  <>
                    <HudMetric label="PONTUAÇÃO" value={Number(hud.score || 0).toLocaleString('pt-BR')} accent="mint" />
                    <HudMetric label="VIDAS" value={hud.lives ?? 0} accent="coral" />
                    <HudMetric label={mode === MODES.SURVIVAL ? 'ONDA' : 'NÍVEL'} value={String(hud.level ?? 1).padStart(2, '0')} accent="gold" />
                    <div className="hud-spacer" />
                    <div className={`live-indicator ${hud.paused ? 'is-paused' : ''}`}><span />{hud.paused ? 'PAUSADO' : hud.ready ? 'PRONTO' : 'EM JOGO'}</div>
                  </>
                )}
              </div>

              <div className="canvas-frame">
                <div className="canvas-topline"><span><i /> ARCADE SESSION</span><span>900 × 640 <b>·</b> {mode.toUpperCase()}</span></div>
                <Suspense fallback={<div className="phaser-loading">PREPARANDO O CAMPO…</div>}>
                  <PhaserCanvas
                    key={mode}
                    mode={mode}
                    onHud={receiveHud}
                    onGameOver={receiveGameOver}
                    onSceneReady={receiveScene}
                  />
                </Suspense>
                {hud.ready && !result && (
                  <div className="ready-callout" aria-live="polite">
                    <span className="ready-icon">{mode === MODES.MULTIPLAYER ? '⇄' : '↗'}</span>
                    <strong>{mode === MODES.MULTIPLAYER ? 'PRONTO PARA O DUELO?' : 'A BOLA ESTÁ COM VOCÊ'}</strong>
                    <small>TOQUE NO CAMPO OU PRESSIONE ESPAÇO PARA COMEÇAR</small>
                  </div>
                )}
                {hud.paused && !result && <div className="pause-shade"><span>PAUSADO</span><small>Pressione espaço ou continuar</small></div>}
                {result && (
                  <div className="result-overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
                    <div className="result-card">
                      <span className="eyebrow">FIM DA PARTIDA</span>
                      <h2 id="result-title">{result.title}</h2>
                      <p>{result.message}</p>
                      <div className="result-buttons">
                        <button className="primary-button" onClick={() => { setResult(null); sceneRef.current?.restartGame(); }}>JOGAR DE NOVO <span>↻</span></button>
                        <button className="secondary-button" onClick={returnToMenu}>VOLTAR AO MENU</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="game-toolbar">
                <div className="toolbar-tip"><span className="tip-dot" />{mode === MODES.MULTIPLAYER ? 'P1: A/D · P2: ←/→ · primeiro a 5 pontos vence' : 'A/D ou ←/→ para mover · arraste no touch'}</div>
                <div className="toolbar-buttons">
                  <button className="toolbar-button" onClick={launchOrPause} disabled={Boolean(result)}>
                    <span>{hud.ready ? '▶' : hud.paused ? '▶' : 'Ⅱ'}</span>{hud.ready ? 'LANÇAR' : hud.paused ? 'CONTINUAR' : 'PAUSAR'}
                  </button>
                  <button className="toolbar-button toolbar-secondary" onClick={() => sceneRef.current?.restartGame()} disabled={Boolean(result)}><span>↻</span> REINICIAR</button>
                </div>
              </div>
            </div>

            <aside className="game-sidebar">
              <div className="sidebar-card session-card">
                <span className="eyebrow">SESSÃO ATUAL</span>
                <div className="session-number">{String(hud.level ?? 1).padStart(2, '0')}<span> / {mode === MODES.SURVIVAL ? '∞' : '∞'}</span></div>
                <p>{mode === MODES.SURVIVAL ? 'Sobreviva a ondas sem fim. A velocidade cresce a cada nível.' : mode === MODES.MULTIPLAYER ? 'Faça a bola escapar pelo lado adversário. Quem chega a cinco pontos vence.' : 'Limpe os blocos para avançar. A cada três níveis, ganhe uma vida.'}</p>
                <div className="progress-track"><span style={{ width: `${Math.min(100, Math.max(0, (1 - (hud.bricksRemaining ?? BRICK.columns * BRICK.rows) / (BRICK.columns * BRICK.rows)) * 100))}%` }} /></div>
                <small>{mode === MODES.MULTIPLAYER ? `${hud.bricksRemaining ?? 0} BLOCOS NA ARENA` : `${hud.bricksRemaining ?? 0} BLOCOS RESTANTES`}</small>
              </div>

              <div className="sidebar-card effects-card">
                <div className="sidebar-heading"><span className="eyebrow">POWER-UPS</span><span className="tiny-count">{hud.effects?.length ?? 0}</span></div>
                {hud.effects?.length ? (
                  <div className="effects-list">
                    {hud.effects.map((effect) => <div className="effect-pill" key={effect.type}><span>{effect.icon}</span><b>{effect.label}</b><small>{effect.remaining > 0 ? `${effect.remaining}s` : '∞'}</small></div>)}
                  </div>
                ) : <div className="empty-effects"><span>◇</span><p>Nenhum efeito ativo.<br />Quebre um bloco marcado para encontrar um.</p></div>}
              </div>

              <div className="sidebar-card quick-controls">
                <span className="eyebrow">DICAS RÁPIDAS</span>
                <div className="quick-row"><span className="keycap mini">ESPAÇO</span><small>Lançar ou pausar</small></div>
                <div className="quick-row"><span className="keycap mini">R</span><small>Reiniciar a partida</small></div>
                <div className="quick-row"><span className="keycap mini">GAMEPAD</span><small>D-pad ou analógico</small></div>
              </div>
            </aside>
          </div>

          <footer className="game-footer"><span>DAVID CREATOR <b>·</b> ARCADE LAB</span><span>FEITO COM REACT + PHASER 3</span></footer>
        </section>
      )}
    </main>
  );
}

function HudMetric({ label, value, accent }) {
  return <div className={`hud-metric accent-${accent}`}><small>{label}</small><strong>{value}</strong></div>;
}
