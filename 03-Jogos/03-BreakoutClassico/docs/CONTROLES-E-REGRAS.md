# Controles e regras

## Modos

### Clássico

- Começa com três vidas.
- Destrua todos os 80 blocos para avançar de nível.
- O score é concedido quando um bloco é destruído; blocos resistentes exigem mais acertos.
- Completar um nível concede bônus de `nível × 100` pontos.
- A cada três níveis, recebe uma vida adicional.
- O power-up de vida extra também pode conceder uma vida.

### Sobrevivência

- Começa com uma vida e não recebe a vida bônus automática de nível do modo Clássico.
- Os níveis continuam indefinidamente; a resistência dos blocos e a velocidade de lançamento aumentam progressivamente.
- O power-up de vida extra pode aumentar as chances de continuar.

### Duelo local

- Dois jogadores usam barras em lados opostos; a partida é local, no mesmo dispositivo.
- Jogador 1 fica na parte inferior e Jogador 2 na superior.
- Quando a bola sai pelo topo, o Jogador 1 marca; quando sai por baixo, o Jogador 2 marca.
- O primeiro a alcançar cinco pontos vence.
- Os power-ups aleatórios são desativados neste modo para preservar o equilíbrio. Os blocos continuam no campo.

## Teclado

| Ação | Clássico / Sobrevivência | Duelo local |
|---|---|---|
| Mover barra inferior / Jogador 1 | `A`/`D` ou `←`/`→` | `A`/`D` |
| Mover barra superior / Jogador 2 | — | `←`/`→` |
| Lançar bola | `Espaço` ou clique/toque no campo | `Espaço` ou clique/toque no campo |
| Pausar/continuar após lançar | `Espaço` | `Espaço` |
| Reiniciar a partida | `R` | `R` |

Antes do primeiro lançamento, Espaço, clique ou toque lançam a bola. Depois, Espaço alterna pausa/continuação. O botão de controle na interface também pode ser usado.

## Toque e gamepad

- **Touch/mouse:** toque/clique move a barra para a posição indicada; arraste para continuar movendo. O primeiro toque/clique também lança a bola quando ela está pronta.
- **Gamepad:** D-pad ou eixo horizontal esquerdo (limiar de aproximadamente 0,35). O primeiro controle move Jogador 1; o segundo pode controlar Jogador 2 no Duelo.
- A leitura do gamepad é recalculada a cada atualização. Se o controle desconectar ou a API não estiver disponível, teclado e toque continuam disponíveis.

## Regras técnicas atuais

- Campo lógico: `900 × 640`; a escala preserva a proporção do campo.
- Formação padrão: 10 colunas × 8 linhas (80 blocos), com 1–4 pontos de resistência.
- Blocos destruídos concedem 50, 70, 90 ou 120 pontos conforme o tipo.
- Fora do Duelo, cada bloco tem 14% de chance de gerar um power-up.
- Velocidade nominal de lançamento: 360 px/s, aumentando 18 px/s por nível, até 570 px/s.
- Efeitos temporários usam o relógio da cena e deixam de avançar enquanto o jogo está pausado.