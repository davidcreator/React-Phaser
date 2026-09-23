# Shinobi Eclipse - Enemy Sprite Set

Every file is a 4 x 4 sheet with 256 x 256 cells. Frames are read left to right, then top to bottom.

## Shared frame layout

- Frames 0-3: guarded idle
- Frames 4-7: run or walk cycle
- Frames 8-11: signature weapon attack
- Frames 12-15: hit reaction and defeat

## Enemy castes

- `crimson-kunai-ninja.png`: slim and very fast dual-kunai fighter
- `cobalt-chain-ninja.png`: medium athletic kusarigama fighter with ranged pressure
- `violet-naginata-ninja.png`: tall and thin polearm specialist with extended melee reach
- `ochre-kanabo-ninja.png`: short, heavy and highly resistant kanabo bruiser
- `onyx-elite-ninja.png`: tall armored odachi elite with the highest damage and health

At runtime the light generation matte is removed with an edge flood-fill before each image is registered as a transparent Phaser CanvasTexture. Every caste has an independent procedural fallback.