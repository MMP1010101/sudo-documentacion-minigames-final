// Variables globales del juego
let videoPlayer;
let keyOverlay;
let scoreDisplay;
let gameActive = false;
let activeKeys = [];
let score = 0;
let comboMultiplier = 1;
let consecutiveHits = 0;
let lastFrameTime = 0;
let fpsThreshold = 30;
let gamePaused = true; // Inicialmente en pausa
let difficultyFactor = 1; // Factor de dificultad que aumentará con el tiempo
let particles = []; // Para efectos de partículas
let gameStartTime; // Tiempo cuando inició el juego
let gameAudio; // Audio de fondo para el juego
let gameEndTimer; // Temporizador para finalizar el juego
const GAME_MAX_DURATION = 1984; // 33:04 en segundos
let timeRemainingEl; // Elemento para mostrar tiempo restante

// Número máximo de teclas en pantalla al mismo tiempo
const MAX_ACTIVE_KEYS = 5;
const MAX_DIFFICULTY = 3; // Dificultad máxima

// Patrones de teclas organizados de manera lógica
const KEY_PATTERNS = {
    // Fila superior del teclado QWERTY español
    topRow: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    // Fila del medio del teclado QWERTY español
    middleRow: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    // Fila inferior del teclado QWERTY español
    bottomRow: ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    // Vocales
    vowels: ['A', 'E', 'I', 'O', 'U'],
    // Patrones de arcoiris (desde la izquierda del teclado a la derecha)
    rainbow: [
        ['Q', 'A', 'Z'],
        ['W', 'S', 'X'],
        ['E', 'D', 'C'],
        ['R', 'F', 'V'],
        ['T', 'G', 'B'],
        ['Y', 'H', 'N'],
        ['U', 'J', 'M'],
        ['I', 'K'],
        ['O', 'L'],
        ['P', 'Ñ']
    ],
    // Teclas fáciles de alcanzar
    easy: ['A', 'S', 'D', 'F', 'J', 'K', 'L']
};

// Configuración actual del patrón de teclas
let currentKeyPattern = {
    type: 'easy', // Tipo de patrón inicial
    index: 0,      // Índice dentro del patrón
    rainbow: 0,     // Índice del grupo de arcoiris si se usa ese patrón
    rainbowGroup: 0 // Posición dentro del grupo de arcoiris
};

// Usar todas las teclas como fallback
const possibleKeys = [...KEY_PATTERNS.topRow, ...KEY_PATTERNS.middleRow, ...KEY_PATTERNS.bottomRow];

