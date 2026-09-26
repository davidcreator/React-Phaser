# Apocalypse Race: Fleeing Hell

Protótipo de corrida arcade 2D lateral, desenvolvido com **React + Phaser 3 + TypeScript**. Prepare o veículo, atravesse rotas pós-apocalípticas e alcance os postos de evacuação. Dispare contra zumbis estilizados, administre munição e proteja o carro; colisões, capotamentos e pousos sem as rodas no chão afetam a condição mecânica. Os efeitos são sem gore.

> **Status — protótipo v0.7:** quatro fases jogáveis, tilesets ambientais separados e editáveis por fase, spritesheets animados para os quatro monstros, além de quatro veículos, desbloqueios sequenciais, melhorias, arma com munição limitada, pickups e dano/reparo. Os spritesheets dos carros foram mantidos sem alteração. A meta 10+ é editorial e não representa uma classificação oficial.

## Rodar localmente

Requisito: **Node.js 20.19+** (ou 22.12+) e npm.

```bash
npm install
npm run dev
```

O Vite inicia o ambiente em `http://localhost:5173`. Para validar a build de produção:

```bash
npm run typecheck
npm run build
npm run preview
```

Para regenerar os atlas/folhas editáveis depois de alterar SVGs, execute `npm run assets:tilesets` ou `npm run assets:monsters` (Python 3 e ImageMagick).

## Campanha jogável

| Fase | Distância lógica | Rampas | Obstáculos | Combustível | Sucata | Munição | Zumbis |
|---|---:|---:|---:|---:|---:|---:|---:|
| Posto 7 | 68.000 | 21 | 20 | 9 | 12 | 6 | 12 |
| Viaduto Caído | 72.000 | 22 | 21 | 10 | 13 | 6 | 12 |
| Pátio de Sucata | 76.000 | 23 | 22 | 10 | 15 | 7 | 12 |
| Saída do Anel | 82.000 | 24 | 23 | 11 | 16 | 7 | 12 |

Além de combustível, sucata e munição, as rotas oferecem kits de reparo e escudos temporários. As quatro travessias têm como alvo **2–4 minutos**; duração e balanceamento ainda precisam de validação em execução real. Cada fase tem paleta, cenário e modificadores de terreno/consumo próprios. A progressão é sequencial: conclua a fase anterior para liberar a próxima.

## Veículos e progressão

- **Fagulha** — inicial, equilibrada.
- **Corisco** — libera após 1 missão concluída; mais autonomia e estabilidade.
- **Vaga-Lume** — libera após 2 missões; aceleração e manobras aéreas.
- **Aurora** — libera após 3 missões; resistência e tanque ampliado.

Motor, pneus, suspensão, tanque, para-choque e armamento têm até três níveis. O armamento aumenta dano, cadência e capacidade de munição. Os upgrades são individuais por veículo; a sucata é compartilhada e o progresso é salvo localmente. Saves antigos migram os níveis existentes para a Fagulha.

## Controles

| Ação | Teclado |
|---|---|
| Acelerar | `W` ou `↑` |
| Frear | `S` ou `↓` |
| Inclinar no ar | `A` / `D` ou `←` / `→` |
| Nitro | `Shift` |
| Buzina de rota | `Espaço` |
| Disparar | `J` (segure para disparos em sequência) |
| Pausar / retomar | `Esc` |

As teclas podem ser remapeadas em **Opções → Controles**. Em telas pequenas aparecem controles de toque, incluindo o botão de disparo. A arma tem munição finita, reabastecida por caixas amarelas ao longo da rota. Um zumbi que ainda está ativo pode atingir o veículo e causar dano; neutralizá-lo com disparos ou desviá-lo evita esse contato. Cada zumbi neutralizado vale **500 pontos**, sem bônus de sucata. Pousar sem as rodas no chão causa dano; capotamentos causam impacto maior. Se a condição chegar a zero, o carro quebra e a corrida termina em segurança.

## Conteúdo sem gore

- Até **12 zumbis por fase**; alvos fantásticos, estilizados e de silhuetas não realistas.
- Disparos abstratos, sem feridas, sangue, corpos, sofrimento, violência contra humanos/animais ou animação gráfica.
- Kits recuperam condição mecânica; um escudo temporário absorve impactos.
- O contato com obstáculo, zumbi ou terreno altera apenas condição/velocidade do veículo; não há dano a ocupantes.
- A meta 10+ é provisória e não oficial; não é uma garantia de classificação pela loja, IARC ou Ministério da Justiça.

## Spritesheets dos carros

Os quatro spritesheets atuais dos carros foram mantidos sem alteração. Arquivos PNG/SVG em `public/assets/sprites/cars/`; detalhes em [docs/SPRITESHEETS_CARROS.md](docs/SPRITESHEETS_CARROS.md).

## Tilesets por fase

Cada uma das quatro fases tem um atlas ambiental próprio com 48 tiles de 32 × 32 px. PNG para o jogo, SVG editável, `.tsx` para abrir no Tiled e JSON com nomes/IDs ficam em `public/assets/tilesets/stages/<fase>/`. A cena usa marcos da fase em parallax; a geometria física continua separada. Instruções: [docs/TILESETS_FASES.md](docs/TILESETS_FASES.md).

## Spritesheets dos monstros

Errante, Corredor, Saltador e Blindado têm folhas PNG animadas com quatro quadros de 64 × 64 px, SVGs editáveis e manifesto em `public/assets/sprites/monsters/`. As folhas estão integradas à corrida. Instruções: [docs/SPRITESHEETS_MONSTROS.md](docs/SPRITESHEETS_MONSTROS.md).

## Estrutura

```text
.
├── docs/                   # GDD e documentação de design/produção
├── public/assets/sprites/cars/ # Spritesheets dos veículos (mantidos)
├── public/assets/sprites/monsters/ # Spritesheets de monstros
├── public/assets/tilesets/stages/ # Atlas editáveis por fase
├── scripts/                # Geradores de assets
├── src/
│   ├── App.tsx             # Shell React, campanha, garagem e progressão
│   ├── game/
│   │   ├── content.ts      # Dados tipados de fases, carros e desbloqueios
│   │   ├── stageLayout.ts  # Geração determinística de layouts por fase
│   │   ├── monsters/       # Registro independente dos spritesheets
│   │   ├── tilesets/       # Registro dos atlas por fase
│   │   └── scenes/         # Cena Phaser de corrida
│   └── styles.css          # Interface e layout responsivo
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Documentação

- [Índice da documentação](docs/README.md)
- [GDD](docs/GDD_v0.1.md)
- [Arquitetura técnica](docs/ARQUITETURA.md)
- [Spritesheets dos carros](docs/SPRITESHEETS_CARROS.md)
- [Tilesets ambientais por fase](docs/TILESETS_FASES.md)
- [Spritesheets dos monstros](docs/SPRITESHEETS_MONSTROS.md)
- [Política de conteúdo e classificação](docs/POLITICA_DE_CONTEUDO_E_CLASSIFICACAO.md)
- [UI/UX — telas, menus e sistema visual](docs/UI_UX.md)
- [Roadmap e critérios de pronto](docs/ROADMAP.md)
- [Changelog](docs/CHANGELOG.md)

## Notas importantes

- O protótipo é single-player e offline-first; não há chat, compras, anúncios nem conteúdo de usuários.
- A classificação final depende da versão completa e do processo aplicável à plataforma.
- Assets de pista, veículo e zumbis são desenhos vetoriais originais do protótipo. A duração de 2–4 minutos é alvo de design, ainda não validado por playtest.
