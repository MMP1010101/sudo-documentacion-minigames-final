// Sistema de gestión de juegos con transición automática y música persistente

// Configuración general
const GAME_DURATION = 30; // Duración de cada juego en segundos
let currentGame = null;
let currentGameIndex = 0;
let countdownInterval = null;
let timeRemaining = GAME_DURATION;
let gameScripts = []; // Almacenar scripts cargados

// Elemento de audio para la música de fondo
let backgroundMusic;
let isMusicPlaying = false;

// Lista de juegos disponibles
const games = [
    {
        id: "intro",
        name: "¡Prepárate!",
        color: "#e67e22",
        jsPath: "games/intro/intro.js",
        cssPath: "games/intro/intro.css",
        duration: 8  // Duración especial más corta para la intro
    },
    // Nuevo juego añadido a la lista
    {
        id: "batallaVaile",
        name: "Batalla de Baile",
        color: "#ff4757",
        jsPath: "games/batallaVaile/batallaVaile.js",
        cssPath: "games/batallaVaile/batallaVaile.css"
    },
    {
        id: "tetri",
        name: "Tetris Extremo",
        color: "#3498db",
        jsPath: "games/tetri/tetri.js",
        cssPath: "games/tetri/treti.css"
    },
    {
        id: "guitar",
        name: "Guitar Hero",
        color: "#9b59b6",
        jsPath: "games/guitar/guitar.js",
        cssPath: "games/guitar/guitar.css"
    },

    {
        id: "globing",
        name: "Globing Fight",
        color: "#e74c3c",
        jsPath: "games/globing/globing.js",
        cssPath: "games/globing/globing.css"
    },
    {
        id: "rhythm",
        name: "Ritmo Frenético",
        color: "#e74c3c",
        jsPath: "games/rhythm/rhythm.js",
        cssPath: "games/rhythm/rhythm.css"
    },
    {
        id: "tetris",
        name: "Tetris Extremo",
        color: "#3498db",
        jsPath: "games/tetris/tetris.js",
        cssPath: "games/tetris/tetris.css"
    },
    {
        id: "platform",
        name: "Plataforma Turbo",
        color: "#2ecc71",
        jsPath: "games/platform/platform.js",
        cssPath: "games/platform/platform.css"
    }
];

// Inicialización cuando el documento está listo
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar elemento de audio
    backgroundMusic = document.getElementById('background-music');
    
    // Configurar eventos de botones
    document.getElementById('music-toggle').addEventListener('click', toggleMusic);
    document.getElementById('skip-game').addEventListener('click', skipToNextGame);
    
    // Iniciar el primer juego
    startGame(0);
    
    // Intentar reproducir música (puede requerir interacción del usuario según políticas del navegador)
    document.addEventListener('click', initMusicOnFirstInteraction, { once: true });
});

// Función para iniciar música con la primera interacción (política de navegadores)
function initMusicOnFirstInteraction() {
    if (!isMusicPlaying) {
        toggleMusic();
    }
}

// Alternar música
function toggleMusic() {
    const musicButton = document.getElementById('music-toggle');
    
    if (isMusicPlaying) {
        backgroundMusic.pause();
        musicButton.textContent = "Música: OFF";
    } else {
        backgroundMusic.play().catch(error => {
            console.log("Error al reproducir música:", error);
        });
        musicButton.textContent = "Música: ON";
    }
    
    isMusicPlaying = !isMusicPlaying;
}

