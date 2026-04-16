console.log('🎮 Iniciando Damas Clássico...');

// === CONFIGURAÇÕES GLOBAIS ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const BOARD_SIZE = 8;
const CELL_SIZE = 60;

// Cores do jogo
const COLORS = {
    lightSquare: '#f0d9b5',
    darkSquare: '#b58863',
    red: '#dc3545',
    black: '#343a40',
    redKing: '#ff6b6b',
    blackKing: '#6c757d',
    selected: '#feca57',
    possible: '#28a745'
};

// === ESTADO GLOBAL ===
let gameSettings = {
    player1Name: 'Jogador 1',
    player2Name: 'Jogador 2',
    timePerTurn: 5,
    soundEnabled: true,
    selectedMode: 'classic',
    aiDifficulty: 'easy'
};

let gameState = {
    board: [],
    currentPlayer: 'red',
    selectedPiece: null,
    possibleMoves: [],
    redCount: 12,
    blackCount: 12,
    gameOver: false,
    mustCapture: false,
    moveHistory: [],
    isPaused: false,
    timeLeft: 300,
    timerInterval: null,
    isAITurn: false
};

// === FUNÇÕES DA TELA INICIAL ===
function selectGameMode(mode) {
    console.log('🎯 Selecionando modo:', mode);
    gameSettings.selectedMode = mode;
    
    // Remover seleção de todos os cards
    document.querySelectorAll('.mode-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Selecionar o card atual
    const selectedCard = document.querySelector(`[data-mode="${mode}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        console.log('✅ Card selecionado:', mode);
    }
    
    // Mostrar/ocultar seletor de dificuldade
    const difficultySelector = document.getElementById('difficultySelector');
    if (mode === 'ai') {
        difficultySelector.style.display = 'block';
        console.log('🤖 Mostrando seletor de dificuldade');
    } else {
        difficultySelector.style.display = 'none';
    }
}

function startGame() {
    console.log('🚀 Iniciando jogo no modo:', gameSettings.selectedMode);
    
    // Esconder tela inicial
    document.getElementById('mainScreen').style.display = 'none';
    // Mostrar tela de jogo
    document.getElementById('gameScreen').style.display = 'block';
    
    console.log('📺 Telas alternadas');
    
    // Configurar modo de jogo
    setupGameMode();
    
    // Inicializar jogo
    initGame();
    
    console.log('✅ Jogo iniciado com sucesso!');
}

function setupGameMode() {
    console.log('⚙️ Configurando modo:', gameSettings.selectedMode);
    
    const gameMode = document.getElementById('gameMode');
    const player1Name = document.getElementById('player1Name');
    const player2Name = document.getElementById('player2Name');
    const timerDisplay = document.getElementById('timerDisplay');
    
    switch (gameSettings.selectedMode) {
        case 'classic':
            gameMode.textContent = '👥 Modo Clássico';
            player1Name.textContent = `${gameSettings.player1Name} (Vermelho)`;
            player2Name.textContent = `${gameSettings.player2Name} (Preto)`;
            timerDisplay.style.display = 'none';
            break;
            
        case 'ai':
            gameMode.textContent = '🤖 Contra IA';
            player1Name.textContent = `${gameSettings.player1Name} (Vermelho)`;
            player2Name.textContent = `IA ${gameSettings.aiDifficulty.toUpperCase()} (Preto)`;
            timerDisplay.style.display = 'none';
            break;
            
        case 'timed':
            gameMode.textContent = '⏰ Modo Cronometrado';
            player1Name.textContent = `${gameSettings.player1Name} (Vermelho)`;
            player2Name.textContent = `${gameSettings.player2Name} (Preto)`;
            timerDisplay.style.display = 'block';
            startTimer();
            break;
            
        case 'tutorial':
            gameMode.textContent = '🎓 Tutorial Interativo';
            player1Name.textContent = `${gameSettings.player1Name} (Vermelho)`;
            player2Name.textContent = 'Tutorial (Preto)';
            timerDisplay.style.display = 'none';
            break;
    }
    
    console.log('✅ Modo configurado');
}

function backToMenu() {
    console.log('🏠 Voltando ao menu');
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('mainScreen').style.display = 'block';
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
}

// === INICIALIZAÇÃO DO JOGO ===
function initGame() {
    console.log('🎲 Inicializando tabuleiro...');
    
    // Criar tabuleiro vazio
    gameState.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    
    // Colocar peças pretas (parte superior)
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if ((row + col) % 2 === 1) {
                gameState.board[row][col] = { color: 'black', isKing: false };
            }
        }
    }
    
    // Colocar peças vermelhas (parte inferior)
    for (let row = 5; row < 8; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if ((row + col) % 2 === 1) {
                gameState.board[row][col] = { color: 'red', isKing: false };
            }
        }
    }
    
    // Reset do estado
    gameState.currentPlayer = 'red';
    gameState.selectedPiece = null;
    gameState.possibleMoves = [];
    gameState.redCount = 12;
    gameState.blackCount = 12;
    gameState.gameOver = false;
    gameState.mustCapture = false;
    gameState.moveHistory = [];
    gameState.isPaused = false;
    gameState.isAITurn = false;
    
    console.log('✅ Tabuleiro inicializado');
    
    updateDisplay();
    drawBoard();
}

// === FUNÇÕES DE DESENHO ===
function drawBoard() {
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar tabuleiro
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const x = col * CELL_SIZE;
            const y = row * CELL_SIZE;
            
            // Cor da casa
            ctx.fillStyle = (row + col) % 2 === 0 ? COLORS.lightSquare : COLORS.darkSquare;
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            
            // Destacar casa selecionada
            if (gameState.selectedPiece && 
                gameState.selectedPiece.row === row && 
                gameState.selectedPiece.col === col) {
                ctx.fillStyle = COLORS.selected;
                ctx.globalAlpha = 0.7;
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                ctx.globalAlpha = 1;
            }
            
            // Destacar movimentos possíveis
            if (gameState.possibleMoves.some(move => move.row === row && move.col === col)) {
                ctx.fillStyle = COLORS.possible;
                ctx.globalAlpha = 0.5;
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                ctx.globalAlpha = 1;
            }
            
            // Desenhar peça
            const piece = gameState.board[row][col];
            if (piece) {
                drawPiece(x + CELL_SIZE/2, y + CELL_SIZE/2, piece);
            }
        }
    }
}

function drawPiece(x, y, piece) {
    const radius = CELL_SIZE * 0.35;
    
    // Sombra
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Círculo principal
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = piece.isKing ? 
        (piece.color === 'red' ? COLORS.redKing : COLORS.blackKing) :
        (piece.color === 'red' ? COLORS.red : COLORS.black);
    ctx.fill();
    
    // Borda
    ctx.strokeStyle = piece.color === 'red' ? '#721c24' : '#1d2124';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Reset sombra
    ctx.shadowColor = 'transparent';
    
    // Coroa para dama
    if (piece.isKing) {
        ctx.fillStyle = '#ffd700';
        ctx.font = `${radius}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♔', x, y);
    }
}

// === LÓGICA DE MOVIMENTO ===
function isValidPosition(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function getPossibleMoves(row, col, mustCapture = false) {
    const piece = gameState.board[row][col];
    if (!piece || piece.color !== gameState.currentPlayer) return [];
    
    const moves = [];
    const directions = [];
    
    // Definir direções baseadas no tipo de peça
    if (piece.isKing) {
        directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    } else {
        if (piece.color === 'red') {
            directions.push([-1, -1], [-1, 1]); // Para cima
        } else {
            directions.push([1, -1], [1, 1]); // Para baixo
        }
    }
    
    // Verificar capturas primeiro
    for (const [dRow, dCol] of directions) {
        const newRow = row + dRow;
        const newCol = col + dCol;
        
        if (isValidPosition(newRow, newCol)) {
            const targetPiece = gameState.board[newRow][newCol];
            
            if (targetPiece && targetPiece.color !== piece.color) {
                // Possível captura
                const jumpRow = newRow + dRow;
                const jumpCol = newCol + dCol;
                
                if (isValidPosition(jumpRow, jumpCol) && !gameState.board[jumpRow][jumpCol]) {
                    moves.push({
                        row: jumpRow,
                        col: jumpCol,
                        isCapture: true,
                        capturedRow: newRow,
                        capturedCol: newCol
                    });
                }
            }
        }
    }
    
    // Se há capturas obrigatórias, retornar apenas elas
    if (moves.length > 0 || mustCapture) {
        return moves;
    }
    
    // Movimentos normais (sem captura)
    for (const [dRow, dCol] of directions) {
        const newRow = row + dRow;
        const newCol = col + dCol;
        
        if (isValidPosition(newRow, newCol) && !gameState.board[newRow][newCol]) {
            moves.push({
                row: newRow,
                col: newCol,
                isCapture: false
            });
        }
    }
    
    return moves;
}

function hasCaptures(player) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = gameState.board[row][col];
            if (piece && piece.color === player) {
                const captures = getPossibleMoves(row, col, true);
                if (captures.length > 0) return true;
            }
        }
    }
    return false;
}

