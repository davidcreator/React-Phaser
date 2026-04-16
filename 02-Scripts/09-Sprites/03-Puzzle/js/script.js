/**
 * React + Phaser sprite model
 * Category: sprites
 * Lesson: 03 - Puzzle
 */
import * as Phaser from 'phaser'

export class Example09Sprites03PuzzleScene extends Phaser.Scene {
  constructor() {
    super('09-sprites-03-puzzle')
  }

  create() {
    const { width: W, height: H } = this.cameras.main

    this.createPuzzleTextures()

    this.cellSize = 96
    this.boardOrigin = { x: 90, y: 90 }
    this.targetSlots = []
    this.occupiedSlots = new Map()
    this.pieces = []
    this.completed = false

    this.add.rectangle(W * 0.24, H * 0.46, 330, 330, 0x0b1220, 0.45)
    this.add.rectangle(W * 0.72, H * 0.43, 360, 360, 0x0b1220, 0.38)

    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const index = row * 3 + col
        const x = this.boardOrigin.x + col * this.cellSize + this.cellSize / 2
        const y = this.boardOrigin.y + row * this.cellSize + this.cellSize / 2

        this.targetSlots.push({ index, x, y })

        this.add.rectangle(x, y, this.cellSize - 8, this.cellSize - 8, 0x111827, 0.85)
        this.add.rectangle(x, y, this.cellSize - 8, this.cellSize - 8)
          .setStrokeStyle(2, 0x334155, 1)
      }
    }

    const ids = Phaser.Utils.Array.NumberArray(0, 8)
    Phaser.Utils.Array.Shuffle(ids)

    ids.forEach((pieceId, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = W * 0.61 + col * 108
      const y = H * 0.24 + row * 108

      const piece = this.add
        .sprite(x, y, `puzzle-piece-${pieceId}`)
        .setInteractive({ draggable: true, useHandCursor: true })

      piece.setData('pieceId', pieceId)
      piece.setData('homeX', x)
      piece.setData('homeY', y)
      piece.setData('slotIndex', null)

      this.input.setDraggable(piece)
      this.pieces.push(piece)
    })

    this.input.on('dragstart', (_, gameObject) => {
      this.releaseSlot(gameObject)
      gameObject.setDepth(10)
      gameObject.setScale(1.06)
    })

    this.input.on('drag', (_, gameObject, dragX, dragY) => {
      gameObject.x = dragX
      gameObject.y = dragY
    })

    this.input.on('dragend', (_, gameObject) => {
      gameObject.setDepth(1)
      gameObject.setScale(1)
      this.snapPiece(gameObject)
    })

    this.statusText = this.add.text(18, 16, '03-Puzzle | Arraste as pecas para os slots', {
      fontSize: '18px',
      color: '#ffffff',
    })

    this.helperText = this.add.text(18, 42, 'Dica: a posicao correta e a ordem 1..9 da esquerda para direita.', {
      fontSize: '14px',
      color: '#cbd5e1',
    })
  }

  createPuzzleTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false })
    const palette = [
      0xef4444,
      0xf97316,
      0xeab308,
      0x22c55e,
      0x06b6d4,
      0x3b82f6,
      0x6366f1,
      0xa855f7,
      0xec4899,
    ]

    for (let i = 0; i < 9; i += 1) {
      g.clear()
      g.fillStyle(palette[i], 1)
      g.fillRect(2, 2, 80, 80)
      g.lineStyle(4, 0x0f172a, 1)
      g.strokeRect(2, 2, 80, 80)

      g.fillStyle(0xffffff, 0.18)
      g.fillRect(8, 8, 68, 16)

      g.fillStyle(0x0f172a, 0.35)
      if (i % 3 === 0) {
        g.fillCircle(42, 48, 14)
      } else if (i % 3 === 1) {
        g.fillTriangle(42, 30, 58, 62, 26, 62)
      } else {
        g.fillRect(26, 34, 32, 28)
      }

      g.generateTexture(`puzzle-piece-${i}`, 84, 84)
    }

    g.destroy()
  }

  releaseSlot(piece) {
    const slotIndex = piece.getData('slotIndex')
    if (slotIndex !== null && slotIndex !== undefined) {
      this.occupiedSlots.delete(slotIndex)
      piece.setData('slotIndex', null)
    }
  }

  findNearestFreeSlot(piece) {
    let candidate = null
    let minDistance = Number.MAX_SAFE_INTEGER

    this.targetSlots.forEach((slot) => {
      if (this.occupiedSlots.has(slot.index)) return
      const distance = Phaser.Math.Distance.Between(piece.x, piece.y, slot.x, slot.y)
      if (distance < minDistance) {
        minDistance = distance
        candidate = slot
      }
    })

    if (candidate && minDistance <= this.cellSize * 0.45) {
      return candidate
    }

    return null
  }

  snapPiece(piece) {
    const slot = this.findNearestFreeSlot(piece)

    if (slot) {
      this.occupiedSlots.set(slot.index, piece)
      piece.setData('slotIndex', slot.index)
      this.tweens.add({ targets: piece, x: slot.x, y: slot.y, duration: 150, ease: 'Sine.Out' })
    } else {
      this.tweens.add({
        targets: piece,
        x: piece.getData('homeX'),
        y: piece.getData('homeY'),
        duration: 150,
        ease: 'Sine.Out',
      })
    }

    this.time.delayedCall(170, () => this.checkSolved())
  }

  checkSolved() {
    if (this.completed) return
    if (this.occupiedSlots.size !== 9) return

    for (let i = 0; i < 9; i += 1) {
      const piece = this.occupiedSlots.get(i)
      if (!piece) return
      if (piece.getData('pieceId') !== i) return
    }

    this.completed = true
    this.statusText.setText('Quebra-cabeca completo! Bom trabalho!')
    this.statusText.setColor('#86efac')
  }
}

export function createExample09Sprites03PuzzleSceneConfig(parent) {
  return {
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    parent,
    backgroundColor: '#0f172a',
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 0 }, debug: false },
    },
    scene: [Example09Sprites03PuzzleScene],
  }
}