# Auditoria técnica — Campo Minado Clássico

**Repositório auditado:** https://github.com/davidcreator/Campo-Minado  
**Data da auditoria:** 2026-09-26  
**Perfil da análise:** Desenvolvedor Sênior de jogos 2D/Web, com foco em arquitetura didática, gameplay, React + Phaser e qualidade de código.

---

## 1. Diagnóstico executivo

O projeto atual **não está em React + Phaser**. Ele é uma aplicação estática com:

- `index.html`
- `css/styles.css`
- `js/script.js`
- renderização via **HTML5 Canvas**
- lógica em uma única classe JavaScript: `MinesweeperGame`

Isso não é necessariamente ruim para um protótipo didático, mas há problemas importantes de estado, validação, jogabilidade, responsividade e arquitetura que impedem o projeto de ficar “100%”.

### Estado geral

| Área | Avaliação |
|---|---:|
| Jogabilidade base | Parcial |
| Seleção de dificuldade | Crítica / quebrada |
| Modo personalizado | Crítico |
| Estado/timer | Instável |
| Responsividade/mobile | Parcial |
| Didática para estudantes | Boa intenção, pouca estrutura |
| Arquitetura para evoluir para React + Phaser | Ainda não preparada |
| Testabilidade | Baixa |

### Veredito inicial

O jogo tem boa intenção visual e vários recursos planejados, mas hoje mistura UI, regras, renderização, áudio, persistência e estatísticas em uma única classe. Isso dificulta correção, ensino, manutenção e migração para React + Phaser.

---

## 2. Pontos positivos encontrados

Antes dos problemas, vale reconhecer o que já funciona como boa base didática:

1. **Separação mínima de arquivos**: HTML, CSS e JS separados.
2. **Uso de Canvas**: bom para introduzir renderização 2D.
3. **Primeiro clique seguro**: a mina só é distribuída após o primeiro clique, evitando derrota instantânea.
4. **Flood fill**: células vazias revelam vizinhos automaticamente, conceito importante em jogos de grade.
5. **Temas visuais e estatísticas**: boa ideia para mostrar persistência e UX.
6. **Comentários em português**: positivo para material didático nacional.

---

## 3. Problemas críticos

## 3.1. A dificuldade selecionada sempre volta para “Iniciante”

### Onde ocorre

Arquivo: `js/script.js`

```js
resetGameState() {
    this.gameState = 'ready';
    this.currentDifficulty = 'beginner';
    ...
}
```

Também ocorre em:

```js
selectDifficulty(difficulty) {
    this.currentDifficulty = difficulty;
    ...
    this.stopTimer();
    this.resetGameState();
    this.showScreen('gameScreen');
}
```

E em:

```js
initGame() {
    this.resetGameState();
    const config = this.difficulties[this.currentDifficulty];
    ...
}
```

### Problema

A função `resetGameState()` redefine `currentDifficulty` para `beginner`. Assim, quando o jogador escolhe `intermediate`, `expert` ou `custom`, a seleção é perdida antes do jogo começar.

### Impacto

Crítico. O jogo praticamente fica preso na dificuldade iniciante.

### Correção recomendada

`resetGameState()` não deve alterar a dificuldade atual. A dificuldade é uma configuração de partida, não um campo genérico de reset.

Exemplo didático:

```js
resetGameState() {
    this.gameState = 'ready';
    this.board = [];
    this.revealed = [];
    this.flagged = [];
    this.startTime = null;
    this.timer = 0;
    this.timerInterval = null;
    this.score = 0;
    this.firstClick = true;
    this.isPaused = false;
    this.hintsUsed = 0;
    this.revealedCount = 0;
}
```

E a dificuldade deve ser definida em apenas um lugar:

```js
selectDifficulty(difficulty) {
    this.stopTimer();
    this.currentDifficulty = difficulty;
    this.showScreen('gameScreen');
}
```

### Explicação para estudantes

Estado de jogo e configuração de partida são coisas diferentes:

