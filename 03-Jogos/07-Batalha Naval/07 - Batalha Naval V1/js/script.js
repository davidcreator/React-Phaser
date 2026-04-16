document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os tabuleiros do jogo e o botão de reiniciar
    const playerBoardElement = document.getElementById('player-board');
    const computerBoardElement = document.getElementById('computer-board');
    const resetButton = document.getElementById('reset-button');
    const message = document.getElementById('message');

    // Configurações do jogo
    const boardSize = 10;
    const shipSizes = [5, 4, 3, 3, 2];
    let playerBoard = [];
    let computerBoard = [];
    let playerShips = [];
    let computerShips = [];

    // Função para inicializar o tabuleiro
    function initBoard() {
        playerBoard = createEmptyBoard();
        computerBoard = createEmptyBoard();
        playerBoardElement.innerHTML = '';
        computerBoardElement.innerHTML = '';
        createBoard(playerBoardElement, playerBoard, handlePlayerCellClick);
        createBoard(computerBoardElement, computerBoard, null);
        placeShips(playerBoard, playerShips);
        placeShips(computerBoard, computerShips);
        message.textContent = 'Encontre e destrua todos os navios!';
    }

    // Cria um tabuleiro vazio
    function createEmptyBoard() {
        return Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
    }

    // Cria o tabuleiro no DOM
    function createBoard(boardElement, board, clickHandler) {
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.coord = `${String.fromCharCode(65 + col)}${row + 1}`;
                if (clickHandler) {
                    cell.addEventListener('click', clickHandler);
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

    // Função para lidar com o clique na célula do jogador
    function handlePlayerCellClick(event) {
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        if (computerBoard[row][col] === 'ship') {
            event.target.classList.add('hit');
            computerBoard[row][col] = 'hit';
            message.textContent = `Acertou! Coordenada: ${event.target.dataset.coord}`;
            checkWin(computerShips, 'Você venceu! Todos os navios do computador foram destruídos.');
        } else {
            event.target.classList.add('miss');
            computerBoard[row][col] = 'miss';
            message.textContent = `Errou! Coordenada: ${event.target.dataset.coord}`;
            computerMove();
        }
    }

    // Movimento do computador
    function computerMove() {
        let row, col;
        do {
            row = Math.floor(Math.random() * boardSize);
            col = Math.floor(Math.random() * boardSize);
        } while (playerBoard[row][col] === 'hit' || playerBoard[row][col] === 'miss');

        const cell = playerBoardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (playerBoard[row][col] === 'ship') {
            cell.classList.add('hit');
            playerBoard[row][col] = 'hit';
            message.textContent = `Computador acertou! Coordenada: ${cell.dataset.coord}`;
            checkWin(playerShips, 'Computador venceu! Todos os seus navios foram destruídos.');
        } else {
            cell.classList.add('miss');
            playerBoard[row][col] = 'miss';
            message.textContent = `Computador errou! Coordenada: ${cell.dataset.coord}`;
        }
    }

    // Verifica se todos os navios foram destruídos
    function checkWin(ships, winMessage) {
        const allShipsSunk = ships.every(ship => ship.every(cell => playerBoard[cell.row][cell.col] === 'hit'));
        if (allShipsSunk) {
            message.textContent = winMessage;
        }
    }

    // Reinicia o jogo
    resetButton.addEventListener('click', initBoard);

    // Inicializa o tabuleiro ao carregar a página
    initBoard();
});
