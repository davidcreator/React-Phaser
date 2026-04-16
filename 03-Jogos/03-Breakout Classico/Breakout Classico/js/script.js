// ========== CONFIGURAÇÃO INICIAL DO CANVAS ==========
/* O canvas é o elemento HTML5 onde desenhamos o jogo.
    É como uma "tela em branco" onde podemos desenhar formas, cores e animações. */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d"); // Contexto 2D para desenhar

// ========== VARIÁVEIS GLOBAIS DO JOGO ==========
/* Estas variáveis controlam todo o estado do jogo.
    Organizá-las no topo facilita a manutenção e entendimento do código. */

let gameState = {
    mode: "classic", // Modo de jogo atual
    running: false,  // Se o jogo está rodando
    paused: false,   // Se o jogo está pausado
    level: 1,        // Nível atual
    lives: 3,        // Vidas do jogador
    score: 0         // Pontuação
};

// ========== PROPRIEDADES DA BOLA ==========
/* A bola é o elemento central do jogo. Ela se move constantemente
    e interage com todos os outros elementos (paddle, blocos, paredes). */

let ball = {
    x: 0,              // Posição X (horizontal)
    y: 0,              // Posição Y (vertical) 
    dx: 0,             // Velocidade horizontal (delta X)
    dy: 0,             // Velocidade vertical (delta Y)
    radius: 10,        // Raio da bola
    maxSpeed: 8,       // Velocidade máxima
    trail: []          // Rastro visual da bola
};

// ========== PROPRIEDADES DAS BARRAS (PADDLES) ==========
/* As barras são controladas pelo jogador para rebater a bola.
    No modo multiplayer, há duas barras (superior e inferior). */

let paddle1 = {
    x: 0,
    y: 0,
    width: 100,
    height: 15,
    speed: 8,
    color: "#00ffcc"
};

let paddle2 = {
    x: 0,
    y: 0,
    width: 100,
    height: 15,
    speed: 8,
    color: "#ff4444"
};

// ========== SISTEMA DE CONTROLES ==========
/* Objeto que armazena o estado atual de todas as teclas pressionadas.
    Isso permite verificar múltiplas teclas simultaneamente. */

let keys = {
    left1: false,    // Jogador 1: mover esquerda
    right1: false,   // Jogador 1: mover direita
    left2: false,    // Jogador 2: mover esquerda
    right2: false,   // Jogador 2: mover direita
    pause: false,    // Pausar jogo
    restart: false   // Reiniciar jogo
};

// ========== CONFIGURAÇÃO DOS BLOCOS ==========
/* Os blocos são os alvos que o jogador precisa destruir.
    Diferentes tipos têm diferentes resistências e cores. */

const brickConfig = {
    rows: 6,
    cols: 10,
    width: 70,
    height: 25,
    padding: 5,
    offsetTop: 60,
    offsetLeft: 35,
    types: [
        { hits: 1, color: "#ff4444", points: 10 },  // Vermelho: 1 hit
        { hits: 2, color: "#ffaa00", points: 20 },  // Laranja: 2 hits  
        { hits: 3, color: "#44ff44", points: 30 },  // Verde: 3 hits
        { hits: 4, color: "#4444ff", points: 50 }   // Azul: 4 hits
    ]
};

let bricks = []; // Array que armazena todos os blocos

// ========== SISTEMA DE POWER-UPS ==========
/* Power-ups são itens especiais que caem quando alguns blocos são destruídos.
    Eles adicionam habilidades temporárias ao jogo. */

let powerUps = [];
let activePowerUps = new Map(); // Mapa dos power-ups ativos

