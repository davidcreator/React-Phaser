import PhaserGame from './PhaserGame.jsx'

export default function App() {
  return (
    <main className="page">
      <header className="hero">
        <p className="kicker">02-Scripts | 09-Sprites</p>
        <h1>02-RPG | Sprite Movement + Animacao</h1>
        <p className="subtitle">Modelo com personagem em sprite, animacao de caminhada e colisao no mapa.</p>
      </header>

      <section className="game-shell" aria-label="Area do jogo">
        <PhaserGame />
      </section>
    </main>
  )
}