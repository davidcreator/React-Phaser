# Campo Minado Clássico — React + Phaser

Versão didática do **Campo Minado Clássico** reescrita com **React + Phaser**, corrigindo os principais problemas encontrados na auditoria técnica do projeto original.

## Objetivo

Este projeto serve como material de estudo para desenvolvimento de jogos 2D web. A arquitetura separa:

- **React**: menus, HUD, configurações, estatísticas e telas.
- **Phaser**: cena do jogo, renderização do tabuleiro e input 2D.
- **Core JavaScript**: regras puras do Campo Minado, testáveis sem React e sem Phaser.

## Principais correções aplicadas

- Dificuldade escolhida não é mais perdida ao iniciar partida.
- Inputs do modo personalizado não iniciam o jogo por acidente.
- Minas são distribuídas por lista de candidatos válidos, evitando quantidade errada.
- Primeiro clique seguro protege a célula inicial e adjacentes.
- Timer para corretamente ao pausar, reiniciar, sair ou finalizar.
- `localStorage` é lido com segurança contra JSON corrompido.
- Temas visuais também afetam a renderização do Phaser.
- A antiga opção “Auto-Bandeira” foi corrigida para “Auto-revelar vizinhos”.
- Suporte mobile com toque longo e modo bandeira.
- Regras do tabuleiro possuem testes automatizados.

## Como executar

```bash
npm install
npm run dev
```

Depois acesse o endereço exibido pelo Vite.

## Scripts disponíveis

```bash
npm run dev      # inicia ambiente de desenvolvimento
npm run build    # gera build de produção
npm run preview  # pré-visualiza build
npm run test     # executa testes do core do jogo
```

## Estrutura do projeto

```txt
src/
  App.jsx                      # UI React e telas
  styles.css                   # Estilos globais e responsivos
  game/
    PhaserGame.jsx             # Componente React que instancia o Phaser
    EventBus.js                # Comunicação React <-> Phaser
    themes.js                  # Paletas compartilhadas
    core/
      board.js                 # Regras puras do Campo Minado
      difficulties.js          # Presets e validação do modo personalizado
    scenes/
      MinesweeperScene.js      # Cena Phaser do tabuleiro
  services/
    audio.js                   # Áudio com AudioContext reutilizável
    storage.js                 # localStorage seguro

tests/
  board.test.js                # Testes da lógica do tabuleiro

Docs/
  AUDITORIA-CORRECOES.md
  ARQUITETURA.md
  GUIA-DIDATICO.md
  CONTROLES.md
  TESTES.md
  ROADMAP.md
  DECISOES-TECNICAS.md
```

## Controles

| Ação | Desktop | Mobile |
|---|---|---|
| Revelar célula | Clique esquerdo | Toque curto |
| Marcar bandeira | Clique direito | Toque longo |
| Modo bandeira | Botão 🚩 | Botão 🚩 |
| Revelar vizinhos de número satisfeito | Duplo clique | Toque duplo/click duplo quando suportado |
| Dica | Botão 💡 | Botão 💡 |
| Pausar | Botão ⏸️ | Botão ⏸️ |

## Documentação

A pasta [`Docs/`](./Docs) contém documentos pensados para estudantes e manutenção do projeto:

- [Auditoria e correções](./Docs/AUDITORIA-CORRECOES.md)
- [Arquitetura](./Docs/ARQUITETURA.md)
- [Guia didático](./Docs/GUIA-DIDATICO.md)
- [Controles](./Docs/CONTROLES.md)
- [Testes](./Docs/TESTES.md)
- [Roadmap](./Docs/ROADMAP.md)
- [Decisões técnicas](./Docs/DECISOES-TECNICAS.md)

## Licença

MIT — uso livre para estudo, aulas e evolução do projeto.
