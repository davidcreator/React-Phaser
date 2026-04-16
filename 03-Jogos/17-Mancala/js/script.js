const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const boardWidth = 800;
const boardHeight = 400;
const pitRadius = 40;
const largePitWidth = 80;
const smallPitWidth = 60;

let pits = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0]; // Inicializando as casas do Mancala
let currentPlayer = 1; // Jogador 1 começa

function drawBoard() {
    ctx.clearRect(0, 0, boardWidth, boardHeight);

    // Desenhar as casas
    for (let i = 0; i < 14; i++) {
        const x = i < 7 ? i * smallPitWidth + 100 : (i - 7) * smallPitWidth + 100;
        const y = i < 7 ? 100 : 250;

        if (i === 6 || i === 13) { // Mancalas grandes
            ctx.fillStyle = '#d2691e';
            ctx.fillRect(x, y - pitRadius, largePitWidth, pitRadius * 2);
            ctx.fillStyle = '#000';
            ctx.font = '20px Arial';
            ctx.fillText(pits[i], x + largePitWidth / 2 - 10, y + 5);
        } else { // Casas normais
            ctx.fillStyle = '#f5deb3';
            ctx.beginPath();
            ctx.arc(x + smallPitWidth / 2, y, pitRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = '20px Arial';
            ctx.fillText(pits[i], x + smallPitWidth / 2 - 10, y + 5);
        }
    }
}

function moveSeeds(startIndex) {
    let seeds = pits[startIndex];
    pits[startIndex] = 0;
    let index = startIndex;

    while (seeds > 0) {
        index = (index + 1) % 14;

        if (index === 6 && currentPlayer === 2) continue; // Pular Mancala do oponente
        if (index === 13 && currentPlayer === 1) continue;

        pits[index]++;
        seeds--;
    }

    // Regra de captura
    if (pits[index] === 1 && index !== 6 && index !== 13 && Math.floor(index / 7) === currentPlayer - 1) {
        const oppositeIndex = 12 - index;
        pits[currentPlayer === 1 ? 6 : 13] += pits[oppositeIndex] + 1;
        pits[oppositeIndex] = 0;
        pits[index] = 0;
    }

    // Verifica se a jogada termina na Mancala do jogador
    if ((currentPlayer === 1 && index !== 6) || (currentPlayer === 2 && index !== 13)) {
        currentPlayer = 3 - currentPlayer; // Alterna o jogador
    }

    drawBoard();
    checkEndGame();
}

function checkEndGame() {
    const player1Pits = pits.slice(0, 6).reduce((a, b) => a + b, 0);
    const player2Pits = pits.slice(7, 13).reduce((a, b) => a + b, 0);

    if (player1Pits === 0 || player2Pits === 0) {
        pits[6] += player1Pits;
        pits[13] += player2Pits;
        for (let i = 0; i < 6; i++) pits[i] = 0;
        for (let i = 7; i < 13; i++) pits[i] = 0;

        drawBoard();

        const winner = pits[6] > pits[13] ? 'Jogador 1' : pits[6] < pits[13] ? 'Jogador 2' : 'Empate';
        document.getElementById('status').textContent = `Fim do jogo! ${winner} venceu.`;
    } else {
        document.getElementById('status').textContent = `Turno do Jogador ${currentPlayer}`;
    }
}

canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (let i = 0; i < 6; i++) {
        const pitX = i * smallPitWidth + 100 + smallPitWidth / 2;
        const pitY1 = 100;
        const pitY2 = 250;

        if (Math.abs(x - pitX) < pitRadius && Math.abs(y - pitY1) < pitRadius && currentPlayer === 1) {
            moveSeeds(i);
            break;
        } else if (Math.abs(x - pitX) < pitRadius && Math.abs(y - pitY2) < pitRadius && currentPlayer === 2) {
            moveSeeds(i + 7);
            break;
        }
    }
});

drawBoard();
checkEndGame();
