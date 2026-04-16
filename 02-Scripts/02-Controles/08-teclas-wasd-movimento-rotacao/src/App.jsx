import PhaserGame from './PhaserGame.jsx'

export default function App() {
  return (
    <main className="page">
      <header className="hero">
        <p className="kicker">02 - Scripts</p>
        <h1>02 - Controles / 08 - teclas-wasd-movimento-rotacao</h1>
        <p className="subtitle">Exemplo no padrao React + Phaser com scene modular.</p>
      </header>

      <section className="game-shell" aria-label="Area do jogo">
        <PhaserGame />
      </section>
    </main>
  )
}
