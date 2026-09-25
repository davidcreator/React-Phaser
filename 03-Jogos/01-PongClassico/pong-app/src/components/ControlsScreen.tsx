import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { P1Scheme, P2Scheme } from '../types';
import { sfx } from '../game/sfx';

const P1_OPTIONS: { id: P1Scheme; label: string; keys: string }[] = [
  { id: 'wasd', label: 'W / S', keys: 'W S' },
  { id: 'arrows', label: 'Setas ↑ ↓', keys: '↑ ↓' },
  { id: 'both', label: 'W/S + Setas', keys: 'W S + ↑ ↓' },
];

const P2_OPTIONS: { id: P2Scheme; label: string; keys: string }[] = [
  { id: 'ik', label: 'I / K', keys: 'I K' },
  { id: 'arrows', label: 'Setas ↑ ↓', keys: '↑ ↓' },
];

/**
 * Configuração de controles: esquemas de teclado, gamepad on/off,
 * detecção ao vivo de controles USB/Bluetooth e teste de teclas.
 */
export function ControlsScreen() {
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const setScreen = useGameStore((s) => s.setScreen);

  const [pads, setPads] = useState<string[]>([]);
  const [lastKey, setLastKey] = useState<string | null>(null);

  // Detecção periódica de gamepads
  useEffect(() => {
    const poll = () => {
      const list = navigator.getGamepads?.() ?? [];
      setPads(Array.from(list).filter((p): p is Gamepad => !!p).map((p) => p.id));
    };
    poll();
    const id = window.setInterval(poll, 600);
    return () => window.clearInterval(id);
  }, []);

  // Tecla pressionada por último (feedback de teste)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      setLastKey(e.key === ' ' ? 'Espaço' : e.key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section className="screen controls-screen">
      <header className="menu-header">
        <h1>⌨️ Configurar Controles</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => { sfx.click(); setScreen('menu'); }}>
          ← Menu
        </button>
      </header>

      <div className="controls-grid">
        <div className="panel">
          <h3>Jogador 1</h3>
          <div className="seg seg-vertical" role="radiogroup" aria-label="Teclas do jogador 1">
            {P1_OPTIONS.map((o) => (
              <button
                key={o.id}
                role="radio"
                aria-checked={settings.p1Scheme === o.id}
                className={settings.p1Scheme === o.id ? 'active' : ''}
                onClick={() => { sfx.click(); updateSettings({ p1Scheme: o.id }); }}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="field-hint">Controla a paleta verde (esquerda).</p>
        </div>

        <div className="panel">
          <h3>Jogador 2 <small className="tag">modo 2 jogadores</small></h3>
          <div className="seg seg-vertical" role="radiogroup" aria-label="Teclas do jogador 2">
            {P2_OPTIONS.map((o) => (
              <button
                key={o.id}
                role="radio"
                aria-checked={settings.p2Scheme === o.id}
                className={settings.p2Scheme === o.id ? 'active' : ''}
                onClick={() => { sfx.click(); updateSettings({ p2Scheme: o.id }); }}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="field-hint">
            {settings.p1Scheme !== 'wasd' && settings.p2Scheme === 'arrows'
              ? '⚠️ Atenção: as setas estariam em ambos os jogadores.'
              : 'Controla a paleta vermelha (direita).'}
          </p>
        </div>

        <div className="panel">
          <h3>🎮 Gamepad (USB/Bluetooth)</h3>
          <label className="switch-row">
            <input
              type="checkbox"
              checked={settings.gamepadEnabled}
              onChange={(e) => {
                sfx.click();
                updateSettings({ gamepadEnabled: e.target.checked });
              }}
            />
            <span>Usar controles no jogo</span>
          </label>

          <ul className="pad-list">
            {pads.length === 0 && <li className="muted">Nenhum controle detectado</li>}
            {pads.map((id) => (
              <li key={id} className="pad-ok">
                ✅ {id.slice(0, 46)}
              </li>
            ))}
          </ul>
          <p className="field-hint">
            Controle 1 → Jogador 1 (analógico esquerdo ou D-pad).<br />
            Controle 2 → Jogador 2 (somente no modo 2 jogadores).
          </p>
        </div>

        <div className="panel">
          <h3>🧪 Teste de Entrada</h3>
          <div className={`key-test${lastKey ? ' active' : ''}`}>
            {lastKey ? `Última tecla: ${lastKey}` : 'Pressione qualquer tecla…'}
          </div>
          <p className="field-hint">
            Toque/arraste na metade esquerda do campo move o Jogador 1
            (direita move o Jogador 2 no modo 2 jogadores).
          </p>
        </div>
      </div>

      <div className="screen-actions">
        <button className="btn btn-primary" onClick={() => { sfx.click(); setScreen('menu'); }}>
          Concluir
        </button>
      </div>
    </section>
  );
}
