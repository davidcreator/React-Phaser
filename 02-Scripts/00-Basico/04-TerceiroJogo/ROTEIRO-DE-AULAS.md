# 🗺️ Roteiro de aulas — Turbo Trilhas

> **Trilha:** Meu Terceiro Jogo (React + Phaser) · **Público:** 8–16 anos  
> **Pré-requisito:** primeiro jogo de plataforma e segundo jogo de ação 2D.  
> **Projeto final:** uma corrida arcade lateral com manobras, sensores de pneus, pousos seguros, dano e pontuação.

Este roteiro acompanha o jogo completo em `src/scenes/Jogo.js`. A cena está dividida em **ETAPAs numeradas** para que cada aula introduza poucas ideias de cada vez. A versão demonstrativa pode ser jogada antes de abrir o código. As fichas para previsões, registros de testes e feedback entre colegas estão em [`ATIVIDADES-DO-ALUNO.md`](ATIVIDADES-DO-ALUNO.md).

| Aula | Tema | Parte do código | Tempo |
|---:|---|---|---:|
| 1 | Mundo que corre junto | `criarCenario()` + câmera | ~50 min |
| 2 | O carro e as texturas | `ETAPA 0` + `criarCarro()` | ~50 min |
| 3 | Acelera e freia | `atualizarMotor()` | ~55 min |
| 4 | Rampas e voo | `RAMPAS`, `verificarRampa()`, `lancarDaRampa()` | ~55 min |
| 5 | Manobras e combo | `atualizarInclinacao()` + `rotacaoNoAr` | ~60 min |
| 6 | Pouso em dois pneus | `posicaoSensor()`, `verificarRodas()`, `resolverPouso()` | ~60 min |
| 7 | Obstáculos, reparos e HUD | grupos, `coletarItem()`, `receberDano()` | ~55 min |
| 8 | Chegada e jogo da turma | HUD, efeitos, fim e reinício | ~60 min |

> 💡 **Dica:** deixe a turma jogar por 2 minutos antes de mostrar qualquer código. Comece com “o que vocês acham que o jogo está verificando nesse pouso?”.

---

## Aula 1 — O mundo que corre junto 🔄

**Objetivo:** perceber que a tela é apenas uma janela para um mundo maior.

1. Jogue e conte quantas telas parecem caber na pista.
2. Localize `LARGURA_MUNDO` e os limites da câmera.
3. Compare nuvens, montanhas e colinas; veja os `setScrollFactor` `0.08`, `0.18` e `0.42`.
4. Mude um fator de cada vez e observe a sensação de profundidade.

**Conceitos:** mundo, câmera, scroll lateral, `TileSprite` e parallax.  
**Desafio:** desenhe uma nova camada distante ou experimente outra velocidade de rolagem.

## Aula 2 — O carro e as texturas 🎨

**Objetivo:** entender como o Phaser carrega um sprite e como a arte se relaciona com a colisão.

1. Abra `preload()` e encontre o arquivo `assets/sprites/carro-turbo.png`.
2. Abra o PNG e observe as áreas transparentes, janelas, pneus e contorno.
3. Localize a posição dos pneus usada por `posicaoSensor()`.
4. Compare o desenho do carro com o retângulo de colisão em `?physics`.

**Conceitos:** `load.image`, PNG com transparência, sprite, textura, ponto de origem e corpo de colisão. Rampas e itens continuam sendo desenhados em `desenharTexturas()` com `Graphics`.  
**Desafio:** personalize o PNG do carro ou desenhe uma porca nova com código.

## Aula 3 — Acelera e freia 🏎️

**Objetivo:** experimentar aceleração, velocidade e atrito.

1. Segure `D` e observe a velocidade do carro.
2. Solte a tecla: o atrito diminui a velocidade aos poucos.
3. Segure `A`: o freio atua com mais força.
4. Mude `ACELERACAO`, `ATRITO` ou `FORCA_FREIO`, um de cada vez.

