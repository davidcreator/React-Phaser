import { useCallback, useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { AudioDirector, type SoundEffect } from "./game/audio";
import {
  gameCommands,
  ShadowScene,
  type ControlMode,
  type Difficulty,
  type GameSettings,
  type GameSignal,
  type GameStartState,
  type HudData,
} from "./game/ShadowScene";

type Screen = "menu" | "options" | "guide" | "game";
type GameOverlay = "pause" | "gameOver" | "victory" | null;

interface AppSettings extends GameSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  difficulty: "normal",
  control: "keyboard",
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.55,
  sfxVolume: 0.75,
};

const INITIAL_HUD: HudData = {
  health: 100,
  lives: 4,
  kills: 0,
  enemies: 8,
  level: 1,
  shurikenReady: true,
};

const INITIAL_GAME_STATE: GameStartState = {
  level: 1,
  lives: 4,
  kills: 0,
  rewardedAt: 0,
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [returnScreen, setReturnScreen] = useState<Screen>("menu");
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [hud, setHud] = useState<HudData>(INITIAL_HUD);
  const [overlay, setOverlay] = useState<GameOverlay>(null);
  const [runId, setRunId] = useState(0);
  const [gameStartState, setGameStartState] = useState<GameStartState>(INITIAL_GAME_STATE);
  const [changingLevel, setChangingLevel] = useState(false);
  const [gamepadConnected, setGamepadConnected] = useState(() => Boolean(navigator.getGamepads?.().some(Boolean)));
  const audioRef = useRef<AudioDirector | null>(null);

  if (!audioRef.current) audioRef.current = new AudioDirector();

  useEffect(() => {
    const audio = audioRef.current;
    audio?.configure(settings.musicVolume, settings.sfxVolume, settings.musicEnabled, settings.sfxEnabled);
    if (settings.musicEnabled && screen !== "game") audio?.startMusic();
    if (!settings.musicEnabled) audio?.stopMusic();
    window.localStorage.setItem("shinobi-eclipse-settings", JSON.stringify(settings));
  }, [settings, screen]);

  useEffect(() => {
    const connected = () => setGamepadConnected(true);
    const disconnected = () => setGamepadConnected(Boolean(navigator.getGamepads?.().some(Boolean)));
    window.addEventListener("gamepadconnected", connected);
    window.addEventListener("gamepaddisconnected", disconnected);
    return () => {
      window.removeEventListener("gamepadconnected", connected);
      window.removeEventListener("gamepaddisconnected", disconnected);
      audioRef.current?.destroy();
    };
  }, []);

  const sound = useCallback((effect: SoundEffect) => audioRef.current?.sfx(effect), []);

  const interactiveSound = useCallback(() => {
    void audioRef.current?.unlock().then(() => {
      audioRef.current?.startMusic();
      audioRef.current?.sfx("select");
    });
  }, []);

  const navigate = (next: Screen) => {
    interactiveSound();
    setScreen(next);
  };

  const openSubscreen = (next: "options" | "guide") => {
    setReturnScreen(screen === "game" ? "game" : "menu");
    navigate(next);
  };

  const startGame = () => {
    interactiveSound();
    setHud(INITIAL_HUD);
    setGameStartState(INITIAL_GAME_STATE);
    setChangingLevel(false);
    setOverlay(null);
    setRunId((value) => value + 1);
    setScreen("game");
  };

  const restartGame = () => {
    interactiveSound();
    setHud(INITIAL_HUD);
    setGameStartState(INITIAL_GAME_STATE);
    setChangingLevel(false);
    setOverlay(null);
    setRunId((value) => value + 1);
  };

  const returnToMenu = () => {
    interactiveSound();
    setOverlay(null);
    setRunId((value) => value + 1);
    setScreen("menu");
  };

  const handleSignal = useCallback((signal: GameSignal) => {
    if (signal.type === "ready") setChangingLevel(false);
    if (signal.type === "pause") setOverlay(signal.paused ? "pause" : null);
    if (signal.type === "gameOver") setOverlay("gameOver");
    if (signal.type === "victory") setOverlay("victory");
    if (signal.type === "nextLevel") {
      setChangingLevel(true);
      setGameStartState(signal.state);
      setHud({
        health: 100,
        lives: signal.state.lives,
        kills: signal.state.kills,
        enemies: 12,
        level: 2,
        shurikenReady: true,
      });
      setRunId((value) => value + 1);
    }
  }, []);

  const resumeGame = () => {
    interactiveSound();
    gameCommands.dispatchEvent(new CustomEvent("game-command", { detail: { action: "resume" } }));
    setOverlay(null);
  };

  const pauseGame = () => {
    gameCommands.dispatchEvent(new CustomEvent("game-command", { detail: { action: "pause" } }));
  };

  const updateSetting = <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInteractive = target?.tagName === "BUTTON" || target?.tagName === "INPUT";
      if (event.code === "Enter" && screen === "menu" && !isInteractive) {
        event.preventDefault();
        startGame();
      }
      if (event.code === "Escape" && (screen === "options" || screen === "guide")) {
        event.preventDefault();
        navigate(returnScreen);
      }
      if (event.code === "Escape" && screen === "game" && overlay === "pause") {
        event.preventDefault();
        resumeGame();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  });

  return (
    <main className={`app-shell screen-${screen}`}>
      {screen !== "game" && <Atmosphere />}

      {screen === "menu" && (
        <section className="menu-screen page-enter" aria-labelledby="game-title">
          <header className="site-header">
            <div className="studio-mark"><span /> KAGE UNIT</div>
            <button className="text-action" onClick={() => openSubscreen("guide")}>GUIA DE CAMPO</button>
          </header>

          <div className="hero-copy">
            <p className="eyebrow">A LENDA DA LUA VERMELHA</p>
            <h1 id="game-title"><span>SHINOBI</span> ECLIPSE</h1>
            <p className="hero-line">Uma fortaleza. Vinte alvos. Quatro vidas.</p>
            <div className="menu-actions">
              <button className="primary-button" onClick={startGame}>
                <span>INICIAR MISSAO</span><b>ENTER</b>
              </button>
              <button className="secondary-button" onClick={() => openSubscreen("options")}>OPCOES</button>
            </div>
          </div>

          <HeroNinja />
          <footer className="menu-footer">
            <span>02 AREAS</span>
            <i />
            <span>20 ALVOS</span>
            <i />
            <span>{settings.difficulty.toUpperCase()}</span>
          </footer>
        </section>
      )}

      {screen === "options" && (
        <OptionsScreen
          settings={settings}
          gamepadConnected={gamepadConnected}
          updateSetting={updateSetting}
          onBack={() => navigate(returnScreen)}
          onSound={interactiveSound}
        />
      )}

      {screen === "guide" && (
        <GuideScreen
          control={settings.control}
          onBack={() => navigate(returnScreen)}
          onPlay={startGame}
        />
      )}

      {screen === "game" && (
        <section className="game-screen" aria-label="Jogo Shinobi Eclipse">
          <GameViewport
            key={runId}
            settings={{ difficulty: settings.difficulty, control: settings.control }}
            startState={gameStartState}
            onHud={setHud}
            onSignal={handleSignal}
            onSound={sound}
          />
          <GameHud hud={hud} control={settings.control} onPause={pauseGame} />
          {changingLevel && <LevelTransition />}
          {overlay && (
            <GameModal
              mode={overlay}
              hud={hud}
              onResume={resumeGame}
              onRestart={restartGame}
              onMenu={returnToMenu}
            />
          )}
        </section>
      )}
    </main>
  );
}

