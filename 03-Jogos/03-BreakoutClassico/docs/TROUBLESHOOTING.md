# Solução de problemas

## `vite: not found` ou `Missing script: dev`

1. Entre na pasta que contém `package.json` (raiz do projeto).
2. Instale dependências com `npm ci`.
3. Inicie com `npm run dev`.

Se estiver usando um ZIP, é esperado que `node_modules` não esteja incluído.

## Página branca, menu não aparece ou erro ao carregar módulos

- Inicie o site via `npm run dev`; não abra `index.html` por `file://`.
- Confirme que está na URL e porta mostradas pelo Vite (padrão `5173`).
- Faça recarga completa da página e veja o primeiro erro em DevTools → Console.
- Em caso de import inválido após mudança de arquivo, rode `npm run build` para receber um erro com módulo/linha.

## Menu abre, mas o campo do jogo não aparece

- Selecione um modo no menu e aguarde o módulo Phaser ser carregado (ele é lazy-loaded).
- Confirme no console se há erro de inicialização do Phaser ou de criação do canvas.
- Atualize um navegador moderno. Phaser AUTO tenta WebGL e dispõe de renderer Canvas; aceleração de hardware pode afetar desempenho.
- No celular, teste em orientação horizontal se o campo parecer pequeno; o desenho preserva proporção para caber na tela.

## Teclas não movem as barras

- Clique/toque no campo uma vez para garantir foco e lance a bola.
- No single-player use `A`/`D` ou setas. No Duelo, P1 usa `A`/`D` e P2 usa setas.
- `Espaço` lança a bola quando pronta e pausa/continua após o lançamento. `R` reinicia.
- Se uma tecla ficou presa após trocar de janela, volte o foco para o jogo ou reinicie a partida; a cena também limpa o estado de tecla no evento `blur`.

## Gamepad não funciona ou mantém uma direção

- Use um navegador com `navigator.getGamepads`; gamepad é opcional e teclado/toque continuam disponíveis.
- Conecte/ative o controle antes de testar; mova D-pad ou eixo horizontal esquerdo além do limiar.
- O controle 1 move P1; o controle 2 move P2 apenas no Duelo.
- Solte o D-pad/analógico e verifique que a barra para. Se não parar, recolha console e navegador/ID do controle para reproduzir.

## Power-up / pausa / vidas parecem inconsistentes

- Verifique se o indicador de efeito aparece no HUD; timers temporários são pausados junto com o jogo.
- A Multibola só permanece indicada enquanto há bolas extras em jogo.
- Reiniciar ou perder vida limpa os efeitos temporários e restaura a barra padrão.
- No Duelo, power-ups são intencionalmente desativados.

## Porta 5173 ocupada ou preview encerrado

- Encerre o processo antigo ou ajuste `server.port` em `vite.config.js`; `strictPort` faz o Vite falhar em vez de trocar silenciosamente de porta.
- Para ver novamente no Agent Mode, execute `npm ci` se as dependências não existirem e depois `npm run dev`; mantenha o processo ativo.

## Chromium/Playwright: `libnspr4.so` ausente

Essa mensagem indica que o sistema operacional do ambiente de automação está sem uma biblioteca necessária pelo Chromium headless. Não é um erro do runtime React/Phaser. Instale os pré-requisitos do navegador no host de CI ou execute QA manual em um navegador normal.

## Build avisa sobre chunk grande

Phaser é uma engine relativamente grande. O pacote do jogo é carregado sob demanda, depois de escolher um modo. O aviso do Rollup é sobre o tamanho bruto do chunk; confirme também o tamanho gzip no resumo do build. Não aumente o limite de aviso apenas para ocultar regressão sem medir impacto.