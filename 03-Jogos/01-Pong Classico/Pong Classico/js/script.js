// === CONFIGURAÇÕES GLOBAIS ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elementos da interface
const mainMenu = document.getElementById('mainMenu');
const gameInterface = document.getElementById('gameInterface');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const currentModeEl = document.getElementById('currentMode');
const gameTimerEl = document.getElementById('gameTimer');

// === SISTEMA DE CONTROLES USB ===
let gamepads = {};
let gamepadSupported = 'getGamepads' in navigator;

// Monitorar conexão/desconexão de controles
if (gamepadSupported) {
    window.addEventListener('gamepadconnected', (e) => {
        console.log('🎮 Controle conectado:', e.gamepad.id);
        gamepads[e.gamepad.index] = e.gamepad;
        updateControllerStatus();
    });

    window.addEventListener('gamepaddisconnected', (e) => {
        console.log('🎮 Controle desconectado:', e.gamepad.id);
        delete gamepads[e.gamepad.index];
        updateControllerStatus();
    });
}

function updateGamepads() {
    if (!gamepadSupported) return;
    
    const connectedGamepads = navigator.getGamepads();
    for (let i = 0; i < connectedGamepads.length; i++) {
        if (connectedGamepads[i]) {
            gamepads[i] = connectedGamepads[i];
        }
    }
}

function updateControllerStatus() {
    const controller1Status = document.getElementById('controller1Status');
    const controller2Status = document.getElementById('controller2Status');
    const testBtn1 = document.getElementById('testController1');
    const testBtn2 = document.getElementById('testController2');
    
    if (!controller1Status || !controller2Status) return;
    
    // Verificar controle 1 (índice 0)
    const gamepad1 = gamepads[0];
    const status1 = controller1Status.querySelector('.status');
    if (gamepad1 && status1) {
        status1.textContent = 'Conectado: ' + gamepad1.id.substring(0, 20) + '...';
        status1.className = 'status connected';
        if (testBtn1) testBtn1.disabled = false;
    } else if (status1) {
        status1.textContent = 'Não Conectado';
        status1.className = 'status disconnected';
        if (testBtn1) testBtn1.disabled = true;
    }
    
    // Verificar controle 2 (índice 1)
    const gamepad2 = gamepads[1];
    const status2 = controller2Status.querySelector('.status');
    if (gamepad2 && status2) {
        status2.textContent = 'Conectado: ' + gamepad2.id.substring(0, 20) + '...';
        status2.className = 'status connected';
        if (testBtn2) testBtn2.disabled = false;
    } else if (status2) {
        status2.textContent = 'Não Conectado';
        status2.className = 'status disconnected';
        if (testBtn2) testBtn2.disabled = true;
    }
}

// === ESTADO DO JOGO ===
let gameRunning = false;
let gamePaused = false;
let animationId = null;
let currentGameMode = 'classic';
let gameStartTime = 0;
let gameTime = 0;
let powerUpSpawnTimeout = null;

// === OBJETOS DO JOGO ===
let player1 = {
    x: 20,
    y: 0,
    width: 15,
    height: 100,
    speed: 6,
    score: 0,
    powerUp: null,
    powerUpTime: 0,
    originalHeight: 100,
    originalSpeed: 6
};

let player2 = {
    x: 0,
    y: 0,
    width: 15,
    height: 100,
    speed: 4,
    score: 0,
    isAI: true,
    powerUp: null,
    powerUpTime: 0,
    originalHeight: 100,
    originalSpeed: 4
};

let balls = [];
let obstacles = [];
let powerUps = [];
let particles = [];