function GameViewport({
  settings,
  startState,
  onHud,
  onSignal,
  onSound,
}: {
  settings: GameSettings;
  startState: GameStartState;
  onHud: (data: HudData) => void;
  onSignal: (signal: GameSignal) => void;
  onSound: (sound: SoundEffect) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [bootVersion, setBootVersion] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setLoadState("loading");
    let game: Phaser.Game | null = null;
    let disposed = false;
    let activeAttempt = 0;
    let bootTimer = 0;
    let probeTimer = 0;

    const revealGame = (attempt: number) => {
      if (disposed || attempt !== activeAttempt) return;
      window.clearTimeout(bootTimer);
      window.clearTimeout(probeTimer);
      setLoadState("ready");
      window.requestAnimationFrame(() => host.focus());
    };

    const boot = (renderer: number, finalAttempt: boolean) => {
      activeAttempt += 1;
      const attempt = activeAttempt;
      window.clearTimeout(bootTimer);
      window.clearTimeout(probeTimer);
      game?.destroy(true);
      game = null;
      host.replaceChildren();

      const sceneSignal = (signal: GameSignal) => {
        if (disposed || attempt !== activeAttempt) return;
        if (signal.type === "ready") revealGame(attempt);
        onSignal(signal);
      };

      try {
        game = new Phaser.Game({
          type: renderer,
          parent: host,
          width: 1280,
          height: 720,
          backgroundColor: "#07090f",
          render: { antialias: true, pixelArt: false, roundPixels: true },
          scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
          input: { gamepad: true, keyboard: true },
          physics: {
            default: "arcade",
            arcade: { gravity: { x: 0, y: 1180 }, debug: false },
          },
          scene: [new ShadowScene(settings, { onHud, onSignal: sceneSignal, onSound }, startState)],
        });
      } catch {
        if (!finalAttempt) boot(renderer === Phaser.AUTO ? Phaser.CANVAS : Phaser.AUTO, true);
        else setLoadState("error");
        return;
      }

      // Some embedded previews lose the React ready signal even after Phaser has booted.
      probeTimer = window.setTimeout(() => {
        if (attempt !== activeAttempt || disposed) return;
        const sceneActive = game?.scene.isActive("shadow-run") ?? false;
        if (sceneActive && host.querySelector("canvas")) revealGame(attempt);
      }, 700);

      bootTimer = window.setTimeout(() => {
        if (attempt !== activeAttempt || disposed) return;
        if (!finalAttempt) {
          setLoadState("loading");
          boot(renderer === Phaser.AUTO ? Phaser.CANVAS : Phaser.AUTO, true);
        } else {
          setLoadState("error");
        }
      }, finalAttempt ? 7000 : 3000);
    };

    // Let Phaser select the best renderer first, then retry with Canvas on restricted hosts.
    boot(Phaser.AUTO, false);
    return () => {
      disposed = true;
      window.clearTimeout(bootTimer);
      window.clearTimeout(probeTimer);
      game?.destroy(true);
    };
  }, [settings.difficulty, settings.control, startState.level, startState.lives, startState.kills, startState.rewardedAt, onHud, onSignal, onSound, bootVersion]);

  return (
    <>
      <div ref={hostRef} className="phaser-host" tabIndex={-1} />
      {loadState !== "ready" && (
        <div className={`game-loader ${loadState}`} role="status">
          <span className="loader-mark" />
          <b>{loadState === "loading" ? "PREPARANDO A FORTALEZA" : "FALHA AO ABRIR A MISSAO"}</b>
          <p>{loadState === "loading" ? "Carregando sprites e cenario..." : "O renderizador sera reiniciado com seguranca."}</p>
          {loadState === "error" && <button onClick={() => setBootVersion((value) => value + 1)}>TENTAR NOVAMENTE</button>}
        </div>
      )}
    </>
  );
}

