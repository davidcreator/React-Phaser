# 📖 Glossário — Sargento Pixel (segundo jogo)

> Consulte esta página sempre que esbarrar numa palavra estranha.
> As palavras estão em **ordem alfabética**, com o termo em inglês entre
> parênteses (é o nome que você vai ver na documentação e nos tutoriais).

* * *

## A

**add (adicionar)** — `this.add.image()`, `this.add.sprite()`, `this.add.text()`:
tudo o que aparece no jogo começa com `this.add`.
👉 _"adicione na cena"_.

**alpha** — Transparência de um objeto. Vai de `0` (invisível) a `1` (opaco).

**animação manual** — Trocar a textura de um sprite com um timer
(do jogo), igual um flipbook desenhado à mão.
Nosso jogo usa isso em vez de spritesheet!

**array / lista** — Uma coleção ordenada de valores: `this.inimigos.getChildren()`.
Acesse os itens com `.forEach()` (percorre) e `.length` / `countActive()` (conta).

**assets** — A pasta onde ficam as imagens e os sons do jogo (`assets/`).
O jogo vem com **27 sprites PNG reais** (cenário, herói, inimigos, chefão e efeitos)! 🖼️

**axis/eixo X, Y** — No Phaser: **X cresce para a direita**, **Y cresce para
baixo**. 🚨 O Y ao contrário é a maior pegadinha para quem está começando!

* * *

## B

**bala (bullet)** — Um sprite que nasce, voa com velocidade e morre
(quando acerta ou sai da tela). `this.balas.create(x, y, 'bala')`.

**blocked (bloqueado)** — `body.blocked.down` responde _"tem algo me segurando
por baixo?"_. É o nosso teste de "estou no chão?".

**body (corpo)** — O corpo físico invisível de um objeto: uma caixa que sofre
gravidade e colide. O desenho é o que se vê; o **body** é o que o jogo usa
para calcular toques. Criado com `this.physics.add.existing(objeto)`.

**boss (chefão)** — O inimigo grandão e difícil do fim da fase.
No nosso jogo é um **tanque** com 30 de vida! 🛢️

* * *

## C

**câmera (camera)** — A "lente" que filma o mundo. Com `startFollow(heroi)`,
a lente anda junto com o herói — é o **scroll lateral**! 🎥

**cadência (fire rate)** — O tempo mínimo entre um tiro e outro
(`CADENCIA_TIRO = 180` ms). Segurar o botão não vira tiro infinito! ⏱️

**callback** — Uma função que _outra_ parte do sistema chama para você
(ex.: a função chamada pelo `overlap` quando dois objetos se tocam).

**camada (layer)** — Ordem de desenho: quem é desenhado depois fica na frente.
Também pode ser ajustada com `setDepth(número)`.

**colisão (collision)** — O contato entre dois corpos físicos.

**collider** — `physics.add.collider(A, B)`: **impede** que A e B se
atravessem (o chão segura o herói, o herói não atravessa o tanque).

**constante** — Um valor com nome que não muda:
`const VEL_BALA = 950;`. Deixa o código compreensível e fácil de ajustar.

**create()** — As três fases de toda cena: ... este aqui é o 2º:
**monta** a cena (coloca os objetos no lugar). Roda uma vez, no início.

**cena (scene)** — Uma "tela" do jogo: o menu, a fase 1, a tela de game over.
Nossa cena se chama `'Jogo'`.

* * *

## D

**delayedCall** — `this.time.delayedCall(1500, () => {...})`: "daqui a
1,5 segundo, faça isso". Usado para invencibilidade, telas de vitória...

**destroy()** — Remove um objeto do jogo definitivamente (libera memória).

**depth (profundidade)** — Camada do objeto. `setDepth(1000)` = bem na frente
(usado no HUD); `setDepth(2000)` = telas de game over/vitória.

**drone voador** — Inimigo aéreo (`voador-1`/`voador-2`): voa sem gravidade,
oscila suavemente com senóide e atira plasma verde angulado. 🚁

**duplo salto / pulo** — Ver robô saltador.

* * *

## E

**ease (suavização)** — Como um movimento acelera e desacelera nos tweens:
`'Linear'`, `'Sine.inOut'`, `'Bounce.out'`...

**envelope** — Como o **volume** de um som nasce e morre:
`gain.setValueAtTime(ganho, agora)` + `exponentialRampToValueAtTime(0.001, ...)`.
É o que transforma um "bipe" reto num "pew!" que morre rápido. 🎚️

**escala (scale)** — Tamanho do desenho. `setScale(1.5)` = 1,5 vez maior.

**evento (event)** — Um aviso de que algo aconteceu. Ex.:
`keyboard.on('keydown-R', ...)` = "quando a tecla R for apertada...".

* * *

## F

**flag (bandeira)** — Uma variável `true/false` que "lembra" um estado:
`this.acabou`, `this.vitorioso`, `this.invencivel`. Simples e poderosa!

