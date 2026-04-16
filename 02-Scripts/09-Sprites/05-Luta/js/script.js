/**
 * React + Phaser sprite model
 * Category: sprites
 * Lesson: 05 - Luta
 */
import * as Phaser from 'phaser'

export class Example09Sprites05LutaScene extends Phaser.Scene {
  constructor() {
    super('09-sprites-05-luta')
  }

  create() {
    const { width: W, height: H } = this.cameras.main

    this.createFightTextures(W, H)

    this.add.sprite(W / 2, H / 2, 'fight-bg')

    this.ground = this.physics.add.staticSprite(W / 2, H - 48, 'fight-ground')
    this.ground.refreshBody()

    this.player = this.physics.add.sprite(W * 0.28, H - 120, 'fighter-a-idle')
    this.enemy = this.physics.add.sprite(W * 0.72, H - 120, 'fighter-b-idle')

    this.player.setCollideWorldBounds(true)
    this.enemy.setCollideWorldBounds(true)

    this.player.body.setSize(26, 42).setOffset(6, 6)
    this.enemy.body.setSize(26, 42).setOffset(6, 6)

    this.enemy.setFlipX(true)

    this.physics.add.collider(this.player, this.ground)
    this.physics.add.collider(this.enemy, this.ground)
    this.physics.add.collider(this.player, this.enemy)

    this.controls = this.input.keyboard.addKeys({
      left: 'A',
      right: 'D',
      jump: 'W',
      attack: 'J',
    })

    this.playerHp = 100
    this.enemyHp = 100
    this.playerAttackActive = false
    this.enemyAttackActive = false
    this.lastPlayerHitAt = 0
    this.lastEnemyHitAt = 0
    this.nextEnemyAttackAt = 0
    this.finished = false

    this.playerHpBar = this.add.rectangle(32, 28, 220, 14, 0x22c55e).setOrigin(0, 0.5)
    this.enemyHpBar = this.add.rectangle(W - 32, 28, 220, 14, 0x22c55e).setOrigin(1, 0.5)

    this.infoText = this.add.text(18, 52, '05-Luta | A/D mover, W pular, J atacar', {
      fontSize: '18px',
      color: '#ffffff',
    })

    this.resultText = this.add
      .text(W / 2, 100, '', {
        fontSize: '34px',
        color: '#fde68a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
  }

  createFightTextures(W, H) {
    const g = this.make.graphics({ x: 0, y: 0, add: false })

    g.fillStyle(0x0b1020, 1)
    g.fillRect(0, 0, W, H)
    g.fillStyle(0x1f2937, 1)
    g.fillRect(0, H - 180, W, 180)
    g.fillStyle(0x334155, 1)
    for (let i = 0; i < W; i += 48) {
      g.fillRect(i, H - 180, 24, 180)
    }
    g.generateTexture('fight-bg', W, H)

    g.clear()
    g.fillStyle(0x44403c, 1)
    g.fillRect(0, 0, W, 58)
    g.fillStyle(0x57534e, 1)
    for (let x = 0; x < W; x += 60) {
      g.fillRect(x, 0, 30, 58)
    }
    g.generateTexture('fight-ground', W, 58)

    const drawFighter = (bodyColor, beltColor, legOffset, armOffset, key) => {
      g.clear()
      g.fillStyle(0xffddb5, 1)
      g.fillRect(12, 2, 14, 10)
      g.fillStyle(bodyColor, 1)
      g.fillRect(9, 12, 20, 18)
      g.fillStyle(beltColor, 1)
      g.fillRect(9, 24, 20, 4)
      g.fillStyle(0x111827, 1)
      g.fillRect(11, 30, 6, 14)
      g.fillRect(21 + legOffset, 30, 6, 14)
      g.fillStyle(bodyColor, 1)
      g.fillRect(4, 14, 5 + armOffset, 11)
      g.fillRect(29, 14, 5, 11)
      g.generateTexture(key, 38, 48)
    }

    drawFighter(0x2563eb, 0x1d4ed8, 0, 0, 'fighter-a-idle')
    drawFighter(0x1d4ed8, 0x1e40af, -1, 0, 'fighter-a-run')
    drawFighter(0x1d4ed8, 0x1e40af, 0, 7, 'fighter-a-punch')

    drawFighter(0xef4444, 0xb91c1c, 0, 0, 'fighter-b-idle')
    drawFighter(0xdc2626, 0x991b1b, -1, 0, 'fighter-b-run')
    drawFighter(0xdc2626, 0x991b1b, 0, 7, 'fighter-b-punch')

    g.destroy()
  }

  update(time) {
    if (this.finished) return

    this.handlePlayerInput()
    this.handleEnemyAi(time)
    this.resolveHits(time)
    this.refreshHud()
  }

  handlePlayerInput() {
    const speed = 230
    let vx = 0

    if (this.controls.left.isDown) vx = -speed
    if (this.controls.right.isDown) vx = speed

    this.player.setVelocityX(vx)

    if (vx < 0) this.player.setFlipX(true)
    if (vx > 0) this.player.setFlipX(false)

    if (Phaser.Input.Keyboard.JustDown(this.controls.jump) && this.player.body.blocked.down) {
      this.player.setVelocityY(-450)
    }

    if (Phaser.Input.Keyboard.JustDown(this.controls.attack) && !this.playerAttackActive) {
      this.playerAttackActive = true
      this.player.setTexture('fighter-a-punch')
      this.time.delayedCall(150, () => {
        this.playerAttackActive = false
        this.player.setTexture(Math.abs(this.player.body.velocity.x) > 0 ? 'fighter-a-run' : 'fighter-a-idle')
      })
    } else if (!this.playerAttackActive) {
      this.player.setTexture(Math.abs(vx) > 0 ? 'fighter-a-run' : 'fighter-a-idle')
    }
  }

  handleEnemyAi(time) {
    const dx = this.player.x - this.enemy.x
    const absDx = Math.abs(dx)

    this.enemy.setFlipX(dx < 0)

    if (absDx > 72) {
      const dir = dx > 0 ? 1 : -1
      this.enemy.setVelocityX(150 * dir)
      if (!this.enemyAttackActive) this.enemy.setTexture('fighter-b-run')
    } else {
      this.enemy.setVelocityX(0)
      if (!this.enemyAttackActive) this.enemy.setTexture('fighter-b-idle')

      if (time >= this.nextEnemyAttackAt) {
        this.enemyAttackActive = true
        this.enemy.setTexture('fighter-b-punch')
        this.nextEnemyAttackAt = time + 900

        this.time.delayedCall(160, () => {
          this.enemyAttackActive = false
          this.enemy.setTexture('fighter-b-idle')
        })
      }
    }
  }

  resolveHits(time) {
    if (this.playerAttackActive && time - this.lastPlayerHitAt > 220 && this.inAttackRange(this.player, this.enemy, 74)) {
      this.enemyHp = Math.max(0, this.enemyHp - 12)
      this.lastPlayerHitAt = time
      this.flash(this.enemy)
    }

    if (this.enemyAttackActive && time - this.lastEnemyHitAt > 260 && this.inAttackRange(this.enemy, this.player, 70)) {
      this.playerHp = Math.max(0, this.playerHp - 10)
      this.lastEnemyHitAt = time
      this.flash(this.player)
    }

    if (this.enemyHp <= 0) {
      this.endFight('Jogador venceu!')
    } else if (this.playerHp <= 0) {
      this.endFight('Inimigo venceu!')
    }
  }

  inAttackRange(attacker, target, maxDistance) {
    const dx = Math.abs(attacker.x - target.x)
    const dy = Math.abs(attacker.y - target.y)
    return dx <= maxDistance && dy <= 55
  }

  flash(target) {
    target.setTint(0xffffff)
    this.time.delayedCall(70, () => target.clearTint())
  }

  refreshHud() {
    const playerRatio = Phaser.Math.Clamp(this.playerHp / 100, 0, 1)
    const enemyRatio = Phaser.Math.Clamp(this.enemyHp / 100, 0, 1)

    this.playerHpBar.width = 220 * playerRatio
    this.enemyHpBar.width = 220 * enemyRatio

    this.playerHpBar.setFillStyle(playerRatio > 0.5 ? 0x22c55e : playerRatio > 0.25 ? 0xf59e0b : 0xef4444)
    this.enemyHpBar.setFillStyle(enemyRatio > 0.5 ? 0x22c55e : enemyRatio > 0.25 ? 0xf59e0b : 0xef4444)
  }

  endFight(message) {
    this.finished = true
    this.player.setVelocity(0, 0)
    this.enemy.setVelocity(0, 0)
    this.resultText.setText(message)
  }
}

export function createExample09Sprites05LutaSceneConfig(parent) {
  return {
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    parent,
    backgroundColor: '#0b1020',
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 900 }, debug: false },
    },
    scene: [Example09Sprites05LutaScene],
  }
}