import PhaserGame from './PhaserGame.jsx'

export default function App() {
  return (
    <main className="page">
      <header className="hero">
        <p className="kicker">02 — Scripts / Meu Terceiro Jogo</p>
        <h1>Turbo Trilhas: o desafio do pouso perfeito</h1>
        <p className="subtitle">
          Segure <kbd>D</kbd> ou <kbd>→</kbd> para acelerar. Freie com <kbd>A</kbd> ou <kbd>←</kbd>.
          Incline o carro no ar com <kbd>W</kbd>/<kbd>↑</kbd> e <kbd>S</kbd>/<kbd>↓</kbd>.
        </p>
      </header>
      <section className="game-shell" aria-label="Área do jogo">
        <PhaserGame />
      </section>
      <footer className="footer">Assets locais de pixel art · montanhas e nuvens em parallax · Faça manobras, pouse sobre os dois pneus e chegue à bandeira!</footer>
    </main>
  )
}
