// Definir as variáveis do jogador
const playerImage = new Image();
playerImage.src = 'images/player_sprite.png'; // Troque pelo caminho da sua sprite de jogador

const player = {
    x: 100,
    y: 500,
    width: 50,
    height: 50,
    speed: 5,
    dx: 0,
    dy: 0,
    gravity: 0.8,
    jumpStrength: -15,
    isJumping: false,
    isCrouching: false,
    frameX: 0,
    frameY: 0,
    frameWidth: 50,
    frameHeight: 50,
    numFrames: 4, // Número de frames na animação
    frameIndex: 0
};

// Função para desenhar o jogador na tela
function drawPlayer(context) {
    context.drawImage(
        playerImage,
        player.frameIndex * player.frameWidth, player.frameY, player.frameWidth, player.frameHeight,
        player.x, player.y, player.width, player.height
    );
}
