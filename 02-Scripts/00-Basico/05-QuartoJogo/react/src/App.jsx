import PhaserGame from './PhaserGame.jsx'

export default function App() {
  return (
    <main className="page">
      <header className="hero">
        <p className="kicker">02 — Scripts / Meu Quarto Jogo</p>
        <h1>Guardiões do Reator: Tower Defense de Ação 2D</h1>
        <p className="subtitle">
          Construa torres com <kbd>1</kbd>, <kbd>2</kbd> e <kbd>3</kbd>. Clique nas torres para fazer upgrades e assumir a mira manual com o mouse. Aperte <kbd>ESPAÇO</kbd> para chamar as ondas!
        </p>
      </header>
      <section className="game-shell" aria-label="Área do jogo">
        <PhaserGame />
      </section>
      <footer className="footer">
        Jogo top-down com física Arcade · Balística e dano em área · Proteja o reator cibernético!
      </footer>
    </main>
  )
}
