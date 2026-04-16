/**
 * React + Phaser script model
 * Category: controles
 * Lesson: 11 - controlado-por-maquina-rotacao
 * How to use:
 * 1) Copy this file to your React project (src/scenes or src/scripts).
 * 2) Register this scene in your Phaser config.
 * 3) Replace placeholders with your own assets and rules.
 */
import * as Phaser from 'phaser'

export class Example02Controles11ControladoPorMaquinaRotacaoScene extends Phaser.Scene {
  constructor() {
    super('02-controles-11-controlado-por-maquina-rotacao')
  }
  create() {
    const { width: W, height: H } = this.cameras.main

    this.add.text(16, 12, '11 - controlado-por-maquina-rotacao', { fontSize: '18px', color: '#ffffff' })

    this.actor = this.add.rectangle(W * 0.25, H * 0.5, 42, 42, 0xffca28)
    this.target = this.add.rectangle(W * 0.75, H * 0.5, 42, 42, 0x5c6bc0)

    this.physics.add.existing(this.actor)
    this.physics.add.existing(this.target)

    this.actorBody = this.actor.body
    this.targetBody = this.target.body

    this.actorBody.setCollideWorldBounds(true)
    this.targetBody.setCollideWorldBounds(true)

    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' })

    this.pointerGoal = new Phaser.Math.Vector2(this.target.x, this.target.y)
    this.input.on('pointermove', (p) => {
      this.pointerGoal.set(p.worldX, p.worldY)
    })

    this.input.on('pointerdown', (p) => {
      this.pointerGoal.set(p.worldX, p.worldY)
      this.target.setFillStyle(0x26a69a)
      this.time.delayedCall(120, () => this.target.setFillStyle(0x5c6bc0))
    })
  }

  update(_, delta) {
    const speed = 260
    let vx = 0
    let vy = 0

    if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= speed
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx += speed
    if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= speed
    if (this.cursors.down.isDown || this.wasd.down.isDown) vy += speed

    this.actorBody.setVelocity(vx, vy)

    const dt = Math.min(delta / 1000, 1 / 30)
    const dirX = this.pointerGoal.x - this.target.x
    const dirY = this.pointerGoal.y - this.target.y
    this.target.x += Phaser.Math.Clamp(dirX, -160 * dt, 160 * dt)
    this.target.y += Phaser.Math.Clamp(dirY, -160 * dt, 160 * dt)
  }
}

export function createExample02Controles11ControladoPorMaquinaRotacaoSceneConfig(parent) {
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
    scene: [Example02Controles11ControladoPorMaquinaRotacaoScene],
  }
}

