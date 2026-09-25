# 🎮 Game Design Document (GDD) — Shinobi Eclipse

> **Versão:** 1.0 · **Data:** 25/09/2026 · **Estado:** lançado
> Plataforma-ação 2D · 1 jogador · 5–10 min por campanha

---

## 1. Visão geral

**Shinobi Eclipse** é um jogo de plataforma e ação 2D onde o jogador controla um shinobi
infiltrado na fortaleza da Lua Vermelha. O objetivo é **eliminar todos os alvos das duas
áreas** (32 no total) sobrevivendo com suas **4 vidas**, concluíndo cada área com o maior
**rank** (S–D) e a maior **pontuação** possível.

- **Pitch (uma frase):** "Um ninja, uma fortaleza sob o eclipse — limpe as seis áreas com
  precisão de aço e conquiste o rank S."
- **Público:** jogadores casuais/intermediários de plataforma-ação; sessões curtas.
- **Plataforma:** navegador (desktop e mobile), WebGL com fallback Canvas.
- **Referências de tom:** estética ukiyo-e noturna, minimalismo geométrico, ação direta.

## 2. Pilares de design

| Pilar | Significado prático |
|---|---|
| **Leitura de tela** | Toda ameaça é visível antes de chegar: silhuetas contrastam com o fundo, barras de vida flutuantes, avisos brilhantes nos fossos. |
| **Agressividade recompensada** | Combo de espada com 3 golpes alternados; aproximar-se é mais rápido (e mais arriscado) que spam de shuriken. |
| **Justiça** | Sem dano invisível: invulnerabilidade pós-hit e pós-respawn, inimigos não acampam o spawn, quedas têm checkpoint próximo. |
| **Rejogabilidade por maestria** | Rank S exige vitória "quase perfeita" — encoraja rejogar cada área em dificuldades maiores. |

## 3. Loop de gameplay

```
┌────────────────────────────────────────────────────────────┐
│  Explorar a área → Encontrar patrulha → Combate →          │
│  ↑                                              Alvo caído │
│  │                                              │          │
│  └──← Subir de plataforma / Evitar fosso ←──────┘          │
│                                                            │
│  Área limpa → RANK + PONTOS → Próxima área → VITÓRIA       │
└────────────────────────────────────────────────────────────┘
```

Sessão típica: menu → (seleção de área) → Área 01 → transição com rank → Área 02 →
vitória com rank → registro de progresso → rejogar por rank maior / outra dificuldade.

## 4. Mecânicas

### 4.1 Movimento
| Parâmetro | Valor | Nota de design |
|---|---|---|
| Velocidade horizontal | 270 px/s | Constante, sem aceleração longa (responsivo) |
| Impulso de salto | −680 px/s | Arco de ~2 telas de altura com gravidade 1180 |
| Coyote time | 120 ms | Permite saltar logo após sair da borda |
| Jump buffer | 140 ms | Salto "travado" pressionado antes de aterrissar |
| Inclinação visual | ±2,5° | Lean sutil ao correr (game feel) |

### 4.2 Combate
- **Espada (J/X):** 3 golpes alternados no chão (horizontal → ascendente → finalizador),
  golpe aéreo dedicado. Cooldown 380 ms. Alcance efetivo ~82 px à frente.
- **Shuriken (K/C):** projétil em linha reta, cooldown 720 ms, 34 de dano. HUD indica
  prontidão (botão K acende/apaga).
- **Dano recebido:** 900 ms de invulnerabilidade + knockback reduzido (175 horizontal,
  −250 vertical) — evita ser "jugglado" para dentro de fossos.

### 4.3 Vidas, morte e respawn
- Vitalidade 100% + **4 vidas**. Vitalidade zerada consome 1 vida.
- Respawn: base da área, vitalidade cheia, **2,2 s de invulnerabilidade** piscando;
  inimigos vivos voltam aos postos originais e ficam 3,6 s em "calmaria"
  (anti spawn-camp).
- Queda em fosso com vida restante: checkpoint a no máximo 300 px do ponto da queda.
- Sem vidas: **game over** com estatísticas da campanha.

### 4.4 Economia de progresso
- **Vida extra** a cada 20 abates acumulados (cruza as seis áreas; 68 alvos ⇒ até 3 extras por campanha).
- **Rank por área** (S/A/B/C/D) calculado do desempenho na conclusão — ver §7.
- **Desbloqueio:** Área 02 libera ao concluir a Área 01 (qualquer dificuldade).

## 5. Inimigos ("castas")

| Casta | Arma | HP | Dano | Velocidade | Alcance | Ranged | Papel |
|---|---|---:|---:|---:|---:|:---:|---|
| Crimson | Kunai dupla | 52 | 11 | 136 | 60 | — | Rusher rápido, aparece desde o início |
| Cobalt | Kusarigama | 82 | 15 | 106 | 92 | ✓ | Pressão à distância, força aproximação |
| Violet | Naginata | 118 | 19 | 88 | 116 | — | Zona de controle, alcance maior que o do jogador |
| Ochre | Kanabō | 172 | 25 | 64 | 82 | — | Bruto tanque, pune erros de posicionamento |
| Onyx | Odachi | 235 | 29 | 84 | 108 | ✓ | Elite da Área 02, maior dano/HP do jogo |

