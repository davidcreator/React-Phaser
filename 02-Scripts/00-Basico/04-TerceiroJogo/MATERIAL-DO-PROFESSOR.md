# 🧑‍🏫 Material do educador — Turbo Trilhas

Este material acompanha o [roteiro de aulas](ROTEIRO-DE-AULAS.md), o [caderno de missões do aluno](ATIVIDADES-DO-ALUNO.md) e a cena final em `src/scenes/Jogo.js`.

## Ritmo recomendado para cada encontro

- **2–3 min:** jogar sem olhar o código; perguntar “o que vocês acham que faz esse salto dar certo?”.
- **5 min:** nomear uma ideia nova, sem apresentar todas as APIs de uma vez.
- **20–25 min:** localizar a ETAPA do dia e experimentar uma alteração pequena.
- **10–15 min:** resolver a tarefa em dupla ou construir uma variante.
- **5 min:** jogar de novo, comparar e explicar uma decisão.

Não é necessário que todos leiam cada linha. Para crianças mais novas, o educador pode destacar a constante ou função do encontro e deixar o restante como “motor do jogo”.

## Mapa entre aulas e código

| Aula | Onde começar em `Jogo.js` | Pergunta para investigação |
|---:|---|---|
| 1 | `criarCenario()` + câmera | Por que as montanhas (`0.18`) parecem se mover mais devagar que as colinas (`0.42`)? |
| 2 | `preload()`, PNG do carro e `ETAPA 0 — ASSETS` | O que é imagem carregada e o que continua desenhado com `Graphics`? |
| 3 | `atualizarMotor()` e constantes do começo do arquivo | Qual valor faz o carro acelerar mais depressa? |
| 4 | `RAMPAS`, `verificarRampa()` e `lancarDaRampa()` | O que acontece se o impulso for maior ou se o carro estiver mais lento? |
| 5 | `atualizarInclinacao()` e `rotacaoNoAr` | Por que girar no ar ainda não garante pontos? |
| 6 | `posicaoSensor()`, `verificarRodas()` e `resolverPouso()` | Que evidências o jogo usa para chamar um pouso de seguro? |
| 7 | `criarObstaculosEItens()`, `coletarItem()` e `receberDano()` | Como o jogo responde a uma batida e a um reparo? |
| 8 | `criarHUD()`, `atualizarHUD()` e `finalizarJogo()` | Como o jogador descobre que venceu, perdeu ou melhorou sua pontuação? |

## Sugestões de resposta e investigação

### “Por que o carro não pode usar somente o collider para checar os pneus?”

No Arcade Physics, a imagem pode girar, mas o corpo retangular de colisão não acompanha essa rotação como um carro real. O projeto usa dois pontos calculados a partir do desenho: um para cada pneu. `posicaoSensor()` gira os pontos ao redor do centro; `rodaTocandoChao()` compara cada ponto com os segmentos da pista.

### “Por que a manobra só recebe pontos ao pousar?”

Isso impede que a pessoa segure uma tecla e ganhe pontos sem risco. Além disso, liga causa e consequência: a pessoa escolhe quanto girar, ajusta o carro e só então descobre o resultado do salto.

### “Como o combo cresce?”

Um pouso seguro aumenta `combo`. A cada dois pousos seguros, o multiplicador sobe, até `x3`. Um pouso ruim zera o combo. Peça à turma para alterar a regra e comparar se a corrida fica mais divertida ou mais fácil demais.

### “Por que guardamos a velocidade do impacto antes de pousar?”

Quando o corpo Arcade colide com a pista, o motor pode zerar ou alterar a velocidade vertical. `ultimaVelocidadeDescendo` guarda a maior velocidade para baixo observada durante o salto e é usada na avaliação do impacto.

## Testes rápidos para fazer com a turma

1. Mudar `ANGULO_POUSO_SEGURO` de `25` para `35` e testar pousos inclinados.
2. Reduzir `VELOCIDADE_POUSO_SEGURA` e observar como o carro reage a quedas mais altas.
3. Aumentar `IMPULSO_MANOBRA` e tentar fazer uma volta completa.
4. Desativar temporariamente um sensor em `verificarRodas()` e observar a diferença.
5. Alterar uma posição em `TRECHOS_PISTA` ou `RAMPAS` e explicar como isso muda o percurso.

