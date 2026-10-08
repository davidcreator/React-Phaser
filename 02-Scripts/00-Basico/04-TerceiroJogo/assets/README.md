# 🎨 Assets do Turbo Trilhas

Os assets visuais desta pasta foram preparados para a versão 2D lateral do jogo. O Phaser carrega o carro e os tilesets em `preload()`; rampas, caixas, porcas, reparos e bandeira continuam sendo desenhados com `Graphics`.

| Arquivo | Tamanho | Uso |
|---|---:|---|
| `sprites/carro-turbo.png` | 144 × 72 px | Sprite transparente do carro, apontado para a direita. A rotação durante as manobras é feita pelo Phaser. |
| `parallax/montanhas-longe.png` | 1280 × 448 px | Camada distante de montanhas com transparência. As duas metades formam um padrão horizontal que se repete sem emenda evidente. |
| `tiles/pista-solo.png` | 1024 × 256 px | Tile repetível com asfalto, marcações amarelas e terra. |

## Parallax

Em `src/scenes/Jogo.js`, as camadas usam velocidades diferentes:

- céu: cor de fundo fixa;
- nuvens: `setScrollFactor(0.08)`;
- montanhas: `setScrollFactor(0.18, 0.35)`;
- colinas verdes feitas com `Graphics`: `setScrollFactor(0.42, 0.8)`;
- pista: acompanha o mundo, sem fator reduzido.

Quanto menor o primeiro número de `setScrollFactor`, mais devagar a camada se move quando a câmera acompanha o carro. Esse é o truque que cria a sensação de profundidade.

## Trocar ou personalizar a arte

1. Substitua um PNG mantendo o mesmo caminho e proporção; ou
2. mude o caminho/chave em `preload()` e também na versão React, se o jogo usar um nome diferente.

Na versão React + Vite, os mesmos PNGs também ficam copiados em `react/public/assets/`, pois o servidor do Vite publica os arquivos dessa pasta. `pixelArt: true` mantém os pixels nítidos.
