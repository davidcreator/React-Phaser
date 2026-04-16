// script.js - Campo Minado Completo
class MinesweeperGame {
    constructor() {
        this.initializeElements();
        this.initializeSettings();
        this.initializeStats();
        this.setupEventListeners();
        this.showScreen('menuScreen');
        this.loadBestTimes();
        
        console.log('🎮 Campo Minado inicializado com sucesso!');
        console.log('📊 Dificuldades disponíveis:', this.difficulties);
    }
    
    initializeElements() {
        // Canvas e contexto
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Elementos de UI
        this.elements = {
            mineCount: document.getElementById('mineCount'),
            timer: document.getElementById('timer'),
            score: document.getElementById('score'),
            streak: document.getElementById('streak'),
            statusMessage: document.getElementById('statusMessage'),
            progressFill: document.getElementById('progressFill'),
            gameOverlay: document.getElementById('gameOverlay'),
            overlayTitle: document.getElementById('overlayTitle'),
            overlayMessage: document.getElementById('overlayMessage')
        };
        
        // Configurações padrão
        this.settings = {
            theme: 'default',
            sound: true,
            music: true,
            animations: true,
            hints: true,
            autoFlag: false,
            cellSize: 35
        };
        
        // Dificuldades expandidas
        this.difficulties = {
            beginner: { rows: 9, cols: 9, mines: 10, name: 'Iniciante' },
            intermediate: { rows: 16, cols: 16, mines: 40, name: 'Intermediário' },
            expert: { rows: 16, cols: 30, mines: 99, name: 'Especialista' },
            custom: { rows: 12, cols: 12, mines: 20, name: 'Personalizado' }
        };
        
        // Estado do jogo
        this.resetGameState();
    }
    
