// Variables del juego Tetris Extremo
let tetrisBoard = [];
let currentPiece = null;
let nextPiece = null;
let tetrisScore = 0;
let tetrisCanvas, tetrisCtx;
let nextPieceCanvas, nextPieceCtx;
let tetrisGameInterval;
let tetrisGameSpeed = 300; // Velocidad inicial (ms)
let tetrisGameOver = false;
let tetrisContainer;
let completedLines = 0;

// Colores para las piezas
const tetrisColors = [
    null, // Para casillas vacías
    '#FF0D72', // I - rosa fuerte
    '#0DC2FF', // J - celeste
    '#0DFF72', // L - verde claro
    '#F538FF', // O - magenta
    '#FF8E0D', // S - naranja
    '#FFE138', // T - amarillo
    '#3877FF'  // Z - azul
];

// Formas de las piezas
const tetrisPieces = [
    null,
    // I
    [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0]
    ],
    // J
    [
        [0, 2, 0],
        [0, 2, 0],
        [2, 2, 0]
    ],
    // L
    [
        [0, 3, 0],
        [0, 3, 0],
        [0, 3, 3]
    ],
    // O
    [
        [4, 4],
        [4, 4]
    ],
    // S
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    // T
    [
        [0, 0, 0],
        [6, 6, 6],
        [0, 6, 0]
    ],
    // Z
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
];

// Emojis para las piezas (versión divertida)
const tetrisEmojis = ['', '😂', '😎', '🤪', '😍', '🤯', '👽', '👾'];
let useEmojis = false;

// Inicialización del juego de Tetris
function initTetriGame(container) {
    tetrisContainer = container;
    
    // Crear elementos del juego
    const gameWrapper = document.createElement('div');
    gameWrapper.className = 'tetris-wrapper';
    
    // Configurar contenedor izquierdo (información y siguiente pieza)
    const leftContainer = document.createElement('div');
    leftContainer.className = 'tetris-left-container';
    
    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'tetris-score-display';
    scoreDisplay.innerHTML = '<h2>Puntos:</h2><div id="tetris-score">0</div>';
    
    const levelDisplay = document.createElement('div');
    levelDisplay.className = 'tetris-level-display';
    levelDisplay.innerHTML = '<h2>Nivel:</h2><div id="tetris-level">1</div>';
    
    const nextPieceDisplay = document.createElement('div');
    nextPieceDisplay.className = 'tetris-next-piece';
    nextPieceDisplay.innerHTML = '<h2>Siguiente:</h2>';
    
    nextPieceCanvas = document.createElement('canvas');
    nextPieceCanvas.width = 100;
    nextPieceCanvas.height = 100;
    nextPieceCanvas.id = 'next-piece';
    nextPieceDisplay.appendChild(nextPieceCanvas);
    nextPieceCtx = nextPieceCanvas.getContext('2d');
    
    // Botón para alternar emojis
    const emojiToggle = document.createElement('button');
    emojiToggle.textContent = 'Modo Emojis: OFF';
    emojiToggle.className = 'tetris-emoji-toggle';
    emojiToggle.onclick = () => {
        useEmojis = !useEmojis;
        emojiToggle.textContent = useEmojis ? 'Modo Emojis: ON' : 'Modo Emojis: OFF';
    };
    
    leftContainer.appendChild(scoreDisplay);
    leftContainer.appendChild(levelDisplay);
    leftContainer.appendChild(nextPieceDisplay);
    leftContainer.appendChild(emojiToggle);
    
    // Configurar el tablero principal
    tetrisCanvas = document.createElement('canvas');
    tetrisCanvas.width = 240;
    tetrisCanvas.height = 480;
    tetrisCanvas.id = 'tetris-board';
    tetrisCtx = tetrisCanvas.getContext('2d');
    
    // Añadir elementos al DOM
    gameWrapper.appendChild(leftContainer);
    gameWrapper.appendChild(tetrisCanvas);
    container.appendChild(gameWrapper);
    
    // Inicializar el juego
    initTetrisBoard();
    createRandomPiece();
    nextPiece = createPiece();
    
    // Configurar controles
    document.addEventListener('keydown', handleTetrisKeyPress);
    
    // Añadir controles táctiles para dispositivos móviles
    addTouchControls(container);
    
    // Iniciar el bucle del juego
    tetrisGameInterval = setInterval(tetrisGameLoop, tetrisGameSpeed);
}

