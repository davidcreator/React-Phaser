/**
 * JOGO DE DOMINÓ MELHORADO
 * Versão corrigida e aprimorada com melhorias na lógica e funcionalidades
 */

class DominoGameImproved {
    constructor() {
        // Elementos do DOM
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.movesElement = document.getElementById('moves');
        this.gamesPlayedElement = document.getElementById('gamesPlayed');

        // Configurações do canvas
        this.setupCanvas();

        // Configurações visuais
        this.PIECE_WIDTH = 60;
        this.PIECE_HEIGHT = 120;
        this.PIECE_SPACING = 10;
        this.DOT_RADIUS = 4;

        // Estado do jogo
        this.playerHand = [];
        this.opponentHand = [];
        this.board = [];
        this.stock = [];
        this.currentPlayer = 0; // 0 = jogador, 1 = oponente
        this.moves = 0;
        this.gamesPlayed = parseInt(localStorage.getItem('dominoGamesPlayed') || '0');
        this.playerWins = parseInt(localStorage.getItem('dominoPlayerWins') || '0');
        this.opponentWins = parseInt(localStorage.getItem('dominoOpponentWins') || '0');

        // Controle de drag and drop
        this.selectedPiece = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.mousePos = { x: 0, y: 0 };

        // Posições do tabuleiro
        this.boardStartX = this.canvas.width / 2;
        this.boardStartY = this.canvas.height / 2;
        this.boardLeftEnd = null;  // Extremidade esquerda do tabuleiro
        this.boardRightEnd = null; // Extremidade direita do tabuleiro

        // Estado do jogo
        this.gameOver = false;
        this.winner = null;

        // Inicialização
        this.generateDominoSet();
        this.bindEvents();
        this.startNewGame();
        this.gameLoop();
    }

