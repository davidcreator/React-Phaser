import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { SpriteScene, type SceneCallbacks } from "./SpriteScene";
import type { ProjectConfig } from "../types";

export function useGame(
  containerRef: React.RefObject<HTMLDivElement | null>,
  config: ProjectConfig,
  callbacks: SceneCallbacks
) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<SpriteScene | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    const scene = new SpriteScene();
    sceneRef.current = scene;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: config.stage.bgColor,
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: [scene],
    });
    gameRef.current = game;
    game.scene.start("SpriteScene", { config: configRef.current, callbacks });

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { gameRef, sceneRef };
}
