# 🧪 Caderno de missões — Turbo Trilhas

**Nome:** ____________________________________  **Turma:** ______________  **Data:** ______________

Use estas fichas junto com o [roteiro de aulas](ROTEIRO-DE-AULAS.md). Em cada missão, faça uma previsão antes de mexer no jogo, teste **uma mudança por vez** e registre o que observou. Não é preciso terminar todas as missões extras.

## Como escolher o desafio

- **Missão base (8–10 anos):** observar, desenhar, marcar opções e mudar um valor indicado pelo educador.
- **Missão construtor (11–13 anos):** alterar um valor ou objeto e explicar a diferença.
- **Missão investigador (14–16 anos):** identificar a regra no código, controlar as variáveis e justificar a conclusão com evidências.

---

## 1. Um mundo com profundidade 🌄

**Missão:** descobrir por que algumas camadas parecem mais distantes que outras.

1. Jogue por um minuto e observe o céu, as nuvens, as montanhas, as colinas e a pista.
2. Antes de abrir o código, escreva sua previsão: qual camada parece mover-se mais devagar? ______________________________
3. Encontre os valores de `setScrollFactor` em `criarCenario()` e compare com a pista.

| Camada | Valor encontrado | Mais lenta ou mais rápida que a pista? |
|---|---:|---|
| Nuvens |  |  |
| Montanhas |  |  |
| Colinas |  |  |
| Pista |  |  |

**Concluí que:** ______________________________________________________________________________________

**Missão extra:** escolha um fator entre `0.08` e `0.42`. Descreva uma camada que ficaria nessa profundidade: ______________________________

---

## 2. O desenho e a colisão 🎨

**Missão:** separar o que é aparência do que é física.

1. Encontre `assets/sprites/carro-turbo.png` e observe o fundo transparente, as rodas e o contorno.
2. Abra `?physics` no jogo para ver o corpo de colisão. Compare a caixa com o desenho.
3. A cena define o corpo com `setSize(128, 50, true)`. O PNG mede 144 × 72 pixels.

| O que observei | Minha resposta |
|---|---|
| Uma diferença entre a arte e o corpo de colisão |  |
| Por que a arte precisa ser maior que a caixa? |  |
| Que detalhe eu personalizaria no carro? |  |

**Missão base:** desenhe uma nova pintura do carro no quadro ou no papel.  
**Missão construtor:** personalize o PNG mantendo 144 × 72 pixels e a transparência.  
**Missão investigador:** proponha novos valores para `setSize()` e preveja qual colisão ficará mais justa.

---

## 3. Acelerar, frear e comparar 🏎️

**Missão:** investigar como uma mudança altera o controle.

Escolha **uma** constante: `ACELERACAO`, `FORCA_FREIO`, `ATRITO` ou `VELOCIDADE_MAXIMA`.

| Etapa | Registro |
|---|---|
| Valor original |  |
| Minha previsão antes de testar |  |
| Valor novo (mude só este) |  |
| O que aconteceu ao acelerar/frear? |  |
| Minha conclusão |  |

**Importante:** mantenha as outras constantes iguais durante o primeiro teste. Assim fica mais fácil descobrir qual mudança causou o resultado.

**Missão extra:** volte ao valor original, escolha outra constante e compare. Qual combinação ficou mais fácil de controlar? ______________________________

---

## 4. Rampas e voo 🚀

**Missão:** atravessar um buraco e perceber o papel da velocidade e do impulso.

1. Faça uma tentativa sem mudar o código. Registre se o carro alcançou o outro lado.
2. Localize uma entrada de `RAMPAS` e encontre o `impulso` usado no lançamento.
3. Mude apenas o impulso de uma rampa, teste de novo e compare.

| Tentativa | Velocidade antes da rampa | Impulso | Atravessou o buraco? | Altura/distância do salto |
|---|---|---:|---|---|
| Original |  |  |  |  |
| Alterada |  |  |  |  |

