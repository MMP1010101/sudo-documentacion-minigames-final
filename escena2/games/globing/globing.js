// Juego de boxeo estilo Tekken - Globing Fight

// Variables globales del juego
let globingGame = {
    gameContainer: null,     // Contenedor del juego
    player: {                // Información del jugador
        health: 100,         // Salud inicial
        position: 120,       // Posición X
        attacking: false,    // Estado de ataque
        combo: 0,            // Contador de combo
        element: null,       // Elemento DOM
        healthBar: null      // Barra de salud
    },
    enemy: {                 // Información del enemigo
        health: 100,         // Salud inicial
        position: 120,       // Posición X (desde la derecha)
        attacking: false,    // Estado de ataque
        element: null,       // Elemento DOM
        healthBar: null      // Barra de salud
    },
    gameState: {
        active: true,        // Estado activo del juego
        animationId: null,   // ID de la animación
        keysPressed: {       // Teclas presionadas
            a: false,        
            s: false,        
            ArrowLeft: false,  
            ArrowRight: false  
        }
    },
    // Configuración del juego
    hitDistance: 70,         // Distancia para detectar golpes
    punchDamage: 10,         // Daño del puñetazo
    kickDamage: 15,          // Daño de la patada
    moveSpeed: 5             // Velocidad de movimiento
};

// Inicializar el juego de boxeo
function initGlobingGame(container) {
    globingGame.gameContainer = container;
    
    // Reiniciar variables
    resetGameState();
    
    // Crear estructura del juego
    createFightArena();
    
    // Configurar eventos de teclado
    setupControls();
    
    // Iniciar bucle de animación
    globingGame.gameState.animationId = requestAnimationFrame(updateFightGame);
    
    // Iniciar IA del enemigo (básica)
    setTimeout(startEnemyAI, 2000);
}

// Limpiar el juego cuando se cambia a otro
function cleanupGlobingGame() {
    // Detener animación
    cancelAnimationFrame(globingGame.gameState.animationId);
    
    // Eliminar eventos de teclado
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
}

// Reiniciar estado del juego
function resetGameState() {
    globingGame.player.health = 100;
    globingGame.player.position = 120;
    globingGame.player.attacking = false;
    globingGame.player.combo = 0;
    
    globingGame.enemy.health = 100;
    globingGame.enemy.position = 120;
    globingGame.enemy.attacking = false;
    
    globingGame.gameState.active = true;
    
    // Reiniciar teclas presionadas
    Object.keys(globingGame.gameState.keysPressed).forEach(key => {
        globingGame.gameState.keysPressed[key] = false;
    });
}

// Crear la arena de lucha
function createFightArena() {
    // Crear el contenedor principal
    const fightContainer = document.createElement('div');
    fightContainer.className = 'globing-container';
    globingGame.gameContainer.appendChild(fightContainer);
    
    // Crear la arena
    const arena = document.createElement('div');
    arena.className = 'fight-arena';
    fightContainer.appendChild(arena);
    
    // Crear fondo dinámico
    const arenaBg = document.createElement('div');
    arenaBg.className = 'arena-bg';
    arena.appendChild(arenaBg);
    
    // Crear suelo
    const floor = document.createElement('div');
    floor.className = 'arena-floor';
    arena.appendChild(floor);
    
    // Panel de información (vidas)
    const infoPanel = document.createElement('div');
    infoPanel.className = 'info-panel';
    
    // Barra de vida del jugador
    const playerHealthContainer = document.createElement('div');
    playerHealthContainer.className = 'health-bar player-health';
    const playerHealthFill = document.createElement('div');
    playerHealthFill.className = 'health-fill';
    playerHealthFill.style.width = '100%';
    playerHealthContainer.appendChild(playerHealthFill);
    globingGame.player.healthBar = playerHealthFill;
    
    // Barra de vida del enemigo
    const enemyHealthContainer = document.createElement('div');
    enemyHealthContainer.className = 'health-bar enemy-health';
    const enemyHealthFill = document.createElement('div');
    enemyHealthFill.className = 'health-fill';
    enemyHealthFill.style.width = '100%';
    enemyHealthContainer.appendChild(enemyHealthFill);
    globingGame.enemy.healthBar = enemyHealthFill;
    
    infoPanel.appendChild(playerHealthContainer);
    infoPanel.appendChild(enemyHealthContainer);
    arena.appendChild(infoPanel);
    
    // Contador de combo
    const comboCounter = document.createElement('div');
    comboCounter.className = 'combo-counter';
    comboCounter.id = 'combo-counter';
    arena.appendChild(comboCounter);
    
    // Instrucciones
    const instructions = document.createElement('div');
    instructions.className = 'fight-instructions';
    instructions.innerHTML = 'Usa A para puñetazo, S para patada<br>Flechas para moverte';
    arena.appendChild(instructions);
    
    // Crear jugador
    const player = createFighter('player');
    globingGame.player.element = player;
    arena.appendChild(player);
    
    // Crear enemigo
    const enemy = createFighter('enemy');
    globingGame.enemy.element = enemy;
    arena.appendChild(enemy);
}

