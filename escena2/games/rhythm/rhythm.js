// Variables globales del juego de Ritmo Frenético
let rhythmGame = {
    gameContainer: null,         // Contenedor del juego
    lanes: 4,                   // Número de carriles
    noteSpeed: 8,               // Velocidad de caída de notas
    noteFrequency: 400,         // Frecuencia de generación de notas (ms)
    score: 0,                   // Puntuación
    laneElements: [],           // Elementos DOM de los carriles
    keyBindings: ['a', 's', 'd', 'f'], // Teclas para cada carril
    activeNotes: [],            // Notas actualmente en pantalla
    noteInterval: null,         // Intervalo para generar notas
    animationId: null,          // ID para la animación
    colors: ['#FF3366', '#33CCFF', '#FFCC33', '#66FF66'], // Colores para cada carril
    audioContext: null,         // Contexto de audio
    combo: 0,                   // Contador de combo
    maxCombo: 0,                // Combo máximo conseguido
    particlePool: [],           // Pool de partículas para reutilización
    difficultyLevel: 1,         // Nivel de dificultad
    patternMode: false,         // Modo de patrón de notas
    beatPulse: 0                // Para efectos de pulso al ritmo
};

// Inicializar el juego de Ritmo
function initRhythmGame(container) {
    rhythmGame.gameContainer = container;
    rhythmGame.score = 0;
    rhythmGame.activeNotes = [];
    rhythmGame.combo = 0;
    rhythmGame.maxCombo = 0;
    rhythmGame.difficultyLevel = 1;
    rhythmGame.patternMode = false;
    rhythmGame.beatPulse = 0;
    
    // Crear estructura del juego
    createRhythmGameStructure();
    
    // Configurar audio
    setupRhythmAudio();
    
    // Iniciar la generación de notas
    rhythmGame.noteInterval = setInterval(createRandomRhythmNote, rhythmGame.noteFrequency);
    
    // Iniciar el bucle de animación
    rhythmGame.animationId = requestAnimationFrame(updateRhythmGame);
    
    // Añadir eventos de teclado
    window.addEventListener('keydown', handleRhythmKeyPress);

    // Añadir eventos táctiles/clic para dispositivos móviles
    setupTouchControls();
    
    // Crear el efecto de fondo
    createBackgroundEffect();
}

// Limpiar juego cuando cambiamos a otro
function cleanupRhythmGame() {
    // Detener generación de notas y animación
    clearInterval(rhythmGame.noteInterval);
    cancelAnimationFrame(rhythmGame.animationId);
    
    // Eliminar eventos
    window.removeEventListener('keydown', handleRhythmKeyPress);
    
    // Cerrar contexto de audio si existe
    if (rhythmGame.audioContext) {
        rhythmGame.audioContext.close().catch(e => console.error("Error cerrando AudioContext", e));
    }
    
    // Eliminar efectos de fondo
    const bgEffect = document.querySelector('.rhythm-background');
    if (bgEffect) bgEffect.remove();
}

// Crear la estructura DOM del juego
function createRhythmGameStructure() {
    // Contenedor de puntuación y combo
    const scoreContainer = document.createElement('div');
    scoreContainer.className = 'rhythm-score';
    scoreContainer.innerHTML = `
        <div class="score-value">Puntuación: <span id="rhythm-score-value">0</span></div>
        <div class="combo-value">Combo: <span id="rhythm-combo-value">0</span> x</div>
    `;
    rhythmGame.gameContainer.appendChild(scoreContainer);
    
    // Contenedor principal del juego
    const gameField = document.createElement('div');
    gameField.className = 'rhythm-game-field';
    rhythmGame.gameContainer.appendChild(gameField);
    
    // Crear los carriles
    for (let i = 0; i < rhythmGame.lanes; i++) {
        const lane = document.createElement('div');
        lane.className = 'rhythm-lane';
        lane.style.backgroundColor = rhythmGame.colors[i] + '22'; // Color con transparencia
        
        // Crear el receptor al final del carril
        const receptor = document.createElement('div');
        receptor.className = 'rhythm-receptor';
        receptor.style.backgroundColor = rhythmGame.colors[i];
        receptor.dataset.lane = i;
        receptor.textContent = rhythmGame.keyBindings[i].toUpperCase();
        lane.appendChild(receptor);
        
        gameField.appendChild(lane);
        rhythmGame.laneElements.push(lane);
    }
    
    // Área para controles táctiles
    const touchControls = document.createElement('div');
    touchControls.className = 'rhythm-touch-controls';
    rhythmGame.gameContainer.appendChild(touchControls);
    
    // Crear los botones táctiles
    for (let i = 0; i < rhythmGame.lanes; i++) {
        const touchButton = document.createElement('div');
        touchButton.className = 'rhythm-touch-button';
        touchButton.style.backgroundColor = rhythmGame.colors[i];
        touchButton.dataset.lane = i;
        touchButton.textContent = rhythmGame.keyBindings[i].toUpperCase();
        touchControls.appendChild(touchButton);
    }
}

