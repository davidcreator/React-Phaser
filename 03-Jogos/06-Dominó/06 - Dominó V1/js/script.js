const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tileWidth = 60;
const tileHeight = 120;
const tiles = [];
let selectedTile = null;

const playerHand = [];
const board = [];

// Função para desenhar um dominó
function drawTile(tile, x, y) {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(x, y, tileWidth, tileHeight);
    ctx.strokeRect(x, y, tileWidth, tileHeight);

    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(tile[0], x + 20, y + 40);
    ctx.fillText(tile[1], x + 20, y + 80);
}

// Inicializar o conjunto de peças
function initializeTiles() {
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            tiles.push([i, j]);
        }
    }
    shuffleArray(tiles);
}

// Função para embaralhar as peças
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Distribuir peças para o jogador
function dealTiles() {
    for (let i = 0; i < 7; i++) {
        playerHand.push(tiles.pop());
    }
}

// Desenhar o tabuleiro e a mão do jogador
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar peças na mão do jogador
    for (let i = 0; i < playerHand.length; i++) {
        drawTile(playerHand[i], i * (tileWidth + 10) + 20, canvas.height - tileHeight - 20);
    }

    // Desenhar peças no tabuleiro
    for (let i = 0; i < board.length; i++) {
        drawTile(board[i], (i + 1) * (tileWidth + 10) + 20, canvas.height / 2 - tileHeight / 2);
    }
}

// Verificar se o tile pode ser jogado
function canPlaceTile(tile) {
    if (board.length === 0) {
        return true;
    }
    const firstTile = board[0];
    const lastTile = board[board.length - 1];

    return (
        tile[0] === firstTile[0] ||
        tile[1] === firstTile[0] ||
        tile[0] === lastTile[1] ||
        tile[1] === lastTile[1]
    );
}

// Adicionar tile ao tabuleiro
function placeTile(tile) {
    if (board.length === 0) {
        board.push(tile);
    } else {
        const firstTile = board[0];
        const lastTile = board[board.length - 1];

        if (tile[0] === firstTile[0] || tile[1] === firstTile[0]) {
            board.unshift(tile);
        } else if (tile[0] === lastTile[1] || tile[1] === lastTile[1]) {
            board.push(tile);
        }
    }
}

// Evento de clique para selecionar e jogar as peças
canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Verificar se uma peça da mão do jogador foi clicada
    for (let i = 0; i < playerHand.length; i++) {
        const tileX = i * (tileWidth + 10) + 20;
        const tileY = canvas.height - tileHeight - 20;

        if (x > tileX && x < tileX + tileWidth && y > tileY && y < tileY + tileHeight) {
            selectedTile = playerHand[i];
            if (canPlaceTile(selectedTile)) {
                placeTile(selectedTile);
                playerHand.splice(i, 1);
                selectedTile = null;
                drawBoard();
                break;
            } else {
                document.getElementById('status').textContent = "Não é possível jogar essa peça.";
            }
        }
    }
});

initializeTiles();
dealTiles();
drawBoard();
