# 🏗️ Arquitetura Técnica — Shinobi Eclipse

> **Versão:** 1.0 · **Data:** 25/09/2026
> Destina-se a desenvolvedores mantenedores do projeto.

---

## 1. Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| UI / telas / HUD | React (StrictMode off, JSX runtime automático) | 19.2 |
| Motor de jogo | Phaser (renderer Arcade Physics) | 4.1+ |
| Build | Vite + `vite-plugin-singlefile` | 7.x |
| Estilo | Tailwind CSS 4 (via plugin Vite) + CSS custom | 4.1 |
| Linguagem | TypeScript `strict` (`noUnusedLocals`, `noUnusedParameters`) | 5.9 |
| Testes E2E | Playwright (Chromium headless) | 1.5x |

**Decisão `singlefile`:** o build produz **um único `dist/index.html`** (~1,7 MB)
com JS/CSS embutidos — ideal para embeds/preview e hospedagem estática simples.
Trade-off: sem cache granular por arquivo (documentado, aceito).

## 2. Estrutura de pastas

```
├── index.html                  # entrada Vite (lang pt-BR)
├── src/
│   ├── main.tsx                # bootstrap React
│   ├── App.tsx                 # telas, HUD, modais, seleção/áreas, progresso, input virtual
│   ├── index.css               # tema (Tailwind 4 + CSS custom)
│   ├── game/
│   │   ├── ShadowScene.ts      # TODA a simulação Phaser (cena única)
│   │   └── audio.ts            # AudioDirector (Web Audio sintetizado)
│   └── utils/cn.ts             # helper clsx+twMerge
├── public/assets/              # spritesheets 4×4 (player + 5 castas)
├── scripts/
│   └── process_spritesheets.py # pipeline offline de assets (alpha+alinhamento+peso)
├── tests/
│   └── e2e-smoke.mjs           # smoke suite E2E (15 checks)
└── docs/                       # esta documentação
```

## 3. Boot e ciclo de vida

```
main.tsx → <App/>
  ├─ screen: menu | levels | options | guide | game   (state React)
  └─ screen === "game" → <GameViewport key={runId}/>  (remount = partida nova)
        └─ new Phaser.Game({ ..., scene: [new ShadowScene(settings, callbacks, startState)] })
              ├─ init(data)      → reset de estado da cena (suporta restart da fase)
              ├─ create()        → texturas procedurais, nível, player, inimigos, física
              └─ update(time)    → input, IA, projéteis, morte/watchdog, unstuck, HUD
```

- **`runId`** é a chave do remount: qualquer "partida nova" (iniciar, restart, próxima
  área, voltar ao menu) destrói a instância Phaser e cria outra — evita deadlocks de
  restart de cena entre engines/embeds.
- **Watchdog de boot** (App): nunca destrói um boot vivo; só faz fallback AUTO→CANVAS
  uma vez e expõe estado de erro com botão "TENTAR NOVAMENTE".

## 4. Ponte React ↔ Phaser

| Direção | Mecanismo |
|---|---|
| React → Cena | `gameCommands` (EventTarget global) + `CustomEvent("game-command")`: `pause/resume/left/right/jump/sword/shuriken` |
| Cena → React | callbacks tipados passados no construtor: `onHud(HudData)`, `onSignal(GameSignal)`, `onSound(SoundEffect)` |
| HUD | cena emite `HudData` por **diff de campos** (sem `JSON.stringify` por frame); React re-renderiza só quando muda |

`GameSignal`: `ready · level · levelClear(stats) · nextLevel(state) · gameOver ·
victory(stats) · pause(paused)` — stats alimentam rank/pontuação no App.

**Contrato de propriedade:** cada partida possui sua cena; listeners (`game-command`,
`blur`, shutdown) são sempre removidos no `SHUTDOWN` da cena. O handle
`window.__shadowScene` expõe a cena para os testes E2E (ver §8).

## 5. Física e simulação

- Arcade Physics: gravidade `y=1180`, `TILE_BIAS=40`, bounds da área (2400/2880 × 860).
- **Player:** corpo 82×174 (offset 87,50) na forma detalhada; max velocity 350/1050.
- **Colisões principais:** player↔plataformas, inimigos↔plataformas, inimigos↔inimigos,
  player↔hazards (overlap), projéteis↔plataformas (destrói), projéteis↔alvo (overlap).
- **Caixas:** `checkCollision.left/right = false` no StaticBody → "step-over" (anti-softlock).
- **Overlaps com grupos:** SEMPRE registrados como `(sprite, grupo)` para ordem
  determinística de argumentos no callback (bug histórico: ordem invertida destría o
  player ao ser atingido por shuriken — ver docs/QA.md).

### 5.1 Sistemas de robustez (defesa em profundidade)
| Sistema | Onde | Função |
|---|---|---|
| `processDeath()` + watchdog por frame | ShadowScene | Morte/respawn idempotente; vitalidade zerada **sempre** consome vida |
| Anti spawn-camp | `processDeath` | Inimigos voltam a `homeX/homeY` + `calmUntil` 3,6 s |
| `updateUnstuck()` | ShadowScene | Player espremido contra parede >1,1 s é realocado |
| Leash de aggro | `updateEnemies` | Perseguição ≤640 px; patrulha com edge detection |
| Pausa em blur | ShadowScene | Reset de teclas + pausa automática (alt-tab) |

## 6. Progressão, rank e persistência (App)

- `Progress` = `{ [levelId]: { completed, bestScore, bestRank, completedDifficulties, bestRankByDifficulty } }`
- Fórmulas em `src/App.tsx` (`scoreFor`, `rankFor`) — espelhadas em `docs/GDD.md` §7.
- Persistência: `localStorage["shinobi-eclipse-progress"]` (settings em
  `...-settings`). Escritas defensivas (try/catch) — o jogo funciona sem storage.
- `applyRecord()` é idempotente por melhor-valor (rank só melhora; score só aumenta).

## 7. Performance

- **Texturas:** sheets processados offline têm alpha real → `registerDetailedSheet()`
  registra direto na TextureManager (sem flood-fill em runtime); fallback com matte
  detectado por amostragem de cantos.
- **Troca procedural→detalhado:** flag `playerUpgraded` (fonte única de verdade);
  troca só em momento seguro com fade 90 ms; retry por frame até conseguir.
- **Assets:** inimigos quantizados a 256 cores (~200 KB cada); player em RGBA full.
- **GC:** HUD por diff; sons por osciladores descartáveis; tweens autodestruídos.

## 8. Testabilidade

- Handle de debug `window.__shadowScene` (cena ativa) permite aos testes inspecionar/
  dirigir a simulação: `level`, `lives`, `health`, `player`, `enemies`, `damagePlayer`,
  `damageEnemy`, `swordAttack` etc.
- Smoke suite: `tests/e2e-smoke.mjs` — ver `docs/QA.md`.

## 9. Build e deploy

```bash
npm run build     # → dist/index.html (singlefile, ~1,7 MB)
npm run preview   # serve dist em :4173 (allowedHosts configurável no vite.config)
```

- Hospedagem: qualquer estático (Netlify/Vercel/S3/GH Pages) — basta publicar `dist/`.
- `vite.config.ts` já libera hosts `*.e2b.app` para ambientes de preview sandbox.