// Configurar el sistema de audio
function setupRhythmAudio() {
    try {
        // Verificar si AudioContext está disponible
        if (window.AudioContext || window.webkitAudioContext) {
            rhythmGame.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    } catch (e) {
        console.warn("Audio no disponible:", e);
    }
}

// Reproducir sonido de nota golpeada
function playHitSound(laneIndex) {
    if (!rhythmGame.audioContext) return;
    
    try {
        // Crear oscilador para sonido base
        const oscillator = rhythmGame.audioContext.createOscillator();
        const gainNode = rhythmGame.audioContext.createGain();
        
        // Conectar nodos
        oscillator.connect(gainNode);
        gainNode.connect(rhythmGame.audioContext.destination);
        
        // Configurar sonido según el carril
        const baseFrequency = 330 + (laneIndex * 110); // Diferentes frecuencias para cada carril
        oscillator.type = 'sine';
        
        // Ajustar frecuencia y volumen
        oscillator.frequency.setValueAtTime(baseFrequency, rhythmGame.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, rhythmGame.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, rhythmGame.audioContext.currentTime + 0.3);
        
        // Reproducir y detener
        oscillator.start();
        oscillator.stop(rhythmGame.audioContext.currentTime + 0.3);
        
        // Sonido adicional para combos altos
        if (rhythmGame.combo > 5) {
            const oscillator2 = rhythmGame.audioContext.createOscillator();
            oscillator2.connect(gainNode);
            oscillator2.type = 'triangle';
            oscillator2.frequency.setValueAtTime(baseFrequency * 1.5, rhythmGame.audioContext.currentTime);
            oscillator2.start();
            oscillator2.stop(rhythmGame.audioContext.currentTime + 0.2);
        }
        
        // Hacer que el fondo pulse con el ritmo
        rhythmGame.beatPulse = 1.0;
    } catch (e) {
        console.warn("Error reproduciendo sonido:", e);
    }
}

// Reproducir sonido de fallo
function playMissSound() {
    if (!rhythmGame.audioContext) return;
    
    try {
        const oscillator = rhythmGame.audioContext.createOscillator();
        const gainNode = rhythmGame.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(rhythmGame.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(120, rhythmGame.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, rhythmGame.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, rhythmGame.audioContext.currentTime + 0.2);
        
        oscillator.start();
        oscillator.stop(rhythmGame.audioContext.currentTime + 0.2);
    } catch (e) {
        console.warn("Error reproduciendo sonido:", e);
    }
}

// Crear una nota aleatoria
function createRandomRhythmNote() {
    // Probabilidad de patrones basada en la dificultad
    if (rhythmGame.difficultyLevel > 1 && Math.random() < 0.15 && !rhythmGame.patternMode) {
        rhythmGame.patternMode = true;
        generateRhythmNotePattern();
        return;
    }
    
    // Probabilidad de notas dobles basada en la dificultad
    if (rhythmGame.difficultyLevel > 1 && Math.random() < 0.2) {
        generateDoubleRhythmNote();
        return;
    }
    
    // Nota normal
    const laneIndex = Math.floor(Math.random() * rhythmGame.lanes);
    generateRhythmNote(laneIndex);
}

// Generar una nota en un carril específico
function generateRhythmNote(laneIndex) {
    const lane = rhythmGame.laneElements[laneIndex];
    
    // Crear elemento de nota
    const note = document.createElement('div');
    note.className = 'rhythm-note';
    note.style.backgroundColor = rhythmGame.colors[laneIndex];
    note.dataset.lane = laneIndex;
    note.style.top = '-50px';
    
    // Añadir efecto visual según la dificultad
    if (rhythmGame.difficultyLevel >= 2) {
        note.classList.add('rhythm-note-glow');
    }
    
    lane.appendChild(note);
    
    // Añadir a las notas activas
    rhythmGame.activeNotes.push({
        element: note,
        lane: laneIndex,
        position: -50,
        hit: false,
        speed: rhythmGame.noteSpeed * (1 + Math.random() * 0.2) // Variación leve de velocidad
    });
}

// Generar notas dobles (en 2 carriles diferentes simultáneamente)
function generateDoubleRhythmNote() {
    // Elegir dos carriles diferentes
    let lane1 = Math.floor(Math.random() * rhythmGame.lanes);
    let lane2;
    
    do {
        lane2 = Math.floor(Math.random() * rhythmGame.lanes);
    } while (lane1 === lane2);
    
    // Generar nota en cada carril
    generateRhythmNote(lane1);
    generateRhythmNote(lane2);
}

// Generar un patrón de notas
function generateRhythmNotePattern() {
    const patternLength = 3 + Math.floor(Math.random() * 2); // 3-4 notas
    let delay = 100; // Primera nota aparece después de 100ms
    
    for (let i = 0; i < patternLength; i++) {
        setTimeout(() => {
            const laneIndex = Math.floor(Math.random() * rhythmGame.lanes);
            generateRhythmNote(laneIndex);
            
            // Si es la última nota del patrón, desactivar modo patrón
            if (i === patternLength - 1) {
                rhythmGame.patternMode = false;
            }
        }, delay);
        
        delay += 150; // Cada nota adicional aparece 150ms después
    }
}

// Actualizar el juego en cada frame
function updateRhythmGame() {
    // Actualizar pulso rítmico
    if (rhythmGame.beatPulse > 0) {
        rhythmGame.beatPulse -= 0.05;
        if (rhythmGame.beatPulse < 0) rhythmGame.beatPulse = 0;
        
        // Actualizar efecto visual del fondo
        const bgEffect = document.querySelector('.rhythm-background');
        if (bgEffect) {
            bgEffect.style.opacity = 0.3 + rhythmGame.beatPulse * 0.3;
            bgEffect.style.transform = `scale(${1 + rhythmGame.beatPulse * 0.05})`;
        }
    }
    
    // Mover todas las notas hacia abajo
    for (let i = rhythmGame.activeNotes.length - 1; i >= 0; i--) {
        const note = rhythmGame.activeNotes[i];
        
        // Actualizar posición
        note.position += note.speed;
        note.element.style.top = note.position + 'px';
        
        // Verificar si la nota ha salido de la pantalla
        if (note.position > rhythmGame.laneElements[0].clientHeight && !note.hit) {
            // Nota perdida
            note.element.remove();
            rhythmGame.activeNotes.splice(i, 1);
            
            // Reiniciar el combo
            rhythmGame.combo = 0;
            updateRhythmScore();
            
            // Reproducir sonido de fallo
            playMissSound();
            
            // Efecto visual de fallo
            showMissEffect(note.lane);
        }
    }
    
    // Seguir animando
    rhythmGame.animationId = requestAnimationFrame(updateRhythmGame);
}

// Manejar pulsaciones de teclas
function handleRhythmKeyPress(event) {
    const key = event.key.toLowerCase();
    const laneIndex = rhythmGame.keyBindings.indexOf(key);
    
    // Si la tecla no corresponde a ningún carril, ignorar
    if (laneIndex === -1) return;
    
    // Procesar la pulsación en el carril
    processRhythmLanePress(laneIndex);
}

// Configurar controles táctiles
function setupTouchControls() {
    const touchButtons = document.querySelectorAll('.rhythm-touch-button');
    
    touchButtons.forEach(button => {
        button.addEventListener('click', function() {
            const laneIndex = parseInt(this.dataset.lane);
            processRhythmLanePress(laneIndex);
        });
    });
}

// Procesar la pulsación en un carril (por teclado o táctil)
function processRhythmLanePress(laneIndex) {
    // Resaltar el receptor correspondiente
    const receptor = rhythmGame.laneElements[laneIndex].querySelector('.rhythm-receptor');
    receptor.classList.add('active');
    
    // Añadir efecto de onda expansiva
    const ripple = document.createElement('div');
    ripple.className = 'rhythm-ripple';
    receptor.appendChild(ripple);
    
    setTimeout(() => {
        receptor.classList.remove('active');
        if (ripple.parentNode === receptor) {
            ripple.remove();
        }
    }, 300);
    
    // Comprobar si hay alguna nota cerca de la zona de golpeo
    let hitSuccessful = false;
    const hitZoneStart = rhythmGame.laneElements[0].clientHeight - 100;
    const hitZoneEnd = rhythmGame.laneElements[0].clientHeight - 20;
    
    for (let i = 0; i < rhythmGame.activeNotes.length; i++) {
        const note = rhythmGame.activeNotes[i];
        
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
            
            // Incrementar el combo
            rhythmGame.combo++;
            if (rhythmGame.combo > rhythmGame.maxCombo) {
                rhythmGame.maxCombo = rhythmGame.combo;
            }
            
            // Bonificación de puntos por combo
            if (rhythmGame.combo > 5) {
                points += Math.floor(rhythmGame.combo / 5);
            }
            
            // Actualizar puntuación
            rhythmGame.score += points;
            updateRhythmScore();
            
            // Reproducir sonido
            playHitSound(laneIndex);
            
            // Crear efectos visuales
            createHitEffects(note.element, points);
            
            // Aumentar dificultad gradualmente
            if (rhythmGame.score > 50 && rhythmGame.difficultyLevel === 1) {
                rhythmGame.difficultyLevel = 2;
                showDifficultyUpMessage();
            }
            
            // Remover nota después de una animación
            setTimeout(() => {
                if (note.element.parentNode) {
                    note.element.remove();
                }
                // Eliminar de las notas activas
                const index = rhythmGame.activeNotes.indexOf(note);
                if (index !== -1) rhythmGame.activeNotes.splice(index, 1);
            }, 100);
            
            hitSuccessful = true;
            break; // Solo golpear una nota a la vez
        }
    }
    
    // Si no se golpea ninguna nota en la zona
    if (!hitSuccessful) {
        // Reiniciar combo
        rhythmGame.combo = 0;
        updateRhythmScore();
        
        // Reproducir sonido de fallo
        playMissSound();
    }
}

// Actualizar la puntuación en la interfaz
function updateRhythmScore() {
    const scoreValue = document.getElementById('rhythm-score-value');
    const comboValue = document.getElementById('rhythm-combo-value');
    
    if (scoreValue) {
        scoreValue.textContent = rhythmGame.score;
    }
    
    if (comboValue) {
        comboValue.textContent = rhythmGame.combo;
        
        // Efecto visual para combo alta
        if (rhythmGame.combo >= 5) {
            comboValue.classList.add('high-combo');
        } else {
            comboValue.classList.remove('high-combo');
        }
    }
}

// Crear efectos visuales al golpear una nota
function createHitEffects(noteElement, points) {
    // Crear indicador de puntos
    const pointsDisplay = document.createElement('div');
    pointsDisplay.className = 'rhythm-points';
    pointsDisplay.textContent = `+${points}`;
    
    if (rhythmGame.combo > 5) {
        pointsDisplay.textContent += ` x${rhythmGame.combo}`;
        pointsDisplay.classList.add('combo-points');
    }
    
    // Posicionar y añadir al DOM
    const rect = noteElement.getBoundingClientRect();
    const gameRect = rhythmGame.gameContainer.getBoundingClientRect();
    
    pointsDisplay.style.left = `${rect.left - gameRect.left + rect.width/2}px`;
    pointsDisplay.style.top = `${rect.top - gameRect.top}px`;
    
    rhythmGame.gameContainer.appendChild(pointsDisplay);
    
    // Eliminar después de la animación
    setTimeout(() => {
        if (pointsDisplay.parentNode) {
            pointsDisplay.remove();
        }
    }, 1000);
    
    // Crear partículas
    createRhythmParticles(noteElement);
    
    // Crear destello
    const flash = document.createElement('div');
    flash.className = 'rhythm-flash';
    flash.style.left = `${rect.left - gameRect.left}px`;
    flash.style.top = `${rect.top - gameRect.top}px`;
    flash.style.width = `${rect.width * 3}px`;
    flash.style.height = `${rect.height * 3}px`;
    
    rhythmGame.gameContainer.appendChild(flash);
    
    setTimeout(() => {
        if (flash.parentNode) {
            flash.remove();
        }
    }, 300);
}

// Crear partículas para el efecto de golpeo
function createRhythmParticles(noteElement) {
    const rect = noteElement.getBoundingClientRect();
    const gameRect = rhythmGame.gameContainer.getBoundingClientRect();
    const color = noteElement.style.backgroundColor;
    
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'rhythm-particle';
        particle.style.backgroundColor = color;
        
        // Posición inicial
        const startX = rect.left - gameRect.left + rect.width/2;
        const startY = rect.top - gameRect.top + rect.height/2;
        
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;
        
        // Tamaño aleatorio
        const size = 3 + Math.random() * 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Añadir al DOM
        rhythmGame.gameContainer.appendChild(particle);
        
        // Animar
        const angle = Math.random() * Math.PI * 2;
        const velocity = 2 + Math.random() * 5;
        const lifespan = 500 + Math.random() * 500;
        
        animateRhythmParticle(particle, startX, startY, angle, velocity, lifespan);
    }
}

