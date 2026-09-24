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

    // Phaser's RESIZE mode also listens to window changes, but a flex/grid
    // layout can change the parent dimensions without changing the window.
    // Observe the actual canvas host so the game never keeps a stale size
    // after wrapping the header, opening the sidebar or rotating a device.
    let lastWidth = 0;
    let lastHeight = 0;
    const resizeGame = () => {
      const host = containerRef.current;
      const instance = gameRef.current;
      if (!host || !instance) return;
      const rect = host.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      // Do not resize Phaser to 0 while a flex parent is between layouts.
      if (width < 1 || height < 1) return;
      if (width === lastWidth && height === lastHeight) return;
      lastWidth = width;
      lastHeight = height;
      instance.scale.resize(width, height);
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(resizeGame)
        : null;
    resizeObserver?.observe(containerRef.current);
    const resizeFrame = window.requestAnimationFrame(resizeGame);

    return () => {
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(resizeFrame);
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { gameRef, sceneRef };
}
