# 🧪 QA & Estratégia de Testes — Shinobi Eclipse

> **Versão:** 1.0 · **Data:** 25/09/2026
> Como o jogo é testado, quais regressões estão cobertas e como reproduzir.

---

## 1. Pirâmide de testes do projeto

| Camada | Ferramenta | O quê |
|---|---|---|
| Tipagem | `tsc --noEmit` (strict) | Contratos e erros estáticos — **gate obrigatório** |
| Smoke E2E | `tests/e2e-smoke.mjs` (Playwright/Chromium) | Caminho crítico real: boot → jogar → pausar → concluir → progresso |
| Regressão dirigida | scripts sob demanda via `window.__shadowScene` | Bugs históricos (softlock, vidas, sprite, shuriken) |
| Playtest manual | roteiro do §5 | Game feel, dificuldade, visual, áudio |

## 2. Como rodar

```bash
npm install
npx playwright install --with-deps chromium   # 1ª vez apenas
npm run build
npm run preview &                              # serve dist/ em :4173
npm run test:e2e                               # smoke suite (16 checks)
npx tsc --noEmit                               # gate de tipos
```

`BASE_URL` troca o alvo (default `http://localhost:4173`).

## 3. Smoke suite — o que cada check cobre

| # | Check | Regressão que protege |
|---|---|---|
| 1 | Menu carrega | Bootstrap React/CSS |
| 2 | Canvas do Phaser monta | Boot da engine, watchdog |
| 3 | Cena ativa (level 1, 8 inimigos, 100 HP) | Estado inicial coerente |
| 4 | Player se move (vx=270 com tecla real) | Ponte input DOM→Phaser |
| 5 | Espada causa dano | Pipeline de combate |
| 6 | ESC pausa com modal | Sinal `pause` + overlay React |
| 7 | ESC retoma | **Re-pausa fantasma** (JustDown pendente) |
| 8 | Controle virtual sem crash | **`setPointerCapture` exception** |
| 9 | Campanha segue para a área 02 | Transição por remount |
| 10 | Área 01 registrada com rank/pontos/dificuldade | Sistema de progresso |
| 11 | Modal de vitória exibe rank e pontos | UI de resultado |
| 12 | Seleção mostra área 01 CONCLUIDA | Persistência + tela de áreas |
| 13 | Área 02 desbloqueada | Regra de desbloqueio |
| 14 | Área 01 rejogável pela seleção | Início direto por fase |
| 15 | Zero erros de runtime | PageErrors/console.error |

> Em headless (SwiftShader) o deslocamento por segundo é menor que o real — o check de
> movimento valida a **velocidade aplicada** (`vx`), não distância absoluta.

## 4. Regressões históricas (bugs que já existiram)

Cada item abaixo tem reprodução conhecida; se voltar, o smoke suite ou um script dirigido
deve falhar:

| Bug | Sintoma | Correção | Proteção |
|---|---|---|---|
| Softlock na caixa | Player empurrado contra caixa, preso por minutos | Caixas "step-over" + knockback reduzido + `updateUnstuck` | Script: teleportar ao (600,640) e andar → deve atravessar |
| Inimigos suicidas | Patrulha caía em fossos e dava kill de graça | Edge detection na patrulha | AFK 90 s → 0 abates |
| Shuriken destruía o player | Overlap (grupo,sprite) invertia args; `shot.destroy()` matava o jogador | Registro `(player, grupo)` + guards | Acertos de shuriken → player `active` |
| Vida presa em 0% | Morte não processada por corrida de eventos | `processDeath()` idempotente + watchdog por frame | Vitalidade 0 ⇒ vida consumida no mesmo frame |
| Sprite gigante | Frame 313 px com scale 1 ao pular na troca de textura | Flag `playerUpgraded` + troca só no chão + retry por frame | Pular na janela → altura ≤120 px; depois 106 px/0.34 |
| Re-pausa no ESC | Retomar pausava de novo na frame seguinte | `keys.ESC.reset()` + janela `swallowPauseUntil` | Check 7 da smoke suite |
| Spawn-camp | Inimigos executavam o player no respawn (4 vidas em segundos) | Respawn devolve inimigos ao posto + `calmUntil` 3,6 s | Morte real → 0 inimigos a <220 px do spawn no respawn |
| Fosso re-teleportava | Queda fatal movia o player duas vezes (de volta ao fosso) | `damagePlayer` retorna se consumiu vida; `hitHazard` só realoca em queda não-fatal | Queda fatal → base; não-fatal → checkpoint ≤300 px |
| Watchdog destrutivo | Conexão lenta recriava o jogo em loop | Boot nunca destruído; fallback único; erro só sem canvas | Boot lento simulado |
| HUD mentia ("00/20") | Meta fixa ≠ 32 inimigos reais | `TOTAL_TARGETS` central | Check 3/HUD |

## 5. Roteiro de playtest manual (pré-release)

1. **Boot:** menu → AREAS → OPÇÕES → GUIA; alternar dificuldade e volume; recarregar a
   página e conferir persistência.
2. **Área 01 (Normal):** campanha completa sem pausar; observar leitura de inimigos e
   justiça dos spawns; morrer de propósito 1× (validar respawn/anti-camp/piscada).
3. **Fluxo de vidas:** esvaziar as 4 vidas → game over com HUD "00"; restart refaz a área.
4. **Transição/rank:** concluir a 01 e conferir rank+pontos na cortina e no card AREAS.
5. **Área 02:** concluir → vitória com rank; rejogar direto pela seleção.
6. **Dificuldades:** repetir uma área em Fácil e Difícil; chips acendem; ranks separados.
7. **Entradas:** repetir 2–3 só com toque; só com gamepad; alt-tab no meio (pausa auto).
8. **Performance:** sheet detalhado troca sem engasgo perceptível; mobile sem jank longo.

## 6. Critérios de aceite (Definition of Done de um release)

- [ ] `npx tsc --noEmit` sem erros
- [ ] `npm run build` conclui e `dist/index.html` abre standalone
- [ ] `npm run test:e2e` **15/15 ✓**
- [ ] Roteiro manual §5 executado sem regressões
- [ ] Sem erros/warnings novos no console (exceto ruído de GPU headless)
- [ ] Pesos de assets revisados (nenhum sheet >1,6 MB; inimigos ≤330 KB)
- [ ] `docs/CHANGELOG.md` atualizado
