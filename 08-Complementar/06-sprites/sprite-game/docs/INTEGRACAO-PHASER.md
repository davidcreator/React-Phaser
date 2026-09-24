# Integração com Phaser

## Objetivo

O arquivo `SpriteLabRuntime.ts`, gerado pelo menu **Exportar**, é uma API pequena para levar a configuração do SpriteLab para um jogo Phaser existente.

Ele concentra:

- registro dos retângulos do atlas;
- criação das animações;
- transformações por frame;
- consulta de hitboxes;
- eventos para scripts de gameplay.

## Passo 1: copiar os arquivos

Exporte:

- `SpriteLabRuntime.ts`;
- `spritelab-runtime.json`;
- o spritesheet PNG.

Coloque-os em uma estrutura semelhante:

```text
public/
└── assets/
    └── hero.png
src/
├── game/
│   └── SpriteLabRuntime.ts
└── scenes/
    └── GameScene.ts
```

Ajuste o caminho da imagem no manifest ou no código de carregamento.

## Passo 2: carregar a imagem

O runtime trabalha com o `HTMLImageElement` já disponível no Texture Manager. Um fluxo típico é:

```ts
import Phaser from "phaser";
import {
  registerSpriteLabAtlasFromLoadedImage,
  createSpriteLabAnimations,
  SpriteLabController,
} from "../game/SpriteLabRuntime";

export class GameScene extends Phaser.Scene {
  preload() {
    this.load.image("hero-source", "/assets/hero.png");
  }

  create() {
    registerSpriteLabAtlasFromLoadedImage(this, "hero-source", "hero");
    createSpriteLabAnimations(this, "hero");

    const sprite = this.add.sprite(400, 300, "hero", "frame-0");
    const controller = new SpriteLabController(this, sprite);

    controller.setState("idle");
    controller.on((event) => {
      if (event.name === "attack_start") {
        this.startAttackWindow(event.payload);
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      controller.destroy();
    });
  }

  update() {
    // Seu script de movimento pode trocar estados:
    // controller.setState(inputX === 0 ? "idle" : "walk");
  }

  private startAttackWindow(payload: string) {
    console.log("Ataque ativo", payload);
  }
}
```

## API exportada

### `registerSpriteLabAtlas(scene, sourceImage, textureKey, project?)`

Cria um atlas Phaser com os retângulos definidos pelo SpriteLab. Use esta função quando você já possui um `HTMLImageElement` ou fonte de textura.

### `registerSpriteLabAtlasFromLoadedImage(scene, sourceKey, textureKey, project?)`

Obtém a imagem de uma textura carregada e chama o registro do atlas.

### `createSpriteLabAnimations(scene, textureKey, project?)`

Cria uma animação para cada entrada de `project.animations`. A função respeita:

- `frameOrder`;
- início e fim;
- FPS;
- repeat;
- yoyo.

### `applySpriteLabFrame(sprite, project?, frameIndex?)`

Aplica os valores base e o override do frame:

- escala X/Y;
- origem X/Y;
- rotação;
- alpha;
- flip Y.

A inversão horizontal relacionada à direção do personagem deve ser controlada pelo jogo, por exemplo com `sprite.setFlipX(direction < 0)`.

### `getSpriteLabHitboxes(project?, frameIndex?)`

Retorna somente hitboxes habilitadas e válidas para o frame informado.

```ts
const boxes = getSpriteLabHitboxes(project, controller.getFrame());
for (const box of boxes) {
  // converter x/y/w/h relativos em coordenadas do sprite
}
```

### `SpriteLabController`

Métodos principais:

```ts
controller.play("walk");
controller.setState("idle");
const frame = controller.getFrame();
const boxes = controller.getHitboxes();
const unsubscribe = controller.on((event) => console.log(event));
unsubscribe();
controller.destroy();
```

`play()` aceita o ID, o nome da animação ou um estado presente em `animMapping`.

## Eventos

Os eventos são entregues como objetos contendo os dados configurados na animação e informações de contexto:

```ts
{
  animation: "attack",
  frame: 2,
  id: "event-1",
  kind: "hitbox",
  name: "attack_start",
  payload: "sword"
}
```

Eles são úteis para:

- abrir janelas de dano;
- tocar passos sincronizados;
- criar partículas;
- ativar/desativar hurtboxes;
- iniciar sons e efeitos;
- notificar sistemas externos.

## Recomendações para produção

- Mantenha a imagem e o manifest versionados juntos.
- Use o atlas JSON exportado para inspeção ou pipelines que aceitam atlas.
- Não use o `spritelab-project.json` embutido em produção se o tamanho do `dataUrl` for grande.
- Faça preload dos assets antes de chamar `registerSpriteLabAtlasFromLoadedImage`.
- Destrua o controller ao desligar a cena para remover os listeners.
- Faça a conversão das hitboxes relativas para coordenadas do seu sistema de colisão.
- Se o jogo usa outro sistema de animação, o runtime manifest pode ser usado como fonte de dados sem importar a API Phaser.
