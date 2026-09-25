# Guia didático: aprendendo React + Phaser com o Breakout

Este guia usa o projeto como material de estudo para construir jogos 2D na Web. A ideia central é entender **qual parte pertence ao React**, **qual parte pertence ao Phaser** e como conectar os dois sem deixar a simulação dependente de renderizações da interface.

> Requisitos recomendados: JavaScript moderno, noções básicas de React, Node.js 20+ e familiaridade com terminal. Não é necessário conhecer Phaser antes de começar.

## 1. O modelo mental

Pense no aplicativo como duas camadas cooperando:

- **React** desenha a aplicação: menu, seleção de modo, HUD, botões, instruções e tela de resultado.
- **Phaser** desenha e atualiza o jogo: campo, bolas, barras, tijolos, colisões, partículas e tempo de simulação.
- **Callbacks** carregam informação entre as camadas. A cena envia snapshots de HUD para React; React chama métodos da cena quando o usuário aperta botões.

Regra prática: React não deve recriar a bola ou a barra em todo `render()`, e Phaser não precisa conhecer o layout completo do menu React. Cada tecnologia fica responsável pelo que faz melhor.

## 2. Prepare o projeto

Na pasta que contém `package.json`:

```bash
npm ci
npm run dev
```

Abra a URL mostrada pelo Vite. Para verificar regras e build:

```bash
npm test
npm run build
```

Não abra `index.html` por `file://`: a aplicação usa módulos ES e precisa de um servidor HTTP. Veja [Instalação e execução](./SETUP.md) se aparecer `vite: not found` ou outro erro de inicialização.

## 3. Leia o código nesta ordem

1. **`src/main.jsx`** — entrada pequena que monta React.
2. **`src/App.jsx`** — menu, modos, HUD e ações dos botões.
3. **`src/game/PhaserCanvas.jsx`** — integração e ciclo de vida da instância Phaser.
4. **`src/game/BreakoutScene.js`** — cena e simulação do jogo.
5. **`src/game/rules.js`** — configuração e regras puras, sem Phaser.
6. **`src/game/rules.test.js`** — exemplos de testes unitários para essas regras.

Leia primeiro o fluxo “menu → iniciar → jogar → voltar ao menu”; depois siga para colisões e power-ups.

## 4. Como React cria o jogo sem vazar uma instância

`App.jsx` carrega o componente Phaser quando a pessoa escolhe um modo. `PhaserCanvas.jsx` usa `useRef` para fornecer um elemento DOM e `useEffect` para criar o jogo uma vez que esse elemento existe:

```jsx
const mountRef = useRef(null);

useEffect(() => {
  if (!mountRef.current) return undefined;

  const scene = new BreakoutScene({ mode, onHud, onGameOver, onReady: onSceneReady });
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mountRef.current,
    width: WORLD.width,
    height: WORLD.height,
    scene,
  });

  return () => game.destroy(true);
}, [mode, onHud, onGameOver, onSceneReady]);
```

O trecho está reduzido para destacar o ciclo. A configuração real também define escala, física e renderização. O cleanup é essencial: ele destrói canvas, listeners e loop do jogo quando React desmonta a tela. Sem isso, voltar ao menu e iniciar novamente pode deixar uma instância antiga rodando.

**Aprendizado:** use refs para referências imperativas como uma cena Phaser; use state React para valores que precisam ser mostrados na interface. Evite instanciar `new Phaser.Game()` diretamente no corpo do componente, pois o corpo pode executar mais de uma vez.

## 5. Configuração da escala e da física

Em `PhaserCanvas.jsx`, observe estas opções:

- `Phaser.AUTO`: tenta o renderer disponível no navegador.
- `parent`: encaixa o canvas dentro do elemento criado por React.
- `WORLD.width` e `WORLD.height`: definem o mundo lógico em `900 × 640`.
- `Phaser.Scale.FIT`: ajusta o campo ao espaço sem deformar a proporção.
- `physics.default: 'arcade'`: ativa Arcade Physics.
- `gravity: { x: 0, y: 0 }`: neste jogo a bola não cai por gravidade; seu vetor de velocidade é controlado pelas regras.
- `fps: 60`: frequência alvo de simulação física; velocidades do Arcade são expressas em pixels por segundo.