// Animar una partícula
function animateRhythmParticle(particle, x, y, angle, velocity, duration) {
    const startTime = Date.now();
    
    function updateParticle() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
            // Actualizar posición
            x += Math.cos(angle) * velocity;
            y += Math.sin(angle) * velocity;
            
            // Aplicar gravedad
            velocity *= 0.98;
            
            // Actualizar opacidad
            const opacity = 1 - progress;
            
            // Aplicar cambios
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.opacity = opacity;
            
            requestAnimationFrame(updateParticle);
        } else {
            // Eliminar partícula
            if (particle.parentNode) {
                particle.remove();
            }
        }
    }
    
    updateParticle();
}

// Mostrar efecto de fallo
function showMissEffect(laneIndex) {
    const lane = rhythmGame.laneElements[laneIndex];
    const missEffect = document.createElement('div');
    missEffect.className = 'rhythm-miss';
    missEffect.textContent = '¡FALLO!';
    
    lane.appendChild(missEffect);
    
    setTimeout(() => {
        if (missEffect.parentNode) {
            missEffect.remove();
        }
    }, 500);
}

// Mostrar mensaje de aumento de dificultad
function showDifficultyUpMessage() {
    const message = document.createElement('div');
    message.className = 'rhythm-difficulty-up';
    message.textContent = '¡DIFICULTAD AUMENTADA!';
    
    rhythmGame.gameContainer.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 2000);
}

