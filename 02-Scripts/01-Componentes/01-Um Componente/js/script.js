/**
 * React + Phaser script model
 * Category: componentes
 * Lesson: 01 - Um Componente
 * How to use:
 * 1) Copy this file to your React project (src/scenes or src/scripts).
 * 2) Register this scene in your Phaser config.
 * 3) Replace placeholders with your own assets and rules.
 */
import * as Phaser from 'phaser'

export class Example01Componentes01UmComponenteScene extends Phaser.Scene {
  constructor() {
    super('01-componentes-01-um-componente')
  }
  create() {
    const { width: W, height: H } = this.cameras.main

    this.add.text(16, 12, '01 - Um Componente', { fontSize: '18px', color: '#ffffff' })

    this.player = this.add.rectangle(W * 0.2, H * 0.5, 40, 40, 0x42a5f5)
    this.blockA = this.add.rectangle(W * 0.5, H * 0.45, 120, 30, 0xef5350)
    this.blockB = this.add.ellipse(W * 0.72, H * 0.62, 80, 80, 0x66bb6a)

    this.physics.add.existing(this.player)
    this.physics.add.existing(this.blockA, true)
    this.physics.add.existing(this.blockB, true)

    this.playerBody = this.player.body
    this.playerBody.setCollideWorldBounds(true)
    this.playerBody.setBounce(0.15)

    this.physics.add.collider(this.player, this.blockA)
    this.physics.add.collider(this.player, this.blockB)

    this.cursors = this.input.keyboard.createCursorKeys()
  }

  update() {
    const speed = 220
    const vx = (this.cursors.left.isDown ? -speed : 0) + (this.cursors.right.isDown ? speed : 0)
    const vy = (this.cursors.up.isDown ? -speed : 0) + (this.cursors.down.isDown ? speed : 0)
    this.playerBody.setVelocity(vx, vy)
  }
}

export function createExample01Componentes01UmComponenteSceneConfig(parent) {
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
    scene: [Example01Componentes01UmComponenteScene],
  }
}

