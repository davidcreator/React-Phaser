/**
 * React + Phaser script model
 * Category: fisica
 * Lesson: 15 - forca-atrito-deformacao
 * How to use:
 * 1) Copy this file to your React project (src/scenes or src/scripts).
 * 2) Register this scene in your Phaser config.
 * 3) Replace placeholders with your own assets and rules.
 */
import * as Phaser from 'phaser'

export class Example04Fisica15ForcaAtritoDeformacaoScene extends Phaser.Scene {
  constructor() {
    super('04-fisica-15-forca-atrito-deformacao')
  }
  create() {
    const { width: W, height: H } = this.cameras.main

    this.add.text(16, 12, '15 - forca-atrito-deformacao', { fontSize: '18px', color: '#ffffff' })

    this.physics.world.gravity.y = 620

    this.floor = this.add.rectangle(W / 2, H - 24, W - 40, 30, 0x6d4c41)
    this.player = this.add.rectangle(180, 120, 36, 36, 0xff7043)
    this.ball = this.add.circle(360, 60, 18, 0x29b6f6)

    this.physics.add.existing(this.floor, true)
    this.physics.add.existing(this.player)
    this.physics.add.existing(this.ball)

    this.playerBody = this.player.body
    this.ballBody = this.ball.body

    this.playerBody.setCollideWorldBounds(true)
    this.ballBody.setCollideWorldBounds(true)
    this.ballBody.setBounce(0.92, 0.86)
    this.ballBody.setDrag(40, 10)

    this.physics.add.collider(this.player, this.floor)
    this.physics.add.collider(this.ball, this.floor)
    this.physics.add.collider(this.player, this.ball)

    this.cursors = this.input.keyboard.createCursorKeys()
  }

  update() {
    const move = 220
    if (this.cursors.left.isDown) this.playerBody.setVelocityX(-move)
    else if (this.cursors.right.isDown) this.playerBody.setVelocityX(move)
    else this.playerBody.setVelocityX(0)

    if (this.cursors.up.isDown && this.playerBody.blocked.down) {
      this.playerBody.setVelocityY(-420)
    }

    const pull = 9
    const dx = this.player.x - this.ball.x
    const dy = this.player.y - this.ball.y
    this.ballBody.velocity.x += dx * 0.0005 * pull
    this.ballBody.velocity.y += dy * 0.0005 * pull
  }
}

export function createExample04Fisica15ForcaAtritoDeformacaoSceneConfig(parent) {
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
    scene: [Example04Fisica15ForcaAtritoDeformacaoScene],
  }
}