- Estado de jogo: tempo, tabuleiro, células abertas, placar.
- Configuração de partida: dificuldade, linhas, colunas, minas.

Ao resetar tudo sem critério, o jogo esquece a escolha do jogador.

---

## 3.2. Inputs do modo personalizado iniciam o jogo sem querer

### Onde ocorre

Arquivo: `index.html`

```html
<div class="difficulty-card" data-difficulty="custom">
    <h3>🎯 PERSONALIZADO</h3>
    <div class="card-stats custom-inputs">
        <input type="number" id="customRows" ...>
        <input type="number" id="customCols" ...>
        <input type="number" id="customMines" ...>
    </div>
</div>
```

Arquivo: `js/script.js`

```js
document.querySelectorAll('.difficulty-card').forEach(card => {
    card.addEventListener('click', (e) => this.selectDifficulty(e.currentTarget.dataset.difficulty));
});
```

### Problema

Os inputs estão dentro de uma div clicável. Ao tentar editar linhas, colunas ou minas, o clique no input sobe para o card e dispara `selectDifficulty('custom')`.

### Impacto

Crítico de UX. O jogador tenta configurar o modo personalizado e o jogo começa imediatamente.

### Correção rápida

```js
document.querySelectorAll('.custom-inputs input').forEach(input => {
    input.addEventListener('click', e => e.stopPropagation());
});
```

### Correção ideal

Separar configuração e ação:

```html
<div class="difficulty-card custom-card" data-difficulty="custom">
    <h3>🎯 PERSONALIZADO</h3>
    <div class="card-stats custom-inputs">
        <input type="number" id="customRows" ...>
        <input type="number" id="customCols" ...>
        <input type="number" id="customMines" ...>
    </div>
    <button id="startCustomBtn">Jogar personalizado</button>
</div>
```

### Explicação para estudantes

Eventos no DOM usam propagação. Quando clicamos em um filho, o evento também passa pelo pai. Esse comportamento é chamado de bubbling.

---

## 3.3. Quantidade de minas pode ficar errada no modo personalizado

### Onde ocorre

Arquivo: `js/script.js`

```js
const maxMines = Math.floor((rows * cols) * 0.8);
const validatedMines = Math.min(mines, maxMines);
```

E:

```js
while (minesPlaced < this.mines && attempts < maxAttempts) {
    const row = Math.floor(Math.random() * this.rows);
    const col = Math.floor(Math.random() * this.cols);
    attempts++;
    
    if (avoid.has(`${row},${col}`) || this.board[row][col] === -1) {
        continue;
    }
    
    this.board[row][col] = -1;
    minesPlaced++;
}
```

### Problema

O jogo evita a primeira célula clicada e suas adjacentes. Em um tabuleiro 5x5, se o clique for no centro, 9 células ficam protegidas. Restam 16 posições possíveis para minas.

Mas a validação permite até 20 minas em 5x5, porque calcula 80% de 25.

Resultado: o jogo tenta colocar 20 minas, mas só existem 16 posições válidas. Além disso, como existe um limite de tentativas, pode colocar ainda menos minas.

### Impacto

Crítico. A regra interna do jogo fica inconsistente:

- UI mostra uma quantidade de minas.
- Tabuleiro contém outra quantidade.
- Condição de vitória pode ficar errada.
- Experiência do jogador se torna injusta ou confusa.

### Correção recomendada

Usar uma lista de candidatos válidos e embaralhar. Nunca depender de tentativas aleatórias infinitas ou arbitrárias.

```js
placeMines(avoidRow, avoidCol) {
    const avoid = new Set();

    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const r = avoidRow + dr;
            const c = avoidCol + dc;
            if (this.isValidCell(r, c)) {
                avoid.add(`${r},${c}`);
            }
        }
    }

    const candidates = [];

    for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
            if (!avoid.has(`${row},${col}`)) {
                candidates.push([row, col]);
            }
        }
    }

    if (this.mines > candidates.length) {
        this.mines = candidates.length;
    }

    this.shuffle(candidates);

    for (let i = 0; i < this.mines; i++) {
        const [row, col] = candidates[i];
        this.board[row][col] = -1;
    }

    this.calculateNumbers();
}
```

