# 🔍 Relatório de Diagnóstico — Pong Clássico

**Repositório:** [github.com/davidcreator/Pong-Classico](https://github.com/davidcreator/Pong-Classico)
**Analista:** Desenvolvedor Sênior de Jogos 2D (React + Phaser)
**Data:** 25/09/2026
**Stack encontrada:** HTML + CSS + JavaScript puro (Canvas 2D) — *1 commit, ~1.600 linhas*

---

## 📋 Resumo Executivo

| Métrica | Resultado |
|---|---|
| Sintaxe válida | ✅ Sim (`node --check` sem erros) |
| Bugs críticos (P0) | 🔴 **5** — quebram partida ou corrompem estado |
| Bugs médios (P1) | 🟠 **8** — gameplay/UI inconsistente |
| Problemas menores (P2) | 🟡 **9** — qualidade, UX, acessibilidade |
| Docs/README | 🔴 **Inutilizável** — placeholders, estrutura e comandos errados |
| Aderência à stack da house (React + Phaser) | ❌ **0%** — projeto em JS puro, sem React, sem Phaser |

**Veredito:** o jogo *roda*, mas está longe de 100%. Há 5 falhas críticas que um jogador
de teste leva menos de 5 minutos para encontrar, além de um README que não permite
nem mesmo clonar e executar o projeto corretamente.

---

## 🔴 PROBLEMAS CRÍTICOS (P0)

### P0-1 — Vitória gera spam de `alert()` e múltiplos resets
- **Onde:** `js/script.js:974-986` (`updateScore`)
- **O que acontece:** Ao chegar a 5 pontos, um `setTimeout(100ms)` agenda `alert()` +
  `resetGame()`. Enquanto isso, **o loop continua rodando**: mais pontos podem ser
  marcados nessa janela (especialmente no modo Multi-Bola, onde 2 bolas podem sair
  **no mesmo frame** → 2 `updateScore` → 2 alertas → 2 resets encadeados).
- **Impacto:** alertas em cascata, resets duplicados, `alert()` bloqueante congela o
  jogo — experiência terrível e estado imprevisível.
- **Correção:** introduzir estado `gameOver` (parar o loop no ponto decisivo),
  **desenhar a vitória no canvas** (ou modal DOM), nunca usar `alert()` dentro do
  loop de física. Um único evento `onScored()` fora do `updateBalls()`.

### P0-2 — Modo Power-ups pode nunca spawnar nenhum power-up
- **Onde:** `js/script.js:252` (spawn inicial de 3s) + `js/script.js:343-347`
- **O que acontece:** `spawnPowerUp()` retorna **sem reagendar** quando
  `!gameRunning || gamePaused`. O timer de 3s começa ao **escolher o modo no menu**,
  mas só se clica em "Iniciar" depois. Se o jogador demorar >3s (quase sempre),
  o spawn roda com `gameRunning=false` → morre silenciosamente → **partida inteira
  sem power-ups**. Pior: **pausar o jogo uma única vez mata a cadeia de spawns
  para sempre** (mesma falha no respawn de 8-15s, linha 363).
- **Impacto:** feature central do modo 6 de 6 simplesmente não aparece.
- **Correção:** mover o spawn para o game loop (cooldown em `gameTime`/`delta`),
  ou reagendar mesmo quando indisponível, zerar o cooldown no `startGame()`.

### P0-3 — Power-up 'slow' é permanente e acumulativo (bola "morre")
- **Onde:** `js/script.js:377-381` (aplica `speedX/speedY *= 0.5`) vs `js/script.js:425-433`
  (expiração restaura **só** `speed`/`height` do jogador)
- **O que acontece:** a velocidade das bolas **nunca é restaurada**. Cada coleta
  divide por 2 de novo → 3 coletas: bola com 12,5% da velocidade → jogo ingrável.
- **Correção:** guardar `originalSpeedX/speedY` por bola (ou flag de efeito) e
  restaurar no timeout — ou aplicar o slow como modifier temporário do jogador.

### P0-4 — Obstáculos quebram em 3 frames e a bola nasce dentro de um bloco
- **Onde:** `js/script.js:481-505` (colisão com obstáculos) + `js/script.js:216-223` (init)
- **O que acontece:**
  1. **Sem resolução de penetração:** a cada frame com sobreposição, `obstacle.hits++`
     (máx. 3) → bloco destruído em ~3 frames (≈50ms) sempre que a bola encosta;
  2. A bola inicia em `(400, 200)` e o `init` gera um obstáculo em `y=200`,
     `x≈375-425` → **a bola nasce dentro do bloco** → hit instantâneo no frame 1.
- **Correção:** empurrar a bola para fora da colisão (como já faz nos paddles:
  `ball.x = ...`) e contar 1 hit **por evento de colisão** (entrada), não por frame;
  posicionar obstáculos evitando o centro exato de spawn.

### P0-5 — Timer nunca zera após reiniciar
- **Onde:** `js/script.js:931` (`resetGame` seta `gameStartTime = 0` e chama
  `updateTimer()`) vs `js/script.js:989` (condição exige `gameStartTime > 0`)
- **O que acontece:** após reset, a condição falha e o label **fica preso no valor
  antigo** ("Tempo: 1:23") até o próximo Start.
- **Correção:** fazer `updateTimer()` aceitar o estado resetado e escrever `0:00`,
  ou setar o DOM diretamente no `resetGame()`.

---

## 🟠 PROBLEMAS MÉDIOS (P1)

### P1-1 — Paddles "andam sozinhos" ao perder o foco da janela
`keydown`/`keyup` globais (`js/script.js:260-266`): se a janela perder foco com a
tecla pressionada, o `keyup` nunca dispara → `keys['w'] = true` preso para sempre.
**Correção:** `window.addEventListener('blur', () => Object.keys(keys).forEach(k => keys[k] = false))`.

### P1-2 — Setas rolam a página
Falta `e.preventDefault()` nas setas (`ArrowUp/ArrowDown`) — o canvas e a página
pulam para cima/baixo durante o jogo.
**Correção:** prevenir default apenas para as teclas do jogo.

### P1-3 — Tempo pausado conta como jogo
`pauseGame()` não ajusta `gameStartTime` ao retomar (`js/script.js:877-895`) → o
cronômetro inclui o período pausado.
**Correção:** acumular `pausedAt`/`totalPaused` e compensar ao resume.

### P1-4 — IA mira 12px abaixo do centro da bola
`js/script.js:443`: `ballCenter = targetBall.y + targetBall.radius` — mas `ball.y`
**já é o centro** (usado em `ctx.arc(x, y, radius, ...)`). Some-se o raio à toa.
A IA ainda não prevê trajetória (só segue `ball.y`), o que a torna trivial.
**Correção:** mirar em `ball.y` e, no mínimo, prever `y + speedY * frames`.

### P1-5 — Efeitos colaterais (alert/reset) dentro da física
`updateScore()` é chamado no meio de `updateBalls()` — mutating + agendamento de UI
durante a atualização de entidades é a raiz dos P0-1 e P0-5.
**Correção:** separar *eventos* (ponto, game over) do *update*; processar na fila
após a física.

### P1-6 — README não serve nem para clonar o projeto
- `git clone` aponta para **outro repositório** (`Desenvolvimento-Jogos-Web`) — `README.md:65`
- `cd 04 - Jogos/...` **quebra no shell** (espaços sem aspas) — `README.md:66`
- Placeholders não preenchidos: `[Especificar: Python, JavaScript, C#...]` — `README.md:36-37`
- Estrutura documentada (`src/`, `assets/`, `docs/`) **não existe** no repo
- Controles do Jogador 2 documentados como **↑/↓**, mas o código usa **I/K** (`README.md:32`)
- Não menciona os **6 modos**, gamepad, power-ups — o jogo real
**Correção:** reescrever com a verdade do código + instrução real
(`cd PongClassico && open index.html` ou servidor estático).

### P1-7 — Zero áudio
README promete "Efeitos sonoros" (nível intermediário) e `assets/sounds/`; o projeto
não tem um único som (bip ao quicar, placar, vitória). Para Pong, o som é meio-ambiente.
**Correção:** WebAudio API com osciladores (sem assets) ou arquivos em `assets/sounds/`.

### P1-8 — Sem tela de Game Over / vitória visual
Só existe `alert()`. O próprio README cobre "Tela inicial e de game over" como
requisito intermediário — falta a segunda.
**Correção:** overlay DOM ou desenho no canvas com botão "Jogar novamente".

---

## 🟡 PROBLEMAS MENORES (P2)

| # | Problema | Onde | Correção |
|---|---|---|---|
| P2-1 | **Flexbox clipping**: `body { align-items: center }` com conteúdo > viewport corta o topo sem conseguir rolar (bug clássico) | `css/styles.css:14` | `align-items: flex-start` + `margin: auto` no container |
| P2-2 | **Modos não acessíveis**: `.mode-card` é `<div>` — sem teclado/screen reader | `index.html:16-47` | usar `<button>` ou `role="button"` + `tabindex` + Enter/Space |
| P2-3 | **Sem controles touch** apesar do CSS responsivo — injogável em celular/tablet | `js/script.js` | drag/pointer nos paddles ou on-screen buttons |
| P2-4 | **Sem auto-pause** ao trocar de aba (`visibilitychange`) — timer/AI seguem | `js/script.js` | pausar automaticamente ao ocultar |
| P2-5 | **`resetBall` redundante**: bloco `if (ball.acceleration)` repete exatamente as 2 linhas anteriores | `js/script.js:640-654` | remover o bloco duplicado |
| P2-6 | **Ponto só conta a 50px fora da tela** (`ball.x < -50`) — bola some do quadro antes do placar reagir | `js/script.js:561-577` | marcar ao cruzar a borda (`x < 0` / `x > width`) |
| P2-7 | **Intervais globais nunca limpos** (`setInterval` de gamepad 100ms/1s) | `js/script.js:1063-1064` | inofensivo em página única, mas limpar no teardown |
| P2-8 | **Título divergente**: repo "Pong Clássico" vs `<title>` "PONG MULTI-MODALIDADES"; sem favicon | `index.html:6,11` | alinhar identidade |
| P2-9 | **Scoreboards recriados via `innerHTML`** a cada troca de modo (perde referências — funciona hoje só porque `updateScore` re-consulta o DOM) | `js/script.js:848-853` | cachear referências ou não recriar os spans |

---

## 🏗️ NOTA ESTRATÉGICA — Stack da House

A house trabalha com **React + Phaser**, o projeto é **JS puro com Canvas manual**:

- ❌ Nenhum componente React, nenhum Phaser (`Phaser.Game`, `Scene`, `ArcadePhysics`)
- ❌ Arquivo monolítico de **1.084 linhas** com globals — sem módulos, sem testes
- ❌ Física/colisão escrita à mão (reimplementa o que o Arcade Physics já faz)
- ❌ Sem bundler, sem `package.json`, sem lint

**Recomendação de rota:** manter como material didático de lógica, mas para entrega
da house, migrar para `React (shell/UI) + Phaser (cena Pong)`:
`PongScene` (física) · `Hud` React (placar/timer) · estados via FSM
(`MENU → PLAYING → PAUSED → GAME_OVER`) — o que eliminaria de imediato os P0-1,
P0-5, P1-1, P1-3 e P1-5 por construção.

---

## 🗺️ Plano de Ação Sugerido (ordem de ataque)

1. **Dia 1 — P0:** game over state (elimina alert-spam), spawn de power-ups no loop,
   reversão do `slow`, separação de colisão de obstáculos, correção do timer.
2. **Dia 2 — P1:** blur/keys, preventDefault, pausa com tempo correto, IA,
   README verdadeiro, áudio mínimo, tela de vitória.
3. **Dia 3 — P2 + acessibilidade:** flexbox, botões do menu, touch, auto-pause.
4. **Decisão de arquitetura:** aprovar migração React + Phaser para a próxima iteração.

**Critério de aceite para "100%":** os 6 modos jogáveis do início ao fim sem trava,
placar/timer corretos, vitória sem `alert`, power-ups funcionando em todas as
sessões, README clonável/executável, sem regressões de input.

---
*Análise estática completa do código-fonte (index.html, styles.css, script.js, README.md) — commit `f4a11fb`.*

---

# ✅ STATUS: REFAÇÃO CONCLUÍDA (25/09/2026)

O jogo foi reconstruído em **React + TypeScript + Phaser 4 + Zustand** no diretório
**`pong-app/`**, com todos os itens do escopo: tela inicial, menu com 6 modos,
configuração de níveis, configuração de controles (teclado + gamepad + teste ao vivo),
configuração de vidas e sistema de pontuação com ranking persistido.

## Mapa de resolução dos problemas

| Problema | Status | Como foi resolvido |
|---|---|---|
| P0-1 alert-spam/múltiplos resets | ✅ | FSM `status: running/paused/over` no store + overlay React (sem alert) |
| P0-2 spawn de power-ups morto | ✅ | Spawn por acumulador de `delta` dentro do game loop |
| P0-3 slow permanente/stacking | ✅ | Estado `slowed/slowRemaining` por bola com reversão garantida |
| P0-4 obstáculos estouravam em 3 frames | ✅ | Resolução de penetração (push-out) + 1 hit por evento |
| P0-5 timer não zerava | ✅ | Cronômetro no store, só conta jogo ativo, zera no `startMatch()` |
| P0/P1 tecla grava no blur | ✅ | Auto-pause em `visibilitychange`/`blur` |
| P1-2 setas rolavam a página | ✅ | `preventDefault` só na tela de jogo (inputs preservados) |
| P1-3 pausa contava no tempo | ✅ | Delta-time congelado enquanto `paused` |
| P1-4 IA mirava errado | ✅ | IA `chase`/`track`/`predict` por nível (sem offset de raio) |
| P1-5 efeitos colaterais na física | ✅ | Cena emite eventos → store; UI reage (1 mutador por estado) |
| P1-6 README inutilizável | ✅ | README novo: comandos reais, estrutura verdadeira, sem placeholders |
| P1-7 sem áudio | ✅ | WebAudio sintetizado (sfx.ts) — zero assets |
| P1-8 sem tela de game over | ✅ | Overlay com stats, fórmula, nome e gravação no ranking |
| P2-1 flexbox clipping | ✅ | Layout novo sem `align-items: center` no body |
| P2-2 cards inacessíveis | ✅ | `<button role="radio">` com `aria-checked` + foco/teclado |
| P2-3 sem touch | ✅ | Arrastar metade esquerda/direita do campo |
| P2-4 sem auto-pause | ✅ | Implementado (item acima) |
| P2-5..P2-9 (redundâncias, borda -50, título) | ✅ | Código reescrito; bordas limpas; identidade única "Pong Clássico" |
| Escopo novo: ranking | ✅ | Top 10 em localStorage com nome, modo, nível, data |

## Qualidade verificada

- `npm run typecheck` → **0 erros** (TypeScript strict)
- `npm run build` → **build de produção OK**
- `npm run test:store` → **10/10 asserções** (FSM, pontuação, vidas, pausa, rematch)
- `npm run test:smoke` → **fluxo completo sem erros de runtime** (title → menu → controles → partida → pausa → ranking)
- `npm run test:e2e` → **partida → game over → salvar → ranking → persistência após reload**