const powerUpTypes = {
    EXPAND_PADDLE: {
        color: "#00ff00",
        symbol: "⬌",
        duration: 10000, // 10 segundos
        name: "Barra Expandida"
    },
    MULTI_BALL: {
        color: "#ff00ff", 
        symbol: "●",
        duration: 0, // Permanente até as bolas extras sumirem
        name: "Múltiplas Bolas"
    },
    SLOW_BALL: {
        color: "#00ffff",
        symbol: "⏱",
        duration: 8000, // 8 segundos
        name: "Bola Lenta"
    },
    EXTRA_LIFE: {
        color: "#ffff00",
        symbol: "♥",
        duration: 0, // Instantâneo
        name: "Vida Extra"
    }
};

// ========== SISTEMA DE PARTÍCULAS ==========
/* Efeitos visuais que tornam o jogo mais dinâmico e atrativo.
    Partículas são criadas quando blocos são destruídos ou em colisões. */

let particles = [];

// ========== MÚLTIPLAS BOLAS ==========
/* Sistema para gerenciar várias bolas simultaneamente (power-up). */
let balls = []; // Array de todas as bolas ativas

// ========== FUNÇÕES DO MENU E NAVEGAÇÃO ==========
/* Estas funções controlam a transição entre diferentes telas do jogo. */

function startGame(mode) {
    // Esconde o menu e mostra o canvas
    document.getElementById("menu").style.display = "none";
    document.getElementById("controls").style.display = "none";
    canvas.style.display = "block";
    document.getElementById("gameUI").style.display = "block";
    document.getElementById("powerUpInfo").style.display = "block";
    
    gameState.mode = mode;
    initGame();
    gameState.running = true;
    gameLoop(); // Inicia o loop principal do jogo
}

function showControls() {
    document.getElementById("menu").style.display = "none";
    document.getElementById("controls").style.display = "block";
}

function backToMenu() {
    document.getElementById("controls").style.display = "none";
    document.getElementById("menu").style.display = "block";
    
    // Para o jogo se estiver rodando
    gameState.running = false;
    canvas.style.display = "none";
    document.getElementById("gameUI").style.display = "none";
    document.getElementById("powerUpInfo").style.display = "none";
}

// ========== INICIALIZAÇÃO DO JOGO ==========
/* Esta função configura o estado inicial de todos os elementos do jogo. */

function initGame() {
    // Reseta variáveis do jogo
    gameState.level = 1;
    gameState.lives = 3;
    gameState.score = 0;
    gameState.paused = false;
    
    // Limpa arrays
    powerUps = [];
    particles = [];
    activePowerUps.clear();
    
    // Configura bola inicial
    resetBall();
    balls = [Object.assign({}, ball)]; // Cria array com uma bola
    
    // Posiciona as barras
    paddle1.x = (canvas.width - paddle1.width) / 2;
    paddle1.y = canvas.height - 30;
    
    paddle2.x = (canvas.width - paddle2.width) / 2;
    paddle2.y = 15;
    
    // Cria blocos do nível
    createBricks();
    updateUI();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 60;
    
    // Velocidade inicial aleatória
    const angle = (Math.random() - 0.5) * Math.PI/3; // Ângulo entre -60° e 60°
    const speed = 4;
    ball.dx = Math.sin(angle) * speed;
    ball.dy = -Math.cos(angle) * speed;
    
    ball.trail = []; // Limpa o rastro
}

// ========== CRIAÇÃO DOS BLOCOS ==========
/* Gera a matriz de blocos para cada nível.
    Diferentes níveis têm padrões e dificuldades diferentes. */

function createBricks() {
    bricks = [];
    
    for (let r = 0; r < brickConfig.rows; r++) {
        bricks[r] = [];
        for (let c = 0; c < brickConfig.cols; c++) {
            // Determina o tipo do bloco baseado na linha
            let typeIndex = Math.min(Math.floor(r / 2), brickConfig.types.length - 1);
            
            // Adiciona variação no nível
            if (gameState.level > 1) {
                typeIndex = Math.min(typeIndex + Math.floor(gameState.level / 3), 
                                    brickConfig.types.length - 1);
            }
            
            const type = brickConfig.types[typeIndex];
            
            bricks[r][c] = {
                x: c * (brickConfig.width + brickConfig.padding) + brickConfig.offsetLeft,
                y: r * (brickConfig.height + brickConfig.padding) + brickConfig.offsetTop,
                hits: type.hits,
                maxHits: type.hits,
                color: type.color,
                points: type.points,
                visible: true,
                hasPowerUp: Math.random() < 0.15 // 15% chance de ter power-up
            };
        }
    }
}