// === SISTEMA DE MODALIDADES ===
const gameModes = {
    classic: {
        name: 'Clássico',
        description: 'Jogador vs CPU tradicional',
        init: () => {
            player2.isAI = true;
            player2.speed = 4;
            balls = [{
                x: canvas.width / 2,
                y: canvas.height / 2,
                radius: 12,
                speedX: 5,
                speedY: 3,
                maxSpeed: 12,
                trail: []
            }];
            obstacles = [];
            powerUps = [];
        }
    },
    multiplayer: {
        name: '2 Jogadores',
        description: 'Jogador vs Jogador local',
        init: () => {
            player2.isAI = false;
            player2.speed = 6;
            balls = [{
                x: canvas.width / 2,
                y: canvas.height / 2,
                radius: 12,
                speedX: 5,
                speedY: 3,
                maxSpeed: 12,
                trail: []
            }];
            obstacles = [];
            powerUps = [];
        }
    },
    speed: {
        name: 'Velocidade',
        description: 'Bola acelera constantemente',
        init: () => {
            player2.isAI = true;
            player2.speed = 5;
            balls = [{
                x: canvas.width / 2,
                y: canvas.height / 2,
                radius: 12,
                speedX: 5,
                speedY: 3,
                maxSpeed: 20,
                acceleration: 1.002,
                trail: []
            }];
            obstacles = [];
            powerUps = [];
        }
    },
    'multi-ball': {
        name: 'Multi-Bola',
        description: 'Várias bolas simultaneamente',
        init: () => {
            player2.isAI = true;
            player2.speed = 5;
            balls = [];
            for (let i = 0; i < 3; i++) {
                balls.push({
                    x: canvas.width / 2 + (i - 1) * 100,
                    y: canvas.height / 2,
                    radius: 10,
                    speedX: (Math.random() > 0.5 ? 1 : -1) * (4 + i),
                    speedY: (Math.random() - 0.5) * 6,
                    maxSpeed: 12,
                    trail: []
                });
            }
            obstacles = [];
            powerUps = [];
        }
    },
    obstacles: {
        name: 'Obstáculos',
        description: 'Com blocos no meio do campo',
        init: () => {
            player2.isAI = true;
            player2.speed = 5;
            balls = [{
                x: canvas.width / 2,
                y: canvas.height / 2,
                radius: 12,
                speedX: 5,
                speedY: 3,
                maxSpeed: 12,
                trail: []
            }];
            obstacles = [];
            for (let i = 0; i < 6; i++) {
                obstacles.push({
                    x: canvas.width / 2 - 25 + Math.random() * 50,
                    y: 50 + i * 50,
                    width: 20,
                    height: 20,
                    hits: 0,
                    maxHits: 3
                });
            }
            powerUps = [];
        }
    },
    'power-ups': {
        name: 'Power-ups',
        description: 'Colete poderes especiais',
        init: () => {
            player2.isAI = true;
            player2.speed = 5;
            balls = [{
                x: canvas.width / 2,
                y: canvas.height / 2,
                radius: 12,
                speedX: 5,
                speedY: 3,
                maxSpeed: 12,
                trail: []
            }];
            obstacles = [];
            powerUps = [];
            // Spawn inicial de power-up após 3 segundos
            if (powerUpSpawnTimeout) clearTimeout(powerUpSpawnTimeout);
            powerUpSpawnTimeout = setTimeout(() => spawnPowerUp(), 3000);
        }
    }
};

// === CONTROLES ===
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

function handleInput() {
    // Player 1 - Teclado
    if (keys['w'] || keys['arrowup']) {
        player1.y -= player1.speed;
    }
    if (keys['s'] || keys['arrowdown']) {
        player1.y += player1.speed;
    }

    // Player 2 - Teclado (modo multiplayer)
    if (!player2.isAI) {
        if (keys['i']) {
            player2.y -= player2.speed;
        }
        if (keys['k']) {
            player2.y += player2.speed;
        }
    }

    // Controles USB
    updateGamepads();
    
    // Player 1 - Controle USB
    if (gamepads[0]) {
        const gamepad1 = gamepads[0];
        if (gamepad1.axes && gamepad1.axes.length > 1) {
            const leftStickY = gamepad1.axes[1];
            if (Math.abs(leftStickY) > 0.1) {
                player1.y += leftStickY * player1.speed;
            }
        }
        
        if (gamepad1.buttons && gamepad1.buttons.length > 13) {
            if (gamepad1.buttons[12] && gamepad1.buttons[12].pressed) {
                player1.y -= player1.speed;
            }
            if (gamepad1.buttons[13] && gamepad1.buttons[13].pressed) {
                player1.y += player1.speed;
            }
        }
    }

    // Player 2 - Controle USB (modo multiplayer)
    if (!player2.isAI && gamepads[1]) {
        const gamepad2 = gamepads[1];
        if (gamepad2.axes && gamepad2.axes.length > 1) {
            const leftStickY = gamepad2.axes[1];
            if (Math.abs(leftStickY) > 0.1) {
                player2.y += leftStickY * player2.speed;
            }
        }
        
        if (gamepad2.buttons && gamepad2.buttons.length > 13) {
            if (gamepad2.buttons[12] && gamepad2.buttons[12].pressed) {
                player2.y -= player2.speed;
            }
            if (gamepad2.buttons[13] && gamepad2.buttons[13].pressed) {
                player2.y += player2.speed;
            }
        }
    }

    // Limitar movimento
    player1.y = Math.max(0, Math.min(player1.y, canvas.height - player1.height));
    player2.y = Math.max(0, Math.min(player2.y, canvas.height - player2.height));
}

