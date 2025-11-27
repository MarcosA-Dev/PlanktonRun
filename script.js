const plankton = document.getElementById('plankton');
const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score');
const gameOverDisplay = document.getElementById('game-over');

// === Configurações do Jogo ===
const LINE_THICKNESS = 3; 
// Variáveis de controle de dificuldade
const GAME_LOOP_INTERVAL = 16; 
let gameInterval;
let obstacleInterval;

const OBSTACLE_TYPES = ['weak', 'strong']; 

let isJumping = false;
let isGameOver = false;
let score = 0;

let groundLevelY; // Posição Y do chão para Plankton

// === NOVAS VARIÁVEIS DE VELOCIDADE PROGRESSIVA ===
let currentSpeedBase; // Velocidade base (em porcentagem)
let jumpCounter; // Contador de pulos
// ===============================================

function calculateGameMetrics() {
    const centerLineY = gameContainer.clientHeight * 0.5;
    groundLevelY = centerLineY - plankton.clientHeight;

    if (!isJumping && !isGameOver) {
        plankton.style.top = `${groundLevelY}px`;
    }
    
    const halfLineThickness = LINE_THICKNESS / 2;

    document.querySelectorAll('.obstacle').forEach(obstacle => {
        const waveId = obstacle.getAttribute('data-wave-id');
        const decoration = document.querySelector(`.obstacle-decoration[data-wave-id="${waveId}"]`);

        obstacle.style.top = `${centerLineY - obstacle.clientHeight}px`;
        
        if (decoration) {
             decoration.style.top = `${centerLineY + halfLineThickness}px`; 
             const baseHeightVH = 0.15; 
             decoration.style.height = `${gameContainer.clientHeight * baseHeightVH}px`;
        }
    });
}

function jump() {
    if (isJumping || isGameOver) return;
    isJumping = true;
    
    let verticalVelocity = 20; 
    let currentTop = plankton.offsetTop;
    
    const jumpLoop = setInterval(() => {
        currentTop -= verticalVelocity; 
        verticalVelocity -= 0.8; 

        if (currentTop < 0) currentTop = 0; 

        if (currentTop >= groundLevelY) {
            currentTop = groundLevelY; 
            plankton.style.top = `${groundLevelY}px`;
            isJumping = false;
            clearInterval(jumpLoop);
            
            // LÓGICA DE VELOCIDADE PROGRESSIVA
            jumpCounter++;
            if (jumpCounter >= 7) {
                currentSpeedBase += 0.001; // Aumenta a velocidade em 0.001
                jumpCounter = 0; // Reseta o contador
                // console.log(`Nova Velocidade: ${currentSpeedBase.toFixed(4)}`);
            }
            
            return;
        }
        
        plankton.style.top = `${currentTop}px`;
    }, GAME_LOOP_INTERVAL);
}

function createObstacle() {
    if (isGameOver) return;

    const uniqueId = Date.now() + Math.random(); 
    
    const obstacleContainer = document.createElement('div');
    obstacleContainer.classList.add('obstacle');
    obstacleContainer.setAttribute('data-wave-id', uniqueId);

    const decorationContainer = document.createElement('div');
    decorationContainer.classList.add('obstacle-decoration');
    decorationContainer.setAttribute('data-wave-id', uniqueId);

    
    let containerWidth;
    let containerHeight; 

    const randomType = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
    
    if (randomType === 'weak') {
        containerWidth = 40; 
        containerHeight = gameContainer.clientHeight * 0.06; 
    } else { 
        containerWidth = 60; 
        containerHeight = gameContainer.clientHeight * 0.1; 
    }

    obstacleContainer.style.width = `${containerWidth}px`;
    obstacleContainer.style.height = `${containerHeight}px`;

    decorationContainer.style.width = `${containerWidth}px`;
    decorationContainer.style.height = `${containerHeight}px`;
    
    const segmentWidth = 3; 
    const segmentMargin = 1;
    const numSegments = Math.floor(containerWidth / (segmentWidth + segmentMargin)); 
    
    for (let i = 0; i < numSegments; i++) {
        const minHeightPercent = 0.2; 
        const maxHeightPercent = 1.0; 
        const randomHeight = (Math.random() * (maxHeightPercent - minHeightPercent) + minHeightPercent) * containerHeight;
        
        const segmentUp = document.createElement('div');
        segmentUp.classList.add('wave-segment');
        segmentUp.style.height = `${randomHeight}px`;
        obstacleContainer.appendChild(segmentUp);
        
        const segmentDown = document.createElement('div');
        segmentDown.classList.add('wave-segment');
        
        segmentDown.style.height = `${randomHeight * 0.7}px`; 
        decorationContainer.appendChild(segmentDown);
    }
    
    gameContainer.appendChild(obstacleContainer); 
    gameContainer.appendChild(decorationContainer);

    const centerLineY = gameContainer.clientHeight * 0.5;
    const halfLineThickness = LINE_THICKNESS / 2;
    
    obstacleContainer.style.top = `${centerLineY - obstacleContainer.clientHeight}px`;
    obstacleContainer.style.right = '0px'; 
    
    decorationContainer.style.top = `${centerLineY + halfLineThickness}px`; 
    decorationContainer.style.right = '0px'; 
    
    const randomTime = Math.random() * 800 + 800; 
    obstacleInterval = setTimeout(createObstacle, randomTime);
}