// Limpiar el juego de Tetris
function cleanupTetriGame() {
    clearInterval(tetrisGameInterval);
    document.removeEventListener('keydown', handleTetrisKeyPress);
    
    // Eliminar controles táctiles si existen
    const touchControls = document.getElementById('tetris-touch-controls');
    if (touchControls) {
        touchControls.remove();
    }
}

// Inicializar tablero de juego vacío
function initTetrisBoard() {
    tetrisBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
}

// Crear una nueva pieza aleatoria
function createPiece() {
    const pieceType = Math.floor(Math.random() * 7) + 1;
    const piece = {
        type: pieceType,
        shape: tetrisPieces[pieceType],
        x: 3,
        y: 0
    };
    return piece;
}

// Crear nueva pieza y actualizar la siguiente
function createRandomPiece() {
    currentPiece = nextPiece || createPiece();
    nextPiece = createPiece();
    drawNextPiece();
    
    // Verificar Game Over
    if (checkCollision(currentPiece)) {
        tetrisGameOver = true;
        clearInterval(tetrisGameInterval);
        showGameOverMessage();
    }
}

// Dibujar la siguiente pieza
function drawNextPiece() {
    nextPieceCtx.clearRect(0, 0, 100, 100);
    nextPieceCtx.fillStyle = '#000';
    nextPieceCtx.fillRect(0, 0, 100, 100);
    
    if (!nextPiece) return;
    
    const blockSize = 20;
    const offsetX = (100 - nextPiece.shape[0].length * blockSize) / 2;
    const offsetY = (100 - nextPiece.shape.length * blockSize) / 2;
    
    for (let y = 0; y < nextPiece.shape.length; y++) {
        for (let x = 0; x < nextPiece.shape[y].length; x++) {
            if (nextPiece.shape[y][x]) {
                const type = nextPiece.shape[y][x];
                
                if (useEmojis) {
                    nextPieceCtx.font = '20px Arial';
                    nextPieceCtx.fillText(
                        tetrisEmojis[type],
                        offsetX + x * blockSize,
                        offsetY + y * blockSize + 15
                    );
                } else {
                    nextPieceCtx.fillStyle = tetrisColors[type];
                    nextPieceCtx.fillRect(
                        offsetX + x * blockSize,
                        offsetY + y * blockSize,
                        blockSize - 1,
                        blockSize - 1
                    );
                }
            }
        }
    }
}

// Bucle principal del juego
function tetrisGameLoop() {
    if (tetrisGameOver) return;
    
    movePiece(0, 1);
    drawTetrisBoard();
    updateScore();
}

// Mover la pieza actual
function movePiece(dx, dy) {
    currentPiece.x += dx;
    currentPiece.y += dy;
    
    // Verificar colisiones
    if (checkCollision(currentPiece)) {
        // Revertir el movimiento
        currentPiece.x -= dx;
        currentPiece.y -= dy;
        
        // Si el movimiento fue hacia abajo, fijar la pieza
        if (dy > 0) {
            mergePieceWithBoard();
            checkLines();
            createRandomPiece();
        }
    }
}

// Verificar colisiones
function checkCollision(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x] !== 0) {
                const boardX = piece.x + x;
                const boardY = piece.y + y;
                
                // Verificar límites del tablero
                if (
                    boardX < 0 || 
                    boardX >= 10 || 
                    boardY >= 20 ||
                    (boardY >= 0 && tetrisBoard[boardY][boardX])
                ) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Fijar la pieza en el tablero
function mergePieceWithBoard() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x] !== 0) {
                const boardX = currentPiece.x + x;
                const boardY = currentPiece.y + y;
                
                if (boardY >= 0) {
                    tetrisBoard[boardY][boardX] = currentPiece.type;
                }
            }
        }
    }
}

