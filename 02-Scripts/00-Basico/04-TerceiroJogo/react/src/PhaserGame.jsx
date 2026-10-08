import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { Jogo } from './scenes/Jogo.js'

/* O React cria a página; este componente monta o Phaser dentro dela. */
export default function PhaserGame() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return undefined

    const config = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      parent: containerRef.current,
      backgroundColor: '#82d7f5',
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 1100 },
          debug: new URLSearchParams(window.location.search).has('physics'),
        },
      },
      scene: [Jogo],
    }

    const game = new Phaser.Game(config)
    window.jogo = game

    return () => {
      game.destroy(true)
      if (window.jogo === game) delete window.jogo
    }
  }, [])

  return <div ref={containerRef} className="phaser-host" />
}
