# Tilesets ambientais por fase

Foram criados quatro atlas de ambiente, um para cada fase. Cada atlas tem **48 tiles de 32 × 32 px** organizados em **8 colunas × 6 linhas** (256 × 192 px no total). Os IDs semânticos mantêm a mesma ordem entre as fases; cores, materiais e marcos de cenário mudam para cada região.

## Arquivos e edição

Cada pasta contém os mesmos quatro artefatos:

- `tileset.png` — atlas transparente carregado pelo Phaser.
- `tileset.svg` — fonte vetorial editável, uma célula por tile.
- `tileset.tsx` — definição de tileset externo compatível com o editor **Tiled**; abre/importa o atlas e inclui os nomes e as categorias.
- `tileset.json` — manifesto com IDs, nomes, dimensões e categorias, útil para outras ferramentas.

| Fase | Pasta |
|---|---|
| Posto 7 | `public/assets/tilesets/stages/posto-7/` |
| Viaduto Caído | `public/assets/tilesets/stages/viaduto-caido/` |
| Pátio de Sucata | `public/assets/tilesets/stages/patio-sucata/` |
| Saída do Anel | `public/assets/tilesets/stages/saida-anel/` |

### Como editar

1. Para montar/posicionar tiles, abra o `tileset.tsx` da fase no Tiled e use a imagem `tileset.png` referenciada ao lado.
2. Para alterar o desenho dos tiles, edite o `tileset.svg` num editor vetorial e regenere o PNG com `npm run assets:tilesets` (requer Python 3 e ImageMagick). O comando preserva as edições SVG/TSX/JSON existentes; use `npm run assets:tilesets -- --force` somente para recriá-las dos templates Python.
3. A ordem dos 48 IDs é compartilhada entre os quatro atlas. Ao adicionar/reordenar IDs, atualize os manifestos e o registro `src/game/tilesets/registry.ts`.

O primeiro grupo inclui pavimento, terra, brita, concreto e texturas de superfície; os grupos seguintes oferecem barreiras, pilares, rampas, objetos de estrada, suprimentos, marcos regionais, vegetação e rochas. As folhas foram desenhadas sem marcas/logotipos de terceiros.

## Uso no jogo

`src/game/tilesets/registry.ts` concentra os caminhos, tamanho dos quadros e IDs de marcos usados no plano de fundo em parallax. `RaceScene` carrega somente o atlas da fase selecionada e usa filtro `NEAREST`; a geometria física da pista continua na simulação atual, independente da arte do tileset. Assim é possível trocar o cenário sem alterar o controlador. O `.tsx` descreve o atlas para edição; ele não é um mapa `.tmx` completo da fase.

## Gerador

A fonte dos quatro atlas é `scripts/generate_stage_tilesets.py`. O script gera SVG, PNG, TSX e JSON juntos para evitar divergências entre o desenho e a definição de edição.
