// Carregar a imagem dos inimigos
const enemyImage = new Image();
enemyImage.src = 'images/enemy_sprite.png'; // Troque pelo caminho da sua sprite de inimigo

// Função para desenhar os inimigos na tela
function drawEnemies(context) {
    levels[currentLevel].enemies.forEach(enemy => {
        context.drawImage(
            enemyImage,
            enemy.frameIndex * enemy.frameWidth, enemy.frameY, enemy.frameWidth, enemy.frameHeight,
            enemy.x, enemy.y, enemy.width, enemy.height
        );
    });
}
