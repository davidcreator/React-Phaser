# Breakout Clássico

Reimplementação do jogo Breakout com **React 19**, **Phaser 3 Arcade Physics** e **Vite**. O projeto é uma versão de desenvolvimento baseada no repositório público [davidcreator/Breakout-Classico](https://github.com/davidcreator/Breakout-Classico).

## Começar

**Requisitos:** Node.js 20+ e npm 10+ recomendados.

```bash
npm ci
npm run dev
```

Abra no navegador a URL exibida pelo Vite (por padrão, `http://localhost:5173`). Execute os comandos na pasta que contém este `README.md` e `package.json`. **Não abra `index.html` por `file://`**: a aplicação usa módulos ES e precisa de um servidor HTTP.

Se o terminal disser `vite: not found`, rode `npm ci` na raiz do projeto e tente novamente.

## Validar e gerar build

```bash
npm test        # testes das regras puras (Vitest)
npm run build   # build de produção em dist/
npm run preview # preview local do build, após npm run build
npm audit       # auditoria de dependências
```

## Modos de jogo

- **Clássico:** três vidas, score, níveis progressivos e uma vida bônus a cada três níveis.
- **Sobrevivência:** uma vida inicial e ondas sem fim; dificuldade crescente e power-up de vida extra.
- **Duelo local:** dois jogadores no mesmo dispositivo; vence quem fizer cinco pontos. Power-ups ficam desativados para manter o equilíbrio.

## Controles

- **Clássico/Sobrevivência:** `A`/`D` ou `←`/`→` para mover a barra.
- **Duelo:** Jogador 1 usa `A`/`D`; Jogador 2 usa `←`/`→`.
- **Lançar:** `Espaço`, clique ou toque no campo. Após o lançamento, `Espaço` pausa/continua.
- **Reiniciar:** `R` ou botão de reinício na interface.
- **Touch:** toque/clique move a barra para o ponto selecionado; arraste para continuar.
- **Gamepad:** D-pad ou analógico esquerdo. O segundo controle atua como Jogador 2 no Duelo.

## Documentação

A documentação detalhada está em [`docs/`](./docs/README.md). Para aprender a programar jogos usando este projeto como referência, comece pelo [Guia didático React + Phaser](./docs/GUIA-DIDATICO-REACT-PHASER.md) e pratique com [Exercícios práticos](./docs/EXERCICIOS-PRATICOS.md).

- [Instalação, execução e preview](./docs/SETUP.md)
- [Regras e controles](./docs/CONTROLES-E-REGRAS.md)
- [Arquitetura React + Phaser](./docs/ARQUITETURA.md)
- [QA e checklist manual](./docs/QA-CHECKLIST.md)
- [Solução de problemas](./docs/TROUBLESHOOTING.md)
- [Auditoria e correções](./docs/AUDITORIA-E-CORRECOES.md)
- [Histórico de alterações](./docs/CHANGELOG.md)

## Estrutura principal

```text
src/
├── App.jsx                  # Menu, HUD e telas React
├── main.jsx                 # Entrada da aplicação
├── styles.css               # Interface responsiva
└── game/
    ├── PhaserCanvas.jsx     # Ciclo de vida da instância Phaser
    ├── BreakoutScene.js     # Cena, física, input e progressão
    ├── rules.js             # Regras puras
    └── rules.test.js        # Testes unitários das regras
```

## Limites conhecidos

- O modo Duelo é local; não há multiplayer pela internet.
- A suite automatizada cobre regras puras; colisões, renderização e dispositivos precisam passar pelo checklist manual em [`docs/QA-CHECKLIST.md`](./docs/QA-CHECKLIST.md).
- Phaser é carregado sob demanda ao entrar no jogo. O build pode avisar sobre o tamanho bruto do chunk da engine; consulte [solução de problemas](./docs/TROUBLESHOOTING.md).

Se a aplicação não iniciar, confira primeiro [Solução de problemas](./docs/TROUBLESHOOTING.md) e [Instalação e execução](./docs/SETUP.md).