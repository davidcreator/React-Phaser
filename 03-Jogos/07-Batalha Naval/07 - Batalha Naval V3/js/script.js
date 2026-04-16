document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os tabuleiros do jogo e o botão de reiniciar
    const player1BoardElement = document.getElementById('player1-board');
    const player2BoardElement = document.getElementById('player2-board');
    const resetButton = document.getElementById('reset-button');
    const message = document.getElementById('message');
    const player1ScoreElement = document.getElementById('player1-score');
    const player2ScoreElement = document.getElementById('player2-score');

    // Configurações do jogo
    const boardSize = 10;
    const shipSizes = [5, 4, 3, 3, 2];
    let player1Board = [];
    let player2Board = [];
    let player1Ships = [];
    let player2Ships = [];
    let player1Score = 0;
    let player2Score = 0;
    let currentPlayer = 1;

    // Função para inicializar o tabuleiro
    function initBoard() {
        player1Board = createEmptyBoard();
        player2Board = createEmptyBoard();
        player1BoardElement.innerHTML = '';
        player2BoardElement.innerHTML = '';
        createBoard(player1BoardElement, player1Board, handleCellClick);
        createBoard(player2BoardElement, player2Board, handleCellClick);
        placeShips(player1Board, player1Ships);
        placeShips(player2Board, player2Ships);
        message.textContent = 'Jogador 1, faça sua jogada!';
        currentPlayer = 1;
        player1Score = 0;
        player2Score = 0;
        updateScores();
    }

    // Cria um tabuleiro vazio
    function createEmptyBoard() {
        return Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
    }

    // Cria o tabuleiro no DOM
    function createBoard(boardElement, board, clickHandler) {
        for (let row = 0; row <= boardSize; row++) {
            for (let col = 0; col <= boardSize; col++) {
                const cell = document.createElement('div');
                if (row === 0 && col === 0) {
                    cell.classList.add('coordinate');
                } else if (row === 0) {
                    cell.textContent = String.fromCharCode(64 + col);
                    cell.classList.add('coordinate');
                } else if (col === 0) {
                    cell.textContent = row;
                    cell.classList.add('coordinate');
                } else {
                    cell.classList.add('cell');
                    cell.dataset.row = row - 1;
                    cell.dataset.col = col - 1;
                    cell.dataset.coord = `${String.fromCharCode(64 + col)}${row}`;
                    if (clickHandler) {
                        cell.addEventListener('click', clickHandler);
                    }
                }
                boardElement.appendChild(cell);
            }
        }
    }

    // Função para posicionar os navios no tabuleiro
    function placeShips(board, ships) {
        ships.length = 0;
        shipSizes.forEach(size => {
            let placed = false;
            while (!placed) {
                const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                const row = Math.floor(Math.random() * boardSize);
                const col = Math.floor(Math.random() * boardSize);
                if (canPlaceShip(board, row, col, size, direction)) {
                    placeShip(board, ships, row, col, size, direction);
                    placed = true;
                }
            }
        });
    }

    // Verifica se o navio pode ser colocado na posição desejada
    function canPlaceShip(board, row, col, size, direction) {
        if (direction === 'horizontal') {
            if (col + size > boardSize) return false;
            for (let i = 0; i < size; i++) {
                if (board[row][col + i] !== null) return false;
            }
        } else {
            if (row + size > boardSize) return false;
            for (let i = 0; i < size; i++) {
                if (board[row + i][col] !== null) return false;
            }
        }
        return true;
    }

    // Posiciona o navio no tabuleiro
    function placeShip(board, ships, row, col, size, direction) {
        const ship = [];
        if (direction === 'horizontal') {
            for (let i = 0; i < size; i++) {
                board[row][col + i] = 'ship';
                ship.push({ row, col: col + i });
            }
        } else {
            for (let i = 0; i < size; i++) {
                board[row + i][col] = 'ship';
                ship.push({ row: row + i, col });
            }
        }
        ships.push(ship);
    }

    // Função para lidar com o clique na célula
    function handleCellClick(event) {
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        const board = currentPlayer === 1 ? player2Board : player1Board;
        const ships = currentPlayer === 1 ? player2Ships : player1Ships;
        if (board[row][col] === 'ship') {
            event.target.classList.add('hit');
            board[row][col] = 'hit';
            message.textContent = `Jogador ${currentPlayer} acertou! Coordenada: ${event.target.dataset.coord}`;
            if (currentPlayer === 1) {
                player1Score++;
            } else {
                player2Score++;
            }
            checkWin(ships, `Jogador ${currentPlayer} venceu! Todos os navios do oponente foram destruídos.`);
        } else {
            event.target.classList.add('miss');
            board[row][col] = 'miss';
            message.textContent = `Jogador ${currentPlayer} errou! Coordenada: ${event.target.dataset.coord}`;
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            message.textContent += ` Agora é a vez do Jogador ${currentPlayer}.`;
        }
        updateScores();
    }

    // Verifica se todos os navios foram destruídos
    function checkWin(ships, winMessage) {
        const allShipsSunk = ships.every(ship => ship.every(cell => player1Board[cell.row][cell.col] === 'hit' || player2Board[cell.row][cell.col] === 'hit'));
        if (allShipsSunk) {
            message.textContent = winMessage;
        }
    }

    // Atualiza as pontuações dos jogadores
    function updateScores() {
        player1ScoreElement.textContent = `Jogador 1: ${player1Score}`;
        player2ScoreElement.textContent = `Jogador 2: ${player2Score}`;
    }

    // Reinicia o jogo
    resetButton.addEventListener('click', initBoard);

    // Inicializa o tabuleiro ao carregar a página
    initBoard();
});