// === EVENTOS DO MOUSE ===
function setupCanvasEvents() {
    canvas.addEventListener('click', function(event) {
        if (gameState.gameOver || gameState.isPaused || gameState.isAITurn) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const col = Math.floor(x / CELL_SIZE);
        const row = Math.floor(y / CELL_SIZE);
        
        if (!isValidPosition(row, col)) return;
        
        console.log('🖱️ Clique no tabuleiro:', row, col);
        
        // Se há uma peça selecionada
        if (gameState.selectedPiece) {
            // Verificar se clicou em um movimento possível
            const move = gameState.possibleMoves.find(m => m.row === row && m.col === col);
            
            if (move) {
                saveGameState();
                makeMove(gameState.selectedPiece, move);
            } else {
                // Desselecionar ou selecionar nova peça
                selectPiece(row, col);
            }
        } else {
            // Selecionar peça
            selectPiece(row, col);
        }
    });
}

function selectPiece(row, col) {
    const piece = gameState.board[row][col];
    
    if (!piece || piece.color !== gameState.currentPlayer) {
        gameState.selectedPiece = null;
        gameState.possibleMoves = [];
        drawBoard();
        return;
    }
    
    console.log('✋ Peça selecionada:', row, col, piece.color);
    
    gameState.selectedPiece = { row, col };
    gameState.mustCapture = hasCaptures(gameState.currentPlayer);
    gameState.possibleMoves = getPossibleMoves(row, col, gameState.mustCapture);
    
    drawBoard();
}