function LevelTransition() {
  return (
    <div className="level-transition" role="status" aria-live="polite">
      <p>PORTOES INTERNOS ABERTOS</p>
      <h2>AREA 02</h2>
      <span />
      <b>FORTALEZA DA LUA VERMELHA</b>
    </div>
  );
}

function GameHud({ hud, control, onPause }: { hud: HudData; control: ControlMode; onPause: () => void }) {
  return (
    <div className="game-ui" aria-live="polite">
      <div className="hud-top">
        <div className="health-readout">
          <div><span>VITALIDADE</span><strong>{hud.health}%</strong></div>
          <div className="health-track"><i style={{ width: `${hud.health}%` }} /></div>
        </div>
        <div className="mission-readout">
          <span>AREA {String(hud.level).padStart(2, "0")}</span>
          <strong>{hud.enemies} ALVOS RESTANTES</strong>
        </div>
        <div className="status-readout">
          <div><span>VIDAS</span><strong>{String(hud.lives).padStart(2, "0")}</strong></div>
          <div><span>ABATES</span><strong>{String(hud.kills).padStart(2, "0")} / 20</strong></div>
          <button className="pause-button" onClick={onPause} aria-label="Pausar jogo">II</button>
        </div>
      </div>
      <div className="hud-bottom">
        {control === "keyboard" ? (
          <><span><kbd>A D</kbd> MOVER</span><span><kbd>ESPACO</kbd> SALTAR</span><span><kbd>J</kbd> ESPADA</span><span className={hud.shurikenReady ? "ready" : "cooldown"}><kbd>K</kbd> SHURIKEN</span></>
        ) : (
          <><span><kbd>LS</kbd> MOVER</span><span><kbd>A</kbd> SALTAR</span><span><kbd>X</kbd> ESPADA</span><span className={hud.shurikenReady ? "ready" : "cooldown"}><kbd>B</kbd> SHURIKEN</span></>
        )}
      </div>
      <GameControls control={control} shurikenReady={hud.shurikenReady} />
    </div>
  );
}

