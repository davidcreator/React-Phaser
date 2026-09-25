# 🎨 Assets & Pipeline de Spritesheets — Shinobi Eclipse

> **Versão:** 1.0 · **Data:** 25/09/2026
> Guia para artistas e desenvolvedores sobre formato, pipeline e convenções.

---

## 1. Convenção de spritesheets

Todos os sheets são grades **4×4** (16 frames de tamanho uniforme), lidos da esquerda
para a direita, de cima para baixo. Frame nominal: **313×313 px** (arquivo 1254×1254,
recortado para múltiplo exato de 4).

| Sheet | Frames 0–3 | 4–7 | 8–11 | 12–15 |
|---|---|---|---|---|
| `player/shinobi-movement.png` | idle | corrida | salto (subida→queda) | aterrissagem/roll |
| `player/shinobi-sword-combat.png` | corte horizontal | corte ascendente | corte aéreo | finalizador |
| `player/shinobi-techniques.png` | arremesso de shuriken | dash sombra | guarda/dano | derrota |
| `enemies/crimson-kunai-ninja.png` | idle guardado | corrida | ataque | reação/derrota |
| `enemies/cobalt-chain-ninja.png` | idem | idem | idem | idem |
| `enemies/violet-naginata-ninja.png` | idem | idem | idem | idem |
| `enemies/ochre-kanabo-ninja.png` | idem | idem | idem | idem |
| `enemies/onyx-elite-ninja.png` | idem | idem | idem | idem |

Os nomes de animação gerados pela cena (`createAnimations()` em `ShadowScene.ts`):
`player-idle/run/jump/roll`, `player-sword/upper/air/finisher`, `player-throw/dash/
hurt/defeated`, `enemy-idle|walk|attack|hit|defeated-{rank}`.

## 2. Requisitos para assets game-ready

1. **Alpha real** — PNG RGBA com fundo transparente. ❌ Xadrez "falso" pintado nos pixels.
2. **Frames alinhados** — centro de massa horizontal constante e **pés na mesma linha de
   base** em todos os frames (evita o efeito "patinação").
3. **Peso** — inimigos quantizados a 256 cores (~200 KB); player pode ficar em RGBA full
   (~1,5 MB). Alvo total por sheet: ≤1,6 MB.
4. **Dimensões múltiplas de 4** em ambos os eixos.

## 3. Pipeline offline (`scripts/process_spritesheets.py`)

Corrige os 3 problemas clássicos dos sheets gerados por IA/ferramentas externas:

| Passo | O que faz |
|---|---|
| **Matte removal** | Flood-fill de borda marca o fundo claro/cinza (xadrez falso) e zera o alpha — implementado com `scipy.ndimage.label` (fallback numpy puro). |
| **Alinhamento** | Recentraliza cada frame pelo **centroide de alpha ponderado** e alinha os **pés** à média das baselines (clamp ±⅓ do frame). |
| **Otimização** | Player: RGBA otimizado; inimigos: quantização 256 cores (`FASTOCTREE`). |

**Executar** (após substituir/adicionar sheets em `public/assets/`):

```bash
python3 scripts/process_spritesheets.py
```

Saída esperada: `matte=<n>px  <antes>KB -> <depois>KB` por arquivo. Backup manual antes
de rodar em cima de assets finalizados é recomendado (`git restore public/assets`).

**Validação de alinhamento** (deve imprimir centroide ≈ constante e pé fixo):

```bash
python3 - <<'PY'
from PIL import Image
import numpy as np
a = np.array(Image.open("public/assets/player/shinobi-movement.png").convert("RGBA"))
for r in range(4):
    for c in range(4):
        f = a[r*313:(r+1)*313, c*313:(c+1)*313]
        ys, xs = np.nonzero(f[..., 3] > 16)
        w = f[..., 3][ys, xs].astype(float)
        print(f"frame {r*4+c}: cx={(xs*w).sum()/w.sum():.1f} pe={ys.max()}")
PY
```

## 4. Consumo em runtime (ShadowScene)

1. `create()` desenha **fallbacks procedurais** (vetores) — o jogo nasce 100% jogável.
2. 700 ms após o início, `loadDetailedSprites()` carrega os PNGs sob demanda.
3. `registerDetailedSheet()` registra cada sheet direto na TextureManager (assets do
   pipeline já têm alpha); sheets legados com matte são detectados por amostragem de
   cantos e passam pelo caminho lento (flood-fill) automaticamente.
4. `upgradeActiveSprites()` troca os sprites **em momento seguro** (player no chão, sem
   ataque) com fade de 90 ms, guiado pela flag `playerUpgraded`. Corpo físico ajustado
   por arquétipo (`ENEMY_TYPES` / constantes do player).

## 5. Tabela de assets atuais

| Arquivo | Uso | Peso |
|---|---|---:|
| `player/shinobi-movement.png` | idle/run/jump/roll (player + menu animado) | ~1,5 MB |
| `player/shinobi-sword-combat.png` | combos de espada | ~1,6 MB |
| `player/shinobi-techniques.png` | shuriken/dash/hurt/defeated | ~1,7 MB |
| `enemies/crimson-kunai-ninja.png` | casta 0 — rusher | ~197 KB |
| `enemies/cobalt-chain-ninja.png` | casta 1 — ranged | ~185 KB |
| `enemies/violet-naginata-ninja.png` | casta 2 — alcance | ~209 KB |
| `enemies/ochre-kanabo-ninja.png` | casta 3 — tanque | ~328 KB |
| `enemies/onyx-elite-ninja.png` | casta 4 — elite | ~202 KB |

> Os guias antigos em `public/assets/*/SPRITESHEET-GUIDE.md` continuam válidos; este
> documento é a fonte canônica do pipeline.