O tamanho CSS do canvas não deve ser usado para calcular colisões. A lógica trabalha nas coordenadas do mundo Phaser; a escala visual converte esse mundo para a tela.

## 6. Entenda o ciclo de uma Scene

`BreakoutScene.js` estende `Phaser.Scene`. O Phaser chama os métodos principais conforme o ciclo de vida:

### `constructor`

Recebe o modo e callbacks vindos do componente React. Evite criar objetos do jogo aqui: o sistema da cena ainda está sendo preparado.

### `init(data)`

Reinicializa valores da partida: score, vidas, nível, estado de pausa e efeitos. É chamado novamente quando a cena é reiniciada.

### `create()`

Monta o mundo: limites, texturas, barras, grupos de física, tijolos, bola, colisores e controles. É o lugar principal para criar objetos persistentes da cena.

### `update(time, delta)`

É chamado continuamente enquanto a cena está ativa. O jogo consulta teclas e gamepad, move as barras, mantém a bola presa à barra antes do lançamento, confere perdas e atualiza a HUD periodicamente.

Não multiplique uma velocidade em pixels por segundo por “1 frame” sem considerar tempo. Neste projeto, movimento da barra é velocidade Arcade; a física Phaser avança seu próprio passo. Use `delta` quando implementar movimento manual em `update`.

## 7. Objetos, grupos e colisões

O jogo cria grupos diferentes para cada tipo de objeto:

- `this.bricks = this.physics.add.staticGroup()` — tijolos imóveis; Static Body é eficiente para objetos que não se movem.
- `this.balls = this.physics.add.group({ allowGravity: false })` — bolas dinâmicas; cada bola tem Arcade Body circular.
- `this.powerUps = this.physics.add.group({ allowGravity: false })` — itens que descem pela tela.

Exemplo de collider usado na cena:

```js
this.physics.add.collider(
  this.balls,
  this.bricks,
  (ball, brick) => this.handleBrickHit(ball, brick),
);
```

Um **collider** resolve a colisão física e pode chamar uma função. Um **overlap** detecta que dois corpos se sobrepõem, sem separar/ricochetear — por isso é apropriado para coletar um power-up. O tratamento do acerto do tijolo fica em `handleBrickHit`; isso separa a configuração física do efeito de gameplay.

A bola tem raio em `BALL.radius`. As barras são corpos imóveis que podem ser movidos pelo input; os tijolos usam corpos estáticos. Ao criar um objeto novo, confirme se ele precisa de física ou se é apenas visual (como os pontos de fundo).

## 8. Rebatida da bola e coordenadas

`calculatePaddleBounce()` em `rules.js` recebe a posição normalizada do impacto (de `-1`, borda esquerda, a `+1`, borda direita) e uma velocidade. Simplificando:

```js
const angle = clamp(hitOffset, -1, 1) * 0.95;
const vx = Math.sin(angle) * speed;
const vy = Math.cos(angle) * speed * direction;
```

A barra calcula `hitOffset` usando a distância entre centro da bola e centro da barra. Acertar no centro produz pouca velocidade horizontal; acertar perto da borda dá um ângulo mais inclinado. `direction` troca o sentido vertical para a barra de cima no Duelo.

As regras estão fora da Scene para serem fáceis de ler e testar. Se alterar a fórmula, rode `npm test` e teste visualmente impactos no centro e nas duas extremidades.

## 9. Comunicação da Scene com o HUD React

A Scene mantém o estado autoritativo da partida — score, vidas, nível, power-ups e placar. Em vez de tentar renderizar cada objeto pelo React, ela chama `onHud` com um objeto simples:

```js
this.onHud({
  mode: this.mode,
  score: this.score,
  lives: this.lives,
  level: this.level,
  paused: this.isPaused,
  effects: activeEffects,
});
```

