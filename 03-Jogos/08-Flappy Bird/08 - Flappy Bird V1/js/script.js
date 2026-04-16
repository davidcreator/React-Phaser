// Seleciona o canvas e define o contexto 2D
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Define a largura e altura do canvas
canvas.width = 320;
canvas.height = 480;

// Variáveis do jogo
let bird = { x: 50, y: 150, width: 20, height: 20, gravity: 1.5, lift: -15, velocity: 0 };
let pipes = [];
let score = 0;
let lives = 3;
let gameOver = false;
let pipeSpeed = 2; // Velocidade inicial dos canos

// Adiciona o primeiro cano
pipes.push({ x: canvas.width, y: 0 });

// Função para desenhar o jogo
function draw() {
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha o pássaro
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // Desenha os canos
    for (let i = 0; i < pipes.length; i++) {
        let pipe = pipes[i];
        let gap = 85;
        ctx.fillStyle = 'green';
        ctx.fillRect(pipe.x, pipe.y, 30, 200);
        ctx.fillRect(pipe.x, pipe.y + 200 + gap, 30, canvas.height);

        // Move os canos para a esquerda
        pipe.x -= pipeSpeed;

        // Adiciona novos canos
        if (pipe.x === 125) {
            pipes.push({ x: canvas.width, y: Math.floor(Math.random() * 200) - 200 });
        }

        // Detecta colisão
        if (bird.x + bird.width >= pipe.x && bird.x <= pipe.x + 30 &&
            (bird.y <= pipe.y + 200 || bird.y + bird.height >= pipe.y + 200 + gap) ||
            bird.y + bird.height >= canvas.height) {
            lives--;
            document.getElementById('lives').innerText = `Vidas: ${lives}`;
            if (lives === 0) {
                gameOver = true;
            }
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
