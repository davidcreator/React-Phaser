const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const boardWidth = 800;
const boardHeight = 600;
const pointHeight = 200;
const pointWidth = boardWidth / 12;
const pieceRadius = 15;

let points = Array(24).fill(null).map(() => []);
let selectedPiece = null;
let selectedPoint = null;

// Configuração inicial das peças
function setupBoard() {
    points[0] = ['white', 'white'];
    points[5] = ['black', 'black', 'black', 'black', 'black'];
    points[7] = ['black', 'black', 'black'];
    points[11] = ['white', 'white', 'white', 'white', 'white'];
    points[12] = ['black', 'black', 'black', 'black', 'black'];
    points[16] = ['white', 'white', 'white'];
    points[18] = ['white', 'white', 'white', 'white', 'white'];
    points[23] = ['black', 'black'];
}

// Desenha o tabuleiro
function drawBoard() {
    ctx.clearRect(0, 0, boardWidth, boardHeight);

    // Desenha as áreas para as peças
    for (let i = 0; i < 12; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#d2691e' : '#f5deb3';
        ctx.beginPath();
        ctx.moveTo(i * pointWidth, 0);
        ctx.lineTo((i + 1) * pointWidth, 0);
        ctx.lineTo(i * pointWidth + pointWidth / 2, pointHeight);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(i * pointWidth, boardHeight);
        ctx.lineTo((i + 1) * pointWidth, boardHeight);
        ctx.lineTo(i * pointWidth + pointWidth / 2, boardHeight - pointHeight);
        ctx.closePath();
        ctx.fill();
    }

    // Desenha as peças
    points.forEach((stack, i) => {
        stack.forEach((color, j) => {
            ctx.beginPath();
            ctx.arc(
                i < 12 ? i * pointWidth + pointWidth / 2 : (23 - i) * pointWidth + pointWidth / 2,
                i < 12 ? (pointHeight - (j + 1) * 2 * pieceRadius) : (boardHeight - pointHeight + (j + 1) * 2 * pieceRadius),
                pieceRadius,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = color;
            ctx.fill();
            ctx.stroke();
        });
    });
}

// Detecta se uma peça foi clicada
function getPieceAt(x, y) {
    for (let i = 0; i < points.length; i++) {
        const stack = points[i];
        if (stack.length > 0) {
            const pieceX = i < 12 ? i * pointWidth + pointWidth / 2 : (23 - i) * pointWidth + pointWidth / 2;
            const pieceY = i < 12 ? pointHeight - pieceRadius * 2 : boardHeight - pointHeight + pieceRadius * 2;
            if (Math.abs(x - pieceX) < pieceRadius && Math.abs(y - pieceY) < pieceRadius) {
                return { piece: stack[stack.length - 1], point: i };
            }
        }
    }
    return null;
}

// Evento de clique no canvas
canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedPiece = getPieceAt(x, y);

    if (clickedPiece) {
        selectedPiece = clickedPiece.piece;
        selectedPoint = clickedPiece.point;
        status.textContent = `Peça ${selectedPiece} selecionada.`;
    } else if (selectedPiece) {
        // Lógica para mover a peça selecionada
        const targetPoint = Math.floor(x / pointWidth);
        if (targetPoint !== selectedPoint && points[targetPoint].length < 5) {
            points[selectedPoint].pop();
            points[targetPoint].push(selectedPiece);
            selectedPiece = null;
            selectedPoint = null;
            status.textContent = '';
        }
    }
    drawBoard();
});

setupBoard();
drawBoard();
