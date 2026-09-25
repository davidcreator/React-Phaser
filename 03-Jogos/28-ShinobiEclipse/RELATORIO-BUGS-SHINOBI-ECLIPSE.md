# 🔎 AUDITORIA TÉCNICA — SHINOBI ECLIPSE
### React 19 + Phaser 4 + Vite 7 · Relatório de QA/Sênior · 24/09/2026

**Veredito em uma linha:** o jogo é **jogável e cheio de acerto de conceito**, mas **não está 100%**: encontrei **4 bugs críticos (P0)** confirmados em teste automatizado real, ~10 problemas de gameplay/pipeline (P1) e uma lista de dívidas técnicas e de repositório (P2).

**Metodologia:** clone do repositório, `tsc --noEmit`, `vite build`, e **playtest automatizado com Playwright/Chromium** (bot que joga, instrumentation via hooks temporários já removidos — o projeto foi restaurado ao estado original). Todas as conclusões de gameplay abaixo foram **reproduzidas em runtime**, não são apenas leitura de código.

---

## ✅ O que está CERTO (vale preservar)

| Ponto | Detalhe |
|---|---|
| Arquitetura React ↔ Phaser | Comunicação via `EventTarget` (`gameCommands`) + callbacks tipados. Limpa, desacoplada, idiomática. |
| TypeScript | `tsc --noEmit` passa **sem nenhum erro** com `strict: true`. |
| Fallback procedural | Se o asset detalhado falha, o jogo desenha ninjas vetoriais e continua 100% jogável. Excelente decisão. |
| Game feel | Coyote time (120ms), jump buffer (140ms), hit-stop, knockback, screen shake, flash de dano. Quem escreveu entende de plataforma. |
| UI/UX | Menu, opções persistidas em `localStorage` com merge defensivo, guia, HUD responsivo, `prefers-reduced-motion`, 21 atributos ARIA. |
| Áudio | Web Audio API sintetizado, sem dependência externa, com unlock de autoplay correto. |
| Loop completo | Vida extra a cada 20 abates ✓, transição de fase ✓, vitória ✓, game over ✓, restart ✓ — todos validados em teste. |

---

## 🔴 P0 — BUGS CRÍTICOS (bloqueiam o "100%")

### 1. Softlock na caixa de madeira da Área 01 (x≈574–600)
**Reproduzido 2× em runs independentes.** Um bot andando para a direita ficou **empurrado contra a caixa** (obstáculo estático de 44×64 em x=600) — em um dos testes por **mais de 3 minutos**, com o level nunca terminando (3 alvos vivos, timer de 180s estourado). No segundo teste o player ficou `grounded:false`, preso na quina por ~9s **perdendo 44 HP** para o inimigo que batia nas costas.

**Causa raiz:** obstáculo estreito + corpo do player de ~28px + **knockback de dano empurra o player para dentro da geometria**; não há lógica de "unstuck" nem simplificação de colisor. É a receita clássica de softlock em Arcade Physics.

**Correção sugerida:**
- Aumentar largura da caixa ou virar decoração sem collider lateral (só `checkCollision.down = true`);
- Adicionar detecção de "empurrado contra parede por >1s" → reposiciona suavemente;
- Reduzir knockback X de 250 para ~180 e dar prioridade à separação vertical.

### 2. Inimigos se matam sozinhos nos fossos (patrulha sem edge detection)
**Reproduzido:** com o player **parado por 2 minutos**, **2 dos 8 inimigos morreram sozinhos** (o crimson de x=1330 caiu no fosso de 32px e o ochre de x=2080 no fosso de 95px). O kill conta para o jogador (`kills++`), corrompe a meta "20 alvos", entrega progresso e vida extra de graça e pode truncar a fase sem combate.

**Causa raiz:** em `updateEnemies` o patrol anda com `setVelocityX` e **só inverte em `homeX ± 105`** — não há raycast/verificação de chão à frente.

**Correção sugerida:** antes de aplicar velocidade de patrol, checar `body.blocked.down`; se não houver chão à frente (ou raycast `this.physics.world.intersectBody` com uma sonda nos pés), inverter direção.

### 3. `setPointerCapture` lança exceção não tratada nos controles virtuais
**Erro capturado em runtime:** `Failed to execute 'setPointerCapture' on 'Element': No active pointer with the given id is found.` no `onPointerDown` dos botões touch (`GameControls`). Além do crash do handler: **se o capture falha, o `pointerup` correspondente pode não chegar** → o personagem fica andando para sempre em uma direção (input "preso"). Falta também `onLostPointerCapture`/`onPointerLeave`.