function makeMove(from, to) {
    const piece = gameState.board[from.row][from.col];
    console.log('🎯 Fazendo movimento:', from, 'para', to);
    
    // Mover peça
    gameState.board[to.row][to.col] = piece;
    gameState.board[from.row][from.col] = null;
    
    // Captura
    if (to.isCapture) {
        const capturedPiece = gameState.board[to.capturedRow][to.capturedCol];
        gameState.board[to.capturedRow][to.capturedCol] = null;
        
        if (capturedPiece.color === 'red') {
            gameState.redCount--;
        } else {
            gameState.blackCount--;
        }
        
        console.log('💥 Peça capturada!', capturedPiece.color);
        
        // Verificar capturas múltiplas
        const additionalCaptures = getPossibleMoves(to.row, to.col, true);
        if (additionalCaptures.length > 0) {
            gameState.selectedPiece = { row: to.row, col: to.col };
            gameState.possibleMoves = additionalCaptures;
            drawBoard();
            updateDisplay();
            return; // Não trocar de jogador ainda
        }
    }
    
    // Promover a dama
    if (!piece.isKing) {
        if ((piece.color === 'red' && to.row === 0) || 
            (piece.color === 'black' && to.row === BOARD_SIZE - 1)) {
            piece.isKing = true;
            console.log('👑 Nova dama criada!', piece.color);
        }
    }
    
    // Limpar seleção
    gameState.selectedPiece = null;
    gameState.possibleMoves = [];
    
    // Trocar jogador
    gameState.currentPlayer = gameState.currentPlayer === 'red' ? 'black' : 'red';
    console.log('🔄 Vez do jogador:', gameState.currentPlayer);
    
    // Reset timer para próximo jogador
    if (gameSettings.selectedMode === 'timed') {
        resetTimer();
    }
    
    // Verificar fim de jogo
    checkGameOver();
    
    drawBoard();
    updateDisplay();
    
    // IA move após jogador humano
    if (gameSettings.selectedMode === 'ai' && gameState.currentPlayer === 'black' && !gameState.gameOver) {
        setTimeout(makeAIMove, 500);
    }
}

