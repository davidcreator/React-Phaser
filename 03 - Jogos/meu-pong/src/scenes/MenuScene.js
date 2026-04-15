import * as Phaser from 'phaser'

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu')
  }

  create() {
    const { width: W, height: H } = this.cameras.main

    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e)

    for (let y = 0; y < H; y += 30) {
      this.add.rectangle(W / 2, y + 10, 4, 18, 0x444466)
    }

    this.add
      .text(W / 2, H / 2 - 72, 'PONG', {
        fontSize: '64px',
        fontFamily: 'monospace',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    this.add
      .text(W / 2, H / 2 + 4, 'Pressione SPACE para jogar', {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)

    this.add
      .text(W / 2, H / 2 + 38, 'A controla a raquete da esquerda', {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#8f96ae',
      })
      .setOrigin(0.5)

    const space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    space.on('down', () => {
      this.scene.start('Game')
    })
  }
}
