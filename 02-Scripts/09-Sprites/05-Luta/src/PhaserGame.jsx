import { useEffect, useRef } from 'react'
import * as Phaser from 'phaser'
import { createExample09Sprites05LutaSceneConfig } from '../js/script.js'

export default function PhaserGame() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return undefined

    const config = createExample09Sprites05LutaSceneConfig(containerRef.current)
    const game = new Phaser.Game(config)

    return () => {
      game.destroy(true)
    }
  }, [])

  return <div ref={containerRef} className="phaser-host" />
}