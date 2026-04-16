import PhaserGame from './PhaserGame.jsx'

export default function App() {
  return (
    <main className="page">
      <header className="hero">
        <p className="kicker">02-Scripts | 09-Sprites</p>
        <h1>05-Luta | Combate com Sprites</h1>
        <p className="subtitle">Modelo com dois lutadores em sprite, ataque, dano e barra de vida.</p>
      </header>

      <section className="game-shell" aria-label="Area do jogo">
        <PhaserGame />
      </section>
    </main>
  )
}