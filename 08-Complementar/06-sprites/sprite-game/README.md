# SpriteLab

Editor visual de spritesheets e laboratório de animação para jogos web construído com **React, TypeScript, Phaser 3 e Vite**.

O projeto permite importar uma imagem, definir quadros uniformes ou retângulos independentes, criar animações, testar movimentação em tempo real e exportar dados e código para integração em jogos Phaser.

## Principais recursos

- Importação de spritesheets PNG e presets prontos.
- Leitura por grade com largura, altura, margem e espaçamento.
- Modo livre para criar, mover e redimensionar cada frame individualmente.
- Preview de frames com miniaturas e timeline.
- Play, pause, stop, scrubbing, avanço frame a frame e onion skinning.
- Animações com:
  - intervalo inicial/final;
  - ordem customizada;
  - FPS;
  - repeat;
  - yoyo;
  - mapeamento para estados do personagem.
- Eventos de gameplay por frame para scripts, som, FX e hitboxes.
- Origem, escala, rotação, alpha e flip ajustáveis por frame.
- Player Phaser com modo plataforma e top-down.
- Coyote time, jump buffer, pulo duplo, controle no ar e gamepad.
- NPCs com comportamento idle, patrol, follow e wander.
- Hitboxes, hurtboxes e áreas de colisão.
- Partículas, rastro, glow, flash, camera shake e squash/stretch.
- Sons procedurais com Web Audio.
- Exportação para projeto completo, configuração, atlas JSON e runtime Phaser.
- Interface responsiva, escalas de texto acessíveis e guia de uso adaptável.

## Requisitos

- Node.js 20.19 ou superior recomendado.
- npm.
- Navegador moderno com suporte a Canvas/WebGL e Web Audio.

## Instalação

```bash
cd 08-Complementar/06-sprites/sprite-game
npm install
```

## Desenvolvimento

Inicie o servidor Vite:

```bash
npm run dev
```

Para disponibilizar o preview em uma rede ou em um proxy externo:

```bash
npm run dev -- --host 0.0.0.0
```

O Vite exibirá a URL local e a porta utilizada, normalmente `http://localhost:5173`.

## Build e preview de produção

```bash
npm run build
npm run preview
```

A build usa `vite-plugin-singlefile`, portanto o `dist/index.html` é gerado com os recursos da aplicação embutidos quando possível. Imagens públicas usadas pelos presets continuam sendo servidas a partir de `public/` durante o desenvolvimento e a build.

## Fluxo de trabalho recomendado

1. Abra um preset em **Modelos** ou envie um spritesheet próprio.
2. Confira a divisão na seção **Leitura do Spritesheet**.
3. Se a imagem não seguir uma grade regular, ative **Editar áreas livremente**.
4. Crie uma animação na aba **Anim**.
5. Selecione os frames na grade ou informe início e fim.
6. Ajuste FPS, repeat, yoyo e, se necessário, uma ordem customizada.
7. Use a timeline para testar a animação e selecionar um frame.
8. Em **Player**, ajuste transformações gerais ou a origem do frame ativo.
9. Adicione eventos como `attack_start`, `footstep` ou `hurtbox_on`.
10. Configure estados, hitboxes, FX, som, NPCs e cena.
11. Teste no palco com teclado, gamepad e controles de preview.
12. Exporte o formato adequado para o seu jogo.

## Controles do preview

| Controle | Ação |
| --- | --- |
| `←` `→` ou `A` `D` | Mover horizontalmente |
| `↑` `↓` ou `W` `S` | Mover verticalmente no modo top-down |
| `Shift` | Correr |
| `Espaço` ou `K` | Pular |
| `J` | Ação/ataque |
| Gamepad | Analógico/D-pad para mover, A para pular e X para ação |

## Eventos para scripts

Eventos são marcadores associados a um frame de uma animação. Cada marcador possui:

- **frame**: quadro no qual o evento acontece;
- **nome**: identificador usado pelo jogo;
- **tipo**: `script`, `sound`, `hitbox` ou `fx`;
- **payload**: texto opcional para transportar um parâmetro.

Exemplo de uso no runtime exportado:

```ts
const controller = new SpriteLabController(scene, sprite);

controller.on((event) => {
  if (event.name === "attack_start") {
    playerWeapon.enable();
  }

  if (event.name === "footstep") {
    sound.play(event.payload || "step");
  }
});
```

## Exportações

| Arquivo | Uso |
| --- | --- |
| `spritelab-project.json` | Projeto completo reimportável, incluindo o spritesheet incorporado. |
| `spritelab-config.json` | Configuração sem a imagem incorporada. |
| `spritelab-atlas.json` | Atlas JSON com os retângulos reais dos frames. |
| `spritelab-runtime.json` | Manifest leve para ser colocado no projeto do jogo. |
| `SpriteLabRuntime.ts` | API Phaser para registrar atlas, criar animações, aplicar edits, ler hitboxes e receber eventos. |
| `PhaserSprite.tsx` | Componente React + Phaser gerado pelo editor. |
| Imagem PNG | Spritesheet original. |

O `SpriteLabRuntime.ts` foi pensado para projetos Phaser que carregam a imagem como asset e registram o atlas antes de criar o sprite. O manifest usa um caminho `/assets/...` como referência; ajuste esse caminho conforme a estrutura do seu jogo.

## Organização do código

```text
src/
├── App.tsx                         # Estado principal e composição da interface
├── types.ts                        # Tipos e valores padrão do projeto
├── presets.ts                      # Presets e carregamento das imagens públicas
├── audio.ts                        # Web Audio e sons procedurais
├── index.css                       # Acessibilidade e layout responsivo
├── components/
│   ├── AnimationsPanel.tsx         # Edição de animações e eventos
│   ├── FramePicker.tsx             # Grade de seleção de frames
│   ├── FrameRectEditor.tsx         # Edição livre de retângulos
│   ├── Timeline.tsx                # Preview temporal e onion skin
│   ├── HitboxPanel.tsx             # Hitboxes e hurtboxes
│   ├── NpcPanel.tsx                # Configuração de NPCs
│   ├── HelpModal.tsx               # Guia de uso
│   └── ui.tsx                      # Controles reutilizáveis
└── game/
    ├── SpriteScene.ts               # Cena Phaser e runtime do preview
    ├── useGame.ts                   # Integração React–Phaser e resize
    ├── sliceSheet.ts                # Cálculo dos retângulos dos frames
    ├── projectSchema.ts             # Normalização e migração de JSON
    └── exportProject.ts             # Exportação de projetos e runtime
```

## Documentação

- [Guia de uso](docs/GUIA-DE-USO.md)
- [Arquitetura](docs/ARQUITETURA.md)
- [Integração com Phaser](docs/INTEGRACAO-PHASER.md)
- [Formato do projeto](docs/FORMATO-PROJETO.md)
- [Responsividade e acessibilidade](docs/RESPONSIVIDADE-E-ACESSIBILIDADE.md)

## Validação local

Antes de enviar alterações:

```bash
npx tsc --noEmit
npm run build
git diff --check
```

## Observações

- O projeto mantém a imagem embutida no export de projeto completo para permitir reimportação offline.
- O `config.json` e o runtime manifest são menores e devem apontar para uma imagem distribuída pelo jogo.
- A origem global do personagem é o fallback; um override por frame tem prioridade.
- Os retângulos livres representam áreas da imagem fonte e não destroem o spritesheet original.
- O navegador pode bloquear áudio até que ocorra uma interação do usuário.