**flipX** — Espelha o desenho na horizontal: `sprite.setFlipX(true)`
vira o herói para a esquerda (e a bala nasce do lado certo!).

**física (physics)** — O sistema que simula gravidade, velocidade e choques.
No nosso jogo usamos o motor **Arcade**.

**FPS** — _Frames por segundo_: quantas vezes o jogo se atualiza por segundo.
O normal é por volta de 60.

**frame (quadro)** — Um dos desenhos de uma animação.

* * *

## G

**game feel / juice** — A **sensação** de jogar: tremor de tela, partículas,
flash, recuo, **sons**... Os exageros que dejan o jogo gostoso. 🍋

**generateTexture** — Guarda um desenho feito com `graphics` na memória do
jogo, com um apelido: `g.generateTexture('heroi-parado', 48, 64)`.
Depois é só `this.add.sprite(x, y, 'heroi-parado')`! 💾🎨

**graphics** — Um "papel em branco" para desenhar com código:
`this.make.graphics({ add: false })` + `fillRect(x, y, w, h)`.
É o nosso pincel de pixel art!

**grupo (group)** — Uma coleção de sprites que o Phaser gerencia junto:
`this.physics.add.group()` — cria, conta (`countActive()`), percorre
(`getChildren()`) e destrói tudo de uma vez.

**gravidade (gravity)** — Força que puxa tudo para baixo. Fica na
configuração do jogo: `gravity: { y: 1500 }`.

* * *

## H

**HUD** — _Heads-Up Display_: as informações fixas na tela (vidas, pontos,
barra de progresso). É a "ponte" entre o jogo e o jogador.

* * *

## I

**IA (inteligência artificial)** — O "cérebro" simples dos inimigos:
andar para um lado, atirar quando o herói chega perto...
Nem precisa ser esperta — precisa ser **justa**! 🤖

**immovable (imóvel)** — Um corpo que outros corpos não conseguem empurrar:
`body.setImmovable(true)`. ⚠️ **Nunca combine com gravidade** — dois corpos
imóveis não se resolvem e o objeto atravessa o chão!

**input (entrada)** — Tudo o que o jogador faz: teclado, mouse, toque, gamepad.

**invencibilidade** — Um tempo em que o herói não pode levar dano de novo
(depois de levar um tiro, fica piscando 1,5 s). `TEMPO_INVENCIVEL`.

* * *

## K

**key (tecla / chave)** — Tem dois sentidos!

1. Tecla do teclado (`this.cursors.space`);
2. **Nome** que você dá para uma textura, animação ou som
(`'heroi-parado'`). 👈 é o sentido mais comum aqui.

* * *

## M

**método (method)** — Uma "receita" com nome que pertence à cena:
`this.criarInimigo(x)`. Também chamado de **função**.

**música de fundo (background music)** — Uma melodia em loop durante o jogo.
A nossa é um "chiptune" de 8 notas feita com osciladores, tocada por um
timer — começa na 1ª tecla e para no game over. Veja `tocarMusica()`. 🎶

* * *

## N

**nota musical** — Uma frequência tocando por um tempinho. A vitória toca
**Dó-Mi-Sol** (523, 659 e 784 Hz) e o game over, 3 notas descendo! 🎵
👉 _"som é só onda sonora"_ — igual uma flauta!

* * *

## O

**origin (origem)** — O ponto de encaixe do desenho:
`(0, 0)` = canto superior esquerdo · `(0.5, 0.5)` = centro (padrão) ·
**`(0.5, 1)` = base** (nosso truque para os pés ficarem no chão!).

**oscilador (oscillator)** — A "voz" da Web Audio API que gera uma onda
sonora numa certa frequência: `ctx.createOscillator()`. Tipos: `sine`
(redonda), `square` (apito), `sawtooth` (áspera, tipo laser). 🎛️

**overlap** — `physics.add.overlap(A, B, função)`: detecta o toque **sem**
**impedir** a passagem, e chama a sua função (callback). Usado para dano
e pontos.

* * *

## P

**parallax** — Ilusão de profundidade: o que está longe se move devagar, o
que está perto se move rápido. É o `setScrollFactor`! 🌄

**pixel art** — Estilo de desenho com pixels grandes e visíveis. Usamos
`pixelArt: true` para os desenhos não ficarem borrados — e neste jogo,
desenhamos os pixels com `fillRect`! 🖌️

**preload()** — 1ª fase de toda cena: **carrega** as imagens e sons antes do
jogo começar. (Neste jogo, "carregar" é desenhar com código!)

* * *

## R

**repeat** — Quantas vezes uma animação ou timer repete.

**restart** — `this.scene.restart()`: reinicia a cena do zero.

**robô saltador** — Inimigo com pernas de mola zigzag (`pulador-1`,
`pulador-2`, `pulador-pulando`). Salta alto no ar pulando tiros e plataformas! 🦘

