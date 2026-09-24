# Responsividade e acessibilidade

## Objetivo

O editor precisa continuar utilizável quando a janela muda de tamanho, quando a interface é aberta em uma tela estreita ou quando o usuário aumenta a escala do texto.

## Escala visual

O botão **Aa** alterna entre:

- 100% — `ui-scale-normal`;
- 115% — `ui-scale-large`;
- 130% — `ui-scale-xlarge`.

A preferência é gravada em `localStorage` com a chave `spritelab-ui-scale`. A leitura e a escrita são protegidas por `try/catch`, portanto um navegador que bloqueie storage não impede o uso do editor.

Além da escala, `src/index.css` eleva os tamanhos que originalmente eram muito pequenos:

- `text-[8px]`;
- `text-[9px]`;
- `text-[10px]`;
- `text-[11px]`;
- `text-xs`;
- `text-sm`.

Campos de entrada e selects também possuem uma altura mínima maior para facilitar toque e baixa visão.

## Layout do workspace

No desktop, palco e sidebar ficam lado a lado a partir do breakpoint `lg`.

Em telas menores:

- o palco aparece antes da sidebar;
- o palco recebe altura mínima para o Canvas Phaser não colapsar;
- o workspace rola verticalmente;
- a sidebar possui altura própria e rolagem interna;
- as miniaturas da timeline rolam horizontalmente;
- menus de exportação e modais limitam a largura à viewport;
- o overflow horizontal é bloqueado.

## Sincronização do canvas

O Canvas Phaser não depende somente de `window.resize`. `useGame.ts` usa `ResizeObserver` no host do palco para capturar mudanças causadas por:

- cabeçalho quebrando linhas;
- alteração da sidebar;
- abertura/fechamento da timeline;
- rotação do celular;
- redimensionamento do painel de preview.

O observer chama `game.scale.resize()` com as dimensões efetivas do container. O CSS garante que o canvas ocupe `100%` da largura e da altura.

## Câmera e atores

Quando a área muda, `SpriteScene`:

- redesenha fundo, gradiente, grade e chão;
- atualiza os limites da física;
- atualiza os limites da câmera;
- mantém player e NPCs dentro da região visível.

Isso evita que o sprite fique fora do palco após uma redução de viewport.

## Foco e teclado

Elementos interativos recebem `:focus-visible` com contorno contrastante. Os controles podem ser usados por teclado e os sliders continuam disponíveis para ajuste fino.

## Redução de movimento

Quando `prefers-reduced-motion: reduce` está ativo:

- transições são reduzidas;
- animações CSS são praticamente desativadas;
- o scroll suave é removido.

Isso não desativa a simulação Phaser, pois ela é parte do preview funcional, mas reduz efeitos decorativos da interface.

## Checklist para novas telas

Ao adicionar um painel ou modal:

- use `min-w-0` em filhos de flex/grid;
- evite larguras fixas sem `max-width`;
- permita `overflow-x-auto` em tiras de frames;
- use `overflow-y-auto` em listas longas;
- teste com 320 px de largura;
- teste com 130% na escala `Aa`;
- mantenha foco visível;
- rode a build antes de finalizar.