// Crear efecto de fondo
function createBackgroundEffect() {
    const background = document.createElement('div');
    background.className = 'rhythm-background';
    rhythmGame.gameContainer.appendChild(background);
    
    // Crear círculos concéntricos
    for (let i = 0; i < 5; i++) {
        const circle = document.createElement('div');
        circle.className = 'rhythm-bg-circle';
        circle.style.animationDelay = `${i * 0.2}s`;
        background.appendChild(circle);
    }
}

// Función para ajustar la dificultad del juego
function adjustRhythmDifficulty(score) {
    // Incrementar dificultad basado en puntuación
    if (score > 100 && rhythmGame.difficultyLevel < 2) {
        rhythmGame.difficultyLevel = 2;
        rhythmGame.noteFrequency = 350; // Más rápido
        clearInterval(rhythmGame.noteInterval);
        rhythmGame.noteInterval = setInterval(createRandomRhythmNote, rhythmGame.noteFrequency);
        showDifficultyUpMessage();
    } else if (score > 200 && rhythmGame.difficultyLevel < 3) {
        rhythmGame.difficultyLevel = 3;
        rhythmGame.noteFrequency = 280; // Aún más rápido
        clearInterval(rhythmGame.noteInterval);
        rhythmGame.noteInterval = setInterval(createRandomRhythmNote, rhythmGame.noteFrequency);
        showDifficultyUpMessage();
    }
}

// Función para obtener estadísticas finales del juego
function getRhythmGameStats() {
    return {
        score: rhythmGame.score,
        maxCombo: rhythmGame.maxCombo,
        difficultyReached: rhythmGame.difficultyLevel
    };
}
