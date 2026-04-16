// ====== CONFIGURAÇÕES GLOBAIS ======
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 600;
canvas.height = 600;
const gridSize = 20;

// ====== ESTADOS DO JOGO ======
let currentGameMode = 'classic';
let currentControlType = 'keyboard';
let gameRunning = false;
let gamePaused = false;
let changingDirection = false;

// ====== VARIÁVEIS DO JOGO ======
let snake = [];
let dx = 0, dy = 0;
let food = {};
let badFood = {};
let obstacles = [];
let score = 0;
let level = 1;
let speed = 150;
let gameSpeed = 150;

// ====== GAMEPAD SUPPORT ======
let gamepadIndex = null;
let lastGamepadInputTime = 0;
const gamepadInputDelay = 200;

/**
 * Inicializa o sistema de detecção de gamepad
 */
function initGamepadSupport() {
    window.addEventListener("gamepadconnected", (e) => {
        gamepadIndex = e.gamepad.index;
        updateGamepadStatus(true);
        console.log("Gamepad conectado:", e.gamepad.id);
    });

    window.addEventListener("gamepaddisconnected", (e) => {
        if (e.gamepad.index === gamepadIndex) {
            gamepadIndex = null;
            updateGamepadStatus(false);
            console.log("Gamepad desconectado");
        }
    });

    // Inicia o loop de verificação de gamepad
    gamepadLoop();
}

/**
 * Atualiza o status visual do gamepad
 */
function updateGamepadStatus(connected) {
    const status = document.getElementById('gamepadStatus');
    const indicator = document.getElementById('gamepadIndicator');
    
    if (connected) {
        indicator.textContent = '🎮 Gamepad: Conectado';
        indicator.className = 'gamepad-connected';
        status.style.display = 'block';
    } else {
        indicator.textContent = '🎮 Gamepad: Desconectado';
        indicator.className = 'gamepad-disconnected';
        if (currentControlType === 'gamepad') {
            status.style.display = 'block';
        } else {
            status.style.display = 'none';
        }
    }
}

/**
 * Loop principal para processar entrada do gamepad
 */
function gamepadLoop() {
    if (gamepadIndex !== null && currentControlType === 'gamepad' && gameRunning && !gamePaused) {
        const gamepad = navigator.getGamepads()[gamepadIndex];
        if (gamepad) {
            processGamepadInput(gamepad);
        }
    }
    requestAnimationFrame(gamepadLoop);
}

/**
 * Processa a entrada do gamepad
 */
function processGamepadInput(gamepad) {
    const now = Date.now();
    if (now - lastGamepadInputTime < gamepadInputDelay) return;

    const threshold = 0.5;
    let inputDetected = false;

    // D-pad
    if (gamepad.buttons[14] && gamepad.buttons[14].pressed) { // Left
        changeDirection({ keyCode: 37 });
        inputDetected = true;
    } else if (gamepad.buttons[15] && gamepad.buttons[15].pressed) { // Right
        changeDirection({ keyCode: 39 });
        inputDetected = true;
    } else if (gamepad.buttons[12] && gamepad.buttons[12].pressed) { // Up
        changeDirection({ keyCode: 38 });
        inputDetected = true;
    } else if (gamepad.buttons[13] && gamepad.buttons[13].pressed) { // Down
        changeDirection({ keyCode: 40 });
        inputDetected = true;
    }

    // Analog sticks
    const leftStickX = gamepad.axes[0];
    const leftStickY = gamepad.axes[1];

    if (Math.abs(leftStickX) > threshold || Math.abs(leftStickY) > threshold) {
        if (Math.abs(leftStickX) > Math.abs(leftStickY)) {
            if (leftStickX > threshold) {
                changeDirection({ keyCode: 39 }); // Right
                inputDetected = true;
            } else if (leftStickX < -threshold) {
                changeDirection({ keyCode: 37 }); // Left
                inputDetected = true;
            }
        } else {
            if (leftStickY > threshold) {
                changeDirection({ keyCode: 40 }); // Down
                inputDetected = true;
            } else if (leftStickY < -threshold) {
                changeDirection({ keyCode: 38 }); // Up
                inputDetected = true;
            }
        }
    }

    // Botões de pausa (Start/Select)
    if ((gamepad.buttons[9] && gamepad.buttons[9].pressed) || 
        (gamepad.buttons[8] && gamepad.buttons[8].pressed)) {
        togglePause();
        inputDetected = true;
    }

    if (inputDetected) {
        lastGamepadInputTime = now;
    }
}

// ====== SELEÇÃO DE CONTROLES ======
function selectControl(type) {
    currentControlType = type;
    
    // Atualiza botões visuais
    document.getElementById('keyboardBtn').classList.toggle('active', type === 'keyboard');
    document.getElementById('gamepadBtn').classList.toggle('active', type === 'gamepad');
    
    // Atualiza status do gamepad
    if (type === 'gamepad') {
        document.getElementById('gamepadStatus').style.display = 'block';
    } else {
        document.getElementById('gamepadStatus').style.display = 'none';
    }
}

