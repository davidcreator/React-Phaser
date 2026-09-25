/**
 * Texturas geradas em tempo de execução via Graphics.generateTexture.
 * O projeto não possui assets binários — tudo é procedural.
 */

import type Phaser from 'phaser';

const SPARK = 'spark';

export function ensureTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists(SPARK)) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(4, 4, 4);
  g.generateTexture(SPARK, 8, 8);
  g.destroy();
}

export const SPARK_TEXTURE = SPARK;
