const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const cardWidth = 60;
const cardHeight = 90;
const cardPadding = 15;
const deck = [];
let foundations = [[], [], [], []]; // 4 pilhas de fundação
let tableau = [[], [], [], [], [], [], []]; // 7 colunas do tabuleiro
let stock = []; // Monte de cartas restantes
let waste = []; // Pilha de descarte
let selectedCard = null;
let selectedSource = null;

function createDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = [...Array(13).keys()].map(v => v + 1);
    suits.forEach(suit => {
        values.forEach(value => {
            deck.push({ suit, value });
        });
    });
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function dealCards() {
    for (let i = 0; i < tableau.length; i++) {
        for (let j = 0; j <= i; j++) {
            const card = deck.pop();
            tableau[i].push(card);
        }
    }

    stock = deck.splice(0);
}

function drawCard(card, x, y, faceUp = true) {
    ctx.fillStyle = 'white';
    ctx.fillRect(x, y, cardWidth, cardHeight);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(x, y, cardWidth, cardHeight);

    if (faceUp) {
        ctx.fillStyle = card.suit === 'hearts' || card.suit === 'diamonds' ? 'red' : 'black';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.value, x + cardWidth / 2, y + cardHeight / 2);
        ctx.fillText(card.suit[0].toUpperCase(), x + cardWidth / 2, y + cardHeight / 2 + 20);
    } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(x, y, cardWidth, cardHeight);
    }
}

function drawTableau() {
    tableau.forEach((column, colIndex) => {
        column.forEach((card, rowIndex) => {
            const x = colIndex * (cardWidth + cardPadding) + 10;
            const y = rowIndex * (cardPadding / 2) + 150;
            drawCard(card, x, y, rowIndex === column.length - 1);
        });
    });
}

function drawFoundations() {
    foundations.forEach((pile, index) => {
        const x = index * (cardWidth + cardPadding) + 400;
        const y = 20;
        if (pile.length > 0) {
            const card = pile[pile.length - 1];
            drawCard(card, x, y);
        } else {
            ctx.strokeStyle = 'black';
            ctx.strokeRect(x, y, cardWidth, cardHeight);
        }
    });
}

function drawStock() {
    const x = 10;
    const y = 20;
    if (stock.length > 0) {
        ctx.fillStyle = 'green';
        ctx.fillRect(x, y, cardWidth, cardHeight);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(x, y, cardWidth, cardHeight);
    }
}

