import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  clearTouchActions,
  DEFAULT_KEY_BINDINGS,
  displayKeyboardBinding,
  normalizeKeyboardBinding,
  setTouchAction,
  type GameAction,
  type KeyBindings,
} from './game/input';
import { CARS, DEFAULT_CAR_ID, DEFAULT_STAGE_ID, STAGES, getCar, getStage, getSuggestedStageId, isCarUnlocked, isStageUnlocked, nextStageId, sanitizeCarId, sanitizeStageIds, type CarDefinition, type CarId, type StageId } from './game/content';
import type { RaceResult } from './game/types';
import {
  DEFAULT_UPGRADES,
  getUpgradeCost,
  sanitizeUpgradeLevels,
  UPGRADE_DEFINITIONS,
  type UpgradeId,
  type UpgradeLevels,
} from './game/upgrades';

type Screen = 'home' | 'campaign' | 'garage' | 'options' | 'credits' | 'race' | 'result';
type SettingsTab = 'audio' | 'display' | 'controls' | 'accessibility' | 'language';
type PhaserGameHandle = ReturnType<typeof import('./game/createRaceGame').createRaceGame>;

interface GameOptions {
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  highContrast: boolean;
  reduceMotion: boolean;
  screenShake: boolean;
  subtitles: boolean;
  steeringAssist: boolean;
  language: 'pt-BR' | 'en';
  bindings: KeyBindings;
}

type UpgradesByCar = Record<CarId, UpgradeLevels>;

interface GarageProgress {
  scrap: number;
  upgradesByCar: UpgradesByCar;
  selectedCarId: CarId;
  completedStageIds: StageId[];
  bestScore: number;
  totalMonsterKills: number;
  completedMissions: number;
}

function createDefaultUpgradesByCar(): UpgradesByCar {
  return Object.fromEntries(CARS.map((car) => [car.id, { ...DEFAULT_UPGRADES }])) as UpgradesByCar;
}

const OPTIONS_KEY = 'apocalypse-race.options.v1';
const PROGRESS_KEY = 'apocalypse-race.progress.v1';
const STARTING_SCRAP = 180;
const DEFAULT_PROGRESS: GarageProgress = {
  scrap: STARTING_SCRAP,
  upgradesByCar: createDefaultUpgradesByCar(),
  selectedCarId: DEFAULT_CAR_ID,
  completedStageIds: [],
  bestScore: 0,
  totalMonsterKills: 0,
  completedMissions: 0,
};
const DEFAULT_OPTIONS: GameOptions = {
  masterVolume: 78,
  musicVolume: 62,
  effectsVolume: 84,
  highContrast: false,
  reduceMotion: false,
  screenShake: false,
  subtitles: true,
  steeringAssist: false,
  language: 'pt-BR',
  bindings: { ...DEFAULT_KEY_BINDINGS },
};

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: string; note: string }[] = [
  { id: 'audio', label: 'Áudio', icon: '♫', note: 'Mixagem' },
  { id: 'display', label: 'Tela', icon: '▣', note: 'Exibição' },
  { id: 'controls', label: 'Controles', icon: '⌨', note: 'Teclas' },
  { id: 'accessibility', label: 'Acessibilidade', icon: '◉', note: 'Conforto' },
  { id: 'language', label: 'Idioma', icon: '文', note: 'Idioma' },
];

const ACTION_ROWS: { action: GameAction; label: string; description: string }[] = [
  { action: 'accelerate', label: 'Acelerar', description: 'Ganha velocidade e vence aclives.' },
  { action: 'brake', label: 'Frear', description: 'Reduz a velocidade e ajuda na aterrissagem.' },
  { action: 'tiltLeft', label: 'Inclinar para trás', description: 'Levanta a dianteira durante o salto.' },
  { action: 'tiltRight', label: 'Inclinar para frente', description: 'Baixa a dianteira durante o salto.' },
  { action: 'nitro', label: 'Usar nitro', description: 'Impulso curto; recarrega gradualmente.' },
  { action: 'horn', label: 'Buzina de rota', description: 'Desvia zumbis próximos para fora da pista.' },
  { action: 'fire', label: 'Disparar', description: 'Segure para atirar nos zumbis; munição é limitada e pode ser reposta.' },
];

function safePercent(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : fallback;
}

function loadOptions(): GameOptions {
  if (typeof window === 'undefined') return DEFAULT_OPTIONS;
  try {
    const raw = window.localStorage.getItem(OPTIONS_KEY);
    if (!raw) return DEFAULT_OPTIONS;
    const saved = JSON.parse(raw) as Partial<GameOptions> & { bindings?: Partial<KeyBindings> };
    return {
      ...DEFAULT_OPTIONS,
      ...saved,
      masterVolume: safePercent(saved.masterVolume, DEFAULT_OPTIONS.masterVolume),
      musicVolume: safePercent(saved.musicVolume, DEFAULT_OPTIONS.musicVolume),
      effectsVolume: safePercent(saved.effectsVolume, DEFAULT_OPTIONS.effectsVolume),
      bindings: { ...DEFAULT_KEY_BINDINGS, ...saved.bindings },
    };
  } catch {
    return DEFAULT_OPTIONS;
  }
}

function safeCount(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : fallback;
}

function loadGarageProgress(): GarageProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const saved = JSON.parse(raw) as Partial<GarageProgress> & { upgrades?: unknown; upgradesByCar?: unknown };
    const completedMissions = safeCount(saved.completedMissions);
    const savedCompletedStages = sanitizeStageIds(saved.completedStageIds);
    const completedStageIds = savedCompletedStages.length > 0
      ? savedCompletedStages
      : completedMissions > 0 ? [DEFAULT_STAGE_ID] : [];
    const savedUpgradeMap = saved.upgradesByCar && typeof saved.upgradesByCar === 'object'
      ? saved.upgradesByCar as Record<string, unknown>
      : {};
    const upgradesByCar = Object.fromEntries(CARS.map((car) => [
      car.id,
      sanitizeUpgradeLevels(savedUpgradeMap[car.id] ?? (car.id === DEFAULT_CAR_ID ? saved.upgrades : undefined)),
    ])) as UpgradesByCar;
    const selectedCarId = sanitizeCarId(saved.selectedCarId);

    return {
      scrap: safeCount(saved.scrap, DEFAULT_PROGRESS.scrap),
      upgradesByCar,
      selectedCarId: isCarUnlocked(selectedCarId, completedMissions) ? selectedCarId : DEFAULT_CAR_ID,
      completedStageIds,
      bestScore: safeCount(saved.bestScore),
      totalMonsterKills: safeCount(saved.totalMonsterKills),
      completedMissions: Math.max(completedMissions, completedStageIds.length),
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  badge,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  badge?: string;
}) {
  return (
    <div className="setting-row">
      <div className="setting-copy">
        <div className="setting-title-line">
          <h3>{label}</h3>
          {badge && <span className="setting-badge">{badge}</span>}
        </div>
        <p>{description}</p>
      </div>
      <button
        className={`switch ${checked ? 'is-on' : ''}`}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
      >
        <span className="switch-thumb" />
        <span className="switch-state">{checked ? 'SIM' : 'NÃO'}</span>
      </button>
    </div>
  );
}

function RangeSetting({
  id,
  label,
  description,
  value,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="range-setting">
      <div className="range-heading">
        <div>
          <label htmlFor={id}>{label}</label>
          <p>{description}</p>
        </div>
        <output htmlFor={id}>{value}%</output>
      </div>
      <input
        id={id}
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </div>
  );
}

