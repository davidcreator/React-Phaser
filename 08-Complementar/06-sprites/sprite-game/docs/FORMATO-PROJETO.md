# Formato do projeto

O arquivo de projeto completo é um JSON compatível com `ProjectConfig`. A versão atual criada por `emptyProject()` é `3.1.0`.

## Estrutura de alto nível

```ts
interface ProjectConfig {
  version: string;
  meta: SpriteSheetMeta | null;
  frameEdits: Record<string, FrameEdit>;
  character: CharacterConfig;
  animations: AnimationConfig[];
  animMapping: AnimMapping;
  hitboxes: HitboxConfig[];
  npcs: NpcInstance[];
  fx: FxConfig;
  sound: SoundConfig;
  stage: StageConfig;
}
```

## `meta`

Define a imagem e os frames:

```ts
interface SpriteSheetMeta {
  fileName: string;
  dataUrl: string;
  imageWidth: number;
  imageHeight: number;
  frameWidth: number;
  frameHeight: number;
  totalFrames: number;
  columns: number;
  rows: number;
  frameRects: FrameRect[] | null;
  marginX: number;
  marginY: number;
  spacingX: number;
  spacingY: number;
}
```

`frameRects = null` significa que a grade uniforme está ativa. Quando preenchido, cada índice usa o retângulo correspondente da lista.

```ts
interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

## `frameEdits`

As chaves são índices de frame convertidos para string:

```json
{
  "0": {
    "originX": 0.5,
    "originY": 0.75,
    "scaleX": 1,
    "scaleY": 1,
    "rotation": 0,
    "alpha": 1,
    "flipX": false,
    "flipY": false
  }
}
```

Todos os campos são opcionais no tipo TypeScript. O normalizador preenche defaults seguros ao importar dados externos.

## `animations`

```ts
interface AnimationConfig {
  id: string;
  name: string;
  startFrame: number;
  endFrame: number;
  frameRate: number;
  repeat: number;
  yoyo: boolean;
  frameOrder: number[] | null;
  color: string;
  events?: AnimationEvent[];
}
```

`repeat = -1` significa loop infinito. `frameOrder` substitui o intervalo quando possui valores.

### Eventos

```ts
interface AnimationEvent {
  id: string;
  frame: number;
  kind: "script" | "sound" | "hitbox" | "fx";
  name: string;
  payload: string;
}
```

`events` é opcional para manter compatibilidade com projetos antigos. O normalizador sempre produz uma lista para o projeto carregado.

## `animMapping`

```ts
{
  idle: string | null;
  walk: string | null;
  run: string | null;
  jump: string | null;
  fall: string | null;
  action: string | null;
  hurt: string | null;
}
```

Os valores normalmente são IDs de animação. O importador também consegue resolver referências antigas por nome.

## Hitboxes

```ts
interface HitboxConfig {
  id: string;
  name: string;
  type: "hurtbox" | "hitbox" | "collision";
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  frame: number | null;
  enabled: boolean;
}
```

`x`, `y`, `w` e `h` são relativos ao frame e ficam entre 0 e 1. `frame = null` aplica a área a todos os frames.

## Character

`character` contém valores gerais do player:

- movimento e física;
- escala, rotação, opacidade e offsets;
- origem padrão;
- flip por direção;
- tint;
- easing do squash/stretch.

A origem global é fallback. `frameEdits[frame].originX/originY` tem prioridade.

## NPCs

NPCs armazenam posição, escala, tint, animação e comportamento:

```ts
behavior: "idle" | "patrol" | "follow" | "wander";
```

## Normalização

Use `normalizeProject()` para aceitar um JSON externo com segurança:

```ts
import { normalizeProject } from "./src/game/projectSchema";

const safeProject = normalizeProject(untrustedJson);
```

O normalizador:

- remove valores inválidos;
- aplica defaults;
- limita frames ao total da imagem;
- ajusta IDs duplicados;
- resolve animações referenciadas por ID ou nome;
- mantém projetos de versões anteriores utilizáveis.

## Diferença entre os exports

### Projeto completo

Contém o `dataUrl` da imagem e pode ser importado novamente pelo SpriteLab.

### Configuração

Substitui a imagem por um placeholder e é indicado para compartilhar apenas parâmetros.

### Runtime manifest

Mantém um caminho `/assets/<arquivo>` no lugar do `dataUrl`. É indicado para o jogo final, no qual os assets são servidos separadamente.