// ========== SISTEMA DE EVENTOS DE TECLADO ==========
/* Captura e processa as teclas pressionadas pelo jogador. */

document.addEventListener("keydown", (e) => {
    switch(e.key.toLowerCase()) {
        // Jogador 1
        case "arrowright":
        case "d":
            keys.right1 = true;
            break;
        case "arrowleft": 
        case "a":
            keys.left1 = true;
            break;
        
        // Jogador 2 (modo multiplayer)
        case "e":
            keys.right2 = true;
            break;
        case "q":
            keys.left2 = true;
            break;
        
        // Controles especiais
        case " ": // Espaço para pausar
            e.preventDefault();
            keys.pause = true;
            togglePause();
            break;
        case "r": // R para reiniciar
            keys.restart = true;
            if (confirm("Deseja reiniciar o jogo?")) {
                initGame();
            }
            break;
    }
});

document.addEventListener("keyup", (e) => {
    switch(e.key.toLowerCase()) {
        case "arrowright":
        case "d":
            keys.right1 = false;
            break;
        case "arrowleft":
        case "a":
            keys.left1 = false;
            break;
        case "e":
            keys.right2 = false;
            break;
        case "q":
            keys.left2 = false;
            break;
        case " ":
            keys.pause = false;
            break;
        case "r":
            keys.restart = false;
            break;
    }
});

// ========== SISTEMA DE GAMEPAD ==========
/* Suporte para controles de videogame conectados via USB ou Bluetooth.
    Inclui verificação de segurança para evitar erros de política do navegador. */

let gamepadSupported = false;

// Verifica se a API de gamepad está disponível e permitida
function checkGamepadSupport() {
    try {
        if (navigator.getGamepads) {
            // Tenta acessar uma vez para verificar se está permitido
            navigator.getGamepads();
            gamepadSupported = true;
            console.log("✅ Suporte a gamepad habilitado");
        } else {
            console.log("⚠️ API de gamepad não disponível neste navegador");
        }
    } catch (error) {
        console.log("⚠️ Gamepad bloqueado pela política de segurança do navegador");
        console.log("💡 Use os controles do teclado: Setas, WASD, QE");
        gamepadSupported = false;
    }
}

function updateGamepad() {
    // Só tenta atualizar gamepad se estiver disponível
    if (!gamepadSupported) return;
    
    try {
        const gamepads = navigator.getGamepads();
        
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (!gamepad) continue;
            
            // Jogador 1 (controle 0)
            if (i === 0) {
                keys.left1 = keys.left1 || gamepad.buttons[14]?.pressed || gamepad.axes[0] < -0.5;
                keys.right1 = keys.right1 || gamepad.buttons[15]?.pressed || gamepad.axes[0] > 0.5;
            }
            
            // Jogador 2 (controle 1)
            if (i === 1 && gameState.mode === "multiplayer") {
                keys.left2 = keys.left2 || gamepad.buttons[14]?.pressed || gamepad.axes[0] < -0.5;
                keys.right2 = keys.right2 || gamepad.buttons[15]?.pressed || gamepad.axes[0] > 0.5;
            }
        }
    } catch (error) {
        // Se der erro, desabilita gamepad
        console.log("⚠️ Erro ao acessar gamepad, desabilitando suporte");
        gamepadSupported = false;
    }
}

// ========== CONTROLE DE PAUSA ==========
function togglePause() {
    gameState.paused = !gameState.paused;
}