// Verificar líneas completas
function checkLines() {
    let linesCleared = 0;
    
    for (let y = tetrisBoard.length - 1; y >= 0; y--) {
        if (tetrisBoard[y].every(cell => cell !== 0)) {
            // Guardar la fila para animación
            const clearedRow = [...tetrisBoard[y]];
            
            // Eliminar la fila y añadir una nueva al principio
            tetrisBoard.splice(y, 1);
            tetrisBoard.unshift(Array(10).fill(0));
            
            // Incrementar contador
            linesCleared++;
            completedLines++;
            
            // Efecto visual al completar línea
            playLineEffect(y, clearedRow);
            
            // Ajustar el bucle debido al cambio en el índice
            y++;
        }
    }
    
    // Asignar puntos basados en las líneas completadas
    if (linesCleared > 0) {
        const pointsScored = [0, 40, 100, 300, 1200][linesCleared] * (Math.floor(completedLines / 10) + 1);
        tetrisScore += pointsScored;
        
        // Incrementar velocidad cada 10 líneas
        if (completedLines % 10 === 0) {
            tetrisGameSpeed = Math.max(50, tetrisGameSpeed - 50);
            clearInterval(tetrisGameInterval);
            tetrisGameInterval = setInterval(tetrisGameLoop, tetrisGameSpeed);
            
            // Actualizar nivel
            document.getElementById('tetris-level').textContent = Math.floor(completedLines / 10) + 1;
            
            // Efecto visual al subir de nivel
            showLevelUpEffect();
        }
        
        // Efectos adicionales según número de líneas
        if (linesCleared >= 4) {
            showTetrisEffect();
        }
    }
}

// Efecto visual al completar una línea
function playLineEffect(row, rowData) {
    // Flash del tablero
    tetrisCtx.fillStyle = 'white';
    tetrisCtx.fillRect(0, row * 24, 240, 24);
    
    // Agregar un mensaje temporal flotante
    const message = document.createElement('div');
    message.className = 'tetris-line-message';
    message.textContent = '¡LÍNEA!';
    message.style.top = `${row * 24 + tetrisCanvas.offsetTop}px`;
    message.style.left = `${tetrisCanvas.offsetLeft + 120}px`;
    tetrisContainer.appendChild(message);
    
    // Reproducir sonido
    const sound = new Audio('games/tetri/sounds/line.wav');
    sound.play().catch(e => console.log("Error al reproducir sonido:", e));
    
    // Eliminar mensaje después de la animación
    setTimeout(() => {
        message.remove();
    }, 1000);
}

// Efecto cuando se logra un Tetris (4 líneas de una vez)
function showTetrisEffect() {
    // Crear overlay con efecto
    const tetrisEffect = document.createElement('div');
    tetrisEffect.className = 'tetris-effect';
    tetrisEffect.textContent = '¡¡TETRIS!!';
    tetrisContainer.appendChild(tetrisEffect);
    
    // Sonido especial
    const sound = new Audio('games/tetri/sounds/tetris.wav');
    sound.play().catch(e => console.log("Error al reproducir sonido:", e));
    
    // Cambiar colores del tablero temporalmente
    const originalBgColor = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#FF00FF';
    
    // Eliminar efecto después de animación
    setTimeout(() => {
        tetrisEffect.remove();
        document.body.style.backgroundColor = originalBgColor;
    }, 1500);
}

// Efecto al subir de nivel
function showLevelUpEffect() {
    const levelEffect = document.createElement('div');
    levelEffect.className = 'tetris-level-effect';
    levelEffect.textContent = '¡NIVEL UP!';
    tetrisContainer.appendChild(levelEffect);
    
    // Sonido de nivel
    const sound = new Audio('games/tetri/sounds/levelup.wav');
    sound.play().catch(e => console.log("Error al reproducir sonido:", e));
    
    setTimeout(() => {
        levelEffect.remove();
    }, 2000);
}

// Dibujar el estado actual del tablero
function drawTetrisBoard() {
    tetrisCtx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
    tetrisCtx.fillStyle = '#000';
    tetrisCtx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
    
    // Dibujar piezas fijas en el tablero
    for (let y = 0; y < tetrisBoard.length; y++) {
        for (let x = 0; x < tetrisBoard[y].length; x++) {
            if (tetrisBoard[y][x] !== 0) {
                const type = tetrisBoard[y][x];
                drawBlock(x, y, type);
            }
        }
    }
    
    // Dibujar pieza actual
    if (currentPiece) {
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x] !== 0) {
                    const type = currentPiece.shape[y][x];
                    const boardX = currentPiece.x + x;
                    const boardY = currentPiece.y + y;
                    
                    if (boardY >= 0) {
                        drawBlock(boardX, boardY, type);
                    }
                }
            }
        }
    }
}

