import { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { TitleScreen } from './components/TitleScreen';
import { MainMenu } from './components/MainMenu';
import { ControlsScreen } from './components/ControlsScreen';
import { RankingScreen } from './components/RankingScreen';
import { GameScreen } from './components/GameScreen';

/**
 * Shell da aplicação — React é o DONO da UI (telas, HUD, overlays);
 * o Phaser só existe dentro de GameScreen, cuidando do gameplay.
 */
export default function App() {
  const screen = useGameStore((s) => s.screen);

  // Navegação por Esc nas telas de menu (não durante a partida —
  // lá o Esc pertence ao pause, tratado no GameScreen)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const { screen: current, setScreen } = useGameStore.getState();
      if (current === 'controls' || current === 'ranking') setScreen('menu');
      else if (current === 'menu') setScreen('title');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app">
      {screen === 'title' && <TitleScreen />}
      {screen === 'menu' && <MainMenu />}
      {screen === 'controls' && <ControlsScreen />}
      {screen === 'ranking' && <RankingScreen />}
      {screen === 'game' && <GameScreen />}
    </div>
  );
}