// === SISTEMA DE POWER-UPS ===
const powerUpTypes = [
    { type: 'speed', color: '#ff6b6b', icon: '⚡', effect: 'Velocidade aumentada' },
    { type: 'size', color: '#4ecdc4', icon: '📏', effect: 'Paddle maior' },
    { type: 'slow', color: '#45b7d1', icon: '🐌', effect: 'Bola mais lenta' },
    { type: 'multi', color: '#96ceb4', icon: '⚽', effect: 'Bola extra' }
];

function spawnPowerUp() {
    if (currentGameMode !== 'power-ups' || !gameRunning || gamePaused) {
        return;
    }
    
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    powerUps.push({
        x: canvas.width / 4 + Math.random() * (canvas.width / 2),
        y: 50 + Math.random() * (canvas.height - 100),
        width: 30,
        height: 30,
        type: type.type,
        color: type.color,
        icon: type.icon,
        rotation: 0,
        pulse: 0
    });
    
    // Próximo power-up em 8-15 segundos
    if (powerUpSpawnTimeout) clearTimeout(powerUpSpawnTimeout);
    powerUpSpawnTimeout = setTimeout(() => spawnPowerUp(), 8000 + Math.random() * 7000);
}

function applyPowerUp(player, powerUp) {
    player.powerUp = powerUp.type;
    player.powerUpTime = Date.now() + 10000; // 10 segundos
    
    switch (powerUp.type) {
        case 'speed':
            player.speed = 10;
            break;
        case 'size':
            player.height = 150;
            break;
        case 'slow':
            balls.forEach(ball => {
                ball.speedX *= 0.5;
                ball.speedY *= 0.5;
            });
            break;
        case 'multi':
            if (balls.length > 0) {
                const newBall = { ...balls[0] };
                newBall.speedX = -newBall.speedX;
                newBall.speedY += (Math.random() - 0.5) * 4;
                newBall.trail = [];
                balls.push(newBall);
            }
            break;
    }
    
    createParticles(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, powerUp.color);
}

// === SISTEMA DE PARTÍCULAS ===
function createParticles(x, y, color) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            decay: 0.02,
            color: color,
            size: 2 + Math.random() * 3
        });
    }
}

// === FUNÇÕES DE ATUALIZAÇÃO ===
function updatePlayers() {
    // Configurar posições iniciais se necessário
    if (player2.x === 0) {
        player2.x = canvas.width - 35;
    }
    if (player1.y === 0 && player2.y === 0) {
        player1.y = canvas.height / 2 - 50;
        player2.y = canvas.height / 2 - 50;
    }

    // Atualizar power-ups
    [player1, player2].forEach(player => {
        if (player.powerUpTime && Date.now() > player.powerUpTime) {
            // Resetar efeitos
            player.speed = player.originalSpeed;
            player.height = player.originalHeight;
            player.powerUp = null;
            player.powerUpTime = 0;
        }
    });

    // IA do player 2 (quando aplicável)
    if (player2.isAI && balls.length > 0) {
        const targetBall = balls.reduce((closest, ball) => {
            const closestDist = Math.abs(closest.x - player2.x);
            const ballDist = Math.abs(ball.x - player2.x);
            return ballDist < closestDist ? ball : closest;
        });
        
        const ballCenter = targetBall.y + targetBall.radius;
        const paddleCenter = player2.y + player2.height / 2;
        
        if (ballCenter < paddleCenter - 15) {
            player2.y -= player2.speed;
        } else if (ballCenter > paddleCenter + 15) {
            player2.y += player2.speed;
        }
    }
}