// Crear un luchador (jugador o enemigo)
function createFighter(type) {
    const fighter = document.createElement('div');
    fighter.className = `fighter ${type}`;
    
    const stickFigure = document.createElement('div');
    stickFigure.className = 'stick-figure';
    
    // Crear cabeza
    const head = document.createElement('div');
    head.className = 'stick-head';
    
    // Crear ojos
    const leftEye = document.createElement('div');
    leftEye.className = 'stick-eye left';
    head.appendChild(leftEye);
    
    const rightEye = document.createElement('div');
    rightEye.className = 'stick-eye right';
    head.appendChild(rightEye);
    
    // Crear boca
    const mouth = document.createElement('div');
    mouth.className = 'stick-mouth';
    head.appendChild(mouth);
    
    // Crear torso
    const torso = document.createElement('div');
    torso.className = 'stick-torso';
    
    // Crear brazo izquierdo
    const leftArm = document.createElement('div');
    leftArm.className = 'stick-arm left';
    
    // Antebrazo izquierdo y puño
    const leftForearm = document.createElement('div');
    leftForearm.className = 'stick-forearm';
    
    const leftFist = document.createElement('div');
    leftFist.className = 'stick-fist';
    leftForearm.appendChild(leftFist);
    leftArm.appendChild(leftForearm);
    
    // Crear brazo derecho
    const rightArm = document.createElement('div');
    rightArm.className = 'stick-arm right';
    
    // Antebrazo derecho y puño
    const rightForearm = document.createElement('div');
    rightForearm.className = 'stick-forearm';
    
    const rightFist = document.createElement('div');
    rightFist.className = 'stick-fist';
    rightForearm.appendChild(rightFist);
    rightArm.appendChild(rightForearm);
    
    // Crear pierna izquierda
    const leftLeg = document.createElement('div');
    leftLeg.className = 'stick-leg left';
    
    // Pantorrilla izquierda y pie
    const leftCalf = document.createElement('div');
    leftCalf.className = 'stick-calf left';
    
    const leftFoot = document.createElement('div');
    leftFoot.className = 'stick-foot';
    leftCalf.appendChild(leftFoot);
    leftLeg.appendChild(leftCalf);
    
    // Crear pierna derecha
    const rightLeg = document.createElement('div');
    rightLeg.className = 'stick-leg right';
    
    // Pantorrilla derecha y pie
    const rightCalf = document.createElement('div');
    rightCalf.className = 'stick-calf right';
    
    const rightFoot = document.createElement('div');
    rightFoot.className = 'stick-foot';
    rightCalf.appendChild(rightFoot);
    rightLeg.appendChild(rightCalf);
    
    // Ensamblar el stick figure
    stickFigure.appendChild(head);
    stickFigure.appendChild(torso);
    stickFigure.appendChild(leftArm);
    stickFigure.appendChild(rightArm);
    stickFigure.appendChild(leftLeg);
    stickFigure.appendChild(rightLeg);
    
    fighter.appendChild(stickFigure);
    
    return fighter;
}