// Para cargar GSAP dinámicamente
function loadGSAP() {
    return new Promise((resolve, reject) => {
        if (window.gsap) {
            resolve(window.gsap);
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.4/gsap.min.js';
        script.onload = () => resolve(window.gsap);
        script.onerror = () => reject(new Error('No se pudo cargar GSAP'));
        document.head.appendChild(script);
    });
}

// Función de inicialización que será llamada desde el sistema principal
async function initBatallaVaileGame(container) {
    try {
        console.log("Inicializando BatallaVaile...");
        
        // Cargar GSAP para animaciones avanzadas
        const gsap = await loadGSAP();
        
        // Crear estructura HTML del juego con botón de inicio épico
        container.innerHTML += `
            <div id="batallaVaile-container">
                <div id="video-container">
                    <video id="dance-video" loop>
                        <source src="presentarme.mp4" type="video/mp4">
                        <source src="presentarme.mp4" type="video/mp4">
                        Tu navegador no soporta videos HTML5.
                    </video>
                    <div id="overlay-effects"></div>
                    <div id="particle-container"></div>
                </div>
                
                <div id="boss-intro" class="active">
                    <div class="boss-title">BATALLA CONTRA LA IA</div>
                    <div class="boss-subtitle">¿ESTÁS PREPARADO?</div>
                    <button id="start-boss-battle" class="epic-button">
                        <span class="button-text">INICIAR BATALLA</span>
                        <span class="button-effect"></span>
                    </button>
                </div>
                
                <div id="key-overlay">
                    <div id="active-keys-container"></div>
                    <div id="score-container">
                        <div id="score-display">Puntuación: 0</div>
                        <div id="combo-display">COMBO: x1</div>
                    </div>
                    <div id="hit-feedback"></div>
                    <div id="boss-meter-container">
                        <div id="boss-meter-label">PROGRESO DEL BOSS</div>
                        <div id="boss-meter-bar-container">
                            <div id="boss-meter-bar"></div>
                        </div>
                        <div id="time-remaining">Tiempo: 33:04</div>
                    </div>
                </div>
                
                <!-- Elemento de audio para la música de fondo -->
                <audio id="game-audio" loop>
                    <source src="presentarme.mp3" type="audio/mp3">
                    <source src="presentarme.mp3" type="audio/mp3">
                </audio>
            </div>
        `;
        
        console.log("Estructura HTML creada");
        
        // Obtener referencias a los elementos DOM
        videoPlayer = document.getElementById('dance-video');
        keyOverlay = document.getElementById('active-keys-container');
        scoreDisplay = document.getElementById('score-display');
        comboDisplay = document.getElementById('combo-display');
        hitFeedbackElement = document.getElementById('hit-feedback');
        bossIntro = document.getElementById('boss-intro');
        startButton = document.getElementById('start-boss-battle');
        bossMeter = document.getElementById('boss-meter-bar');
        gameAudio = document.getElementById('game-audio');
        timeRemainingEl = document.getElementById('time-remaining');
        
        console.log("Referencias a elementos DOM obtenidas");
        
        // Verificar si el video se cargó correctamente
        videoPlayer.addEventListener('loadeddata', () => {
            console.log("Video cargado correctamente");
        });
        
        videoPlayer.addEventListener('error', (e) => {
            console.error("Error al cargar el video:", e);
        });
        
        // Asegurar que el video esté pausado inicialmente
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
        
        console.log("Configurando evento para el botón de inicio");
        
        // Configurar evento para iniciar el juego (con evento directo y no delegado)
        if (startButton) {
            startButton.onclick = function() {
                console.log("Botón de inicio pulsado");
                startBossBattle();
            };
        } else {
            console.error("No se encontró el botón de inicio");
        }
        
        // Configurar evento de teclado para capturar las pulsaciones
        document.addEventListener('keydown', handleKeyPress);
        
        // Iniciar las animaciones de la pantalla de inicio con GSAP
        animateIntroScreen(gsap);
        
        // Monitor de rendimiento
        requestAnimationFrame(monitorPerformance);
        
    } catch (error) {
        console.error("Error al inicializar BatallaVaile:", error);
        container.innerHTML += `<div class="game-error">Error al cargar el juego: ${error.message}</div>`;
    }
}

// Animar la pantalla de introducción con GSAP
function animateIntroScreen(gsap) {
    const bossTitle = document.querySelector('.boss-title');
    const bossSubtitle = document.querySelector('.boss-subtitle');
    const startButton = document.getElementById('start-boss-battle');
    
    // Restaurar opacidad inicial
    gsap.set([bossTitle, bossSubtitle, startButton], { opacity: 0, y: 30 });
    
    // Crear una línea de tiempo para la secuencia de animación
    const timeline = gsap.timeline({ delay: 0.5 });
    
    timeline
        .to(bossTitle, { 
            opacity: 1, 
            y: 0, 
            duration: 1, 
            ease: "power3.out"
        })
        .to(bossSubtitle, { 
            opacity: 1, 
            y: 0, 
            duration: 0.8, 
            ease: "power2.out" 
        }, "-=0.3")
        .to(startButton, { 
            opacity: 1, 
            y: 0, 
            duration: 0.8, 
            ease: "back.out(1.7)" 
        }, "-=0.4");
    
    // Animación pulsante para el botón
    gsap.to(startButton, {
        scale: 1.05,
        repeat: -1,
        yoyo: true,
        duration: 1.2,
        ease: "power1.inOut"
    });
    
    // Animar las partículas de fondo
    initParticles();
}

// Iniciar partículas para efectos visuales
function initParticles() {
    const particleContainer = document.getElementById('particle-container');
    
    // Crear partículas iniciales
    for (let i = 0; i < 50; i++) {
        createParticle(particleContainer);
    }
    
    // Iniciar la animación de partículas
    animateParticles();
}

// Crear una partícula individual
function createParticle(container) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    // Propiedades aleatorias para cada partícula
    const size = Math.random() * 10 + 2; // Entre 2px y 12px
    const posX = Math.random() * 100; // Posición horizontal en porcentaje
    const posY = Math.random() * 100; // Posición vertical en porcentaje
    const opacity = Math.random() * 0.5 + 0.1; // Entre 0.1 y 0.6
    const duration = Math.random() * 15 + 5; // Entre 5s y 20s
    const delay = Math.random() * 5; // Retraso aleatorio hasta 5s
    
    // Aplicar estilos
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${posX}%`;
    particle.style.top = `${posY}%`;
    particle.style.opacity = opacity;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;
    
    // Guardar propiedades para animación
    particles.push({
        element: particle,
        x: posX,
        y: posY,
        size: size,
        speed: Math.random() * 0.5 + 0.1
    });
    
    // Añadir al contenedor
    container.appendChild(particle);
}

// Animar todas las partículas
function animateParticles() {
    if (!gameActive) {
        // Solo animar si el juego está activo o en la pantalla de inicio
        requestAnimationFrame(animateParticles);
        return;
    }
    
    particles.forEach(particle => {
        // Mover partículas suavemente
        particle.y -= particle.speed;
        
        // Reaparecer en la parte inferior cuando llega arriba
        if (particle.y < -10) {
            particle.y = 110;
            particle.x = Math.random() * 100;
        }
        
        // Actualizar posición en el DOM
        particle.element.style.top = `${particle.y}%`;
        particle.element.style.left = `${particle.x}%`;
    });
    
    requestAnimationFrame(animateParticles);
}

// Iniciar la batalla final (función mejorada)
function startBossBattle() {
    console.log("Iniciando batalla...");
    
    if (!gamePaused) {
        console.log("El juego ya está en marcha");
        return; // Evitar múltiples inicios
    }
    
    // Iniciar la música de fondo
    if (gameAudio) {
        gameAudio.volume = 0.6; // Volumen adecuado
        gameAudio.play().catch(error => {
            console.warn("Error al reproducir audio:", error);
        });
    }
    
    if (!window.gsap) {
        console.error("GSAP no está cargado");
        // Fallback básico si GSAP no está disponible
        document.getElementById('boss-intro').style.display = 'none';
        startBatallaVaileGame();
        return;
    }
    
    // Animar la desaparición de la pantalla de inicio con GSAP
    gsap.to('#boss-intro', {
        opacity: 0,
        y: -50,
        duration: 0.8,
        ease: "power2.in",
        onComplete: () => {
            const bossIntro = document.getElementById('boss-intro');
            if (bossIntro) {
                bossIntro.classList.remove('active');
                bossIntro.style.display = 'none'; // Asegurar que desaparece
                console.log("Pantalla de inicio removida");
            }
            startBatallaVaileGame();
        }
    });
    
    // Animar la aparición de los elementos del juego
    gsap.from('#key-overlay', {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.5,
        ease: "power2.out"
    });
    
    gsap.from('#boss-meter-container', {
        width: 0,
        opacity: 0,
        duration: 1.2,
        delay: 0.7,
        ease: "elastic.out(1, 0.75)"
    });
}

// Función para iniciar el juego (con debugging adicional)
function startBatallaVaileGame() {
    try {
        console.log("Iniciando el juego...");
        
        // Desactivar estado de pausa
        gamePaused = false;
        
        // Registrar tiempo de inicio
        gameStartTime = Date.now();
        
        // Establecer temporizador para la duración máxima del juego
        setupGameTimer();
        
        // Reproducir el video con manejo explícito de errores
        if (videoPlayer) {
            console.log("Iniciando reproducción de video...");
            videoPlayer.muted = true; // Video sin sonido para evitar problemas de reproducción automática
            
            videoPlayer.play().then(() => {
                console.log("Video reproduciendo correctamente");
                videoPlayer.style.display = 'block';
            }).catch(error => {
                console.error("Error al reproducir el video:", error);
                keyOverlay.innerHTML = "<div class='key-prompt error'>¡ERROR AL CARGAR VIDEO! Toca la pantalla para intentar nuevamente.</div>";
                
                // Agregar evento para volver a intentar reproduccir el video cuando el usuario toque la pantalla
                document.addEventListener('click', function retryVideo() {
                    videoPlayer.play().catch(e => console.error("Reintento fallido:", e));
                    document.removeEventListener('click', retryVideo);
                });
            });
        } else {
            console.error("No se encontró el elemento de video");
        }
        
        // Actualizamos el tamaño según la ventana
        updateVideoSize();
        
        // Inicializar variables del juego
        gameActive = true;
        activeKeys = [];
        score = 0;
        comboMultiplier = 1;
        consecutiveHits = 0;
        difficultyFactor = 1;
        updateScore();
        updateComboDisplay();
        updateBossProgress(0); // Inicializar barra de progreso
        
        // Asegurarse de que el video se ajusta cuando cambia el tamaño de la ventana
        window.addEventListener('resize', updateVideoSize);
        
        // Optimización: Escalonar la aparición de teclas iniciales
        setTimeout(() => {
            if (gameActive && !gamePaused) {
                console.log("Iniciando aparición de teclas");
                addKeysProgressively();
            }
        }, 1500);
        
        // Iniciar el aumento progresivo de dificultad
        startDifficultyProgression();
        
    } catch (error) {
        console.error("Error al iniciar el juego Batalla Vaile:", error);
        const container = document.getElementById('batallaVaile-container');
        if (container) {
            container.innerHTML += `<div class="game-error">Error en el juego: ${error.message}</div>`;
        }
    }
}

// Iniciar progresión de dificultad
function startDifficultyProgression() {
    const difficultyInterval = setInterval(() => {
        if (!gameActive || gamePaused) {
            clearInterval(difficultyInterval);
            return;
        }
        
        // Aumentar dificultad gradualmente hasta el máximo
        difficultyFactor = Math.min(MAX_DIFFICULTY, difficultyFactor + 0.1);
        
        // Añadir una tecla extra cuando se llega a ciertos umbrales de dificultad
        if (difficultyFactor >= 1.5 && activeKeys.length < 6) {
            addNewKey();
        }
        if (difficultyFactor >= 2.5 && activeKeys.length < 7) {
            addNewKey();
            addNewKey();
        }
        
    }, 10000); // Aumentar dificultad cada 10 segundos
}

// Monitor de rendimiento
function monitorPerformance(timestamp) {
    if (gameActive) {
        if (lastFrameTime) {
            const delta = timestamp - lastFrameTime;
            const fps = 1000 / delta;
            
            // Si FPS cae por debajo del umbral, reducir efectos visuales
            if (fps < fpsThreshold) {
                reduceVisualEffects();
            }
        }
        
        lastFrameTime = timestamp;
        requestAnimationFrame(monitorPerformance);
    }
}

// Reducir efectos visuales para mejorar rendimiento
function reduceVisualEffects() {
    document.documentElement.style.setProperty('--wave-size', '50px'); // Tamaño más pequeño para ondas
    document.documentElement.style.setProperty('--effect-opacity', '0.5'); // Menor opacidad
    fpsThreshold = 20; // Bajar aún más el umbral para evitar cambios constantes
}

// Función para actualizar el tamaño del video cuando cambia la ventana
function updateVideoSize() {
    if (videoPlayer) {
        // Asegurar que el video ocupe toda la pantalla
        const videoContainer = document.getElementById('video-container');
        if (videoContainer) {
            videoContainer.style.width = '100%';
            videoContainer.style.height = '100%';
        }
        
        // Asegurarse que el video está visible y con el modo de mezcla correcto
        videoPlayer.style.display = 'block';
        videoPlayer.style.mixBlendMode = 'screen';
    }
}

// Añadir teclas de forma progresiva para evitar picos de CPU
function addKeysProgressively() {
    if (!gameActive || gamePaused) return;
    
    const initialCount = Math.min(3, MAX_ACTIVE_KEYS); // Comenzar con 3 teclas o menos
    
    const addKey = (index) => {
        if (index < initialCount && gameActive && !gamePaused) {
            addNewKey();
            setTimeout(() => addKey(index + 1), 300);
        }
    };
    
    addKey(0);
}

// Agregar una nueva tecla al tablero usando patrones lógicos
function addNewKey() {
    if (!gameActive || gamePaused) return;
    
    // Seleccionar una tecla siguiendo un patrón lógico
    const randomKey = getNextKeyFromPattern();
    const keyId = 'key-' + Date.now() + Math.floor(Math.random() * 1000);
    
    // Crear un elemento para la tecla
    const keyElement = document.createElement('div');
    keyElement.classList.add('key-prompt');
    keyElement.setAttribute('data-key', randomKey);
    
    // Crear el contenedor interno
    const keyInner = document.createElement('span');
    keyInner.textContent = randomKey;
    keyElement.appendChild(keyInner);
    
    // Posicionar según el patrón (más organizado, menos aleatorio)
    keyElement.style.position = 'absolute';
    
    // Si estamos en modo arcoiris, posicionar de manera más organizada
    if (currentKeyPattern.type === 'rainbow') {
        // Distribuir en una forma más visual basada en el teclado
        const rowIndex = currentKeyPattern.rainbowGroup;
        const colIndex = currentKeyPattern.rainbow;
        keyElement.style.left = (10 + colIndex * 10) + '%';
        keyElement.style.top = (20 + rowIndex * 20) + '%';
    } else {
        // Para otros patrones, distribuir más ordenadamente
        const index = currentKeyPattern.index;
        const row = Math.floor(index / 5);
        const col = index % 5;
        keyElement.style.left = (10 + col * 18) + '%';
        keyElement.style.top = (20 + row * 18) + '%';
    }
    
    // Añadir animación de entrada según nivel de dificultad
    let animationDuration = 0.5 / difficultyFactor; // Más rápido con mayor dificultad
    keyElement.style.animation = `keyAppear ${animationDuration}s forwards`;
    
    // Añadir la tecla al DOM
    keyOverlay.appendChild(keyElement);
    
    // Guardar la referencia de la tecla activa
    activeKeys.push({
        id: keyId,
        key: randomKey,
        element: keyElement,
        timestamp: Date.now(),
        // Hacer que las teclas "expiren" más rápido con mayor dificultad
        expiryTime: Date.now() + (5000 / difficultyFactor)
    });
    
    // Comprobar periódicamente teclas caducadas
    checkExpiredKeys();
}

// Obtener la siguiente tecla según un patrón lógico
function getNextKeyFromPattern() {
    // Cada 20-30 teclas, cambiar el patrón para mantener el juego interesante
    if (Math.random() < 0.05 || currentKeyPattern.index >= 25) {
        switchToRandomPattern();
    }
    
    let selectedKey;
    
    switch(currentKeyPattern.type) {
        case 'topRow':
            selectedKey = KEY_PATTERNS.topRow[currentKeyPattern.index % KEY_PATTERNS.topRow.length];
            currentKeyPattern.index++;
            break;
            
        case 'middleRow':
            selectedKey = KEY_PATTERNS.middleRow[currentKeyPattern.index % KEY_PATTERNS.middleRow.length];
            currentKeyPattern.index++;
            break;
            
        case 'bottomRow':
            selectedKey = KEY_PATTERNS.bottomRow[currentKeyPattern.index % KEY_PATTERNS.bottomRow.length];
            currentKeyPattern.index++;
            break;
            
        case 'vowels':
            selectedKey = KEY_PATTERNS.vowels[currentKeyPattern.index % KEY_PATTERNS.vowels.length];
            currentKeyPattern.index++;
            break;
            
        case 'rainbow':
            // Manejar el patrón arcoiris especialmente
            const rainbowGroup = KEY_PATTERNS.rainbow[currentKeyPattern.rainbow];
            if (currentKeyPattern.rainbowGroup >= rainbowGroup.length) {
                // Pasar al siguiente grupo del arcoiris
                currentKeyPattern.rainbow = (currentKeyPattern.rainbow + 1) % KEY_PATTERNS.rainbow.length;
                currentKeyPattern.rainbowGroup = 0;
                return getNextKeyFromPattern(); // Recursivo para obtener la siguiente tecla
            }
            
            selectedKey = rainbowGroup[currentKeyPattern.rainbowGroup];
            currentKeyPattern.rainbowGroup++;
            break;
            
        case 'easy':
        default:
            selectedKey = KEY_PATTERNS.easy[currentKeyPattern.index % KEY_PATTERNS.easy.length];
            currentKeyPattern.index++;
            break;
    }
    
    return selectedKey;
}

// Cambiar a un patrón aleatorio
function switchToRandomPattern() {
    const patterns = ['topRow', 'middleRow', 'bottomRow', 'vowels', 'rainbow', 'easy'];
    const newPattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    // Resetear índices
    currentKeyPattern = {
        type: newPattern,
        index: 0,
        rainbow: 0,
        rainbowGroup: 0
    };
    
    console.log(`Cambiando a patrón de teclas: ${newPattern}`);
    
    // Mostrar un mensaje al jugador sobre el cambio de patrón
    showPatternChangeMessage(newPattern);
}

// Mostrar mensaje sobre cambio de patrón
function showPatternChangeMessage(patternType) {
    let message;
    
    switch(patternType) {
        case 'topRow': message = "¡FILA SUPERIOR!"; break;
        case 'middleRow': message = "¡FILA CENTRAL!"; break;
        case 'bottomRow': message = "¡FILA INFERIOR!"; break;
        case 'vowels': message = "¡VOCALES!"; break;
        case 'rainbow': message = "¡ARCOIRIS!"; break;
        case 'easy': message = "¡TECLAS FÁCILES!"; break;
        default: message = "¡NUEVO PATRÓN!";
    }
    
    showHitFeedback(message, null, false, true);
}

// Comprobar teclas que han expirado
function checkExpiredKeys() {
    if (!gameActive || gamePaused) return;
    
    const now = Date.now();
    let expiredFound = false;
    
    // Comprobar cada tecla activa
    for (let i = activeKeys.length - 1; i >= 0; i--) {
        if (now > activeKeys[i].expiryTime) {
            // La tecla ha expirado, eliminarla y penalizar
            const keyElement = activeKeys[i].element;
            keyElement.classList.add('key-expired');
            
            setTimeout(() => {
                if (keyElement && keyElement.parentNode) {
                    keyElement.parentNode.removeChild(keyElement);
                }
            }, 500);
            
            activeKeys.splice(i, 1);
            resetCombo(); // Romper el combo como penalización
            showHitFeedback('¡TIEMPO AGOTADO!', null, true);
            expiredFound = true;
            
            // Añadir una nueva tecla para reemplazar la caducada
            setTimeout(addNewKey, 500);
        }
    }
    
    // Efecto de daño si alguna tecla ha expirado
    if (expiredFound) {
        applyDamageEffect();
    }
    
    // Programar próxima comprobación
    if (gameActive && !gamePaused) {
        setTimeout(checkExpiredKeys, 1000);
    }
}

// Aplicar efecto visual de daño
function applyDamageEffect() {
    const container = document.getElementById('batallaVaile-container');
    container.classList.add('damage-effect');
    
    setTimeout(() => {
        container.classList.remove('damage-effect');
    }, 300);
}

// Manejar las pulsaciones de teclas
function handleKeyPress(event) {
    if (!gameActive || activeKeys.length === 0 || gamePaused) return;
    
    let keyPressed = event.key.toUpperCase();
    
    // Buscar si la tecla presionada coincide con alguna activa
    for (let i = 0; i < activeKeys.length; i++) {
        if (activeKeys[i].key === keyPressed) {
            const keyElement = activeKeys[i].element;
            const keyTimestamp = activeKeys[i].timestamp;
            const reactionTime = Date.now() - keyTimestamp;
            
            // Mostrar efecto visual de éxito
            keyElement.classList.add('key-correct');
            
            // Crear un seguimiento de explosión donde estaba la tecla
            createKeyTrackingEffect(keyElement, keyPressed);
            
            // Incrementar combo
            consecutiveHits++;
            updateComboMultiplier();
            
            // Calcular puntos basados en tiempo de reacción, multiplicador y dificultad
            let points = Math.max(50, 200 - Math.floor(reactionTime / 50)) * comboMultiplier * difficultyFactor;
            points = Math.floor(points);
            score += points;
            updateScore();
            
            // Actualizar barra de progreso del boss
            const progress = Math.min(1, score / 10000); // 10000 puntos para completar
            updateBossProgress(progress);
            
            // Mostrar feedback visual de puntos ganados
            showHitFeedback(`+${points}`, keyElement);
            
            // Eliminar la tecla con una animación
            setTimeout(() => {
                if (keyElement && keyElement.parentNode) {
                    keyElement.style.animation = 'keyVanish 0.3s forwards';
                    setTimeout(() => {
                        if (keyElement && keyElement.parentNode) {
                            keyElement.parentNode.removeChild(keyElement);
                        }
                    }, 300);
                }
                
                // Eliminar la tecla del array de teclas activas
                activeKeys.splice(i, 1);
                
                // Añadir una nueva tecla después de un breve retraso
                setTimeout(() => {
                    if (gameActive && !gamePaused) {
                        addNewKey();
                    }
                }, Math.random() * 300 / difficultyFactor);
            }, 200);
            
            // Salir del bucle una vez que encontramos una coincidencia
            return;
        }
    }
    
    // Si llegamos aquí es porque la tecla presionada no coincide con ninguna activa
    // Penalizar rompiendo el combo
    resetCombo();
    showHitFeedback('¡FALLO!', null, true);
    applyDamageEffect();
}

// Crear efecto visual de seguimiento cuando se acierta una tecla
function createKeyTrackingEffect(keyElement, keyText) {
    const rect = keyElement.getBoundingClientRect();
    const overlayEffects = document.getElementById('overlay-effects');
    
    // Crear un elemento para el efecto
    const effectElement = document.createElement('div');
    effectElement.classList.add('key-hit-effect');
    effectElement.style.left = (rect.left + rect.width / 2) + 'px';
    effectElement.style.top = (rect.top + rect.height / 2) + 'px';
    
    // Crear elemento interno para ondas
    const waveElement = document.createElement('div');
    waveElement.classList.add('hit-wave');
    effectElement.appendChild(waveElement);
    
    // Crear elemento para mostrar la tecla
    const keyIndicator = document.createElement('div');
    keyIndicator.classList.add('hit-key-indicator');
    keyIndicator.textContent = keyText;
    effectElement.appendChild(keyIndicator);
    
    overlayEffects.appendChild(effectElement);
    
    // Eliminar después de la animación
    setTimeout(() => {
        if (effectElement.parentNode) {
            effectElement.parentNode.removeChild(effectElement);
        }
    }, 2000);
}

// Actualizar la barra de progreso del boss
function updateBossProgress(progress) {
    const bossBar = document.getElementById('boss-meter-bar');
    
    if (bossBar) {
        const progressPercent = Math.min(100, progress * 100);
        bossBar.style.width = `${progressPercent}%`;
        
        // Cambiar color según el progreso
        if (progressPercent < 30) {
            bossBar.style.backgroundColor = '#ff5252';
        } else if (progressPercent < 70) {
            bossBar.style.backgroundColor = '#ffc107';
        } else {
            bossBar.style.backgroundColor = '#4caf50';
        }
        
        // Si alcanzamos el 100%, mostrar mensaje de victoria
        if (progressPercent >= 100) {
            showVictoryMessage();
        }
    }
}

// Mostrar mensaje de victoria
function showVictoryMessage() {
    // Evitar múltiples mensajes de victoria
    if (document.getElementById('victory-message')) return;
    
    const victoryElement = document.createElement('div');
    victoryElement.id = 'victory-message';
    victoryElement.innerHTML = `
        <div class="victory-title">¡VICTORIA!</div>
        <div class="victory-score">Puntuación final: ${score}</div>
        <div class="victory-time">Tiempo: ${Math.floor((Date.now() - gameStartTime) / 1000)}s</div>
        <div class="victory-combo">Combo máximo: ${consecutiveHits}</div>
    `;
    
    document.getElementById('batallaVaile-container').appendChild(victoryElement);
    
    // Desactivar más interacciones
    gamePaused = true;
    
    // Animar con GSAP si está disponible
    if (window.gsap) {
        const gsap = window.gsap;
        gsap.from(victoryElement, {
            y: -100,
            opacity: 0,
            duration: 1,
            ease: "bounce.out"
        });
        
        // Hacer aparecer cada línea secuencialmente
        const lines = victoryElement.querySelectorAll('div');
        gsap.fromTo(lines, 
            {opacity: 0, y: 20},
            {opacity: 1, y: 0, stagger: 0.2, delay: 0.5, duration: 0.8}
        );
    }
}

// Configurar el temporizador para la duración máxima del juego
function setupGameTimer() {
    let timeRemaining = GAME_MAX_DURATION;
    updateTimeDisplay(timeRemaining);
    
    gameEndTimer = setInterval(() => {
        timeRemaining--;
        updateTimeDisplay(timeRemaining);
        
        if (timeRemaining <= 0) {
            clearInterval(gameEndTimer);
            endGame(true); // El juego termina por tiempo
        }
    }, 1000);
}

// Actualizar el display de tiempo
function updateTimeDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timeRemainingEl.textContent = `Tiempo: ${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    // Efecto visual cuando queda poco tiempo
    if (seconds <= 30) {
        timeRemainingEl.classList.add('time-warning');
    }
}

// Terminar el juego (ya sea por victoria o por tiempo)
function endGame(byTimeout = false) {
    if (!gameActive) return;
    
    if (byTimeout) {
        // Si el juego termina por tiempo y hay buena puntuación, mostrar victoria
        if (score >= 7500) {
            showVictoryMessage();
        } else {
            // Mostrar mensaje de tiempo agotado
            showTimeoutMessage();
        }
    }
    
    // Desactivar mecánicas de juego
    gamePaused = true;
    gameActive = false;
    
    // Limpiar los intervalos y timers
    clearInterval(gameEndTimer);
}

// Mostrar mensaje cuando se agota el tiempo
function showTimeoutMessage() {
    const timeoutElement = document.createElement('div');
    timeoutElement.id = 'timeout-message';
    timeoutElement.innerHTML = `
        <div class="timeout-title">¡TIEMPO AGOTADO!</div>
        <div class="timeout-score">Puntuación: ${score}</div>
        <div class="timeout-combo">Combo máximo: ${consecutiveHits}</div>
    `;
    
    document.getElementById('batallaVaile-container').appendChild(timeoutElement);
    
    // Animar con GSAP si está disponible
    if (window.gsap) {
        animateEndingMessage(timeoutElement);
    }
}

// Animar mensaje final con GSAP
function animateEndingMessage(element) {
    const gsap = window.gsap;
    gsap.from(element, {
        y: -100,
        opacity: 0,
        duration: 1,
        ease: "bounce.out"
    });
    
    // Hacer aparecer cada línea secuencialmente
    const lines = element.querySelectorAll('div');
    gsap.fromTo(lines, 
        {opacity: 0, y: 20},
        {opacity: 1, y: 0, stagger: 0.2, delay: 0.5, duration: 0.8}
    );
}

// Actualizar el multiplicador de combo
function updateComboMultiplier() {
    if (consecutiveHits >= 30) {
        comboMultiplier = 8;
    } else if (consecutiveHits >= 20) {
        comboMultiplier = 4;
    } else if (consecutiveHits >= 10) {
        comboMultiplier = 2;
    } else {
        comboMultiplier = 1;
    }
    
    updateComboDisplay();
    
    // Si alcanza un combo especial, reproducir sonido
    if (consecutiveHits === 10 || consecutiveHits === 20 || consecutiveHits === 30) {
        playSoundEffect('combo');
        
        // Mostrar efecto visual épico de combo
        const comboElement = document.getElementById('combo-display');
        comboElement.classList.add('combo-highlight');
        setTimeout(() => {
            comboElement.classList.remove('combo-highlight');
        }, 1000);
    }
}

// Resetear el combo cuando se falla
function resetCombo() {
    if (consecutiveHits > 5) { // Solo mostrar feedback si tenía un buen combo
        showHitFeedback(`¡COMBO PERDIDO: ${consecutiveHits}!`, null, true);
    }
    consecutiveHits = 0;
    comboMultiplier = 1;
    updateComboDisplay();
}

// Actualizar el display de combo
function updateComboDisplay() {
    const comboText = consecutiveHits > 1 ? `¡COMBO x${consecutiveHits}!` : 'COMBO: x1';
    comboDisplay.textContent = comboText;
    comboDisplay.className = '';
    
    if (comboMultiplier >= 8) {
        comboDisplay.classList.add('mega-combo');
    } else if (comboMultiplier >= 4) {
        comboDisplay.classList.add('ultra-combo');
    } else if (comboMultiplier >= 2) {
        comboDisplay.classList.add('super-combo');
    }
}

// Actualizar la puntuación en pantalla
function updateScore() {
    scoreDisplay.textContent = `Puntuación: ${score}`;
}

// Mostrar feedback visual cuando se acierta una tecla (con opción para destacado)
function showHitFeedback(text, sourceElement, isError = false, isHighlight = false) {
    const feedbackElement = document.createElement('div');
    feedbackElement.classList.add('hit-feedback');
    
    if (isError) {
        feedbackElement.classList.add('error-feedback');
    }
    
    if (isHighlight) {
        feedbackElement.classList.add('highlight-feedback');
    }
    
    feedbackElement.textContent = text;
    
    if (sourceElement) {
        const rect = sourceElement.getBoundingClientRect();
        feedbackElement.style.left = `${rect.left + rect.width / 2}px`;
        feedbackElement.style.top = `${rect.top}px`;
    } else {
        feedbackElement.style.left = '50%';
        feedbackElement.style.top = '50%';
        feedbackElement.style.transform = 'translate(-50%, -50%)';
    }
    
    hitFeedbackElement.appendChild(feedbackElement);
    
    setTimeout(() => {
        if (feedbackElement.parentNode) {
            feedbackElement.parentNode.removeChild(feedbackElement);
        }
    }, 1000);
}

// Función de limpieza mejorada
function cleanupBatallaVaileGame() {
    // Detener el juego
    gameActive = false;
    gamePaused = true;
    
    // Limpiar el temporizador del juego
    if (gameEndTimer) {
        clearInterval(gameEndTimer);
        gameEndTimer = null;
    }
    
    // Detener audio
    if (gameAudio) {
        gameAudio.pause();
        gameAudio.currentTime = 0;
    }
    
    // Limpiar todas las teclas activas
    activeKeys.forEach(keyInfo => {
        if (keyInfo.element && keyInfo.element.parentNode) {
            keyInfo.element.parentNode.removeChild(keyInfo.element);
        }
    });
    activeKeys = [];
    
    // Limpiar todos los efectos de animación restantes
    const overlayEffects = document.getElementById('overlay-effects');
    if (overlayEffects) {
        overlayEffects.innerHTML = '';
    }
    
    // Limpiar todos los feedback visuales
    const hitFeedback = document.getElementById('hit-feedback');
    if (hitFeedback) {
        hitFeedback.innerHTML = '';
    }
    
    // Detener el video
    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
        videoPlayer.src = ''; // Liberar memoria del video
    }
    
    // Eliminar el evento de teclado
    document.removeEventListener('keydown', handleKeyPress);
    
    // Eliminar el evento de redimensionado
    window.removeEventListener('resize', updateVideoSize);
    
    // Limpiar partículas
    particles.forEach(particle => {
        if (particle.element && particle.element.parentNode) {
            particle.element.parentNode.removeChild(particle.element);
        }
    });
    particles = [];
    
    console.log("Limpieza del juego Batalla Vaile completada");
}

