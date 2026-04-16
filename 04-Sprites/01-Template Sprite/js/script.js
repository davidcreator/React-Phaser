window.onload = function() {
    // Obtém o canvas e o contexto de renderização 2D
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Define as dimensões do sprite e do canvas
    const spriteWidth = 100;
    const spriteHeight = 100;
    const CANVAS_WIDTH = canvas.width = 600;
    const CANVAS_HEIGHT = canvas.height = 600;

    // Carrega a imagem do sprite
    const playerImg = new Image();
    playerImg.src = 'images/Soldier.png';

    // Variáveis de controle da animação
    let frameX = 0; // Posição X do quadro atual
    let frameY = 0; // Posição Y do quadro atual (caso tenha múltiplas linhas de animação)
    let initFrame = 0; // Contador de frames
    const staggerFrame = 12; // Controla a velocidade da animação

    // Função para animar o sprite
    function animate() {
        // Limpa a área do canvas antes de desenhar
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Calcula a posição do quadro atual
        let position = Math.floor(initFrame / staggerFrame) % 4;
        frameX = spriteWidth * position;

        // Desenha o quadro atual do sprite na posição centralizada
        ctx.drawImage(
            playerImg,
            frameX, frameY * spriteHeight,
            spriteWidth, spriteHeight,
            (CANVAS_WIDTH - spriteWidth) / 2, (CANVAS_HEIGHT - spriteHeight) / 2, // Centraliza o sprite
            spriteWidth, spriteHeight
        );

        // Atualiza o contador de frames
        initFrame++;

        // Solicita a próxima frame de animação
        requestAnimationFrame(animate);
    }

    // Inicia a animação ao carregar a imagem
    playerImg.onload = function() {
        animate();
    };
};
