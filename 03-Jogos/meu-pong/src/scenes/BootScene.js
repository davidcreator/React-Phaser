import * as Phaser from 'phaser'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  preload() {
    // Espaco reservado para preload de imagens e audios futuros.
  }

  create() {
    this.scene.start('Menu')
  }
}