type VirtualAction = "left" | "right" | "jump" | "sword" | "shuriken";

function dispatchGameAction(action: VirtualAction, pressed = true) {
  gameCommands.dispatchEvent(new CustomEvent("game-command", { detail: { action, pressed } }));
}

function GameControls({ control, shurikenReady }: { control: ControlMode; shurikenReady: boolean }) {
  const holdProps = (action: "left" | "right") => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dispatchGameAction(action, true);
    },
    onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      dispatchGameAction(action, false);
    },
    onPointerCancel: () => dispatchGameAction(action, false),
  });
  const tap = (action: Exclude<VirtualAction, "left" | "right">) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dispatchGameAction(action);
  };

  return (
    <div className="game-controls" aria-label="Controles do jogo">
      <div className="movement-controls">
        <button {...holdProps("left")} aria-label="Mover para a esquerda"><b>A</b><span>&lt;</span></button>
        <button onPointerDown={tap("jump")} aria-label="Saltar"><b>ESPACO</b><span>^</span></button>
        <button {...holdProps("right")} aria-label="Mover para a direita"><b>D</b><span>&gt;</span></button>
      </div>
      <div className="combat-controls">
        <button onPointerDown={tap("sword")} aria-label="Atacar com espada">
          <b>{control === "gamepad" ? "J / X" : "J"}</b><span>ESPADA</span>
        </button>
        <button className={shurikenReady ? "" : "recharging"} onPointerDown={tap("shuriken")} aria-label="Lancar shuriken" aria-disabled={!shurikenReady}>
          <b>{control === "gamepad" ? "K / B" : "K"}</b><span>SHURIKEN</span>
        </button>
      </div>
    </div>
  );
}

