const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
let score = 0;

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// Cada peça de Tetris com diferentes formas (matrizes 2D) e cores
const Z = [
    [[1, 1, 0],
     [0, 1, 1],
     [0, 0, 0]],

    [[0, 0, 1],
     [0, 1, 1],
     [0, 1, 0]]
];

const S = [
    [[0, 1, 1],
     [1, 1, 0],
     [0, 0, 0]],

    [[0, 1, 0],
     [0, 1, 1],
     [0, 0, 1]]
];

const T = [
    [[0, 1, 0],
     [1, 1, 1],
     [0, 0, 0]],

    [[0, 1, 0],
     [0, 1, 1],
     [0, 1, 0]],

    [[0, 0, 0],
     [1, 1, 1],
     [0, 1, 0]],

    [[0, 1, 0],
     [1, 1, 0],
     [0, 1, 0]]
];

const O = [
    [[1, 1],
     [1, 1]]
];

const L = [
    [[1, 0, 0],
     [1, 1, 1],
     [0, 0, 0]],

    [[0, 1, 1],
     [0, 1, 0],
     [0, 1, 0]],

    [[0, 0, 0],
     [1, 1, 1],
     [0, 0, 1]],

    [[0, 1, 0],
     [0, 1, 0],
     [1, 1, 0]]
];

const I = [
    [[0, 0, 0, 0],
     [1, 1, 1, 1],
     [0, 0, 0, 0],
     [0, 0, 0, 0]],

    [[0, 0, 1, 0],
     [0, 0, 1, 0],
     [0, 0, 1, 0],
     [0, 0, 1, 0]]
];

const J = [
    [[0, 0, 1],
     [1, 1, 1],
     [0, 0, 0]],

    [[0, 1, 0],
     [0, 1, 0],
     [0, 1, 1]],

    [[0, 0, 0],
     [1, 1, 1],
     [1, 0, 0]],

    [[1, 1, 0],
     [0, 1, 0],
     [0, 1, 0]]
];

// Definição das peças de Tetris e suas cores
const PIECES = [
    [Z, "red"],
    [S, "green"],
    [T, "yellow"],
    [O, "blue"],
    [L, "purple"],
    [I, "cyan"],
    [J, "orange"]
];

function randomPiece() {
    const randIndex = Math.floor(Math.random() * PIECES.length);
    const piece = PIECES[randIndex][0]; // Obtém a matriz da peça
    return { shape: piece, color: PIECES[randIndex][1] }; // Retorna a peça com a cor
}

let currentPiece = randomPiece();
let currentX = 3; // Posição inicial da peça
let currentY = 0;
let currentRotation = 0; // Rotação inicial
let dropStart = Date.now(); // Controle de tempo

// Função para desenhar a peça atual
function drawPiece(piece, offsetX, offsetY, color) {
    ctx.fillStyle = color; // Cor da peça
    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col]) {
                ctx.fillRect((col + offsetX) * BLOCK_SIZE, (row + offsetY) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeRect((col + offsetX) * BLOCK_SIZE, (row + offsetY) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

// Função para desenhar o tabuleiro
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                ctx.fillStyle = 'blue';
                ctx.fillRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

// Função para verificar colisões
function checkCollision(piece, offsetX, offsetY) {
    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col]) {
                const newX = col + offsetX;
                const newY = row + offsetY;
                if (newX < 0 || newX >= COLS || newY >= ROWS || board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Função para fixar a peça no tabuleiro
function placePiece(piece, offsetX, offsetY) {
    for (let row = 0; row < piece.length; row++) {
        for (let col = 0; col < piece[row].length; col++) {
            if (piece[row][col]) {
                board[row + offsetY][col + offsetX] = 1;
            }
        }
    }
}

// Função para remover linhas completas
function removeCompletedLines() {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(Array(COLS).fill(0));
            score += 100;
            scoreElement.innerText = score;
            row++;
        }
    }
}

// Controle do teclado
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        if (!checkCollision(currentPiece.shape, currentX - 1, currentY)) {
            currentX--;
        }
    } else if (e.key === 'ArrowRight') {
        if (!checkCollision(currentPiece.shape, currentX + 1, currentY)) {
            currentX++;
        }
    } else if (e.key === 'ArrowDown') {
        if (!checkCollision(currentPiece.shape, currentX, currentY + 1)) {
            currentY++;
        }
    } else if (e.key === 'ArrowUp') {
        const newRotation = (currentRotation + 1) % currentPiece.shape.length;
        const rotatedPiece = rotate(currentPiece.shape, newRotation);
        if (!checkCollision(rotatedPiece, currentX, currentY)) {
            currentRotation = newRotation;
            currentPiece.shape = rotatedPiece;
        }
    }
});

// Função para rotacionar a peça
function rotate(piece) {
    const newPiece = [];
    for (let row = 0; row < piece[0].length; row++) {
        newPiece[row] = [];
        for (let col = 0; col < piece.length; col++) {
            newPiece[row][col] = piece[piece.length - 1 - col][row];
        }
    }
    return newPiece;
}

// Função principal do jogo (game loop)
function gameLoop() {
    let now = Date.now();
    let delta = now - dropStart;
    if (delta > 500) { // Intervalo de 500ms para descer a peça
        if (!checkCollision(currentPiece.shape, currentX, currentY + 1)) {
            currentY++;
        } else {
            placePiece(currentPiece.shape, currentX, currentY);
            removeCompletedLines();
            currentX = 3;
            currentY = 0;
            currentRotation = 0;
            currentPiece = randomPiece();
            if (checkCollision(currentPiece.shape, currentX, currentY)) {
                alert('Game Over');
                document.location.reload();
            }
        }
        dropStart = Date.now();
    }
    drawBoard();  // Desenha o tabuleiro
    drawPiece(currentPiece.shape, currentX, currentY, currentPiece.color);  // Desenha a peça atual
    requestAnimationFrame(gameLoop);  // Chama a função gameLoop novamente na próxima animação
}

// Inicia o loop do jogo
gameLoop();