### Explicação para estudantes

Quando o jogo precisa distribuir elementos aleatórios com restrições, a abordagem mais segura é:

1. Criar lista de posições possíveis.
2. Remover posições proibidas.
3. Embaralhar a lista.
4. Usar as primeiras N posições.

Isso evita loop infinito, inconsistência e bugs difíceis de reproduzir.

---

## 3.4. Voltar ao menu não para o timer

### Onde ocorre

```js
document.getElementById('backToMenu').addEventListener('click', () => this.showScreen('menuScreen'));
```

### Problema

Quando o jogador volta ao menu durante uma partida, o timer continua rodando em segundo plano.

### Impacto

Alto.

- Desperdício de processamento.
- Estado inconsistente.
- Pode afetar tempo total, estatísticas e futuras partidas.

### Correção recomendada

Criar uma função específica para sair da partida:

```js
exitToMenu() {
    this.stopTimer();
    this.isPaused = false;
    this.elements.gameOverlay.classList.add('hidden');
    this.showScreen('menuScreen');
}
```

E registrar:

```js
document.getElementById('backToMenu').addEventListener('click', () => this.exitToMenu());
```

### Explicação para estudantes

Toda tela que inicia processos temporais, como `setInterval`, precisa desligá-los ao sair. Isso evita vazamentos de estado.

---

## 3.5. LocalStorage corrompido quebra a inicialização

### Onde ocorre

```js
const savedSettings = localStorage.getItem('minesweeper_settings');
if (savedSettings) {
    this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
}
```

### Problema

Se o valor salvo no `localStorage` estiver inválido, `JSON.parse` lança erro e o jogo não inicializa.

### Impacto

Alto. Um dado corrompido no navegador do usuário pode impedir o jogo de abrir.

### Correção recomendada

Criar helper seguro:

```js
loadJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        console.warn(`Dados inválidos em ${key}. Resetando valor.`, error);
        localStorage.removeItem(key);
        return fallback;
    }
}
```

Uso:

```js
initializeSettings() {
    const savedSettings = this.loadJSON('minesweeper_settings', {});
    this.settings = { ...this.settings, ...savedSettings };
    this.applySettingsToUI();
}
```

### Explicação para estudantes

Dados externos nunca devem ser considerados confiáveis, mesmo quando vêm do próprio navegador do usuário.

---

# 4. Problemas altos e médios

## 4.1. Sistema de temas não afeta completamente o Canvas

No CSS existem variáveis como:

```css
--cell-unrevealed
--cell-revealed
--cell-mine
```

Mas no Canvas as cores são fixas:

```js
this.ctx.fillStyle = '#6c757d';
```

### Correção recomendada

Ler as variáveis CSS com `getComputedStyle`:

```js
getThemeColor(variableName) {
    return getComputedStyle(document.body)
        .getPropertyValue(variableName)
        .trim();
}
```

Uso:

```js
this.ctx.fillStyle = this.getThemeColor('--cell-unrevealed');
```

### Explicação didática

CSS não pinta automaticamente o conteúdo desenhado dentro do Canvas. O Canvas é como uma “imagem programável”; quem controla as cores é o JavaScript.

---

## 4.2. Botão “Música de Fundo” existe, mas não há música implementada

O HTML e as configurações indicam música:

```js
music: true
```

Mas não existe sistema real de música.

### Problema

Promete recurso inexistente.

### Correção

Escolher uma opção:

1. Remover botão até implementar.
2. Implementar música de fundo de fato.
3. Renomear como “Reservado para versão futura”.

---

## 4.3. “Auto-Bandeira” na verdade faz auto-revelação

A opção no menu diz:

```html
Auto-Bandeira em Números Completos
```

Mas o código chama:

```js
checkAutoReveal()
```

E revela células adjacentes:

```js
adjacent.forEach(([r, c]) => this.revealCell(r, c));
```

### Problema