// Configurar controles de teclado
function setupControls() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

// Manejar tecla presionada
function handleKeyDown(event) {
    if (!globingGame.gameState.active) return;
    
    const key = event.key;
    
    if (globingGame.gameState.keysPressed.hasOwnProperty(key)) {
        globingGame.gameState.keysPressed[key] = true;
    }
    
    // Ataques con una sola pulsación
    if (key === 'a' && !globingGame.player.attacking) {
        playerPunch();
    } else if (key === 's' && !globingGame.player.attacking) {
        playerKick();
    }
}

// Manejar tecla liberada
function handleKeyUp(event) {
    const key = event.key;
    
    if (globingGame.gameState.keysPressed.hasOwnProperty(key)) {
        globingGame.gameState.keysPressed[key] = false;
    }
}

// Realizar puñetazo
function playerPunch() {
    if (globingGame.player.attacking) return;
    
    globingGame.player.attacking = true;
    
    // Añadir clase para la animación
    globingGame.player.element.classList.add('punch');
    
    // Comprobar si el golpe alcanza al enemigo
    checkHit('punch');
    
    // Quitar la clase después de la animación
    setTimeout(() => {
        globingGame.player.element.classList.remove('punch');
        globingGame.player.attacking = false;
    }, 300);
}

// Realizar patada
function playerKick() {
    if (globingGame.player.attacking) return;
    
    globingGame.player.attacking = true;
    
    // Añadir clase para la animación
    globingGame.player.element.classList.add('kick');
    
    // Comprobar si el golpe alcanza al enemigo
    checkHit('kick');
    
    // Quitar la clase después de la animación
    setTimeout(() => {
        globingGame.player.element.classList.remove('kick');
        globingGame.player.attacking = false;
    }, 400);
}

// Comprobar si el golpe alcanza al enemigo
function checkHit(attackType) {
    // Calcular distancia entre jugador y enemigo
    const playerRight = globingGame.player.position + 100;
    const enemyLeft = globingGame.gameContainer.offsetWidth - globingGame.enemy.position - 220;
    
    // Si están lo suficientemente cerca
    if (Math.abs(playerRight - enemyLeft) <= globingGame.hitDistance) {
        // Calcular daño basado en el tipo de ataque
        let damage = attackType === 'punch' ? globingGame.punchDamage : globingGame.kickDamage;
        
        // Aplicar daño al enemigo
        enemyTakeDamage(damage);
        
        // Incrementar combo
        incrementCombo();
        
        // Crear efecto visual
        createHitEffect(attackType, globingGame.enemy.element);
    }
}

// Enemigo recibe daño
function enemyTakeDamage(damage) {
    globingGame.enemy.health = Math.max(0, globingGame.enemy.health - damage);
    
    // Actualizar barra de vida
    globingGame.enemy.healthBar.style.width = `${globingGame.enemy.health}%`;
    
    // Mostrar animación de daño
    globingGame.enemy.element.classList.add('damaged');
    setTimeout(() => {
        globingGame.enemy.element.classList.remove('damaged');
    }, 300);
    
    // Comprobar victoria
    if (globingGame.enemy.health <= 0) {
        endGame(true);
    }
}