function updateBalls() {
    for (let ballIndex = balls.length - 1; ballIndex >= 0; ballIndex--) {
        const ball = balls[ballIndex];
        
        // Atualizar trail
        if (!ball.trail) ball.trail = [];
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 10) ball.trail.shift();
        
        // Movimento
        ball.x += ball.speedX;
        ball.y += ball.speedY;
        
        // Aceleração (modo speed)
        if (ball.acceleration) {
            ball.speedX *= ball.acceleration;
            ball.speedY *= ball.acceleration;
        }
        
        // Colisão com topo e fundo
        if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
            ball.speedY = -ball.speedY;
            ball.y = Math.max(ball.radius, Math.min(ball.y, canvas.height - ball.radius));
            createParticles(ball.x, ball.y, '#ffeb3b');
        }
        
        // Colisão com obstáculos
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obstacle = obstacles[i];
            if (ball.x - ball.radius < obstacle.x + obstacle.width &&
                ball.x + ball.radius > obstacle.x &&
                ball.y - ball.radius < obstacle.y + obstacle.height &&
                ball.y + ball.radius > obstacle.y) {
                
                // Determinar direção da colisão
                const overlapX = Math.min(ball.x + ball.radius - obstacle.x, obstacle.x + obstacle.width - (ball.x - ball.radius));
                const overlapY = Math.min(ball.y + ball.radius - obstacle.y, obstacle.y + obstacle.height - (ball.y - ball.radius));
                
                if (overlapX < overlapY) {
                    ball.speedX = -ball.speedX;
                } else {
                    ball.speedY = -ball.speedY;
                }
                
                obstacle.hits++;
                createParticles(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, '#ff6b6b');
                
                if (obstacle.hits >= obstacle.maxHits) {
                    obstacles.splice(i, 1);
                }
                break;
            }
        }
        
        // Colisão com power-ups
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const powerUp = powerUps[i];
            if (ball.x - ball.radius < powerUp.x + powerUp.width &&
                ball.x + ball.radius > powerUp.x &&
                ball.y - ball.radius < powerUp.y + powerUp.height &&
                ball.y + ball.radius > powerUp.y) {
                
                // Aplicar ao jogador mais próximo
                const distToPlayer1 = Math.abs(ball.x - (player1.x + player1.width));
                const distToPlayer2 = Math.abs(ball.x - player2.x);
                
                if (distToPlayer1 < distToPlayer2) {
                    applyPowerUp(player1, powerUp);
                } else {
                    applyPowerUp(player2, powerUp);
                }
                
                powerUps.splice(i, 1);
                break;
            }
        }
        
        // Colisão com paddles
        // Player 1
        if (ball.speedX < 0 && // Apenas se a bola estiver indo para a esquerda
            ball.x - ball.radius < player1.x + player1.width &&
            ball.x + ball.radius > player1.x &&
            ball.y - ball.radius < player1.y + player1.height &&
            ball.y + ball.radius > player1.y) {
            
            const impactY = (ball.y - (player1.y + player1.height / 2)) / (player1.height / 2);
            ball.speedX = Math.abs(ball.speedX);
            ball.speedY = impactY * 6;
            
            if (Math.abs(ball.speedX) < ball.maxSpeed) {
                ball.speedX *= 1.05;
            }
            
            // Evitar que a bola fique presa no paddle
            ball.x = player1.x + player1.width + ball.radius;
            
            createParticles(ball.x, ball.y, '#00ff88');
        }
        
        // Player 2
        if (ball.speedX > 0 && // Apenas se a bola estiver indo para a direita
            ball.x + ball.radius > player2.x &&
            ball.x - ball.radius < player2.x + player2.width &&
            ball.y - ball.radius < player2.y + player2.height &&
            ball.y + ball.radius > player2.y) {
            
            const impactY = (ball.y - (player2.y + player2.height / 2)) / (player2.height / 2);
            ball.speedX = -Math.abs(ball.speedX);
            ball.speedY = impactY * 6;
            
            if (Math.abs(ball.speedX) < ball.maxSpeed) {
                ball.speedX *= 1.05;
            }
            
            // Evitar que a bola fique presa no paddle
            ball.x = player2.x - ball.radius;
            
            createParticles(ball.x, ball.y, '#ff6b6b');
        }
        
        // Pontuação
        if (ball.x < -50) {
            player2.score++;
            updateScore();
            if (balls.length > 1) {
                balls.splice(ballIndex, 1);
            } else {
                resetBall(ball);
            }
        }
        
        if (ball.x > canvas.width + 50) {
            player1.score++;
            updateScore();
            if (balls.length > 1) {
                balls.splice(ballIndex, 1);
            } else {
                resetBall(ball);
            }
        }
    }
    
    // Garantir pelo menos uma bola
    if (balls.length === 0) {
        balls.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: 12,
            speedX: 5,
            speedY: 3,
            maxSpeed: 12,
            trail: []
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= particle.decay;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updatePowerUps() {
    powerUps.forEach(powerUp => {
        powerUp.rotation += 0.05;
        powerUp.pulse += 0.1;
    });
}

function resetBall(ball) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speedX = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.speedY = (Math.random() - 0.5) * 6;
    ball.trail = [];
    
    // Reset acceleration if exists
    if (ball.acceleration) {
        ball.speedX = (Math.random() > 0.5 ? 1 : -1) * 5;
        ball.speedY = (Math.random() - 0.5) * 6;
    }
}