function WastelandArtwork() {
  return (
    <svg className="wasteland-art" viewBox="0 0 880 590" role="img" aria-label="Estrada atravessando uma cidade deserta ao pôr do sol">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#202d2a" />
          <stop offset="0.52" stopColor="#75614a" />
          <stop offset="1" stopColor="#db8249" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#424847" />
          <stop offset="1" stopColor="#1b2222" />
        </linearGradient>
        <radialGradient id="glow">
          <stop offset="0" stopColor="#eab66b" stopOpacity=".5" />
          <stop offset="1" stopColor="#eab66b" stopOpacity="0" />
        </radialGradient>
        <pattern id="scanlines" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M0 4.5H5" stroke="#f4e5c3" strokeOpacity=".045" />
        </pattern>
      </defs>
      <rect width="880" height="590" fill="url(#sky)" />
      <circle cx="622" cy="183" r="180" fill="url(#glow)" />
      <circle cx="622" cy="183" r="54" fill="#d9a25d" opacity=".9" />
      <path d="M0 337 104 247l67 49 110-112 104 123 95-73 107 111 92-143 88 72 113-49v175H0Z" fill="#526457" opacity=".6" />
      <path d="M0 370 77 309l82 46 106-90 77 72 111-55 93 90 89-114 95 71 100-43 50 33v154H0Z" fill="#39463e" />
      <path d="M0 372h880v218H0Z" fill="#28312d" />
      <g fill="#202725">
        <path d="M70 365v-98h38v98zm42 0v-142h45v142zm50 0v-82h39v82zm50 0v-124h57v124zm75 0v-96h33v96zm57 0v-161h53v161zm60 0v-91h41v91zm48 0v-131h49v131zm58 0v-94h37v94zm45 0v-162h61v162zm68 0v-104h43v104zm50 0v-135h58v135z" />
        <path d="M104 287h8v8h-8zm18-43h8v9h-8zm15 18h8v8h-8zm62 27h8v8h-8zm87 21h8v8h-8zm75-73h8v9h-8zm12 22h8v8h-8zm106 39h8v8h-8zm70-31h8v8h-8zm28-76h8v8h-8zm75 60h8v9h-8z" fill="#c28b4d" opacity=".8" />
      </g>
      <path d="M340 365 287 590h398l-65-225Z" fill="url(#road)" />
      <path d="m447 385-8 67h20l-4-67zm-15 112-11 89h32l-7-89Z" fill="#c8b68b" opacity=".72" />
      <path d="M0 382h355l-50 208H0zm575 0h305v208H629Z" fill="#202825" />
      <path d="M0 431c109-52 186-54 295-43l-11 26c-92-9-176 4-284 59zm880 25c-112-52-188-58-294-52l10 25c100-1 185 17 284 62z" fill="#52604f" opacity=".85" />
      <g transform="translate(390 392)">
        <path d="M0 29 17 8c5-6 12-9 20-9h87c8 0 15 4 19 10l13 20 18 7v25H-15V39Z" fill="#d87138" stroke="#211f1a" strokeWidth="6" />
        <path d="m44 4 15-1 0 22H28zm25-1h48c9 0 16 6 19 13l4 9H69Z" fill="#86a79a" stroke="#211f1a" strokeWidth="5" />
        <path d="M-13 39h185v13H-13Z" fill="#a64f30" />
        <circle cx="27" cy="57" r="17" fill="#111716" stroke="#788078" strokeWidth="6" />
        <circle cx="126" cy="57" r="17" fill="#111716" stroke="#788078" strokeWidth="6" />
        <circle cx="27" cy="57" r="5" fill="#c7c4ae" /><circle cx="126" cy="57" r="5" fill="#c7c4ae" />
        <path d="M154 30h15v10h-15z" fill="#f4cc77" />
      </g>
      <g fill="#c8c1aa" opacity=".55">
        <circle cx="332" cy="443" r="2"/><circle cx="555" cy="475" r="2"/><circle cx="368" cy="514" r="3"/><circle cx="602" cy="427" r="2"/>
      </g>
      <rect width="880" height="590" fill="url(#scanlines)" />
      <path d="M0 0h880v590H0z" fill="none" stroke="#e8dbbd" strokeOpacity=".16" />
    </svg>
  );
}

