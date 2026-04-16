import { useEffect, useRef } from 'react'
import * as Phaser from 'phaser'
import { createExample02Controles03MouseEventoCliqueMoverPararSceneConfig } from '../js/script.js'

export default function PhaserGame() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return undefined

    const config = createExample02Controles03MouseEventoCliqueMoverPararSceneConfig(containerRef.current)
    const game = new Phaser.Game(config)

    return () => {
      game.destroy(true)
    }
  }, [])

  return <div ref={containerRef} className="phaser-host" />
}
