# 🏓 Pong Clássico — React + Phaser

Refatoração completa do **Pong Clássico** com as melhores práticas da stack
**React + TypeScript + Phaser 3D/2D engine** — entregue após o diagnóstico
técnico do código original (JS puro, 22 problemas identificados).

## 🚀 Como executar

```bash
npm install
npm run dev        # servidor de dev (http://localhost:5173)
```

Build de produção:

```bash
npm run build      # typecheck + vite build
npm run preview    # serve o build
```

## 🎮 Recursos

| Recurso | Detalhe |
|---|---|
| **Tela inicial** | apresentação + atalho para o menu |
| **Menu de opções** | 6 modalidades (Clássico, 2 Jogadores, Velocidade, Multi-Bola, Obstáculos, Power-ups) |
| **Níveis** | Fácil (×1), Médio (×2), Difícil (×3) — afeta IA, bola e multiplicador |
| **Configuração de controles** | esquemas de teclado (W/S, setas, ambos; I/K ou setas), gamepad on/off com detecção ao vivo e teste de teclas |
| **Configuração de vidas** | 1 / 3 / 5 / 7 / 9 vidas por jogador — gol concede vida |
| **Pontuação** | gol = 10 × nível, rally = 1 × nível; placar e vidas ao vivo no HUD |
| **Ranking** | top 10 persistido em localStorage, com nome, modo, nível e data |
| **Pausa** | Esc/P ou botão; auto-pause ao perder o foco da aba |
| **Áudio** | efeitos sintetizados via WebAudio (sem assets) |
| **Touch** | arrastar na metade esquerda/direita do campo |

## 🕹️ Controles

- **Jogador 1:** `W/S` e/ou `↑/↓` (configurável) — paleta verde
- **Jogador 2:** `I/K` ou `↑/↓` (configurável) — paleta vermelha (modo 2 jogadores)
- **Gamepad:** analógico esquerdo ou D-pad (Controle 1 = P1, Controle 2 = P2)
- **Esc / P:** pausar · **Toque/arraste:** fallback mobile

## 🏗️ Arquitetura

```
src/
├── store/useGameStore.ts     # Zustand — FSM de telas + estado da partida
├── game/
│   ├── scenes/GameScene.ts   # simulação (Phaser): física, colisões, IA, power-ups
│   ├── entities/             # Paddle e Ball (px/segundo, delta-time)
│   ├── modes.ts              # dados das 6 modalidades
│   ├── difficulty.ts         # níveis + multiplicadores
│   ├── sfx.ts                # sons sintetizados (WebAudio)
│   └── constants.ts          # fórmula de pontuação (fonte única)
├── services/
│   ├── ranking.ts            # top 10 em localStorage
│   └── storage.ts            # acesso seguro (fallback memória)
└── components/               # UI React (telas, HUD, overlays)
```

**Decisões-chave:**
- **React dono da UI, Phaser dono do gameplay** — HUD/overlays são React
  sobrepostos ao canvas; a cena só emite eventos para o store.
- **Sem `setTimeout`/`alert` no loop** — spawns e efeitos usam acumuladores
  de `delta` (os bugs P0-1/P0-2/P0-3 do diagnóstico não existem por construção).
- **Delta-time + sub-stepping** — 60/144 Hz idênticos, sem tunneling.
- **Ciclo de vida explícito** — jogo Phaser destruído ao sair da partida;
  rematch via `scene.restart()`.

## ✅ Correções em relação ao original

1. Vitória sem `alert()` — overlay de fim de partida + gravação no ranking
2. Power-ups com spawn por delta-time (nunca morre ao pausar/reiniciar)
3. Power-up 'slow' com reversão garantida (sem stacking permanente)
4. Obstáculos com resolução de penetração (1 hit por evento real)
5. Cronômetro consistente (só conta jogo ativo, zera no reinício)
6. Teclas liberadas no blur · setas sem scroll da página · auto-pause
7. IA com predição de trajetória nos níveis Médio/Difícil
8. README real (clonável/executável), sem placeholders

---
*Projeto educacional — refatorado em 25/09/2026 · David Creator*
