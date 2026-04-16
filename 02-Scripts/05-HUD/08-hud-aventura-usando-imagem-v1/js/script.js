/**
 * React + Phaser script model
 * Category: hud
 * Lesson: 08 - hud-aventura-usando-imagem-v1
 * How to use:
 * 1) Copy this file to your React project (src/scenes or src/scripts).
 * 2) Register this scene in your Phaser config.
 * 3) Replace placeholders with your own assets and rules.
 */
import * as Phaser from 'phaser'

export class Example05Hud08HudAventuraUsandoImagemV1Scene extends Phaser.Scene {
  constructor() {
    super('05-hud-08-hud-aventura-usando-imagem-v1')
  }
  create() {
    const { width: W } = this.cameras.main

    this.score = 0
    this.life = 3
    this.timeLeft = 90

    this.scoreText = this.add.text(20, 16, 'Score: 0', { fontSize: '20px', color: '#ffffff' })
    this.lifeText = this.add.text(W / 2 - 50, 16, 'Life: 3', { fontSize: '20px', color: '#ffffff' })
    this.timerText = this.add.text(W - 170, 16, 'Time: 90', { fontSize: '20px', color: '#ffffff' })

    this.helpText = this.add.text(20, 52, 'SPACE = +score | H = -life | T = +5s', {
      fontSize: '14px',
      color: '#cfd8dc',
    })

    this.input.keyboard.on('keydown-SPACE', () => {
      this.score += 10
      this.scoreText.setText(`Score: ${this.score}`)
    })

    this.input.keyboard.on('keydown-H', () => {
      this.life = Math.max(this.life - 1, 0)
      this.lifeText.setText(`Life: ${this.life}`)
    })

    this.input.keyboard.on('keydown-T', () => {
      this.timeLeft += 5
      this.timerText.setText(`Time: ${this.timeLeft}`)
    })

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.timeLeft = Math.max(this.timeLeft - 1, 0)
        this.timerText.setText(`Time: ${this.timeLeft}`)
      },
    })
  }
}

export function createExample05Hud08HudAventuraUsandoImagemV1SceneConfig(parent) {
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
    scene: [Example05Hud08HudAventuraUsandoImagemV1Scene],
  }
}