function gameLoop() {
    if (isGameOver) return;
    
    // Usa a velocidade base atualizada
    const actualSpeed = gameContainer.clientWidth * currentSpeedBase; 

    document.querySelectorAll('.obstacle').forEach(obstacle => {
        let currentRight = parseFloat(getComputedStyle(obstacle).right); 
        
        currentRight += actualSpeed; 
        obstacle.style.right = `${currentRight}px`;

        const waveId = obstacle.getAttribute('data-wave-id');
        const decoration = document.querySelector(`.obstacle-decoration[data-wave-id="${waveId}"]`);
        
        if (decoration) {
            decoration.style.right = `${currentRight}px`;
        }
        
        if (currentRight > gameContainer.clientWidth) {
            obstacle.remove();
            if (decoration) decoration.remove(); 
            score++;
            scoreDisplay.textContent = score;
            return; 
        }

        const planktonRect = plankton.getBoundingClientRect();
        const obstacleRect = obstacle.getBoundingClientRect(); 
        
        const PLANKTON_CUT_LEFT = 0.30; 
        const PLANKTON_CUT_RIGHT = 0.20; 

        const adjustedPlanktonRect = {
            left: planktonRect.left + (planktonRect.width * PLANKTON_CUT_LEFT), 
            width: planktonRect.width * (1 - PLANKTON_CUT_LEFT - PLANKTON_CUT_RIGHT), 
            top: planktonRect.top,
            height: planktonRect.height
        };
        
        if (
            adjustedPlanktonRect.left < obstacleRect.left + obstacleRect.width && 
            adjustedPlanktonRect.left + adjustedPlanktonRect.width > obstacleRect.left && 
            planktonRect.top < obstacleRect.top + obstacleRect.height && 
            planktonRect.top + planktonRect.height > obstacleRect.top 
        ) {
            endGame();
        }
    });
}

function endGame() {
    isGameOver = true;
    clearInterval(gameInterval);
    clearTimeout(obstacleInterval); 

    gameOverDisplay.style.display = 'block';
}

function startGame() {
    isGameOver = false;
    isJumping = false;
    score = 0;
    
    // INICIALIZAÇÃO DA VELOCIDADE
    currentSpeedBase = 0.003; // Começa em 0.002
    jumpCounter = 0;
    
    scoreDisplay.textContent = 0;
    gameOverDisplay.style.display = 'none';
    document.querySelectorAll('.obstacle').forEach(o => o.remove());
    document.querySelectorAll('.obstacle-decoration').forEach(o => o.remove()); 

    calculateGameMetrics(); 
    plankton.style.top = `${groundLevelY}px`; 

    gameInterval = setInterval(gameLoop, GAME_LOOP_INTERVAL);
    createObstacle();
}

const handleInput = () => {
    if (isGameOver) {
        startGame();
    } else {
        jump();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
        handleInput();
    }
});

document.addEventListener('touchstart', handleInput, { passive: false });
gameOverDisplay.addEventListener('click', startGame);

startGame();
window.addEventListener('resize', calculateGameMetrics);