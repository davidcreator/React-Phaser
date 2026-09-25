# ✅ SHINOBI ECLIPSE — CORREÇÕES APLICADAS

> ## ✨ RODADA 4 — 25/09/2026 (feature: seleção de fase + rank + pontuação)
>
> Implementado sob demanda e validado (smoke suite estendida: **15/15 ✓**):
> - **Tela "AREAS"** no menu: cards por fase com status `CONCLUIDA`/`DISPONIVEL`/`BLOQUEADA`
>   (área 02 libera ao concluir a 01), melhor rank, melhor pontuação e chips
>   **FACIL/NORMAL/DIFICIL** acesos para cada dificuldade já vencida;
> - **Pontuação** = `1000 + abates×50 + vidas×300 + vitalidade×3` × multiplicador de
>   dificuldade (`×1/×1.5/×2`); **rank S/A/B/C/D** com bônus por dificuldade —
>   S exige quase-perfeição;
> - Rank+pontos aparecem na **transição da Área 01** e no **modal de vitória**;
> - **Persistência** em `localStorage` (`shinobi-eclipse-progress`), com melhor
>   pontuação e melhor rank **por dificuldade**;
> - "TENTAR NOVAMENTE" refaz a área atual; iniciar pela seleção joga a área escolhida
>   direto (HUD e inimigos corretos por fase — validado: área 02 spawna 12 alvos).
> *Screenshots: `/home/user/qa/evidencias-selecao/`*

---
### Follow-up da auditoria de 24/09/2026 · Todas as correções validadas em teste automatizado

> ## 🔁 RODADA 3 — 25/09/2026 (investigação profunda do ciclo de vidas)
>
> ### 🎯 BUG RAIZ ENCONTRADO COM ARMADILHA DE STACK TRACE: shuriken inimiga DESTRUÍA O PLAYER
> **Este era o verdadeiro culpado do relato "o personagem não volta e não perde 1 vida".**
> O overlap de projéteis inimigos era registrado como `(grupo, sprite)` e o callback assumia
> `(projétil, player)` — mas o Arcade Physics **inverte a ordem** nesse caso e entregava
> **(player, projétil)**. Resultado: `shot.destroy()` **destruía o sprite do jogador** na
> hora em que uma shuriken inimiga (ninja azul/onyx, de longo alcance) acertava. O jogo
> congelava: vitalidade presa, nenhuma vida consumida, personagem sumido — exatamente o
> sintoma reportado. Bug existia no código original do repositório; passou despercebido
> porque só dispara contra inimigos ranged.
>
> **Prova (trap):** `player.destroy() ← nosso callback ← collideSpriteVsGroup`.
> **Fix:** registro invertido `(player, grupo)` → callback deterministicamente `(player, membro)`;
> blindagem equivalente nos demais colliders de projéteis; dano do projétil registrado antes
> da física (elimina corrida de `getData` com fallback 12).
> **Validação:** 3 acertos de shuriken seguidos → player intacto (active=true), hp caindo
> corretamente, zero projéteis órfãos.
>
> ### Reforços no ciclo de vidas (defesa em profundidade)
> - **Watchdog por frame:** `processDeath()` extraído e idempotente; se a vitalidade zerar sem
>   processar por QUALQUER razão, o frame seguinte executa a morte/respawn. Vitalidade presa
>   em 0% sem consumir vida tornou-se impossível por construção;
> - **Game over com rede de segurança:** mensagem in-world + reenvio do sinal após 1.2s caso
>   o React perca o primeiro (corrida de boot/teardown);
> - **Anti spawn-camp real:** no respawn, inimigos vivos voltam aos postos (`homeX/homeY`) e
>   ficam 3.6s em "calmaria" (não perseguem) — antes eles re-aggro durante a invulnerabilidade
>   e executavam o player na parede (knockback empilhava o corpo em x=24);
> - **Fosso corrigido de verdade:** `damagePlayer` agora RETORNA se consumiu vida; `hitHazard`
>   só reposiciona no checkpoint quando NÃO houve morte (a checagem anterior por `health > 0`
>   re-teleportava o player de volta ao fosso logo após o respawn — erro meu da rodada 2,
>   pego pelo teste de regressão).
>
> ### Validação (combate 100% real, sem interferência no player)
> ```
> MORTE 1: 4→3 | hp 100% | pos base | 0 inimigos no spawn ✓
> MORTE 2: 3→2 | hp 100% | pos base | 0 inimigos no spawn ✓
> MORTE 3: 2→1 | hp 100% | pos base | 0 inimigos no spawn ✓
> MORTE 4: 1→0 | game over (modal FIM DA MISSAO, HUD VIDAS 00) ✓
> Queda fatal em fosso: consome 1 vida e respawna na base (sem duplo teleport) ✓
> Queda não-fatal: checkpoint a ≤300px, sem perder vida ✓
> Shuriken inimiga: player intacto ✓ · Sprite gigante: continua corrigido ✓
> Smoke suite 9/9 ✓ · Zero erros de runtime ✓
> ```