// ========== ATUALIZAÇÃO DA INTERFACE ==========
/* Atualiza os elementos da interface do usuário (pontuação, vidas, etc.) */

function updateUI() {
    document.getElementById("scoreDisplay").textContent = gameState.score;
    document.getElementById("livesDisplay").textContent = gameState.lives;
    document.getElementById("levelDisplay").textContent = gameState.level;
    
    // Atualiza power-ups ativos
    const powerUpDiv = document.getElementById("activePowerUps");
    let powerUpText = "";
    activePowerUps.forEach((endTime, type) => {
        if (endTime > Date.now() || endTime === 0) {
            const remaining = endTime === 0 ? "∞" : 
                Math.ceil((endTime - Date.now()) / 1000) + "s";
            powerUpText += `${powerUpTypes[type].symbol} ${powerUpTypes[type].name}: ${remaining}<br>`;
        }
    });
    powerUpDiv.innerHTML = powerUpText;
}

// ========== DETECÇÃO DE COLISÕES ==========
/* Verifica se dois objetos estão colidindo e processa as consequências. */

function checkCollisions(ballObj) {
    // Colisão com paredes laterais
    if (ballObj.x + ballObj.dx > canvas.width - ballObj.radius || 
        ballObj.x + ballObj.dx < ballObj.radius) {
        ballObj.dx = -ballObj.dx;
        createParticles(ballObj.x, ballObj.y, "#ffffff", 5);
    }
    
    // Colisão com teto
    if (ballObj.y + ballObj.dy < ballObj.radius) {
        if (gameState.mode === "multiplayer") {
            // Verifica colisão com paddle superior
            if (ballObj.x > paddle2.x && ballObj.x < paddle2.x + paddle2.width) {
                ballObj.dy = -ballObj.dy;
                createParticles(ballObj.x, ballObj.y, paddle2.color, 8);
            } else {
                // Player 1 ganha no multiplayer
                if (gameState.mode === "multiplayer") {
                    alert("🎉 Player 1 venceu!");
                    backToMenu();
                    return;
                }
            }
        } else {
            ballObj.dy = -ballObj.dy;
            createParticles(ballObj.x, ballObj.y, "#ffffff", 5);
        }
    }
    
    // Colisão com chão
    if (ballObj.y + ballObj.dy > canvas.height - ballObj.radius) {
        if (ballObj.x > paddle1.x && ballObj.x < paddle1.x + paddle1.width) {
            // Rebate na barra com efeito baseado na posição
            const hitPos = (ballObj.x - paddle1.x) / paddle1.width;
            const angle = (hitPos - 0.5) * Math.PI/3; // -60° a 60°
            const speed = Math.sqrt(ballObj.dx * ballObj.dx + ballObj.dy * ballObj.dy);
            
            ballObj.dx = Math.sin(angle) * speed;
            ballObj.dy = -Math.abs(Math.cos(angle) * speed);
            
            createParticles(ballObj.x, ballObj.y, paddle1.color, 8);
        } else {
            // Perde uma vida
            if (balls.length <= 1) { // Só perde vida se for a última bola
                loseLife();
                return;
            } else {
                // Remove apenas esta bola se houver múltiplas
                const index = balls.indexOf(ballObj);
                if (index > -1) balls.splice(index, 1);
                return;
            }
        }
    }
    
    // Colisão com blocos
    checkBrickCollisions(ballObj);
}

// ========== COLISÃO COM BLOCOS ==========
/* Verifica colisões da bola com os blocos e processa os efeitos. */

