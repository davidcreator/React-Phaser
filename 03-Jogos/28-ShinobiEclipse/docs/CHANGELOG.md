# 📜 Changelog — Shinobi Eclipse

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) — versionamento SemVer.

---

## [1.1.0] — 2026-09-25

### Adicionado
- **Seleção de áreas**: tela `AREAS` com cards por fase — status (`DISPONIVEL`/`CONCLUIDA`/
  `BLOQUEADA`), melhor rank, melhor pontuação e chips das dificuldades concluídas
  (FACIL/NORMAL/DIFICIL). Área 02 desbloqueia ao concluir a 01.
- **Sistema de rank (S/A/B/C/D) e pontuação por área**:
  `pontos = (1000 + abates×50 + vidas×300 + vitalidade×3) × multiplicador de dificuldade`;
  rank com bônus por dificuldade (S exige quase-perfeição).
- Resultado de rank/pontos exibido na **transição da Área 01** e no **modal de vitória**.
- **Persistência de progresso** (`localStorage: shinobi-eclipse-progress`) com melhor
  pontuação e melhor rank por dificuldade.
- Reinício contextual: "TENTAR NOVAMENTE" refaz a área atual.
- `docs/` completo (GDD, Arquitetura, Assets, QA, Changelog, Contribuição).

### Corrigido (rodada 3 — investigação do ciclo de vidas)
- **Crítico:** shuriken inimiga **destruía o sprite do jogador** (overlap registrado como
  `(grupo, sprite)` — o Arcade inverte a ordem dos argumentos e o callback destruíava o
  player). Fonte real do relato "personagem não volta e não perde vida". Corrigido com
  registro `(player, grupo)` + guards; blindagem equivalente nos demais colliders.
- `damagePlayer()` agora **retorna** se consumiu vida; queda fatal respawna na base sem
  duplo teleporte (`hitHazard` só realoca em queda não-fatal).
- Anti spawn-camp: inimigos voltam aos postos no respawn + `calmUntil` de 3,6 s.
- Watchdog por frame: vitalidade zerada **sempre** processa morte/respawn (idempotente).
- Game over com mensagem in-world e reenvio de sinal (rede de segurança React).

## [1.0.0] — 2026-09-24

### Corrigido (auditoria inicial + rodada 2 de playtest)
- Softlock na caixa de madeira da Área 01 (caixas "step-over", knockback reduzido,
  `updateUnstuck`).
- Inimigos suicidas em fossos (patrulha com detecção de borda).
- Crash de `setPointerCapture` nos controles touch + input travado
  (`try/catch`, `onLostPointerCapture`, `onPointerCancel`).
- Sprite gigante ao pular durante a troca de textura (flag `playerUpgraded` como fonte
  única de verdade; troca apenas em momento seguro, com retry por frame).
- Jank de carregamento: pipeline offline de spritesheets (alpha real + frames alinhados
  + quantização) e registro direto de texturas em runtime, com detecção de matte legado.
- Inimigos não "patinam" mais (centroide/baseline alinhados no pipeline).
- Leash de aggro; respawn de fosso a ≤300 px; pausa automática no `blur` com reset de
  teclas; watchdog de boot que não destrói partidas em conexão lenta.
- HUD/meta honestos (`ABATES nn/32`), `emitHud` sem `JSON.stringify` por frame.
- Higiene do repositório: `README.md`, `.gitignore`, `package.json` renomeado, script
  `test:e2e`, remoção de 4 MB de assets órfãos.

### Técnico
- Smoke suite E2E (Playwright) com 15 checks e handle `window.__shadowScene` para testes.
- Pipeline offline `scripts/process_spritesheets.py` (scipy/numpy + Pillow).

---

[1.1.0]: ../README.md
[1.0.0]: ../README.md
