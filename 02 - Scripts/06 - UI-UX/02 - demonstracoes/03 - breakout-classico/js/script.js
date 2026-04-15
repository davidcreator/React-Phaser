/**
 * React + Phaser script model
 * Category: ui-ux
 * Lesson: 03 - breakout-classico
 * How to use:
 * 1) Copy this file to your React project (src/scenes or src/scripts).
 * 2) Register this scene in your Phaser config.
 * 3) Replace placeholders with your own assets and rules.
 */
import * as Phaser from 'phaser'

export class Example06UiUx03BreakoutClassicoScene extends Phaser.Scene {
  constructor() {
    super('06-ui-ux-03-breakout-classico')
  }
  create() {
    const { width: W, height: H } = this.cameras.main

    this.title = this.add.text(W / 2, 90, '03 - breakout-classico', {
      fontSize: '34px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.startBtn = this.add.rectangle(W / 2, H / 2 - 20, 260, 60, 0x26a69a)
      .setInteractive({ useHandCursor: true })
    this.startText = this.add.text(W / 2, H / 2 - 20, 'START', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5)

    this.pauseHint = this.add.text(W / 2, H / 2 + 45, 'Press P to toggle pause overlay', {
      fontSize: '14px',
      color: '#cfd8dc',
    }).setOrigin(0.5)

    this.overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setVisible(false)
    this.overlayText = this.add.text(W / 2, H / 2, 'PAUSED', { fontSize: '42px', color: '#ffffff' })
      .setOrigin(0.5)
      .setVisible(false)

    this.startBtn.on('pointerover', () => this.startBtn.setFillStyle(0x2bbbad))
    this.startBtn.on('pointerout', () => this.startBtn.setFillStyle(0x26a69a))
    this.startBtn.on('pointerdown', () => {
      this.startText.setText('LOADING...')
      this.time.delayedCall(500, () => this.startText.setText('START'))
    })

    this.input.keyboard.on('keydown-P', () => {
      const visible = !this.overlay.visible
      this.overlay.setVisible(visible)
      this.overlayText.setVisible(visible)
    })
  }
}

export function createExample06UiUx03BreakoutClassicoSceneConfig(parent) {
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
    scene: [Example06UiUx03BreakoutClassicoScene],
  }
}