React recebe isso por `receiveHud` e usa `setHud` para atualizar texto e painéis. O callback é enviado em eventos importantes e em intervalos curtos para a HUD; não é necessário disparar uma atualização React para cada partícula ou movimento da bola.

No sentido oposto, `App.jsx` mantém uma `ref` para a cena e chama métodos públicos como `launchBall()`, `togglePause()` e `restartGame()`. Isso é uma ponte imperativa pequena; mantenha-a explícita e não espalhe referências Phaser por toda a árvore React.

## 10. Entrada: teclado, gamepad e toque

`installInput()` registra as teclas e os eventos de pointer. `updatePaddleMovement()` consulta o estado atual das teclas e de `navigator.getGamepads()` a cada atualização.

A função pura `movementDirection({ left, right })` transforma entradas atuais em `-1`, `0` ou `1`. Ela não guarda o estado do frame anterior. Isso evita um erro comum: combinar `estadoAnterior || gamepadPressed`, que pode deixar o personagem andando depois de soltar o controle.

O touch usa coordenadas do pointer convertidas pelo Phaser para o mundo (`pointer.worldX`). A barra é limitada à largura do campo com `Phaser.Math.Clamp`.

## 11. Níveis, power-ups e estado

- `buildBrickLayout(level, mode)` gera dados dos tijolos. Ela não cria sprites: retorna objetos com posição, hits, pontos e chance de power-up.
- `createBricks()` transforma esses dados em sprites físicos Phaser.
- `handleBrickHit()` diminui resistência e pontua quando o tijolo é destruído.
- `advanceLevel()` aumenta nível, bônus, formação e velocidade.
- `collectPowerUp()` aplica o efeito ao detectar overlap.
- `startTimedEffect()` e `expireEffect()` controlam duração com o relógio Phaser, que pausa junto da partida.

Quando criar um efeito novo, pense em todo seu ciclo: gerar → coletar → aplicar → mostrar no HUD → expirar → limpar ao reiniciar/perder vida. Se implementar só a ativação, o estado pode ficar preso depois de uma partida.

## 12. Testar regras sem iniciar o Phaser

`rules.test.js` usa Vitest para regras que não precisam de canvas. Exemplo:

```js
it('atribui ponto de forma simétrica no multiplayer', () => {
  expect(winnerForEscape('top')).toBe('player1');
  expect(winnerForEscape('bottom')).toBe('player2');
});
```

Passe um gerador aleatório determinístico a `buildBrickLayout` nos testes. Assim a formação não muda a cada execução. As colisões, renderização e integração com o browser também precisam de QA manual; os testes unitários não substituem esse passo.

## 13. Um roteiro para adicionar uma feature

1. Escreva a regra em uma frase e defina como o jogador percebe o resultado.
2. Decida se ela pertence à UI React, à simulação Phaser ou a `rules.js`.
3. Se for regra determinística, implemente em `rules.js` e escreva um teste.
4. Se envolver objetos físicos, crie-os na Scene e configure body/grupo/collider/overlap.
5. Se a HUD precisar mostrar o estado, adicione-o ao snapshot `emitHud()` e consuma em React.
6. Planeje expiração/limpeza para efeitos temporários.
7. Rode `npm test` e `npm run build`; depois percorra o [checklist de QA](./QA-CHECKLIST.md).

## Vocabulário rápido

- **Scene:** contexto Phaser que contém o mundo e os objetos de uma tela de jogo.
- **Game Object:** item visual Phaser, como sprite, texto ou gráfico.
- **Body:** corpo físico usado pelo Arcade Physics.
- **Collider:** contato físico que separa corpos e pode gerar ricochete.
- **Overlap:** detecção de sobreposição sem resposta de separação.
- **Static Group:** grupo de corpos que não se movem, como tijolos.
- **HUD:** informações da partida exibidas para o jogador.
- **Lifecycle/cleanup:** criação e destruição de recursos quando o componente React monta ou desmonta.

## Continue praticando

Use [Exercícios práticos](./EXERCICIOS-PRATICOS.md) para evoluir o projeto em pequenos passos, preservando testes e regras de QA.