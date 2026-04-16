import * as Phaser from 'phaser'

export class ExampleGenericScene extends Phaser.Scene {
  constructor() {
    super('example-generic-scene')
  }

  create() {
    const { width: W, height: H } = this.cameras.main

    this.add.rectangle(W / 2, H / 2, W, H, 0x0f172a)
    this.add.text(W / 2, H / 2 - 12, 'React + Phaser', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    this.add.text(W / 2, H / 2 + 22, 'Projeto migrado em lote', {
      fontSize: '16px',
      color: '#cbd5e1',
    }).setOrigin(0.5)
  }
}

export function createExampleGenericSceneConfig(parent) {
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
    scene: [ExampleGenericScene],
  }
}