    initializeSettings() {
        // Carregar configurações salvas
        const savedSettings = localStorage.getItem('minesweeper_settings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        
        // Aplicar configurações na UI
        this.applySettingsToUI();
    }
    
    initializeStats() {
        // Carregar estatísticas
        const savedStats = localStorage.getItem('minesweeper_stats');
        this.stats = savedStats ? JSON.parse(savedStats) : {
            totalWins: 0,
            totalLosses: 0,
            totalTime: 0,
            gamesPlayed: 0,
            bestTimes: {
                beginner: null,
                intermediate: null,
                expert: null
            },
            winStreak: 0,
            currentStreak: 0
        };
    }
    
    resetGameState() {
        this.gameState = 'ready';
        this.currentDifficulty = 'beginner';
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.startTime = null;
        this.timer = 0;
        this.timerInterval = null;
        this.score = 0;
        this.firstClick = true;
        this.isPaused = false;
        this.hintsUsed = 0;
        this.revealedCount = 0;
    }
    
    setupEventListeners() {
        // Menu navigation
        document.getElementById('playBtn').addEventListener('click', () => this.showScreen('difficultyScreen'));
        document.getElementById('settingsBtn').addEventListener('click', () => this.showScreen('settingsScreen'));
        document.getElementById('statsBtn').addEventListener('click', () => {
            this.updateStatsDisplay();
            this.showScreen('statsScreen');
        });
        document.getElementById('helpBtn').addEventListener('click', () => this.showScreen('helpScreen'));
        document.getElementById('creditsBtn').addEventListener('click', () => this.showScreen('creditsScreen'));
        
        // Back buttons
        document.getElementById('backFromDifficulty').addEventListener('click', () => this.showScreen('menuScreen'));
        document.getElementById('backFromSettings').addEventListener('click', () => this.showScreen('menuScreen'));
        document.getElementById('backFromStats').addEventListener('click', () => this.showScreen('menuScreen'));
        document.getElementById('backFromHelp').addEventListener('click', () => this.showScreen('menuScreen'));
        document.getElementById('backFromCredits').addEventListener('click', () => this.showScreen('menuScreen'));
        document.getElementById('backToMenu').addEventListener('click', () => this.showScreen('menuScreen'));
        
        // Difficulty selection
        document.querySelectorAll('.difficulty-card').forEach(card => {
            card.addEventListener('click', (e) => this.selectDifficulty(e.currentTarget.dataset.difficulty));
        });
        
        // Game controls
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('hintBtn').addEventListener('click', () => this.giveHint());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        
        // Settings
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeTheme(e.target.dataset.theme));
        });
        
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.settings.sound = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('musicToggle').addEventListener('change', (e) => {
            this.settings.music = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('animationsToggle').addEventListener('change', (e) => {
            this.settings.animations = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('hintsToggle').addEventListener('change', (e) => {
            this.settings.hints = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('autoFlagToggle').addEventListener('change', (e) => {
            this.settings.autoFlag = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('cellSizeSlider').addEventListener('input', (e) => {
            this.settings.cellSize = parseInt(e.target.value);
            document.getElementById('cellSizeValue').textContent = e.target.value + 'px';
            this.saveSettings();
            if (this.gameState !== 'ready') {
                this.resizeCanvas();
                this.draw();
            }
        });
        
        document.getElementById('resetStatsBtn').addEventListener('click', () => this.resetStats());
        
        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameState === 'playing') {
                e.preventDefault();
                this.togglePause();
            }
        });
        
        // Custom difficulty inputs
        const customInputs = ['customRows', 'customCols', 'customMines'];
        customInputs.forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.validateCustomSettings());
        });
    }
    
    showScreen(screenId) {
        console.log(`Mudando para tela: ${screenId}`);
        
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        
        if (screenId === 'gameScreen') {
            // Sempre inicializar um novo jogo quando mostrar a tela do jogo
            setTimeout(() => {
                this.initGame();
            }, 100); // Pequeno delay para garantir que a tela foi renderizada
        }
    }
    
    selectDifficulty(difficulty) {
        console.log(`Selecionando dificuldade: ${difficulty}`);
        
        this.currentDifficulty = difficulty;
        
        if (difficulty === 'custom') {
            const rows = parseInt(document.getElementById('customRows').value) || 12;
            const cols = parseInt(document.getElementById('customCols').value) || 12;
            const mines = parseInt(document.getElementById('customMines').value) || 20;
            
            // Validar valores personalizados
            const maxMines = Math.floor((rows * cols) * 0.8);
            const validatedMines = Math.min(mines, maxMines);
            
            this.difficulties.custom = {
                rows: Math.max(5, Math.min(rows, 30)),
                cols: Math.max(5, Math.min(cols, 30)), 
                mines: Math.max(1, validatedMines),
                name: 'Personalizado'
            };
            
            console.log(`Configuração personalizada: ${this.difficulties.custom.rows}x${this.difficulties.custom.cols} com ${this.difficulties.custom.mines} minas`);
        }
        
        // Forçar reset completo do estado do jogo
        this.stopTimer();
        this.resetGameState();
        
        this.showScreen('gameScreen');
    }
    
    validateCustomSettings() {
        const rows = parseInt(document.getElementById('customRows').value) || 12;
        const cols = parseInt(document.getElementById('customCols').value) || 12;
        const mines = parseInt(document.getElementById('customMines').value) || 20;
        
        const maxMines = Math.floor((rows * cols) * 0.8);
        if (mines > maxMines) {
            document.getElementById('customMines').value = maxMines;
        }
    }
    
    initGame() {
        this.resetGameState();
        
        const config = this.difficulties[this.currentDifficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.mines = config.mines;
        
        // Ajustar cellSize baseado na dificuldade se necessário
        this.adjustCellSizeForDifficulty();
        
        this.resizeCanvas();
        this.initializeBoard();
        this.updateUI();
        this.draw();
        this.updateStatus(`🎮 ${config.name} - Clique para começar! Use dicas se precisar.`);
        
        console.log(`Jogo iniciado: ${config.name} - ${this.rows}x${this.cols} com ${this.mines} minas`);
    }
    
    adjustCellSizeForDifficulty() {
        // Ajustar tamanho da célula baseado na dificuldade para melhor visualização
        const maxViewportWidth = Math.min(window.innerWidth - 150, 900);
        const maxViewportHeight = Math.min(window.innerHeight - 400, 700);
        
        const optimalCellSizeW = Math.floor(maxViewportWidth / this.cols);
        const optimalCellSizeH = Math.floor(maxViewportHeight / this.rows);
        const optimalCellSize = Math.min(optimalCellSizeW, optimalCellSizeH);
        
        // Definir limites mínimos e máximos
        const minCellSize = 15;
        const maxCellSize = 50;
        
        // Se o tamanho atual não é adequado para a dificuldade, ajustar
        if (this.currentDifficulty === 'expert' && this.settings.cellSize > 25) {
            this.settings.cellSize = Math.max(Math.min(optimalCellSize, 25), minCellSize);
        } else if (this.currentDifficulty === 'intermediate' && this.settings.cellSize > 35) {
            this.settings.cellSize = Math.max(Math.min(optimalCellSize, 35), minCellSize);
        } else if (this.currentDifficulty === 'beginner' && this.settings.cellSize < 30) {
            this.settings.cellSize = Math.max(Math.min(optimalCellSize, maxCellSize), 30);
        } else if (this.currentDifficulty === 'custom') {
            this.settings.cellSize = Math.max(Math.min(optimalCellSize, maxCellSize), minCellSize);
        }
        
        // Atualizar o slider nas configurações
        const slider = document.getElementById('cellSizeSlider');
        const valueDisplay = document.getElementById('cellSizeValue');
        if (slider && valueDisplay) {
            slider.value = this.settings.cellSize;
            valueDisplay.textContent = this.settings.cellSize + 'px';
        }
    }
    
    resizeCanvas() {
        const cellSize = this.settings.cellSize;
        this.canvas.width = this.cols * cellSize;
        this.canvas.height = this.rows * cellSize;
        
        // Limpar estilos anteriores
        this.canvas.style.width = '';
        this.canvas.style.height = '';
        
        // Responsividade melhorada
        const maxWidth = Math.min(window.innerWidth - 100, 900);
        const maxHeight = Math.min(window.innerHeight - 350, 700);
        
        let scaleApplied = false;
        
        if (this.canvas.width > maxWidth || this.canvas.height > maxHeight) {
            const scaleX = maxWidth / this.canvas.width;
            const scaleY = maxHeight / this.canvas.height;
            const scale = Math.min(scaleX, scaleY);
            
            this.canvas.style.width = (this.canvas.width * scale) + 'px';
            this.canvas.style.height = (this.canvas.height * scale) + 'px';
            scaleApplied = true;
        }
        
        if (!scaleApplied) {
            this.canvas.style.width = this.canvas.width + 'px';
            this.canvas.style.height = this.canvas.height + 'px';
        }
        
        console.log(`Canvas redimensionado: ${this.canvas.width}x${this.canvas.height} (${this.rows}x${this.cols})`);
    }
    
    initializeBoard() {
        console.log(`Inicializando tabuleiro: ${this.rows}x${this.cols} com ${this.mines} minas`);
        
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        this.revealed = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
        this.flagged = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
        this.revealedCount = 0;
        
        console.log(`Tabuleiro inicializado com dimensões: ${this.board.length}x${this.board[0].length}`);
    }
    
    placeMines(avoidRow, avoidCol) {
        console.log(`Colocando ${this.mines} minas no tabuleiro ${this.rows}x${this.cols}, evitando (${avoidRow}, ${avoidCol})`);
        
        let minesPlaced = 0;
        const avoid = new Set();
        
        // Evitar célula clicada e suas adjacentes
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = avoidRow + dr;
                const c = avoidCol + dc;
                if (this.isValidCell(r, c)) {
                    avoid.add(`${r},${c}`);
                }
            }
        }
        
        console.log(`Evitando ${avoid.size} células ao redor da primeira clicada`);
        
        // Colocar minas aleatoriamente
        let attempts = 0;
        const maxAttempts = this.rows * this.cols * 2; // Prevenir loop infinito
        
        while (minesPlaced < this.mines && attempts < maxAttempts) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            attempts++;
            
            if (avoid.has(`${row},${col}`) || this.board[row][col] === -1) {
                continue;
            }
            
            this.board[row][col] = -1;
            minesPlaced++;
        }
        
        console.log(`${minesPlaced} minas colocadas com sucesso após ${attempts} tentativas`);
        
        // Calcular números
        this.calculateNumbers();
    }
    
    calculateNumbers() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] !== -1) {
                    this.board[row][col] = this.countAdjacentMines(row, col);
                }
            }
        }
    }
    
    countAdjacentMines(row, col) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = row + dr;
                const c = col + dc;
                if (this.isValidCell(r, c) && this.board[r][c] === -1) {
                    count++;
                }
            }
        }
        return count;
    }
    
    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
    
    getCellFromEvent(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const col = Math.floor(x / this.settings.cellSize);
        const row = Math.floor(y / this.settings.cellSize);
        
        return { row, col };
    }
    
    handleClick(e) {
        if (this.gameState === 'won' || this.gameState === 'lost' || this.isPaused) return;
        
        const { row, col } = this.getCellFromEvent(e);
        
        if (!this.isValidCell(row, col) || this.flagged[row][col] || this.revealed[row][col]) {
            return;
        }
        
        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
            this.gameState = 'playing';
            this.updateStatus('🎯 Jogo iniciado! Cuidado com as minas!');
        }
        
        this.revealCell(row, col);
        this.playSound('click');
    }
    
    handleRightClick(e) {
        if (this.gameState === 'won' || this.gameState === 'lost' || this.isPaused) return;
        
        const { row, col } = this.getCellFromEvent(e);
        
        if (!this.isValidCell(row, col) || this.revealed[row][col]) {
            return;
        }
        
        this.flagged[row][col] = !this.flagged[row][col];
        this.updateUI();
        this.draw();
        this.playSound('flag');
        
        if (this.settings.autoFlag) {
            this.checkAutoReveal();
        }
    }
    
    handleDoubleClick(e) {
        if (this.gameState !== 'playing' || this.isPaused) return;
        
        const { row, col } = this.getCellFromEvent(e);
        
        if (!this.isValidCell(row, col) || !this.revealed[row][col] || this.board[row][col] <= 0) {
            return;
        }
        
        // Contar bandeiras adjacentes
        let flagCount = 0;
        const adjacent = [];
        
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = row + dr;
                const c = col + dc;
                if (this.isValidCell(r, c)) {
                    if (this.flagged[r][c]) flagCount++;
                    else if (!this.revealed[r][c]) adjacent.push([r, c]);
                }
            }
        }
        
        // Se número de bandeiras == número da célula, revelar adjacentes
        if (flagCount === this.board[row][col]) {
            adjacent.forEach(([r, c]) => this.revealCell(r, c));
        }
    }
    
    revealCell(row, col) {
        if (this.revealed[row][col] || this.flagged[row][col]) return;
        
        this.revealed[row][col] = true;
        this.revealedCount++;
        this.score += 10;
        
        if (this.board[row][col] === -1) {
            this.gameOver(false);
            return;
        }
        
        if (this.board[row][col] === 0) {
            // Revelar células adjacentes automaticamente
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const r = row + dr;
                    const c = col + dc;
                    if (this.isValidCell(r, c)) {
                        this.revealCell(r, c);
                    }
                }
            }
        }
        
        this.updateUI();
        this.updateProgress();
        this.draw();
        this.checkWin();
    }
    
    checkWin() {
        const totalCells = this.rows * this.cols;
        if (this.revealedCount === totalCells - this.mines) {
            this.gameOver(true);
        }
    }
    
    gameOver(won) {
        this.gameState = won ? 'won' : 'lost';
        this.stopTimer();
        
        if (won) {
            this.handleWin();
        } else {
            this.handleLoss();
            this.revealAllMines();
        }
        
        this.updateStats(won);
        this.updateUI();
        this.draw();
        
        setTimeout(() => {
            this.showGameOverOverlay(won);
        }, 1000);
    }
    
    handleWin() {
        const timeBonus = Math.max(1000 - this.timer, 100);
        const difficultyBonus = this.getDifficultyBonus();
        const hintPenalty = this.hintsUsed * 50;
        
        this.score += timeBonus + difficultyBonus - hintPenalty;
        this.stats.currentStreak++;
        this.stats.winStreak = Math.max(this.stats.winStreak, this.stats.currentStreak);
        
        this.updateStatus('🎉 Parabéns! Você venceu! 🎉');
        this.playSound('win');
        this.checkBestTime();
    }
    
    handleLoss() {
        this.stats.currentStreak = 0;
        this.updateStatus('💥 Boom! Você perdeu! Tente novamente.');
        this.playSound('lose');
    }
    
    revealAllMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] === -1) {
                    this.revealed[row][col] = true;
                }
            }
        }
    }
    
    getDifficultyBonus() {
        const bonuses = {
            beginner: 100,
            intermediate: 300,
            expert: 500,
            custom: 200
        };
        return bonuses[this.currentDifficulty] || 100;
    }
    
    checkBestTime() {
        if (this.currentDifficulty === 'custom') return;
        
        const currentBest = this.stats.bestTimes[this.currentDifficulty];
        if (!currentBest || this.timer < currentBest) {
            this.stats.bestTimes[this.currentDifficulty] = this.timer;
            this.saveBestTime(this.currentDifficulty, this.timer);
            this.updateStatus('🏆 Novo recorde pessoal! 🏆');
        }
    }
    
    saveBestTime(difficulty, time) {
        const bestTimes = JSON.parse(localStorage.getItem('minesweeper_best_times') || '{}');
        bestTimes[difficulty] = time;
        localStorage.setItem('minesweeper_best_times', JSON.stringify(bestTimes));
        this.loadBestTimes();
    }
    
    loadBestTimes() {
        const bestTimes = JSON.parse(localStorage.getItem('minesweeper_best_times') || '{}');
        
        Object.keys(bestTimes).forEach(difficulty => {
            const time = bestTimes[difficulty];
            const timeStr = this.formatTime(time);
            
            // Atualizar na seleção de dificuldade
            const element = document.getElementById(`bestTime${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`);
            if (element) {
                element.textContent = `Melhor: ${timeStr}`;
            }
            
            // Atualizar nas estatísticas
            const displayElement = document.getElementById(`bestTimeDisplay${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`);
            if (displayElement) {
                displayElement.textContent = timeStr;
            }
        });
    }
    
    showGameOverOverlay(won) {
        const overlay = this.elements.gameOverlay;
        const title = this.elements.overlayTitle;
        const message = this.elements.overlayMessage;
        
        if (won) {
            title.textContent = '🎉 Vitória!';
            message.innerHTML = `
                Tempo: ${this.formatTime(this.timer)}<br>
                Pontuação: ${this.score}<br>
                Sequência: ${this.stats.currentStreak}
            `;
            overlay.classList.add('success');
        } else {
            title.textContent = '💥 Game Over';
            message.innerHTML = `
                Tempo: ${this.formatTime(this.timer)}<br>
                Células reveladas: ${this.revealedCount}/${this.rows * this.cols - this.mines}<br>
                Tente novamente!
            `;
            overlay.classList.add('danger');
        }
        
        overlay.classList.remove('hidden');
        
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.classList.remove('success', 'danger');
        }, 4000);
    }
    
    giveHint() {
        if (!this.settings.hints || this.gameState !== 'playing' || this.isPaused) return;
        
        this.hintsUsed++;
        this.score = Math.max(0, this.score - 25); // Penalidade por dica
        
        // Encontrar uma célula segura para revelar
        const safeCells = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.revealed[row][col] && !this.flagged[row][col] && this.board[row][col] !== -1) {
                    safeCells.push([row, col]);
                }
            }
        }
        
        if (safeCells.length > 0) {
            const [row, col] = safeCells[Math.floor(Math.random() * safeCells.length)];
            this.highlightCell(row, col);
            this.updateStatus(`💡 Dica: Célula segura destacada! (-25 pontos)`);
            this.playSound('hint');
        } else {
            this.updateStatus('💡 Nenhuma dica disponível no momento.');
        }
        
        this.updateUI();
    }
    
    highlightCell(row, col) {
        const x = col * this.settings.cellSize;
        const y = row * this.settings.cellSize;
        const size = this.settings.cellSize;
        
        // Animação de destaque
        let alpha = 1;
        const animate = () => {
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(x, y, size, size);
            this.ctx.strokeStyle = '#FF6B35';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, size, size);
            this.ctx.restore();
            
            alpha -= 0.05;
            if (alpha > 0) {
                requestAnimationFrame(animate);
            } else {
                this.draw();
            }
        };
        
        if (this.settings.animations) {
            animate();
        }
    }
    
    togglePause() {
        if (this.gameState !== 'playing') return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.stopTimer();
            this.elements.overlayTitle.textContent = '⏸️ Jogo Pausado';
            this.elements.overlayMessage.textContent = 'Clique para continuar';
            this.elements.gameOverlay.classList.remove('hidden');
            document.getElementById('pauseBtn').textContent = '▶️';
        } else {
            this.startTimer();
            this.elements.gameOverlay.classList.add('hidden');
            document.getElementById('pauseBtn').textContent = '⏸️';
        }
    }
    
    newGame() {
        this.stopTimer();
        this.initGame();
    }
    
    startTimer() {
        if (this.timerInterval) return;
        
        this.startTime = Date.now() - (this.timer * 1000);
        this.timerInterval = setInterval(() => {
            this.timer = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateUI();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateUI() {
        const flaggedCount = this.flagged.flat().filter(f => f).length;
        this.elements.mineCount.textContent = Math.max(0, this.mines - flaggedCount);
        this.elements.timer.textContent = this.formatTime(this.timer);
        this.elements.score.textContent = this.score.toLocaleString();
        this.elements.streak.textContent = this.stats.currentStreak;
    }
    
    updateProgress() {
        const totalCells = this.rows * this.cols - this.mines;
        const progress = (this.revealedCount / totalCells) * 100;
        this.elements.progressFill.style.width = `${Math.min(progress, 100)}%`;
    }
    
    updateStatus(message) {
        this.elements.statusMessage.textContent = message;
        
        // Animação de status
        if (this.settings.animations) {
            this.elements.statusMessage.classList.add('animate-pulse');
            setTimeout(() => {
                this.elements.statusMessage.classList.remove('animate-pulse');
            }, 2000);
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.drawCell(row, col);
            }
        }
        
        // Desenhar grid
        this.drawGrid();
    }
    
    drawCell(row, col) {
        const x = col * this.settings.cellSize;
        const y = row * this.settings.cellSize;
        const size = this.settings.cellSize;
        
        // Fundo da célula
        if (this.revealed[row][col]) {
            if (this.board[row][col] === -1) {
                this.ctx.fillStyle = this.gameState === 'lost' ? '#ff4757' : '#ff6b6b';
            } else {
                this.ctx.fillStyle = '#f8f9fa';
            }
        } else {
            this.ctx.fillStyle = '#6c757d';
        }
        
        this.ctx.fillRect(x, y, size, size);
        
        // Efeito 3D para células não reveladas
        if (!this.revealed[row][col]) {
            // Highlight superior e esquerdo
            this.ctx.fillStyle = '#ffffff40';
            this.ctx.fillRect(x, y, size, 2);
            this.ctx.fillRect(x, y, 2, size);
            
            // Shadow inferior e direito
            this.ctx.fillStyle = '#00000040';
            this.ctx.fillRect(x, y + size - 2, size, 2);
            this.ctx.fillRect(x + size - 2, y, 2, size);
        }
        
        // Conteúdo da célula
        if (this.revealed[row][col]) {
            if (this.board[row][col] === -1) {
                this.drawMine(x, y, size);
            } else if (this.board[row][col] > 0) {
                this.drawNumber(x, y, size, this.board[row][col]);
            }
        } else if (this.flagged[row][col]) {
            this.drawFlag(x, y, size);
        }
    }
    
    drawMine(x, y, size) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size * 0.3;
        
        // Corpo da mina
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Espinhos
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        const spikeLength = radius * 0.7;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const startX = centerX + Math.cos(angle) * radius * 0.6;
            const startY = centerY + Math.sin(angle) * radius * 0.6;
            const endX = centerX + Math.cos(angle) * (radius + spikeLength);
            const endY = centerY + Math.sin(angle) * (radius + spikeLength);
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
        
        // Brilho
        this.ctx.fillStyle = '#ffffff60';
        this.ctx.beginPath();
        this.ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    
    drawNumber(x, y, size, number) {
        const colors = [
            '', '#0984e3', '#00b894', '#e17055', '#6c5ce7', 
            '#a29bfe', '#fd79a8', '#fdcb6e', '#e84393'
        ];
        
        this.ctx.fillStyle = colors[number] || '#2d3436';
        this.ctx.font = `bold ${size * 0.6}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(number, x + size/2, y + size/2);
        
        // Sombra do texto
        this.ctx.fillStyle = '#00000020';
        this.ctx.fillText(number, x + size/2 + 1, y + size/2 + 1);
    }
    
    drawFlag(x, y, size) {
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const flagHeight = size * 0.6;
        const flagWidth = size * 0.4;
        
        // Mastro
        this.ctx.strokeStyle = '#8b4513';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - flagWidth * 0.3, centerY - flagHeight * 0.4);
        this.ctx.lineTo(centerX - flagWidth * 0.3, centerY + flagHeight * 0.4);
        this.ctx.stroke();
        
        // Bandeira
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - flagWidth * 0.3, centerY - flagHeight * 0.4);
        this.ctx.lineTo(centerX + flagWidth * 0.4, centerY - flagHeight * 0.1);
        this.ctx.lineTo(centerX - flagWidth * 0.3, centerY + flagHeight * 0.2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Sombra da bandeira
        this.ctx.fillStyle = '#c0392b';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - flagWidth * 0.3, centerY + flagHeight * 0.1);
        this.ctx.lineTo(centerX + flagWidth * 0.3, centerY + flagHeight * 0.0);
        this.ctx.lineTo(centerX - flagWidth * 0.3, centerY + flagHeight * 0.2);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#dee2e6';
        this.ctx.lineWidth = 0.5;
        
        // Linhas verticais
        for (let col = 0; col <= this.cols; col++) {
            const x = col * this.settings.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Linhas horizontais
        for (let row = 0; row <= this.rows; row++) {
            const y = row * this.settings.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    checkAutoReveal() {
        // Implementar auto-revelação quando número de bandeiras adjacentes = número da célula
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.revealed[row][col] && this.board[row][col] > 0) {
                    let flagCount = 0;
                    const adjacent = [];
                    
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const r = row + dr;
                            const c = col + dc;
                            if (this.isValidCell(r, c)) {
                                if (this.flagged[r][c]) flagCount++;
                                else if (!this.revealed[r][c]) adjacent.push([r, c]);
                            }
                        }
                    }
                    
                    if (flagCount === this.board[row][col]) {
                        adjacent.forEach(([r, c]) => this.revealCell(r, c));
                    }
                }
            }
        }
    }
    
    // Configurações e Temas
    changeTheme(theme) {
        this.settings.theme = theme;
        document.body.setAttribute('data-theme', theme);
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
        
        this.saveSettings();
        
        if (this.gameState !== 'ready') {
            this.draw();
        }
    }
    
    applySettingsToUI() {
        // Aplicar tema
        document.body.setAttribute('data-theme', this.settings.theme);
        document.querySelector(`[data-theme="${this.settings.theme}"]`)?.classList.add('active');
        
        // Aplicar toggles
        document.getElementById('soundToggle').checked = this.settings.sound;
        document.getElementById('musicToggle').checked = this.settings.music;
        document.getElementById('animationsToggle').checked = this.settings.animations;
        document.getElementById('hintsToggle').checked = this.settings.hints;
        document.getElementById('autoFlagToggle').checked = this.settings.autoFlag;
        
        // Aplicar tamanho da célula
        document.getElementById('cellSizeSlider').value = this.settings.cellSize;
        document.getElementById('cellSizeValue').textContent = this.settings.cellSize + 'px';
    }
    
    saveSettings() {
        localStorage.setItem('minesweeper_settings', JSON.stringify(this.settings));
    }
    
    // Estatísticas
    updateStats(won) {
        this.stats.gamesPlayed++;
        this.stats.totalTime += this.timer;
        
        if (won) {
            this.stats.totalWins++;
        } else {
            this.stats.totalLosses++;
        }
        
        this.saveStats();
    }
    
    updateStatsDisplay() {
        document.getElementById('totalWins').textContent = this.stats.totalWins.toLocaleString();
        document.getElementById('totalLosses').textContent = this.stats.totalLosses.toLocaleString();
        
        const winRate = this.stats.gamesPlayed > 0 ? 
            Math.round((this.stats.totalWins / this.stats.gamesPlayed) * 100) : 0;
        document.getElementById('winRate').textContent = winRate + '%';
        
        const totalHours = Math.floor(this.stats.totalTime / 3600);
        const totalMins = Math.floor((this.stats.totalTime % 3600) / 60);
        const totalSecs = this.stats.totalTime % 60;
        document.getElementById('totalTime').textContent = 
            `${totalHours}:${totalMins.toString().padStart(2, '0')}:${totalSecs.toString().padStart(2, '0')}`;
        
        this.drawStatsChart();
    }
    
    drawStatsChart() {
        const canvas = document.getElementById('statsChart');
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const wins = this.stats.totalWins;
        const losses = this.stats.totalLosses;
        const total = wins + losses;
        
        if (total === 0) {
            ctx.fillStyle = '#718096';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Nenhum jogo jogado ainda', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        // Gráfico de pizza
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 80;
        
        const winAngle = (wins / total) * 2 * Math.PI;
        
        // Vitórias
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, 0, winAngle);
        ctx.closePath();
        ctx.fill();
        
        // Derrotas
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, winAngle, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        
        // Legendas
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(centerX - 100, centerY + radius + 20, 15, 15);
        ctx.fillStyle = '#2d3748';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Vitórias: ${wins}`, centerX - 80, centerY + radius + 32);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(centerX + 20, centerY + radius + 20, 15, 15);
        ctx.fillStyle = '#2d3748';
        ctx.fillText(`Derrotas: ${losses}`, centerX + 40, centerY + radius + 32);
    }
    
    saveStats() {
        localStorage.setItem('minesweeper_stats', JSON.stringify(this.stats));
    }
    
    resetStats() {
        if (confirm('Tem certeza que deseja resetar todas as estatísticas?')) {
            this.stats = {
                totalWins: 0,
                totalLosses: 0,
                totalTime: 0,
                gamesPlayed: 0,
                bestTimes: {
                    beginner: null,
                    intermediate: null,
                    expert: null
                },
                winStreak: 0,
                currentStreak: 0
            };
            
            localStorage.removeItem('minesweeper_stats');
            localStorage.removeItem('minesweeper_best_times');
            
            this.updateStatsDisplay();
            this.loadBestTimes();
            
            alert('Estatísticas resetadas com sucesso!');
        }
    }
    
    // Sistema de Som
    playSound(type) {
        if (!this.settings.sound) return;
        
        // Criar sons usando Web Audio API ou AudioContext
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const sounds = {
            click: { frequency: 800, duration: 0.1 },
            flag: { frequency: 1200, duration: 0.15 },
            win: { frequency: [523, 659, 783, 1047], duration: 0.5 },
            lose: { frequency: [400, 350, 300], duration: 0.8 },
            hint: { frequency: 1000, duration: 0.2 }
        };
        
        const sound = sounds[type];
        if (!sound) return;
        
        if (Array.isArray(sound.frequency)) {
            // Som complexo (vitória/derrota)
            sound.frequency.forEach((freq, index) => {
                setTimeout(() => {
                    this.createBeep(audioContext, freq, sound.duration / sound.frequency.length);
                }, index * (sound.duration / sound.frequency.length) * 1000);
            });
        } else {
            // Som simples
            this.createBeep(audioContext, sound.frequency, sound.duration);
        }
    }
    
    createBeep(audioContext, frequency, duration) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    }
}

// Inicializar jogo quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const game = new MinesweeperGame();
    
    // Tornar o jogo acessível globalmente para debugging
    window.minesweeperGame = game;
    
    console.log('🎮 Campo Minado Clássico carregado!');
    console.log('📚 Versão Didática Completa - Todos os recursos implementados');
    console.log('🎯 Use window.minesweeperGame para acessar métodos do jogo');
});