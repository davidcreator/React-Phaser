// Definir os níveis do jogo
const levels = [
    {
        platforms: [
            { x: 0, y: 550, width: 800, height: 50 },
            { x: 200, y: 450, width: 100, height: 20 },
            { x: 500, y: 400, width: 100, height: 20 },
            { x: 800, y: 350, width: 100, height: 20 }
        ],
        enemies: [
            { x: 400, y: 500, width: 50, height: 50, speed: 2, frameX: 0, frameY: 0, frameWidth: 50, frameHeight: 50, numFrames: 4, frameIndex: 0 }
        ]
    },
    {
        platforms: [
            { x: 0, y: 550, width: 800, height: 50 },
            { x: 300, y: 450, width: 100, height: 20 },
            { x: 600, y: 350, width: 100, height: 20 }
        ],
        enemies: [
            { x: 500, y: 500, width: 50, height: 50, speed: 2, frameX: 0, frameY: 0, frameWidth: 50, frameHeight: 50, numFrames: 4, frameIndex: 0 },
            { x: 700, y: 500, width: 50, height: 50, speed: 2, frameX: 0, frameY: 0, frameWidth: 50, frameHeight: 50, numFrames: 4, frameIndex: 0 }
        ]
    }
];

let currentLevel = 0;

function loadLevel(levelIndex) {
    currentLevel = levelIndex;
    player.x = 100;
    player.y = 500;
}

loadLevel(currentLevel);

// Função para desenhar as plataformas na tela
function drawPlatforms(context) {
    context.fillStyle = '#654321';
    levels[currentLevel].platforms.forEach(platform => {
        context.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
}

// Função para verificar se o jogador chegou ao final do nível e carregar o próximo nível
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
