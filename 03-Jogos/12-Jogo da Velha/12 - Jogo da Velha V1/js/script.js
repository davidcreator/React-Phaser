// Seleciona o canvas e o contexto
const canvas = document.getElementById('tic-tac-toe');
const ctx = canvas.getContext('2d');

// Define variáveis do jogo
let board = [
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
];
let currentPlayer = 'X';
let gameActive = true;

// Desenha o tabuleiro
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;

    // Linhas verticais
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(100, 300);
    ctx.moveTo(200, 0);
    ctx.lineTo(200, 300);
    ctx.stroke();

    // Linhas horizontais
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.lineTo(300, 100);
    ctx.moveTo(0, 200);
    ctx.lineTo(300, 200);
    ctx.stroke();
}

// Desenha os X e O no tabuleiro
function drawMarks() {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const mark = board[i][j];
            if (mark) {
                ctx.font = '80px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(mark, j * 100 + 50, i * 100 + 50);
            }
        }
    }
}

// Verifica se há um vencedor
function checkWinner() {
    const winningCombinations = [
        // Linhas
        [[0, 0], [0, 1], [0, 2]],
        [[1, 0], [1, 1], [1, 2]],
        [[2, 0], [2, 1], [2, 2]],
        // Colunas
        [[0, 0], [1, 0], [2, 0]],
        [[0, 1], [1, 1], [2, 1]],
        [[0, 2], [1, 2], [2, 2]],
        // Diagonais
        [[0, 0], [1, 1], [2, 2]],
        [[0, 2], [1, 1], [2, 0]]
    ];

    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a[0]][a[1]] && board[a[0]][a[1]] === board[b[0]][b[1]] && board[a[0]][a[1]] === board[c[0]][c[1]]) {
            return board[a[0]][a[1]];
        }
    }

    return board.flat().includes('') ? null : 'Empate';
}

// Atualiza o status do jogo
function updateStatus() {
    const winner = checkWinner();
    const status = document.getElementById('status');

    if (winner) {
        gameActive = false;
        status.textContent = winner === 'Empate' ? 'Empate!' : `Jogador ${winner} venceu!`;
    } else {
        status.textContent = `Vez do jogador ${currentPlayer}`;
    }
}

// Reinicia o jogo
function resetGame() {
    board = [
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
    ];
    currentPlayer = 'X';
    gameActive = true;
    drawBoard();
    drawMarks();
    updateStatus();
}

// Lida com cliques no canvas
canvas.addEventListener('click', (event) => {
    if (!gameActive) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const row = Math.floor(y / 100);
    const col = Math.floor(x / 100);

    if (board[row][col]) return;

    board[row][col] = currentPlayer;
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    drawBoard();
    drawMarks();
    updateStatus();
});

// Adiciona evento ao botão de reiniciar
document.getElementById('reset-button').addEventListener('click', resetGame);

// Inicializa o jogo
drawBoard();
updateStatus();
