# Arquitetura

## Visão geral

A aplicação separa a interface React da simulação Phaser. React cuida de telas, HUD, menus, controles de interface e resultados; Phaser cuida do campo, física e atualização dos objetos do jogo.

```text
index.html
└── src/main.jsx
    └── src/App.jsx                 UI, modos e HUD
        └── lazy PhaserCanvas.jsx    cria/destrói Phaser.Game
            └── BreakoutScene.js    física, input e progressão
                └── rules.js        regras puras e testáveis
```

## Responsabilidades

- **`src/main.jsx`**: monta a aplicação React no elemento `#root`.
- **`src/App.jsx`**: menu, seleção de modo, HUD, painel de power-ups e tela de resultado. Carrega a parte do Phaser sob demanda ao entrar no jogo.
- **`src/game/PhaserCanvas.jsx`**: cria uma instância de `Phaser.Game` dentro do componente e chama `game.destroy(true)` no cleanup do React. O canvas não deve ser criado fora desse ciclo de vida.
- **`src/game/BreakoutScene.js`**: cena principal; configura Arcade Physics, tijolos, bolas, barras, power-ups, input, vidas, score e progressão.
- **`src/game/rules.js`**: constantes e funções sem dependência do Phaser, incluindo formação de blocos, cálculo de rebatida, direção e vidas iniciais.
- **`src/game/rules.test.js`**: testes unitários das regras puras com Vitest.

## Ciclo de vida

1. React seleciona o modo e monta `PhaserCanvas`.
2. Phaser inicializa a cena e cria os grupos físicos e os colisores.
3. A cena envia snapshots de HUD por `onHud` e resultados finais por `onGameOver`.
4. Pausa suspende o mundo físico e o relógio da cena, sem manter timers de power-up correndo em segundo plano.
5. Reiniciar reinicializa a cena; retornar ao menu desmonta o componente e destrói a instância Phaser.

## Física, escala e input

- O Arcade Physics resolve colisões circulares da bola com tijolos e barras.
- Limites do mundo são configurados conforme o modo: o topo rebate no single-player e pode ser uma saída de ponto no Duelo; o fundo é tratado como perda/saída.
- Velocidade de barra e bola é expressa em pixels por segundo; a simulação do Arcade Physics usa passo de física configurado em 60 Hz.
- `Phaser.Scale.FIT` preserva a proporção lógica `900 × 640` em diferentes larguras.
- Teclado, estado atual do gamepad e pointer/touch são combinados sem guardar estados antigos de gamepad.

## Regras de extensão

- Ao adicionar controles, mantenha as entradas em `updatePaddleMovement()` e não misture estado do gamepad com o estado das teclas.
- Ao adicionar um power-up temporário, use o relógio e os eventos Phaser (`this.time`) e implemente tanto ativação quanto expiração/reset.
- Ao adicionar uma regra simples e determinística, prefira `rules.js` e um teste em `rules.test.js`.
- Ao adicionar cena/tela, verifique cleanup de listeners, timers e instâncias Phaser.