function checkBrickCollisions(ballObj) {
    for (let r = 0; r < brickConfig.rows; r++) {
        for (let c = 0; c < brickConfig.cols; c++) {
            const brick = bricks[r][c];
            if (!brick.visible) continue;
            
            // Verifica se a bola está colidindo com o bloco
            if (ballObj.x > brick.x && 
                ballObj.x < brick.x + brickConfig.width &&
                ballObj.y > brick.y && 
                ballObj.y < brick.y + brickConfig.height) {
                
                ballObj.dy = -ballObj.dy; // Inverte direção vertical
                
                brick.hits--; // Reduz resistência do bloco
                
                // Cria efeito de partículas
                createParticles(brick.x + brickConfig.width/2, 
                                brick.y + brickConfig.height/2, 
                                brick.color, 12);
                
                if (brick.hits <= 0) {
                    // Bloco destruído
                    brick.visible = false;
                    gameState.score += brick.points;
                    
                    // Cria power-up se o bloco tinha um
                    if (brick.hasPowerUp) {
                        createPowerUp(brick.x + brickConfig.width/2, 
                                    brick.y + brickConfig.height/2);
                    }
                    
                    // Verifica vitória do nível
                    if (checkLevelComplete()) {
                        nextLevel();
                        return;
                    }
                } else {
                    // Bloco danificado - muda cor
                    const damage = 1 - (brick.hits / brick.maxHits);
                    brick.color = interpolateColor(brick.color, "#333333", damage * 0.5);
                }
                
                updateUI();
                return; // Sai após primeira colisão
            }
        }
    }
}

// ========== SISTEMA DE POWER-UPS ==========
/* Cria e gerencia os power-ups que caem quando blocos são destruídos. */

function createPowerUp(x, y) {
    const types = Object.keys(powerUpTypes);
    const type = types[Math.floor(Math.random() * types.length)];
    
    powerUps.push({
        x: x,
        y: y,
        type: type,
        speed: 2,
        size: 20,
        rotation: 0
    });
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.y += powerUp.speed;
        powerUp.rotation += 0.1;
        
        // Remove se saiu da tela
        if (powerUp.y > canvas.height) {
            powerUps.splice(i, 1);
            continue;
        }
        
        // Verifica colisão com paddle
        if (powerUp.y + powerUp.size/2 > paddle1.y &&
            powerUp.x > paddle1.x && 
            powerUp.x < paddle1.x + paddle1.width) {
            
            activatePowerUp(powerUp.type);
            powerUps.splice(i, 1);
            createParticles(powerUp.x, powerUp.y, powerUpTypes[powerUp.type].color, 15);
        }
    }
}

function activatePowerUp(type) {
    const powerUp = powerUpTypes[type];
    const endTime = powerUp.duration > 0 ? Date.now() + powerUp.duration : 0;
    
    switch(type) {
        case "EXPAND_PADDLE":
            paddle1.width = 150;
            activePowerUps.set(type, endTime);
            break;
        
        case "MULTI_BALL":
            // Cria 2 bolas extras
            for (let i = 0; i < 2; i++) {
                const newBall = Object.assign({}, balls[0]);
                newBall.dx = (Math.random() - 0.5) * 6;
                newBall.dy = Math.random() * -4 - 2;
                balls.push(newBall);
            }
            activePowerUps.set(type, endTime);
            break;
        
        case "SLOW_BALL":
            balls.forEach(ball => {
                ball.dx *= 0.6;
                ball.dy *= 0.6;
            });
            activePowerUps.set(type, endTime);
            break;
        
        case "EXTRA_LIFE":
            gameState.lives++;
            break;
    }
    
    updateUI();
}

function updateActivePowerUps() {
    const currentTime = Date.now();
    
    activePowerUps.forEach((endTime, type) => {
        if (endTime > 0 && currentTime >= endTime) {
            // Power-up expirou
            switch(type) {
                case "EXPAND_PADDLE":
                    paddle1.width = 100; // Tamanho original
                    break;
                case "SLOW_BALL":
                    balls.forEach(ball => {
                        ball.dx *= 1.67; // Restaura velocidade
                        ball.dy *= 1.67;
                    });
                    break;
            }
            activePowerUps.delete(type);
        }
    });
}