// Manejar la carga de un video personalizado
function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Crear una URL para el archivo seleccionado
        const videoURL = URL.createObjectURL(file);
        
        // Actualizar la fuente del video
        videoPlayer.src = videoURL;
        videoPlayer.load();
        videoPlayer.play().catch(error => {
            console.error("Error al reproducir el video:", error);
        });
        
        customVideo = true;
        
        // Mostrar mensaje de éxito
        showHitFeedback(`¡Video cargado: ${file.name}!`, null, false);
    }
}

// Función para alternar entre pausa y reanudación
function togglePause() {
    if (!gameActive) return;
    
    if (gamePaused) {
        // Reanudar el juego
        gamePaused = false;
        if (videoPlayer) videoPlayer.play();
        
        // Mostrar mensaje
        showHitFeedback("¡JUEGO REANUDADO!", null);
    } else {
        // Pausar el juego
        gamePaused = true;
        if (videoPlayer) videoPlayer.pause();
        
        // Mostrar mensaje de pausa
        const pauseElement = document.createElement('div');
        pauseElement.id = 'pause-message';
        pauseElement.innerHTML = `
            <div class="pause-title">JUEGO PAUSADO</div>
            <div class="pause-subtitle">Presiona ESC para continuar</div>
        `;
        
        // Estilo del mensaje de pausa
        pauseElement.style.position = 'fixed';
        pauseElement.style.top = '50%';
        pauseElement.style.left = '50%';
        pauseElement.style.transform = 'translate(-50%, -50%)';
        pauseElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        pauseElement.style.color = 'white';
        pauseElement.style.padding = '30px';
        pauseElement.style.borderRadius = '15px';
        pauseElement.style.textAlign = 'center';
        pauseElement.style.zIndex = '1000';
        
        document.getElementById('batallaVaile-container').appendChild(pauseElement);
    }
    
    // Si el juego se reanuda, eliminar mensaje de pausa
    if (!gamePaused) {
        const pauseMessage = document.getElementById('pause-message');
        if (pauseMessage) pauseMessage.remove();
    }
}
