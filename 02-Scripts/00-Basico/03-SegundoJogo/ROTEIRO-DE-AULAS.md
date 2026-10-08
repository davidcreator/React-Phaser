# 🗺️ Roteiro de aulas — Sargento Pixel (segundo jogo)

> **Trilha:** Meu Segundo Jogo (React + Phaser) · **Público:** de 8 a 16 anos
> **Pré-requisito:** [Meu Primeiro Jogo — aulas 1 a 12](../02-PrimeiroJogo/README.md)

Este roteiro transforma o jogo **Sargento Pixel** (estilo Metal Slug /
Contra) em uma trilha de aulas. O código final está em
`src/scenes/Jogo.js`, dividido em **ETAPEs numeradas** — cada aula
corresponde a uma (ou a um par de) etapas. A ideia é o aluno **jogar,
destrancar, modificar e se apropriar** do jogo aos poucos. 🪖

| Aula | Tema | ETAPA no código | Tempo |
|---|---|---|---|
| 1 | O mundo gigante e a câmera que segue | 1 (CREATE: mundo + câmera) | ~50 min |
| 2 | Desenhar com código (pixel art raiz) | 0 (PRELOAD: texturas) | ~50 min |
| 3 | Atirar: balas, cadência e grupos | 2 (TIRO) | ~50 min |
| 4 | Inimigos: spawn, patrulha e IA de tiro | 3 (INIMIGOS) | ~60 min |
| 5 | Dano dos dois lados + invencibilidade | 4 (DANO) | ~50 min |
| 6 | O chefão tanque + barra de vida | 5 (O CHEFÃO) | ~60 min |
| 7 | Juice: partículas, tremor, flash e sons | 6 (EFEITOS) | ~50 min |
| 8 | HUD completo + game over + vitória | 7 e 8 (HUD, FIM) | ~60 min |

> 💡 **Dica de ouro:** em cada aula, o professor abre o jogo **pronto**
> daquela etapa, joga 2 minutos, e só depois mostra o código. O aluno
> precisa **sentir** o que vai aprender antes de ver como faz!

---

## Aula 1 — O mundo gigante e a câmera que segue 🔄

**Objetivo:** entender o **scroll lateral** — a diferença entre o
primeiro jogo (tela fixa) e este (mundo de 4600 pixels).

**O que o aluno faz:**

1. Joga a versão pronta e conta: "quantas telas de largura tem o mundo?"
2. Abre o código e acha `TAMANHO_MUNDO = 4600`;
3. Experimenta: muda para `2000` (mundo menor) e para `8000` (mundo
   maior). O que acontece com o chefão?
4. Testa `startFollow(jogador, true, 0.5, 0.5)` — a câmera fica "presa";
   e `startFollow(jogador, true, 0.02, 0.02)` — fica "preguiçosa".

**Conceitos:** `setBounds` (o mundo tem fim), `startFollow` (a câmera
segue com suavização), mundo maior que a tela.

**Tarefa final:** desenhe uma **segunda fase** mudando só as constantes
(cor do céu, tamanho do mundo, velocidade do herói).

---

## Aula 2 — Desenhar com código: pixel art raiz 🎨

**Objetivo:** aprender que **sprite é só um desenho guardado na memória**
— e que dá para desenhar com código, sem arquivo de imagem!

**O que o aluno faz:**

1. Abre `desenharHeroi()` e "lê" o soldadinho quadradinho por quadradinho;
2. Muda a cor da boina (`pintar(g, '#2f9e44', ...)`) e vê o herói mudar;
3. Desenha **um acessório novo** (um cinto, uma arma diferente) só
   adicionando `pintar(...)`;
4. Entende o `if (this.textures.exists('heroi-parado')) return;` — por que
   o jogo não desenha tudo de novo ao reiniciar (R).

**Conceitos:** `make.graphics({ add: false })`, `fillStyle` + `fillRect`,
`generateTexture('nome', largura, altura)`, `textures.exists`.

**Tarefa final:** desenhe **um sprite totalmente novo** (uma crate, uma
bandeira, um cachorro) com pelo menos 10 quadradinhos e coloque no jogo.

---

## Aula 3 — Atirar: balas, cadência e grupos 🔫