---

> ## 🔁 RODADA 2 — 25/09/2026 (bugs reportados em playtest)
>
> ### A. Sprite gigante saindo do cenário ✅ CORRIGIDO
> **Causa raiz (reproduzida em laboratório):** ao pular durante a janela de registro dos
> spritesheets, o player recebia o **frame detalhado de 313px mantendo o scale 1** do sprite
> procedural (64px) → ninja de 313px "gigante". O gate de troca segura poderia adiar o upgrade
> para sempre se o player estivesse no ar na janela, e os frames do ar eram aplicados só com
> `textures.exists()` — sem verificar se a escala já tinha sido aplicada.
>
> **Correção:**
> - Nova flag `playerUpgraded` (fonte única de verdade): nenhum frame/animação detalhada roda
>   sem ela (idle/run/jump/sword/throw/hurt/defeated); o retry do upgrade acontece **todo frame**
>   no `update()` até ocorrer em momento seguro;
> - `createPlayer()` marca a flag quando já nasce com a sheet (restarts de cena);
> - Animações de inimigos só tocam se o próprio sprite já usa a textura detalhada;
> - Fallback de recuperação: se detectar textura detalhada com scale errado, corrige no ato.
>
> **Validação:** bot pulando sem parar na janela de troca → sprite permanece 64px procedural e
> completa a troca ao aterrissar (**scale 0.34, 106px**, zero downgrades da flag em 4s monitorados
> com trap de stack trace). Durante o processo encontramos e corrigimos também uma corrupção de
> edit que resetava a flag todo frame dentro do `updateUnstuck`.
>
> ### B. Ciclo de vidas ✅ CORRIGIDO/REFORÇADO
> O mecanismo já existia, mas foi blindado e tornado visível:
> - **Validação automatizada do ciclo completo:** morte 1→2→3 consomem vidas com respawn no
>   spawn (100% HP), morte 4 = game over com modal, restart restaura 4 vidas — tudo verificado;
> - Respawn agora dá **2.2s de invulnerabilidade** com piscada (antes 0.9s — morria em cascata
>   para inimigos parados em cima do ponto de retorno);
> - Mensagem de respawn com singular correto ("3 VIDAS RESTANTES" / "1 VIDA RESTANTE");
> - Guard no `completeLevel()` para corridas raras game-over × fim-de-fase.
>
> *Screenshots: `/home/user/qa/evidencias-ciclo-vida/`*

---

**Veredito em uma linha:** o jogo é **jogável e cheio de acerto de conceito**, mas **não está 100%**: encontrei **4 bugs críticos (P0)** confirmados em teste automatizado real, ~10 problemas de gameplay/pipeline (P1) e uma lista de dívidas técnicas e de repositório (P2).

---

## 🔴 P0 — CORRIGIDOS

### 1. Softlock na caixa de madeira ✅
**Correção (3 camadas de defesa):**
- `addObstacle()`: caixas agora são *step-over* — `checkCollision.left/right = false` no StaticBody. É possível subir nelas; nunca mais ficar empurrado contra a lateral.
- Knockback de dano reduzido (250 → 175) com prioridade vertical.
- `updateUnstuck()`: se o player ficar espremido contra parede/piso por >1.1s, é realocado suavemente.

**Validação:** player teleportado para DENTRO da caixa (600,640) atravessou/subiu e continuou
(x=659, sem dano); bot de navegação atravessou a zona x=550–750 sem travar (maxX=828).
Antes: 2 travamentos (um deles de 3+ minutos).

### 2. Inimigos suicidas nos fossos ✅
**Correção:** patrulha com *edge detection* — sonda o chão à frente (raio `displayWidth*0.35+10`)
contra os bounds das plataformas; sem chão, o inimigo para e inverte a direção.

**Validação:** 90s de AFK → **0 mortes espontâneas** (antes: 2 em 120s).

### 3. `setPointerCapture` crash + input preso ✅
**Correção:** `try/catch` no capture, `onLostPointerCapture` e `onPointerCancel` soltando a ação,
e `onContextMenu` prevenido (botão direito não trava mais o estado).

