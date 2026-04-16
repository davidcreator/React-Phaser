const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const boardSize = 15;
const tileSize = canvas.width / boardSize;
let currentPlayer = 'red';
const players = ['red', 'green', 'yellow', 'blue'];
const pieces = {};
let diceValue = 1;

players.forEach(player => {
    pieces[player] = [{ x: 1, y: 1 }];
});

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
            ctx.strokeStyle = 'black';
            ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);

            if ((x === 0 || x === boardSize - 1) && (y === 0 || y === boardSize - 1)) {
                ctx.fillStyle = currentPlayer;
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }
    }

    players.forEach(player => {
        pieces[player].forEach(piece => {
            ctx.beginPath();
            ctx.arc(
                piece.x * tileSize + tileSize / 2,
                piece.y * tileSize + tileSize / 2,
                tileSize / 2 - 5,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = player;
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.stroke();
        });
    });
}

function movePiece(player, piece, steps) {
    piece.x += steps;
    piece.y += steps;

    if (piece.x >= boardSize) piece.x = boardSize - 1;
    if (piece.y >= boardSize) piece.y = boardSize - 1;

    currentPlayer = players[(players.indexOf(currentPlayer) + 1) % players.length];
}

document.getElementById('rollDice').addEventListener('click', () => {
    diceValue = Math.floor(Math.random() * 6) + 1;
    document.getElementById('status').textContent = `Jogador ${currentPlayer} rolou: ${diceValue}`;
    movePiece(currentPlayer, pieces[currentPlayer][0], diceValue);
    drawBoard();
});

drawBoard();