// Dibujar un bloque individual
function drawBlock(x, y, type) {
    const blockSize = 24;
    
    if (useEmojis) {
        tetrisCtx.font = '24px Arial';
        tetrisCtx.fillText(tetrisEmojis[type], x * blockSize, y * blockSize + 20);
    } else {
        tetrisCtx.fillStyle = tetrisColors[type];
        tetrisCtx.fillRect(
            x * blockSize,
            y * blockSize,
            blockSize - 1,
            blockSize - 1
        );
        
        // Efecto 3D
        tetrisCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        tetrisCtx.fillRect(
            x * blockSize,
            y * blockSize,
            blockSize - 1,
            3
        );
        tetrisCtx.fillRect(
            x * blockSize,
            y * blockSize,
            3,
            blockSize - 1
        );
        
        tetrisCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        tetrisCtx.fillRect(
            x * blockSize + blockSize - 4,
            y * blockSize,
            3,
            blockSize - 1
        );
        tetrisCtx.fillRect(
            x * blockSize,
            y * blockSize + blockSize - 4,
            blockSize - 1,
            3
        );
    }
}

// Manejar eventos de teclado
function handleTetrisKeyPress(event) {
    if (tetrisGameOver) return;
    
    switch (event.keyCode) {
        case 37: // Izquierda
            movePiece(-1, 0);
            break;
        case 39: // Derecha
            movePiece(1, 0);
            break;
        case 40: // Abajo
            movePiece(0, 1);
            break;
        case 38: // Rotar (Arriba)
            rotatePiece();
            break;
        case 32: // Espacio - Hard drop
            hardDrop();
            break;
    }
    
    drawTetrisBoard();
    event.preventDefault();
}

// Añadir controles táctiles para dispositivos móviles
function addTouchControls(container) {
    const touchControls = document.createElement('div');
    touchControls.id = 'tetris-touch-controls';
    touchControls.className = 'tetris-touch-controls';
    
    const leftBtn = document.createElement('button');
    leftBtn.innerHTML = '←';
    leftBtn.addEventListener('click', () => {
        movePiece(-1, 0);
        drawTetrisBoard();
    });
    
    const rightBtn = document.createElement('button');
    rightBtn.innerHTML = '→';
    rightBtn.addEventListener('click', () => {
        movePiece(1, 0);
        drawTetrisBoard();
    });
    
    const downBtn = document.createElement('button');
    downBtn.innerHTML = '↓';
    downBtn.addEventListener('click', () => {
        movePiece(0, 1);
        drawTetrisBoard();
    });
    
    const rotateBtn = document.createElement('button');
    rotateBtn.innerHTML = '↻';
    rotateBtn.addEventListener('click', () => {
        rotatePiece();
        drawTetrisBoard();
    });
    
    const dropBtn = document.createElement('button');
    dropBtn.innerHTML = '⬇️';
    dropBtn.addEventListener('click', () => {
        hardDrop();
        drawTetrisBoard();
    });
    
    touchControls.appendChild(leftBtn);
    touchControls.appendChild(downBtn);
    touchControls.appendChild(rotateBtn);
    touchControls.appendChild(rightBtn);
    touchControls.appendChild(dropBtn);
    
    container.appendChild(touchControls);
}

// Rotar la pieza actual
function rotatePiece() {
    // Guardar la forma original por si no es posible rotar
    const original = currentPiece.shape;
    
    // Crear una nueva matriz rotada
    const rotated = [];
    for (let i = 0; i < original[0].length; i++) {
        const row = [];
        for (let j = original.length - 1; j >= 0; j--) {
            row.push(original[j][i]);
        }
        rotated.push(row);
    }
    
    // Guardar la forma original y probar la rotación
    const originalShape = currentPiece.shape;
    currentPiece.shape = rotated;
    
    // Si hay colisión, volver a la forma original
    if (checkCollision(currentPiece)) {
        currentPiece.shape = originalShape;
    }
}

// Caída dura - bajar la pieza hasta que colisione
function hardDrop() {
    while (!checkCollision({ ...currentPiece, y: currentPiece.y + 1 })) {
        currentPiece.y++;
    }
    mergePieceWithBoard();
    checkLines();
    createRandomPiece();
}

// Actualizar la puntuación en la interfaz
function updateScore() {
    document.getElementById('tetris-score').textContent = tetrisScore;
}

// Mostrar mensaje de Game Over
function showGameOverMessage() {
    const gameOverMsg = document.createElement('div');
    gameOverMsg.className = 'tetris-gameover';
    gameOverMsg.innerHTML = `
        <h1>¡GAME OVER!</h1>
        <p>Puntuación: ${tetrisScore}</p>
        <p>Nivel: ${Math.floor(completedLines / 10) + 1}</p>
    `;
    
    tetrisContainer.appendChild(gameOverMsg);
    
    // Sonido de game over
    const sound = new Audio('games/tetri/sounds/gameover.wav');
    sound.play().catch(e => console.log("Error al reproducir sonido:", e));
}
