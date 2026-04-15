import { useEffect, useRef } from 'react'
import * as Phaser from 'phaser'
import BootScene from './scenes/BootScene'
import MenuScene from './scenes/MenuScene'
import GameScene from './scenes/GameScene'

export default function PhaserGame() {
  const divRef = useRef(null)

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 500,
      parent: divRef.current,
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
      scene: [BootScene, MenuScene, GameScene],
    }

    const game = new Phaser.Game(config)

    return () => game.destroy(true)
  }, [])

  return <div ref={divRef} />
}