// === FUNÇÕES DE RENDERIZAÇÃO ===
function drawBackground() {
    // Linha central animada
    ctx.save();
    ctx.setLineDash([15, 15]);
    ctx.lineDashOffset = (Date.now() / 100) % 30;
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.restore();
}

function drawPaddles() {
    // Player 1
    ctx.save();
    if (player1.powerUp) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = getPowerUpColor(player1.powerUp);
    } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff88';
    }
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
    ctx.restore();
    
    // Player 2
    ctx.save();
    if (player2.powerUp) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = getPowerUpColor(player2.powerUp);
    } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff6b6b';
    }
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(player2.x, player2.y, player2.width, player2.height);
    ctx.restore();
}

function drawBalls() {
    balls.forEach(ball => {
        // Trail
        if (ball.trail && ball.trail.length > 0) {
            ctx.save();
            ball.trail.forEach((point, index) => {
                const alpha = index / ball.trail.length * 0.5;
                const size = (index / ball.trail.length) * ball.radius;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                ctx.fillStyle = '#ffeb3b';
                ctx.fill();
            });
            ctx.restore();
        }
        
        // Bola principal
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffeb3b';
        ctx.fill();
        ctx.restore();
    });
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        const alpha = 1 - (obstacle.hits / obstacle.maxHits) * 0.7;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff6b6b';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ff6b6b';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.restore();
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.save();
        ctx.translate(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2);
        ctx.rotate(powerUp.rotation);
        
        const pulseScale = 1 + Math.sin(powerUp.pulse) * 0.1;
        ctx.scale(pulseScale, pulseScale);
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = powerUp.color;
        ctx.fillStyle = powerUp.color;
        ctx.fillRect(-powerUp.width/2, -powerUp.height/2, powerUp.width, powerUp.height);
        
        ctx.fillStyle = '#000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(powerUp.icon, 0, 5);
        
        ctx.restore();
    });
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawUI() {
    ctx.save();
    ctx.textAlign = 'left';
    
    // Power-up status Player 1
    if (player1.powerUp) {
        const timeLeft = Math.max(0, player1.powerUpTime - Date.now()) / 1000;
        ctx.fillStyle = getPowerUpColor(player1.powerUp);
        ctx.font = '14px Arial';
        ctx.fillText(`P1: ${getPowerUpName(player1.powerUp)} (${timeLeft.toFixed(1)}s)`, 20, 20);
    }
    
    // Power-up status Player 2
    if (player2.powerUp) {
        const timeLeft = Math.max(0, player2.powerUpTime - Date.now()) / 1000;
        ctx.fillStyle = getPowerUpColor(player2.powerUp);
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`P2: ${getPowerUpName(player2.powerUp)} (${timeLeft.toFixed(1)}s)`, canvas.width - 20, 20);
    }
    
    ctx.restore();
}

