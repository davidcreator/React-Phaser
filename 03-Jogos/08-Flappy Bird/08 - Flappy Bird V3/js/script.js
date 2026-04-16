// Seleciona o canvas e define o contexto 2D
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Define a largura e altura do canvas
canvas.width = 320;
canvas.height = 480;

// Carrega as imagens
const birdImg = new Image();
birdImg.src = './images/bird.png'; // Adicione a imagem do pássaro
const bgImg = new Image();
bgImg.src = './images/background.png'; // Adicione a imagem de fundo
const pipeNorthImg = new Image();
pipeNorthImg.src = './images/pipeNorth.png'; // Adicione a imagem do cano superior
const pipeSouthImg = new Image();
pipeSouthImg.src = './images/pipeSouth.png'; // Adicione a imagem do cano inferior

// Variáveis do jogo
let bird = { x: 15, y: 160, width: 20, height: 20, gravity: 1.2, lift: -15, velocity: 0 };
let pipes = [];
let score = 0;
let gameOver = false;
let pipeSpeed = 2; // Velocidade inicial dos canos

// Adiciona o primeiro cano
pipes.push({ x: canvas.width, y: 0 });

// Função para desenhar o jogo
function draw() {
    // Desenha o fundo
    ctx.drawImage(bgImg, 0, 0);

    // Desenha o pássaro
    ctx.drawImage(birdImg, bird.x, bird.y);

    // Desenha os canos
    for (let i = 0; i < pipes.length; i++) {
        let pipe = pipes[i];
        let gap = 90;
        ctx.drawImage(pipeNorthImg, pipe.x, pipe.y);
        ctx.drawImage(pipeSouthImg, pipe.x, pipe.y + pipeNorthImg.height + gap);

        // Move os canos para a esquerda
        pipe.x -= pipeSpeed;

        // Adiciona novos canos
        if (pipe.x === 125) {
            pipes.push({ x: canvas.width, y: Math.floor(Math.random() * pipeNorthImg.height) - pipeNorthImg.height });
        }

        // Detecta colisão
        if (bird.x + bird.width >= pipe.x && bird.x <= pipe.x + pipeNorthImg.width &&
            (bird.y <= pipe.y + pipeNorthImg.height || bird.y + bird.height >= pipe.y + pipeNorthImg.height + gap) ||
            bird.y + bird.height >= canvas.height) {
            gameOver = true;
        }

        // Incrementa a pontuação
        if (pipe.x === 5) {
            score++;
            document.getElementById('score').innerText = `Score: ${score}`;

            // Aumenta a velocidade dos canos a cada 10 pontos
            if (score % 10 === 0) {
                pipeSpeed += 0.5;
            }
        }
    }

    // Aplica gravidade ao pássaro
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // Verifica se o jogo acabou
    if (!gameOver) {
        requestAnimationFrame(draw);
    } else {
        alert('Game Over! Score: ' + score);
        document.location.reload();
    }
}

// Função para fazer o pássaro pular
document.addEventListener('keydown', function (e) {
    if (e.key === ' ') {
        bird.velocity = bird.lift;
    }
});

// Inicia o jogo
draw();
