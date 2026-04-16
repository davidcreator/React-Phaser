/**
 * React + Phaser script model
 * Category: sprites
 * Lesson: 01 - Adventure Sprites
 * How to use:
 * 1) Copy this file to your React project (src/scenes or src/scripts).
 * 2) Register this scene in your Phaser config.
 * 3) Replace placeholders with your own assets and rules.
 */
import * as Phaser from 'phaser'

export class Example09Sprites01AdventureSpritesScene extends Phaser.Scene {
  constructor() {
    super('09-sprites-01-adventure-sprites')
  }
  preload() {
    // Replace with your real assets in React + Phaser projects
    // this.load.spritesheet('hero', '/assets/hero.png', { frameWidth: 32, frameHeight: 32 })
  }

  create() {
    const { width: W, height: H } = this.cameras.main
    this.add.text(16, 12, '01 - Adventure Sprites', { fontSize: '18px', color: '#ffffff' })

    const g = this.make.graphics({ x: 0, y: 0, add: false })
    g.fillStyle(0xffd54f, 1)
    g.fillRect(0, 0, 32, 32)
    g.lineStyle(2, 0x5d4037, 1)
    g.strokeRect(0, 0, 32, 32)
    g.generateTexture('lesson-sprite', 32, 32)

    this.hero = this.physics.add.sprite(W * 0.3, H * 0.5, 'lesson-sprite')
    this.hero.setCollideWorldBounds(true)

    this.cursors = this.input.keyboard.createCursorKeys()
  }

  update() {
    const speed = 220
    this.hero.setVelocity(0, 0)

    if (this.cursors.left.isDown) this.hero.setVelocityX(-speed)
    if (this.cursors.right.isDown) this.hero.setVelocityX(speed)
    if (this.cursors.up.isDown) this.hero.setVelocityY(-speed)
    if (this.cursors.down.isDown) this.hero.setVelocityY(speed)
  }
}

export function createExample09Sprites01AdventureSpritesSceneConfig(parent) {
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
    scene: [Example09Sprites01AdventureSpritesScene],
  }
}

