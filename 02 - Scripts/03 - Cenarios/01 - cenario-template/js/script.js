/**
 * React + Phaser script model
 * Category: cenarios
 * Lesson: 01 - cenario-template
 * How to use:
 * 1) Copy this file to your React project (src/scenes or src/scripts).
 * 2) Register this scene in your Phaser config.
 * 3) Replace placeholders with your own assets and rules.
 */
import * as Phaser from 'phaser'

export class Example03Cenarios01CenarioTemplateScene extends Phaser.Scene {
  constructor() {
    super('03-cenarios-01-cenario-template')
  }
  create() {
    const { width: W, height: H } = this.cameras.main

    this.add.text(16, 12, '01 - cenario-template', { fontSize: '18px', color: '#ffffff' })

    this.sky = this.add.tileSprite(W / 2, H / 2, W, H, null).setTint(0x1e88e5)
    this.mid = this.add.tileSprite(W / 2, H * 0.63, W, H * 0.5, null).setTint(0x43a047).setAlpha(0.7)
    this.front = this.add.tileSprite(W / 2, H * 0.78, W, H * 0.35, null).setTint(0x2e7d32).setAlpha(0.85)

    this.input.keyboard.on('keydown-B', () => {
      const tint = Phaser.Display.Color.RandomRGB().color
      this.sky.setTint(tint)
    })
  }

  update(_, delta) {
    const step = delta * 0.001
    this.sky.tilePositionX += 5 * step
    this.mid.tilePositionX += 22 * step
    this.front.tilePositionX += 45 * step
  }
}

export function createExample03Cenarios01CenarioTemplateSceneConfig(parent) {
  return {
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    parent,
    backgroundColor: '#101424',
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 0 }, debug: false },
    },
    scene: [Example03Cenarios01CenarioTemplateScene],
  }
}