function GameModal({
  mode,
  hud,
  onResume,
  onRestart,
  onMenu,
}: {
  mode: Exclude<GameOverlay, null>;
  hud: HudData;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const content = {
    pause: { eyebrow: "MISSAO SUSPENSA", title: "PAUSA", detail: "A noite espera pelo seu proximo movimento." },
    gameOver: { eyebrow: "TODAS AS VIDAS PERDIDAS", title: "FIM DA MISSAO", detail: `${hud.kills} dos 20 alvos foram eliminados.` },
    victory: { eyebrow: "FORTALEZA LIBERTADA", title: "MISSAO CUMPRIDA", detail: `20 alvos eliminados com ${hud.lives} ${hud.lives === 1 ? "vida" : "vidas"} restante${hud.lives === 1 ? "" : "s"}.` },
  }[mode];
  return (
    <div className="modal-backdrop page-enter" role="dialog" aria-modal="true" aria-label={content.title}>
      <div className="result-modal">
        <p>{content.eyebrow}</p>
        <h2>{content.title}</h2>
        <span className="blade-rule" />
        <div className="result-stats"><span>ABATES <b>{hud.kills}</b></span><span>AREA <b>{hud.level}</b></span><span>VIDAS <b>{hud.lives}</b></span></div>
        <p className="modal-detail">{content.detail}</p>
        <div className="modal-actions">
          {mode === "pause" && <button className="primary-button" onClick={onResume}><span>CONTINUAR</span><b>ESC</b></button>}
          {mode !== "pause" && <button className="primary-button" onClick={onRestart}><span>TENTAR NOVAMENTE</span></button>}
          <button className="secondary-button" onClick={onMenu}>VOLTAR AO MENU</button>
        </div>
      </div>
    </div>
  );
}

function OptionsScreen({
  settings,
  gamepadConnected,
  updateSetting,
  onBack,
  onSound,
}: {
  settings: AppSettings;
  gamepadConnected: boolean;
  updateSetting: <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => void;
  onBack: () => void;
  onSound: () => void;
}) {
  const difficultyOptions: Array<{ value: Difficulty; label: string; detail: string }> = [
    { value: "easy", label: "FACIL", detail: "Inimigos menos resistentes" },
    { value: "normal", label: "NORMAL", detail: "A experiencia equilibrada" },
    { value: "hard", label: "DIFICIL", detail: "Dano e agressividade maiores" },
  ];
  return (
    <section className="subscreen page-enter" aria-labelledby="options-title">
      <SubscreenHeader title="OPCOES" onBack={onBack} />
      <div className="settings-layout">
        <div className="settings-intro">
          <p className="eyebrow">PREPARE SUA MISSAO</p>
          <h1 id="options-title">AJUSTE O<br />DESAFIO</h1>
          <p>As mudancas sao salvas automaticamente neste dispositivo.</p>
        </div>
        <div className="settings-form">
          <fieldset>
            <legend>DIFICULDADE</legend>
            <div className="difficulty-options">
              {difficultyOptions.map((option) => (
                <button
                  key={option.value}
                  className={settings.difficulty === option.value ? "selected" : ""}
                  onClick={() => { updateSetting("difficulty", option.value); onSound(); }}
                >
                  <b>{option.label}</b><span>{option.detail}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>CONTROLE</legend>
            <div className="control-options">
              <button className={settings.control === "keyboard" ? "selected" : ""} onClick={() => { updateSetting("control", "keyboard"); onSound(); }}>
                <ControlIcon type="keyboard" /><span><b>TECLADO</b><small>WASD + J / K</small></span>
              </button>
              <button className={settings.control === "gamepad" ? "selected" : ""} onClick={() => { updateSetting("control", "gamepad"); onSound(); }}>
                <ControlIcon type="gamepad" /><span><b>CONTROLE</b><small>{gamepadConnected ? "CONECTADO" : "AGUARDANDO CONEXAO"}</small></span>
              </button>
            </div>
          </fieldset>

          <fieldset>
            <legend>AUDIO</legend>
            <AudioRow
              label="TRILHA SONORA"
              enabled={settings.musicEnabled}
              volume={settings.musicVolume}
              onToggle={(value) => updateSetting("musicEnabled", value)}
              onVolume={(value) => updateSetting("musicVolume", value)}
            />
            <AudioRow
              label="EFEITOS SONOROS"
              enabled={settings.sfxEnabled}
              volume={settings.sfxVolume}
              onToggle={(value) => updateSetting("sfxEnabled", value)}
              onVolume={(value) => updateSetting("sfxVolume", value)}
            />
          </fieldset>
        </div>
      </div>
    </section>
  );
}

function AudioRow({
  label,
  enabled,
  volume,
  onToggle,
  onVolume,
}: {
  label: string;
  enabled: boolean;
  volume: number;
  onToggle: (value: boolean) => void;
  onVolume: (value: number) => void;
}) {
  return (
    <div className="audio-row">
      <button className={`toggle ${enabled ? "on" : ""}`} onClick={() => onToggle(!enabled)} aria-pressed={enabled}><i /></button>
      <span>{label}</span>
      <input aria-label={`Volume de ${label}`} type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => onVolume(Number(event.target.value))} disabled={!enabled} />
      <b>{Math.round(volume * 100)}</b>
    </div>
  );
}

function GuideScreen({ control, onBack, onPlay }: { control: ControlMode; onBack: () => void; onPlay: () => void }) {
  return (
    <section className="subscreen guide-screen page-enter" aria-labelledby="guide-title">
      <SubscreenHeader title="GUIA DE CAMPO" onBack={onBack} />
      <div className="guide-layout">
        <div className="guide-intro">
          <p className="eyebrow">PROTOCOLO DA SOMBRA</p>
          <h1 id="guide-title">ELIMINE<br />TODOS.</h1>
          <p>Limpe as duas areas da fortaleza. A cada 20 abates, uma vida extra e concedida.</p>
          <button className="primary-button" onClick={onPlay}><span>INICIAR MISSAO</span></button>
        </div>
        <div className="field-manual">
          <div className="manual-section">
            <span>01</span><div><h2>MOVIMENTO E COMBATE</h2><p>{control === "keyboard" ? "A/D ou setas para mover, Espaco para saltar, J para espada e K para shuriken." : "Analogico para mover, A para saltar, X para espada e B para shuriken."}</p></div>
          </div>
          <div className="manual-section">
            <span>02</span><div><h2>VIDAS</h2><p>Voce inicia com 100% de vitalidade e 4 vidas. Ao esvaziar a barra, uma vida e consumida.</p></div>
          </div>
          <div className="manual-section enemy-section">
            <span>03</span><div><h2>HIERARQUIA INIMIGA</h2><div className="enemy-legend"><i className="red" />KUNAI <i className="blue" />CORRENTE <i className="purple" />NAGINATA <i className="ochre" />KANABO <i className="black" />ODACHI</div><p>Cinco castas com corpos, alcance, velocidade e resistencia diferentes. Observe a arma antes de atacar.</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SubscreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="site-header subscreen-header">
      <div className="studio-mark"><span /> KAGE UNIT</div>
      <b>{title}</b>
      <button className="text-action" onClick={onBack}>VOLTAR <kbd>ESC</kbd></button>
    </header>
  );
}

function ControlIcon({ type }: { type: ControlMode }) {
  return type === "keyboard" ? (
    <svg viewBox="0 0 48 34" aria-hidden="true"><rect x="2" y="5" width="44" height="25" rx="2" /><path d="M8 11h4m3 0h4m3 0h4m3 0h4m3 0h4M8 17h5m3 0h5m3 0h5m3 0h8M9 24h6m3 0h20" /></svg>
  ) : (
    <svg viewBox="0 0 48 34" aria-hidden="true"><path d="M14 9h20c5 0 8 4 9 9l2 8c1 4-4 6-7 3l-6-6H16l-6 6c-3 3-8 1-7-3l2-8c1-5 4-9 9-9Z" /><path d="M13 14v7m-3-3.5h7M34 15h.1m4 4h.1" /></svg>
  );
}

function HeroNinja() {
  const [spriteReady, setSpriteReady] = useState(false);
  const handleReady = useCallback(() => setSpriteReady(true), []);
  return (
    <div className={`hero-ninja ${spriteReady ? "sprite-ready" : ""}`} aria-hidden="true">
      <div className="ninja-halo" />
      <AnimatedNinjaSprite onReady={handleReady} />
      <svg className="ninja-fallback" viewBox="0 0 620 720">
        <path className="scarf back" d="M386 255c79 5 154 35 206 92-91-31-158-29-222 1Z" />
        <path className="body" d="M237 270c-67 71-86 188-74 332l95 76 198-30c28-166 4-307-79-385Z" />
        <path className="hood" d="M225 91c81-72 205-23 224 91l-36 154-204-11-34-133Z" />
        <path className="mask" d="m196 185 239-6-22 95-194 5Z" />
        <path className="face" d="M237 191h164l-31 50-107 1Z" />
        <path className="eye" d="m254 207 54 3-39 18Z" /><path className="eye" d="m380 207-53 3 38 18Z" />
        <path className="headband" d="m183 163 265-8 3 35-268 6Z" />
        <path className="scarf" d="m196 287 222-5 33 58-264 19Z" />
        <path className="arm" d="M188 333 54 509l78 54 137-151Z" />
        <path className="arm right" d="m414 334 118 164-74 57-126-144Z" />
        <path className="blade" d="m95 527 364-310 18 21-328 358Z" />
        <path className="blade-glow" d="m97 525 358-304 4 6-349 317Z" />
        <path className="handle" d="m130 538 75 78-24 24-75-78Z" />
      </svg>
    </div>
  );
}

function AnimatedNinjaSprite({ onReady }: { onReady: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = new Image();
    let animationFrame = 0;
    let stopped = false;

    image.onload = () => {
      if (stopped) return;
      const sheet = document.createElement("canvas");
      sheet.width = image.naturalWidth;
      sheet.height = image.naturalHeight;
      const sheetContext = sheet.getContext("2d", { willReadFrequently: true });
      if (!sheetContext) return;
      sheetContext.drawImage(image, 0, 0);
      const imageData = sheetContext.getImageData(0, 0, sheet.width, sheet.height);
      removeCheckerBackground(imageData, sheet.width, sheet.height);
      sheetContext.putImageData(imageData, 0, 0);

      const frameWidth = Math.floor(sheet.width / 4);
      const frameHeight = Math.floor(sheet.height / 4);
      canvas.width = frameWidth;
      canvas.height = frameHeight;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.imageSmoothingEnabled = true;

      // Long idle beats followed by an occasional sword flourish.
      const sequence = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 8, 9, 10, 11];
      let sequenceIndex = 0;
      let lastFrameAt = 0;
      const draw = (time: number) => {
        if (stopped) return;
        const interval = sequenceIndex < 12 ? 210 : 120;
        if (time - lastFrameAt >= interval) {
          const frame = sequence[sequenceIndex];
          context.clearRect(0, 0, frameWidth, frameHeight);
          context.drawImage(
            sheet,
            (frame % 4) * frameWidth,
            Math.floor(frame / 4) * frameHeight,
            frameWidth,
            frameHeight,
            0,
            0,
            frameWidth,
            frameHeight,
          );
          sequenceIndex = (sequenceIndex + 1) % sequence.length;
          lastFrameAt = time;
        }
        animationFrame = window.requestAnimationFrame(draw);
      };
      onReady();
      animationFrame = window.requestAnimationFrame(draw);
    };
    image.src = new URL("./assets/player/shinobi-movement.png", document.baseURI).href;

    return () => {
      stopped = true;
      window.cancelAnimationFrame(animationFrame);
      image.onload = null;
    };
  }, [onReady]);

  return <canvas ref={canvasRef} className="ninja-sprite-canvas" />;
}

function removeCheckerBackground(image: ImageData, width: number, height: number) {
  const pixels = image.data;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const isBackground = (pixel: number) => {
    const offset = pixel * 4;
    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    return Math.min(red, green, blue) > 175 && Math.max(red, green, blue) - Math.min(red, green, blue) < 26;
  };
  const enqueue = (pixel: number) => {
    if (pixel < 0 || pixel >= visited.length || visited[pixel] || !isBackground(pixel)) return;
    visited[pixel] = 1;
    queue[tail] = pixel;
    tail += 1;
  };
  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }
  while (head < tail) {
    const pixel = queue[head];
    head += 1;
    pixels[pixel * 4 + 3] = 0;
    const x = pixel % width;
    if (x > 0) enqueue(pixel - 1);
    if (x < width - 1) enqueue(pixel + 1);
    enqueue(pixel - width);
    enqueue(pixel + width);
  }
}

function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <div className="stars" /><div className="moon" /><div className="moon-haze" />
      <div className="mountain far" /><div className="mountain near" />
      <div className="pagoda"><i /><i /><i /><b /><span /></div>
      <div className="ground-mist mist-one" /><div className="ground-mist mist-two" />
      <div className="bamboo bamboo-one" /><div className="bamboo bamboo-two" />
      <div className="red-sun-line" />
    </div>
  );
}

function loadSettings(): AppSettings {
  try {
    const value = window.localStorage.getItem("shinobi-eclipse-settings");
    return value ? { ...DEFAULT_SETTINGS, ...JSON.parse(value) as Partial<AppSettings> } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}