# Meu Pong (React + Phaser)

Projeto de releitura do jogo classico Pong, pensado para alunos nivel 0 em programacao de jogos.

## 1. O que e Pong?
Pong e um jogo de tenis de mesa em 2D:
- Existe uma bola no meio da tela.
- Cada lado tem uma raquete.
- Quando a bola passa da raquete adversaria, quem atacou marca ponto.
- Ganha quem atingir a pontuacao alvo primeiro.

Mesmo sendo simples, Pong ensina a base de quase todo jogo:
- loop de atualizacao
- entrada do jogador
- colisao
- regras de vitoria e derrota
- estado da partida

## 2. Objetivo deste projeto
Ensinar como construir um jogo do zero, de forma organizada, usando:
- `React` para montar a pagina
- `Phaser` para desenhar, animar e simular fisica

## 3. Regras implementadas no jogo
- Raquete `A` (esquerda) controlada pelo jogador (`W/S` ou setas).
- Raquete `B` (direita) controlada pela CPU.
- Placar separado: `A: X` e `B: Y`.
- A cada ponto, a bola volta para o centro e inicia nova rodada.
- Vence quem fizer `7` pontos primeiro.
- Tela final permite:
  - `SPACE`: jogar novamente
  - `ESC`: voltar ao menu

## 4. Como rodar o projeto
```bash
npm install
npm run dev
```

Build de producao:
```bash
npm run build
```

## 5. Estrutura principal de arquivos
```txt
src/
  PhaserGame.jsx
  objects/
    Ball.js
    Paddle.js
  scenes/
    BootScene.js
    MenuScene.js
    GameScene.js
src/App.jsx
```

## 6. Manual didatico: pensamento passo a passo

### Passo 1: separar responsabilidades
- `React` cuida da interface web e do container do jogo.
- `Phaser` cuida da logica do jogo em tempo real.

Em `src/PhaserGame.jsx`, o React apenas cria um `new Phaser.Game(config)` dentro de uma `div`.

### Passo 2: criar as fases (Scenes)
- `BootScene`: ponto de entrada (carregamentos futuros).
- `MenuScene`: tela inicial.
- `GameScene`: partida acontecendo.

Isso ensina que jogo nao e um bloco unico; ele e dividido em estados.

### Passo 3: criar os objetos do jogo
- `Paddle.js`: classe da raquete (subir, descer, parar, resetar).
- `Ball.js`: classe da bola (lancar, resetar, fisica).

Aqui o aluno aprende encapsulamento: cada objeto cuida do proprio comportamento.

### Passo 4: desenhar arena e UI basica
No `GameScene`:
- fundo
- linha central
- placar `A` e `B`
- mensagem central de rodada e fim de jogo

Esse passo mostra como separar logica de jogo e feedback visual.

### Passo 5: adicionar controles e IA
- Jogador: `W/S` ou setas.
- CPU: segue a bola no eixo Y com uma zona de tolerancia.

Conceito: oponente de IA pode ser simples no inicio e melhorar depois.

### Passo 6: colisao da bola com raquetes
Ao colidir:
- a velocidade aumenta um pouco (jogo fica mais desafiador)
- o angulo muda conforme o ponto de contato na raquete

Ideia didatica:
- bateu no centro da raquete -> trajetoria mais reta
- bateu nas pontas -> trajetoria mais inclinada

### Passo 7: evitar bola travada/alinhada
Foram aplicadas 3 protecoes:
- velocidade vertical minima (evita bola ficar quase reta para sempre)
- pequeno fator aleatorio no angulo (quebra repeticao perfeita)
- reposicionamento apos colisao (evita bola "grudar" na raquete)

Tambem liberamos saida lateral da bola para que o ponto seja contado corretamente.

### Passo 8: regra de pontuacao e fim de partida
- Se a bola sai pela esquerda, ponto para `B`.
- Se a bola sai pela direita, ponto para `A`.
- Ao marcar ponto:
  - atualiza placar
  - pausa rodada
  - reinicia no centro
- Ao chegar em 7:
  - encerra partida
  - mostra vencedor e comandos de reinicio/menu

Conceito importante: usar variaveis de estado (`roundActive`, `matchEnded`) evita bugs.

## 7. Onde cada conceito aparece no codigo
- Criacao do Phaser no React: `src/PhaserGame.jsx`
- Logica principal da partida: `src/scenes/GameScene.js`
- Comportamento da bola: `src/objects/Ball.js`
- Comportamento da raquete: `src/objects/Paddle.js`

## 8. Exercicios para alunos (proximos passos)
1. Transformar o jogo em 2 jogadores locais (`A` e `B` humanos).
2. Adicionar efeito sonoro de batida e de ponto.
3. Criar niveis de dificuldade da CPU.
4. Trocar "primeiro a 7" por "melhor de 3 sets".
5. Mostrar velocidade atual da bola na tela para estudar fisica.

## 9. Resumo pedagogico
Com esse projeto, o aluno pratica:
- leitura de estado de jogo
- tomada de decisao por frame (`update`)
- eventos de colisao
- organizacao de codigo em classes e cenas

Com essa base, fica muito mais facil evoluir para jogos mais complexos.
