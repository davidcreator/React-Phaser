const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const boardSize = 7;
const tileSize = canvas.width / boardSize;
const pieces = [];
let currentPlayer = 'white';
let phase = 'placing';
let selectedPiece = null;

const positions = [
    [0, 0], [3, 0], [6, 0], [1, 1], [3, 1], [5, 1],
    [2, 2], [3, 2], [4, 2], [0, 3], [1, 3], [2, 3],
    [4, 3], [5, 3], [6, 3], [2, 4], [3, 4], [4, 4],
    [1, 5], [3, 5], [5, 5], [0, 6], [3, 6], [6, 6]
];

const mills = [
    [0, 1, 2], [0, 9, 21], [1, 4, 7], [2, 14, 23], [3, 4, 5], [3, 10, 18], [5, 13, 20],
    [6, 7, 8], [6, 11, 15], [8, 12, 17], [9, 10, 11], [12, 13, 14], [15, 16, 17],
    [16, 19, 22], [18, 19, 20], [21, 22, 23]
];

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    for (let i = 0; i < boardSize; i += 3) {
        ctx.strokeRect(i * tileSize, 0, tileSize, canvas.height);
        ctx.strokeRect(0, i * tileSize, canvas.width, tileSize);
    }

    for (let i = 0; i < 3; i++) {
        ctx.moveTo(i * tileSize, i * tileSize);
        ctx.lineTo(canvas.width - i * tileSize, i * tileSize);
        ctx.lineTo(canvas.width - i * tileSize, canvas.height - i * tileSize);
        ctx.lineTo(i * tileSize, canvas.height - i * tileSize);
        ctx.closePath();
        ctx.stroke();
    }

    pieces.forEach(piece => {
        const [x, y] = positions[piece.pos];
        ctx.beginPath();
        ctx.arc(
            x * tileSize + tileSize / 2,
            y * tileSize + tileSize / 2,
            tileSize / 3,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = piece.player;
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
    });
}

function getPosition(x, y) {
    for (const [i, pos] of positions.entries()) {
        if (x >= pos[0] * tileSize && x < (pos[0] + 1) * tileSize &&
            y >= pos[1] * tileSize && y < (pos[1] + 1) * tileSize) {
            return i;
        }
    }
    return null;
}

function isMill(position, player) {
    return mills.some(mill => mill.includes(position) && mill.every(pos => {
        const piece = pieces.find(p => p.pos === pos);
        return piece && piece.player === player;
    }));
}

function handlePlacement(position) {
    if (pieces.some(p => p.pos === position)) {
        return false;
    }

    pieces.push({ pos: position, player: currentPlayer });

    if (isMill(position, currentPlayer)) {
        document.getElementById('status').textContent = `${currentPlayer} formou uma trilha! Remova uma peça adversária.`;
        phase = 'removing';
    } else {
        checkVictory();
        if (pieces.filter(p => p.player === currentPlayer).length === 9) {
            phase = 'moving';
        } else {
            currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
        }
    }

    return true;
}

function handleRemoval(position) {
    const index = pieces.findIndex(p => p.pos === position && p.player !== currentPlayer);
    if (index !== -1) {
        pieces.splice(index, 1);
        phase = pieces.filter(p => p.player === currentPlayer).length < 9 ? 'moving' : 'placing';
        checkVictory();
        currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    }
}

function handleMove(position) {
    if (selectedPiece && !pieces.some(p => p.pos === position)) {
        selectedPiece.pos = position;
        selectedPiece = null;

        if (isMill(position, currentPlayer)) {
            document.getElementById('status').textContent = `${currentPlayer} formou uma trilha! Remova uma peça adversária.`;
            phase = 'removing';
        } else {
            checkVictory();
            currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
        }
        drawBoard();
    }
}

function selectPiece(position) {
    const piece = pieces.find(p => p.pos === position && p.player === currentPlayer);
    if (piece) {
        selectedPiece = piece;
    }
}

function checkVictory() {
    const opponentPieces = pieces.filter(p => p.player !== currentPlayer);
    if (opponentPieces.length < 3 || !canMove(opponentPieces)) {
        document.getElementById('status').textContent = `${currentPlayer} venceu!`;
        canvas.removeEventListener('click', handleClick);
    }
}

function canMove(opponentPieces) {
    for (const piece of opponentPieces) {
        const possibleMoves = getPossibleMoves(piece.pos);
        if (possibleMoves.length > 0) {
            return true;
        }
    }
    return false;
}

function getPossibleMoves(position) {
    const adjacentPositions = [
        [0, 1, 9], [1, 0, 2, 4], [2, 1, 14], [3, 4, 10], [4, 1, 3, 5, 7], [5, 4, 13],
        [6, 7, 11], [7, 4, 6, 8], [8, 7, 12], [9, 0, 10, 21], [10, 3, 9, 11, 18], [11, 6, 10, 15],
        [12, 8, 13, 17], [13, 5, 12, 14, 20], [14, 2, 13, 23], [15, 11, 16], [16, 15, 17, 19],
        [17, 12, 16], [18, 10, 19], [19, 16, 18, 20, 22], [20, 13, 19], [21, 9, 22], [22, 19, 21, 23], [23, 14, 22]
    ];

    const adj = adjacentPositions[position];
    return adj.filter(pos => !pieces.some(p => p.pos === pos));
}

function handleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const position = getPosition(x, y);

    if (position !== null) {
        if (phase === 'placing') {
            if (handlePlacement(position)) {
                drawBoard();
            }
        } else if (phase === 'removing') {
            handleRemoval(position);
            drawBoard();
        } else if (phase === 'moving') {
            if (selectedPiece) {
                const possibleMoves = getPossibleMoves(selectedPiece.pos);
                if (possibleMoves.includes(position)) {
                    handleMove(position);
                } else {
                    document.getElementById('status').textContent = "Movimento inválido. Tente novamente.";
                }
            } else {
                selectPiece(position);
            }
        } else if (phase === 'flying') {
            if (selectedPiece) {
                handleMove(position);
            } else {
                selectPiece(position);
            }
        }
    }
}

canvas.addEventListener('click', handleClick);
drawBoard();