// Crear efecto visual al golpear
function createHitEffect(attackType, targetElement) {
    const hitEffect = document.createElement('div');
    hitEffect.className = 'hit-effect';
    
    // Texto del golpe según el tipo
    hitEffect.textContent = attackType === 'punch' ? 'POW!' : 'BAM!';
    
    // Posicionar cerca del objetivo
    const rect = targetElement.getBoundingClientRect();
    const arenaRect = globingGame.gameContainer.querySelector('.fight-arena').getBoundingClientRect();
    
    hitEffect.style.left = `${rect.left - arenaRect.left + rect.width/4}px`;
    hitEffect.style.top = `${rect.top - arenaRect.top + rect.height/4}px`;
    
    // Añadir al DOM
    globingGame.gameContainer.querySelector('.fight-arena').appendChild(hitEffect);
    
    // Eliminar después de la animación
    setTimeout(() => {
        hitEffect.remove();
    }, 500);
}

// Incrementar combo
function incrementCombo() {
    globingGame.player.combo++;
    
    // Mostrar contador de combo
    const comboCounter = document.getElementById('combo-counter');
    comboCounter.textContent = `${globingGame.player.combo}x COMBO`;
    comboCounter.classList.remove('active');
    
    // Activar animación (truco para resetear la animación)
    void comboCounter.offsetWidth;
    comboCounter.classList.add('active');
}

// Iniciar la IA del enemigo (muy básica)
function startEnemyAI() {
    if (!globingGame.gameState.active) return;
    
    // Elección aleatoria: moverse o atacar
    const action = Math.random();
    
    if (action < 0.3) {
        // Moverse hacia el jugador
        const direction = globingGame.enemy.position > globingGame.player.position ? -1 : 1;
        moveEnemy(direction);
    } else if (action < 0.7) {
        // Atacar si está cerca
        const playerRight = globingGame.player.position + 100;
        const enemyLeft = globingGame.gameContainer.offsetWidth - globingGame.enemy.position - 220;
        
        if (Math.abs(playerRight - enemyLeft) <= globingGame.hitDistance * 1.2) {
            enemyAttack();
        }
    }
    
    // Programar siguiente acción
    const delay = 500 + Math.random() * 1000;
    setTimeout(startEnemyAI, delay);
}

// Enemigo ataca
function enemyAttack() {
    if (globingGame.enemy.attacking) return;
    
    globingGame.enemy.attacking = true;
    
    // Elegir ataque aleatorio
    const attackType = Math.random() > 0.5 ? 'punch' : 'kick';
    
    // Añadir clase para la animación
    globingGame.enemy.element.classList.add(attackType);
    
    // Comprobar si golpea al jugador
    checkEnemyHit(attackType);
    
    // Quitar la clase después de la animación
    setTimeout(() => {
        globingGame.enemy.element.classList.remove(attackType);
        globingGame.enemy.attacking = false;
    }, attackType === 'punch' ? 300 : 400);
}

// Comprobar si el golpe del enemigo alcanza al jugador
function checkEnemyHit(attackType) {
    // Calcular distancia
    const playerRight = globingGame.player.position + 100;
    const enemyLeft = globingGame.gameContainer.offsetWidth - globingGame.enemy.position - 220;
    
    // Si están lo suficientemente cerca
    if (Math.abs(playerRight - enemyLeft) <= globingGame.hitDistance) {
        // Calcular daño
        let damage = attackType === 'punch' ? 8 : 12;
        
        // Aplicar daño al jugador
        playerTakeDamage(damage);
        
        // Crear efecto visual
        createHitEffect(attackType, globingGame.player.element);
    }
}

// Jugador recibe daño
function playerTakeDamage(damage) {
    globingGame.player.health = Math.max(0, globingGame.player.health - damage);
    
    // Actualizar barra de vida
    globingGame.player.healthBar.style.width = `${globingGame.player.health}%`;
    
    // Mostrar animación de daño
    globingGame.player.element.classList.add('damaged');
    setTimeout(() => {
        globingGame.player.element.classList.remove('damaged');
    }, 300);
    
    // Resetear combo
    globingGame.player.combo = 0;
    
    // Comprobar derrota
    if (globingGame.player.health <= 0) {
        endGame(false);
    }
}

