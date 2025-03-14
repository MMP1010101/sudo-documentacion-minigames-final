// Variables globales del juego Guitar Hero
let guitarGame = {
    gameContainer: null,
    lanes: 4,                   // Número de carriles
    noteSpeed: 7,               // Velocidad de caída de notas (reducida de 8 a 7)
    noteFrequency: 550,         // Frecuencia de generación de notas (ms) (más lento, era 400)
    score: 0,                   // Puntuación
    laneElements: [],           // Elementos DOM de los carriles
    keyBindings: ['a', 's', 'd', 'f'], // Teclas para cada carril
    activeNotes: [],            // Notas actualmente en pantalla
    noteInterval: null,         // Intervalo para generar notas
    animationId: null,          // ID para la animación
    colors: ['#f44336', '#2196f3', '#4caf50', '#ff9800'], // Colores para cada carril
    audioContext: null,         // Contexto de audio
    noteHitSound: null,         // Sonido al acertar una nota
    noteMissSound: null,        // Sonido al fallar una nota
    combo: 0,                   // Contador de combo
    maxCombo: 0,                // Combo máximo conseguido
    difficultyLevel: 1,         // Nivel de dificultad inicial
    difficultyIncrease: 0,      // Contador para aumento de dificultad
    patternMode: false,         // Determina si estamos en modo de patrón
    gameDuration: 15,           // Duración del juego en segundos
    gameStartTime: 0,           // Tiempo de inicio del juego
    finalCountdown: false,      // Indicador de cuenta regresiva final
    difficultyStages: [         // Etapas de dificultad basadas en el tiempo transcurrido
        { time: 5, level: 2 },  // Nivel 2 a los 5 segundos
        { time: 10, level: 3 }, // Nivel 3 a los 10 segundos
        { time: 14, level: 4 }  // Nivel 4 al final (14 segundos)
    ]
};

// Inicializar el juego Guitar Hero
function initGuitarGame(container) {
    guitarGame.gameContainer = container;
    guitarGame.score = 0;
    guitarGame.activeNotes = [];
    guitarGame.combo = 0;
    guitarGame.maxCombo = 0;
    
    // Reiniciar variables de dificultad - Aceleradas para partida corta
    guitarGame.difficultyLevel = 1;
    guitarGame.difficultyIncrease = 0;
    guitarGame.patternMode = false;
    guitarGame.gameStartTime = Date.now();
    guitarGame.finalCountdown = false;
    
    // Crear estructura del juego
    createGameStructure();
    
    // Configurar audio
    setupAudio();
    
    // Iniciar la generación de notas
    guitarGame.noteInterval = setInterval(createRandomNote, guitarGame.noteFrequency);
    
    // Iniciar el bucle de animación
    guitarGame.animationId = requestAnimationFrame(updateGame);
    
    // Añadir eventos de teclado
    window.addEventListener('keydown', handleKeyPress);
}

// Limpiar juego cuando cambiamos a otro
function cleanupGuitarGame() {
    // Detener generación de notas y animación
    clearInterval(guitarGame.noteInterval);
    cancelAnimationFrame(guitarGame.animationId);
    
    // Eliminar eventos
    window.removeEventListener('keydown', handleKeyPress);
    
    // Cerrar contexto de audio si existe
    if (guitarGame.audioContext) {
        guitarGame.audioContext.close().catch(e => console.error("Error cerrando AudioContext", e));
    }
}