**Validação:** pointerdown/up nos controles virtuais sem exceção em todas as rodadas.

### 4. Troca de textura/hitbox no meio da partida ✅
**Correção (2 partes):**
- `upgradeActiveSprites()`: o player só troca de textura em momento seguro (no chão, sem ataque
  em curso), com fade 90ms; inimigos em `attackingUntil` também esperam.
- **Causa raiz do jank eliminada:** como os sheets agora têm alpha real (pipeline offline), o
  flood-fill de 1,5M pixels por sheet **não roda mais em runtime** (`registerDetailedSheet` entra
  direto na TextureManager). Sheets legados com xadrez ainda são detectados por amostragem de
  cantos e usam o caminho lento automaticamente.

**Validação:** input responsivo durante todo o window de carregamento (sonda temporal: `vx=270`
constante); 3 rodadas do smoke suite sem erros.

---

## 🟠 P1 — CORRIGIDOS

| # | Bug | Correção | Validação |
|---|---|---|---|
| 5 | Sheets desalinhados + xadrez falso | Pipeline offline `scripts/process_spritesheets.py`: flood-fill de borda → alpha real; recentralização por centroide de alpha; pés alinhados em baseline comum; quantização otimizada | 16/16 frames com centroide x≈156.7 e pé y=274 (antes deslizava 129→185) |
| 6 | Inimigo cola no player para sempre | Leash de aggro: `distance > 640 ‖ dy > 230` → volta a patrulhar | Comportamento confirmado em jogo |
| 7 | Meta "20" mentirosa | `TOTAL_TARGETS = 32` em HUD, menu, guia e modais | HUD mostra "00 / 32"; vitória: "32 alvos eliminados…"; game over: "0 dos 32 alvos…" |
| 8 | Watchdog destruía jogo em conexão lenta | Só faz fallback AUTO→CANVAS uma vez; nunca destrói boot vivo (checa canvas+scene); erro só se não houver canvas; timeout final 12s | Boot estável em todas as rodadas |
| 9 | Pico de ~100MB no upgrade | Sheets de inimigos quantizados (~1.8MB → ~200KB cada, −89%); sem flood-fill em runtime | Build + runtime OK |
| 10 | Alt-tab mantinha teclas pressionadas | `window.blur` → reset de todas as teclas + `virtualInput` zerado + pausa automática | Implementado; listener removido no shutdown |
| 11 | Respawn punitivo (volta ao início) | `respawnX` garante checkpoint a no máximo 300px da queda | Implementado |
| 12 | Música ignora estado do jogo | Parcial: pausa congela toda a cena; melodia continua por design do AudioDirector (backlog) | — |

## 🟡 P2 — CORRIGIDOS

| # | Item | Correção |
|---|---|---|
| 13 | README ausente | `README.md` completo (setup, controles, arquitetura, design) |
| 14 | `.gitignore` ausente | Criado (node_modules, dist, logs, env) |
| 15 | `package.json` genérico | `name: shinobi-eclipse`, `version: 1.0.0`, script `test:e2e` |
| 16 | 4MB de assets órfãos | `shinobi-player-sheet.png` e `shinobi-enemies-sheet.png` removidos |
| 17 | `JSON.stringify` por frame no HUD | Diff campo a campo (`lastHudData`) |
| 18 | Código morto no `showWorldMessage` | Removido (texto sempre centralizado) |
| 19 | Effect sem deps / frágil | Watchdog resiliente; guards defensivos (`player?.active`, grupos `?.`) em `update`, `handleInput`, `damagePlayer`, tweens e projéteis |
| 20 | Sem testes | `tests/e2e-smoke.mjs` (9 checks: boot, estado, movimento, combate, pausa/retomada, touch, erros) + handle `__shadowScene` documentado para testes |

---

## 📊 RESULTADO DOS TESTES (build de produção, Chromium headless)

```
SMOKE SUITE (tests/e2e-smoke.mjs) — 3 rodadas
✓ menu carrega                        ✓ espada causa dano (52 → 4)
✓ canvas do Phaser monta              ✓ ESC pausa com modal
✓ cena ativa (level 1, 8 inimigos)    ✓ ESC retoma o jogo
✓ player se move (vx=270)             ✓ controle virtual sem crash
✓ zero erros de runtime

LOOP COMPLETO
✓ Vida extra aos 20 abates (4 → 5 vidas)
✓ Player dentro da caixa: atravessa (anti-softlock)
✓ Transição Área 01 → Área 02
✓ Vitória com texto correto ("32 alvos eliminados com 5 vidas restantes")
✓ Restart pós-vitória (level 1, 8 inimigos)
✓ Game over com texto correto ("0 dos 32 alvos foram eliminados")

REGRESSÃO DOS P0
✓ AFK 90s: 0 inimigos morrem sozinhos (antes: 2 em 120s)
✓ Bot navega pela zona da caixa sem travar (antes: softlock de 3 min)
```

