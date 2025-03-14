// Variables de la animación de introducción
let introAnimation = {
    container: null,
    countdownNumbers: [3, 2, 1],
    finalMessage: "¡VAMOS RAYAN!",
    currentStep: -1,
    audioContext: null,
    audioSources: {
        countdown: ['beep1.mp3', 'beep2.mp3', 'beep3.mp3'],
        finalSound: 'explosion.mp3'
    }
};

// Función de inicialización para la animación de introducción
function initIntroGame(container) {
    introAnimation.container = container;
    introAnimation.currentStep = -1;
    
    // Crear el contenedor de la animación
    const animContainer = document.createElement('div');
    animContainer.className = 'intro-animation-container';
    container.appendChild(animContainer);
    
    // Añadir el elemento para el texto de la animación
    const textElement = document.createElement('div');
    textElement.className = 'intro-text';
    textElement.id = 'intro-text';
    animContainer.appendChild(textElement);
    
    // Añadir elementos para los efectos visuales
    createVisualEffects(animContainer);
    
    // Iniciar la secuencia de la animación después de un breve retraso
    setTimeout(startIntroSequence, 500);
    
    // Configurar audio si es posible
    setupIntroAudio();
}

// Limpiar recursos cuando la animación termine
function cleanupIntroGame() {
    // Cerrar el contexto de audio si existe
    if (introAnimation.audioContext) {
        introAnimation.audioContext.close().catch(e => console.error("Error cerrando AudioContext", e));
    }
}

// Crear los elementos visuales para efectos
function createVisualEffects(container) {
    // Crear partículas para efectos
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'intro-particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 3}s`;
        container.appendChild(particle);
    }
    
    // Crear el efecto de destello
    const flash = document.createElement('div');
    flash.className = 'intro-flash';
    flash.id = 'intro-flash';
    container.appendChild(flash);
    
    // Crear ondas para efectos
    for (let i = 0; i < 3; i++) {
        const wave = document.createElement('div');
        wave.className = 'intro-wave';
        wave.style.animationDelay = `${i * 0.2}s`;
        container.appendChild(wave);
    }
}

// Configurar sistema de audio
function setupIntroAudio() {
    try {
        // Crear contexto de audio si está disponible
        if (window.AudioContext || window.webkitAudioContext) {
            introAnimation.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    } catch (e) {
        console.warn("Audio no disponible para la intro:", e);
    }
}

// Reproducir sonido para cada paso de la animación
function playStepSound(step) {
    if (!introAnimation.audioContext) return;
    
    try {
        const oscillator = introAnimation.audioContext.createOscillator();
        const gainNode = introAnimation.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(introAnimation.audioContext.destination);
        
        if (step < introAnimation.countdownNumbers.length) {
            // Sonidos de cuenta regresiva (frecuencias ascendentes)
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(220 + (step * 110), introAnimation.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, introAnimation.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, introAnimation.audioContext.currentTime + 0.5);
            
            oscillator.start();
            oscillator.stop(introAnimation.audioContext.currentTime + 0.5);
        } else {
            // Sonido final épico
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(440, introAnimation.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.4, introAnimation.audioContext.currentTime);
            
            // Sweep ascendente para efecto épico
            oscillator.frequency.exponentialRampToValueAtTime(880, introAnimation.audioContext.currentTime + 0.5);
            gainNode.gain.exponentialRampToValueAtTime(0.001, introAnimation.audioContext.currentTime + 1.5);
            
            oscillator.start();
            oscillator.stop(introAnimation.audioContext.currentTime + 1.5);
            
            // Segundo oscilador para efecto más rico
            const oscillator2 = introAnimation.audioContext.createOscillator();
            oscillator2.type = 'square';
            oscillator2.frequency.setValueAtTime(220, introAnimation.audioContext.currentTime);
            oscillator2.connect(gainNode);
            oscillator2.frequency.exponentialRampToValueAtTime(440, introAnimation.audioContext.currentTime + 0.5);
            
            oscillator2.start();
            oscillator2.stop(introAnimation.audioContext.currentTime + 1.5);
        }
    } catch (e) {
        console.warn("Error reproduciendo sonido:", e);
    }
}

// Iniciar la secuencia de animación
function startIntroSequence() {
    advanceIntroStep();
}

// Avanzar al siguiente paso de la animación
function advanceIntroStep() {
    introAnimation.currentStep++;
    const textElement = document.getElementById('intro-text');
    const flashElement = document.getElementById('intro-flash');
    
    // Reiniciar clases de animación
    textElement.className = 'intro-text';
    void textElement.offsetWidth; // Truco para reiniciar animaciones CSS
    
    if (introAnimation.currentStep < introAnimation.countdownNumbers.length) {
        // Mostrar número de cuenta regresiva
        textElement.textContent = introAnimation.countdownNumbers[introAnimation.currentStep];
        textElement.classList.add('intro-text-zoom');
        
        // Reproducir sonido para este paso
        playStepSound(introAnimation.currentStep);
        
        // Programar siguiente paso
        setTimeout(advanceIntroStep, 1000);
    } else if (introAnimation.currentStep === introAnimation.countdownNumbers.length) {
        // Mostrar mensaje final
        textElement.textContent = introAnimation.finalMessage;
        textElement.classList.add('intro-text-final');
        
        // Activar flash
        flashElement.classList.add('intro-flash-active');
        
        // Sonido final épico
        playStepSound(introAnimation.currentStep);
        
        // Hacer que todas las partículas exploten desde el centro
        const particles = document.querySelectorAll('.intro-particle');
        particles.forEach(p => p.classList.add('intro-particle-explode'));
        
        // Mantener la animación final por un momento antes de pasar al siguiente juego
        setTimeout(() => {
            // Aquí no necesitamos hacer nada, el sistema automáticamente pasará
            // al siguiente juego cuando el temporizador termine
        }, 2000);
    }
}