// ========== SISTEMA DE PARTÍCULAS ==========
/* Cria efeitos visuais quando objetos colidem ou são destruídos. */

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            color: color,
            life: 30 + Math.random() * 20,
            maxLife: 50,
            size: Math.random() * 4 + 2
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.life--;
        
        // Aplica gravidade
        particle.dy += 0.1;
        particle.dx *= 0.98; // Resistência do ar
        
        // Remove partícula morta
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// ========== FUNÇÕES AUXILIARES ==========
/* Funções utilitárias para cálculos e efeitos especiais. */

function interpolateColor(color1, color2, factor) {
    // Interpola entre duas cores hexadecimais
    const c1 = parseInt(color1.slice(1), 16);
    const c2 = parseInt(color2.slice(1), 16);
    
    const r1 = (c1 >> 16) & 255;
    const g1 = (c1 >> 8) & 255;
    const b1 = c1 & 255;
    
    const r2 = (c2 >> 16) & 255;
    const g2 = (c2 >> 8) & 255;
    const b2 = c2 & 255;
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

function checkLevelComplete() {
    // Verifica se todos os blocos foram destruídos
    for (let r = 0; r < brickConfig.rows; r++) {
        for (let c = 0; c < brickConfig.cols; c++) {
            if (bricks[r][c].visible) return false;
        }
    }
    return true;
}

function nextLevel() {
    gameState.level++;
    
    // Aumenta dificuldade
    balls.forEach(ball => {
        ball.dx *= 1.1;
        ball.dy *= 1.1;
    });
    
    // Cria novos blocos
    createBricks();
    
    // Bonus por completar nível
    gameState.score += gameState.level * 100;
    
    // Vida extra a cada 3 níveis
    if (gameState.level % 3 === 0) {
        gameState.lives++;
    }
    
    updateUI();
    
    // Pausa momentânea para mostrar novo nível
    gameState.paused = true;
    setTimeout(() => {
        gameState.paused = false;
    }, 2000);
}

function loseLife() {
    gameState.lives--;
    updateUI();
    
    if (gameState.lives <= 0) {
        // Game Over
        alert(`🎮 Game Over! Pontuação final: ${gameState.score}`);
        backToMenu();
    } else {
        // Reseta posições para próxima vida
        resetBall();
        balls = [Object.assign({}, ball)];
        
        // Limpa power-ups ativos
        activePowerUps.clear();
        paddle1.width = 100; // Reseta tamanho da barra
        
        // Pausa breve
        gameState.paused = true;
        setTimeout(() => {
            gameState.paused = false;
        }, 1500);
    }
}

// ========== FUNÇÕES DE MOVIMENTO ==========
/* Atualiza posições de todos os objetos móveis do jogo. */

function updateMovement() {
    // Atualiza gamepad
    updateGamepad();
    
    // Move paddle 1 (jogador principal)
    if (keys.right1 && paddle1.x < canvas.width - paddle1.width) {
        paddle1.x += paddle1.speed;
    }
    if (keys.left1 && paddle1.x > 0) {
        paddle1.x -= paddle1.speed;
    }
    
    // Move paddle 2 (modo multiplayer)
    if (gameState.mode === "multiplayer") {
        if (keys.right2 && paddle2.x < canvas.width - paddle2.width) {
            paddle2.x += paddle2.speed;
        }
        if (keys.left2 && paddle2.x > 0) {
            paddle2.x -= paddle2.speed;
        }
    }
    
    // Move todas as bolas
    for (let i = balls.length - 1; i >= 0; i--) {
        const ballObj = balls[i];
        
        // Atualiza rastro da bola
        ballObj.trail.push({x: ballObj.x, y: ballObj.y});
        if (ballObj.trail.length > 8) {
            ballObj.trail.shift();
        }
        
        // Limita velocidade máxima
        const speed = Math.sqrt(ballObj.dx * ballObj.dx + ballObj.dy * ballObj.dy);
        if (speed > ballObj.maxSpeed) {
            ballObj.dx = (ballObj.dx / speed) * ballObj.maxSpeed;
            ballObj.dy = (ballObj.dy / speed) * ballObj.maxSpeed;
        }
        
        // Move a bola
        ballObj.x += ballObj.dx;
        ballObj.y += ballObj.dy;
        
        // Verifica colisões
        checkCollisions(ballObj);
    }
    
    // Remove referência se a bola foi removida nas colisões
    balls = balls.filter(b => b !== null && b !== undefined);
    
    // Se não há mais bolas, perde vida
    if (balls.length === 0) {
        loseLife();
    }
}

// ========== FUNÇÕES DE DESENHO ==========
/* Renderiza todos os elementos visuais do jogo na tela. */

function drawBackground() {
    // Fundo com gradiente animado
    const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, canvas.width/2
    );
    gradient.addColorStop(0, "#001122");
    gradient.addColorStop(1, "#000000");
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estrelas no fundo
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    for (let i = 0; i < 50; i++) {
        const x = (i * 37) % canvas.width;
        const y = (i * 67) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }
}

