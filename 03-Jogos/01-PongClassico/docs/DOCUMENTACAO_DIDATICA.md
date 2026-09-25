# 📚 Pong Clássico — Guia Didático: Jogos 2D com React + Phaser

> **Para quem é este documento?** Para quem quer aprender a construir jogos 2D web
> usando **React + Phaser** e está usando este projeto como referência/primeiro projeto.
>
> **Como usar:** leia na ordem (Seções 0 → 9) na primeira vez; depois use as
> Seções de "Receitas" (10) e "Armadilhas" (11) como consulta rápida enquanto programa.
>
> **Nível:** intermediário — é esperado que você já saiba o básico de JavaScript/TypeScript
> e tenha alguma familiaridade com componentes React. Phaser e game loops serão
> explicados do zero.

---

## Sumário

0. [Pré-requisitos e como rodar](#0-pré-requisitos-e-como-rodar)
1. [Por que React + Phaser? A regra de ouro](#1-por-que--react--phaser-a-regra-de-ouro)
2. [Stack e configuração do projeto](#2-stack-e-configuração-do-projeto)
3. [Tour pela estrutura do projeto](#3-tour-pela-estrutura-do-projeto)
4. [Os 5 pilares arquiteturais](#4-os-5-pilares-arquiteturais)
5. [O ciclo de vida de uma partida](#5-o-ciclo-de-vida-de-uma-partida)
6. [Entradas: teclado, gamepad e toque](#6-entradas-teclado-gamepad-e-toque)
7. [Persistência: configurações e ranking](#7-persistência-configurações-e-ranking)
8. [Áudio e texturas procedurais](#8-áudio-e-texturas-procedurais)
9. [Anatomia da GameScene (código comentado)](#9-anatomia-da-gamescene-código-comentado)
10. [Receitas — tarefas comuns passo a passo](#10-receitas--tarefas-comuns-passo-a-passo)
11. [Armadilhas clássicas (e como este projeto as evita)](#11-armadilhas-clássicas--e-como-este-projeto-as-evita)
12. [Estratégia de testes para jogos](#12-estratégia-de-testes-para-jogos)
13. [Checklist de qualidade do seu jogo](#13-checklist-de-qualidade-do-seu-jogo)
14. [Exercícios sugeridos (básico → avançado)](#14-exercícios-sugeridos-básico--avançado)
15. [Glossário](#15-glossário)

---

## 0. Pré-requisitos e como rodar

**Você precisa de:**
- Node.js 20+ (`node -v`)
- Editor (VS Code recomendado)
- Noções de: `const/let`, funções, arrays/objetos, `import/export`, componentes React básicos

**Rodando o projeto:**

```bash
cd Pong-Classico/pong-app
npm install      # primeira vez
npm run dev      # servidor de desenvolvimento → http://localhost:5173
```

**Outros comandos úteis:**

| Comando | O que faz |
|---|---|
| `npm run typecheck` | Só verifica tipos (sem gerar build) |
| `npm run build` | Typecheck + gera `dist/` de produção |
| `npm run test:store` | Testa a lógica de estado (FSM/pontuação/vidas) |
| `npm run test:smoke` | Percorre o fluxo no browser procurando erros |
| `npm run test:e2e` | Partida inteira até game over + ranking |

**Exercício de aquecimento:** rode o jogo, jogue nos 3 níveis e observe o que muda
(velocidade da bola, reação da CPU, multiplicador de pontos). Você vai entender
por que cada um desses valores está onde está ao ler a Seção 4.

---

## 1. Por que React + Phaser? A regra de ouro

### O problema

Jogo 2D tem **duas** camadas muito diferentes:

- **Interface** (menus, HUD, placar, formulários, ranking) → React é excelente nisso:
  componentização, estado declarativo, acessibilidade, CSS.
- **Gameplay** (60 quadros/segundo de física, colisão, input analógico) → precisa de
  um **game loop** dedicado, renderização otimizada e uma engine. Phaser é excelente nisso.

Misturar as duas de forma errada é a causa #1 de jogos React+Phaser lentos e cheios
de bugs (ex.: re-renderizar React a cada frame, ou desenhar menus dentro do canvas).

### A regra de ouro deste projeto

```
┌─────────────────────────────────────────────────────────────────┐
│                        APLICAÇÃO                                │
│                                                                 │
│  ┌──────────────────────┐         ┌──────────────────────────┐  │
│  │   REACT (UI)         │         │   PHASER (GAMEPLAY)      │  │
│  │                      │         │                          │  │
│  │  • Telas/menus       │         │  • GameScene             │  │
│  │  • HUD (placar/vidas)│         │  • Física e colisões     │  │
│  │  • Overlays          │         │  • IA, power-ups         │  │
│  │  • Formulários       │         │  • Renderização 60fps    │  │
│  │                      │         │                          │  │
│  │  LÊ o store ◄────────┼─────────┼──  ESCREVE no store      │  │
│  │        ▲             │         │         │                │  │
│  └────────┼─────────────┘         └─────────┼────────────────┘  │
│           │                                 │                   │
│           └───────────┐   ┌─────────────────┘                   │
│                       ▼   ▼                                     │
│              ┌─────────────────────┐                            │
│              │  STORE (Zustand)    │  ← fonte única de verdade  │
│              │  screen, status,    │                            │
│              │  settings, session  │                            │
│              └─────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

**Regras concretas:**

1. **React nunca** lê o `canvas` nem chama APIs do Phaser diretamente.
2. **Phaser nunca** manipula o DOM da UI (só o próprio canvas).
3. **Todo estado compartilhado** (placar, vidas, pausa, tela atual) vive no **store**.
4. A **única** forma de React "pausar o jogo" é mudar `status` no store;
   a cena simplesmente **deixa de simular** enquanto `status !== 'running'`.

> 💡 **Por que Zustand?** É minúsculo (~1kb), funciona fora do React
> (a cena Phaser chama `useGameStore.getState()` sem problema) e não exige
> Context/Provider. Alternativas válidas: Jotai, Redux Toolkit (mais pesado para este caso).

---

## 2. Stack e configuração do projeto

| Tecnologia | Versão | Papel no projeto |
|---|---|---|
| **Vite** | 8.x | Bundler/dev server (HMR instantâneo) |
| **React** | 19.x | Tela inicial, menus, HUD, overlays, ranking |
| **TypeScript** (strict) | 7.x | Tipagem de todo o domínio (Settings, Session…) |
| **Phaser** | 4.x | Engine 2D: cena, game loop, input, renderização |
| **Zustand** | 5.x | Store compartilhado React ⇄ Phaser |
| **playwright-core** (dev) | — | Testes de browser (smoke + e2e) |

### Arquivos de configuração que importam

**`tsconfig.json`** — destaques:

```jsonc
{
  "strict": true,          // te obriga a pensar em estados impossíveis
  "noUnusedLocals": true,  // nada de variável morta
  "moduleResolution": "bundler"  // import sem extensão, como o Vite espera
}
```

**`vite.config.ts`** — o servidor precisa aceitar o host do preview e escutar
em todas as interfaces:

```ts
server: {
  host: true,          // 0.0.0.0 — obrigatório no ambiente de preview
  port: 5173,
  allowedHosts: true,  // aceita host externo (proxy do preview)
}
```

**`index.html`** — ponto de entrada único; o React monta em `#root`:

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

> 🧪 **Dica didática:** quebre o `strict` por 5 minutos (`"strict": false`),
> tente compilar e veja quantas classes de bugs o TypeScript estava escondendo.
> Depois volte. Isso ensina o valor do tipo em jogos (onde estado inválido =
> partida corrompida).

---

## 3. Tour pela estrutura do projeto

```
pong-app/
├── index.html                  # entrada HTML (lang pt-BR, favicon)
├── vite.config.ts              # config do dev server/build
├── tsconfig.json               # TypeScript em modo estrito
├── public/favicon.svg          # favicon procedural (SVG)
│
├── src/
│   ├── main.tsx                # bootstrap: ReactDOM + importa estilos
│   ├── App.tsx                 # ROTEADOR: qual tela renderizar
│   ├── styles.css              # identidade visual inteira (retro-neon)
│   ├── types.ts                # ⭐ tipos de domínio (Settings, Session, Screen…)
│   │
│   ├── store/
│   │   └── useGameStore.ts     # ⭐⭐ STORE: FSM de telas + partida + ações
│   │
│   ├── game/                   # ===== MUNDO PHASER =====
│   │   ├── scenes/GameScene.ts # ⭐⭐ coração: física, colisões, IA, gols
│   │   ├── entities/Paddle.ts  # paleta (retângulo + buffs temporários)
│   │   ├── entities/Ball.ts    # bola (velocidade, rastro, slow)
│   │   ├── modes.ts            # dados das 6 modalidades (data-driven!)
│   │   ├── difficulty.ts       # níveis: IA, velocidades, multiplicador
│   │   ├── constants.ts        # geometria + fórmula de pontuação
│   │   ├── sfx.ts              # sons sintetizados (WebAudio, sem assets)
│   │   └── textures.ts         # texturas geradas por Graphics
│   │
│   ├── components/             # ===== MUNDO REACT =====
│   │   ├── TitleScreen.tsx     # tela inicial
│   │   ├── MainMenu.tsx        # modos + nível + vidas + resumo
│   │   ├── ControlsScreen.tsx  # teclado/gamepad/teste de entrada
│   │   ├── RankingScreen.tsx   # top 10
│   │   ├── GameScreen.tsx      # orquestra HUD + canvas + overlays + atalhos
│   │   ├── PhaserGame.tsx      # ⭐ ponte: cria/destrói o Phaser.Game
│   │   ├── Hud.tsx             # placar, vidas, cronômetro, pausa
│   │   ├── PauseOverlay.tsx    # pausa
│   │   ├── GameOverScreen.tsx  # resultado + formulário do ranking
│   │   └── labels.ts           # textos derivados do estado (VOCÊ/CPU…)
│   │
│   └── services/
│       ├── ranking.ts          # CRUD do ranking (localStorage)
│       └── storage.ts          # acesso seguro ao localStorage
│
├── tests/
│   ├── store.test.ts           # unit: FSM/pontuação/vidas em Node puro
│   ├── smoke.mjs               # e2e: fluxo completo sem erros de console
│   └── gameover.mjs            # e2e: partida → game over → ranking
│
└── shots/                      # screenshots gerados pelos testes
```

**Legendas:** ⭐ = arquivos que você vai ler primeiro; ⭐⭐ = os dois mais importantes.

**Ordem de leitura sugerida:**
`types.ts` → `useGameStore.ts` → `PhaserGame.tsx` → `GameScene.ts` →
`App.tsx` + qualquer tela de `components/` → `modes.ts`/`difficulty.ts`.

---

## 4. Os 5 pilares arquiteturais

Estes 5 padrões sustentam o jogo todo. Se você entende-los, consegue construir
qualquer jogo 2D similar.

### Pilar 1 — Store único como ponte (comunicação ⇄)

**Problema:** React e Phaser rodam em mundos distintos. Como o HUD sabe o placar
que a cena acabou de calcular? Como a cena sabe que o usuário apertou "Pausar"?

**Solução:** o store é a **biblioteca central**. Quem calcula, escreve; quem exibe, lê.

*Cena escrevendo (evento de gol) — `GameScene.ts`:*

```ts
private onGoal(scorer: Side, ballY: number): void {
  const { addGoal } = useGameStore.getState();   // leitura síncrona
  const { gameOver } = addGoal(scorer);          // DOMÍNIO: pontua + remove vida
  if (gameOver) { this.phase = 'over'; /* confete */ }
  else { this.startServe(/* ... */); }
}
```

*Store aplicando a regra de negócio — `useGameStore.ts`:*

```ts
addGoal: (scorer) => {
  const mult = MULTIPLIER[get().settings.difficulty];
  set((s) => {
    const gol = { ...s.session[scorer] };
    gol.goals += 1;
    gol.score += SCORING.goal * mult;       // +10 × nível

    const sofreu = { ...s.session[conceeded] };
    sofreu.lives = Math.max(0, sofreu.lives - 1);  // −1 vida

    const gameOver = sofreu.lives <= 0;
    return { session: { ...s.session, [scorer]: gol, [conceeded]: sofreu,
                        winner: gameOver ? scorer : null },
             status: gameOver ? 'over' : s.status };
  });
  return { gameOver: get().status === 'over' };  // devolve o desfecho à cena
},
```

*React lendo (HUD) — `Hud.tsx`:*

```tsx
const session = useGameStore((s) => s.session);   // re-render só quando muda
const status  = useGameStore((s) => s.status);
// ...
<div className="hud-score green">{session.p1.score}</div>
```

**Regras de ouro do store:**
- ❌ Nunca manter cópia do placar/vidas em `useState` do React — é **derivado**.
- ✅ Cada fatia tem **1 mutador** claro (`addGoal`, `setPaused`, `startMatch`…).
- ✅ Ações devolvem resultados ao chamador quando a cena precisa reagir
  (ex.: `addGoal` → `{ gameOver }`).

---

### Pilar 2 — Máquina de estados (FSM) para TELA e PARTIDA

**Problema:** "Estou em pausa? Em game over? Posso pontuar agora?" — condicionais
soltas pelo código viram bugs (o jogo original tinha `alert()` + `setTimeout` que
disparavam 3× seguidas).

**Solução:** estados explícitos, transições controladas, qualquer código pergunta
ao estado antes de agir.

```
TELAS (screen)                    PARTIDA (status)
─────────────                     ─────────────────
  title                             running ◄──► paused
    │                                 ▲              │
    ▼                                 │              ▼
  menu ──► controls / ranking         └──── over ◄───┘
    │                                 (fim de jogo)
    ▼
  game ─────────────────────────────► (sai para menu)
```

*Transições centralizadas — `useGameStore.ts`:*

```ts
togglePause: () => {
  const { screen, status } = get();
  if (screen !== 'game') return;                 // guarda: só na partida
  if (status === 'running') set({ status: 'paused' });
  else if (status === 'paused') set({ status: 'running' });
},

startMatch: () => set({                          // rematch: 1 clique, tudo novo
  screen: 'game', status: 'running',
  matchId: get().matchId + 1,                    // sinal para reiniciar a cena
  session: freshSession(get().settings.lives),
}),
```

*E a cena OBEDECE todo frame — `GameScene.update`:*

```ts
update(time: number, delta: number): void {
  const { status } = useGameStore.getState();
  if (status === 'paused') return;   // pausa real: NADA simula nem redesenha
  // ...
  if (status === 'running') this.simulate(time, dt);
}
```

**Vantagem:** pausar **não** é cancelar `requestAnimationFrame`, não é parar
`setTimeout`, não é `alert()` — é simplesmente **não simular**. Testável, previsível.

---

### Pilar 3 — Ciclo de vida do Phaser (criar ▸ rodar ▸ destruir)

O Phaser tem seu próprio loop. Seu papel é **nunca deixar estado órfão**.

```tsx
// PhaserGame.tsx — o ciclo COMPLETO, em 30 linhas
useEffect(() => {
  const game = new Phaser.Game({          // ① CRIA
    type: Phaser.AUTO,
    width: W, height: H,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [GameScene],
  });

  // ② OBSERVA o store: matchId mudou → reinicia a cena (rematch)
  const unsub = useGameStore.subscribe((state, prev) => {
    if (state.matchId !== prev.matchId) {
      game.scene.getScene('Pong')?.scene.restart();
    }
  });

  return () => {                          // ③ DESTRÓI ao desmontar
    unsub();
    game.destroy(true);
  };
}, []);
```

**Por que `scene.restart()` e não criar jogo novo?** Reiniciar a Scene re-executa
`create()` do zero (display list limpo) e é barato. Por isso **`create()` deve
recriar TUDO e descartar referências antigas**:

```ts
create(): void {
  // A instância da Scene sobrevive ao restart → zera ponteiros do ciclo anterior
  this.balls = []; this.obstacles = []; this.powerUps = [];
  this.particles = []; this.p1Ups = []; /* ...teclas... */
  // ...então constrói do zero (paddles, campo, saque inicial)
}
```

> ⚠️ **Armadilha #1 (StrictMode):** em desenvolvimento, o React 19 monta→desmonta→
> remonta efeitos. Sem o `destroy(true)` no cleanup, você teria **dois** jogos
> rodando. Teste: abra o console e veja um único log de inicialização.

---

### Pilar 4 — Delta-time + sub-stepping (movimento justo)

**Problema:** o código original movia `player.y -= 6` **por quadro**. Em um monitor
de 144Hz o jogo roda 2,4× mais rápido que em 60Hz. Jogabilidade dependente de
hardware é um bug clássico.

**Solução:** velocidade em **pixels/segundo**, multiplicada pelo **delta** (tempo
desde o último quadro, em segundos):

```ts
const dt = Math.min(delta, 50) / 1000;   // nunca mais de 50ms (aba 1s no background)
this.p1.y += p1Dir * speed * dt;          // speed = 440 px/s → 440·dt por quadro
```

**Sub-stepping** resolve o segundo problema (a bola "atravessar" a paleta em
altas velocidades): em vez de dar UM pulo grande, divide em passos de no máx. 6px:

```ts
// GameScene.moveBalls
const travel = Math.max(Math.abs(ball.vx), Math.abs(ball.vy)) * dt;
const steps  = Math.max(1, Math.ceil(travel / 6));  // ex.: 680px/s·0.016s ≈ 11px → 2 passos
const stepDt = dt / steps;

for (let s = 0; s < steps; s++) {
  ball.x += ball.vx * stepDt;
  ball.y += ball.vy * stepDt;
  this.wallAndPaddleChecks(ball);   // colisão checada EM CADA PASSO
}
```

**Regra geral:** *toda colisão é checada entre positions pequenas; velocidade
máxima × dt nunca deve exceder a menor dimensão do menor objeto colididor.*

---

### Pilar 5 — Eventos > temporizadores (zero `setTimeout` no loop)

**Problema (do projeto original):** power-ups agendados com `setTimeout` morriam
se o jogador pausasse; vitória via `setTimeout` + `alert()` disparava 3×.

**Solução:** tudo que acontece "depois de um tempo" vira **acumulador de delta**
dentro do loop — que pausa junto com o jogo, por construção:

```ts
// Spawn de power-up: um "cronômetro" que só corre quando está rodando
private powerUpTimer: number = POWERUP.spawnMin;   // 8s

// dentro de updatePowerUps(dt):
this.powerUpTimer -= dt;
if (this.powerUpTimer <= 0) {
  this.powerUpTimer = POWERUP.spawnMin + Math.random() * POWERUP.spawnVar;
  if (this.powerUps.length < POWERUP.maxOnField) this.spawnPowerUp();
}
```

O mesmo padrão serve para: saque (`serveTimer`), duração de power-ups
(`slowRemaining` no objeto Ball), efeito de buff (`boostUntil = clock + 8`).

**Critério de decisão:**

| Situação | Use |
|---|---|
| Algo dentro da simulação (spawn, buff, serve) | Acumulador de `dt` no loop ✅ |
| Algo da UI fora da partida (toast, debounce de rede) | `setTimeout` do React ok |
| Nunca | `setTimeout` que **muta estado do jogo** ❌ |

---

## 5. O ciclo de vida de uma partida

Fluxo completo do clique em "INICIAR" até o ranking:

```
[MainMenu] clique ▶ INICIAR
    │
    ├─ sfx.unlock()            → destrava o AudioContext (gesto do usuário)
    ├─ startMatch()            → store: screen='game', status='running',
    │                            session=fresh(lives), matchId++
    ▼
[GameScreen monta]  →  [PhaserGame cria Phaser.Game]
    │
    ├─ GameScene.create()      → lê settings do store, constrói campo/paddles,
    │                            inicia FASE 'serve' (1,5s, "PREPARE-SE")
    ▼
 loop: update(time, delta)     ── status!=='running'? ──► congelado
    │
    ├─ handleInput(dt)         → teclado + gamepad + pointer (e clamp nos limites)
    ├─ fase serve  → serveTimer -= dt;  ao zerar: launch() → fase 'play'
    ├─ fase play   → elapsed += dt (cronômetro), buffs, power-ups,
    │                moveBalls(dt) [sub-stepping + colisões]
    │                     │
    │                     ├─ acerto na paleta → deflect() → addHit(side)
    │                     ├─ bola cruza a borda → onGoal(scorer)
    │                     │       ├─ addGoal() → placar+, vida−
    │                     │       ├─ gameOver? → phase='over' + confete + sfx
    │                     │       └─ senão → startServe(perdedor) → fase 'serve'
    │                     └─ power-up coletado → applyPowerUp(dono = lastHitBy)
    ▼
[status='over']  →  GameOverScreen monta (React)
    │
    ├─ jogador digita nome → addEntry() → ranking.ts → localStorage
    ├─ 🔄 Jogar novamente → startMatch() → matchId++ → cena reinicia
    └─ 🏠 Menu             → setScreen('menu') → PhaserGame DESMONTA (destroy)
```

**Detalhes que valem notar:**
- O **tempo de jogo** (`elapsed`) só avança na fase `play` — saques e pausas não contam.
- O **relógio de efeitos** (`clock`) avança em serve+play, mas pausa em `paused`.
- ** quem perde o gol serve a bola** (retorno justo, como tênis).
- O **dono do power-up** é `ball.lastHitBy` — quem sustentou o rally, não "o mais perto".

---

## 6. Entradas: teclado, gamepad e toque

### Teclado — padrão do projeto

```ts
// GameScene.setupKeys — esquema configurável VINDO DO STORE
const mk = (code: number) => kb.addKey(code, false);  // false = NÃO capturar
                                                     // (evita travar inputs de texto)
if (p1Scheme === 'wasd' || p1Scheme === 'both') { p1Ups.push(mk(KC.W)); /* S */ }
if (p1Scheme === 'arrows' || p1Scheme === 'both') { p1Ups.push(mk(KC.UP)); /* DOWN */ }
```

`anyDown(lista)` aceita **várias teclas** para o mesmo eixo — é assim que o
esquema "W/S **+** Setas" funciona sem duplicar lógica.

### As 3 regras de input que todo jogo web precisa

| Regra | Implementação | Onde |
|---|---|---|
| ① Setas não podem rolar a página **durante** o jogo… | `preventDefault` escopado à tela de jogo | `GameScreen.tsx` |
| ② …mas precisam funcionar **dentro** de `<input>` | checagem `tagName === 'INPUT'` antes de impedir | idem |
| ③ Tecla pressionada não pode "grudar" ao perder foco | auto-pause no `blur`/`visibilitychange` | idem |

```ts
// Regra ① + ② (trecho)
const onKey = (e: KeyboardEvent) => {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
  const t = e.target;
  if (t instanceof HTMLElement && (t.tagName === 'INPUT' || t.isContentEditable)) return;
  e.preventDefault();   // só aqui fora, as setas ficam presas ao jogo
};
window.addEventListener('keydown', onKey, { passive: false });
```

### Gamepad (Gamepad API nativa, sem biblioteca)

```ts
// Polling a cada frame — API de gamepad é "fatia instantânea", não eventos
const pads = navigator.getGamepads?.() ?? [];
p1Dir = clampDir(p1Dir + padAxis(pads[0]));  // analógico Y + D-pad (botões 12/13)

function padAxis(pad) {
  const ay = pad.axes?.[1] ?? 0;
  let v = Math.abs(ay) > 0.2 ? ay : 0;      // zona morta
  if (pad.buttons?.[12]?.pressed) v = -1;   // D-pad cima
  if (pad.buttons?.[13]?.pressed) v = 1;    // D-pad baixo
  return v;
}
```

A `ControlsScreen` só **exibe** o que `navigator.getGamepads()` devolve a cada
600ms — sem estado duplicado.

### Toque/pointer (bônus mobile)

```ts
// Metade esquerda do campo controla P1; direita, P2 (modo 2 jogadores)
const p = this.input.activePointer;
if (p.isDown && p.worldY >= 0 && p.worldY <= H) {
  if (p.worldX < W / 2) this.p1.y = p.worldY - this.p1.heightAt(clock) / 2;
  else if (!this.mode.cpu) this.p2.y = p.worldY - /* ... */;
}
```

`pointer.worldX/Y` já vem **convertido para as coordenadas do jogo (800×400)**
mesmo com o canvas escalado — jamais faça conta com `clientX` cru.

---

## 7. Persistência: configurações e ranking

Padrão do projeto: **serviço fino + fallback em memória**.

```ts
// services/storage.ts — o localStorage pode NÃO existir (iframe/sandbox/teste)
export function lsGet(key: string): string | null {
  try { return window.localStorage.getItem(key); }
  catch { return memory.get(key) ?? null; }   // Map em memória como plano B
}
```

**Ranking (`services/ranking.ts`)** — pontos de design valiosos:

```ts
export function addEntry(entry) {
  const ranking = sortEntries([...getRanking(), full]).slice(0, 10); // top 10
  lsSet(KEY, JSON.stringify(ranking));
  return { rank: index + 1, ranking };       // posição para a UI mostrar "#1!"
}

// Ordenação: pontuação DESC; empate → partida mais antiga primeiro
sortEntries = (e) => [...e].sort((a, b) =>
  b.score !== a.score ? b.score - a.score : a.date.localeCompare(b.date));
```

E o **validador** evita que dados corrompidos quebrem a tela:

```ts
function isValidEntry(v: unknown): v is RankEntry {   // type guard!
  return !!v && typeof v === 'object'
    && typeof (v as any).score === 'number' /* ...campos obrigatórios... */;
}
```

**Configurações** usam o mesmo serviço com **merge sobre defaults** — adicionar
um campo novo no futuro não quebra partidas salvas:

```ts
function loadSettings(): Settings {
  const raw = lsGet(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };  // defaults + o que existir
}
```

---

## 8. Áudio e texturas procedurais

### Sons sem um único arquivo de áudio

`sfx.ts` usa a **WebAudio API**: um `OscillatorType` + envelope de ganho:

```ts
function tone(freq, duration = 0.06, wave = 'square', volume = 0.05, delay = 0) {
  const ac = audio();                         // AudioContext singleton (lazy)
  if (ac.state === 'suspended') void ac.resume();  // política de autoplay
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = wave;  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);   // ataque
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration); // decaimento
  osc.connect(gain);  gain.connect(ac.destination);
  osc.start(t0);  osc.stop(t0 + duration + 0.02);
}

export const sfx = {
  wall()    { tone(200, 0.05); },                    // quique grave
  paddle()  { tone(440, 0.06); },                    // rally médio
  goal()    { tone(150, 0.16, 'sawtooth', 0.06); tone(90, 0.24, 'sawtooth', 0.05, 0.1); },
  win()     { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, 'square', 0.05, i * 0.12)); },
  // unlock() chama resume() — chamado no clique do usuário ANTES do jogo começar
};
```

**Enquadramento didático:** áudio precisa de **gesto do usuário** para começar.
Por isso `startMatch()` chama `sfx.unlock()` — nunca tente tocar som em `DOMContentLoaded`.

### Texturas procedurais

Sem assets binários, tudo é gerado na partida:

```ts
// textures.ts — um quadradinho branco vira a textura das partículas
const g = scene.add.graphics();
g.fillStyle(0xffffff, 1);
g.fillCircle(4, 4, 4);
g.generateTexture('spark', 8, 8);   // "desenha uma vez", reusa para sempre
g.destroy();
```

Paddles/bola são **GameObjects prontos** (`add.rectangle`, `add.circle`) — nem
textura precisam. Partículas e rastro são um `Graphics` redesenhado por frame.

---

## 9. Anatomia da GameScene (código comentado)

Estrutura de `src/game/scenes/GameScene.ts` — seu mapa de navegação:

```ts
export class GameScene extends Phaser.Scene {
  // ── ESTADO (todo mundo lê daqui durante a partida) ──────────────
  settings/mode/diff   // cópias do store lidas no create()
  p1, p2: Paddle       // entidades
  balls[], obstacles[] // dinâmicos (recriados por restart/saque)
  phase: 'serve'|'play'|'over'   // micro-estado INTERNO da simulação
  clock                 // relógio de efeitos (pausa em 'paused')
  elapsed               // tempo de jogo válido (só em 'play')

  // ── LIFECYCLE ───────────────────────────────────────────────────
  create()     // zera ponteiros → lê store → campo → paddles → saque
  update(t,d)  // guarda 'paused' → partículas → simulate() → desenha FX

  // ── SIMULAÇÃO ───────────────────────────────────────────────────
  simulate()      // clock+=dt → handleInput → serve/play → elapsed/cronômetro
  handleInput()   // teclado ∥ gamepad ∥ pointer → move + clampAndSync
  updateAI()      // chase | track | predict (por nível)
  moveBalls()     // sub-stepping → paredes → obstáculos → paddles → gols
  deflect()       // ângulo pelo ponto de impacto (±55°) + addHit + partículas
  onGoal()        // addGoal() do store → serve OU fim de jogo
  updatePowerUps()// acumulador de spawn + rotação/pulso
  applyPowerUp()  // speed | size | slow | extra (efeitos via clock/estado)

  // ── RENDER ──────────────────────────────────────────────────────
  drawFx()        // linha central animada + rastros + partículas (1 Graphics)
  burst()         // partículas manuais (array + life em segundos)
}
```

**Convenções de render do projeto:**
- `depth` numérico: 0 FX · 1 obstáculos · 2 power-ups · 3 glow · 4 paletas · 5 bola · 6 texto.
- Tudo que é GameObject é **posicionado**; o `Graphics` do FX é **redesenhado**.
- Ordem de desenho = profundidade; nunca dependa da ordem de criação.

---

## 10. Receitas — tarefas comuns passo a passo

> Cada receita aponta os arquivos **reais** do projeto. Faça, rode `npm run dev`
> e teste. Ao final, rode `npm run typecheck`.

### 🍳 Receita 1 — Adicionar um novo modo de jogo (data-driven)

O projeto é **data-driven**: modos são **dados**, não código. Um modo novo que
só combina features existentes **não toca a cena**.

**Exemplo: modo "Caos" = multi-bola + obstáculos + power-ups.**

1. **`src/types.ts`** — estenda a união:

```ts
export type ModeId = 'classic' | /* ...existantes... */ | 'chaos';
```

2. **`src/game/modes.ts`** — adicione a entrada (o `MODE_MAP` é gerado por `reduce`,
   e o menu renderiza `MODES.map(...)` — ambos atualizam **sozinhos**):

```ts
{
  id: 'chaos',
  name: 'Caos',
  icon: '🌪️',
  description: 'Multi-bola + obstáculos + power-ups ao mesmo tempo',
  cpu: true,
  initialBalls: 3,
  obstacles: true,
  powerUps: true,
  speedRamp: false,
},
```

3. Teste: o card aparece no menu, o HUD mostra o nome, a cena liga as três
   features pelos flags. **Typecheck deve passar sem tocar em nenhum componente.**

Se o modo exigir comportamento **novo** (ex.: paredes que se movem), aí sim:
crie um flag no `ModeDef` (ex.: `movingWalls: boolean`) e um bloco na cena
guiado por esse flag — mantendo a lógica **fora** dos componentes React.

---

### 🍳 Receita 2 — Adicionar um novo power-up ("Shrink": paleta do adversário menor)

1. **`src/game/scenes/GameScene.ts`** — inclua no união de tipo e nos defs:

```ts
type PowerUpType = 'speed' | 'size' | 'slow' | 'extra' | 'shrink';

// em POWERUP_DEFS:
{ type: 'shrink', color: 0xff9f43, icon: '🔻', label: 'Paleta inimiga menor' },
```

2. **`src/game/entities/Paddle.ts`** — novo buff com o MESMO padrão de clock
   (assim pausa junto e expira sozinho):

```ts
shrinkUntil = -1;

heightAt(clock: number): number {
  if (clock < this.sizeBoostUntil) return PADDLE_BOOST_H;
  if (clock < this.shrinkUntil) return 60;      // ← novo
  return this.baseHeight;
}
```

> Note: `clampAndSync` **já** usa `heightAt` — limite do campo e colisão
> se ajustam automaticamente. Esse é o ganho de centralizar a regra.

3. **`applyPowerUp`** — aplique ao **adversário** do dono:

```ts
case 'shrink': {
  const alvo = side === 'p1' ? this.p2 : this.p1;
  alvo.shrinkUntil = clock + POWERUP.buffDuration;
  alvo.clampAndSync(clock);
  break;
}
```

4. (Opcional) torne `shrinkUntil` visível no HUD lendo `session`… ou mantenha
   só no canvas — decisão de UX sua.

---

### 🍳 Receita 3 — Adicionar uma nova tela (ex.: "Como Jogar")

1. **`src/types.ts`** — novo valor de tela:

```ts
export type Screen = 'title' | 'menu' | 'controls' | 'ranking' | 'game' | 'howto';
```

2. **`src/components/HowToScreen.tsx`** — componente puro, padrão das outras telas:

```tsx
export function HowToScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  return (
    <section className="screen">
      <header className="menu-header">
        <h1>📖 Como Jogar</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => setScreen('menu')}>← Menu</button>
      </header>
      {/* conteúdo */}
    </section>
  );
}
```

3. **`src/App.tsx`** — roteie (React é o dono do roteamento):

```tsx
{screen === 'howto' && <HowToScreen />}
```

4. **`src/App.tsx`** — atalho Esc já tratado no efeito existente: acrescente
   `'howto'` à condição que volta para `menu`.

5. Entry point: um botão no `MainMenu` (`onClick={() => setScreen('howto')}`).

---

### 🍳 Receita 4 — Enviar mais um dado ao ranking (ex.: tempo da partida)

O ranking já tem `score/goals/hits/mode/difficulty/lives/date`. Vamos adicionar `time`:

1. **`services/ranking.ts`** — campo na interface + no type guard:

```ts
export interface RankEntry { /* ... */ time: number; }   // segundos

// em isValidEntry:
&& typeof e.time === 'number'
```

2. **`components/GameOverScreen.tsx`** — passe na chamada:

```ts
addEntry({ /* ... */, time: session.timeSeconds });
```

3. **`components/RankingScreen.tsx`** — coluna na tabela:

```tsx
<th>Tempo</th>
/* ... */
<td>{formatTime(e.time)}</td>   // importe formatTime de ./labels
```

4. **Compatibilidade:** entradas antigas sem `time` caem fora do type guard e são
   **descartadas** com segurança (ranking pode ficar vazio — teste e decida se
   vale migrar dados antigos).

---

### 🍳 Receita 5 — Novo nível (ex.: "Insano" ×4)

Dois pontos que **devem** ficar em sincronia (lição de single source of truth):

1. **`src/game/difficulty.ts`** — definição completa:

```ts
insane: { id: 'insane', name: 'Insano', blurb: 'Sem misericórdia', multiplier: 4,
  ballSpeed: 420, ballMax: 760, playerSpeed: 460, cpuSpeed: 450,
  aiMode: 'predict', aiDeadzone: 5 },
// + 'insane' no DIFFICULTY_ORDER
```

2. **`src/game/constants.ts`** — `MULTIPLIER` (é de lá que o STORE lê):

```ts
export const MULTIPLIER = { easy: 1, medium: 2, hard: 3, insane: 4 };
```

3. O menu itera `DIFFICULTY_ORDER` — o card aparece sozinho; **as vidas/vidas
   não mudam**, pois vidas são configuração separada. Teste uma partida e confira
   o multiplicador no HUD e na fórmula do game over.

> 🧠 **Reflexão didática:** por que `MULTIPLIER` existe em `constants.ts` se
> `DifficultyDef` já tem `multiplier`? Hoje os dois precisam ser editados juntos —
> em um refactor, importe `DIFFICULTIES` em `constants.ts` e derive
> `MULTIPLIER` de lá. Procure eliminar cópias sempre que notar uma.

---

### 🍳 Receita 6 — Novo som e onde tocá-lo

```ts
// sfx.ts — um "pifi" agudo no saque
serve() { tone(700, 0.05, 'sine', 0.04); tone(950, 0.06, 'sine', 0.03, 0.06); },
```

```ts
// GameScene.launch() — no momento em que a bola sai
private launch(): void {
  /* ...cálculo de velocidades... */
  sfx.serve();          // ← aqui
  this.phase = 'play';
}
```

**Onde tocar o quê (guia rápido):** colisão = tom curto e seco · gol = sequência
descendente · vitória = arpejo ascendente · UI = tom baixo e discreto.
Nunca pare o jogo para tocar — sons são **chamados durante o evento**, sem espera.

---

### 🍳 Receita 7 — Build e publicação

```bash
npm run build     # gera dist/ (typecheck + vite build)
npm run preview   # confere o build localmente
```

- O `dist/` é **estático**: sirva em Netlify/Vercel/GitHub Pages/qualquer nginx.
- SPA sem rotas no servidor — se usar paths internos, ajuste `base` no `vite.config.ts`.
- Tamanho: o Phaser pesa ~1,5MB (438KB gzip) — **normal**; para mobile crítico,
  investigue code-splitting dinâmico do Phaser (tópico avançado).

---

## 11. Armadilhas clássicas (e como este projeto as evita)

Cada linha é um bug que existiu na versão original (JS puro) e virou **padrão**
na refatoração. Estude a coluna "Padrão aplicado" — é o coração do curso:

| # | Armadilha | Sintoma típico | Padrão aplicado aqui |
|---|---|---|---|
| 1 | `alert()` dentro do loop de jogo | Congela a tela; dispara N vezes | FSM `status='over'` + overlay React |
| 2 | `setTimeout` mutando estado do jogo | Timer morre ao pausar/reiniciar | Acumulador de `dt` no loop |
| 3 | Lógica de "quem perdeu" espalhada | Reset duplicado, pontos fantasma | **1 mutador por evento** no store |
| 4 | Velocidade por quadro (`-= 6`) | Jogo 2,4× mais rápido em 144Hz | `px/segundo × delta` |
| 5 | Colisão só por frame (sem sair do objeto) | Múltiplos hits/quadro, blocos "estouram" | Push-out (repositciona) + evento único |
| 6 | Bola muito rápida atravessa a paleta | Ponto "injusto" | Sub-stepping (passos ≤ 6px) |
| 7 | `keyup` perdido ao trocar de janela | Paleta andando sozinha | Auto-pause no `blur`/`visibilitychange` |
| 8 | Setas sem `preventDefault` | Página rola durante a partida | Prevenção **escopada** à tela de jogo |
| 9 | Estado do jogo copiado em `useState` React | HUD dessincronizado da cena | Store único, React só **deriva** |
| 10 | Criar `Phaser.Game` sem destruir | Dois loops rodando (StrictMode/HMR) | `destroy(true)` no cleanup do efeito |
| 11 | `scene.restart()` sem limpar ponteiros | `destroy()` em objeto já destruído → crash | `create()` zera arrays **antes** de reconstruir |
| 12 | Ler `localStorage` direto | Tela branca em iframe/sandbox | Serviço com try/catch + fallback em memória |
| 13 | Som disparado sem gesto | AudioContext `suspended` = silêncio | `sfx.unlock()` no clique de iniciar |
| 14 | Div clicável como "botão" | Inacessível (teclado/leitor de tela) | `<button role="radio" aria-checked>` |
| 15 | Regras de pontuação duplicadas (UI ≠ jogo) | Placar não bate com a fórmula | `SCORING`/`MULTIPLIER` em **1 arquivo** |

**Exercício didático:** para cada linha, escreva em uma frase *como* o padrão
resolve. Se travar, o código apontado na coluna "aqui" é a resposta.

---

## 12. Estratégia de testes para jogos

Jogos são difíceis de testar porque misturam **lógica pura**, **tempo** e **render**.
A estratégia deste projeto isola as três:

### Camada 1 — Lógica pura (rápida, roda a cada save)

`tests/store.test.ts` — FSM, pontuação, vidas, pausa, rematch… **sem browser**.

```bash
npm run test:store
# ✅ store.test: 10/10 asserções passaram
```

Como roda em Node: o store não importa React/Phaser — só Zustand + tipos.
**Ensino:** *quanto mais lógica estiver FORA da cena, mais barata fica a testagem.*

```ts
store().addGoal('p1');
assert.equal(store().session.p2.lives, 2, 'P2 perde 1 vida');
```

### Camada 2 — Smoke de browser (regressão de UI)

`tests/smoke.mjs` — abre o jogo, clica no fluxo todo e **falha se qualquer
`console.error`/`pageerror` aparecer**:

```
title → menu → seleciona modo/nível/vidas → controles → partida
      → pausa/retoma → reinicia → menu → ranking
```

```bash
npm run test:smoke   # requer Chromium + playwright-core
```

**Padrão valioso:** após cada interação crítica, **valide o DOM esperado** —
não só a ausência de erros:

```ts
const heartCount = await page.locator('.hud-side.left .heart').count();
if (heartCount !== 3) fail(`corações = ${heartCount}, esperado 3`);
```

### Camada 3 — E2E de regra de jogo

`tests/gameover.mjs` — leva o jogo ao **fim real** (vidas=1), salva no ranking,
recarrega a página e confere persistência. Testa a **história completa**.

```bash
npm run test:e2e
```

**Dica de ouro capturada nesses testes:** screenshots podem capturar **estado de
transição** (meio de uma animação). Valide estado via DOM **e** espere a animação
(`waitForTimeout(400)`) antes de fotografar — senão sua "prova visual" mente.

### Quando escrever qual

| Tipo | Escreva quando… | Não gaste tempo se… |
|---|---|---|
| Store/unit | A regra de negócio muda (pontos, vidas, power-ups) | É só reposicionar um elemento |
| Smoke | Você adicionou tela/fluxo novo | Mudança é 100% dentro da cena já coberta |
| E2E | Fechou um ciclo completo (partida→ranking) | Estourefazendo a mesma corrida 10× |

---

## 13. Checklist de qualidade do seu jogo

Antes de dizer "está pronto" (use como PR do seu projeto):

**Estado & arquitetura**
- [ ] Todo estado compartilhado vive em 1 store; React não guarda cópia
- [ ] Existe FSM explícita para tela E para partida
- [ ] Zero `setTimeout`/`alert` mutando estado de jogo
- [ ] Zero efeitos colaterais dentro da física (cena só emite eventos)

**Gameplay**
- [ ] Movimento em `px/s × delta` — testado em 60Hz **e** com throttle de CPU
- [ ] Nenhuma colisão depende de FPS (sub-stepping onde a bola é rápida)
- [ ] Pausa pausa **tudo**: simulação, buffs, spawns e cronômetro
- [ ] Reiniciar/partida nova não vaza timers, listeners ou objetos Phaser

**Input & UX**
- [ ] Teclas não grudam ao perder o foco; setas não rolam a página
- [ ] Inputs de texto continuam recebendo setas/backspace com normalidade
- [ ] Auto-pause ao ocultar a aba
- [ ] Todo botão utilizável por teclado (teste só com Tab + Enter)
- [ ] Funciona com gamepad desconectado no meio da partida

**Dados**
- [ ] `localStorage` acessado com try/catch
- [ ] Dados lidos validados (type guards) antes de renderizar
- [ ] Configurações novas sobrevivem a saves antigos (merge de defaults)

**Qualidade**
- [ ] `npm run typecheck` limpo · `npm run build` OK
- [ ] Testes verdes · console do browser limpo no fluxo feliz
- [ ] README executa de verdade (copie/cole em outra máquina)

---

## 14. Exercícios sugeridos (básico → avançado)

### 🟢 Básico (consolida os pilares)

1. **Cores do modo** — mude a cor da paleta do Jogador 1 para azul usando apenas
   `COLOR_HEX`/`constants.ts`. *Pratica: single source of verdade.*
2. **Vida extra por acerto** — a cada 5 rallys, devolva 1 vida (teto = vidas iniciais).
   Onde entra? `addHit` no store. *Pratica: regra de negócio no mutador certo.*
3. **Novo som** — adicione som no saque (Receita 6).
4. **Contador regressivo** — em vez de "PREPARE-SE", mostre `3…2…1` na fase serve
   (dica: `Math.ceil(serveTimer)` no texto). *Pratica: fase serve + draw por frame.*

### 🟡 Intermediário (projecta sozinho)

5. **Modo "Espelhado"** — paletas trocam de lado (esquerda = CPU).
   *Receita 1 + um branch no `create()`.*
6. **Power-up "Empurrão"** — `force` dá um boost momentâneo na bola na direção
   do dono (estude `deflect()` como referência de física).
7. **Tela de opções de áudio** — toggle de mute persistido no `settings`
   (dica: um flag em `sfx.ts` lido pelo store). *Pratica: Recetas 3 + 7.*
8. **Gráficos de ranking** — barras proporcionais aos scores na tabela.
   *Pratica: derivar dado da UI sem tocar no jogo.*

### 🔴 Avançados (engenharia de verdade)

9. **IA com máquina de estados** — estados `defende/ataca/recua` com transições
   por probabilidade; compare com o `predict` atual.
10. **Multiplayer online** — transforme `addHit/addGoal` em ações que vão/venham
    de um servidor (WebSocket) mantendo o store como espelho local.
    *Discuta: o que fica autoritativo no servidor?*
11. **Modo replay** — grave `{frame, ação}` por segundo e reproduza no canvas
    (otimista: só inputs, re-simular é determinístico **se** você usar seed de RNG).
12. **Exportar para mobile (PWA)** — manifest + service worker; meça o frame time
    em device real e otimize partículas (pools!).

**Template de entrega de exercício:** enunciado → decisão de arquitetura (1 parágrafo)
→ arquivos tocados → como testou → print/print de tela (`shots/`).

---

## 15. Glossário

| Termo | Significado |
|---|---|
| **Game loop** | Ciclo `input → update → render` que roda dezenas de vezes por segundo |
| **Delta (dt)** | Tempo decorrido desde o quadro anterior (segundos); base de todo movimento justo |
| **FPS** | Quadros por segundo; jogar NUNCA deve depender dele |
| **Sub-stepping** | Dividir um movimento grande em passos pequenos para não "atravessar" colisões |
| **Tunneling** | Bug em que um objeto passa através de um colisor num único quadro |
| **FSM** | Máquina de estados finitos: estados + transições permitidas |
| **Scene** | Unidade do Phaser (uma tela de jogo); `create` → `update` → `shutdown` |
| **GameObject** | Objeto visível/sonoro do Phaser (`Rectangle`, `Circle`, `Text`…) |
| **Depth** | Camada de desenho (maior = por cima) |
| **Store** | Estado global observável (aqui: Zustand) |
| **Mutator/Ação** | Única função autorizada a mudar uma fatia do store |
| **Derivar** | Calcular valor a partir do estado, sem guardar cópia |
| **ACI/Codec** | Formato de áudio; aqui usamos osciladores (sem arquivos) |
| **WebAudio** | API de áudio programático (`Oscillator`, `GainNode`) |
| **Gamepad API** | API nativa para controles; `getGamepads()` retorna fatias por frame |
| **Type guard** | Função que afirma o tipo (`v is RankEntry`) para o compilador |
| **HMR** | Hot Module Replacement: troca de código sem recarregar a página |
| **Deadzone** | Faixa morta do analógico para ignorar ruído central |
| **Zona de render (`scale FIT`)** | Escala o canvas para caber mantendo a proporção 2:1 |

---

## Referências neste repositório

| Documento | Conteúdo |
|---|---|
| `README.md` | Como rodar, controles, arquitetura resumida |
| `../RELATORIO_DIAGNOSTICO.md` | Diagnóstico do código original (22 problemas) — estude-o junto da Seção 11 |
| `shots/*.png` | Capturas de todas as telas (geradas pelos testes) |
| `tests/*.mjs` | Exemplos reais de teste de browser com assertions de DOM |

**Links externos oficiais:**
- [Documentação do Phaser](https://phaser.io/)
- [Zustand (GitHub)](https://github.com/pmndrs/zustand)
- [Vite — Guia](https://vite.dev/guide/)
- [MDN — Gamepad API](https://developer.mozilla.org/pt-BR/docs/Web/API/Gamepad_API)
- [MDN — Web Audio API](https://developer.mozilla.org/pt-BR/docs/Web/API/Web_Audio_API)

---

*Guia didático do projeto Pong Clássico (refatoração React + Phaser) — House Software, 2026.
Encontrou um erro na documentação? Corrija o arquivo e trate como PR: documentação também é código.*