function getPowerUpColor(type) {
    const colors = { 
        speed: '#ff6b6b', 
        size: '#4ecdc4', 
        slow: '#45b7d1', 
        multi: '#96ceb4' 
    };
    return colors[type] || '#fff';
}

function getPowerUpName(type) {
    const names = { 
        speed: 'Velocidade', 
        size: 'Tamanho', 
        slow: 'Lentidão', 
        multi: 'Multi-Bola' 
    };
    return names[type] || type;
}

// === SISTEMA DE MENU ===
function initializeMenu() {
    const modeCards = document.querySelectorAll('.mode-card');
    
    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove seleção anterior
            modeCards.forEach(c => c.classList.remove('selected'));
            // Adiciona seleção atual
            card.classList.add('selected');
            currentGameMode = card.dataset.mode;
            
            // Inicializar modo
            if (gameModes[currentGameMode]) {
                gameModes[currentGameMode].init();
                if (currentModeEl) {
                    currentModeEl.textContent = `Modo: ${gameModes[currentGameMode].name}`;
                }
            }
            
            // Atualizar labels dos jogadores
            const player1LabelEl = document.getElementById('player1Label');
            const player2LabelEl = document.getElementById('player2Label');
            
            if (player1LabelEl && player2LabelEl) {
                if (currentGameMode === 'multiplayer') {
                    player1LabelEl.innerHTML = 'Jogador 1: <span id="player1Score">0</span>';
                    player2LabelEl.innerHTML = 'Jogador 2: <span id="player2Score">0</span>';
                } else {
                    player1LabelEl.innerHTML = 'Jogador: <span id="player1Score">0</span>';
                    player2LabelEl.innerHTML = 'CPU: <span id="player2Score">0</span>';
                }
            }
            
            // Mostrar interface do jogo
            if (mainMenu && gameInterface) {
                mainMenu.style.display = 'none';
                gameInterface.style.display = 'block';
            }
            
            resetGame();
        });
    });
}

// === CONTROLES DO JOGO ===
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        gameStartTime = Date.now();
        if (startBtn) startBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = false;
        gameLoop();
    }
}

function pauseGame() {
    if (gameRunning) {
        gamePaused = !gamePaused;
        if (gamePaused) {
            if (pauseBtn) pauseBtn.textContent = '▶️ Continuar';
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        } else {
            if (pauseBtn) pauseBtn.textContent = '⏸️ Pausar';
            gameLoop();
        }
    }
}

function resetGame() {
    // Parar o jogo
    gameRunning = false;
    gamePaused = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Limpar timeouts
    if (powerUpSpawnTimeout) {
        clearTimeout(powerUpSpawnTimeout);
        powerUpSpawnTimeout = null;
    }
    
    // Resetar objetos
    player1 = {
        x: 20,
        y: canvas.height / 2 - 50,
        width: 15,
        height: 100,
        speed: 6,
        score: 0,
        powerUp: null,
        powerUpTime: 0,
        originalHeight: 100,
        originalSpeed: 6
    };
    
    player2 = {
        x: canvas.width - 35,
        y: canvas.height / 2 - 50,
        width: 15,
        height: 100,
        speed: 4,
        score: 0,
        isAI: true,
        powerUp: null,
        powerUpTime: 0,
        originalHeight: 100,
        originalSpeed: 4
    };
    
    // Reinicializar modo atual
    if (gameModes[currentGameMode]) {
        gameModes[currentGameMode].init();
    }
    
    // Resetar timer
    gameStartTime = 0;
    gameTime = 0;
    updateTimer();
    
    // Resetar arrays
    particles = [];
    
    // Resetar botões
    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.textContent = '⏸️ Pausar';
    }
    
    // Atualizar placar
    updateScore();
    
    // Desenhar estado inicial
    drawFrame();
}

