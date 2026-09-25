import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../game/scenes/GameScene';
import { useGameStore } from '../store/useGameStore';
import { H, W } from '../game/constants';

/**
 * Ponte React ↔ Phaser.
 *  • O jogo é criado uma única vez ao entrar na partida e destruído ao sair
 *    (sem vazamento de instâncias — problema clássico de integrations amadoras).
 *  • Rematch/restart = scene.restart(), que relê o store recém-resetado.
 */
export function PhaserGame() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: W,
      height: H,
      transparent: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [GameScene],
      banner: false,
    });

    const unsub = useGameStore.subscribe((state, prev) => {
      if (state.matchId !== prev.matchId) {
        const scene = game.scene.getScene('Pong');
        if (scene) scene.scene.restart();
      }
    });

    return () => {
      unsub();
      game.destroy(true);
    };
  }, []);

  return <div ref={hostRef} className="phaser-host" />;
}
