# 🤝 Guia de Contribuição — Shinobi Eclipse

Padrões de trabalho da equipe (KAGE UNIT) para manter o projeto saudável
conforme ele cresce.

---

## 1. Setup rápido

```bash
git clone <repo> && cd shinobi-eclipse
npm install
npx playwright install --with-deps chromium   # para os testes E2E
npm run dev
```

Documentação de referência: [`docs/GDD.md`](./GDD.md) (design) ·
[`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) (código) ·
[`docs/ASSETS.md`](./ASSETS.md) (arte) · [`docs/QA.md`](./QA.md) (testes).

## 2. Fluxo de trabalho

1. **Branch** a partir de `main`: `feat/<assunto>`, `fix/<assunto>`, `art/<assunto>`,
   `docs/<assunto>`.
2. **Commits** no formato [Conventional Commits](https://www.conventionalcommits.org/pt-br/):
   - `feat: adiciona seleção de áreas com rank`
   - `fix: impede spawn-camp no respawn das vidas`
   - `art: quantiza sheets de inimigos para 256 cores`
   - `docs: atualiza GDD com economia de rank`
   - `test: cobre regressão de pointer capture`
3. **Pull Request** pequeno e focado, com descrição de *o que*/*por quê* e
   evidência (print/vídeo para mudanças visuais; log do smoke suite para comportamento).
4. **Review**: 1 aprovação obrigatória; revisor prioriza `ShadowScene.ts` e fluxo de
   vidas/progresso (áreas historicamente sensíveis — ver `docs/QA.md` §4).

## 3. Definition of Done

Uma mudança só entra em `main` com:

- [ ] `npx tsc --noEmit` limpo (strict)
- [ ] `npm run build` OK
- [ ] `npm run test:e2e` **15/15 ✓** (ou suite atualizada no mesmo PR)
- [ ] Playtest manual da área afetada (roteiro em `docs/QA.md` §5)
- [ ] Sem novos warnings no console
- [ ] Docs atualizadas se o design/sistema mudou (GDD/ARCHITECTURE/QA)
- [ ] `docs/CHANGELOG.md` com entrada em "Unreleased"

## 4. Como estender o jogo

### Adicionar uma nova área (fase)
1. Em `ShadowScene.ts`: layout em `buildLevel()` (ground/ledges/obstacles/gaps),
   spawns em `spawnEnemies()`, paleta em `drawBackdrop()`/`addPlatform()`.
2. Em `App.tsx`: adicionar o card em `LevelSelectScreen` e o estado inicial de HUD
   (`startGame`); revisar regra de desbloqueio e o contador `X/N AREAS CONCLUIDAS`.
3. Cobrir a transição (hoje o texto da cortina fixa "AREA 02" — parametrizar).
4. Adicionar check E2E do novo fluxo.

### Adicionar um novo inimigo (casta)
1. Sheet 4×4 seguindo `docs/ASSETS.md` §1; rodar o pipeline offline.
2. Registrar o arquétipo em `ENEMY_TYPES` (hp/dano/velocidade/corpo/barColor).
3. Paleta procedural do fallback em `createTextures()`.
4. Entrada na tabela de castas do GDD e na legenda do guia (`GuideScreen`).

### Balanceamento
- Multiplicadores de dificuldade: `DIFFICULTY` (ShadowScene) — refletir no GDD §7.
- Rank/pontos: `scoreFor`/`rankFor` (App) — refletir no GDD §7 e no QA §3.

## 5. Convenções de código

- TypeScript strict, sem `any` implícito; tipos exportados da cena (`GameSignal`,
  `HudData`, `GameSettings`) são o **contrato** React↔Phaser — mudar com cuidado.
- Comentários `FIX <tema>:` explicam o *porquê* de correções não óbvias (manter).
- Sem números mágicos novos sem constante nomeada (ver `DIFFICULTY`, `ENEMY_TYPES`,
  `TOTAL_TARGETS`).
- CSS: classes temáticas existentes (`rank-badge`, `level-card`...); preferir estender
  a criar paralelos.

## 6. Comunicação

- Bugs: issue com passos de reprodução + build/commit + screenshot/vídeo.
- Mudanças de design (GDD): discutir antes de codar — economia de rank e dificuldade
  afetam promessa ao jogador.
