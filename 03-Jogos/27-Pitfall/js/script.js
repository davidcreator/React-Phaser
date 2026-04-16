// Aguardar até o DOM estar completamente carregado
window.onload = function() {
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');

    // Função para limpar o canvas
    function clearCanvas() {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Verificar se o jogador chegou ao final do nível
    function checkLevelCompletion() {
        if (player.x + player.width >= canvas.width) {
            loadNextLevel();
        }
    }

    // Adicionar a função loadNextLevel
    function loadNextLevel() {
        const nextLevel = currentLevel + 1;
        if (nextLevel < levels.length) {
            loadLevel(nextLevel);
        } else {
            // Se não houver mais níveis, reinicie para o primeiro nível
            loadLevel(0);
        }
    }

    // Atualizar a posição do jogador e inimigos
    function update() {
        player.y += player.dy;
        player.dy += player.gravity;

        // Verificar colisão com plataformas
        levels[currentLevel].platforms.forEach(platform => {
            if (player.y + player.height >= platform.y && player.y + player.height <= platform.y + platform.height && player.x + player.width >= platform.x && player.x <= platform.x + platform.width) {
                player.y = platform.y - player.height;
                player.dy = 0;
                player.isJumping = false;
            }
        });

        player.x += player.dx;

        // Impedir que o jogador saia dos limites do canvas
        if (player.x < 0) player.x = 0;
        if (player.y + player.height > canvas.height) {
            player.y = canvas.height - player.height;
            player.isJumping = false;
        }

        // Verificar se o jogador chegou ao final do nível
        checkLevelCompletion();

        // Atualizar posição dos inimigos
        levels[currentLevel].enemies.forEach(enemy => {
            enemy.x += enemy.speed;
            if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
                enemy.speed *= -1; // Inverter a direção do movimento
            }
        });

        // Atualizar a animação do jogador
        if (player.dx !== 0) {
            player.frameIndex = (player.frameIndex + 1) % player.numFrames;
        }

        // Atualizar a animação dos inimigos
        levels[currentLevel].enemies.forEach(enemy => {
            enemy.frameIndex = (enemy.frameIndex + 1) % enemy.numFrames;
        });

        // Rolagem horizontal
        if (player.x > canvas.width * 0.75) {
            player.x = canvas.width * 0.75;
            levels[currentLevel].platforms.forEach(platform => platform.x -= player.speed);
            levels[currentLevel].enemies.forEach(enemy => enemy.x -= player.speed);
        } else if (player.x < canvas.width * 0.25) {
            player.x = canvas.width * 0.25;
            levels[currentLevel].platforms.forEach(platform => platform.x += player.speed);
            levels[currentLevel].enemies.forEach(enemy => enemy.x += player.speed);
        }
    }

    // Função principal do jogo
    function gameLoop() {
        clearCanvas();
        drawPlatforms(context);
        drawPlayer(context);
        drawEnemies(context);
        update();
        requestAnimationFrame(gameLoop);
    }

    // Iniciar o loop do jogo
    gameLoop();

    // Manipular eventos de teclado
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);

    function keyDownHandler(event) {
        if (event.key === 'ArrowRight' || event.key === 'Right' || event.key === 'd' || event.key === 'D') player.dx = player.speed;
        if (event.key === 'ArrowLeft' || event.key === 'Left' || event.key === 'a' || event.key === 'A') player.dx = -player.speed;
        if ((event.key === 'ArrowUp' || event.key === 'Up' || event.key === 'w' || event.key === 'W') && !player.isJumping) {
            player.dy = player.jumpStrength;
            player.isJumping = true;
        }
        if (event.key === 'ArrowDown' || event.key === 'Down' || event.key === 's' || event.key === 'S') player.isCrouching = true;
    }

    function keyUpHandler(event) {
        if (event.key === 'ArrowRight' || event.key === 'Right' || event.key === 'd' || event.key === 'D') player.dx = 0;
        if (event.key === 'ArrowLeft' || event.key === 'Left' || event.key === 'a' || event.key === 'A') player.dx = 0;
        if (event.key === 'ArrowDown' || event.key === 'Down' || event.key === 's' || event.key === 'S') player.isCrouching = false;
    }
};
