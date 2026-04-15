# 🧩 Guia de Sprites e Tilesets para React + Phaser

## Conceitos
- **Sprite**: imagem de personagem/objeto.
- **Tileset**: conjunto de peças para montar cenários.

## Fontes de assets
- itch.io: https://itch.io/game-assets
- OpenGameArt: https://opengameart.org
- Kenney: https://kenney.nl/assets

## Formatos recomendados
- PNG: transparência e sprites
- JPG: fundos
- WAV/OGG: áudio

## Organização no projeto
```txt
public/assets/
  sprites/
  tilesets/
  audio/
```

## Exemplo de preload no Phaser
```js
this.load.image('player', '/assets/sprites/player.png')
this.load.image('tiles', '/assets/tilesets/forest.png')
```

## ✅ Boas práticas
- Escala visual consistente
- Estilo artístico coerente
- Licença verificada
- Créditos dos autores registrados
