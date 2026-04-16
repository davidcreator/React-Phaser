/**
 * React + Phaser sprite model
 * Category: sprites
 * Lesson: 02 - RPG
 */
import * as Phaser from 'phaser'

export class Example09Sprites02RpgScene extends Phaser.Scene {
  constructor() {
    super('09-sprites-02-rpg')
  }

  create() {
    this.createRpgTextures()

    const worldWidth = 1600
    const worldHeight = 900
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight)
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight)

    for (let y = 0; y < worldHeight; y += 64) {
      for (let x = 0; x < worldWidth; x += 64) {
        this.add.sprite(x + 32, y + 32, 'rpg-grass').setDepth(-5)
      }
    }

    this.player = this.physics.add.sprite(220, 260, 'rpg-hero-idle')
    this.player.setCollideWorldBounds(true)
    this.player.body.setSize(14, 20).setOffset(5, 10)

    this.npc = this.add.sprite(460, 230, 'rpg-npc')
    this.physics.add.existing(this.npc, true)

    this.obstacles = this.physics.add.staticGroup()
    const trees = [
      [420, 340],
      [610, 280],
      [750, 420],
      [960, 510],
      [1110, 340],
      [1260, 620],
      [1380, 470],
    ]

    trees.forEach(([x, y]) => {
      const tree = this.obstacles.create(x, y, 'rpg-tree')
      tree.refreshBody()
    })

    this.physics.add.collider(this.player, this.obstacles)
    this.physics.add.collider(this.player, this.npc)

    this.anims.create({
      key: 'rpg-hero-walk',
      frames: [{ key: 'rpg-hero-idle' }, { key: 'rpg-hero-step' }],
      frameRate: 8,
      repeat: -1,
    })

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setZoom(1.25)

    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D',
    })

    this.add
      .text(16, 14, '02-RPG | Arrows / WASD para mover', {
        fontSize: '18px',
        color: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(10)
  }

  createRpgTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false })

    const drawHero = (legOffset, shirtColor, key) => {
      g.clear()
      g.fillStyle(0xffddb5, 1)
      g.fillRect(8, 2, 8, 8)
      g.fillStyle(shirtColor, 1)
      g.fillRect(6, 10, 12, 10)
      g.fillStyle(0x1f2937, 1)
      g.fillRect(7, 20, 4, 8)
      g.fillRect(13 + legOffset, 20, 4, 8)
      g.fillStyle(0x4338ca, 1)
      g.fillRect(4, 11, 2, 8)
      g.fillRect(18, 11, 2, 8)
      g.generateTexture(key, 24, 32)
    }

    drawHero(0, 0x22c55e, 'rpg-hero-idle')
    drawHero(-1, 0x16a34a, 'rpg-hero-step')

    g.clear()
    g.fillStyle(0xffddb5, 1)
    g.fillRect(8, 2, 8, 8)
    g.fillStyle(0xf59e0b, 1)
    g.fillRect(6, 10, 12, 10)
    g.fillStyle(0x374151, 1)
    g.fillRect(7, 20, 4, 8)
    g.fillRect(13, 20, 4, 8)
    g.generateTexture('rpg-npc', 24, 32)

    g.clear()
    g.fillStyle(0x6b4f2a, 1)
    g.fillRect(17, 26, 6, 26)
    g.fillStyle(0x2e7d32, 1)
    g.fillCircle(20, 16, 18)
    g.fillStyle(0x43a047, 1)
    g.fillCircle(14, 20, 12)
    g.fillCircle(28, 20, 12)
    g.generateTexture('rpg-tree', 40, 56)

    g.clear()
    g.fillStyle(0x1e3a2f, 1)
    g.fillRect(0, 0, 64, 64)
    g.fillStyle(0x234438, 1)
    g.fillRect(0, 0, 32, 32)
    g.fillRect(32, 32, 32, 32)
    g.generateTexture('rpg-grass', 64, 64)

    g.destroy()
  }

  update() {
    const speed = 180
    let vx = 0
    let vy = 0

    if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -speed
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx = speed
    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -speed
    if (this.cursors.down.isDown || this.wasd.down.isDown) vy = speed

    this.player.setVelocity(vx, vy)

    if (vx < 0) this.player.setFlipX(true)
    if (vx > 0) this.player.setFlipX(false)

    const moving = vx !== 0 || vy !== 0
    if (moving) {
      if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'rpg-hero-walk') {
        this.player.play('rpg-hero-walk')
      }
    } else {
      this.player.stop()
      this.player.setTexture('rpg-hero-idle')
    }
  }
}

export function createExample09Sprites02RpgSceneConfig(parent) {
  return {
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    parent,
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 0 }, debug: false },
    },
    scene: [Example09Sprites02RpgScene],
  }
}