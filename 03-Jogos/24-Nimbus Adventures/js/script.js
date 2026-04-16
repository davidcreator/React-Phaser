window.onload = function() {
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');

    let currentLevel = 1;
    let player, enemies, platforms, obstacles, coins, backgroundGradient;
    let collectedCoins = 0;

    const keys = {
        left: false,
        right: false,
        up: false
    };

    const gravity = 0.8;
    const jumpStrength = 15;
    let playerVelocityY = 0;
    let isOnGround = false;

    async function loadLevel(level) {
        const response = await fetch(`assets/levels/level${level}.json`);
        const levelData = await response.json();
        player = {
            x: levelData.playerStart.x,
            y: levelData.playerStart.y,
            width: 50,
            height: 50,
            speed: 5
        };
        enemies = levelData.enemies;
        platforms = levelData.platforms;
        obstacles = levelData.obstacles;
        coins = levelData.coins;
        backgroundGradient = levelData.backgroundGradient;
        collectedCoins = 0;
    }

    function drawBackground() {
        const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, backgroundGradient.color1);
        gradient.addColorStop(1, backgroundGradient.color2);
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawPlayer() {
        context.fillStyle = '#f00';
        context.fillRect(player.x, player.y, player.width, player.height);
    }

    function drawEnemies() {
        context.fillStyle = '#00f';
        enemies.forEach(enemy => {
            context.fillRect(enemy.x, enemy.y, 50, 50);
        });
    }
    function drawPlatforms() {
        context.fillStyle = '#0f0';
        platforms.forEach(platform => {
            context.fillRect(platform.x, platform.y, platform.width, platform.height);
        });
    }

    function drawObstacles() {
        context.fillStyle = '#ffa500';
        obstacles.forEach(obstacle => {
            context.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
    }

    function drawCoins() {
        context.fillStyle = '#ffd700';
        coins.forEach(coin => {
            context.beginPath();
            context.arc(coin.x, coin.y, 10, 0, Math.PI * 2, false);
            context.fill();
        });
    }
    function updatePlayer() {
        // Movimento horizontal
        if (keys.left && player.x > 0) {
            player.x -= player.speed;
        }
        if (keys.right && player.x < canvas.width - player.width) {
            player.x += player.speed;
        }

        // Aplicar gravidade
        playerVelocityY += gravity;
        player.y += playerVelocityY;

        // Verificar colisão com o chão
        if (player.y + player.height > canvas.height) {
            player.y = canvas.height - player.height;
            isOnGround = true;
            playerVelocityY = 0;
        } else {
            isOnGround = false;
        }

        // Verificar colisão com plataformas
        platforms.forEach(platform => {
            if (player.x < platform.x + platform.width &&
                player.x + player.width > platform.x &&
                player.y < platform.y + platform.height &&
                player.y + player.height > platform.y) {
                
                if (playerVelocityY > 0) { // Colidindo de cima
                    player.y = platform.y - player.height;
                    isOnGround = true;
                    playerVelocityY = 0;
                }
            }
        });

        // Pular
        if (keys.up && isOnGround) {
            playerVelocityY = -jumpStrength;
        }

        // Coletar moedas
        coins = coins.filter(coin => {
            const isCollected = player.x < coin.x + 10 &&
                                player.x + player.width > coin.x - 10 &&
                                player.y < coin.y + 10 &&
                                player.y + player.height > coin.y - 10;

            if (isCollected) {
                collectedCoins++;
            }

            return !isCollected;
        });

        // Verificar se todas as moedas foram coletadas
        if (collectedCoins >= 5) {
            currentLevel++;
            if (currentLevel > 2) {
                alert("Você completou todos os níveis! Parabéns!");
            } else {
                loadLevel(currentLevel).then(() => {
                    gameLoop();
                });
            }
        }
    }
    document.addEventListener('keydown', function(event) {
        if (event.key === 'a') {
            keys.left = true;
        } else if (event.key === 'd') {
            keys.right = true;
        } else if (event.key === 'w') {
            keys.up = true;
        }
    });

    document.addEventListener('keyup', function(event) {
        if (event.key === 'a') {
            keys.left = false;
        } else if (event.key === 'd') {
            keys.right = false;
        } else if (event.key === 'w') {
            keys.up = false;
        }
    });

    async function gameLoop() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        updatePlayer();
        drawPlayer();
        drawEnemies();
        drawPlatforms();
        drawObstacles();
        drawCoins();

        requestAnimationFrame(gameLoop);
    }

    loadLevel(currentLevel).then(() => {
        gameLoop();
    });
}
