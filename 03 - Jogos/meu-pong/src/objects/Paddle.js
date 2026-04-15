import * as Phaser from 'phaser'

export default class Paddle {
  constructor(scene, x, y, color = 0xffffff) {
    this.scene = scene
    this.startY = y
    this.width = 16
    this.height = 100
    this.speed = 360
    this.direction = 0

    this.sprite = scene.add.rectangle(x, y, this.width, this.height, color)
  }

  moveUp() {
    this.direction = -1
  }

  moveDown() {
    this.direction = 1
  }

  stop() {
    this.direction = 0
  }

  update(dt, worldHeight) {
    this.sprite.y += this.direction * this.speed * dt

    const half = this.height / 2
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, half, worldHeight - half)
  }

  reset() {
    this.sprite.y = this.startY
    this.stop()
  }

  getBounds() {
    const halfW = this.width / 2
    const halfH = this.height / 2

    return {
      left: this.sprite.x - halfW,
      right: this.sprite.x + halfW,
      top: this.sprite.y - halfH,
      bottom: this.sprite.y + halfH,
    }
  }
}