O nome da opção não corresponde ao comportamento. Isso confunde o jogador e os estudantes.

### Correção

Ou renomear para:

```txt
Auto-revelar vizinhos quando número estiver satisfeito
```

Ou implementar auto-bandeira real, que marcaria células deduzidas como minas.

---

## 4.4. AudioContext é criado a cada som

```js
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
```

### Problema

Criar um novo `AudioContext` para cada clique é custoso e pode ser bloqueado por navegadores.

### Correção recomendada

Criar uma única instância:

```js
getAudioContext() {
    if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
}
```

---

## 4.5. Não há suporte adequado para mobile

Campo Minado depende de clique direito para bandeira. Em mobile, não há clique direito.

### Correção recomendada

Adicionar:

- toque curto para revelar;
- toque longo para bandeira;
- botão de modo “Bandeira/Revelar”;
- feedback visual de toque.

### Explicação didática

Jogos web precisam mapear controles diferentes para mouse, teclado e toque. Uma boa arquitetura isola input da regra de jogo.

---

## 4.6. Canvas não tem acessibilidade suficiente

O Canvas não oferece estrutura semântica para leitores de tela.

### Melhorias

- Adicionar `aria-label` no canvas.
- Adicionar instruções claras fora do canvas.
- Permitir navegação por teclado.
- Criar foco visual da célula selecionada.

Exemplo:

```html
<canvas
  id="gameCanvas"
  role="application"
  aria-label="Campo minado. Use setas para navegar, Enter para revelar e Espaço para marcar bandeira."
></canvas>
```

---

## 4.7. Arquivo `script.js` está grande demais para fins didáticos

O arquivo possui mais de mil linhas e mistura:

- estado de jogo;
- renderização;
- DOM;
- áudio;
- estatísticas;
- localStorage;
- input;
- regras do Campo Minado.

### Correção arquitetural

Separar em módulos:

```txt
src/
  core/
    Board.js
    Rules.js
    Difficulty.js
  rendering/
    CanvasRenderer.js
  services/
    StorageService.js
    AudioService.js
  ui/
    Screens.js
    Hud.js
  main.js
```

### Explicação didática

Quando tudo fica em uma classe só, qualquer correção tem risco de quebrar outra parte. Separar responsabilidades ajuda o estudante a entender cada conceito isoladamente.

---

# 5. Problemas de documentação e projeto

O repositório original é extremamente simples em estrutura. Para um projeto educacional, faltam:

1. `README.md` com objetivo, prints, como executar e conceitos ensinados.
2. `LICENSE`.
3. `CONTRIBUTING.md`, se for aceitar contribuições.
4. Checklist didático por aula.
5. Testes automatizados da lógica do tabuleiro.
6. Separação de versão vanilla e versão React + Phaser.

## README recomendado

Estrutura sugerida:

```md
# Campo Minado Clássico

Projeto didático para ensino de desenvolvimento de jogos web.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Canvas API

## Conceitos ensinados

- Grade bidimensional
- Eventos de mouse
- Flood fill
- Distribuição aleatória com restrições
- Estado de jogo
- Persistência com localStorage

## Como executar

Abra `index.html` no navegador ou rode um servidor local.

## Roadmap

- Correção da seleção de dificuldade
- Modo mobile
- Testes automatizados
- Refatoração modular
- Migração para React + Phaser
```

---

# 6. Roadmap recomendado de correção

## Fase 1 — Hotfix de jogabilidade

Prioridade máxima:

1. Corrigir seleção de dificuldade.
2. Corrigir clique nos inputs personalizados.
3. Corrigir distribuição de minas.
4. Parar timer ao sair do jogo.
5. Proteger `localStorage` com `try/catch`.

## Fase 2 — Qualidade e UX

1. Temas aplicados no Canvas.
2. Melhorar mobile/touch.
3. Corrigir nomes de configurações.
4. Remover ou implementar música.
5. Melhorar mensagens de vitória/derrota.
6. Melhorar acessibilidade.

## Fase 3 — Didática

