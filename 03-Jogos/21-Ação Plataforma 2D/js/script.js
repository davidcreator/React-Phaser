const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const player = {
    x: 400,
    y: 300,
    width: 50,
    height: 50,
    color: 'blue',
    speed: 5,
    dx: 0,
    dy: 0,
    health: 100,
    maxHealth: 100,
    lives: 3,
    attackRange: 50,
    attackDamage: 20,
    projectiles: [],
    angle: 0,
    moving: false
};

const enemies = [];
const enemyTypes = [
    { type: 'small', width: 30, height: 30, color: 'red', speed: 3, health: 50 },
    { type: 'medium', width: 50, height: 50, color: 'orange', speed: 2, health: 100, attackRange: 200, attackDamage: 10 },
    { type: 'large', width: 70, height: 70, color: 'purple', speed: 1, health: 200 }
];
const maxEnemies = 5;
let score = 0;

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.angle);
    ctx.fillStyle = player.color;
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    ctx.fillStyle = 'green';
    ctx.fillRect(-player.width / 2, -player.height / 2 - 10, player.width * (player.health / player.maxHealth), 5);
    ctx.restore();
}

function drawEnemy(enemy) {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    ctx.fillStyle = 'green';
    ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * (enemy.health / enemy.maxHealth), 5);
}

function drawProjectile(projectile) {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
}

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function newPos() {
    player.x += player.dx;
    player.y += player.dy;

    // Keep player within canvas bounds
    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
}

function update() {
    clear();
    drawPlayer();
    enemies.forEach(drawEnemy);
    player.projectiles.forEach(drawProjectile);
    newPos();
    updateProjectiles();
    moveEnemies();
    requestAnimationFrame(update);
}

function moveForward() {
    player.dx = player.speed * Math.cos(player.angle);
    player.dy = player.speed * Math.sin(player.angle);
    player.moving = true;
}

function moveBackward() {
    player.dx = -player.speed * Math.cos(player.angle);
    player.dy = -player.speed * Math.sin(player.angle);
    player.moving = true;
}

function rotateLeft() {
    player.angle -= 0.1;
}

function rotateRight() {
    player.angle += 0.1;
}

function keyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'd') {
        rotateRight();
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        rotateLeft();
    } else if (e.key === 'ArrowUp' || e.key === 'w') {
        moveForward();
    } else if (e.key === 'ArrowDown' || e.key === 's') {
        moveBackward();
    } else if (e.key === ' ') {
        shoot();
    } else if (e.key === 'x') {
        meleeAttack();
    }
}

function keyUp(e) {
    if (
        e.key === 'ArrowRight' || e.key === 'd' ||
        e.key === 'ArrowLeft' || e.key === 'a' ||
        e.key === 'ArrowUp' || e.key === 'w' ||
        e.key === 'ArrowDown' || e.key === 's'
    ) {
        player.dx = 0;
        player.dy = 0;
        player.moving = false;
    }
}

function shoot() {
    const projectile = {
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        width: 5,
        height: 10,
        speed: 7,
        angle: player.angle
    };
    player.projectiles.push(projectile);
}

function updateProjectiles() {
    player.projectiles.forEach((projectile, index) => {
        projectile.x += projectile.speed * Math.cos(projectile.angle);
        projectile.y += projectile.speed * Math.sin(projectile.angle);
        if (projectile.x < 0 || projectile.x > canvas.width || projectile.y < 0 || projectile.y > canvas.height) {
            player.projectiles.splice(index, 1);
        }
        enemies.forEach((enemy, enemyIndex) => {
            if (
                projectile.x < enemy.x + enemy.width &&
                projectile.x + projectile.width > enemy.x &&
                projectile.y < enemy.y + enemy.height &&
                projectile.y + projectile.height > enemy.y
            ) {
                enemy.health -= player.attackDamage;
                player.projectiles.splice(index, 1);
                if (enemy.health <= 0) {
                    enemies.splice(enemyIndex, 1);
                    score += 10;
                    document.getElementById('score').textContent = `Score: ${score}`;
                }
            }
        });
    });
}

function meleeAttack() {
    enemies.forEach((enemy, index) => {
        const distX = Math.abs(player.x - enemy.x);
        const distY = Math.abs(player.y - enemy.y);
        if (distX < player.attackRange && distY < player.attackRange) {
            enemy.health -= player.attackDamage;
            if (enemy.health <= 0) {
                enemies.splice(index, 1);
                score += 10;
                document.getElementById('score').textContent = `Score: ${score}`;
            }
        }
    });
}

function spawnEnemy() {
    if (enemies.length < maxEnemies) {
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const x = Math.random() * (canvas.width - type.width);
        const y = Math.random() * (canvas.height - type.height);
        enemies.push({ ...type, x, y, maxHealth: type.health });
    }
}

function moveEnemies() {
    enemies.forEach(enemy => {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.x += enemy.speed * Math.cos(angle);
        enemy.y += enemy.speed * Math.sin(angle);

        // Medium enemy attack
        if (enemy.type === 'medium' && Math.hypot(player.x - enemy.x, player.y - enemy.y) < enemy.attackRange) {
            player.health -= enemy.attackDamage;
            if (player.health <= 0) {
                player.lives -= 1;
                player.health = player.maxHealth;
                document.getElementById('lives').textContent = `Vidas: ${player.lives}`;
                if (player.lives <= 0) {
                    alert('Game Over');
                    document.location.reload();
                }
            }
        }
    });
}

function enemyAttack() {
    enemies.forEach(enemy => {
        const distX = Math.abs(player.x - enemy.x);
        const distY = Math.abs(player.y - enemy.y);
        if (distX < enemy.width && distY < enemy.height) {
            player.health -= 10;
            if (player.health <= 0) {
                player.lives -= 1;
                player.health = player.maxHealth;
                document.getElementById('lives').textContent = `Vidas: ${player.lives}`;
                if (player.lives <= 0) {
                    alert('Game Over');
                    document.location.reload();
                }
            }
        }
    });
}

setInterval(spawnEnemy, 2000);
setInterval(enemyAttack, 1000);

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

update();