**Correção sugerida:**
```tsx
onPointerDown: (e) => {
  e.preventDefault();
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer já solto */ }
  dispatchGameAction(action, true);
},
onLostPointerCapture: () => dispatchGameAction(action, false),
onPointerCancel: () => dispatchGameAction(action, false),
```

### 4. Troca de textura + hitbox NO MEIO da partida
**Medido em runtime:** 700ms após `create()`, o loader de sprites detalhados troca o player de textura — corpo físico muda de **29×55 → 27.9×59.2** e o sprite salta de **64px → 106px de altura** no meio do combate, sem transição. Além do "pop" visual, se o corpo crescer com o player encostado em parede/caixa ele pode nascer colidindo dentro da geometria (mesmo mecanismo do bug #1). Em conexão lenta (8 PNGs de ~2MB = **14MB**), a troca acontece dezenas de segundos depois, no pior momento possível.

**Correção sugerida:** carregar os sheets **antes** do `create()` (via `this.load` na `preload()` ou na tela de loading do React) e só então iniciar a cena; ou, mínimo, aplicar o upgrade apenas entre "batidas" (player `grounded`, nenhum inimigo em `attackingUntil`), com fade de 150ms.

---

## 🟠 P1 — GAMEPLAY & PIPELINE DE ASSETS

### 5. Spritesheets não são game-ready: frames desalinhados
Análise pixel a pixel do `shinobi-movement.png`: o **centro de massa do personagem desliza ~56px entre frames de idle** (185 → 166 → 147 → 129). Resultado: a animação "patina" no lugar. As sheets são arte gerada por IA recortada num grid 4×4 arbitrário, com **xadrez falso pintado nos pixels** (RGB sem alpha, `mode: RGB`) — o jogo precisa de um flood-fill em runtime (BFS de ~1,5M pixels na main thread) só para fabricar transparência.

**Correção:** reexportar os PNGs **com alpha real, grid consistente e baseline comum** (pés no mesmo y em todos os frames). Enquanto isso, manter o fallback procedural (que está visualmente coeso).

### 6. Inimigo não volta ao posto após aggro e cola no player
O crimson spawnado em x=480 perseguiu o player até x=77 (canto do mapa) e ficou ali eternamente — o patrol usa `homeX`, mas o estado de chase nunca expira nem tem leash. Combina mal com respawn de checkpoint: o player renasce e o inimigo já está na cara dele.

**Correção:** leash de aggro (ex.: `distance > 640 || dy > 220` → volta a patrulhar).

### 7. Meta do HUD mente: "ABATES 00/20" mas o jogo tem 32 inimigos
Área 01 tem 8 alvos e Área 02 tem 12 — o HUD, o modal de vitória ("20 alvos eliminados") e o menu ("Vinte alvos") fixam 20. Jogador conclusivo fica confuso ao terminar com "25/20". A vida extra por `kills % 20` também cruza fases, então o número não fecha com nenhuma narrativa da UI.

**Correção:** meta total real (32) ou meta por fase (8/12), replicada em HUD, menu, guia e modal.

### 8. Watchdog de boot pode destruir e recriar o jogo em conexão lenta
`GameViewport` recria o `Phaser.Game` inteiro se o `ready` não chegar em **3s** (e de novo em 7s). Em 4G/3G os 14MB de assets não chegam a tempo → **o jogo é destruído e instanciado de novo em loop**, reiniciando o download. Melhor: watchdog apenas no *canvas existence*, nunca destruir depois do primeiro `scene.isActive`.

### 9. Pico de memória ~100MB no upgrade visual
8 sheets de 1254×1254: cada `getImageData` = 6,3MB + canvas de destino = 6,3MB + textura fonte, tudo em sequência rápida após o jogo começar. Em mobile isso é jank/OOM. **Correção:** reduzir sheets para 512×512 (frames de 128px bastam para o tamanho na tela: o sprite é renderizado a 106px) e processar 1 sheet por frame já é feito — bom, mas com assets menores o problema desaparece. Bônus: `-70%` de download com `pngquant`+`oxipng`.

### 10. Sem pausa/limpeza de input no `blur`
Alt-tab com tecla D pressionada → o Phaser mantém `isDown` e o personagem continua correndo (e apanhando) ao voltar. **Correção:** no `window.blur` → `setPaused(true)` + `resetKeys()` + limpar `virtualInput`.

### 11. Respawn de fosso é punitivo demais e não comunica
Cair no fosso de x≈700 devolve o player para **x=120 (início)** via `respawnX`, sem indicar checkpoint visual nenhum. Em softlocks parciais isso também re-encontra inimigos já aggroados (ver #6).

### 12. Música não acompanha as telas
A trilha do menu continua inalterada dentro do jogo e no game over. `AudioDirector` é capaz (drone + sequenciador), mas falta arranjo por estado (menu/fase/game over/vitória) e o `beat` não reseta ao reiniciar a melodia.

---

## 🟡 P2 — CÓDIGO, REPO & HIGIENE

| # | Item | Observação |
|---|---|---|
| 13 | **README ausente** | Sem instruções de setup/scripts/arquitetura para a equipe. |
| 14 | **`.gitignore` ausente** | Risco real de commit de `node_modules`/`dist` (por sorte ainda limpo). |
| 15 | `package.json` | Nome genérico `react-vite-tailwind` em vez de `shinobi-eclipse`; sem `"test"`/`"lint"`; sem engines. |
| 16 | **4MB de assets órfãos** | `public/assets/shinobi-player-sheet.png` e `shinobi-enemies-sheet.png` (2,1MB + 1,9MB) **não são referenciados em lugar nenhum** — peso morto no repo (`.git` com 19MB) e no deploy. |
| 17 | `emitHud` a cada frame | `JSON.stringify` por frame só para diff de HUD → GC churn. Comparar campos. |
| 18 | `showWorldMessage` | Calcula `midPoint.x` e depois faz `setX(640)` fixo — código morto confuso. |
| 19 | Effect do React sem deps | O listener de atalhos re-registra a cada render (funciona, mas é odor). Deps de `GameViewport` incluem callbacks estáveis hoje, mas frágeis — qualquer `useCallback` sem memo recria o jogo Phaser inteiro. |
| 20 | Sem ESLint/Prettier/testes/CI | Projeto de jogo precisa no mínimo de lint + smoke test de boot (o harness que usei é um bom ponto de partida). |
| 21 | Textos sem acento | "MISSAO/OPCOES/AREA" no jogo vs. descrição com acento no `index.html` — padronizar (é estilístico, mas hoje está inconsistente). |
| 22 | `viteSingleFile` | Bundle de 1,67MB inline em um HTML — ótimo para embed, ruim para cache/parse; documentar o trade-off no README. |
| 23 | Phaser 4 + APIs legacy | `make.graphics({x,y}, false)` funciona, mas vale revisitar assinaturas novas da v4 ao atualizar. |

---

## 📋 PLANO DE AÇÃO PRIORIZADO

| Ordem | Item | Esforço | Impacto |
|---|---|---|---|
| 1 | Fix softlock da caixa (#1) | 2–4h | Elimina o pior bug de progresso |
| 2 | Edge detection no patrol (#2) | 2–3h | Restaura a economia de kills/vidas |
| 3 | Pointer capture seguro (#3) | 1h | Remove crash/input preso no mobile |
| 4 | Loading upfront dos sheets (#4, #8, #9) | 4–6h | Fim do pop mid-game e do loop de recriação |
| 5 | Reexportar spritesheets com alpha/grid (#5) | 1 dia de arte | Animação deixa de "patinar" |
| 6 | Leash de aggro (#6) + respawn/checkpoint (#11) | 3h | Combate mais justo |
| 7 | Consistência da meta 20/32 (#7) | 1h | Copy fecha com o design |
| 8 | Blur → pausa + reset de input (#10) | 1h | Polimento de robustez |
| 9 | README, .gitignore, lint, smoke test E2E (#13–20) | 4h | Higiene de repo para a equipe |
| 10 | Limpar assets órfãos + comprimir PNGs (#9, #16) | 1h | −50% de peso no deploy |

**Estimativa total para o "100%": ~3 a 4 dias de dev + 1 dia de arte.**

---

## 🧪 Evidências (playtest automatizado)

Todos os testes rodaram contra `vite build` de produção com Chromium headless:

- `menu` carrega sem erros; `Enter` inicia; canvas do Phaser monta (`FIT` 16:9 correto);
- HUD em tempo real OK (vida/vidas/abates/alvos/cooldown de shuriken);
- Pausa por botão e por ESC OK; modal de pausa OK;
- **Vida extra aos 20 kills: OK** (lives 4→5 verificado);
- **Transição Área 01→02: OK**; **Vitória: OK**; **Game over após 4 vidas: OK**; **Restart: OK**;
- Softlock na caixa: **reproduzido 2×**; inimigos suicidas: **2 mortes em 120s AFK**; exceção de pointer capture: **capturada em log**.

*Artefatos dos testes (screenshots e scripts de reprodução) ficaram salvos em `/home/user/qa/` fora do projeto — o repositório foi restaurado ao estado original, sem nenhuma modificação.*