**O que eu faria para aumentar a distância do salto?** ______________________________________________________________

**Missão extra:** crie uma rampa de treino em um trecho seguro. Desenhe onde ela fica e explique como alguém pode testá-la.

---

## 5. Manobras e combo 🔄⭐

**Missão:** descobrir quando uma manobra vira pontuação.

1. Faça um salto sem girar; depois tente meia volta e uma volta completa.
2. Use `W`/`↑` e `S`/`↓` para inclinar no ar.
3. Observe a pontuação só depois do pouso e acompanhe o combo em pousos seguros consecutivos.

| Tentativa | Rotação aproximada | Pousou em segurança? | O que mudou na pontuação/combo? |
|---|---:|---|---|
| 1 |  |  |  |
| 2 |  |  |  |
| 3 |  |  |  |

**Regra que descobri:** __________________________________________________________________________________

**Missão base:** desenhe a sequência “saltar → manobrar → pousar → pontuar”.  
**Missão investigador:** explique por que manter uma tecla pressionada não deve dar pontos automaticamente.

---

## 6. O que torna um pouso seguro? 🛞

**Missão:** usar evidências para prever o resultado de uma aterrissagem.

O jogo avalia os dois pneus, o ângulo do carro e a velocidade vertical do impacto. Os valores de referência ficam nas constantes `ANGULO_POUSO_SEGURO` e `VELOCIDADE_POUSO_SEGURA`. Use `?debug` para enxergar os sensores.

| Situação | Dois pneus detectados? | Ângulo dentro do limite? | Impacto dentro do limite? | Minha previsão |
|---|---|---|---|---|
| Carro nivelado e queda suave |  |  |  |  |
| Carro inclinado de lado |  |  |  |  |
| Queda rápida |  |  |  |  |

**Depois de testar, uma previsão que confirmei ou corrigi foi:** _________________________________________________

**Missão extra:** altere apenas `ANGULO_POUSO_SEGURO`. Explique como a mudança torna a regra mais fácil ou mais difícil.

---

## 7. Obstáculos, reparos e escolhas de design 🧰

**Missão:** observar como obstáculos e itens mudam a estratégia.

1. Passe por uma caixa e observe a integridade.
2. Colete um item de reparo. Note que a recuperação não ultrapassa 100%.
3. Compare o risco de desviar do obstáculo com a recompensa de buscar um item.

| Evento | Integridade antes | Integridade depois | Pontos/efeito observado |
|---|---:|---:|---|
| Caixa/obstáculo |  |  |  |
| Reparo |  |  |  |

**Desenhe um item novo:**

```text



```

**Nome do item:** __________________________  **Efeito:** __________________________________________

**Missão investigador:** sua criação deixa a pista mais divertida sem torná-la fácil demais? Que teste ajudaria a decidir?

---

## 8. Minha versão Turbo Trilhas 🏁

**Missão:** preparar uma mudança pequena, testável e divertida.

**Nome da minha versão:** ______________________________________________________

**Uma mudança que fiz (arte, pista, obstáculo, controle ou regra):**

________________________________________________________________________________

**Minha previsão antes do playtest:**

________________________________________________________________________________

**Resultado observado por mim ou por outra dupla:**

________________________________________________________________________________

**Feedback de quem testou — duas estrelas e um desejo:**

- ⭐ Algo que funcionou bem: __________________________________________________________________
- ⭐ Outro ponto forte: ________________________________________________________________________
- 💡 Uma sugestão para a próxima versão: ______________________________________________________

**A mudança que eu faria a seguir:** _________________________________________________________________

---

## Bilhete de saída

Complete antes de encerrar:

- Hoje descobri que ____________________________________________________________________________.
- Uma coisa que testei com evidências foi ________________________________________________________.
- Ainda quero entender ________________________________________________________________________.

Consulte o [glossário](GLOSSARIO.md) quando encontrar uma palavra nova. O objetivo é explicar suas escolhas e aprender com os testes — não apenas chegar primeiro à bandeira.
