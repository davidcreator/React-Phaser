# Shinobi Eclipse - Player Sprite Set

Each sheet contains a 4 x 4 grid. Frames are read from left to right and top to bottom.

## shinobi-movement.png

- Frames 0-3: idle
- Frames 4-7: run
- Frames 8-11: jump
- Frames 12-15: landing and roll

## shinobi-sword-combat.png

- Frames 0-3: horizontal slash
- Frames 4-7: upward slash
- Frames 8-11: aerial slash
- Frames 12-15: heavy finisher

## shinobi-techniques.png

- Frames 0-3: shuriken throw
- Frames 4-7: shadow dash
- Frames 8-11: guard, hit and recovery
- Frames 12-15: defeat

## Runtime treatment

The game removes the light generation matte with an edge flood-fill before registering each sheet in Phaser. The resulting CanvasTexture has a transparent alpha background. If any external sheet fails to load, the built-in vector ninja keeps the mission playable.
> Pipeline, convenções e validação: veja [`docs/ASSETS.md`](../../../docs/ASSETS.md) (fonte canônica).