**Objetivo:** o herói atira; entender **grupo de física** e **cadência**.

**O que o aluno faz:**

1. Segura Z e vê o limite: 1 tiro a cada 180 ms (`CADENCIA_TIRO`);
2. Muda `CADENCIA_TIRO` para `60` (metralhadora!) e para `600` (lento);
3. Acha `limparBalas()` — por que as balas que saem da tela são
   destruídas (senão o jogo fica lento!);
4. Vê a bala nascer virada para o lado certo (`flipX`).

**Conceitos:** `this.physics.add.group()`, `group.create(x, y, textura)`,
`body.setAllowGravity(false)`, `body.setVelocityX`, cadência com
`this.time.now`.

**Tarefa final:** faça o tiro sair com um **flash** maior e uma
**explosãozinha** quando a bala sai da tela.

---

## Aula 4 — Inimigos variados: soldado, drone voador e robô saltador 🤖🚁🦘

**Objetivo:** criar **3 tipos diferentes de inimigos** durante o jogo e dar
a cada um um comportamento (IA) exclusivo:

1. **Soldado Robô:** anda na terra e atira reto;
2. **Drone Voador:** aéreo (`allowGravity: false`), oscila com senóide,
   hélice gira e atira plasma verde angulado mirando no herói;
3. **Robô Saltador:** pernas de mola, salta alto no ar pulando por cima
   de tiros rasteiros e plataformas!

**O que o aluno faz:**

1. Joga e observa os 3 tipos nascerem em momentos diferentes;
2. Lê `tentarSpawnarInimigo()` — o sorteio percentual (40% soldado,
   35% drone, 25% saltador);
3. Lê `criarVoador()` — por que `setAllowGravity(false)` é necessário
   para um inimigo que voa;
4. Lê `criarPulador()` — como o salto usa `setVelocityY(FORCA_PULO_PULADOR)`
   com teste de `body.blocked.down`;
5. Muda a velocidade de voo e a frequência de salto dos robôs.

**Conceitos:** tipos de inimigos, `allowGravity: false` para voadores,
função seno (`Math.sin`) para ondulação orgânica, `Phaser.Math.Between`,
IA variada.

**Tarefa final:** ajuste a chance de spawn para criar uma "onda aérea"
com mais drones voadores ou uma fase "cheia de saltadores"!

---

## Aula 5 — Dano dos dois lados + invencibilidade 💥

**Objetivo:** colisões que tiram vida **dos dois lados**, e o
"tempo de invencibilidade" depois de levar tiro.

**O que o aluno faz:**

1. Joga e leva tiro: vê o knockback, o pisca-pisca e os corações sumindo;
2. Acha `levarDano()`: `vidas--`, corações, `setTint`, recuo,
   `TEMPO_INVENCIVEL = 1500`;
3. Testa tirar a invencibilidade (`TEMPO_INVENCIVEL = 0`) — o robô
   encostando tira as 3 vidas em um segundo! Por isso ela existe;
4. Vê `balasSeAnulam()` — a bala do herói aniquila a bala inimiga no ar.

**Conceitos:** `overlap` com callback, `setTint`/`clearTint`, knockback,
flag de invencibilidade, `delayedCall`.

**Tarefa final:** faça o robô **piscar vermelho** quando leva tiro e
criar uma **partícula de faísca** no lugar do impacto.

---

## Aula 6 — O chefão tanque + barra de vida 🛢️

**Objetivo:** um **chefão (boss)** no fim do mundo, com barra de vida —
e a armadilha do corpo imóvel!

**O que o aluno faz:**

1. Joga até o fim e vê o tanque chegar (tela treme, aviso pisca);
2. Lê `criarChefao()`: `setImmovable(true)` + `setAllowGravity(false)`;
3. **Experimento:** comenta a linha `setAllowGravity(false)` e vê o
   tanque **cair através do chão**! (No Arcade, dois corpos imóveis não
   se resolvem.) Volta a linha;
4. Muda `VIDA_CHEFE` (30) e `CADENCIA_TIRO_CHEFE` (950);
5. Vê a barra de vida encolhendo (`barraChefe.displayWidth = ...`).

