# Spritesheets dos veículos

Quatro spritesheets originais em **pixel art** foram criados para a frota de **Apocalypse Race: Fleeing Hell** e já estão ligados à cena Phaser. As referências enviadas orientaram a paleta de sucata, os contornos e o sombreado em blocos; as silhuetas foram desenhadas para os quatro veículos do jogo, sem copiar logotipos ou modelos identificáveis. Para cada carro há uma fonte vetorial SVG editável e uma exportação PNG transparente usada no runtime.

## Arquivos

| Veículo | PNG carregado pelo jogo | Fonte SVG editável |
|---|---|---|
| Fagulha | `public/assets/sprites/cars/fagulha.png` | `public/assets/sprites/cars/fagulha.svg` |
| Corisco | `public/assets/sprites/cars/corisco.png` | `public/assets/sprites/cars/corisco.svg` |
| Vaga-Lume | `public/assets/sprites/cars/vaga-lume.png` | `public/assets/sprites/cars/vaga-lume.svg` |
| Aurora | `public/assets/sprites/cars/aurora.png` | `public/assets/sprites/cars/aurora.svg` |

Cada folha mede **384 × 80 px**, com **4 quadros de 96 × 80 px** em uma única linha. O fundo é transparente. Os quatro veículos têm orientação lateral para a direita e escala/posição de rodas coerentes; a silhueta e a paleta refletem seus papéis. Todos incluem uma arma veicular pequena e estilizada.

## Quadros e animação

Os quadros preservam a carroceria e giram o padrão assimétrico dos cubos em incrementos de 90° (0°, 90°, 180° e 270°). A cena anima as rodas em uma cadência proporcional à velocidade, sem deslocar o corpo, combinando com a câmera lateral e a rotação do veículo no ar.

- Parado: quadro 0.
- Em movimento: a cena percorre os quadros conforme o tempo.
- Origem Phaser: `x=0.5`, `y=0.5875`, posicionada para que a base das rodas coincida com a pista; sem escala adicional.
- Largura física aproximada da carroceria: 88 px; cada quadro tem 96 × 80 px.

## Uso no jogo

`src/game/scenes/RaceScene.ts` carrega somente a folha PNG do veículo selecionado em `preload()` por meio de `this.load.spritesheet`, com `frameWidth: 96` e `frameHeight: 80`. Na corrida, o sprite recebe posição e rotação do controlador arcade; a textura usa filtro `NEAREST` para manter os pixels nítidos e as rodas animam conforme a velocidade. Se o PNG não carregar, a cena mantém o desenho vetorial anterior como fallback.

As fontes SVG não dependem de fontes ou recursos externos. `scripts/generate_car_spritesheets.py` gera novamente as quatro fontes usando Python padrão e, se ImageMagick (`magick` ou `convert`) estiver instalado, exporta PNGs compatíveis para o jogo.