function drawWaste() {
    const x = 10 + cardWidth + cardPadding;
    const y = 20;
    if (waste.length > 0) {
        const card = waste[waste.length - 1];
        drawCard(card, x, y);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStock();
    drawWaste();
    drawFoundations();
    drawTableau();
}

function handleCardClick(x, y) {
    // Verifica se clicou no monte de estoque
    if (x >= 10 && x <= 10 + cardWidth && y >= 20 && y <= 20 + cardHeight) {
        if (stock.length > 0) {
            waste.push(stock.pop());
            draw();
        }
        return;
    }

    // Verifica se clicou na pilha de descarte
    if (x >= 10 + cardWidth + cardPadding && x <= 10 + 2 * cardWidth + cardPadding && y >= 20 && y <= 20 + cardHeight) {
        if (waste.length > 0) {
            selectedCard = waste[waste.length - 1];
            selectedSource = waste;
        }
        return;
    }

    // Verifica se clicou nas fundações
    foundations.forEach((pile, index) => {
        const pileX = index * (cardWidth + cardPadding) + 400;
        const pileY = 20;
        if (x >= pileX && x <= pileX + cardWidth && y >= pileY && y <= pileY + cardHeight) {
            if (selectedCard && canPlaceOnFoundation(selectedCard, pile)) {
                pile.push(selectedCard);
                removeSelectedCard();
                draw();
            }
        }
    });

    // Verifica se clicou no tableau
    tableau.forEach((column, colIndex) => {
        const colX = colIndex * (cardWidth + cardPadding) + 10;
        column.forEach((card, rowIndex) => {
            const cardY = rowIndex * (cardPadding / 2) + 150;
            if (x >= colX && x <= colX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
                if (selectedCard) {
                    if (canPlaceOnTableau(selectedCard, column)) {
                        column.push(selectedCard);
                        removeSelectedCard();
                        draw();
                    }
                } else {
                    if (rowIndex === column.length - 1) {
                        selectedCard = card;
                        selectedSource = column;
                    }
                }
            }
        });
    });
}

function canPlaceOnFoundation(card, foundation) {
    if (foundation.length === 0) {
        return card.value === 1; // Ases na base da fundação
    } else {
        const topCard = foundation[foundation.length - 1];
        return card.suit === topCard.suit && card.value === topCard.value + 1;
    }
}

function canPlaceOnTableau(card, column) {
    if (column.length === 0) {
        return card.value === 13; // Reis na base do tableau
    } else {
        const topCard = column[column.length - 1];
        return isOppositeColor(card, topCard) && card.value === topCard.value - 1;
    }
}

function isOppositeColor(card1, card2) {
    const redSuits = ['hearts', 'diamonds'];
    const blackSuits = ['clubs', 'spades'];
    return (redSuits.includes(card1.suit) && blackSuits.includes(card2.suit)) ||
           (blackSuits.includes(card1.suit) && redSuits.includes(card2.suit));
}

function removeSelectedCard() {
    if (selectedSource) {
        selectedSource.pop();
        selectedCard = null;
        selectedSource = null;
    }
}

function checkWin() {
    return foundations.every(foundation => foundation.length === 13);
}

function handleCardClick(x, y) {
    // Verifica se clicou no monte de estoque
    if (x >= 10 && x <= 10 + cardWidth && y >= 20 && y <= 20 + cardHeight) {
        if (stock.length > 0) {
            waste.push(stock.pop());
            draw();
            checkWinCondition();
        }
        return;
    }

    // Verifica se clicou na pilha de descarte
    if (x >= 10 + cardWidth + cardPadding && x <= 10 + 2 * cardWidth + cardPadding && y >= 20 && y <= 20 + cardHeight) {
        if (waste.length > 0) {
            selectedCard = waste[waste.length - 1];
            selectedSource = waste;
        }
        return;
    }

    // Verifica se clicou nas fundações
    foundations.forEach((pile, index) => {
        const pileX = index * (cardWidth + cardPadding) + 400;
        const pileY = 20;
        if (x >= pileX && x <= pileX + cardWidth && y >= pileY && y <= pileY + cardHeight) {
            if (selectedCard && canPlaceOnFoundation(selectedCard, pile)) {
                pile.push(selectedCard);
                removeSelectedCard();
                draw();
                checkWinCondition();
            }
        }
    });

    // Verifica se clicou no tableau
    tableau.forEach((column, colIndex) => {
        const colX = colIndex * (cardWidth + cardPadding) + 10;
        column.forEach((card, rowIndex) => {
            const cardY = rowIndex * (cardPadding / 2) + 150;
            if (x >= colX && x <= colX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
                if (selectedCard) {
                    if (canPlaceOnTableau(selectedCard, column)) {
                        column.push(selectedCard);
                        removeSelectedCard();
                        draw();
                        checkWinCondition();
                    }
                } else {
                    if (rowIndex === column.length - 1) {
                        selectedCard = card;
                        selectedSource = column;
                    }
                }
            }
        });
    });
}

function checkWinCondition() {
    if (checkWin()) {
        document.getElementById('status').textContent = 'Você venceu!';
        canvas.removeEventListener('click', handleClick);
    }
}

function resetGame() {
    deck.length = 0;
    foundations.forEach(pile => pile.length = 0);
    tableau.forEach(column => column.length = 0);
    stock.length = 0;
    waste.length = 0;
    selectedCard = null;
    selectedSource = null;
    document.getElementById('status').textContent = '';

    createDeck();
    shuffleDeck(deck);
    dealCards();
    draw();

    canvas.addEventListener('click', handleClick);
}

canvas.addEventListener('click', handleClick);
document.getElementById('resetButton').addEventListener('click', resetGame);

resetGame();