**Conceitos:** teclado, velocidade, aceleração, freio e `delta`.  
**Desafio:** escolha valores que permitam atravessar a pista sem deixá-la impossível de controlar.

## Aula 4 — Rampas e voo 🚀

**Objetivo:** observar a gravidade e entender uma zona de lançamento.

1. Passe pela primeira rampa segurando `D`.
2. Encontre o objeto correspondente em `RAMPAS` e a função `lancarDaRampa()`.
3. Mude o impulso de uma rampa e compare altura e distância do salto.
4. Tente atravessar o buraco com velocidades diferentes.

**Conceitos:** gravidade, velocidade vertical, gatilho e estado `noAr`.  
**Desafio:** crie uma nova rampa de treino em uma parte segura da pista.

## Aula 5 — Manobras e combo 🔄⭐

**Objetivo:** inclinar o carro no ar e entender a pontuação pendente.

1. Use `W`/`↑` e `S`/`↓` somente durante um salto.
2. Observe `rotacaoNoAr` e tente completar uma volta.
3. Note que uma volta incompleta não dá pontos.
4. Tente pousar e veja quando os pontos aparecem.

**Conceitos:** ângulo, rotação acumulada, combo e recompensa após a ação.  
**Desafio extra:** investigar por que `normalizarAngulo()` ajuda quando o ângulo atravessa `180°` e chega a `-180°`.

## Aula 6 — Pouso em dois pneus 🛞

**Objetivo:** entender como o jogo decide se a aterrissagem foi segura.

1. Abra `?debug` para ver os dois sensores verdes.
2. Localize `posicaoSensor()`, `rodaTocandoChao()` e `resolverPouso()`.
3. Tente pousar nivelado, de lado e com velocidade alta.
4. Ajuste o ângulo seguro e a velocidade limite.

**Conceitos:** pontos virtuais, seno/cosseno (para avançados), colisão, `if/else` e uma avaliação por salto.  
**Desafio:** altere a tolerância dos sensores e explique o resultado antes de testar.

## Aula 7 — Obstáculos, reparos e HUD 🧰

**Objetivo:** usar colisões e itens para criar decisões na pista.

1. Bata numa caixa e observe a condição do carro.
2. Pegue uma porca para marcar pontos e uma caixa verde para reparar.
3. Veja `coletarItem()` e `receberDano()`.
4. Mude as posições dos itens ou crie outra caixa.

**Conceitos:** grupo, `collider`, `overlap`, coleta, dano, reparo e HUD.  
**Desafio:** invente um item com uma recompensa diferente.

## Aula 8 — Chegada e jogo da turma 🏁

**Objetivo:** fechar o ciclo completo e apresentar uma versão personalizada.

1. Complete a corrida e observe a tela de vitória.
2. Tente novamente com menos integridade ou sem combo.
3. Personalize uma rampa, obstáculo, cor ou regra de pontos.
4. Troque de dupla: uma dupla testa a pista da outra e explica um pouso.

**Conceitos:** estados de vitória e fim de jogo, reinício, feedback e playtest.  
**Desafio final:** apresentar uma corrida de 30 segundos e explicar uma decisão de design.

---

## Missão base e desafio extra

- **8–10 anos — Missão base:** trocar cores, posicionar itens, mudar valores indicados pelo professor e explicar o resultado.
- **11–13 anos — Construção:** desenhar um novo obstáculo, rampa ou reparo e balancear os pontos.
- **14–16 anos — Investigação:** estudar ângulo normalizado, sensores calculados, velocidade de impacto, combo e sensação de jogo.

Todos podem terminar a missão base; quem quiser continua no desafio extra. O objetivo é estimular experimentação, não competir para ver quem termina primeiro.

## Checklist de playtest

- O carro acelera e freia sem sair da tela imediatamente?
- Existe pelo menos uma forma de atravessar cada buraco?
- Os dois sensores aparecem no lugar dos pneus em `?debug`?
- Um pouso só pontua uma vez e só depois da aterrissagem?
- O HUD explica a condição, pontuação e progresso?
- É possível recomeçar rapidamente com `R`?