// === SISTEMA DE IA ===
function makeAIMove() {
    if (gameState.currentPlayer !== 'black' || gameState.gameOver || gameSettings.selectedMode !== 'ai') {
        return;
    }
    
    gameState.isAITurn = true;
    document.getElementById('status').textContent = '🤖 IA está pensando...';
    
    setTimeout(() => {
        const aiMove = getAIMove();
        if (aiMove) {
            gameState.selectedPiece = { row: aiMove.from.row, col: aiMove.from.col };
            makeMove(aiMove.from, aiMove.to);
        }
        gameState.isAITurn = false;
    }, 1000 + Math.random() * 1500); // Simular "pensamento"
}

function getAIMove() {
    const allMoves = [];
    
    // Coletar todos os movimentos possíveis
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = gameState.board[row][col];
            if (piece && piece.color === 'black') {
                const moves = getPossibleMoves(row, col, hasCaptures('black'));
                moves.forEach(move => {
                    allMoves.push({
                        from: { row, col },
                        to: move,
                        score: evaluateMove(row, col, move)
                    });
                });
            }
        }
    }
    
    if (allMoves.length === 0) return null;
    
    // Escolher movimento baseado na dificuldade
    switch (gameSettings.aiDifficulty) {
        case 'easy':
            return allMoves[Math.floor(Math.random() * allMoves.length)];
            
        case 'medium':
            // 70% chance de escolher um bom movimento
            allMoves.sort((a, b) => b.score - a.score);
            const topMoves = allMoves.slice(0, Math.ceil(allMoves.length * 0.3));
            return Math.random() < 0.7 ? topMoves[0] : allMoves[Math.floor(Math.random() * allMoves.length)];
            
        case 'hard':
            // Sempre escolher o melhor movimento
            return allMoves.reduce((best, current) => current.score > best.score ? current : best);
            
        default:
            return allMoves[Math.floor(Math.random() * allMoves.length)];
    }
}

function evaluateMove(fromRow, fromCol, move) {
    let score = 0;
    
    // Priorizar capturas
    if (move.isCapture) {
        score += 10;
        
        // Capturar damas vale mais
        const capturedPiece = gameState.board[move.capturedRow][move.capturedCol];
        if (capturedPiece && capturedPiece.isKing) {
            score += 5;
        }
    }
    
    // Priorizar movimento para virar dama
    if (move.row === BOARD_SIZE - 1) {
        score += 8;
    }
    
    // Evitar bordas (posição defensiva)
    if (move.col === 0 || move.col === BOARD_SIZE - 1) {
        score += 2;
    }
    
    // Movimento central vale mais
    const centerDistance = Math.abs(move.row - BOARD_SIZE/2) + Math.abs(move.col - BOARD_SIZE/2);
    score += (BOARD_SIZE - centerDistance) * 0.5;
    
    return score;
}

function checkGameOver() {
    // Verificar se alguém perdeu todas as peças
    if (gameState.redCount === 0) {
        gameState.gameOver = true;
        const winner = gameSettings.selectedMode === 'ai' ? 'IA' : gameSettings.player2Name;
        document.getElementById('status').textContent = `🎉 ${winner} (Preto) Venceu! 🎉`;
        if (gameState.timerInterval) clearInterval(gameState.timerInterval);
        return;
    }
    
    if (gameState.blackCount === 0) {
        gameState.gameOver = true;
        document.getElementById('status').textContent = `🎉 ${gameSettings.player1Name} (Vermelho) Venceu! 🎉`;
        if (gameState.timerInterval) clearInterval(gameState.timerInterval);
        return;
    }
    
    // Verificar se o jogador atual tem movimentos
    let hasValidMoves = false;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = gameState.board[row][col];
            if (piece && piece.color === gameState.currentPlayer) {
                const moves = getPossibleMoves(row, col, hasCaptures(gameState.currentPlayer));
                if (moves.length > 0) {
                    hasValidMoves = true;
                    break;
                }
            }
        }
        if (hasValidMoves) break;
    }
    
    if (!hasValidMoves) {
        gameState.gameOver = true;
        const winner = gameState.currentPlayer === 'red' ? 
            (gameSettings.selectedMode === 'ai' ? 'IA' : gameSettings.player2Name) : 
            gameSettings.player1Name;
        document.getElementById('status').textContent = `🎉 ${winner} Venceu! 🎉`;
        if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    }
}