// Crear la estructura DOM del juego
function createGameStructure() {
    // Contenedor de puntuación y combo
    const scoreContainer = document.createElement('div');
    scoreContainer.className = 'guitar-score';
    scoreContainer.innerHTML = `
        <div class="score-section">Puntuación: <span id="guitar-score-value">0</span></div>
        <div class="combo-section">Combo: <span id="guitar-combo-value">0</span> | Máx: <span id="guitar-max-combo-value">0</span></div>
    `;
    guitarGame.gameContainer.appendChild(scoreContainer);
    
    // Contenedor de indicación de teclas
    const keysHint = document.createElement('div');
    keysHint.className = 'guitar-keys-hint';
    keysHint.innerHTML = `¡ROCK ON! Usa las teclas: ${guitarGame.keyBindings.join(', ')}`;
    guitarGame.gameContainer.appendChild(keysHint);
    
    // Contenedor principal del juego
    const gameField = document.createElement('div');
    gameField.className = 'guitar-game-field';
    guitarGame.gameContainer.appendChild(gameField);
    
    // Crear los carriles
    for (let i = 0; i < guitarGame.lanes; i++) {
        const lane = document.createElement('div');
        lane.className = 'guitar-lane';
        lane.style.backgroundColor = guitarGame.colors[i] + '33'; // Color con transparencia
        
        // Crear el botón receptor al final del carril
        const receptor = document.createElement('div');
        receptor.className = 'guitar-receptor';
        receptor.style.backgroundColor = guitarGame.colors[i];
        receptor.dataset.lane = i;
        receptor.textContent = guitarGame.keyBindings[i].toUpperCase();
        lane.appendChild(receptor);
        
        gameField.appendChild(lane);
        guitarGame.laneElements.push(lane);
    }
}

// Configurar el sistema de audio
function setupAudio() {
    try {
        // Verificar si AudioContext está disponible
        if (window.AudioContext || window.webkitAudioContext) {
            guitarGame.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Sonido al acertar
            guitarGame.noteHitSound = {
                play: function() {
                    try {
                        const oscillator = guitarGame.audioContext.createOscillator();
                        const gainNode = guitarGame.audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(guitarGame.audioContext.destination);
                        
                        oscillator.type = 'sine';
                        oscillator.frequency.setValueAtTime(440 + Math.random() * 200, guitarGame.audioContext.currentTime);
                        gainNode.gain.setValueAtTime(0.1, guitarGame.audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.001, guitarGame.audioContext.currentTime + 0.5);
                        
                        oscillator.start();
                        oscillator.stop(guitarGame.audioContext.currentTime + 0.5);
                    } catch (e) {
                        console.warn("No se pudo reproducir el sonido de acierto:", e);
                    }
                }
            };
            
            // Sonido al fallar
            guitarGame.noteMissSound = {
                play: function() {
                    try {
                        const oscillator = guitarGame.audioContext.createOscillator();
                        const gainNode = guitarGame.audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(guitarGame.audioContext.destination);
                        
                        oscillator.type = 'sawtooth';
                        oscillator.frequency.setValueAtTime(100, guitarGame.audioContext.currentTime);
                        gainNode.gain.setValueAtTime(0.1, guitarGame.audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.001, guitarGame.audioContext.currentTime + 0.3);
                        
                        oscillator.start();
                        oscillator.stop(guitarGame.audioContext.currentTime + 0.3);
                    } catch (e) {
                        console.warn("No se pudo reproducir el sonido de fallo:", e);
                    }
                }
            };
        } else {
            console.warn("Web Audio API no soportada en este navegador");
        }
    } catch (e) {
        console.error("Error al configurar el audio:", e);
    }
}

// Crear una nota aleatoria
function createRandomNote() {
    // Verificar el tiempo transcurrido para ajustar la dificultad
    const elapsedSeconds = (Date.now() - guitarGame.gameStartTime) / 1000;
    
    // Actualizar el nivel de dificultad basado en el tiempo transcurrido
    updateDifficultyByTime(elapsedSeconds);
    
    // Si quedan menos de 3 segundos, mostrar cuenta regresiva final
    if (elapsedSeconds >= guitarGame.gameDuration - 3 && !guitarGame.finalCountdown) {
        guitarGame.finalCountdown = true;
        showFinalCountdown();
    }
    
    // Probabilidad de patrones basada en el nivel de dificultad (reducida)
    const patternChance = (guitarGame.difficultyLevel - 1) * 0.1; // 10% por nivel a partir del nivel 2
    if (guitarGame.difficultyLevel > 1 && !guitarGame.patternMode && Math.random() < patternChance) {
        guitarGame.patternMode = true;
        generateNotePattern();
        return;
    }
    
    // Probabilidad de notas dobles basada en el nivel de dificultad (reducida)
    const doubleChance = (guitarGame.difficultyLevel - 1) * 0.07; // 7% por nivel a partir del nivel 2
    if (guitarGame.difficultyLevel > 1 && Math.random() < doubleChance) {
        generateDoubleNote();
        return;
    }
    
    // Generación de nota normal
    const laneIndex = Math.floor(Math.random() * guitarGame.lanes);
    generateNote(laneIndex);
}