**ruído (noise)** — Som aleatório, o "chiado" de uma TV fora do ar.
É a base das nossas explosões: `Math.random() * 2 - 1` dentro de um
buffer de áudio, passando por um filtro! 📻💥

**run and gun** — O gênero de jogo de tiro em 2D onde o personagem **corre,
pula e atira**: Metal Slug, Contra... 🏃‍♂️💨 É o nosso jogo!

* * *

## S

**scroll lateral** — A câmera anda para o lado acompanhando o herói;
o mundo é gigante (4600 px!). É o truque dos jogos de tiro em 2D. 🔄

**scrollFactor** — Quanto um objeto anda junto com a câmera:
`setScrollFactor(0)` = grudado na tela (HUD) · `0.35` = longe (montanha) ·
`1` = normal (chão, herói).

**setOrigin / setSize / setOffset / setFlipX** — Ajustes do sprite:
ponto de encaixe · tamanho da caixa de colisão · posição dessa caixa ·
espelhar (virar) o desenho.

**som (sound)** — Efeito sonoro. Neste jogo, todos são **sintetizados em
código** (Web Audio API) — sem arquivo de áudio nenhum! 🔊
Veja `criarSons()` e `som()` na ETAPA 6: tiro "pew", explosão de ruído,
vitória com 3 notas...

**spawn** — "Nascer": criar um inimigo **durante** o jogo, com um timer
(`this.time.addEvent({ delay: 2200, loop: true })`). 🐣

**sprite** — O desenho de um objeto do jogo que pode ter vários quadros.

**static (estático)** — Corpo físico que **não** se move sozinho: não sofre
gravidade. O chão e as plataformas são estáticos
(`physics.add.existing(corpo, true)`).

* * *

## T

**textura (texture)** — Um desenho guardado na memória do jogo.
Você se refere a ela pelo "apelido" (ex.: `'bala'`, `'chefao-1'`).
Neste jogo as texturas são **desenhadas com código** (`generateTexture`)!

**timer** — Um relógio do jogo: `this.time.addEvent({ delay, loop, callback })`.
Roda uma função depois de um tempo (ou toda hora, se `loop: true`).

**tween** — Animação calculada entre dois valores (A → B), com duração e
suavização: `this.tweens.add({ targets, y, duration, yoyo, repeat })`.

* * *

## U

**UI** — _User Interface_: a parte visual com que o jogador interage (HUD,
textos, telas).

**update()** — 3ª fase de toda cena: roda **~60 vezes por segundo**. É aqui
que as coisas se movem (o "cérebro" do jogo).

**UX** — _User Experience_: como é **jogar**. É claro? É justo? É gostoso?

* * *

## V

**velocidade (velocity)** — Quantos pixels o objeto anda por segundo, com
direção (sinal): `body.setVelocityX(950)` = 950 px/s para a direita;
`setVelocityX(-430)` = para a esquerda. ⚠️ No `body`, não no sprite!

* * *

## W

**Web Audio API** — A biblioteca do navegador para **criar som em código**
(sem arquivo de áudio): osciladores, ruído, filtros, ganho... É assim que
o jogo faz "pew!" e "boom!" do zero! 🔊🎛️ (Veja `criarSons()` e `som()`)

* * *

## 🔗 Truques para memorizar

| Pergunta | Resposta |
| --- | --- |
| As 3 fases de uma cena? | **preload → create → update** (carrega → monta → atualiza) |
| Onde fica o (0, 0)? | No **canto superior esquerdo**. X↗, Y↘ |
| Como faço os pés ficarem no chão? | `setOrigin(0.5, 1)` |
| Como pergunto "estou no chão?" | `this.jogador.body.blocked.down` |
| Por que o pulo é negativo? | Porque Y cresce para **baixo**. Ir para cima = número negativo |
| Diferença de collider e overlap? | **collider** barra a passagem; **overlap** só avisa |
| Como faço a câmera seguir o herói? | `cameras.main.startFollow(heroi, true, 0.1, 0.05)` |
| Como faço o HUD não andar com a câmera? | `setScrollFactor(0)` em tudo do HUD |
| Como desenho uma imagem com código? | `make.graphics` + `fillRect` + `generateTexture('nome', w, h)` |
| Como faço som sem arquivo de áudio? | **Web Audio**: osciladores + ruído (veja `criarSons()` e `som()`) |
| Como faço música de fundo? | Um array de notas + timer em loop (veja `tocarMusica()`) |
| Por que o som não toca no começo? | O navegador só destrava o áudio depois da **1ª tecla/clique** |
| Como deixo um corpo "imóvel"? | `body.setImmovable(true)` — **e tire a gravidade dele!** |
| Qual a ordem dos argumentos no overlap grupo×sprite? | **(sprite, membro do grupo)** — ex.: `(chefao, bala)` |
| Como limito a velocidade do tiro? | Cadência com `this.time.now` (relógio do jogo) |
| Como sei que meu código deu erro? | Aperte **F12** e olhe o **Console** |