**Conceitos:** boss, barra de progresso, `setImmovable`,
`setAllowGravity(false)`, **armadilha: imóvel + gravidade = cai!**

**Tarefa final:** desenhe uma **segunda fase de chefão** (mude as cores
do tanque para um "chefão de gelo" no alto de uma montanha).

---

## Aula 7 — Juice: partículas, tremor, flash E sons 🍋🔊

**Objetivo:** **game feel** — os exageros que deixam o jogo gostoso:
efeitos visuais **e sonoros**!

**O que o aluno faz:**

1. Joga e presta atenção: explosão de partículas, tela tremendo, flash
   amarelo, aviso piscando, números de pontos flutuando — e os sons!
   "pew" do tiro, "BOOM" do tanque, "ai!" do dano, "tá-dá-dááám" da vitória;
2. Lê `explosao()` — partículas são só sprites com tween para fora;
3. Lê `criarSons()` e `som()` — os sons são **sintetizados em código**
   (Web Audio API): um oscilador é uma "voz" que toca uma frequência;
   a explosão usa **ruído branco** filtrado + um "bum" grave;
4. Toca cada som no console: `jogo.scene.getScene('Jogo').som('tiro')`;
5. Testa `cameras.main.shake(600, 0.02)` com valores diferentes;
6. Vê a música de fundo: `tocarMusica()` toca 8 notas em loop (chiptune)
   — troca as notas do array `melodia` e ouve a música mudar;
7. Muda as cores das partículas e a frequência do tiro.

**Conceitos:** tween em grupo de objetos, `cameras.main.shake`,
`cameras.main.flash`, partículas "manuais" (sem sistema de partículas!),
**síntese de som** (oscilador, envelope, ruído, Web Audio API) e
**música de fundo em loop** (`tocarMusica()` — um chiptune de 8 notas!).

**Tarefa final:** crie um efeito novo — por exemplo, a tela pisca
**vermelho** quando o herói perde vida — e um **som novo** (mude a
frequência do `som('tiro')` até virar um laser espacial!). Se sobrar
tempo, **componha a sua música de fundo** mudando o array `melodia`. 🎶

---

## Aula 8 — HUD completo + game over + vitória 🏁

**Objetivo:** fechar o loop do jogo: HUD, vidas, pontos, game over,
vitória e reinício.

**O que o aluno faz:**

1. Lê `criarHUD()`: corações, texto de pontos, robôs derrotados, barra
   "META" (progresso no mundo) — tudo com `setScrollFactor(0)` e
   `setDepth(999/1000)`;
2. Vê a barra do chefão aparecer só quando o tanque entra em cena;
3. Joga até o game over e até a vitória; vê as telas com `depth 2000`;
4. Testa o R nas duas telas (`this.scene.restart()`).

**Conceitos:** HUD fixo (`scrollFactor(0)`), camadas (`setDepth`),
`scene.restart()`, telas de fim de jogo, flags `acabou`/`vitorioso`.

**Tarefa final (a última!):** **personalize o jogo inteiro** — novas
cores, um chefão diferente, um nome novo para o jogo — e grave um
vídeo de 30 segundos jogando. Você é game designer! 🎮🎬

---

## 📋 Visão geral dos arquivos

```
03-SegundoJogo/
├── index.html            ← versão "sem instalação" (abra e jogue!)
├── index.css             ← a página do jogo
├── lib/phaser.min.js     ← o motor do jogo (Phaser 3.90)
├── src/
│   ├── main.js           ← configuração (tela 1280x720, física, escala)
│   └── scenes/Jogo.js    ← O JOGO (9 ETAPEs, super comentado)
├── react/                ← a MESMA versão, só que com React + Vite
├── screenshot.png        ← print do jogo
├── README.md             ← este roteiro em formato de aula
├── GLOSSARIO.md          ← palavras novas, em ordem alfabética
└── ROTEIRO-DE-AULAS.md   ← este arquivo!
```

> 💡 **Para o professor:** cada aula pode virar uma pasta própria
> (copie a pasta, apague as etapas seguintes e vá liberando aos poucos),
> exatamente como nas aulas 1–12 do primeiro jogo. A etapa 0 (desenhar
> texturas) pode ser a aula 2, porque é a mais "mágica" para quem está
> começando. ✨