1. Comentar algoritmos importantes.
2. Separar módulos.
3. Criar README com explicações.
4. Criar testes unitários para a lógica do tabuleiro.
5. Criar exercícios para estudantes.

## Fase 4 — React + Phaser

Arquitetura sugerida:

```txt
src/
  App.jsx
  components/
    MainMenu.jsx
    DifficultySelect.jsx
    Hud.jsx
    SettingsPanel.jsx
  game/
    PhaserGame.jsx
    scenes/
      MinesweeperScene.js
    systems/
      BoardSystem.js
      InputSystem.js
      ScoreSystem.js
      TimerSystem.js
    events/
      EventBus.js
  services/
    StorageService.js
    AudioService.js
```

### Divisão ideal

| Camada | Responsabilidade |
|---|---|
| React | Menus, HUD, configurações, telas, estatísticas |
| Phaser | Cena do jogo, renderização, input do tabuleiro, animações |
| Core JS | Regras puras do Campo Minado |
| Services | localStorage, áudio, persistência |

### Regra didática importante

A lógica do Campo Minado deve funcionar sem React e sem Phaser. React e Phaser devem apenas exibir e interagir com essa lógica.

---

# 7. Testes que devem ser criados

## Testes essenciais da lógica

1. O primeiro clique nunca pode conter mina.
2. A área ao redor do primeiro clique deve ser segura, se essa for a regra desejada.
3. O número real de minas deve ser igual ao número configurado.
4. Células numéricas devem contar minas adjacentes corretamente.
5. Flood fill não deve revelar minas.
6. Vitória deve ocorrer apenas quando todas as células seguras forem reveladas.
7. Dificuldade escolhida deve ser mantida.
8. LocalStorage inválido não deve quebrar o jogo.

## Exemplo de teste didático

```js
test('primeiro clique não pode conter mina', () => {
    const board = createBoard({ rows: 9, cols: 9, mines: 10 });
    placeMines(board, { safeRow: 4, safeCol: 4 });

    expect(board[4][4].hasMine).toBe(false);
});
```

---

# 8. Prioridade dos bugs encontrados

| Prioridade | Problema | Impacto |
|---|---|---|
| P0 | Seleção de dificuldade reseta para iniciante | Quebra recurso principal |
| P0 | Modo personalizado inicia ao clicar nos inputs | Quebra UX |
| P0 | Distribuição de minas pode gerar tabuleiro inconsistente | Quebra regra central |
| P1 | Timer continua ao voltar ao menu | Estado inconsistente |
| P1 | LocalStorage corrompido quebra boot | Jogo pode não abrir |
| P2 | Temas não afetam Canvas completamente | Inconsistência visual |
| P2 | Música prometida não implementada | UX enganosa |
| P2 | Auto-bandeira com comportamento incorreto | Confusão de regra |
| P2 | AudioContext criado a cada som | Performance/manutenção |
| P3 | Pouca acessibilidade e mobile | Alcance menor |
| P3 | Falta README e testes | Didática incompleta |

---

# 9. Próxima ação recomendada

Minha recomendação como próximo passo é aplicar uma correção incremental em vez de reescrever tudo de uma vez:

1. Corrigir os P0 no código atual vanilla.
2. Criar testes da lógica do tabuleiro.
3. Modularizar o projeto.
4. Só depois migrar para React + Phaser.

Isso é melhor pedagogicamente, porque os estudantes conseguem comparar:

- versão com bugs;
- versão corrigida;
- versão refatorada;
- versão React + Phaser.

---

## Conclusão

O projeto tem bom potencial didático, mas hoje precisa de correções estruturais antes de ser apresentado como versão completa. A maior prioridade é separar estado, configuração e regras do jogo. O principal bug imediato é a seleção de dificuldade: a aplicação aparenta oferecer vários modos, mas a lógica reseta tudo para iniciante.

Com os hotfixes certos e uma organização em módulos, esse projeto pode se tornar um excelente material para ensinar desenvolvimento de jogos web, primeiro com Canvas puro e depois com React + Phaser.