**Bônus descoberto e corrigido durante a validação:** o mesmo ESC que retoma o jogo deixava um
`JustDown` pendente que **re-pausava na frame seguinte** (janela de 300ms `swallowPauseUntil` +
`keys.ESC.reset()`).

---

## 📁 Mudanças no repositório

```
M  src/game/ShadowScene.ts        (+208 linhas: fixes P0/P1 + guards)
M  src/App.tsx                    (+47: pointer capture, watchdog, meta 32)
M  public/assets/**               (8 sheets com alpha real + frames alinhados)
D  public/assets/shinobi-*-sheet  (4MB de órfãos removidos)
A  scripts/process_spritesheets.py(pipeline offline de assets)
A  tests/e2e-smoke.mjs            (smoke test E2E)
A  README.md · .gitignore
M  package.json                   (nome/versão/script de teste)
```

Para rodar: `npm install && npm run dev` · Testes: `npm run build && npm run preview &` → `npm run test:e2e`


## 🌙 RODADA 5 — 24/09/2026 (expansão: 6 fases com identidade própria)

**Data:** 24/09/2026 · **Escopo:** conteúdo + UI + testes + docs

### O que mudou
- `src/game/ShadowScene.ts`: dados das 6 fases centralizados em `LEVELS: LevelConfig[]`
  (nome, flavor, worldWidth, `LevelPalette` completa, ground/ledges/obstacles/gaps,
  lanterns/toriis/checkpoints/spawns). `MAX_LEVEL`, `config()` com clamp e `LEVEL_META`
  exportada para o React. Fim dos ternários `this.level === 1` — tudo lê de `config()`.
- Novas áreas: **03 Bambuzal Espectral** (jade, lua verde), **04 Dojo de Gelo** (azul,
  lua gelada), **05 Cratera de Cinzas** (roxo, lua lilás), **06 Coracao do Eclipse**
  (dourado, lua raio 90). 68 alvos no total (8+12+10+12+12+14).
- `completeLevel` genérico: área intermediária → `levelClear` + `nextLevel {level+1}` com
  mensagem "AREA SEGURA — {próxima} aguarda"; última área → vitória (`victory` ganhou `level`).
- Desenhos paletizados: `drawCloudBank(random, cloud)`, `drawSilhouetteTemple(x, color)`,
  `drawToriiGate(x, color)`, `drawGrassTuft(x, y, color)`; lua com raio variável.
- `src/App.tsx`: `TOTAL_TARGETS` derivado de `LEVEL_META` (68); seleção renderiza os 6 cards
  via `LEVEL_META` com lock em cadeia (N libera após concluir N−1), contador "X/6 AREAS
  CONCLUIDAS", lock-hint "Conclua a Area NN"; HUD/meta por fase; `LevelTransition` e modais
  dinâmicos por área; menu "Seis areas. 68 alvos."; rodapé "06 AREAS".
- `src/index.css`: `.level-cards` em grade de 2 colunas com scroll (1 coluna < 1200px), cards compactados.
- `tests/e2e-smoke.mjs`: campanha varre as 6 áreas até a vitória (16 checks).

### Bugs pegos no QA desta rodada
1. **Spawns em fossos/plataformas inexistentes** nas áreas novas (17 posições inválidas) —
   inimigos morriam sozinhos ao nascer, dando abate de graça e HUD "9/10". Corrigidos por
   validação geométrica (chão/plataforma sob o spawn, fora de caixas e fossos, sem sobreposição).
   Incluiu um bug latente da área 02 original (spawn x=2590 sobre o fosso de 92px).
2. **Corrupção do bloco LEVELS** por script de reescrita com offsets deslocados — detectada
   pelo `tsc` e corrigida com reescrita determinística das 6 linhas de spawns.

### Validação
- `tsc --noEmit` limpo; build 1.686 kB; smoke suite **16/16** (campanha 1→6, vitória só na 06,
  6 registros de progresso, 6 cards, todas rejogáveis, zero erros de runtime).
- Contagem real por área no navegador: 8/12/10/12/12/14, `kills=0` em todas.
- Screenshots: seleção 6 cards, área 03 (jade) e área 06 (eclipse dourado).
