import * as Phaser from 'phaser'

export default class Ball {
  constructor(scene, x, y) {
    this.scene = scene
    this.radius = 10
    this.baseSpeed = 260
    this.maxSpeed = 620
    this.vx = 0
    this.vy = 0

    this.sprite = scene.add.circle(x, y, this.radius, 0xffffff)
  }

  launch(direction = Phaser.Math.RND.pick([-1, 1])) {
    const safeDirection = direction >= 0 ? 1 : -1
    const minVertical = 80

    let vy = Phaser.Math.Between(-170, 170)
    if (Math.abs(vy) < minVertical) {
      vy = minVertical * Phaser.Math.RND.pick([-1, 1])
    }

    const vx = safeDirection * Math.sqrt(this.baseSpeed ** 2 - vy ** 2)
    this.setVelocity(vx, vy)
  }

  update(dt) {
    this.sprite.x += this.vx * dt
    this.sprite.y += this.vy * dt
  }

  setVelocity(vx, vy) {
    this.vx = vx
    this.vy = vy
  }

  getSpeed() {
    return Math.sqrt(this.vx ** 2 + this.vy ** 2)
  }

  reset(cx, cy) {
    this.sprite.setPosition(cx, cy)
    this.setVelocity(0, 0)
  }

  getBounds() {
    return {
      left: this.sprite.x - this.radius,
      right: this.sprite.x + this.radius,
      top: this.sprite.y - this.radius,
      bottom: this.sprite.y + this.radius,
    }
  }
}