function backToMenu() {
    resetGame();
    if (gameInterface && mainMenu) {
        gameInterface.style.display = 'none';
        mainMenu.style.display = 'block';
    }
    
    // Remover seleções
    document.querySelectorAll('.mode-card').forEach(card => {
        card.classList.remove('selected');
    });
}

function updateScore() {
    // Buscar elementos atualizados do DOM
    const p1ScoreEl = document.getElementById('player1Score');
    const p2ScoreEl = document.getElementById('player2Score');
    
    if (p1ScoreEl) p1ScoreEl.textContent = player1.score;
    if (p2ScoreEl) p2ScoreEl.textContent = player2.score;
    
    // Verificar vitória
    if (player1.score >= 5) {
        setTimeout(() => {
            alert('🎉 Jogador 1 Venceu! 🏆');
            resetGame();
        }, 100);
    } else if (player2.score >= 5) {
        const winner = player2.isAI ? 'CPU' : 'Jogador 2';
        setTimeout(() => {
            alert(`🎉 ${winner} Venceu! 🏆`);
            resetGame();
        }, 100);
    }
}

function updateTimer() {
    if (gameRunning && !gamePaused && gameStartTime > 0) {
        gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(gameTime / 60);
        const seconds = gameTime % 60;
        if (gameTimerEl) {
            gameTimerEl.textContent = `Tempo: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
}

// === LOOP PRINCIPAL ===
function gameLoop() {
    if (!gameRunning || gamePaused) return;
    
    handleInput();
    updatePlayers();
    updateBalls();
    updateParticles();
    updatePowerUps();
    updateTimer();
    
    drawFrame();
    
    animationId = requestAnimationFrame(gameLoop);
}

function drawFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    drawObstacles();
    drawPowerUps();
    drawPaddles();
    drawBalls();
    drawParticles();
    drawUI();
}

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se o canvas existe
    if (!canvas) {
        console.error('Canvas não encontrado!');
        return;
    }
    
    // Configurar tamanho do canvas se não estiver definido
    if (!canvas.width) canvas.width = 800;
    if (!canvas.height) canvas.height = 400;
    
    initializeMenu();
    
    // Event listeners com verificações de segurança
    if (startBtn) startBtn.addEventListener('click', startGame);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseGame);
    if (resetBtn) resetBtn.addEventListener('click', resetGame);
    if (backToMenuBtn) backToMenuBtn.addEventListener('click', backToMenu);
    
    // Testar controles - com verificações
    const testBtn1 = document.getElementById('testController1');
    const testBtn2 = document.getElementById('testController2');
    
    if (testBtn1) {
        testBtn1.addEventListener('click', () => {
            if (gamepads[0]) {
                alert('🎮 Controle 1 funcionando!\nMova o stick analógico esquerdo para controlar o paddle.');
            }
        });
    }
    
    if (testBtn2) {
        testBtn2.addEventListener('click', () => {
            if (gamepads[1]) {
                alert('🎮 Controle 2 funcionando!\nMova o stick analógico esquerdo para controlar o paddle.');
            }
        });
    }
    
    // Atualizar status dos controles periodicamente
    setInterval(updateGamepads, 100);
    setInterval(updateControllerStatus, 1000);
    
    // Inicializar modo clássico
    if (gameModes.classic) {
        gameModes.classic.init();
    }
    
    // Desenhar estado inicial
    drawFrame();
    
    console.log('🎮 Pong Multi-Modalidades carregado com sucesso!');
    console.log('🎯 6 modos de jogo disponíveis');
    console.log('👥 Suporte a 2 jogadores');
    console.log('🎮 Suporte a controles USB');
    console.log('⭐ Sistema de power-ups');
    console.log('🎨 Efeitos visuais avançados');
});