// === FUNÇÕES DE INTERFACE ===
function updateDisplay() {
    document.getElementById('redCount').textContent = gameState.redCount;
    document.getElementById('blackCount').textContent = gameState.blackCount;
    
    const player1Info = document.getElementById('player1Info');
    const player2Info = document.getElementById('player2Info');
    
    if (gameState.currentPlayer === 'red') {
        player1Info.classList.add('active');
        player2Info.classList.remove('active');
    } else {
        player1Info.classList.remove('active');
        player2Info.classList.add('active');
    }
    
    updateGameStatus();
}

function updateGameStatus() {
    if (gameState.gameOver || gameState.isPaused) return;
    
    const currentPlayerName = gameState.currentPlayer === 'red' ? 
        gameSettings.player1Name : 
        (gameSettings.selectedMode === 'ai' ? 'IA' : gameSettings.player2Name);
    
    document.getElementById('status').textContent = `Vez de ${currentPlayerName} (${gameState.currentPlayer === 'red' ? 'Vermelho' : 'Preto'})`;
}

// === OUTRAS FUNÇÕES ===
function resetGame() {
    console.log('🔄 Resetando jogo...');
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    initGame();
}

function saveGameState() {
    gameState.moveHistory.push({
        board: gameState.board.map(row => row.map(cell => cell ? {...cell} : null)),
        currentPlayer: gameState.currentPlayer,
        redCount: gameState.redCount,
        blackCount: gameState.blackCount
    });
    
    // Limitar histórico a 10 movimentos
    if (gameState.moveHistory.length > 10) {
        gameState.moveHistory.shift();
    }
}

function undoMove() {
    if (gameState.moveHistory.length === 0 || gameState.gameOver) return;
    
    const lastState = gameState.moveHistory.pop();
    gameState.board = lastState.board.map(row => row.map(cell => cell ? {...cell} : null));
    gameState.currentPlayer = lastState.currentPlayer;
    gameState.redCount = lastState.redCount;
    gameState.blackCount = lastState.blackCount;
    gameState.selectedPiece = null;
    gameState.possibleMoves = [];
    
    if (gameSettings.selectedMode === 'timed') {
        resetTimer();
    }
    
    drawBoard();
    updateDisplay();
}

function pauseGame() {
    gameState.isPaused = !gameState.isPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (gameState.isPaused) {
        pauseBtn.textContent = '▶️ Retomar';
        document.getElementById('status').textContent = '⏸️ Jogo Pausado';
    } else {
        pauseBtn.textContent = '⏸️ Pausar';
        updateGameStatus();
    }
}

function showGameTutorial() {
    if (gameSettings.selectedMode === 'tutorial') {
        showTutorialHint();
    } else {
        const tutorial = document.getElementById('tutorial');
        tutorial.style.display = tutorial.style.display === 'none' ? 'block' : 'none';
    }
}

function showTutorialHint() {
    const hints = [
        "💡 Dica: Peças só se movem nas casas escuras, sempre na diagonal!",
        "💡 Dica: Se você pode capturar uma peça inimiga, é obrigatório fazê-lo!",
        "💡 Dica: Ao chegar na última fileira, sua peça vira dama e pode andar para trás!",
        "💡 Dica: Damas podem se mover em qualquer direção diagonal!",
        "💡 Dica: Tente proteger suas peças mantendo-as junto às bordas!",
        "💡 Dica: Capturas múltiplas são possíveis - continue pulando peças inimigas!"
    ];
    
    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    document.getElementById('status').textContent = randomHint;
    
    setTimeout(() => {
        if (!gameState.gameOver) {
            updateGameStatus();
        }
    }, 3000);
}