// Generar una nota en un carril específico
function generateNote(laneIndex) {
    const lane = guitarGame.laneElements[laneIndex];
    
    // Crear elemento de nota
    const note = document.createElement('div');
    note.className = 'guitar-note';
    note.style.backgroundColor = guitarGame.colors[laneIndex];
    note.dataset.lane = laneIndex;
    note.style.top = '-50px'; // Comienza fuera de la pantalla
    lane.appendChild(note);
    
    // Añadir a las notas activas
    guitarGame.activeNotes.push({
        element: note,
        lane: laneIndex,
        position: -50,
        hit: false
    });
}

// Generar notas dobles (en 2 carriles diferentes simultáneamente)
function generateDoubleNote() {
    // Elegir dos carriles diferentes
    let lane1 = Math.floor(Math.random() * guitarGame.lanes);
    let lane2;
    
    do {
        lane2 = Math.floor(Math.random() * guitarGame.lanes);
    } while (lane1 === lane2);
    
    // Generar nota en cada carril
    generateNote(lane1);
    generateNote(lane2);
}

// Generar un patrón de notas (secuencia rápida en carriles diferentes)
function generateNotePattern() {
    // Reducir el número de notas en el patrón
    const patternLength = 2 + Math.min(guitarGame.difficultyLevel - 1, 2);
    let delay = 150; // Primera nota aparece después de 150ms (antes 100ms)
    
    for (let i = 0; i < patternLength; i++) {
        setTimeout(() => {
            const laneIndex = Math.floor(Math.random() * guitarGame.lanes);
            generateNote(laneIndex);
            
            // Si es la última nota del patrón, desactivar modo patrón
            if (i === patternLength - 1) {
                guitarGame.patternMode = false;
            }
        }, delay);
        
        delay += 180; // Incrementar el retraso para cada nota siguiente (era 150ms)
    }
}

// Mostrar mensaje de aumento de dificultad
function showDifficultyIncrease() {
    const difficultyMessage = document.createElement('div');
    difficultyMessage.className = 'guitar-difficulty-message';
    difficultyMessage.textContent = `¡NIVEL ${guitarGame.difficultyLevel}!`;
    
    guitarGame.gameContainer.appendChild(difficultyMessage);
    
    // Eliminar mensaje después de la animación
    setTimeout(() => {
        difficultyMessage.remove();
    }, 1200); // Reducido a 1.2 segundos para no obstruir tanto
}

// Actualizar la dificultad basada en el tiempo transcurrido
function updateDifficultyByTime(elapsedSeconds) {
    // Buscar la etapa de dificultad actual
    for (let i = guitarGame.difficultyStages.length - 1; i >= 0; i--) {
        if (elapsedSeconds >= guitarGame.difficultyStages[i].time && 
            guitarGame.difficultyLevel < guitarGame.difficultyStages[i].level) {
            
            // Actualizar al nuevo nivel
            guitarGame.difficultyLevel = guitarGame.difficultyStages[i].level;
            
            // Ajustar la velocidad de generación de notas (más suave)
            const newFrequency = Math.max(550 - (guitarGame.difficultyLevel - 1) * 50, 350);
            
            // Actualizar intervalo solo si la frecuencia cambió
            if (newFrequency !== guitarGame.noteFrequency) {
                clearInterval(guitarGame.noteInterval);
                guitarGame.noteFrequency = newFrequency;
                guitarGame.noteInterval = setInterval(createRandomNote, guitarGame.noteFrequency);
                
                // Mostrar mensaje de aumento de dificultad
                showDifficultyIncrease();
            }
            
            break;
        }
    }
}