// Modificar startGame para mejor manejo de errores
function startGame(gameIndex) {
    const gameContainer = document.getElementById('game-container');
    const countdownElement = document.getElementById('countdown');
    
    // Limpiar juego anterior si existe
    if (currentGame !== null) {
        try {
            // Si existe una función de limpieza en el juego actual, llamarla
            const cleanupFunctionName = `cleanup${games[currentGame].id.charAt(0).toUpperCase() + games[currentGame].id.slice(1)}Game`;
            if (window[cleanupFunctionName]) {
                console.log(`Ejecutando función de limpieza: ${cleanupFunctionName}`);
                window[cleanupFunctionName]();
            }
            
            // Descargar CSS específico del juego anterior
            const prevGameCss = document.querySelector(`link[href="${games[currentGame].cssPath}"]`);
            if (prevGameCss) {
                prevGameCss.remove();
            }
        } catch (error) {
            console.error("Error al limpiar el juego anterior:", error);
        }
    }
    
    // Actualizar índice de juego actual
    currentGame = gameIndex;
    currentGameIndex = gameIndex;
    
    // Mostrar título del juego y configurar color de fondo
    gameContainer.innerHTML = '<div class="game-loading">Cargando juego...</div>';
    document.body.style.backgroundColor = games[gameIndex].color;
    
    console.log(`Iniciando carga del juego: ${games[gameIndex].name}`);
    
    // Cargar CSS del juego
    loadGameCSS(games[gameIndex].cssPath).then(() => {
        console.log(`CSS cargado correctamente: ${games[gameIndex].cssPath}`);
        
        // Cargar JS del juego y luego inicializarlo
        loadGameJS(games[gameIndex].jsPath).then(() => {
            gameContainer.innerHTML = '';
            
            // Solo mostrar título si no es la intro
            if (games[gameIndex].id !== "intro") {
                const gameTitle = document.createElement('h1');
                gameTitle.textContent = games[gameIndex].name;
                gameTitle.className = 'game-title';
                gameContainer.appendChild(gameTitle);
            }
            
            // Inicializar el juego usando su función de inicio
            const initFunctionName = `init${games[gameIndex].id.charAt(0).toUpperCase() + games[gameIndex].id.slice(1)}Game`;
            console.log(`Intentando ejecutar función de inicialización: ${initFunctionName}`);
            
            if (typeof window[initFunctionName] === 'function') {
                try {
                    window[initFunctionName](gameContainer);
                    console.log(`Juego inicializado correctamente: ${games[gameIndex].name}`);
                } catch (error) {
                    console.error(`Error al inicializar el juego ${games[gameIndex].name}:`, error);
                    gameContainer.innerHTML += `<div class="game-error">Error al inicializar el juego: ${error.message}</div>`;
                }
            } else {
                console.error(`Función de inicio ${initFunctionName} no encontrada o no es una función`);
                gameContainer.innerHTML += `<div class="game-error">Error al cargar el juego: función ${initFunctionName} no encontrada</div>`;
            }
            
            // Usar duración específica del juego si está definida, o la duración predeterminada
            const gameDuration = games[gameIndex].duration || GAME_DURATION;
            timeRemaining = gameDuration;
            countdownElement.textContent = timeRemaining;
            
            // Limpiar intervalo anterior si existe
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }
            
            // Iniciar nuevo intervalo de cuenta regresiva
            countdownInterval = setInterval(() => {
                timeRemaining--;
                countdownElement.textContent = timeRemaining;
                
                // Cambiar al siguiente juego cuando se acabe el tiempo
                if (timeRemaining <= 0) {
                    skipToNextGame();
                }
            }, 1000);
        }).catch(error => {
            console.error("Error cargando JS del juego:", error);
            gameContainer.innerHTML = `<div class="game-error">Error al cargar el juego: ${error.message}</div>`;
        });
    }).catch(error => {
        console.error("Error cargando CSS del juego:", error);
        gameContainer.innerHTML = `<div class="game-error">Error al cargar el CSS del juego: ${error.message}</div>`;
    });
}

// Cargar dinámicamente el CSS de un juego
function loadGameCSS(cssPath) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Error al cargar el CSS: ${cssPath}`));
        
        document.head.appendChild(link);
    });
}

// Cargar dinámicamente el JS de un juego
function loadGameJS(jsPath) {
    // Si ya cargamos este script antes, resolvemos inmediatamente
    if (gameScripts.includes(jsPath)) {
        return Promise.resolve();
    }
    
    console.log(`Intentando cargar script: ${jsPath}`);
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = jsPath;
        
        script.onload = () => {
            console.log(`Script cargado correctamente: ${jsPath}`);
            gameScripts.push(jsPath);
            resolve();
        };
        script.onerror = (error) => {
            console.error(`Error al cargar el JS: ${jsPath}`, error);
            reject(new Error(`Error al cargar el JS: ${jsPath}`));
        };
        
        document.body.appendChild(script);
    });
}

// Pasar al siguiente juego
function skipToNextGame() {
    // Calcular índice del siguiente juego
    const nextGameIndex = (currentGameIndex + 1) % games.length;
    startGame(nextGameIndex);
}
