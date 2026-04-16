// Seleciona o canvas e define o contexto 2D
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Define a largura e altura do canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variáveis para a nave espacial
const spaceship = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 50,
    height: 50,
    speed: 5,
    dx: 0,
    dy: 0
};

// Variáveis para os tiros
const bullets = [];
const bulletSpeed = 7;

// Variáveis para os inimigos
const enemies = [];
const enemySpeed = 2;
const enemyFrequency = 1000; // Frequência de criação dos inimigos em milissegundos

// Função para desenhar a nave espacial
function drawSpaceship() {
    ctx.fillStyle = 'white';
    ctx.fillRect(spaceship.x, spaceship.y, spaceship.width, spaceship.height);
}

// Função para desenhar os tiros
function drawBullets() {
    ctx.fillStyle = 'red';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

// Função para desenhar os inimigos
function drawEnemies() {
    ctx.fillStyle = 'green';
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

// Função para atualizar a posição da nave espacial
function updateSpaceship() {
    spaceship.x += spaceship.dx;
    spaceship.y += spaceship.dy;

    // Impede que a nave saia da tela
    if (spaceship.x < 0) spaceship.x = 0;
    if (spaceship.x + spaceship.width > canvas.width) spaceship.x = canvas.width - spaceship.width;
    if (spaceship.y < 0) spaceship.y = 0;
    if (spaceship.y + spaceship.height > canvas.height) spaceship.y = canvas.height - spaceship.height;
}

// Função para atualizar a posição dos tiros
function updateBullets() {
    bullets.forEach((bullet, index) => {
        bullet.y -= bulletSpeed;
        // Remove o tiro se sair da tela
        if (bullet.y + bullet.height < 0) {
            bullets.splice(index, 1);
        }
    });
}

// Função para atualizar a posição dos inimigos
function updateEnemies() {
    enemies.forEach((enemy, index) => {
        enemy.y += enemySpeed;
        // Remove o inimigo se sair da tela
        if (enemy.y > canvas.height) {
            enemies.splice(index, 1);
        }
    });
}

// Função para criar novos inimigos
function createEnemy() {
    const x = Math.random() * (canvas.width - 50);
    enemies.push({ x, y: 0, width: 50, height: 50 });
}

// Função para detectar colisões
function detectCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                // Remove o tiro e o inimigo em caso de colisão
                bullets.splice(bulletIndex, 1);
                enemies.splice(enemyIndex, 1);
            }
        });
    });
}

// Função para desenhar todos os elementos do jogo
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSpaceship();
    drawBullets();
    drawEnemies();
}

// Função para atualizar todos os elementos do jogo
function update() {
    updateSpaceship();
    updateBullets();
    updateEnemies();
    detectCollisions();
}

// Função principal do jogo
function gameLoop() {
    draw();
    update();
    requestAnimationFrame(gameLoop);
}

// Eventos de teclado para mover a nave e atirar
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') spaceship.dx = spaceship.speed;
    if (e.key === 'ArrowLeft') spaceship.dx = -spaceship.speed;
    if (e.key === 'ArrowUp') spaceship.dy = -spaceship.speed;
    if (e.key === 'ArrowDown') spaceship.dy = spaceship.speed;
    if (e.key === ' ') {
        bullets.push({
            x: spaceship.x + spaceship.width / 2 - 2.5,
            y: spaceship.y,
            width: 5,
            height: 10
        });
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') spaceship.dx = 0;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') spaceship.dy = 0;
});

// Inicia o loop do jogo e a criação de inimigos
gameLoop();
setInterval(createEnemy, enemyFrequency);
