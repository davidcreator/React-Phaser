import * as Phaser from 'phaser'
import Paddle from '../objects/Paddle'
import Ball from '../objects/Ball'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game')
  }

  create() {
    const { width: W, height: H } = this.cameras.main

    this.maxPoints = 7
    this.aScore = 0
    this.bScore = 0
    this.roundActive = false
    this.matchEnded = false
    this.nextServeDirection = Phaser.Math.RND.pick([-1, 1])

    this.drawArena(W, H)

    this.playerA = new Paddle(this, 40, H / 2, 0x5599ee)
    this.playerB = new Paddle(this, W - 40, H / 2, 0xee5555)
    this.ball = new Ball(this, W / 2, H / 2)

    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({ up: 'W', down: 'S' })
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)

    const scoreStyle = {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }

    this.aScoreText = this.add.text(W * 0.25, 28, 'A: 0', scoreStyle).setOrigin(0.5)
    this.bScoreText = this.add.text(W * 0.75, 28, 'B: 0', scoreStyle).setOrigin(0.5)

    this.centerMessage = this.add
      .text(W / 2, H / 2, '', {
        fontSize: '24px',
        fontFamily: 'monospace',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    this.infoText = this.add
      .text(W / 2, H - 22, `Primeiro a ${this.maxPoints} | A usa W/S ou setas`, {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#b9bfd4',
      })
      .setOrigin(0.5)

    this.startRound()
  }

  drawArena(W, H) {
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e)

    for (let y = 14; y < H; y += 28) {
      this.add.rectangle(W / 2, y, 4, 16, 0x444466)
    }

    this.add.rectangle(W / 2, 0, W, 2, 0x2d3250).setOrigin(0.5, 0)
    this.add.rectangle(W / 2, H, W, 2, 0x2d3250).setOrigin(0.5, 1)
  }

  startRound() {
    const { width: W, height: H } = this.cameras.main

    this.roundActive = false
    this.playerA.reset()
    this.playerB.reset()
    this.ball.reset(W / 2, H / 2)

    if (this.matchEnded) {
      return
    }

    this.centerMessage.setColor('#ffffff')
    this.centerMessage.setText('Preparar...')

    this.time.delayedCall(800, () => {
      if (this.matchEnded) {
        return
      }

      this.centerMessage.setText('')
      this.ball.launch(this.nextServeDirection)
      this.roundActive = true
    })
  }

  update(_, delta) {
    const dt = Math.min(delta / 1000, 1 / 30)
    const H = this.cameras.main.height
    const W = this.cameras.main.width

    if (this.matchEnded) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.scene.restart()
      } else if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
        this.scene.start('Menu')
      }
      return
    }

    this.handlePlayerInput()
    this.updateCpuPaddle()
    this.playerA.update(dt, H)
    this.playerB.update(dt, H)

    if (!this.roundActive) {
      return
    }

    this.ball.update(dt)
    this.handleWallBounce(H)
    this.handlePaddleCollisions()

    if (this.ball.sprite.x + this.ball.radius < 0) {
      this.addPoint('B')
      return
    }

    if (this.ball.sprite.x - this.ball.radius > W) {
      this.addPoint('A')
    }
  }

  handlePlayerInput() {
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      this.playerA.moveUp()
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      this.playerA.moveDown()
    } else {
      this.playerA.stop()
    }
  }

  updateCpuPaddle() {
    const diff = this.ball.sprite.y - this.playerB.sprite.y

    if (Math.abs(diff) <= 10) {
      this.playerB.stop()
      return
    }

    if (diff > 0) {
      this.playerB.moveDown()
    } else {
      this.playerB.moveUp()
    }
  }

  handleWallBounce(worldHeight) {
    const top = this.ball.radius
    const bottom = worldHeight - this.ball.radius

    if (this.ball.sprite.y <= top) {
      this.ball.sprite.y = top
      this.ball.vy = Math.abs(this.ball.vy)
    } else if (this.ball.sprite.y >= bottom) {
      this.ball.sprite.y = bottom
      this.ball.vy = -Math.abs(this.ball.vy)
    }
  }

  handlePaddleCollisions() {
    if (this.ball.vx < 0 && this.isOverlapping(this.ball.getBounds(), this.playerA.getBounds())) {
      this.reflectFromPaddle(this.playerA, true)
      return
    }

    if (this.ball.vx > 0 && this.isOverlapping(this.ball.getBounds(), this.playerB.getBounds())) {
      this.reflectFromPaddle(this.playerB, false)
    }
  }

  isOverlapping(a, b) {
    return a.right >= b.left && a.left <= b.right && a.bottom >= b.top && a.top <= b.bottom
  }

  reflectFromPaddle(paddle, hitLeftPaddle) {
    const paddleHalf = paddle.height / 2
    const relativeImpact = Phaser.Math.Clamp(
      (this.ball.sprite.y - paddle.sprite.y) / paddleHalf,
      -1,
      1,
    )

    const maxBounceAngle = Phaser.Math.DegToRad(70)
    const randomOffset = Phaser.Math.FloatBetween(-0.06, 0.06)
    const speed = Phaser.Math.Clamp(this.ball.getSpeed() * 1.05, this.ball.baseSpeed, this.ball.maxSpeed)

    const angle = relativeImpact * maxBounceAngle + randomOffset

    let vx = Math.cos(angle) * speed
    let vy = Math.sin(angle) * speed

    if (hitLeftPaddle) {
      vx = Math.abs(vx)
    } else {
      vx = -Math.abs(vx)
    }

    const minVerticalSpeed = 90
    if (Math.abs(vy) < minVerticalSpeed) {
      const signY = Math.sign(vy || Phaser.Math.RND.pick([-1, 1]))
      vy = signY * minVerticalSpeed
      const horizontalMagnitude = Math.sqrt(Math.max(speed ** 2 - vy ** 2, 0))
      vx = (hitLeftPaddle ? 1 : -1) * horizontalMagnitude
    }

    this.ball.setVelocity(vx, vy)

    const pushDistance = paddle.width / 2 + this.ball.radius + 1
    this.ball.sprite.x = hitLeftPaddle
      ? paddle.sprite.x + pushDistance
      : paddle.sprite.x - pushDistance
  }

  addPoint(winner) {
    if (!this.roundActive) {
      return
    }

    this.roundActive = false

    if (winner === 'A') {
      this.aScore += 1
    } else {
      this.bScore += 1
    }

    this.refreshScore()

    if (this.aScore >= this.maxPoints || this.bScore >= this.maxPoints) {
      this.finishMatch()
      return
    }

    this.nextServeDirection = winner === 'A' ? 1 : -1
    this.centerMessage.setColor('#ffffff')
    this.centerMessage.setText(`Ponto para ${winner}`)
    this.time.delayedCall(700, () => this.startRound())
  }

  refreshScore() {
    this.aScoreText.setText(`A: ${this.aScore}`)
    this.bScoreText.setText(`B: ${this.bScore}`)
  }

  finishMatch() {
    const { width: W, height: H } = this.cameras.main
    const winner = this.aScore > this.bScore ? 'A' : 'B'

    this.matchEnded = true
    this.roundActive = false
    this.ball.reset(W / 2, H / 2)

    this.centerMessage.setColor(winner === 'A' ? '#66ff88' : '#ff8888')
    this.centerMessage.setText(`Raquete ${winner} venceu!`)

    this.add
      .text(W / 2, H / 2 + 46, 'SPACE = jogar de novo | ESC = menu', {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#d2d7e6',
      })
      .setOrigin(0.5)
  }
}