function showSettings() {
    console.log('⚙️ Abrindo configurações');
    document.getElementById('settingsModal').style.display = 'block';
    document.getElementById('player1NameInput').value = gameSettings.player1Name;
    document.getElementById('player2NameInput').value = gameSettings.player2Name;
    document.getElementById('timePerTurn').value = gameSettings.timePerTurn;
    document.getElementById('soundEnabled').value = gameSettings.soundEnabled;
}

function closeSettings() {
    console.log('❌ Fechando configurações');
    document.getElementById('settingsModal').style.display = 'none';
}

function saveSettings() {
    gameSettings.player1Name = document.getElementById('player1NameInput').value || 'Jogador 1';
    gameSettings.player2Name = document.getElementById('player2NameInput').value || 'Jogador 2';
    gameSettings.timePerTurn = parseInt(document.getElementById('timePerTurn').value);
    gameSettings.soundEnabled = document.getElementById('soundEnabled').value === 'true';
    
    console.log('💾 Configurações salvas:', gameSettings);
    closeSettings();
}

function showTutorial() {
    console.log('📖 Mostrando/ocultando tutorial');
    const tutorial = document.getElementById('tutorial');
    tutorial.style.display = tutorial.style.display === 'none' ? 'block' : 'none';
}

// === SISTEMA DE TIMER ===
function startTimer() {
    gameState.timeLeft = gameSettings.timePerTurn * 60;
    updateTimerDisplay();
    
    gameState.timerInterval = setInterval(() => {
        if (!gameState.isPaused && !gameState.gameOver) {
            gameState.timeLeft--;
            updateTimerDisplay();
            
            if (gameState.timeLeft <= 0) {
                timeUp();
            }
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = gameState.timeLeft % 60;
    document.getElementById('timeLeft').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function resetTimer() {
    gameState.timeLeft = gameSettings.timePerTurn * 60;
    updateTimerDisplay();
}

function timeUp() {
    const winner = gameState.currentPlayer === 'red' ? gameSettings.player2Name : gameSettings.player1Name;
    
    gameState.gameOver = true;
    document.getElementById('status').textContent = `⏰ Tempo esgotado! ${winner} venceu!`;
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
}

// === INICIALIZAÇÃO COMPLETA ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 DOM carregado, configurando eventos...');

    // Configurar event listeners dos botões principais
    document.getElementById('startGameBtn').onclick = startGame;
    document.getElementById('settingsBtn').onclick = showSettings;
    document.getElementById('tutorialBtn').onclick = showTutorial;

    // Configurar event listeners dos cards de modo
    document.querySelectorAll('.mode-card').forEach(card => {
        card.onclick = function() {
            const mode = this.dataset.mode;
            selectGameMode(mode);
        };
    });

    // Configurar event listeners dos botões de dificuldade
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            gameSettings.aiDifficulty = this.dataset.level;
            console.log('🎯 Dificuldade selecionada:', gameSettings.aiDifficulty);
        };
    });

    // Configurar event listeners da tela de jogo
    document.getElementById('backBtn').onclick = backToMenu;
    document.getElementById('resetBtn').onclick = resetGame;
    document.getElementById('undoBtn').onclick = undoMove;
    document.getElementById('pauseBtn').onclick = pauseGame;
    document.getElementById('hintBtn').onclick = showGameTutorial;

    // Configurar event listeners do modal
    document.getElementById('saveSettingsBtn').onclick = saveSettings;
    document.getElementById('cancelSettingsBtn').onclick = closeSettings;

    // Event listener para fechar modal clicando fora
    document.getElementById('settingsModal').onclick = function(e) {
        if (e.target === this) {
            closeSettings();
        }
    };

    // Configurar eventos do canvas
    setupCanvasEvents();

    console.log('✅ Todos os eventos configurados com sucesso!');
    console.log('🎲 Modo padrão selecionado: classic');
});