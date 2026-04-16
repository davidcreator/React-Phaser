// script.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 400;

const rows = 4;
const cols = 4;
const cardWidth = canvas.width / cols;
const cardHeight = canvas.height / rows;
const cards = [];
let flippedCards = [];
let matchedCards = [];
let cardImages = [];
let numMatches = 0;
let moves = 0;

// Cria uma lista de números que representam os pares de cartas
for (let i = 0; i < (rows * cols) / 2; i++) {
    cardImages.push(i);
    cardImages.push(i);
}

// Embaralha as cartas
cardImages.sort(() => 0.5 - Math.random());

// Cria as cartas com suas posições e imagens
for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
        cards.push({
            x: c * cardWidth,
            y: r * cardHeight,
            imageIndex: cardImages.pop(),
            flipped: false,
            matched: false,
        });
    }
}

// Desenha uma carta no canvas
function drawCard(card) {
    if (card.flipped || card.matched) {
        ctx.fillStyle = '#FFF';
        ctx.fillRect(card.x, card.y, cardWidth - 2, cardHeight - 2);
        ctx.fillStyle = '#000';
        ctx.font = '24px Arial';
        ctx.fillText(card.imageIndex, card.x + cardWidth / 2 - 10, card.y + cardHeight / 2 + 10);
    } else {
        ctx.fillStyle = '#0095DD';
        ctx.fillRect(card.x, card.y, cardWidth - 2, cardHeight - 2);
    }
}

// Desenha todas as cartas
function drawBoard() {
    for (const card of cards) {
        drawCard(card);
    }
}

// Lida com o clique do jogador
canvas.addEventListener('click', (e) => {
    if (flippedCards.length === 2) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    for (const card of cards) {
        if (
            clickX > card.x &&
            clickX < card.x + cardWidth &&
            clickY > card.y &&
            clickY < card.y + cardHeight &&
            !card.flipped &&
            !card.matched
        ) {
            card.flipped = true;
            flippedCards.push(card);

            if (flippedCards.length === 2) {
                moves++;
                if (flippedCards[0].imageIndex === flippedCards[1].imageIndex) {
                    flippedCards[0].matched = true;
                    flippedCards[1].matched = true;
                    numMatches++;
                    flippedCards = [];
                    if (numMatches === (rows * cols) / 2) {
                        setTimeout(() => {
                            alert(`Você ganhou em ${moves} movimentos!`);
                            document.location.reload();
                        }, 500);
                    }
                } else {
                    setTimeout(() => {
                        flippedCards[0].flipped = false;
                        flippedCards[1].flipped = false;
                        flippedCards = [];
                        drawBoard();
                    }, 1000);
                }
            }

            drawBoard();
            break;
        }
    }
});

// Desenha o tabuleiro inicial
drawBoard();
