# Changelog

## 2026-09-25 — v0.5 (armas, power-ups e dano ao veículo)

- Adicionada arma veicular com disparo contínuo por `J` (remapeável), projéteis, munição finita e HUD; caixas de munição repõem a reserva.
- Zumbis têm resistência diferente por tipo; disparos neutralizam-nos de forma instantânea e não gráfica. Cada neutralização rende +500 pontos, sem sucata.
- Zumbis ativos que atingem o carro causam dano mecânico; buzina continua sendo uma opção de desvio.
- Adicionados kits de reparo e escudos temporários, além de novos layouts de pickups em cada rota.
- Pousos fora do limite de rodas no chão causam dano e perda de velocidade; capotamentos causam impacto maior e recuperação arcade sobre as rodas.
- A condição zerada quebra o veículo e encerra a tentativa com relatório de falha; upgrades de armamento melhoram dano, cadência e capacidade de munição.
- Atualizados README, GDD, arquitetura, política de conteúdo, UI/UX e roadmap; apresentação continua sem gore e a meta 10+ permanece não oficial.
- Validação técnica v0.5: `npm run typecheck` e `npm run build` passaram; a prévia de produção respondeu HTTP 200. O build mantém aviso não bloqueante de chunk Phaser >500 kB; duração, balanceamento e playtest visual/jogável continuam pendentes.

## 2026-09-25 — v0.4 (quatro fases e quatro veículos)

- Tornadas jogáveis quatro rotas sequenciais: Posto 7, Viaduto Caído, Pátio de Sucata e Saída do Anel.
- Criados layouts por fase com comprimentos de 68.000–82.000 unidades, temas/paletas, modificadores de consumo/terreno e quantidades próprias de rampas, obstáculos e coletáveis.
- Integrada seleção e progressão de veículos: Fagulha inicial; Corisco, Vaga-Lume e Aurora liberados após 1, 2 e 3 missões concluídas.
- Os atributos dos carros e os cinco tipos de upgrade agora alteram a simulação; níveis são separados por veículo e a sucata continua compartilhada.
- Atualizados mapa, garagem, HUD e relatório para exibir rota/carro escolhidos, objetivos e desbloqueios.
- Adicionada migração de saves v0.3: upgrades legados ficam na Fagulha; missões concluídas preservam o acesso à progressão.
- Atualizados README, GDD, UI/UX, arquitetura e roadmap. A meta de 2–4 min é aplicada às quatro rotas, mas ainda precisa de playtest.
- Validação: `npm run typecheck` e `npm run build` passaram; teste de sanidade confirmou as contagens de layout e as regras de unlock; a prévia respondeu HTTP 200.

## 2026-09-25 — v0.3 (travessia longa e progressão)

- Estendida a fase Posto 7 para uma travessia longa (alvo de 2–4 minutos), com 21 rampas, obstáculos, coletáveis e mudanças de cenário por região.
- Implementados quatro monstros fantásticos com variações visuais e deslocamento: Musgoso, Saltador, Cristalino e Cascudo.
- Adicionada pontuação por saltos/pousos, cambalhotas controladas e +500 por monstro derrotado; buzina continua permitindo desviar.
- Transformada a garagem em oficina funcional: motor, pneus, suspensão, tanque e para-choque têm até três níveis, comprados com sucata.
- Upgrades alteram aceleração, velocidade, atrito, controle aéreo, combustível e danos; progresso e sucata são persistidos localmente.
- Resultado registra vitória/falha, pontos, criaturas derrotadas, saltos, manobras, sucata e recursos restantes.

## 2026-09-25 — v0.2 (menus e UI/UX)

- Refeito o menu inicial com identidade visual de apocalipse, missão ativa, mapa, garagem, opções e créditos.
- Criado fluxo de campanha e tela da garagem com dados-placeholder identificados como tais.
- Implementada tela de opções com áudio, tela cheia/contraste, remapeamento de teclas, acessibilidade e idioma.
- Preferências salvas localmente; restauração de padrões protegida por confirmação.
- Adicionado menu de pausa com `Esc`, reinício de fase e retorno ao menu.
- Criado `docs/UI_UX.md` com navegação, paleta, hierarquia, acessibilidade e critérios de aceite.
- Classificação 10+ identificada como meta editorial, não classificação oficial.

## 2026-09-25 — v0.1 (base do projeto)

- Organizado o GDD existente em `docs/GDD_v0.1.md`.
- Criado scaffold React + TypeScript + Phaser 3 + Vite.
- Adicionado menu React, canvas Phaser de demonstração e controles de toque.
- Documentadas arquitetura técnica, política de conteúdo/classificação e roadmap.
