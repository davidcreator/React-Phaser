# 01 - cenario-template

Exemplo convertido para o padrao **React + Phaser**.

## Estrutura principal
- `index.html` com `#root` e carregamento de `src/main.jsx`
- `src/main.jsx` (bootstrap React)
- `src/PhaserGame.jsx` (ciclo de vida do Phaser no React)
- `js/script.js` (scene Phaser reaproveitada)

## Como executar
1. `npm install`
2. `npm run dev`

## Integracao Phaser
- A scene permanece em `js/script.js`.
- O React instancia o jogo com `new Phaser.Game(...)` em `src/PhaserGame.jsx`.
- O cleanup destroi o jogo no unmount para evitar memoria presa.
