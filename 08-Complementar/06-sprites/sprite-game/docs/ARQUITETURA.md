# Arquitetura

## Visão geral

O SpriteLab separa a interface React do runtime de simulação Phaser:

```text
React App
  ├── ProjectConfig (estado editável)
  ├── Painéis e controles
  ├── Timeline/preview auxiliar
  └── useGame
        └── Phaser.Game
              └── SpriteScene
                    ├── atlas temporário
                    ├── player
                    ├── NPCs
                    ├── física
                    ├── hitboxes
                    └── FX/áudio/câmera
```

O React é a fonte de verdade da configuração. O Phaser recebe mudanças por `applyConfig()` ou `rebuildFromConfig()`.

## Estado principal

`src/App.tsx` mantém:

- `config`: `ProjectConfig` atual;
- `live`: posição, velocidade, animação, FPS, frame e gamepad;
- seleção de aba, animação e frame inspecionado;
- status de loading e erro;
- escala visual da interface;
- último evento de gameplay mostrado no palco.

As funções `patchCharacter`, `patchStage`, `updateAnimation`, `patchFrameEdit`, `updateNpc` e `updateHitbox` atualizam partes isoladas do projeto sem substituir o restante da configuração.

## Integração React–Phaser

`src/game/useGame.ts` cria uma única instância de `Phaser.Game` no container React.

A configuração de escala usa `Phaser.Scale.RESIZE`. Além disso, um `ResizeObserver` acompanha o tamanho real do container. Isso é importante porque flexbox, quebra do cabeçalho, sidebar e rotação de tela podem mudar o tamanho do palco sem disparar somente um resize de janela.

Quando o tamanho muda:

1. o observer mede o container;
2. chama `game.scale.resize(width, height)`;
3. `SpriteScene` redesenha fundo, grade e chão;
4. atualiza os limites de física e câmera;
5. mantém player e NPCs dentro da área visível.

## SpriteScene

`src/game/SpriteScene.ts` é responsável pelo comportamento em tempo real:

- carregamento do spritesheet por `Image` e `dataUrl`;
- criação de atlas JSON em memória;
- criação e troca de animações;
- controle por teclado e gamepad;
- física top-down ou platformer;
- NPCs;
- hitboxes;
- partículas, trails e squash/stretch;
- câmera e decoração da cena;
- emissão de estado para a interface;
- emissão de eventos de animação.

### Atlas em memória

Mesmo no modo de grade uniforme, a cena transforma os frames em nomes estáveis:

```text
frame-0
frame-1
frame-2
...
```

Isso unifica o caminho de execução para frames uniformes e frames livres. As animações usam esses nomes e não dependem de `generateFrameNumbers` quando trabalham com o atlas.

## Frames livres e frame edits

Há duas camadas diferentes:

### `meta.frameRects`

Define onde o frame está na imagem original:

```ts
{
  x: 12,
  y: 8,
  width: 48,
  height: 64
}
```

### `frameEdits`

Define transformações sem modificar a imagem:

```ts
{
  "3": {
    "originX": 0.45,
    "originY": 0.82,
    "scaleX": 1.05,
    "scaleY": 0.98,
    "rotation": 0,
    "alpha": 1,
    "flipX": false,
    "flipY": false
  }
}
```

A origem global de `character.originX/originY` é usada quando não existe override no frame atual.

## Eventos de animação

Uma animação pode conter eventos opcionais:

```ts
{
  id: "event-1",
  frame: 2,
  kind: "script",
  name: "attack_start",
  payload: "sword"
}
```

O `SpriteScene` observa o frame atual da animação e chama `callbacks.onAnimationEvent` uma vez quando o marcador entra em cena. O marcador é reiniciado quando a animação troca ou reinicia.

## Normalização e compatibilidade

`src/game/projectSchema.ts` não confia diretamente no JSON importado. Ele:

- valida tipos primitivos;
- limita números a faixas seguras;
- corrige IDs duplicados;
- resolve referências por ID ou nome;
- preenche defaults;
- limita frames ao total existente;
- converte dados antigos para o formato atual.

Ao adicionar campos ao projeto, a normalização deve ser atualizada para preservar compatibilidade.

## Exportação

`src/game/exportProject.ts` possui duas funções distintas:

1. exportação de projeto para continuar editando no SpriteLab;
2. exportação de assets/runtime para um jogo web.

O runtime exportado usa caminhos de assets em `/assets/` e não incorpora a imagem pesada no manifest. O projeto completo, por outro lado, incorpora o `dataUrl` para permitir reimportação.

## Responsividade

A interface usa:

- root com `100dvh`;
- layout em coluna abaixo de `lg`;
- palco com altura mínima em telas estreitas;
- workspace com rolagem vertical em dispositivos pequenos;
- sidebar com rolagem interna;
- timeline com rolagem horizontal das miniaturas;
- canvas Phaser com `width: 100%` e `height: 100%`;
- `ResizeObserver` para sincronizar o runtime.

## Fluxo de atualização

```text
Controle React
   ↓
setConfig / patch
   ↓
useEffect de configuração
   ↓
scene.applyConfig(config)
   ↓
SpriteScene redesenha ou transforma objetos
```

Para trocar o spritesheet inteiro, o fluxo é diferente:

```text
Upload/preset/import
   ↓
loadSheet(newConfig)
   ↓
scene.rebuildFromConfig(newConfig)
   ↓
carrega imagem
   ↓
cria atlas
   ↓
cria animações/player/NPCs
   ↓
onReady()
```
