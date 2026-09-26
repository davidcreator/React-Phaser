# Arquitetura técnica

## 1. Objetivo

Construir um jogo web 2D com **React para o shell e telas de produto** e **Phaser 3 para simulação, renderização e input em tempo real**. O jogo é single-player, offline-first, executado sem serviços remotos após o carregamento.

## 2. Stack atual

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| UI / aplicação | React 19 + TypeScript | Menu, campanha, garagem, configurações, resultados e controles HTML de toque |
| Jogo | Phaser 3 | Cenas de corrida, câmera, desenho, teclado e simulação arcade |
| Dev server / build | Vite 8 | Servidor local e bundle web |
| Persistência | `localStorage` | Opções, sucata, upgrades por carro, veículo selecionado, recordes e desbloqueios |

As versões estão declaradas em `package.json` e fixadas por `package-lock.json`. Node recomendado: 20.19+ ou 22.12+ para a versão atual do Vite.

## 3. Fronteira entre React e Phaser

### React

- Mantém a navegação: menu, mapa, garagem, opções, créditos, corrida, pausa e resultado.
- Calcula rotas/carros desbloqueados e guarda o progresso persistente.
- Cria o elemento do canvas, carrega Phaser sob demanda e destrói a instância ao sair da corrida.
- Passa para Phaser o stage ID, car ID, teclas e upgrades do veículo selecionado.
- Renderiza controles de toque acessíveis sem atualizar a cada frame.

### Phaser

- Mantém o estado volátil da corrida: veículo, combustível, condição, nitro, munição, escudo temporário, sucata, pontuação, saltos, manobras, zumbis, projéteis e coletáveis.
- Simula em passo fixo e desenha a rota, veículos, pickups, zumbis, projéteis, câmera e HUD/feedback.
- Lê o mesmo contrato de ações alimentado por teclado e toque.
- Emite um `RaceResult` tipado com `stageId`, `carId`, resultado, recursos e estatísticas.

**Regra de ciclo de vida:** manter uma única instância de `Phaser.Game` por montagem de corrida. Ao sair da tela, destruir o jogo e limpar inputs/listeners. React não deve renderizar a cada frame da simulação.

## 4. Organização atual do código

```text
src/
  App.tsx                    # shell, navegação, progresso e telas
  main.tsx
  styles.css                 # visual e layout responsivo
  game/
    content.ts               # dados tipados de 4 fases, 4 carros e desbloqueios
    createRaceGame.ts        # injeta seleção e configurações na cena
    input.ts                 # contrato de ações e estado de toque
    stageLayout.ts           # layouts determinísticos por fase
    types.ts                 # resultado e callbacks tipados
    upgrades.ts              # categorias, custos e sanitização de upgrades
    scenes/RaceScene.ts      # simulação Phaser de corrida
public/assets/sprites/cars/      # spritesheets atuais dos veículos
public/assets/sprites/monsters/  # PNG/SVG dos quatro monstros
public/assets/tilesets/stages/   # atlas PNG/SVG/TSX/JSON por fase
src/game/monsters/registry.ts    # mapeamento dos spritesheets de monstros
src/game/tilesets/registry.ts    # atlas e marcos por fase
scripts/generate_stage_tilesets.py
scripts/generate_monster_spritesheets.py
```

## 5. Conteúdo e layout

- `content.ts` é a fonte de verdade para IDs, atributos, paletas, tema, comprimento, quantidades e ordem de monstros.
- `stageLayout.ts` gera coordenadas determinísticas de rampas, obstáculos, pickups e monstros a partir dos dados da fase.
- `RaceScene` usa o layout e a paleta recebidos para dimensionar mundo, HUD e física. Carrega o PNG do veículo selecionado; carrega também o tileset da fase (32 × 32 por tile) para marcos em parallax e as quatro spritesheets de monstros (64 × 64 por quadro). Os desenhos usam filtro `NEAREST`; o mapa físico e o fallback vetorial dos monstros permanecem independentes das imagens.
- Para novas rotas, manter no máximo 12 zumbis por fase; tiros podem neutralizá-los (+500 uma única vez), contatos causam dano mecânico ao carro e desvios não pontuam.

## 6. Input e simulação

O conjunto de ações fica centralizado em `src/game/input.ts`:

- `accelerate`
- `brake`
- `tiltLeft`
- `tiltRight`
- `nitro`
- `horn`
- `fire` (disparo veicular com cadência e munição limitadas)

Coordenadas lógicas: 1280 × 720; canvas ajustado ao container. O controlador arcade usa passo fixo, rampa/gravidade, consumo de combustível, condição e detecção de pickups/impactos. Aceleração, velocidade máxima, capacidade/consumo, controle aéreo, estabilidade e resistência usam atributos do carro; motor, pneus, suspensão, tanque, para-choque e armamento aplicam seus efeitos. Projéteis atualizam alvos por tipo e resistência; a condição é reduzida por colisões, contato de zumbi e pousos com rodas fora do chão. Reparos restauram condição; escudo temporário absorve impactos. Terreno e consumo usam modificadores por fase.

## 7. Dados e persistência

- Opções: `apocalypse-race.options.v1`.
- Progresso: `apocalypse-race.progress.v1`.
- O save atual guarda sucata compartilhada, `upgradesByCar`, `selectedCarId`, `completedStageIds`, melhor pontuação, abates e missões concluídas.
- Migração compatível: saves v0.3 com o objeto legado `upgrades` mantêm seus níveis na Fagulha; outros carros começam sem upgrades. Saves antigos com missões concluídas migram o Posto 7 como concluído.
- Fases liberam em sequência. Carros são liberados após 0, 1, 2 e 3 missões concluídas.
- Dados carregados do storage são sanitizados; nenhum dado pessoal é salvo.

Uma evolução futura pode adicionar `schemaVersion` explícito e migrações formais. Não adicionar conta, chat ou serviço online sem revisão de produto, privacidade e classificação.

## 8. Qualidade e build

- `npm run typecheck`: verifica contratos TypeScript.
- `npm run build`: typecheck + bundle de produção.
- `npm run dev`: Vite em `0.0.0.0:5173`.
- `npm run preview`: serve o bundle em `0.0.0.0:4173`.

A matriz de duração (2–4 min), disponibilidade de combustível e balanceamento de 4 fases × 4 veículos requer playtest real. Automatizar build e verificação HTTP não substitui validação visual/jogável. Não carregar fontes, scripts ou imagens de CDN como requisito do jogo.