function drawBall(ballObj) {
    // Desenha rastro da bola
    for (let i = 0; i < ballObj.trail.length; i++) {
        const point = ballObj.trail[i];
        const alpha = (i + 1) / ballObj.trail.length * 0.5;
        const size = ballObj.radius * alpha;
        
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fillStyle = "#00ffcc";
        ctx.fill();
    }
    
    ctx.globalAlpha = 1;
    
    // Desenha bola principal com brilho
    const gradient = ctx.createRadialGradient(
        ballObj.x - 3, ballObj.y - 3, 0,
        ballObj.x, ballObj.y, ballObj.radius
    );
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.3, "#00ffcc");
    gradient.addColorStop(1, "#0088aa");
    
    ctx.beginPath();
    ctx.arc(ballObj.x, ballObj.y, ballObj.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Borda brilhante
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawPaddle(paddle, isTop = false) {
    // Desenha sombra
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(paddle.x + 2, paddle.y + 2, paddle.width, paddle.height);
    
    // Gradiente da barra
    const gradient = ctx.createLinearGradient(
        paddle.x, paddle.y,
        paddle.x, paddle.y + paddle.height
    );
    gradient.addColorStop(0, paddle.color);
    gradient.addColorStop(0.5, "#ffffff");
    gradient.addColorStop(1, paddle.color);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // Borda brilhante
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // Efeito de luz
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(paddle.x, paddle.y, paddle.width, 3);
}

function drawBricks() {
    for (let r = 0; r < brickConfig.rows; r++) {
        for (let c = 0; c < brickConfig.cols; c++) {
            const brick = bricks[r][c];
            if (!brick.visible) continue;
            
            // Sombra do bloco
            ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
            ctx.fillRect(brick.x + 2, brick.y + 2, brickConfig.width, brickConfig.height);
            
            // Gradiente do bloco
            const gradient = ctx.createLinearGradient(
                brick.x, brick.y,
                brick.x, brick.y + brickConfig.height
            );
            gradient.addColorStop(0, brick.color);
            gradient.addColorStop(0.5, "#ffffff");
            gradient.addColorStop(1, brick.color);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(brick.x, brick.y, brickConfig.width, brickConfig.height);
            
            // Borda
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.strokeRect(brick.x, brick.y, brickConfig.width, brickConfig.height);
            
            // Indicador de resistência
            if (brick.hits > 1) {
                ctx.fillStyle = "#ffffff";
                ctx.font = "12px Arial";
                ctx.textAlign = "center";
                ctx.fillText(
                    brick.hits.toString(),
                    brick.x + brickConfig.width/2,
                    brick.y + brickConfig.height/2 + 4
                );
            }
            
            // Indicador de power-up
            if (brick.hasPowerUp) {
                ctx.fillStyle = "#ffff00";
                ctx.font = "10px Arial";
                ctx.textAlign = "center";
                ctx.fillText("★", brick.x + brickConfig.width - 8, brick.y + 12);
            }
        }
    }
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        const type = powerUpTypes[powerUp.type];
        
        ctx.save();
        ctx.translate(powerUp.x, powerUp.y);
        ctx.rotate(powerUp.rotation);
        
        // Brilho ao redor
        ctx.shadowColor = type.color;
        ctx.shadowBlur = 10;
        
        // Corpo do power-up
        ctx.fillStyle = type.color;
        ctx.fillRect(-powerUp.size/2, -powerUp.size/2, powerUp.size, powerUp.size);
        
        // Símbolo
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.shadowBlur = 0;
        ctx.fillText(type.symbol, 0, 5);
        
        ctx.restore();
    });
}