    /**
     * CONFIGURAÇÃO DO CANVAS
     */
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        // Ajustar para dispositivos de alta resolução
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(dpr, dpr);
    }

    /**
     * GERAR CONJUNTO COMPLETO DE DOMINÓ (28 PEÇAS)
     */
    generateDominoSet() {
        this.allPieces = [];
        let id = 0;
        
        for (let i = 0; i <= 6; i++) {
            for (let j = i; j <= 6; j++) {
                this.allPieces.push({
                    id: id++,
                    left: i,
                    right: j,
                    x: 0,
                    y: 0,
                    rotation: 0,
                    isDouble: i === j,
                    sum: i + j
                });
            }
        }
    }

    /**
     * EMBARALHAR ARRAY
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * INICIAR NOVO JOGO
     */
    startNewGame() {
        // Reset do estado
        this.playerHand = [];
        this.opponentHand = [];
        this.board = [];
        this.stock = [...this.allPieces];
        this.moves = 0;
        this.gameOver = false;
        this.winner = null;
        this.selectedPiece = null;
        this.isDragging = false;

        // Embaralhar peças
        this.shuffleArray(this.stock);

        // Distribuir 7 peças para cada jogador
        for (let i = 0; i < 7; i++) {
            this.playerHand.push(this.stock.pop());
            this.opponentHand.push(this.stock.pop());
        }

        // Determinar quem começa (quem tem a maior dupla)
        this.determineFirstPlayer();

        // Atualizar posições das peças
        this.updatePiecePositions();
        this.updateInfoPanel();
    }

    /**
     * DETERMINAR PRIMEIRO JOGADOR
     */
    determineFirstPlayer() {
        const getHighestDouble = (hand) => {
            return hand.filter(p => p.isDouble).reduce((max, p) => 
                (!max || p.left > max.left) ? p : max, null);
        };

        const playerDouble = getHighestDouble(this.playerHand);
        const opponentDouble = getHighestDouble(this.opponentHand);

        if (playerDouble && (!opponentDouble || playerDouble.left > opponentDouble.left)) {
            this.currentPlayer = 0;
        } else if (opponentDouble) {
            this.currentPlayer = 1;
            // IA joga automaticamente se começar
            setTimeout(() => this.opponentTurn(), 1000);
        } else {
            // Ninguém tem dupla, jogador começa
            this.currentPlayer = 0;
        }
    }

    /**
     * ATUALIZAR POSIÇÕES DAS PEÇAS
     */
    updatePiecePositions() {
        // Posições da mão do jogador
        const playerStartX = 50;
        const playerY = this.canvas.height - this.PIECE_HEIGHT - 20;
        
        this.playerHand.forEach((piece, index) => {
            piece.x = playerStartX + index * (this.PIECE_WIDTH + this.PIECE_SPACING);
            piece.y = playerY;
            piece.rotation = 0;
        });

        // Posições da mão do oponente (apenas para referência visual)
        const opponentStartX = 50;
        const opponentY = 20;
        
        this.opponentHand.forEach((piece, index) => {
            piece.x = opponentStartX + index * (this.PIECE_WIDTH + this.PIECE_SPACING);
            piece.y = opponentY;
            piece.rotation = 0;
        });

        // Atualizar posições do tabuleiro
        this.updateBoardPositions();
    }

    /**
     * ATUALIZAR POSIÇÕES DO TABULEIRO
     */
    updateBoardPositions() {
        if (this.board.length === 0) return;

        const startX = this.boardStartX - (this.board.length * (this.PIECE_WIDTH + 5)) / 2;
        const boardY = this.canvas.height / 2 - this.PIECE_HEIGHT / 2;

        this.board.forEach((piece, index) => {
            piece.x = startX + index * (this.PIECE_WIDTH + 5);
            piece.y = boardY;
            piece.rotation = 0;
        });

        // Atualizar extremidades do tabuleiro
        if (this.board.length > 0) {
            this.boardLeftEnd = this.board[0].left;
            this.boardRightEnd = this.board[this.board.length - 1].right;
        }
    }

    /**
     * DESENHAR PEÇA DE DOMINÓ
     */
    drawPiece(piece, isHidden = false, isSelected = false, alpha = 1) {
        if (!piece) return;

        this.ctx.save();
        this.ctx.globalAlpha = alpha;

        const { x, y } = piece;

        if (isHidden) {
            // Desenhar verso da peça (oponente)
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(x, y, this.PIECE_WIDTH, this.PIECE_HEIGHT);
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, this.PIECE_WIDTH, this.PIECE_HEIGHT);
            
            // Padrão decorativo
            this.ctx.fillStyle = '#DAA520';
            this.ctx.fillRect(x + 5, y + 5, this.PIECE_WIDTH - 10, this.PIECE_HEIGHT - 10);
        } else {
            // Cor de fundo da peça
            this.ctx.fillStyle = isSelected ? '#FFD700' : '#F5F5DC';
            this.ctx.fillRect(x, y, this.PIECE_WIDTH, this.PIECE_HEIGHT);

            // Borda da peça
            this.ctx.strokeStyle = isSelected ? '#FF4500' : '#000';
            this.ctx.lineWidth = isSelected ? 3 : 2;
            this.ctx.strokeRect(x, y, this.PIECE_WIDTH, this.PIECE_HEIGHT);

            // Linha divisória
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + this.PIECE_HEIGHT / 2);
            this.ctx.lineTo(x + this.PIECE_WIDTH, y + this.PIECE_HEIGHT / 2);
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Desenhar pontos
            this.drawDots(x, y, piece.left, 'top');
            this.drawDots(x, y, piece.right, 'bottom');
        }

        this.ctx.restore();
    }

    /**
     * DESENHAR PONTOS DA PEÇA
     */
    drawDots(x, y, value, half) {
        const centerX = x + this.PIECE_WIDTH / 2;
        const centerY = half === 'top' ? 
            y + this.PIECE_HEIGHT / 4 : 
            y + (3 * this.PIECE_HEIGHT) / 4;

        this.ctx.fillStyle = '#000';

        // Padrões de pontos
        const patterns = {
            0: [],
            1: [[0, 0]],
            2: [[-1, -1], [1, 1]],
            3: [[-1, -1], [0, 0], [1, 1]],
            4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
            5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
            6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
        };

        const pattern = patterns[value] || [];
        const dotSpacing = 8;

        pattern.forEach(([dx, dy]) => {
            this.ctx.beginPath();
            this.ctx.arc(
                centerX + dx * dotSpacing,
                centerY + dy * dotSpacing,
                this.DOT_RADIUS,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
    }

    /**
     * RENDERIZAR JOGO
     */
    render() {
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Desenhar fundo da mesa
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Desenhar tabuleiro
        if (this.board.length === 0) {
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                'Clique e arraste uma peça para o centro para começar',
                this.canvas.width / 2,
                this.canvas.height / 2
            );
        } else {
            this.board.forEach(piece => this.drawPiece(piece));
        }

        // Desenhar mão do oponente (peças ocultas)
        this.opponentHand.forEach(piece => this.drawPiece(piece, true));

        // Desenhar mão do jogador
        this.playerHand.forEach(piece => {
            const isSelected = this.selectedPiece === piece;
            this.drawPiece(piece, false, isSelected);
        });

        // Desenhar peça sendo arrastada
        if (this.isDragging && this.selectedPiece) {
            const dragPiece = {
                ...this.selectedPiece,
                x: this.mousePos.x - this.dragOffset.x,
                y: this.mousePos.y - this.dragOffset.y
            };
            this.drawPiece(dragPiece, false, true, 0.8);
        }

        // Indicadores de zona de drop
        if (this.selectedPiece && this.board.length > 0) {
            this.drawDropZones();
        }

        // Desenhar informações do jogo
        this.drawGameInfo();
    }

    /**
     * DESENHAR ZONAS DE DROP
     */
    drawDropZones() {
        if (this.board.length === 0) return;

        const firstPiece = this.board[0];
        const lastPiece = this.board[this.board.length - 1];

        // Verificar se pode jogar na esquerda
        if (this.canPlayPiece(this.selectedPiece, 'left')) {
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            this.ctx.fillRect(firstPiece.x - 30, firstPiece.y - 10, 25, this.PIECE_HEIGHT + 20);
        }

        // Verificar se pode jogar na direita
        if (this.canPlayPiece(this.selectedPiece, 'right')) {
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            this.ctx.fillRect(lastPiece.x + this.PIECE_WIDTH + 5, lastPiece.y - 10, 25, this.PIECE_HEIGHT + 20);
        }
    }

    /**
     * DESENHAR INFORMAÇÕES DO JOGO
     */
    drawGameInfo() {
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';

        // Informações do jogador atual
        const playerText = this.currentPlayer === 0 ? 'Sua vez' : 'Vez do oponente';
        this.ctx.fillText(playerText, 10, this.canvas.height / 2);

        // Contador de peças
        this.ctx.fillText(`Suas peças: ${this.playerHand.length}`, 10, this.canvas.height / 2 + 25);
        this.ctx.fillText(`Oponente: ${this.opponentHand.length}`, 10, this.canvas.height / 2 + 50);
        this.ctx.fillText(`Estoque: ${this.stock.length}`, 10, this.canvas.height / 2 + 75);

        // Estado do jogo
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                this.winner === 0 ? 'Você venceu!' : this.winner === 1 ? 'Oponente venceu!' : 'Empate!',
                this.canvas.width / 2,
                this.canvas.height / 2
            );
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Clique para jogar novamente', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }

    /**
     * VERIFICAR SE PODE JOGAR UMA PEÇA
     */
    canPlayPiece(piece, side) {
        if (this.board.length === 0) return true;

        const targetValue = side === 'left' ? this.boardLeftEnd : this.boardRightEnd;
        return piece.left === targetValue || piece.right === targetValue;
    }

    /**
     * JOGAR UMA PEÇA
     */
    playPiece(piece, side) {
        if (!this.canPlayPiece(piece, side)) return false;

        const playedPiece = { ...piece };

        if (this.board.length === 0) {
            // Primeira peça
            this.board.push(playedPiece);
            this.boardLeftEnd = playedPiece.left;
            this.boardRightEnd = playedPiece.right;
        } else {
            const targetValue = side === 'left' ? this.boardLeftEnd : this.boardRightEnd;
            
            // Ajustar orientação da peça se necessário
            if (playedPiece.right === targetValue && side === 'left') {
                [playedPiece.left, playedPiece.right] = [playedPiece.right, playedPiece.left];
            } else if (playedPiece.left === targetValue && side === 'right') {
                [playedPiece.left, playedPiece.right] = [playedPiece.right, playedPiece.left];
            }

            if (side === 'left') {
                this.board.unshift(playedPiece);
                this.boardLeftEnd = playedPiece.left;
            } else {
                this.board.push(playedPiece);
                this.boardRightEnd = playedPiece.right;
            }
        }

        // Remover peça da mão do jogador atual
        const currentHand = this.currentPlayer === 0 ? this.playerHand : this.opponentHand;
        const pieceIndex = currentHand.findIndex(p => p.id === piece.id);
        if (pieceIndex !== -1) {
            currentHand.splice(pieceIndex, 1);
        }

        this.moves++;
        this.updateBoardPositions();
        this.checkWinCondition();

        return true;
    }

    /**
     * VERIFICAR CONDIÇÃO DE VITÓRIA
     */
    checkWinCondition() {
        if (this.playerHand.length === 0) {
            this.endGame(0);
        } else if (this.opponentHand.length === 0) {
            this.endGame(1);
        } else if (this.isGameBlocked()) {
            // Jogo travado - ganha quem tem menor soma
            const playerSum = this.playerHand.reduce((sum, p) => sum + p.sum, 0);
            const opponentSum = this.opponentHand.reduce((sum, p) => sum + p.sum, 0);
            
            if (playerSum < opponentSum) {
                this.endGame(0);
            } else if (opponentSum < playerSum) {
                this.endGame(1);
            } else {
                this.endGame(null); // Empate
            }
        }
    }

    /**
     * VERIFICAR SE O JOGO ESTÁ TRAVADO
     */
    isGameBlocked() {
        const canPlayerPlay = this.playerHand.some(piece => 
            this.canPlayPiece(piece, 'left') || this.canPlayPiece(piece, 'right')
        );
        const canOpponentPlay = this.opponentHand.some(piece => 
            this.canPlayPiece(piece, 'left') || this.canPlayPiece(piece, 'right')
        );
        
        return !canPlayerPlay && !canOpponentPlay && this.stock.length === 0;
    }

    /**
     * FINALIZAR JOGO
     */
    endGame(winner) {
        this.gameOver = true;
        this.winner = winner;
        this.gamesPlayed++;
        
        if (winner === 0) {
            this.playerWins++;
        } else if (winner === 1) {
            this.opponentWins++;
        }

        // Salvar estatísticas
        localStorage.setItem('dominoGamesPlayed', this.gamesPlayed.toString());
        localStorage.setItem('dominoPlayerWins', this.playerWins.toString());
        localStorage.setItem('dominoOpponentWins', this.opponentWins.toString());

        this.updateInfoPanel();
    }

    /**
     * TURNO DO OPONENTE (IA SIMPLES)
     */
    opponentTurn() {
        if (this.gameOver || this.currentPlayer !== 1) return;

        // Tentar jogar uma peça
        let played = false;
        
        for (const piece of this.opponentHand) {
            if (this.canPlayPiece(piece, 'left')) {
                this.playPiece(piece, 'left');
                played = true;
                break;
            } else if (this.canPlayPiece(piece, 'right')) {
                this.playPiece(piece, 'right');
                played = true;
                break;
            }
        }

        // Se não conseguiu jogar, compra do estoque
        if (!played && this.stock.length > 0) {
            this.opponentHand.push(this.stock.pop());
            this.updatePiecePositions();
        }

        // Passar turno para o jogador
        if (!this.gameOver) {
            this.currentPlayer = 0;
            this.updateInfoPanel();
        }
    }

    /**
     * COMPRAR DO ESTOQUE
     */
    buyFromStock() {
        if (this.stock.length > 0 && this.currentPlayer === 0) {
            this.playerHand.push(this.stock.pop());
            this.updatePiecePositions();
            this.updateInfoPanel();
        }
    }

    /**
     * PASSAR TURNO
     */
    passTurn() {
        if (this.gameOver) return;
        
        this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
        this.updateInfoPanel();
        
        if (this.currentPlayer === 1) {
            setTimeout(() => this.opponentTurn(), 1000);
        }
    }

    /**
     * ATUALIZAR PAINEL DE INFORMAÇÕES
     */
    updateInfoPanel() {
        if (this.movesElement) {
            this.movesElement.textContent = `Movimentos: ${this.moves}`;
        }
        if (this.gamesPlayedElement) {
            this.gamesPlayedElement.textContent = `Partidas: ${this.gamesPlayed} (V: ${this.playerWins} D: ${this.opponentWins})`;
        }
    }

    /**
     * OBTER POSIÇÃO DO MOUSE RELATIVA AO CANVAS
     */
    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (event.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    /**
     * VERIFICAR CLIQUE EM PEÇA
     */
    getPieceAt(x, y, pieces) {
        return pieces.find(piece => 
            x >= piece.x && x <= piece.x + this.PIECE_WIDTH &&
            y >= piece.y && y <= piece.y + this.PIECE_HEIGHT
        );
    }

    /**
     * VINCULAR EVENTOS
     */
    bindEvents() {
        // Mouse down
        this.canvas.addEventListener('mousedown', (event) => {
            if (this.gameOver) {
                this.startNewGame();
                return;
            }

            if (this.currentPlayer !== 0) return;

            const pos = this.getMousePos(event);
            const piece = this.getPieceAt(pos.x, pos.y, this.playerHand);

            if (piece) {
                this.selectedPiece = piece;
                this.isDragging = true;
                this.dragOffset = {
                    x: pos.x - piece.x,
                    y: pos.y - piece.y
                };
                this.mousePos = pos;
            }
        });

        // Mouse move
        this.canvas.addEventListener('mousemove', (event) => {
            this.mousePos = this.getMousePos(event);
            
            if (this.isDragging) {
                event.preventDefault();
            }
        });

        // Mouse up
        this.canvas.addEventListener('mouseup', (event) => {
            if (!this.isDragging || !this.selectedPiece) return;

            const pos = this.getMousePos(event);
            let played = false;

            if (this.board.length === 0) {
                // Primeira jogada - qualquer lugar no centro
                if (pos.x > this.canvas.width / 4 && pos.x < 3 * this.canvas.width / 4 &&
                    pos.y > this.canvas.height / 4 && pos.y < 3 * this.canvas.height / 4) {
                    played = this.playPiece(this.selectedPiece, 'left');
                }
            } else {
                const firstPiece = this.board[0];
                const lastPiece = this.board[this.board.length - 1];

                // Verificar drop na esquerda
                if (pos.x < firstPiece.x && this.canPlayPiece(this.selectedPiece, 'left')) {
                    played = this.playPiece(this.selectedPiece, 'left');
                }
                // Verificar drop na direita
                else if (pos.x > lastPiece.x + this.PIECE_WIDTH && this.canPlayPiece(this.selectedPiece, 'right')) {
                    played = this.playPiece(this.selectedPiece, 'right');
                }
            }

            if (played) {
                this.currentPlayer = 1;
                this.updatePiecePositions();
                setTimeout(() => this.opponentTurn(), 1000);
            }

            this.selectedPiece = null;
            this.isDragging = false;
        });

        // Double click para comprar do estoque
        this.canvas.addEventListener('dblclick', (event) => {
            if (this.currentPlayer === 0 && !this.gameOver) {
                this.buyFromStock();
            }
        });

        // Teclas de atalho
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case ' ': // Espaço para passar vez
                    event.preventDefault();
                    this.passTurn();
                    break;
                case 'b': // B para comprar
                case 'B':
                    this.buyFromStock();
                    break;
                case 'n': // N para novo jogo
                case 'N':
                    this.startNewGame();
                    break;
            }
        });

        // Redimensionamento da janela
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.updatePiecePositions();
        });
    }

    /**
     * LOOP PRINCIPAL DO JOGO
     */
    gameLoop() {
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Inicialização quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    const game = new DominoGameImproved();
    
    // Disponibilizar globalmente para debug
    window.dominoGame = game;
    
    console.log('🎲 Dominó Melhorado carregado!');
    console.log('💡 Controles:');
    console.log('   - Arraste peças para jogar');
    console.log('   - Duplo clique para comprar do estoque');
    console.log('   - Espaço: passar vez');
    console.log('   - B: comprar do estoque');
    console.log('   - N: novo jogo');
});