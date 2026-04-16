const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const message = document.getElementById('message');

let treasureX, treasureY;
let clicks = 0;
const maxClicks = 20;

function getRandomCoordinate(max) {
    return Math.floor(Math.random() * max);
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function getDistanceHint(distance) {
    if (distance < 10) {
        return "Está queimando!";
    } else if (distance < 20) {
        return "Muito quente!";
    } else if (distance < 40) {
        return "Quente!";
    } else if (distance < 80) {
        return "Morno";
    } else if (distance < 160) {
        return "Frio";
    } else {
        return "Congelando!";
    }
}

function startGame() {
    clicks = 0;
    treasureX = getRandomCoordinate(canvas.width);
    treasureY = getRandomCoordinate(canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    message.textContent = "Tente encontrar o tesouro!";
}

canvas.addEventListener('click', function(event) {
    if (clicks >= maxClicks) {
        message.textContent = "Você atingiu o número máximo de cliques!";
        return;
    }
    
    clicks++;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const dist = distance(x, y, treasureX, treasureY);
    const hint = getDistanceHint(dist);

    message.textContent = `${hint} (${clicks}/${maxClicks} tentativas)`;

    if (dist < 10) {
        message.textContent = `Você encontrou o tesouro em ${clicks} cliques! Parabéns!`;
        clicks = maxClicks; // Termina o jogo
    }
});

startGame();