function drawParticles() {
    particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawPauseScreen() {
    if (!gameState.paused) return;
    
    // Overlay semi-transparente
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Texto de pausa
    ctx.fillStyle = "#ffffff";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSADO", canvas.width/2, canvas.height/2 - 20);
    
    ctx.font = "18px Arial";
    ctx.fillText("Pressione ESPAÇO para continuar", canvas.width/2, canvas.height/2 + 30);
}

// ========== LOOP PRINCIPAL DO JOGO ==========
/* Esta é a função mais importante! É executada 60 vezes por segundo
    e coordena todas as atualizações e renderizações do jogo. */

function gameLoop() {
    if (!gameState.running) return;
    
    // Limpa a tela
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenha fundo
    drawBackground();
    
    if (!gameState.paused) {
        // Atualiza lógica do jogo
        updateMovement();
        updatePowerUps();
        updateParticles();
        updateActivePowerUps();
    }
    
    // Desenha todos os elementos
    drawBricks();
    
    // Desenha todas as bolas
    balls.forEach(ball => drawBall(ball));
    
    // Desenha paddles
    drawPaddle(paddle1);
    if (gameState.mode === "multiplayer") {
        drawPaddle(paddle2, true);
    }
    
    drawPowerUps();
    drawParticles();
    drawPauseScreen();
    
    // Continua o loop
    requestAnimationFrame(gameLoop);
}

// ========== EVENTOS DO NAVEGADOR ==========
/* Detecta quando controles são conectados/desconectados.
    Inclui tratamento seguro de erros de política de gamepad. */

function setupGamepadEvents() {
    if (!gamepadSupported) return;
    
    try {
        window.addEventListener("gamepadconnected", (e) => {
            console.log("🎮 Controle conectado:", e.gamepad.id);
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            console.log("🎮 Controle desconectado:", e.gamepad.id);
        });
    } catch (error) {
        console.log("⚠️ Não foi possível configurar eventos de gamepad");
    }
}

// ========== INICIALIZAÇÃO ==========
/* Código executado quando a página carrega.
    Inicializa o suporte a gamepad de forma segura. */

// Verifica suporte a gamepad na inicialização
checkGamepadSupport();
setupGamepadEvents();

console.log("🎮 Breakout Melhorado carregado!");
console.log("Recursos inclusos:");
console.log("- Múltiplos modos de jogo");
console.log("- Sistema de power-ups");
console.log("- Efeitos de partículas");
console.log("- Suporte a gamepad" + (gamepadSupported ? " ✅" : " ❌ (bloqueado)"));
console.log("- Níveis progressivos");
console.log("- Interface moderna");
console.log("");
console.log("🎯 Controles disponíveis:");
console.log("⌨️  Teclado: Setas ←→ ou A/D (Jogador 1)");
console.log("⌨️  Teclado: Q/E (Jogador 2 no multiplayer)");
console.log("⌨️  Especiais: ESPAÇO (pausar), R (reiniciar)");
if (gamepadSupported) {
    console.log("🎮 Gamepad: D-Pad ou analógico esquerdo");
}