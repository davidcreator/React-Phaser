import PhaserGame from './PhaserGame.jsx'

export default function App() {
  return (
    <main className="page">
      <header className="hero">
        <p className="kicker">02-Scripts | 09-Sprites</p>
        <h1>03-Puzzle | Drag and Drop de Sprites</h1>
        <p className="subtitle">Modelo com pecas em sprite, arrastar e encaixe em grade de puzzle.</p>
      </header>

      <section className="game-shell" aria-label="Area do jogo">
        <PhaserGame />
      </section>
    </main>
  )
}