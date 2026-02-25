const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elementos DOM
const startScreen = document.getElementById('start-screen');
const pauseScreen = document.getElementById('pause-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseBtn = document.getElementById('pause-btn');

// Variáveis
let gameRunning = false;
let isPaused = false;
let score = 0;
let lives = 3;
let speedMultiplier = 1;
let animationId;

// Resize
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Classes
class Player {
    constructor() {
        this.width = 60;
        this.height = 60;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 120;
        this.targetX = this.x;
    }

    draw() {
        // Corpo
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 10);
        ctx.fill();

        // Orelhas
        ctx.fillStyle = '#5D2906';
        ctx.beginPath();
        ctx.ellipse(this.x + 10, this.y + 10, 8, 15, -0.3, 0, Math.PI * 2);
        ctx.ellipse(this.x + this.width - 10, this.y + 10, 8, 15, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Focinho
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height - 10, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Olhos
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(this.x + 18, this.y + 25, 6, 0, Math.PI * 2);
        ctx.arc(this.x + this.width - 18, this.y + 25, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 18, this.y + 25, 3, 0, Math.PI * 2);
        ctx.arc(this.x + this.width - 18, this.y + 25, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    update(targetX) {
        // Suavização
        this.targetX = targetX - this.width / 2;
        this.targetX = Math.max(0, Math.min(this.targetX, canvas.width - this.width));
        this.x += (this.targetX - this.x) * 0.2;
    }
}

class Mosquito {
    constructor() {
        this.width = 35;
        this.height = 20;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -50;
        this.speed = (Math.random() * 3 + 2.5) * speedMultiplier;
        this.wingPhase = Math.random() * Math.PI * 2;
    }

    draw() {
        this.wingPhase += 0.5;
        
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Asas vibrando
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for(let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.ellipse(i === 0 ? -8 : 8, -5, 15, 6, Math.sin(this.wingPhase) * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Corpo
        ctx.fillStyle = '#D2B48C'; // Cor palha
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pernas
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        for(let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 6, 5);
            ctx.lineTo(i * 10, 15);
            ctx.stroke();
        }

        // Probóscide (ferrão)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(25, 2);
        ctx.stroke();

        ctx.restore();
    }

    update() {
        this.y += this.speed;
        // Movimento em zigue-zague
        this.x += Math.sin(this.y * 0.02) * 1.5;
    }
}

class Repellent {
    constructor() {
        this.width = 30;
        this.height = 40;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -50;
        this.speed = 4 * speedMultiplier;
        this.rotation = 0;
    }

    draw() {
        this.rotation += 0.05;
        
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Brilho
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 15;

        // Garrafa
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.roundRect(-10, -15, 20, 30, 5);
        ctx.fill();

        // Tampa
        ctx.fillStyle = '#006400';
        ctx.beginPath();
        ctx.roundRect(-6, -22, 12, 8, 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('R', -4, 5);

        ctx.restore();
    }

    update() {
        this.y += this.speed;
    }
}

// Variáveis de jogo
let player = new Player();
let enemies = [];
let items = [];
let enemyTimer = 0;
let itemTimer = 0;
let inputX = canvas.width / 2;

// Input
function handleInput(x) {
    inputX = x;
}

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleInput(e.touches[0].clientX);
}, { passive: false });

window.addEventListener('touchstart', (e) => {
    handleInput(e.touches[0].clientX);
});

window.addEventListener('mousemove', (e) => {
    if(gameRunning && !isPaused) handleInput(e.clientX);
});

// Pause
pauseBtn.addEventListener('click', () => {
    if(gameRunning && !isPaused) {
        isPaused = true;
        pauseScreen.classList.remove('hidden');
    }
});

function resumeGame() {
    isPaused = false;
    pauseScreen.classList.add('hidden');
    lastTime = performance.now();
    gameLoop(performance.now());
}

function quitGame() {
    gameRunning = false;
    isPaused = false;
    pauseScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
}

// Loop
let lastTime = 0;

function gameLoop(timestamp) {
    if (!gameRunning || isPaused) return;

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo
    drawBackground();

    // Spawn
    enemyTimer += deltaTime;
    itemTimer += deltaTime;
    speedMultiplier = 1 + (score / 300);

    if (enemyTimer > 800 / speedMultiplier) {
        enemies.push(new Mosquito());
        enemyTimer = 0;
    }

    if (itemTimer > 2500) {
        items.push(new Repellent());
        itemTimer = 0;
    }

    // Player
    player.update(inputX);
    player.draw();

    // Enemies
    enemies.forEach((e, i) => {
        e.update();
        e.draw();
        if (e.y > canvas.height) enemies.splice(i, 1);
    });

    // Items
    items.forEach((i, index) => {
        i.update();
        i.draw();
        if (i.y > canvas.height) items.splice(index, 1);
    });

    // Colisões
    checkCollisions();

    animationId = requestAnimationFrame(gameLoop);
}

function drawBackground() {
    // Chão
    ctx.fillStyle = '#556B2F';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    
    // Grama
    ctx.fillStyle = '#6B8E23';
    for(let i=0; i<canvas.width; i+=30) {
        ctx.beginPath();
        ctx.moveTo(i, canvas.height-80);
        ctx.lineTo(i+15, canvas.height-100);
        ctx.lineTo(i+30, canvas.height-80);
        ctx.closePath();
        ctx.fill();
    }

    // Nuvens
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    const time = Date.now() * 0.0001;
    for(let i=0; i<3; i++) {
        let nx = ((i * 200) + time * 50) % (canvas.width + 100) - 50;
        ctx.beginPath();
        ctx.arc(nx, 80, 30, 0, Math.PI * 2);
        ctx.arc(nx + 25, 70, 35, 0, Math.PI * 2);
        ctx.arc(nx + 50, 80, 25, 0, Math.PI * 2);
        ctx.fill();
    }
}

function checkCollisions() {
    // Mosquito
    enemies.forEach((e, i) => {
        if (rectIntersect(player.x, player.y, player.width, player.height,
                          e.x, e.y, e.width, e.height)) {
            lives--;
            enemies.splice(i, 1);
            updateHUD();
            screenShake();
            if (lives <= 0) gameOver();
        }
    });

    // Repelente
    items.forEach((item, i) => {
        if (rectIntersect(player.x, player.y, player.width, player.height,
                          item.x, item.y, item.width, item.height)) {
            score += 10;
            items.splice(i, 1);
            updateHUD();
        }
    });
}

function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
}

function screenShake() {
    canvas.style.transform = `translate(${Math.random()*10-5}px, ${Math.random()*10-5}px)`;
    setTimeout(() => canvas.style.transform = 'none', 100);
}

function updateHUD() {
    document.getElementById('scoreDisplay').textContent = `Pontos: ${score}`;
    document.getElementById('healthDisplay').textContent = '❤️'.repeat(lives);
}

function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    score = 0;
    lives = 3;
    enemies = [];
    items = [];
    speedMultiplier = 1;
    player = new Player();
    inputX = canvas.width / 2;
    
    updateHUD();
    gameRunning = true;
    isPaused = false;
    lastTime = performance.now();
    gameLoop(performance.now());
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    document.getElementById('final-score').textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Tecla Escape para pause (PC)
window.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && gameRunning && !isPaused) {
        isPaused = true;
        pauseScreen.classList.remove('hidden');
    }
});