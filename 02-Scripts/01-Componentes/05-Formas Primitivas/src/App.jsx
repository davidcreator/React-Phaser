import PhaserGame from './PhaserGame.jsx'

export default function App() {
  return (
    <main className="page">
      <header className="hero">
        <p className="kicker">02 - Scripts</p>
        <h1>01 - Componentes / 05 - Formas Primitivas</h1>
        <p className="subtitle">Exemplo no padrao React + Phaser com scene modular.</p>
      </header>

      <section className="game-shell" aria-label="Area do jogo">
        <PhaserGame />
      </section>
    </main>
  )
}
