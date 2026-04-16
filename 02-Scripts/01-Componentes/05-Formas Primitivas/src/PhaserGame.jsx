import { useEffect, useRef } from 'react'
import * as Phaser from 'phaser'
import { createExample01Componentes05FormasPrimitivasSceneConfig } from '../js/script.js'

export default function PhaserGame() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return undefined

    const config = createExample01Componentes05FormasPrimitivasSceneConfig(containerRef.current)
    const game = new Phaser.Game(config)

    return () => {
      game.destroy(true)
    }
  }, [])

  return <div ref={containerRef} className="phaser-host" />
}