// ====== MODOS DE JOGO ======
const gameModes = {
    classic: {
        name: 'Modo Clássico',
        description: 'Snake tradicional',
        hasObstacles: false,
        hasBadFood: false,
        hasPortal: false,
        speedIncrease: false,
        colorfulFood: false
    },
    speed: {
        name: 'Modo Velocidade',
        description: 'Acelera com o tempo',
        hasObstacles: false,
        hasBadFood: false,
        hasPortal: false,
        speedIncrease: true,
        colorfulFood: false
    },
    obstacles: {
        name: 'Modo Obstáculos',
        description: 'Paredes no mapa',
        hasObstacles: true,
        hasBadFood: false,
        hasPortal: false,
        speedIncrease: false,
        colorfulFood: false
    },
    portal: {
        name: 'Modo Portal',
        description: 'Atravesse as paredes',
        hasObstacles: false,
        hasBadFood: false,
        hasPortal: true,
        speedIncrease: false,
        colorfulFood: false
    },
    survival: {
        name: 'Modo Sobrevivência',
        description: 'Comida ruim aparece',
        hasObstacles: false,
        hasBadFood: true,
        hasPortal: false,
        speedIncrease: false,
        colorfulFood: false
    },
    rainbow: {
        name: 'Modo Arco-íris',
        description: 'Comidas coloridas',
        hasObstacles: false,
        hasBadFood: false,
        hasPortal: false,
        speedIncrease: false,
        colorfulFood: true
    }
};

// ====== INICIALIZAÇÃO DO JOGO ======
function startGame(mode) {
    currentGameMode = mode;
    const modeConfig = gameModes[mode];
    
    // Atualiza interface
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('modeDisplay').textContent = modeConfig.name;
    
    // Atualiza informações de controle
    updateControlsInfo();
    
    // Inicializa estado do jogo
    initializeGame();
    
    // Inicia o loop do jogo
    gameRunning = true;
    gamePaused = false;
    gameLoop();
}

function updateControlsInfo() {
    const controlsInfo = document.getElementById('controlsInfo');
    if (currentControlType === 'keyboard') {
        controlsInfo.innerHTML = `
            <strong>Teclado:</strong><br>
            Setas ou WASD para mover<br>
            ESC para pausar
        `;
    } else {
        controlsInfo.innerHTML = `
            <strong>Gamepad:</strong><br>
            D-pad ou Analógico para mover<br>
            Start/Select para pausar
        `;
    }
}

function initializeGame() {
    // Reset variáveis
    snake = [{ x: 300, y: 300 }];
    dx = gridSize;
    dy = 0;
    score = 0;
    level = 1;
    speed = 1;
    gameSpeed = 150;
    
    // Gera comida inicial
    food = generateFood();
    
    // Inicializa elementos baseado no modo
    const mode = gameModes[currentGameMode];
    
    if (mode.hasObstacles) {
        generateObstacles();
    } else {
        obstacles = [];
    }
    
    if (mode.hasBadFood) {
        badFood = generateBadFood();
    } else {
        badFood = null;
    }
    
    // Atualiza interface
    updateGameUI();
}

// ====== GERAÇÃO DE ELEMENTOS ======
function generateFood() {
    const mode = gameModes[currentGameMode];
    let newFood;
    
    do {
        newFood = {
            x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
            y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize,
            color: mode.colorfulFood ? getRandomFoodColor() : '#FF5722',
            points: mode.colorfulFood ? getColorPoints(newFood?.color) : 10
        };
    } while (isPositionOccupied(newFood));
    
    return newFood;
}

function generateBadFood() {
    let newBadFood;
    
    do {
        newBadFood = {
            x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
            y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize,
            color: '#8B0000',
            points: -15
        };
    } while (isPositionOccupied(newBadFood));
    
    return newBadFood;
}

function generateObstacles() {
    obstacles = [];
    const numObstacles = 8 + Math.floor(level / 3);
    
    for (let i = 0; i < numObstacles; i++) {
        let obstacle;
        do {
            obstacle = {
                x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
                y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize
            };
        } while (isPositionOccupied(obstacle) || 
                    (Math.abs(obstacle.x - snake[0].x) < 60 && Math.abs(obstacle.y - snake[0].y) < 60));
        
        obstacles.push(obstacle);
    }
}

