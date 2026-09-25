import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import BreakoutScene from './BreakoutScene.js';
import { WORLD } from './rules.js';

export default function PhaserCanvas({ mode, onHud, onGameOver, onSceneReady }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return undefined;
    const scene = new BreakoutScene({ mode, onHud, onGameOver, onReady: onSceneReady });
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: mountRef.current,
      width: WORLD.width,
      height: WORLD.height,
      backgroundColor: '#07111f',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: WORLD.width,
        height: WORLD.height,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
          fps: 60,
        },
      },
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true,
      },
      scene,
    });

    return () => {
      onSceneReady(null);
      game.destroy(true);
    };
  }, [mode, onHud, onGameOver, onSceneReady]);

  return <div ref={mountRef} className="phaser-mount" aria-label="Área do jogo Breakout" />;
}