Peça para alterar **um parâmetro por vez**, anotar a previsão e só então testar. A previsão transforma “mexer nos números” em investigação.

## Problemas comuns

- **O jogo abre em branco:** confirme que `index.html`, `lib/phaser.min.js`, `src/scenes/Jogo.js` e `src/main.js` estão nas pastas esperadas; veja o Console do navegador (F12).
- **Os pneus verdes não aparecem:** use `index.html?debug`; a cena só os mostra nesse modo.
- **As caixas da física não aparecem:** use `index.html?physics`.
- **O carro bate numa caixa repetidamente:** `proximoDanoObstaculo` aplica uma pausa curta entre danos; mantenha essa proteção.
- **Um pouso parece injusto:** confira os sensores em modo `?debug`, depois ajuste `ANGULO_POUSO_SEGURO`, `VELOCIDADE_POUSO_SEGURA` ou a tolerância em `rodaTocandoChao()`.
- **A manobra não pontua:** confirme que os dois pneus foram reconhecidos e que o carro estava suficientemente nivelado e lento.
- **A fase ficou difícil para iniciantes:** reduza a velocidade dos obstáculos, aumente os reparos ou teste o modo de treino como desafio de extensão.

## Avaliação formativa

Valorize o processo, não apenas a pontuação final. Uma dupla pode demonstrar aprendizagem ao:

- explicar uma regra do jogo com suas próprias palavras;
- prever o que uma constante mudará;
- personalizar a pista, a arte ou os pontos;
- testar e corrigir uma falha com o Console;
- mostrar uma manobra e justificar por que o pouso foi seguro ou não.

## Rubrica rápida de acompanhamento

Use a rubrica durante a experimentação ou na apresentação final. Ela avalia o processo de design e investigação — não a pontuação mais alta nem quem termina primeiro. As fichas correspondentes estão em [`ATIVIDADES-DO-ALUNO.md`](ATIVIDADES-DO-ALUNO.md).

| Critério | 1 — com apoio | 2 — em desenvolvimento | 3 — consistente | 4 — amplia a investigação |
|---|---|---|---|---|
| **Previsão e teste** | Faz o teste depois de uma orientação direta. | Registra uma previsão simples com ajuda. | Prevê o efeito e testa uma variável de cada vez. | Propõe uma comparação justa e identifica o que precisa manter constante. |
| **Uso de evidências** | Conta o que aconteceu, sem apontar um exemplo. | Aponta uma mudança observada no jogo. | Usa HUD, sensores ou valores do código para justificar a conclusão. | Compara resultados e revê uma hipótese com base nas evidências. |
| **Iteração e depuração** | Precisa de ajuda para localizar o ponto de mudança. | Faz uma alteração indicada e consegue testá-la. | Faz, testa e corrige uma mudança própria. | Encontra uma falha, testa possíveis causas e explica a correção. |
| **Comunicação e colaboração** | Compartilha o dispositivo ou a ideia com lembretes. | Escuta e apresenta uma parte do trabalho. | Dá feedback respeitoso e explica uma decisão de design. | Usa o feedback de outra pessoa para planejar a próxima versão. |

**Saída rápida (2 minutos):** peça que cada estudante complete no caderno: “Eu previa ___; observei ___; agora eu mudaria ___.” Essa resposta ajuda a separar um palpite de uma conclusão baseada em teste.

## Adaptações por idade e experiência

- **8–10 anos:** fornecer o código-base, destacar constantes, usar desafios visuais e deixar a função dos sensores pronta.
- **11–13 anos:** pedir para criar uma rampa, item ou obstáculo e ajustar uma regra de pontuação.
- **14–16 anos:** investigar normalização de ângulo, acumulação de rotação, colisão corpo-versus-sprite e balanceamento do combo.

Dê opção de “missão base” e “desafio extra”; alunos mais rápidos podem expandir sem fazer quem está começando sentir que ficou para trás.
