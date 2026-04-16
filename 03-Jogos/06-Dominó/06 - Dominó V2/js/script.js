// Seleciona o canvas e o contexto 2D
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Define as peças de dominó
const dominoes = [];
for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
        dominoes.push({ left: i, right: j });
    }
}

// Função para desenhar uma peça de dominó
function drawDomino(x, y, left, right) {
    ctx.fillStyle = '#f8f9fa';
    ctx.strokeStyle = '#343a40';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, 60, 30);
    ctx.strokeRect(x, y, 60, 30);
    ctx.beginPath();
    ctx.moveTo(x + 30, y);
    ctx.lineTo(x + 30, y + 30);
    ctx.stroke();
    drawDots(x + 0, y + 0, left);
    drawDots(x + 30, y + 0, right);
}

// Função para desenhar os pontos das peças
function drawDots(x, y, number) {
    ctx.fillStyle = '#343a40';
    const positions = [
        [15, 15], [5, 5], [25, 25], [5, 25], [25, 5], [15, 5], [15, 25]
    ];
    const dotPositions = [
        [], // 0 dots
        [[15, 15]], // 1 dot
        [[5, 5], [25, 25]], // 2 dots
        [[5, 5], [15, 15], [25, 25]], // 3 dots
        [[5, 5], [25, 25], [5, 25], [25, 5]], // 4 dots
        [[5, 5], [25, 25], [15, 15], [5, 25], [25, 5]], // 5 dots
        [[5, 5], [25, 25], [5, 25], [25, 5], [15, 5], [15, 25]] // 6 dots
    ];
    dotPositions[number].forEach(pos => {
        ctx.beginPath();
        ctx.arc(x + pos[0], y + pos[1], 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Função para embaralhar as peças
function shuffleDominoes() {
    for (let i = dominoes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dominoes[i], dominoes[j]] = [dominoes[j], dominoes[i]];
    }
}

// Função para iniciar o jogo
function startGame() {
    shuffleDominoes();
    // Distribui 7 peças para cada jogador
    const player1 = dominoes.slice(0, 7);
    const player2 = dominoes.slice(7, 14);
    const board = [];

    // Desenha as peças dos jogadores
    for (let i = 0; i < player1.length; i++) {
        drawDomino(10 + i * 70, 10, player1[i].left, player1[i].right);
    }
    for (let i = 0; i < player2.length; i++) {
        drawDomino(10 + i * 70, 300, player2[i].left, player2[i].right);
    }

    // Adiciona a lógica do jogo
    let currentPlayer = 1;
    canvas.addEventListener('click', function(event) {
        const x = event.offsetX;
        const y = event.offsetY;
        // Verifica se uma peça foi clicada e se é a vez do jogador
        if (currentPlayer === 1 && y < 40) {
            const index = Math.floor(x / 70);
            if (index < player1.length) {
                const piece = player1.splice(index, 1)[0];
                board.push(piece);
                drawBoard(board);
                if (player1.length === 0) {
                    alert('Jogador 1 venceu!');
                }
                currentPlayer = 2;
            }
        } else if (currentPlayer === 2 && y > 300 && y < 340) {
            const index = Math.floor(x / 70);
            if (index < player2.length) {
                const piece = player2.splice(index, 1)[0];
                board.push(piece);
                drawBoard(board);
                if (player2.length === 0) {
                    alert('Jogador 2 venceu!');
                }
                currentPlayer = 1;
            }
        }
    });
}

// Função para desenhar o tabuleiro
function drawBoard(board) {
    ctx.clearRect(0, 100, canvas.width, 200);
    for (let i = 0; i < board.length; i++) {
        drawDomino(10 + i * 70, 150, board[i].left, board[i].right);
    }
}

// Inicia o jogo
startGame();