Regras compartilhadas: patrulha com **detecção de borda** (não caem em fossos),
aggro por proximidade (≤520 px, altura ≤170 px) com **leash** (abandonam perseguição
a >640 px), telegrafia de ataque (tint + animação), barra de vida flutuante colorida
por casta. Dificuldade multiplica HP/dano/velocidade e reduz cooldowns (§7).

## 6. Fases ("áreas")

| # | Nome | Alvos | Mundo | Identidade visual |
|---|---|---:|---|---|
| 01 | Fortaleza Interior | 8 | 2400 px | Noite azul-fria, lua branca, bambuzal, 2 torii |
| 02 | Lua Vermelha | 12 | 2880 px | Eclipse vermelho, atmosfera opressiva, casta de elite |
| 03 | Bambuzal Espectral | 10 | 2640 px | Nevoa verde-jade, lua pálida esverdeada, lanternas de jade, torii verdes |
| 04 | Dojo de Gelo | 12 | 3120 px | Frio azul-aço, lua branca gelada, lanternas azuis, fossos largos |
| 05 | Cratera de Cinzas | 12 | 3120 px | Roxo-cinza vulcanico, lua lilás, brasas roxas, trechos estreitos |
| 06 | Coracao do Eclipse | 14 | 3360 px | Dourado do eclipse, lua gigante (raio 90), elites dourados e roxos, fosso final |

- **Plataformas** estáticas com visual de pedra/madeira (costuras indicam colisor).
- **Caixas** são "step-over": sobe nelas, sem colisão lateral (anti-softlock).
- **Fossos** com espinhos: fatais com vida baixa; checkpoint próximo.
- **Layouts de spawn** fixos por área (8+12+10+12+12+14 = **68 alvos**), definidos na
  tabela `LEVELS` de `ShadowScene.ts` (única fonte de verdade; `LEVEL_META` alimenta a UI React).
- **Desbloqueio em cadeia:** a área N só abre após concluir a N−1; a vitória final ocorre na 06.
- Todas as posições de spawn são validadas geometricamente (sobre chão/plataforma,
  fora de caixas e fossos) — ver `CORRECOES-APLICADAS.md`, rodada 5.

## 7. Dificuldade, pontuação e rank

| Dificuldade | HP inimigos | Dano | Velocidade | Cooldown inimigos | Mult. pontos | Bônus rank |
|---|---:|---:|---:|---:|---:|---:|
| Fácil | ×0,78 | ×0,7 | ×0,84 | ×1,2 | ×1 | ×1,00 |
| Normal | ×1 | ×1 | ×1 | ×1 | ×1,5 | ×1,12 |
| Difícil | ×1,28 | ×1,32 | ×1,18 | ×0,78 | ×2 | ×1,25 |

**Pontuação da área** = `(1000 + abates×50 + vidas×300 + vitalidade×3) × multiplicador`.
**Rank:** limiar sobre a pontuação crua com bônus de dificuldade —
`S ≥ 3000 · A ≥ 2600 · B ≥ 2200 · C ≥ 1800 · D < 1800`.

Exemplo de referência (Normal): área limpa sem perder vida e com vitalidade alta ≈ 4.300
pontos → **S**. Perder 1 vida cai ~900 pontos → tipicamente **A/B**.

## 8. Interface e telas

- **Menu** — identidade, INICIAR MISSÃO (Enter), AREAS, OPÇÕES, GUIA DE CAMPO.
- **Seleção de áreas** — cards com status (DISPONIVEL/CONCLUIDA/BLOQUEADA), melhor rank,
  melhor pontuação e chips FACIL/NORMAL/DIFICIL concluídas; persistido no dispositivo.
- **HUD** — vitalidade, área atual, alvos restantes, vidas, abates "NN/32", cooldown de
  shuriken, atalhos contextuais (teclado/gamepad).
- **Modais** — pausa, game over, vitória (esta com rank + pontos).
- **Mensagens in-world** — "RETORNO DAS SOMBRAS" (respawn), "VIDA EXTRA", "AREA SEGURA".
- **Transição de área** — cortina com rank da área concluída.

## 9. Áudio

Trilha e efeitos **100% sintetizados** (Web Audio API — sem dependência de arquivos):
drone grave contínuo (tensão) + melodia pentatônica em triangulo; SFX curtos por ação
(espada, shuriken, hit, morte de inimigo, salto, dano, vida extra, vitória, UI).
Volumes separados (trilha/efeitos) com persistência.

## 10. Acessibilidade e entradas

- Teclado (WASD/setas), gamepad (analógico + botões) e **controles de toque** na tela.
- `prefers-reduced-motion` respeitado nas animações de UI.
- Contraste alto nas ameaças; texto de HUD em caixa alta espaçada.
- Pausa automática ao perder o foco da janela (alt-tab seguro).