// Mostrar cuenta regresiva final
function showFinalCountdown() {
    const countdownElement = document.createElement('div');
    countdownElement.className = 'guitar-final-countdown';
    countdownElement.innerHTML = '¡ÚLTIMOS <span>3</span> SEGUNDOS!';
    
    guitarGame.gameContainer.appendChild(countdownElement);
    
    // Efecto de urgencia en el fondo
    const gameField = document.querySelector('.guitar-game-field');
    if (gameField) {
        gameField.classList.add('urgent');
    }
    
    // Actualizar la cuenta regresiva
    let secondsLeft = 3;
    const countdownSpan = countdownElement.querySelector('span');
    
    const countdownTimer = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
            if (countdownSpan) countdownSpan.textContent = secondsLeft;
        } else {
            clearInterval(countdownTimer);
            countdownElement.innerHTML = '¡TIEMPO!';
            setTimeout(() => {
                countdownElement.remove();
            }, 500);
        }
    }, 1000);
    
    // Eliminar el elemento después de la cuenta regresiva
    setTimeout(() => {
        countdownElement.remove();
        if (gameField) {
            gameField.classList.remove('urgent');
        }
    }, 3500);
}

// Actualizar el juego en cada frame
function updateGame() {
    // Mover todas las notas hacia abajo
    for (let i = guitarGame.activeNotes.length - 1; i >= 0; i--) {
        const note = guitarGame.activeNotes[i];
        
        // Actualizar posición
        note.position += guitarGame.noteSpeed;
        note.element.style.top = note.position + 'px';
        
        // Verificar si la nota ha salido de la pantalla
        if (note.position > guitarGame.laneElements[0].clientHeight && !note.hit) {
            // Nota perdida
            note.element.remove();
            guitarGame.activeNotes.splice(i, 1);
            
            // Reducir puntuación si no fue golpeada
            guitarGame.score = Math.max(0, guitarGame.score - 5);
            updateScore();
            
            // Reproducir sonido de fallo
            if (guitarGame.noteMissSound) guitarGame.noteMissSound.play();
        }
    }
    
    // Continuar el bucle
    guitarGame.animationId = requestAnimationFrame(updateGame);
}

// Manejar pulsaciones de teclas
function handleKeyPress(event) {
    const key = event.key.toLowerCase();
    const laneIndex = guitarGame.keyBindings.indexOf(key);
    
    // Si la tecla no corresponde a ningún carril, ignorar
    if (laneIndex === -1) return;
    
    // Resaltar visualmente el receptor al pulsar la tecla
    const receptor = guitarGame.laneElements[laneIndex].querySelector('.guitar-receptor');
    receptor.classList.add('active');
    
    // Añadir efecto de onda expansiva
    const ripple = document.createElement('div');
    ripple.className = 'guitar-ripple';
    receptor.appendChild(ripple);
    
    setTimeout(() => {
        receptor.classList.remove('active');
        ripple.remove();
    }, 300);
    
    // Buscar notas en la zona de golpeo (zona ampliada)
    let hitSuccessful = false;
    const hitZoneStart = guitarGame.laneElements[0].clientHeight - 130; // Ampliada (antes 100)
    const hitZoneEnd = guitarGame.laneElements[0].clientHeight - 20;    // Ampliada (antes 30)
    
    for (let i = 0; i < guitarGame.activeNotes.length; i++) {
        const note = guitarGame.activeNotes[i];
        
        // Solo comprobar notas del mismo carril que no hayan sido golpeadas ya
        if (note.lane === laneIndex && !note.hit && 
            note.position >= hitZoneStart && note.position <= hitZoneEnd) {
            
            // Marcar como golpeada
            note.hit = true;
            note.element.classList.add('hit');
            
            // Calcular precisión (más cerca del centro = más puntos)
            const center = (hitZoneStart + hitZoneEnd) / 2;
            const distance = Math.abs(note.position - center);
            const maxDistance = (hitZoneEnd - hitZoneStart) / 2;
            const precision = 1 - (distance / maxDistance);
            
            // Asignar puntos según precisión
            let points = Math.floor(precision * 10) + 5; // Entre 5 y 15 puntos
            
            // Mostrar puntos ganados
            showPointsGained(note.element, points);
            
            // Actualizar puntuación
            guitarGame.score += points;
            updateScore();
            
            // Reproducir sonido de acierto
            if (guitarGame.noteHitSound) guitarGame.noteHitSound.play();
            
            // Remover nota después de una animación
            setTimeout(() => {
                note.element.remove();
                
                // Eliminar de las notas activas
                const index = guitarGame.activeNotes.indexOf(note);
                if (index !== -1) guitarGame.activeNotes.splice(index, 1);
            }, 200);
            
            hitSuccessful = true;
            break; // Solo golpear una nota a la vez
        }
    }
    
    // Si no se golpea ninguna nota en la zona de golpeo
    if (!hitSuccessful) {
        // Penalización por golpear sin notas
        guitarGame.score = Math.max(0, guitarGame.score - 2);
        guitarGame.combo = 0; // Resetear combo
        updateScore();
    }
}