function getRandomFoodColor() {
    const colors = ['#FF5722', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getColorPoints(color) {
    const pointsMap = {
        '#FF5722': 10, // Vermelho
        '#2196F3': 15, // Azul
        '#4CAF50': 20, // Verde
        '#FF9800': 25, // Laranja
        '#9C27B0': 30, // Roxo
        '#F44336': 35, // Vermelho escuro
        '#00BCD4': 40  // Ciano
    };
    return pointsMap[color] || 10;
}

function isPositionOccupied(pos) {
    // Verifica se está na cobra
    if (snake.some(segment => segment.x === pos.x && segment.y === pos.y)) {
        return true;
    }
    
    // Verifica se está na comida
    if (food && food.x === pos.x && food.y === pos.y) {
        return true;
    }
    
    // Verifica se está na comida ruim
    if (badFood && badFood.x === pos.x && badFood.y === pos.y) {
        return true;
    }
    
    // Verifica se está em obstáculos
    if (obstacles.some(obstacle => obstacle.x === pos.x && obstacle.y === pos.y)) {
        return true;
    }
    
    return false;
}

// ====== MOVIMENTO E LÓGICA ======
function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // Modo portal (atravessar paredes)
    if (gameModes[currentGameMode].hasPortal) {
        if (head.x < 0) head.x = canvas.width - gridSize;
        if (head.x >= canvas.width) head.x = 0;
        if (head.y < 0) head.y = canvas.height - gridSize;
        if (head.y >= canvas.height) head.y = 0;
    }
    
    snake.unshift(head);
    
    // Verifica colisão com comida
    if (head.x === food.x && head.y === food.y) {
        score += food.points || 10;
        food = generateFood();
        
        // Aumenta nível a cada 100 pontos
        const newLevel = Math.floor(score / 100) + 1;
        if (newLevel > level) {
            level = newLevel;
            if (gameModes[currentGameMode].speedIncrease) {
                gameSpeed = Math.max(50, gameSpeed - 10);
                speed = Math.floor((200 - gameSpeed) / 15) + 1;
            }
            if (gameModes[currentGameMode].hasObstacles) {
                generateObstacles();
            }
        }
    }
    // Verifica colisão com comida ruim
    else if (badFood && head.x === badFood.x && head.y === badFood.y) {
        score = Math.max(0, score + badFood.points);
        if (snake.length > 1) {
            snake.pop(); // Remove um segmento extra
        }
        badFood = generateBadFood();
    }
    // Remove cauda se não comeu
    else {
        snake.pop();
    }
    
    // Gera nova comida ruim ocasionalmente
    if (gameModes[currentGameMode].hasBadFood && Math.random() < 0.005) {
        badFood = generateBadFood();
    }
    
    updateGameUI();
}

function checkCollisions() {
    const head = snake[0];
    
    // Modo portal não tem colisão com paredes
    if (!gameModes[currentGameMode].hasPortal) {
        if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
            return true;
        }
    }
    
    // Colisão com próprio corpo
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    // Colisão com obstáculos
    if (obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)) {
        return true;
    }
    
    // Game over se cobra ficou muito pequena
    if (snake.length <= 0) {
        return true;
    }
    
    return false;
}

function changeDirection(event) {
    if (changingDirection || gamePaused) return;
    
    const keyPressed = event.keyCode;
    const goingUp = dy === -gridSize;
    const goingDown = dy === gridSize;
    const goingRight = dx === gridSize;
    const goingLeft = dx === -gridSize;
    
    switch (keyPressed) {
        case 37: // Esquerda
        case 65:  // A
            if (!goingRight) {
                dx = -gridSize;
                dy = 0;
            }
            break;
        case 38: // Cima
        case 87:  // W
            if (!goingDown) {
                dx = 0;
                dy = -gridSize;
            }
            break;
        case 39: // Direita
        case 68:  // D
            if (!goingLeft) {
                dx = gridSize;
                dy = 0;
            }
            break;
        case 40: // Baixo
        case 83:  // S
            if (!goingUp) {
                dx = 0;
                dy = gridSize;
            }
            break;
        case 27: // ESC
            togglePause();
            break;
    }
    
    changingDirection = true;
}

// ====== RENDERIZAÇÃO ======
function drawSnake() {
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Cabeça da cobra
            const gradient = ctx.createLinearGradient(
                segment.x, segment.y, 
                segment.x + gridSize, segment.y + gridSize
            );
            gradient.addColorStop(0, '#4CAF50');
            gradient.addColorStop(1, '#2E7D32');
            ctx.fillStyle = gradient;
        } else {
            // Corpo da cobra
            ctx.fillStyle = `rgba(46, 125, 50, ${1 - (index * 0.02)})`;
        }
        
        ctx.fillRect(segment.x, segment.y, gridSize, gridSize);
        
        // Borda
        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 1;
        ctx.strokeRect(segment.x, segment.y, gridSize, gridSize);
        
        // Olhos na cabeça
        if (index === 0) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(segment.x + 4, segment.y + 4, 3, 3);
            ctx.fillRect(segment.x + 13, segment.y + 4, 3, 3);
            ctx.fillStyle = '#000';
            ctx.fillRect(segment.x + 5, segment.y + 5, 1, 1);
            ctx.fillRect(segment.x + 14, segment.y + 5, 1, 1);
        }
    });
}

