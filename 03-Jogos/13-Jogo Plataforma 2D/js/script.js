// script.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 400;

const gravity = 0.8;
const player = {
    x: 50,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumping: false,
};

const keys = {
    right: false,
    left: false,
    up: false,
};

const platforms = [
    { x: 0, y: canvas.height - 10, width: canvas.width, height: 10 }, // Ground
    { x: 150, y: 300, width: 100, height: 10 },
    { x: 300, y: 250, width: 100, height: 10 },
    { x: 450, y: 200, width: 100, height: 10 },
    { x: 600, y: 150, width: 100, height: 10 },
];

function drawPlayer() {
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawPlatforms() {
    ctx.fillStyle = "#654321";
    for (const platform of platforms) {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    }
}

function updatePlayer() {
    if (keys.right) {
        player.velocityX = player.speed;
    } else if (keys.left) {
        player.velocityX = -player.speed;
    } else {
        player.velocityX = 0;
    }

    if (keys.up && !player.jumping) {
        player.velocityY = -15;
        player.jumping = true;
    }

    player.velocityY += gravity;
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Colisões com as plataformas
    for (const platform of platforms) {
        if (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y
        ) {
            player.jumping = false;
            player.velocityY = 0;
            player.y = platform.y - player.height;
        }
    }

    // Limites da tela
    if (player.x < 0) {
        player.x = 0;
    } else if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }

    if (player.y + player.height > canvas.height) {
        player.jumping = false;
        player.velocityY = 0;
        player.y = canvas.height - player.height;
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayer();
    drawPlatforms();
    updatePlayer();

    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'd') {
        keys.right = true;
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        keys.left = true;
    } else if (e.key === 'ArrowUp' || e.key === 'w') {
        keys.up = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'd') {
        keys.right = false;
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        keys.left = false;
    } else if (e.key === 'ArrowUp' || e.key === 'w') {
        keys.up = false;
    }
});

gameLoop();