// Actualizar la puntuación en la interfaz
function updateScore() {
    const scoreElement = document.getElementById('guitar-score-value');
    const comboElement = document.getElementById('guitar-combo-value');
    const maxComboElement = document.getElementById('guitar-max-combo-value');
    
    if (scoreElement) {
        scoreElement.textContent = guitarGame.score;
    }
    
    if (comboElement) {
        comboElement.textContent = guitarGame.combo;
    }
    
    if (maxComboElement) {
        maxComboElement.textContent = guitarGame.maxCombo;
    }
}

// Mostrar los puntos ganados
function showPointsGained(noteElement, points) {
    const pointsDisplay = document.createElement('div');
    pointsDisplay.className = 'guitar-points';
    
    // Incrementar el combo
    guitarGame.combo++;
    // Actualizar el máximo combo si es necesario
    guitarGame.maxCombo = Math.max(guitarGame.maxCombo, guitarGame.combo);
    
    // Mostrar combo en el texto de puntos si es mayor que 1
    if (guitarGame.combo > 1) {
        pointsDisplay.textContent = `+${points} x${guitarGame.combo}!`;
        pointsDisplay.classList.add('epic-points');
    } else {
        pointsDisplay.textContent = `+${points}`;
    }
    
    updateScore();
    
    // Posicionar cerca de la nota golpeada
    pointsDisplay.style.left = `${noteElement.offsetLeft}px`;
    pointsDisplay.style.top = `${noteElement.offsetTop}px`;
    
    guitarGame.gameContainer.appendChild(pointsDisplay);
    
    // Crear efecto de partículas
    createHitParticles(noteElement);
    
    // Animar y eliminar
    setTimeout(() => {
        pointsDisplay.remove();
    }, 1000);
}

// Función para crear partículas cuando se golpea una nota
function createHitParticles(noteElement) {
    const numParticles = 10;
    const laneIndex = parseInt(noteElement.dataset.lane);
    const color = guitarGame.colors[laneIndex];
    
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'guitar-particle';
        particle.style.backgroundColor = color;
        
        // Posición inicial centrada en la nota
        particle.style.left = `${noteElement.offsetLeft + noteElement.offsetWidth / 2}px`;
        particle.style.top = `${noteElement.offsetTop + noteElement.offsetHeight / 2}px`;
        
        // Dirección aleatoria
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        const size = 3 + Math.random() * 5;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Añadir al DOM
        guitarGame.gameContainer.appendChild(particle);
        
        // Animar la partícula
        const startTime = Date.now();
        const duration = 500 + Math.random() * 500;
        
        function animateParticle() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                const distance = speed * elapsed * 0.1;
                const x = parseFloat(particle.style.left) + Math.cos(angle) * distance;
                const y = parseFloat(particle.style.top) + Math.sin(angle) * distance;
                
                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;
                particle.style.opacity = 1 - progress;
                
                requestAnimationFrame(animateParticle);
            } else {
                particle.remove();
            }
        }
        
        requestAnimationFrame(animateParticle);
    }
}
