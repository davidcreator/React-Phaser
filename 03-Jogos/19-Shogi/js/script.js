const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const boardSize = 9;
const tileSize = 50;
const boardWidth = boardSize * tileSize;
const boardHeight = boardSize * tileSize;

let board = Array.from({ length: boardSize }, () => Array(boardSize).fill(null));
let selectedPiece = null;
let currentPlayer = 'black';

// Definição das peças com movimentos simples
const pieces = {
    P: { name: 'Pawn', moves: [{ x: 0, y: -1 }] }, 
    L: { name: 'Lance', moves: [{ x: 0, y: -1 }] },
    N: { name: 'Knight', moves: [{ x: -1, y: -2 }, { x: 1, y: -2 }] },
    S: { name: 'Silver', moves: [{ x: 0, y: -1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }] },
    G: { name: 'Gold', moves: [{ x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }] },
    K: { name: 'King', moves: [{ x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }] },
    R: { name: 'Rook', moves: [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }] },
    B: { name: 'Bishop', moves: [{ x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 }] }
};

// Configuração inicial do tabuleiro
function setupBoard() {
    board[2][4] = { type: 'P', player: 'black' }; 
    board[6][4] = { type: 'P', player: 'white' };
    board[0][0] = board[0][8] = { type: 'L', player: 'black' };
    board[8][0] = board[8][8] = { type: 'L', player: 'white' };
    board[0][1] = board[0][7] = { type: 'N', player: 'black' };
    board[8][1] = board[8][7] = { type: 'N', player: 'white' };
    board[0][2] = board[0][6] = { type: 'S', player: 'black' };
    board[8][2] = board[8][6] = { type: 'S', player: 'white' };
    board[0][3] = { type: 'G', player: 'black' };
    board[8][3] = { type: 'G', player: 'white' };
    board[0][5] = { type: 'G', player: 'black' };
    board[8][5] = { type: 'G', player: 'white' };
    board[0][4] = { type: 'K', player: 'black' };
    board[8][4] = { type: 'K', player: 'white' };
    board[1][1] = { type: 'B', player: 'black' };
    board[7][7] = { type: 'B', player: 'white' };
    board[1][7] = { type: 'R', player: 'black' };
    board[7][1] = { type: 'R', player: 'white' };
}

// Desenha o tabuleiro e as peças
function drawBoard() {
    ctx.clearRect(0, 0, boardWidth, boardHeight);

    for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
            ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
            const piece = board[y][x];
            if (piece) {
                ctx.fillStyle = piece.player === 'black' ? 'black' : 'red';
                ctx.font = '30px Arial';
                ctx.fillText(piece.type, x * tileSize + 15, y * tileSize + 35);
            }
        }
    }
}

// Verifica se um movimento é válido
function isValidMove(piece, x, y, newX, newY) {
    const moveX = newX - x;
    const moveY = newY - y;
    const validMoves = pieces[piece.type].moves;

    for (let move of validMoves) {
        if (moveX === move.x && moveY === move.y) {
            const target = board[newY][newX];
            return !target || target.player !== piece.player;
        }
    }
    return false;
}

// Mover peça
function movePiece(x, y, newX, newY) {
    const piece = board[y][x];
    if (isValidMove(piece, x, y, newX, newY)) {
        board[newY][newX] = piece;
        board[y][x] = null;
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    }
}

// Evento de clique para selecionar e mover as peças
canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / tileSize);
    const y = Math.floor((event.clientY - rect.top) / tileSize);

    if (!selectedPiece) {
        if (board[y][x] && board[y][x].player === currentPlayer) {
            selectedPiece = { x, y };
            document.getElementById('status').textContent = `Peça selecionada: ${board[y][x].type}`;
        }
    } else {
        movePiece(selectedPiece.x, selectedPiece.y, x, y);
        selectedPiece = null;
        document.getElementById('status').textContent = '';
    }
    drawBoard();
});

setupBoard();
drawBoard();
