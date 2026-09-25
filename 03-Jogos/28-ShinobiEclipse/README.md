# 🥷 Shinobi Eclipse

Jogo de plataforma e aventura 2D construído com **React 19 + Phaser 4 + Vite 7**.
Atravesse seis áreas ninja — da Fortaleza Interior ao Coracao do Eclipse — elimine os **68 alvos** e sobreviva
com suas **4 vidas** — conquistando o maior **rank** e a maior **pontuação** em cada
dificuldade.

![stack](https://img.shields.io/badge/React-19-149ECA) ![phaser](https://img.shields.io/badge/Phaser-4-AA0A0A) ![vite](https://img.shields.io/badge/Vite-7-A855F7) ![ts](https://img.shields.io/badge/TypeScript-strict-3178C6)

---

## 📚 Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/GDD.md`](docs/GDD.md) | **Game Design Document** — visão, pilares, mecânicas, castas de inimigos, fases, economia de rank/pontos |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Arquitetura técnica — stack, ponte React↔Phaser, física, sistemas de robustez, build |
| [`docs/ASSETS.md`](docs/ASSETS.md) | Pipeline de spritesheets — convenções, matte/alinhamento offline, requisitos para novos assets |
| [`docs/QA.md`](docs/QA.md) | Estratégia de testes — smoke suite E2E, regressões históricas, roteiro de playtest, checklist de release |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Guia da equipe — fluxo de branches/commits, Definition of Done, como adicionar fases e inimigos |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Histórico de versões e correções |

## Requisitos

- Node.js 20+
- npm 10+

## Como rodar

```bash
npm install
npm run dev        # servidor de desenvolvimento (http://localhost:5173)
npm run build      # build de produção (bundle single-file em dist/index.html)
npm run preview    # serve o build de produção (http://localhost:4173)
npm run test:e2e   # smoke test E2E (requer `npx playwright install chromium`)
npx tsc --noEmit   # gate de tipos
```

## 🎮 Funcionalidades

- **Campanha de 6 áreas** (Fortaleza Interior, Lua Vermelha, Bambuzal Espectral, Dojo de Gelo, Cratera de Cinzas e Coracao do Eclipse) com **68 inimigos** de 5 castas
  (rusher, ranged, alcance, tanque e elite) — cada uma com HP/dano/velocidade próprios.
- **Combate** com combo de espada (3 golpes + golpe aéreo) e shuriken com cooldown.
- **Game feel de plataforma**: coyote time, jump buffer, hit-stop, knockback, screen shake.
- **Ciclo de vidas robusto**: respawn com 2,2 s de invulnerabilidade, inimigos devolvidos
  aos postos (anti spawn-camp), checkpoints de fosso a ≤300 px.
- **Seleção de áreas** com progresso: status, **rank S–D**, **melhor pontuação** e
  **dificuldades concluídas** (Fácil/Normal/Difícil) por fase — persistido no dispositivo.
- **3 dificuldades** com multiplicadores de HP/dano/velocidade e de pontuação.
- Controles de **teclado, gamepad e toque**; pausa automática ao perder o foco.
- **Áudio 100% sintetizado** (Web Audio API) — trilha e efeitos sem dependências.
- **Fallback procedural**: se algum asset falhar, ninjas vetoriais mantêm o jogo 100%
  jogável.

## Controles

| Ação | Teclado | Gamepad | Toque |
|---|---|---|---|
| Mover | `A`/`D` ou setas | Analógico/d-pad | Botões na tela |
| Saltar | `Espaço`/`W`/`↑` | `A` | Botão `^` |
| Espada | `J`/`X` | `X` | Botão ESPADA |
| Shuriken | `K`/`C` | `B` | Botão SHURIKEN |
| Pausar | `ESC` | Start | Botão `II` |

## 🧩 Arquitetura em 30 segundos

```
React (telas, HUD, progresso)  ⇄  EventTarget + callbacks tipados  ⇄  Phaser (ShadowScene)
```

- `src/App.tsx` — telas (menu/áreas/opções/guia/jogo), HUD, modais, input virtual,
  rank/pontuação e persistência.
- `src/game/ShadowScene.ts` — simulação completa: física, IA das castas, fases, morte/
  respawn idempotente (watchdog), troca segura de sprites.
- `src/game/audio.ts` — AudioDirector (trilha + SFX sintetizados).
- `scripts/process_spritesheets.py` — pipeline offline dos spritesheets (alpha real,
  frames alinhados, otimização de peso).

Detalhes em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## 🥷 Design em uma página

- **Meta:** eliminar todos os alvos das 6 áreas com 4 vidas; **vida extra** a cada 20 abates.
- **Pontuação por área:** `(1000 + abates×50 + vidas×300 + vitalidade×3) × dificuldade`.
- **Rank:** S/A/B/C/D com bônus por dificuldade — S exige quase-perfeição.
- **Caixas** são "step-over"; **inimigos** patrulham com detecção de borda e têm leash de
  aggro; **fossos** têm checkpoint próximo.

Design completo em [`docs/GDD.md`](docs/GDD.md).

## Notas

- O build usa `vite-plugin-singlefile`: o `dist/index.html` embute JS+CSS (~1,7 MB) —
  ótimo para embed/preview, sem cache granular por arquivo.
- Configurações (áudio/dificuldade/controle) e progresso são persistidos em `localStorage`.
