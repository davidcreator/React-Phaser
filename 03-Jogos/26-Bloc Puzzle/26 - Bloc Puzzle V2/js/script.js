const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
let score = 0;

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// Cores das peças
const COLORS = ["red", "green", "yellow", "blue", "purple"];

// Função para desenhar o tabuleiro
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                ctx.fillStyle = board[row][col];
                ctx.fillRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

// Função para gerar peças aleatórias
function randomPiece() {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const isSpecial = Math.random() < 0.1;  // 10% de chance de ser uma peça especial
    return { color, isSpecial };
}

// Função para desenhar a peça atual
function drawPiece(piece, x, y) {
    if (piece.isSpecial) {
        ctx.fillStyle = piece.color;
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = "white";  // Contorno branco para destaque
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    } else {
        ctx.fillStyle = piece.color;
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
}

// Função para verificar colisões
function checkCollision(x, y) {
    return x < 0 || x >= COLS || y >= ROWS || board[y][x];
}

// Função para fixar a peça no tabuleiro
function placePiece(piece, x, y) {
    board[y][x] = piece.color;
}

// Função para remover peças conectadas
function removeConnectedPieces(color, x, y) {
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    let toRemove = [];

    function dfs(row, col) {
        if (row < 0 || col < 0 || row >= ROWS || col >= COLS) return;
        if (visited[row][col] || board[row][col] !== color) return;

        visited[row][col] = true;
        toRemove.push([row, col]);

        dfs(row - 1, col);
        dfs(row + 1, col);
        dfs(row, col - 1);
        dfs(row, col + 1);
    }

    dfs(y, x);
    for (const [r, c] of toRemove) {
        board[r][c] = 0;
    }
}

// Função para gerar um par de peças
function generatePair() {
    return [randomPiece(), randomPiece()];
}

// Variáveis para as peças atuais
let currentPair = generatePair();
let nextPair = generatePair();
let currentX = 3; // Posição inicial da peça
let currentY = 0;
let dropStart = Date.now(); // Controle de tempo
let isVertical = true; // Estado inicial da peça (vertical)

// Controle do teclado
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && !checkCollision(currentX - 1, currentY) && (!isVertical || !checkCollision(currentX - 1, currentY + 1))) {
        currentX--;
    } else if (e.key === 'ArrowRight' && !checkCollision(currentX + 1, currentY) && (!isVertical || !checkCollision(currentX + 1, currentY + 1))) {
        currentX++;
    } else if (e.key === 'ArrowDown') {
        if (!checkCollision(currentX, currentY + (isVertical ? 2 : 1))) {
            currentY++;
        } else {
            placePair();
        }
    } else if (e.key === 'ArrowUp') {
        rotatePair();
    }
});

// Função para rotacionar o par de peças
function rotatePair() {
    const newX = currentX + (isVertical ? 1 : -1);
    const newY = currentY + (isVertical ? -1 : 1);
    if (!checkCollision(newX, currentY) && !checkCollision(currentX, newY)) {
        isVertical = !isVertical;
        currentPair = [currentPair[1], currentPair[0]];
    }
}

// Função para fixar o par de peças no tabuleiro
function placePair() {
    placePiece(currentPair[0], currentX, currentY);
    if (isVertical) {
        placePiece(currentPair[1], currentX, currentY + 1);
        if (currentPair[0].isSpecial) {
            removeConnectedPieces(currentPair[0].color, currentX, currentY);
        }
        if (currentPair[1].isSpecial) {
            removeConnectedPieces(currentPair[1].color, currentX, currentY + 1);
        }
    } else {
        placePiece(currentPair[1], currentX + 1, currentY);
        if (currentPair[0].isSpecial) {
            removeConnectedPieces(currentPair[0].color, currentX, currentY);
        }
        if (currentPair[1].isSpecial) {
            removeConnectedPieces(currentPair[1].color, currentX + 1, currentY);
        }
    }
    currentPair = nextPair;
    nextPair = generatePair();
    currentX = 3;
    currentY = 0;
    isVertical = true;
    if (checkCollision(currentX, currentY) || checkCollision(currentX, currentY + 1)) {
        alert('Game Over');
        document.location.reload();
    }
}

// Função principal do jogo (game loop)
function gameLoop() {
    let now = Date.now();
    let delta = now - dropStart;
    if (delta > 500) { // Intervalo de 500ms para descer a peça
        if (!checkCollision(currentX, currentY + (isVertical ? 2 : 1))) {
            currentY++;
        } else {
            placePair();
        }
        dropStart = Date.now();
    }
    drawBoard();  // Desenha o tabuleiro
    drawPiece(currentPair[0], currentX, currentY);  // Desenha a primeira peça do par
    if (isVertical) {
        drawPiece(currentPair[1], currentX, currentY + 1);  // Desenha a segunda peça do par na posição vertical
    } else {
        drawPiece(currentPair[1], currentX + 1, currentY);  // Desenha a segunda peça do par na posição horizontal
    }
    requestAnimationFrame(gameLoop);  // Chama a função gameLoop novamente na próxima animação
}

// Inicia o loop do jogo
gameLoop();