function TouchControls({
  onPointerDown,
  onPointerUp,
}: {
  onPointerDown: (action: GameAction) => (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (action: GameAction) => () => void;
}) {
  const control = (action: GameAction, label: string, glyph: string, className = '') => (
    <button
      className={`touch-button ${className}`}
      type="button"
      aria-label={label}
      onPointerDown={onPointerDown(action)}
      onPointerUp={onPointerUp(action)}
      onPointerCancel={onPointerUp(action)}
      onLostPointerCapture={onPointerUp(action)}
    >
      {glyph}
    </button>
  );

  return (
    <div className="touch-controls" aria-label="Controles de toque">
      <div className="touch-group">
        {control('tiltLeft', 'Inclinar para trás', '↶')}
        {control('tiltRight', 'Inclinar para frente', '↷')}
      </div>
      <div className="touch-group touch-group-drive">
        {control('brake', 'Frear', '◀')}
        {control('accelerate', 'Acelerar', '▲', 'touch-accelerate')}
      </div>
      <div className="touch-group touch-group-utility">
        {control('horn', 'Buzina de rota', '♫')}
        {control('nitro', 'Usar nitro', 'N₂O', 'touch-nitro')}
        {control('fire', 'Disparar arma', '●', 'touch-fire')}
      </div>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [optionsTab, setOptionsTab] = useState<SettingsTab>('audio');
  const [options, setOptions] = useState<GameOptions>(loadOptions);
  const [progress, setProgress] = useState<GarageProgress>(loadGarageProgress);
  const [selectedStageId, setSelectedStageId] = useState<StageId>(DEFAULT_STAGE_ID);
  const [gameLoading, setGameLoading] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [raceEpoch, setRaceEpoch] = useState(0);
  const [result, setResult] = useState<RaceResult | null>(null);
  const [captureAction, setCaptureAction] = useState<GameAction | null>(null);
  const [bindingMessage, setBindingMessage] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const gameMountRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<PhaserGameHandle | null>(null);
  const selectedStage = getStage(selectedStageId);
  const selectedCar = getCar(progress.selectedCarId);
  const selectedCarUpgrades = progress.upgradesByCar[progress.selectedCarId] ?? DEFAULT_UPGRADES;
  const suggestedStageId = getSuggestedStageId(progress.completedStageIds);
  const suggestedStage = getStage(suggestedStageId);
  const allPlayableStagesComplete = STAGES.every((stage) => progress.completedStageIds.includes(stage.id));

  const updateOption = useCallback(<K extends keyof GameOptions,>(key: K, value: GameOptions[K]) => {
    setOptions((current) => ({ ...current, [key]: value }));
  }, []);

  const purchaseUpgrade = useCallback((id: UpgradeId) => {
    setProgress((current) => {
      const carId = current.selectedCarId;
      const carUpgrades = current.upgradesByCar[carId] ?? DEFAULT_UPGRADES;
      const level = carUpgrades[id];
      const cost = getUpgradeCost(id, level);
      if (cost === null || current.scrap < cost) return current;
      return {
        ...current,
        scrap: current.scrap - cost,
        upgradesByCar: {
          ...current.upgradesByCar,
          [carId]: { ...carUpgrades, [id]: level + 1 },
        },
      };
    });
  }, []);

  const handleRaceComplete = useCallback((raceResult: RaceResult) => {
    setResult(raceResult);
    setIsPaused(false);
    setProgress((current) => {
      const completedStageIds = raceResult.outcome === 'success'
        ? [...new Set([...current.completedStageIds, raceResult.stageId])]
        : current.completedStageIds;
      return {
        ...current,
        scrap: current.scrap + raceResult.scrap,
        bestScore: Math.max(current.bestScore, raceResult.score),
        totalMonsterKills: current.totalMonsterKills + raceResult.monsterKills,
        completedStageIds,
        completedMissions: current.completedMissions + (raceResult.outcome === 'success' ? 1 : 0),
      };
    });
    if (raceResult.outcome === 'success') {
      const next = nextStageId(raceResult.stageId);
      if (next) setSelectedStageId(next);
    }
    setScreen('result');
  }, []);

  const goHome = useCallback(() => {
    clearTouchActions();
    setIsPaused(false);
    setScreen('home');
  }, []);

  const openOptions = useCallback(() => {
    setOptionsTab('audio');
    setCaptureAction(null);
    setScreen('options');
  }, []);

  const openCampaign = useCallback(() => {
    setSelectedStageId(getSuggestedStageId(progress.completedStageIds));
    setScreen('campaign');
  }, [progress.completedStageIds]);

  const openGarage = useCallback(() => {
    setSelectedStageId(getSuggestedStageId(progress.completedStageIds));
    setScreen('garage');
  }, [progress.completedStageIds]);

  const startRace = useCallback((requestedStageId?: StageId) => {
    const stageId = requestedStageId ?? selectedStageId;
    if (!isStageUnlocked(stageId, progress.completedStageIds)) return;
    clearTouchActions();
    setSelectedStageId(stageId);
    setResult(null);
    setIsPaused(false);
    setGameError(null);
    setScreen('race');
  }, [selectedStageId, progress.completedStageIds]);

  const resumeRace = useCallback(() => {
    gameRef.current?.scene.resume('RaceScene');
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    if (!gameRef.current) return;
    if (isPaused) {
      gameRef.current.scene.resume('RaceScene');
      setIsPaused(false);
    } else {
      gameRef.current.scene.pause('RaceScene');
      setIsPaused(true);
    }
  }, [isPaused]);

  const restartRace = useCallback(() => {
    clearTouchActions();
    setIsPaused(false);
    setGameError(null);
    setRaceEpoch((value) => value + 1);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
    } catch {
      // O jogo continua funcionando mesmo se o navegador bloquear o armazenamento local.
    }
    document.documentElement.dataset.contrast = options.highContrast ? 'high' : 'standard';
    document.documentElement.dataset.motion = options.reduceMotion ? 'reduced' : 'full';
  }, [options]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      // A corrida e as melhorias continuam disponíveis nesta sessão sem armazenamento local.
    }
  }, [progress]);

  useEffect(() => {
    const syncFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  useEffect(() => {
    if (screen !== 'race' || !gameMountRef.current) return undefined;

    let disposed = false;
    let destroyGame: () => void = () => {};
    const handleBlur = () => clearTouchActions();
    setGameLoading(true);
    setGameError(null);
    window.addEventListener('blur', handleBlur);

    void import('./game/createRaceGame')
      .then(({ createRaceGame }) => {
        if (disposed || !gameMountRef.current) return;
        const game = createRaceGame(
          gameMountRef.current,
          { onComplete: handleRaceComplete },
          options.bindings,
          selectedCarUpgrades,
          selectedStageId,
          progress.selectedCarId,
        );
        gameRef.current = game;
        destroyGame = () => {
          game.destroy(true);
          if (gameRef.current === game) gameRef.current = null;
        };
        setGameLoading(false);
      })
      .catch((error: unknown) => {
        console.error('Não foi possível inicializar o jogo Phaser.', error);
        if (disposed) return;
        setGameError('Não foi possível carregar o motor de corrida. Volte ao menu e tente novamente.');
        setGameLoading(false);
      });

    return () => {
      disposed = true;
      window.removeEventListener('blur', handleBlur);
      clearTouchActions();
      destroyGame();
    };
  }, [screen, raceEpoch, options.bindings, selectedCarUpgrades, selectedStageId, progress.selectedCarId, handleRaceComplete]);

  const handlePointerDown = (action: GameAction) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setTouchAction(action, true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const releasePointer = (action: GameAction) => () => setTouchAction(action, false);

  useEffect(() => {
    if (screen !== 'race') return undefined;
    const handlePauseKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      togglePause();
    };
    window.addEventListener('keydown', handlePauseKey);
    return () => window.removeEventListener('keydown', handlePauseKey);
  }, [screen, togglePause]);

  useEffect(() => {
    if (!captureAction) return undefined;
    const handleBinding = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') {
        setCaptureAction(null);
        setBindingMessage('Alteração cancelada.');
        return;
      }
      if (event.repeat || ['Alt', 'Control', 'Meta', 'CapsLock', 'Tab'].includes(event.key)) return;

      const key = normalizeKeyboardBinding(event.key);
      if (!/^[A-Z0-9]$/.test(key) && !['Shift', 'Space'].includes(key)) {
        setBindingMessage('Use uma letra, número, Shift ou Espaço. As setas continuam disponíveis como alternativa.');
        return;
      }
      const conflict = Object.entries(options.bindings).find(([action, assigned]) => action !== captureAction && assigned === key);
      if (conflict) {
        const conflictingLabel = ACTION_ROWS.find((row) => row.action === conflict[0])?.label ?? 'outra ação';
        setBindingMessage(`Essa tecla já está atribuída a “${conflictingLabel}”.`);
        return;
      }

      setOptions((current) => ({
        ...current,
        bindings: { ...current.bindings, [captureAction]: key },
      }));
      setBindingMessage(`${ACTION_ROWS.find((row) => row.action === captureAction)?.label} atualizado.`);
      setCaptureAction(null);
    };
    window.addEventListener('keydown', handleBinding, true);
    return () => window.removeEventListener('keydown', handleBinding, true);
  }, [captureAction, options.bindings]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setBindingMessage('Tela cheia não está disponível neste navegador/preview.');
    }
  };

  const restoreOptions = () => {
    setOptions({ ...DEFAULT_OPTIONS, bindings: { ...DEFAULT_KEY_BINDINGS } });
    setCaptureAction(null);
    setBindingMessage('Configurações padrão restauradas.');
    setShowResetModal(false);
  };

  const openOptionsTab = (tab: SettingsTab) => {
    setOptionsTab(tab);
    setBindingMessage(null);
  };

  const garageStats = [
    { label: 'ACELERAÇÃO', value: Math.min(100, Math.round(selectedCar.acceleration / 450 * 70 + selectedCarUpgrades.engine * 10)) },
    { label: 'ESTABILIDADE', value: Math.min(100, Math.round(selectedCar.landingTolerance * 50 + selectedCar.armor * 35 + selectedCarUpgrades.suspension * 7 + selectedCarUpgrades.bumper * 2)) },
    { label: 'RESERVA', value: Math.min(100, Math.round(selectedCar.fuelCapacity / 1.9 + selectedCarUpgrades.tank * 10)) },
    { label: 'TRAÇÃO', value: Math.min(100, Math.round(78 - selectedCar.rollingLoss * 100 + selectedCarUpgrades.tires * 8)) },
    { label: 'RESISTÊNCIA', value: Math.min(100, Math.round((1 - (1 - selectedCar.armor) * (1 - selectedCarUpgrades.bumper * 0.16)) * 100)) },
    { label: 'ARMAMENTO', value: Math.min(100, 25 + selectedCarUpgrades.weapon * 25) },
  ];
  const resultStage = getStage(result?.stageId ?? DEFAULT_STAGE_ID);
  const resultCar = getCar(result?.carId ?? DEFAULT_CAR_ID);
  const resultMedalCount = result?.outcome === 'success'
    ? Math.max(1, result.score >= 13000 ? 3 : result.score >= 7000 ? 2 : 0)
    : 0;

  return (
    <div className={`app-shell ${screen === 'race' ? 'app-shell-race' : ''}`}>
      <header className="topbar">
        <button className="brand brand-button" type="button" onClick={goHome} aria-label="Ir para o menu inicial">
          <span className="brand-mark" aria-hidden="true"><b>A</b><i>R</i></span>
          <span className="brand-copy"><strong>APOCALYPSE <em>RACE</em></strong><small>FLEEING HELL</small></span>
        </button>
        <div className="topbar-signal"><span className="signal-led" /> <span>SINAL DO REFÚGIO <b>ESTÁVEL</b></span></div>
        <div className="topbar-actions">
          <span className="build-pill"><i /> BUILD 0.6</span>
          <button className="icon-button" type="button" onClick={openOptions} aria-label="Abrir opções" title="Opções">⚙</button>
        </div>
      </header>

      {screen === 'home' && (
        <main className="home-screen screen-enter">
          <section className="home-copy">
            <p className="eyebrow"><span /> ÚLTIMA ROTA SEGURA · VALE AURORA</p>
            <h1 className="game-logo-title">APOCALYPSE<br /><span>RACE</span></h1>
            <p className="game-subtitle">FLEEING HELL</p>
            <p className="home-intro">A estrada acabou. A corrida, não.<br />Escolha uma rota e atravesse os corredores de evacuação com seu veículo e suas melhorias.</p>

            <div className="mission-card">
              <div className="mission-topline"><span>{allPlayableStagesComplete ? 'JORNADA INICIAL CONCLUÍDA' : 'PRÓXIMA ROTA'}</span><span className="mission-coord">{suggestedStage.regionCode} <i>◆</i></span></div>
              <div className="mission-main">
                <div><small>{suggestedStage.region.toUpperCase()} · FASE {suggestedStage.code}</small><strong>{suggestedStage.name.toUpperCase()}</strong><span>{suggestedStage.objective}</span></div>
                <div className="mission-progress"><b>{progress.completedStageIds.length.toString().padStart(2, '0')}<span> / {STAGES.length.toString().padStart(2, '0')}</span></b><div><i style={{ width: `${Math.min(100, progress.completedStageIds.length / STAGES.length * 100)}%` }} /></div><small>JORNADA</small></div>
              </div>
              <div className="mission-signal"><span className="signal-led" /> VEÍCULO {selectedCar.name.toUpperCase()} <b>·</b> OFICINA DISPONÍVEL</div>
            </div>

            <div className="home-actions">
              <button className="btn btn-primary btn-start" type="button" onClick={() => startRace(suggestedStageId)}><span className="btn-play">▶</span><span><b>{allPlayableStagesComplete ? 'REPETIR ÚLTIMA ROTA' : 'CONTINUAR JORNADA'}</b><small>{allPlayableStagesComplete ? `REVISITAR ${suggestedStage.shortName}` : `IR PARA ${suggestedStage.shortName}`}</small></span><span className="btn-arrow">↗</span></button>
              <button className="btn btn-secondary" type="button" onClick={openCampaign}><span className="menu-icon">▤</span> MAPA DA CAMPANHA <span className="menu-chevron">›</span></button>
              <button className="btn btn-secondary" type="button" onClick={openGarage}><span className="menu-icon">⚒</span> GARAGEM <span className="menu-chevron">›</span></button>
              <div className="home-submenu">
                <button className="btn btn-link" type="button" onClick={openOptions}><span>⚙</span> OPÇÕES</button>
                <button className="btn btn-link" type="button" onClick={() => setScreen('credits')}><span>ⓘ</span> CRÉDITOS</button>
              </div>
            </div>
          </section>

          <section className="home-visual" aria-label="Arte conceitual da rota pós-apocalíptica">
            <WastelandArtwork />
            <div className="visual-vignette" />
            <div className="visual-tag visual-tag-top"><span className="tag-line" /> CARTOGRAFIA 01 <b>·</b> 06:42 AM</div>
            <div className="visual-coordinate"><span>LOCALIZAÇÃO ATUAL</span><strong>ANEL VELHO <i>—</i> SETOR LESTE</strong><small>LAT 23° 08' S &nbsp; LONG 47° 03' W</small></div>
            <div className="visual-alert"><span className="alert-mark">!</span><span><b>NEBLINA EM MOVIMENTO</b><small>JANELA DE SAÍDA: 04:18</small></span><i className="alert-pulse" /></div>
            <div className="art-side-label">REGISTRO DE ROTA <b>NO. 007</b></div>
            <div className="visual-index"><span>01</span><i /> <span>03</span></div>
          </section>

          <section className="home-bottomline">
            <div className="survivor-note"><span className="radio-icon">⌁</span><p><b>TRANSMISSÃO RECEBIDA</b><br />“A oficina ainda tem luz. Traga o carro para o posto.” <em>— PIPO</em></p></div>
            <div className="bottom-status"><span>OFFLINE · 1 JOGADOR</span><i /> <span>META EDITORIAL 10+*</span></div>
          </section>
        </main>
      )}

      {screen === 'campaign' && (
        <main className="subscreen screen-enter">
          <SubscreenHeader eyebrow="MAPA DE EVACUAÇÃO" title="Jornada" accent="01" onBack={goHome} />
          <div className="campaign-summary">
            <span className="summary-mark">{progress.completedStageIds.length.toString().padStart(2, '0')}<span>/{STAGES.length.toString().padStart(2, '0')}</span></span>
            <div><b>{selectedStage.region.toUpperCase()}</b><small>{selectedStage.name} · {selectedStage.objective}</small></div>
            <div className="summary-progress"><span>FASES CONCLUÍDAS</span><div><i style={{ width: `${Math.min(100, progress.completedStageIds.length / STAGES.length * 100)}%` }} /></div></div>
            <span className="status-tag"><i /> {isStageUnlocked(selectedStage.id, progress.completedStageIds) ? 'ROTA ABERTA' : 'ROTA FECHADA'}</span>
          </div>
          <div className="campaign-layout">
            <section className="route-map-panel">
              <div className="panel-kicker">CARTA DE NAVEGAÇÃO <span>ROTA / {selectedStage.code}</span></div>
              <div className="route-map-graphic" aria-hidden="true">
                <div className="map-grid" />
                <div className="map-route-line" />
                {STAGES.map((stage, index) => {
                  const completed = progress.completedStageIds.includes(stage.id);
                  const unlocked = isStageUnlocked(stage.id, progress.completedStageIds);
                  const positionClass = index === 0 ? 'map-node-current' : `map-node-${index + 1}`;
                  return <span className={`map-node ${positionClass} ${selectedStageId === stage.id ? 'map-node-selected' : ''} ${!unlocked ? 'map-node-locked' : ''}`} key={stage.id}><i>{completed ? '✓' : stage.code}</i></span>;
                })}
                <span className="map-hazard">12 ZUMBIS // SEM GORE</span>
                <span className="map-coordinate">{selectedStage.region.toUpperCase()}<br />{selectedStage.regionCode}</span>
              </div>
              <div className="map-legend"><span><i className="legend-current" /> ROTA LIBERADA</span><span><i className="legend-locked" /> ROTA BLOQUEADA</span><span><i className="legend-route" /> ESTRADA</span></div>
            </section>
            <section className="stage-panel">
              <div className="panel-kicker">PONTOS DE PASSAGEM <span>{STAGES.length.toString().padStart(2, '0')} FASES</span></div>
              {STAGES.map((stage, index) => {
                const completed = progress.completedStageIds.includes(stage.id);
                const unlocked = isStageUnlocked(stage.id, progress.completedStageIds);
                const selected = selectedStageId === stage.id;
                const previousStage = STAGES[index - 1];
                const description = completed ? 'Concluída · disponível para repetir' : unlocked ? stage.objective : `Conclua ${previousStage?.name ?? 'a fase anterior'}`;
                const contents = <><span className="stage-number">{stage.code}</span><span className="stage-info"><b>{stage.name.toUpperCase()}</b><small>{description}</small></span><span className={`stage-state ${completed ? 'is-complete' : ''}`}>{completed ? '✓' : unlocked ? 'ABERTA' : '⌑'}</span><span className="stage-arrow">{selected ? '●' : unlocked ? '›' : ''}</span></>;
                return unlocked
                  ? <button className={`stage-card ${selected ? 'stage-card-active' : ''} ${completed ? 'stage-card-complete' : ''}`} type="button" aria-pressed={selected} key={stage.id} onClick={() => setSelectedStageId(stage.id)}>{contents}</button>
                  : <div className="stage-card stage-card-locked" key={stage.id} aria-disabled="true">{contents}</div>;
              })}
              <div className="prototype-hint"><span>i</span> {selectedStage.objective} · {selectedStage.monsterCount} zumbis, {selectedStage.rampCount} rampas, {selectedStage.ammoPickupCount} caixas de munição, {selectedStage.repairPickupCount} kits e {selectedStage.shieldPickupCount} escudos.</div>
              <button className="btn btn-primary btn-full" type="button" onClick={() => startRace(selectedStage.id)}>INICIAR {selectedStage.shortName} <span>↗</span></button>
            </section>
          </div>
          <div className="region-strip">{Array.from(new Set(STAGES.map((stage) => stage.region))).map((region) => {
            const regionStage = STAGES.find((stage) => stage.region === region)!;
            const available = isStageUnlocked(regionStage.id, progress.completedStageIds);
            return <span className={available ? 'region-active' : ''} key={region}>{available && <i />} {regionStage.regionCode.split('/')[0].trim()} · {region.toUpperCase()} <b>{available ? '✓' : '⌑'}</b></span>;
          })}</div>
        </main>
      )}

      {screen === 'garage' && (
        <main className="subscreen screen-enter">
          <SubscreenHeader eyebrow="OFICINA DE CAMPO" title="Garagem" accent="01" onBack={goHome} />
          <div className="garage-layout">
            <section className="garage-vehicle-panel">
              <div className="panel-kicker">FROTA DISPONÍVEL <span>{CARS.length.toString().padStart(2, '0')} VEÍCULOS</span></div>
              <div className="vehicle-roster" aria-label="Selecionar veículo">
                {CARS.map((car) => {
                  const unlocked = isCarUnlocked(car.id, progress.completedMissions);
                  const selected = progress.selectedCarId === car.id;
                  const className = `vehicle-choice ${selected ? 'is-selected' : ''} ${unlocked ? '' : 'is-locked'}`;
                  const contents = <><span className="vehicle-choice-code">{car.code}</span><span className="vehicle-choice-copy"><b>{car.name}</b><small>{unlocked ? car.role : `LIBERA APÓS ${car.unlockAfterCompletedMissions} MISSÃO${car.unlockAfterCompletedMissions === 1 ? '' : 'ÕES'}`}</small></span>{unlocked ? <span className="vehicle-choice-mark">{selected ? '●' : '›'}</span> : <span className="vehicle-choice-mark">⌑</span>}</>;
                  return unlocked
                    ? <button className={className} type="button" aria-pressed={selected} key={car.id} onClick={() => setProgress((current) => isCarUnlocked(car.id, current.completedMissions) ? { ...current, selectedCarId: car.id } : current)}>{contents}</button>
                    : <div className={className} key={car.id} aria-disabled="true">{contents}</div>;
                })}
              </div>
              <div className="garage-art-wrap">
                <VehicleIllustration car={selectedCar} />
                <span className="garage-art-stamp">{selectedCar.code}<br /><b>{selectedCar.name.toUpperCase()}</b></span>
                <span className="garage-condition"><i /> PRONTO PARA A ROTA</span>
              </div>
              <div className="vehicle-name-row"><div><small>{selectedCar.category}</small><h2>{selectedCar.name}</h2></div><span className="vehicle-type">{CARS.findIndex((car) => car.id === selectedCar.id) + 1} / {CARS.length}</span></div>
              <div className="vehicle-stats">
                {garageStats.map((stat) => <StatBar key={stat.label} label={stat.label} value={stat.value} />)}
              </div>
              <p className="garage-description">{selectedCar.description}</p>
            </section>
            <section className="garage-upgrade-panel">
              <div className="panel-kicker">CONFIGURAÇÃO · {selectedCar.name.toUpperCase()} <span>OFICINA V0.6</span></div>
              <p className="garage-description">Instale melhorias para este veículo; os níveis são individuais e alteram os atributos efetivos durante a corrida.</p>
              <div className="upgrade-list">
                {UPGRADE_DEFINITIONS.map((upgrade) => {
                  const level = selectedCarUpgrades[upgrade.id];
                  const cost = getUpgradeCost(upgrade.id, level);
                  const canInstall = cost !== null && progress.scrap >= cost;
                  return (
                    <div className="upgrade-row" key={upgrade.id}>
                      <span className="upgrade-num">{upgrade.code}</span>
                      <span className="upgrade-copy"><b>{upgrade.name}</b><small>{upgrade.detail}</small></span>
                      <span className="upgrade-level">NÍV. {level}<i> / 3</i></span>
                      <button className="upgrade-buy" type="button" onClick={() => purchaseUpgrade(upgrade.id)} disabled={!canInstall} aria-label={cost === null ? `${upgrade.name} no nível máximo` : `Instalar ${upgrade.name} em ${selectedCar.name} por ${cost} sucatas`}>
                        {cost === null ? 'MÁX.' : canInstall ? `${cost} ⬡` : `FALTAM ${cost - progress.scrap}`}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="garage-scrap"><span>SUCATA DISPONÍVEL</span><b>{progress.scrap} <small>unidades</small></b></div>
              <button className="btn btn-primary btn-full" type="button" onClick={() => startRace(selectedStageId)}>INICIAR {selectedStage.shortName}<span>↗</span></button>
            </section>
          </div>
          <p className="prototype-hint garage-hint"><span>i</span> Quatro carros, seis categorias de melhoria e quatro rotas jogáveis. Dispare com J; cada zumbi eliminado vale 500 pontos. Munição, reparos e escudos aparecem na pista.</p>
        </main>
      )}

      {screen === 'options' && (
        <main className="subscreen options-screen screen-enter">
          <SubscreenHeader eyebrow="PAINEL DO REFÚGIO" title="Opções" accent="" onBack={goHome} />
          <div className="options-layout">
            <nav className="options-tabs" aria-label="Categorias de opções" role="tablist" aria-orientation="vertical">
              {SETTINGS_TABS.map((tab) => (
                <button className={`options-tab ${optionsTab === tab.id ? 'is-active' : ''}`} type="button" role="tab" aria-selected={optionsTab === tab.id} key={tab.id} onClick={() => openOptionsTab(tab.id)}>
                  <span className="options-tab-icon" aria-hidden="true">{tab.icon}</span><span><b>{tab.label}</b><small>{tab.note}</small></span><i>›</i>
                </button>
              ))}
              <div className="settings-save-state"><span className="signal-led" /> SALVAMENTO LOCAL ATIVO</div>
            </nav>

            <section className="options-panel" role="tabpanel">
              <div className="options-panel-header"><div><p className="panel-kicker">CONFIGURAÇÃO DO JOGO <span>REFÚGIO / TERMINAL 01</span></p><h2>{SETTINGS_TABS.find((tab) => tab.id === optionsTab)?.label}</h2></div><span className="saved-indicator"><i /> SALVO AUTOMATICAMENTE</span></div>

              {optionsTab === 'audio' && (
                <div className="settings-content">
                  <div className="settings-section-title"><span>01</span><div><b>MIXAGEM DE ÁUDIO</b><small>Volume independente para cada camada de som.</small></div></div>
                  <RangeSetting id="master-volume" label="Volume geral" description="Nível principal de saída." value={options.masterVolume} onChange={(value) => updateOption('masterVolume', value)} />
                  <RangeSetting id="music-volume" label="Música" description="Trilha da estrada e sequências de fuga." value={options.musicVolume} onChange={(value) => updateOption('musicVolume', value)} />
                  <RangeSetting id="effects-volume" label="Efeitos" description="Motor, interface, ambiente e sinal de rota." value={options.effectsVolume} onChange={(value) => updateOption('effectsVolume', value)} />
                  <div className="inline-note"><span>i</span> Os níveis ficam salvos. Mixagem de áudio será conectada quando a trilha e os efeitos forem integrados.</div>
                </div>
              )}

              {optionsTab === 'display' && (
                <div className="settings-content">
                  <div className="settings-section-title"><span>02</span><div><b>EXIBIÇÃO</b><small>Preferências visuais para a sua tela.</small></div></div>
                  <div className="display-preview"><div className="display-mini"><span /><i /><b /></div><div><strong>Proporção adaptável</strong><p>A interface acompanha a janela mantendo a leitura da pista em 16:9.</p></div><span className="status-tag"><i /> AUTOMÁTICO</span></div>
                  <div className="setting-row"><div className="setting-copy"><h3>Tela cheia</h3><p>Expande a interface para ocupar a tela. Alguns previews do navegador podem bloquear este recurso.</p></div><button className="btn btn-secondary btn-small" type="button" onClick={toggleFullscreen}>{fullscreen ? 'SAIR DA TELA CHEIA' : 'ATIVAR TELA CHEIA'} <span>⛶</span></button></div>
                  <div className="setting-row"><div className="setting-copy"><h3>Alto contraste</h3><p>Reforça contornos, separação de painéis e contraste dos textos.</p></div><Switch checked={options.highContrast} onChange={() => updateOption('highContrast', !options.highContrast)} label="Alto contraste" /></div>
                  <div className="inline-note"><span>i</span> O jogo usa escala responsiva; resolução manual ainda não é necessária.</div>
                </div>
              )}

              {optionsTab === 'controls' && (
                <div className="settings-content">
                  <div className="settings-section-title"><span>03</span><div><b>MAPEAMENTO DE TECLAS</b><small>Selecione uma ação e pressione uma nova tecla.</small></div></div>
                  <div className="binding-list">
                    {ACTION_ROWS.map((row, index) => (
                      <div className="binding-row" key={row.action}>
                        <span className="binding-index">0{index + 1}</span>
                        <span className="binding-copy"><b>{row.label}</b><small>{row.description}</small></span>
                        <button className={`keycap ${captureAction === row.action ? 'is-listening' : ''}`} type="button" onClick={() => { setCaptureAction(row.action); setBindingMessage('Pressione a tecla desejada. Esc cancela.'); }} aria-label={`Redefinir tecla de ${row.label}`}>
                          {captureAction === row.action ? <><i className="listening-dot" /> PRESSIONE</> : displayKeyboardBinding(options.bindings[row.action])}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="binding-footer"><span className="inline-note"><span>i</span> As setas direcionais ficam ativas como alternativa.</span><button className="text-action" type="button" onClick={() => updateOption('bindings', { ...DEFAULT_KEY_BINDINGS })}>RESTAURAR TECLAS PADRÃO</button></div>
                  {bindingMessage && <p className="settings-message" role="status">{bindingMessage}</p>}
                </div>
              )}

              {optionsTab === 'accessibility' && (
                <div className="settings-content">
                  <div className="settings-section-title"><span>04</span><div><b>CONFORTO E ACESSIBILIDADE</b><small>Ajuste os sinais visuais e o ritmo da apresentação.</small></div></div>
                  <ToggleRow label="Reduzir movimento" description="Diminui transições, tremores e movimento decorativo." checked={options.reduceMotion} onChange={() => updateOption('reduceMotion', !options.reduceMotion)} />
                  <ToggleRow label="Tremor de tela" description="O padrão é desativado; pode ser ligado para dar mais impacto às colisões com obstáculos." checked={options.screenShake} onChange={() => updateOption('screenShake', !options.screenShake)} badge="OPCIONAL" />
                  <ToggleRow label="Legendas de rádio" description="Exibe em texto as mensagens faladas durante a campanha." checked={options.subtitles} onChange={() => updateOption('subtitles', !options.subtitles)} />
                  <ToggleRow label="Assistência de direção" description="Ajuda a manter o carro estável em rampas e pousos." checked={options.steeringAssist} onChange={() => updateOption('steeringAssist', !options.steeringAssist)} />
                  <div className="locked-setting"><span className="locked-icon">✓</span><div><b>Flashes estroboscópicos</b><small>Desativados permanentemente neste projeto.</small></div><span className="status-tag">SEGURO</span></div>
                </div>
              )}

              {optionsTab === 'language' && (
                <div className="settings-content">
                  <div className="settings-section-title"><span>05</span><div><b>IDIOMA E REGIÃO</b><small>Idioma das interfaces e da comunicação de rota.</small></div></div>
                  <label className="select-label" htmlFor="language-select">Idioma do jogo</label>
                  <select id="language-select" className="select-control" value={options.language} onChange={(event) => updateOption('language', event.currentTarget.value as GameOptions['language'])}>
                    <option value="pt-BR">Português (Brasil) — disponível</option>
                    <option value="en" disabled>English — em breve</option>
                  </select>
                  <div className="language-card"><span className="language-emblem">BR</span><div><b>PORTUGUÊS DO BRASIL</b><small>Textos do protótipo e documentação do projeto.</small></div><i>✓</i></div>
                  <div className="inline-note"><span>i</span> Mais idiomas serão adicionados após a validação da versão em português.</div>
                </div>
              )}

              <div className="options-panel-footer">
                <span>{bindingMessage && optionsTab !== 'controls' ? <b className="settings-message">{bindingMessage}</b> : 'PREFERÊNCIAS SALVAS NESTE DISPOSITIVO'}</span>
                <button className="text-action" type="button" onClick={() => setShowResetModal(true)}>RESTAURAR TODAS AS OPÇÕES</button>
              </div>
            </section>
          </div>
        </main>
      )}

      {screen === 'credits' && (
        <main className="subscreen credits-screen screen-enter">
          <SubscreenHeader eyebrow="REGISTRO DA JORNADA" title="Créditos" accent="" onBack={goHome} />
          <section className="credits-card">
            <span className="credits-sigil">AR<span>✦</span></span>
            <p className="eyebrow"><span /> PROJETO INDEPENDENTE · PROTÓTIPO 0.4</p>
            <h2>APOCALYPSE <em>RACE</em></h2>
            <p className="credits-subtitle">FLEEING HELL</p>
            <div className="credits-rule" />
            <div className="credits-columns">
              <div><small>DESIGN & DESENVOLVIMENTO</small><b>Equipe Apocalypse Race</b></div>
              <div><small>TECNOLOGIA</small><b>React · Phaser · TypeScript</b></div>
              <div><small>INSPIRAÇÃO</small><b>Estradas, sucata e recomeços</b></div>
            </div>
            <p className="credits-disclaimer">Todos os personagens, veículos, cenários e elementos deste protótipo são criações originais ou placeholders de desenvolvimento.</p>
            <button className="btn btn-secondary" type="button" onClick={goHome}>VOLTAR AO MENU <span>↗</span></button>
          </section>
        </main>
      )}

      {screen === 'race' && (
        <main className="race-screen screen-enter">
          <div className="race-heading"><div><p className="eyebrow"><span /> ROTA {selectedStage.code} / {selectedStage.region.toUpperCase()} · {selectedCar.name.toUpperCase()}</p><h1>{selectedStage.shortName} <i>—</i> <em>{selectedStage.objective.toUpperCase()}</em></h1></div><button className="btn btn-secondary pause-button" type="button" onClick={togglePause} disabled={gameLoading || Boolean(gameError)}><span>Ⅱ</span> PAUSAR <kbd>ESC</kbd></button></div>
          <section className="game-frame" aria-label="Área de jogo">
            <div className="phaser-mount" ref={gameMountRef} />
            {(gameLoading || gameError) && <div className="game-status" role={gameError ? 'alert' : 'status'}>{gameError ?? 'Preparando a estrada…'}</div>}
            {gameError && <button className="error-return" type="button" onClick={goHome}>VOLTAR AO MENU</button>}
            <TouchControls onPointerDown={handlePointerDown} onPointerUp={releasePointer} />
            {isPaused && (
              <div className="pause-overlay">
                <section className="pause-card" role="dialog" aria-modal="true" aria-labelledby="pause-title">
                  <p className="eyebrow"><span /> PAINEL DE CONTROLE</p>
                  <h2 id="pause-title">CORRIDA <em>PAUSADA</em></h2>
                  <p>A estrada pode esperar. Seu progresso desta tentativa está seguro.</p>
                  <button className="btn btn-primary btn-full" type="button" onClick={resumeRace}>RETOMAR CORRIDA <span>▶</span></button>
                  <button className="btn btn-secondary btn-full" type="button" onClick={restartRace}>REINICIAR FASE <span>↻</span></button>
                  <button className="btn btn-link btn-full" type="button" onClick={goHome}>ABANDONAR E VOLTAR AO MENU</button>
                  <small className="pause-footnote">ESC PARA RETOMAR</small>
                </section>
              </div>
            )}
          </section>
          <div className="race-footline"><span><i /> {selectedStage.region.toUpperCase()} · {selectedStage.name.toUpperCase()} · {selectedCar.name.toUpperCase()}</span><span><kbd>W</kbd> ACELERAR&nbsp; <kbd>S</kbd> FREAR&nbsp; <kbd>A</kbd><kbd>D</kbd> INCLINAR&nbsp; <kbd>{displayKeyboardBinding(options.bindings.fire)}</kbd> DISPARAR</span><span>SEM PRESSA. DIRIJA COM ATENÇÃO.</span></div>
        </main>
      )}

      {screen === 'result' && (
        <main className="result-screen screen-enter">
          <div className="result-stamp"><span>RELATÓRIO DE ROTA</span><b>{resultStage.code}</b><small>{result?.outcome === 'success' ? 'ROTA CONCLUÍDA' : 'TENTATIVA REGISTRADA'}</small></div>
          <p className="eyebrow"><span /> {result?.outcome === 'success' ? 'MISSÃO CONCLUÍDA' : 'VEÍCULO PARADO EM SEGURANÇA'}</p>
          <h1>{result?.outcome === 'success' ? 'BOA' : 'VAMOS'} <em>{result?.outcome === 'success' ? 'CORRIDA.' : 'MELHORAR.'}</em></h1>
          <p className="result-description">{result?.outcome === 'success' ? `${resultCar.name} concluiu ${resultStage.name}. ${nextStageId(resultStage.id) ? `Nova rota liberada: ${getStage(nextStageId(resultStage.id)!).name}.` : 'Você concluiu as quatro rotas jogáveis deste protótipo.'} A sucata recuperada pode reforçar o veículo na oficina.` : `${result?.failureReason ?? 'A rota foi interrompida. Leve a sucata até a oficina e prepare o carro para tentar de novo.'} Distância percorrida: ${result?.distancePercent ?? 0}%.`}</p>
          <div className="result-medal" aria-label={`${resultMedalCount} de 3 medalhas`}>
            {[0, 1, 2].map((medal) => <span className={medal < resultMedalCount ? 'is-earned' : ''} key={medal} aria-hidden="true">★</span>)}
          </div>
          <section className="result-stats">
            <div><small>PONTUAÇÃO</small><b>{(result?.score ?? 0).toLocaleString('pt-BR')}</b></div>
            <div><small>MONSTROS DERROTADOS</small><b>{result?.monsterKills ?? 0}</b></div>
            <div><small>SALTOS</small><b>{result?.jumps ?? 0}</b></div>
            <div><small>CAMBALHOTAS</small><b>{result?.tricks ?? 0}</b></div>
            <div><small>SUCATA GANHA</small><b>{result?.scrap ?? 0}<i> un.</i></b></div>
            <div><small>COMBUSTÍVEL RESTANTE</small><b>{result?.fuelPercent ?? 0}<i>%</i></b></div>
            <div><small>CONDIÇÃO DO CARRO</small><b>{result?.conditionPercent ?? 0}<i>%</i></b></div>
            <div><small>TEMPO DE ROTA</small><b>{result ? formatTime(result.elapsedSeconds) : '--:--'}</b></div>
          </section>
          <div className="result-actions">
            <button className="btn btn-primary" type="button" onClick={openGarage}>ABRIR OFICINA <span>⚒</span></button>
            <button className="btn btn-secondary" type="button" onClick={() => startRace(result?.stageId)}>{result?.outcome === 'success' ? 'CORRER DE NOVO' : 'TENTAR DE NOVO'} <span>↻</span></button>
            <button className="btn btn-secondary" type="button" onClick={openCampaign}>MAPA DA CAMPANHA <span>›</span></button>
          </div>
          <button className="text-action result-home" type="button" onClick={goHome}>VOLTAR AO MENU PRINCIPAL</button>
        </main>
      )}

      <footer className="site-footer"><span>APOCALYPSE RACE: FLEEING HELL <i>·</i> PROTÓTIPO EM DESENVOLVIMENTO</span><span>REACT <i>+</i> PHASER 3 <i>·</i> BUILD 0.6</span></footer>

      {showResetModal && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowResetModal(false); }}>
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <span className="modal-symbol">↺</span>
            <p className="eyebrow"><span /> TERMINAL DE CONFIGURAÇÃO</p>
            <h2 id="reset-title">RESTAURAR <em>PADRÕES?</em></h2>
            <p>Suas preferências de áudio, tela, acessibilidade e teclas voltarão aos valores iniciais.</p>
            <div className="modal-actions"><button className="btn btn-secondary" type="button" onClick={() => setShowResetModal(false)}>CANCELAR</button><button className="btn btn-primary" type="button" onClick={restoreOptions}>RESTAURAR</button></div>
          </section>
        </div>
      )}
    </div>
  );
}

function SubscreenHeader({
  eyebrow,
  title,
  accent,
  onBack,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  onBack: () => void;
}) {
  return (
    <header className="subscreen-header">
      <button className="back-link" type="button" onClick={onBack}>← <span>MENU PRINCIPAL</span></button>
      <div><p className="eyebrow"><span /> {eyebrow}</p><h1>{title} {accent && <em>{accent}</em>}</h1></div>
      <span className="subscreen-id">TERMINAL / AR-01</span>
    </header>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button className={`switch ${checked ? 'is-on' : ''}`} type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange}>
      <span className="switch-thumb" /><span className="switch-state">{checked ? 'SIM' : 'NÃO'}</span>
    </button>
  );
}

function StatBar({ label, value }: { label: string; value: number }) {
  return <div className="stat-bar"><span>{label}</span><div><i style={{ width: `${value}%` }} /></div><b>{value}</b></div>;
}

function VehicleIllustration({ car }: { car: CarDefinition }) {
  const paint = `#${car.paint.toString(16).padStart(6, '0')}`;
  const glass = `#${car.glass.toString(16).padStart(6, '0')}`;
  const trim = `#${car.trim.toString(16).padStart(6, '0')}`;
  const weaponY = car.bodyStyle === 'van' ? 61 : car.bodyStyle === 'rescue' ? 68 : car.bodyStyle === 'buggy' ? 100 : 83;
  const bodyPath = car.bodyStyle === 'pickup'
    ? 'm153 182 29-53c11-20 28-31 52-31h139c20 0 38 10 50 27l39 56 46 15 12 31H119v-27z'
    : car.bodyStyle === 'van'
      ? 'm129 180 16-80c3-14 14-22 29-22h212c22 0 39 13 48 34l27 64 56 17v28H119v-23z'
      : car.bodyStyle === 'buggy'
        ? 'm142 186 30-26h73l27-47h94l36 47h77l31 20 16 20H124v-10z'
        : 'm122 173 17-48c5-14 16-21 32-21h89V78h125v26h48c21 0 38 13 47 34l19 36 42 17v24H119v-24z';

  return (
    <svg viewBox="0 0 700 300" role="img" aria-label={`Ilustração do veículo ${car.name} com arma veicular estilizada`}>
      <defs><linearGradient id="truckBody" x1="0" y1="0" x2="0" y2="1"><stop stopColor={paint}/><stop offset="1" stopColor={paint}/></linearGradient></defs>
      <path d="M50 228h594" stroke="#91a083" strokeWidth="2" strokeDasharray="8 12" opacity=".5" />
      <ellipse cx="356" cy="236" rx="219" ry="20" fill="#090e0e" opacity=".55" />
      <path d={bodyPath} fill="url(#truckBody)" stroke={trim} strokeWidth="10" strokeLinejoin="round" />
      <g aria-hidden="true">
        <rect x="333" y={weaponY} width="34" height="11" rx="4" fill="#38423c" stroke={trim} strokeWidth="4" />
        <path d={`M359 ${weaponY + 5.5}h49`} stroke="#48534b" strokeWidth="7" strokeLinecap="round" />
        <circle cx="351" cy={weaponY + 5.5} r="6" fill={paint} stroke={trim} strokeWidth="3" />
      </g>
      {car.bodyStyle === 'pickup' && <>
        <path d="m233 107 24-1v53h-78l22-37c8-10 18-15 32-15zm43-1h94c20 0 36 11 45 28l12 25H276z" fill={glass} stroke={trim} strokeWidth="8" strokeLinejoin="round" />
        <path d="M405 108v50m-78-52v54" stroke={trim} strokeWidth="5" />
        <path d="M194 177h39v33h-39zm47 0h34v33h-34z" fill={trim} opacity=".65" />
      </>}
      {car.bodyStyle === 'van' && <>
        <path d="m166 86 8-1h119v70H154zm139 0h78c17 0 30 9 38 24l21 46H305z" fill={glass} stroke={trim} strokeWidth="8" strokeLinejoin="round" />
        <path d="M292 87v73m-111 4v36m130-111v74" stroke={trim} strokeWidth="5" />
        <path d="M340 181h78" stroke={trim} strokeWidth="5" opacity=".55" />
      </>}
      {car.bodyStyle === 'buggy' && <>
        <path d="m255 157 25-51h84l38 51h-31l-24-34h-44l-18 34z" fill={trim} />
        <path d="m289 145 15-29h47l20 29" fill={glass} stroke={trim} strokeWidth="5" />
        <path d="m259 158 30 46m113-46-35 46" stroke={trim} strokeWidth="8" />
      </>}
      {car.bodyStyle === 'rescue' && <>
        <path d="M145 119h101v53H131zm127-31h102v75H272zm111 4h45c17 0 30 10 38 25l14 27h-97z" fill={glass} stroke={trim} strokeWidth="7" strokeLinejoin="round" />
        <path d="M254 83v91m15-1h108m-104-83v79" stroke={trim} strokeWidth="5" />
        <path d="M151 185h72m177-8h38" stroke={trim} strokeWidth="5" opacity=".6" />
      </>}
      <path d="M145 207h380" stroke={trim} strokeWidth="6" opacity=".8" />
      <path d="M120 207h54v19h-54zm402-15 28 9v17h-30z" fill="#e8c67a" />
      <circle cx="223" cy="222" r="42" fill="#121817" stroke="#9a9784" strokeWidth="10" />
      <circle cx="223" cy="222" r="16" fill="#b5b6a7" />
      <circle cx="451" cy="222" r="42" fill="#121817" stroke="#9a9784" strokeWidth="10" />
      <circle cx="451" cy="222" r="16" fill="#b5b6a7" />
      <path d="M581 146v-69h9v69m-25-48h42l-21-27z" fill={car.bodyStyle === 'rescue' ? paint : '#b4c761'} />
      <path d="M108 240h524" stroke={paint} strokeWidth="2" opacity=".5" />
    </svg>
  );
}

export default App;