// Actualizar el juego en cada frame
function updateFightGame() {
    // Manejar movimiento continuo
    handleMovement();
    
    // Continuar la animación si el juego sigue activo
    if (globingGame.gameState.active) {
        globingGame.gameState.animationId = requestAnimationFrame(updateFightGame);
    }
}

// Manejar movimiento basado en teclas presionadas
function handleMovement() {
    if (globingGame.player.attacking) return;
    
    if (globingGame.gameState.keysPressed.ArrowLeft) {
        movePlayer(-1);
    }
    
    if (globingGame.gameState.keysPressed.ArrowRight) {
        movePlayer(1);
    }
}

// Mover jugador
function movePlayer(direction) {
    globingGame.player.position += direction * globingGame.moveSpeed;
    
    // Limitar rango de movimiento
    const minX = 20;
    const maxX = globingGame.gameContainer.offsetWidth - 250;
    globingGame.player.position = Math.max(minX, Math.min(maxX, globingGame.player.position));
    
    // Actualizar posición visual
    globingGame.player.element.style.left = `${globingGame.player.position}px`;
}

// Mover enemigo
function moveEnemy(direction) {
    globingGame.enemy.position += direction * globingGame.moveSpeed;
    
    // Limitar rango de movimiento
    const minX = 20;
    const maxX = globingGame.gameContainer.offsetWidth - 250;
    globingGame.enemy.position = Math.max(minX, Math.min(maxX, globingGame.enemy.position));
    
    // Actualizar posición visual
    globingGame.enemy.element.style.right = `${globingGame.enemy.position}px`;
}

// Finalizar el juego
function endGame(playerWins) {
    // Detener el juego
    globingGame.gameState.active = false;
    cancelAnimationFrame(globingGame.gameState.animationId);
    
    // Crear mensaje de resultado
    const resultElement = document.createElement('div');
    resultElement.className = 'game-result';
    resultElement.textContent = playerWins ? '¡VICTORIA!' : '¡DERROTA!';
    globingGame.gameContainer.querySelector('.fight-arena').appendChild(resultElement);
    
    // Crear partículas de celebración si ganó
    if (playerWins) {
        for (let i = 0; i < 30; i++) {
            createParticle();
        }
    }
    
    // Detener la IA del enemigo eliminando los temporizadores
    const highestId = window.setTimeout(() => {}, 0);
    for (let i = 0; i < highestId; i++) {
        window.clearTimeout(i);
    }
    
    // Limpiar eventos
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    
    // Registrar puntuación basada en vida restante y combos
    const score = playerWins ? 
        Math.round(globingGame.player.health * 10 + globingGame.player.combo * 50) : 
        Math.round(globingGame.player.combo * 20);
    
    console.log(`Juego terminado. Puntuación: ${score}`);
    
    // Transición al siguiente juego después de mostrar el resultado
    setTimeout(() => {
        // Si estamos dentro del sistema de gestión de juegos, usar su función
        if (typeof skipToNextGame === 'function') {
            skipToNextGame();
        }
    }, 3000);
}

// Crear partícula de celebración
function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'fight-particle';
    
    // Posición inicial aleatoria
    const x = Math.random() * globingGame.gameContainer.offsetWidth;
    const y = Math.random() * (globingGame.gameContainer.offsetHeight - 100) + 100;
    
    // Color aleatorio
    const hue = Math.floor(Math.random() * 360);
    particle.style.backgroundColor = `hsla(${hue}, 100%, 60%, 0.8)`;
    
    // Posición
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    // Dirección aleatoria
    const tx = (Math.random() - 0.5) * 200;
    const ty = (Math.random() - 0.5) * 200;
    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    
    // Añadir al DOM
    globingGame.gameContainer.querySelector('.fight-arena').appendChild(particle);
    
    // Eliminar después de la animación
    setTimeout(() => {
        particle.remove();
    }, 1000);
}