function drawFood() {
    if (!food) return;
    
    // Efeito pulsante
    const pulse = Math.sin(Date.now() * 0.01) * 2;
    const size = gridSize - 2 + pulse;
    const offset = (gridSize - size) / 2;
    
    ctx.fillStyle = food.color;
    ctx.beginPath();
    ctx.arc(
        food.x + gridSize / 2,
        food.y + gridSize / 2,
        size / 2,
        0,
        2 * Math.PI
    );
    ctx.fill();
    
    // Brilho
    const glowGradient = ctx.createRadialGradient(
        food.x + gridSize / 2, food.y + gridSize / 2, 0,
        food.x + gridSize / 2, food.y + gridSize / 2, size / 2
    );
    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.fill();
    
    // Pontos da comida colorida
    if (gameModes[currentGameMode].colorfulFood && food.points > 10) {
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(food.points.toString(), food.x + gridSize/2, food.y + gridSize/2 + 3);
    }
}

function drawBadFood() {
    if (!badFood) return;
    
    // Efeito tremulante
    const shake = Math.sin(Date.now() * 0.02) * 1;
    
    ctx.fillStyle = badFood.color;
    ctx.fillRect(
        badFood.x + shake, 
        badFood.y + shake, 
        gridSize, 
        gridSize
    );
    
    // X vermelho
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(badFood.x + 4, badFood.y + 4);
    ctx.lineTo(badFood.x + gridSize - 4, badFood.y + gridSize - 4);
    ctx.moveTo(badFood.x + gridSize - 4, badFood.y + 4);
    ctx.lineTo(badFood.x + 4, badFood.y + gridSize - 4);
    ctx.stroke();
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        const gradient = ctx.createLinearGradient(
            obstacle.x, obstacle.y,
            obstacle.x + gridSize, obstacle.y + gridSize
        );
        gradient.addColorStop(0, '#666');
        gradient.addColorStop(1, '#333');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(obstacle.x, obstacle.y, gridSize, gridSize);
        
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.strokeRect(obstacle.x, obstacle.y, gridSize, gridSize);
    });
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();
    drawObstacles();
    drawFood();
    drawBadFood();
    drawSnake();
    
    // Efeito de pausa
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSADO', canvas.width / 2, canvas.height / 2);
        
        ctx.font = '16px Arial';
        ctx.fillText('Pressione ESC ou Start para continuar', canvas.width / 2, canvas.height / 2 + 40);
    }
}

// ====== CONTROLES DE JOGO ======
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (gamePaused) {
        pauseBtn.innerHTML = '▶️ Continuar';
    } else {
        pauseBtn.innerHTML = '⏸️ Pausar';
        // Retoma o loop se necessário
        if (gameRunning) {
            setTimeout(gameLoop, gameSpeed);
        }
    }
    
    draw(); // Redesenha para mostrar efeito de pausa
}

function backToMenu() {
    gameRunning = false;
    gamePaused = false;
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
}

function restartGame() {
    document.getElementById('gameOver').style.display = 'none';
    initializeGame();
    gameRunning = true;
    gamePaused = false;
    gameLoop();
}

function showGameOver() {
    const mode = gameModes[currentGameMode];
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = level;
    document.getElementById('finalMode').textContent = mode.name;
    document.getElementById('gameOver').style.display = 'block';
    
    // Efeito de shake no canvas
    canvas.classList.add('shake');
    setTimeout(() => canvas.classList.remove('shake'), 500);
}

function updateGameUI() {
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('levelValue').textContent = level;
    document.getElementById('speedValue').textContent = speed;
}

// ====== LOOP PRINCIPAL ======
function gameLoop() {
    if (!gameRunning || gamePaused) return;
    
    if (checkCollisions()) {
        gameRunning = false;
        showGameOver();
        return;
    }
    
    moveSnake();
    draw();
    
    changingDirection = false;
    setTimeout(gameLoop, gameSpeed);
}

// ====== EVENTOS ======
document.addEventListener('keydown', (event) => {
    if (gameRunning && !gamePaused) {
        changeDirection(event);
    } else if (event.keyCode === 27) { // ESC
        if (gameRunning) togglePause();
    }
});

// ====== INICIALIZAÇÃO ======
initGamepadSupport();

// Desenha o canvas inicial
ctx.fillStyle = '#0a0a0a';
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = '#333';
ctx.font = '24px Arial';
ctx.textAlign = 'center';
ctx.fillText('Selecione um modo de jogo para começar', canvas.width / 2, canvas.height / 2);
