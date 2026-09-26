# Spritesheets dos monstros

A pasta `public/assets/sprites/monsters/` reúne os quatro monstros usados nas fases. Cada PNG é uma folha transparente de **256 × 64 px**, com quatro quadros de **64 × 64 px** para o ciclo de caminhada; junto há um SVG vetorial editável por criatura e `manifest.json` com o mapeamento para o tipo do jogo.

| Tipo no jogo | Nome | PNG de runtime | Fonte editável |
|---|---|---|---|
| `walker` | Errante | `public/assets/sprites/monsters/errante.png` | `public/assets/sprites/monsters/errante.svg` |
| `runner` | Corredor | `public/assets/sprites/monsters/corredor.png` | `public/assets/sprites/monsters/corredor.svg` |
| `leaper` | Saltador | `public/assets/sprites/monsters/saltador.png` | `public/assets/sprites/monsters/saltador.svg` |
| `armored` | Blindado | `public/assets/sprites/monsters/blindado.png` | `public/assets/sprites/monsters/blindado.svg` |

A direção é pixel art original, com criaturas fantásticas, expressões legíveis e sem ferimentos, sangue ou gore. Os quadros mantêm as silhuetas e alternam braços/pernas; a cadência de cada tipo é configurada separadamente em `src/game/monsters/registry.ts`.

## Integração e edição

`RaceScene` carrega as quatro folhas, aplica filtro `NEAREST` e cria uma instância visual por criatura ativa. O movimento, a colisão, o dano, a resistência e a pontuação continuam usando os dados existentes do jogo. A barra de resistência e a sombra são desenhadas em camadas Phaser separadas. Se uma folha faltar, a cena mantém um fallback vetorial não gráfico.

Edite cada fonte SVG e regenere os PNGs com `npm run assets:monsters` (requer Python 3 e ImageMagick); o comando preserva os SVGs existentes. Para recriar as fontes a partir dos templates Python, use `npm run assets:monsters -- --force`. As dimensões e os caminhos de runtime são mantidos em `src/game/monsters/registry.ts`; altere esse registro se mudar tamanho, nome ou quantidade de quadros.
