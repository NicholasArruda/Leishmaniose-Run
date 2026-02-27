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

const REPEL_RADIUS = 175;

// =====================
// 🔊 EFEITOS SONOROS
// =====================

let soundEnabled = true;

const sfxMosquitoHit = new Audio("assets/sounds/mosquito.mp3");
const sfxBone = new Audio("assets/sounds/bone.mp3");
const sfxRepel = new Audio("assets/sounds/repel.mp3");
const sfxGameOver = new Audio("assets/sounds/gameover.mp3");
const sfxMosquitoDeath = new Audio("assets/sounds/mosquito_death.mp3");


// =====================
// 🎵 MÚSICA DE FUNDO
// =====================

const bgMusic = new Audio("assets/sounds/music.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4;

function playSound(sound) {
    if (!soundEnabled) return;

    sound.currentTime = 0;
    sound.play();
}

function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

// dicas de prevenção que aparecerão na tela de fim de jogo
const preventionTips = [
    'Mantenha o ambiente limpo e livre de lixo para não atrair mosquitos.',
    'Use repelente regularmente ao sair de casa, principalmente ao anoitecer.',
    'Evite áreas com acúmulo de matéria orgânica e solo úmido.',
    'Proteja seu cão com produtos veterinários adequados.',
    'Drene a água parada em recipientes ao redor da casa para não criar criadouros.'
];
// bone image
let boneImage = new Image();
let boneImageLoaded = false;
boneImage.src = 'assets/osso.png';
boneImage.onload = () => { boneImageLoaded = true; };

// sidewalk image (try accented filename first, then fallback)
let sidewalkImage = new Image();
let sidewalkImageLoaded = false;
sidewalkImage.onload = () => { sidewalkImageLoaded = true; };
sidewalkImage.onerror = () => {
    // try unaccented fallback
    if (sidewalkImage.src.indexOf('calçada.png') !== -1 || sidewalkImage.src.indexOf('cal%C3%A7ada.png') !== -1) {
        sidewalkImage.src = 'assets/calcada.png';
    }
};
sidewalkImage.src = 'assets/calçada.png';

// repellent image
let repellentImage = new Image();
let repellentImageLoaded = false;
repellentImage.src = 'assets/repelente.png';
repellentImage.onload = () => { repellentImageLoaded = true; };
repellentImage.onerror = () => {
    // try unaccented fallback
    if (repellentImage.src.indexOf('repelente.png') !== -1) {
        repellentImage.src = 'assets/repellent.png';
    }
};

//dog image
let dogImage = new Image();
let dogImageLoaded = false;
dogImage.src = 'assets/dog.png';
dogImage.onload = () => { dogImageLoaded = true; };
dogImage.onerror = () => {
    // try unaccented fallback
    if (dogImage.src.indexOf('dog.png') !== -1) {
        dogImage.src = 'assets/dog.png';
    }
}
// mosquito image
let mosquitoImage = new Image();
let mosquitoImageLoaded = false;
mosquitoImage.src = 'assets/mosquito.png';
mosquitoImage.onload = () => { mosquitoImageLoaded = true; };
mosquitoImage.onerror = () => {
    // try unaccented fallback
    if (mosquitoImage.src.indexOf('mosquito.png') !== -1) {
        mosquitoImage.src = 'assets/mosquito.png';
    }
}

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
        this.width = 90;
        this.height = 90;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 120;
        this.targetX = this.x;

        this.velocityX = 0;
        this.rotation = 0;

        this.hitboxWidth = this.width * 0.6;
        this.hitboxHeight = this.height * 0.6;
    }

    draw() {
        ctx.save();

        // move para o centro do player
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // aplica rotação
        ctx.rotate(this.rotation);

        if (dogImageLoaded) {
            ctx.drawImage(
                dogImage,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        }

        ctx.restore();
    }

    update(targetX) {
        this.targetX = targetX - this.width / 2;
        this.targetX = Math.max(0, Math.min(this.targetX, canvas.width - this.width));

        // calcula velocidade
        this.velocityX = (this.targetX - this.x) * 0.15;

        // aplica movimento
        this.x += this.velocityX;

        // rotação baseada na velocidade
        this.rotation = this.velocityX * 0.03;
    }

    getHitbox() {
        return {
            x: this.x + (this.width - this.hitboxWidth) / 2,
            y: this.y + (this.height - this.hitboxHeight) / 2,
            width: this.hitboxWidth,
            height: this.hitboxHeight
        };
    }
}

class Mosquito {
    constructor() {
        this.width = 50;
        this.height = 50;

        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;

        this.baseSpeed = (Math.random() * 2 + 2);
        this.speed = this.baseSpeed * speedMultiplier;

        this.angle = Math.random() * Math.PI * 2;
        this.rotation = 0;
        this.rotationSpeed = 0;

        this.hitboxWidth = this.width * 0.6;
        this.hitboxHeight = this.height * 0.6;
    }

    draw() {
        ctx.save();

        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        if (mosquitoImageLoaded) {
            ctx.drawImage(
                mosquitoImage,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        }

        ctx.restore();
    }

    update() {
        // cai para baixo
        this.y += this.speed;

        // zigue-zague horizontal
        this.angle += 0.05;
        this.x += Math.sin(this.angle) * 0.5;

        // rotação leve
        this.rotation = Math.sin(this.angle) * 0.2;
    }

    getHitbox() {
        return {
            x: this.x + (this.width - this.hitboxWidth) / 2,
            y: this.y + (this.height - this.hitboxHeight) / 2,
            width: this.hitboxWidth,
            height: this.hitboxHeight
        };
    }
}
class Repellent {
    constructor() {
        this.width = 70;
        this.height = 91;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -50;
        this.speed = 4 * speedMultiplier;
        this.rotation = 0;

        this.hitboxWidth = this.width * 0.7;
        this.hitboxHeight = this.height * 0.7;
    }

    draw() {
        this.rotation += 0.05;

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        if (repellentImageLoaded) {
            // draw the repellent sprite centered
            ctx.drawImage(repellentImage, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // fallback: simple green bottle if image not loaded
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
        }

        ctx.restore();
    }

    update() {
        this.y += this.speed;
    }

    getHitbox() {
        return {
            x: this.x + (this.width - this.hitboxWidth) / 2,
            y: this.y + (this.height - this.hitboxHeight) / 2,
            width: this.hitboxWidth,
            height: this.hitboxHeight
        };
    }
}

// gadget osso dá vida extra até máximo de 3
class Bone {
    constructor() {
        this.width = 50;
        this.height = 50;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -50;
        this.speed = 3 * speedMultiplier;
        this.rotation = Math.random() * Math.PI * 2;
        this.spin = (Math.random() * 0.12 + 0.04) * (Math.random() < 0.5 ? -1 : 1);

        this.hitboxWidth = this.width * 0.6;
        this.hitboxHeight = this.height * 0.6;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        if (boneImageLoaded) {
            // draw the bone sprite centered
            ctx.drawImage(boneImage, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // fallback: simple shape if image not loaded
            ctx.fillStyle = '#F5DEB3';
            ctx.strokeStyle = '#DEB887';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, -5);
            ctx.lineTo(10, -5);
            ctx.lineTo(10, 5);
            ctx.lineTo(-10, 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(-10, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(10, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

    update() {
        this.y += this.speed;
        // continuous rotation while falling
        this.rotation += this.spin;
        // slight horizontal sway
        this.x += Math.sin(this.y * 0.02) * 0.5;
    }

    getHitbox() {
        return {
            x: this.x + (this.width - this.hitboxWidth) / 2,
            y: this.y + (this.height - this.hitboxHeight) / 2,
            width: this.hitboxWidth,
            height: this.hitboxHeight
        };
    }
}

// Variáveis de jogo
let player = new Player();
let enemies = [];
let items = [];
let bones = [];
let enemyTimer = 0;
let itemTimer = 0;
let boneTimer = 0;
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
    if (gameRunning && !isPaused) handleInput(e.clientX);
});

// Pause
pauseBtn.addEventListener('click', () => {
    if (gameRunning && !isPaused) {
        isPaused = true;
        pauseScreen.classList.remove('hidden');
        updatePauseIcon();
    }
});

// atualiza o ícone do botão de pausa/play conforme estado
function updatePauseIcon() {
    const icon = document.getElementById('pause-icon');
    const labelSpan = pauseBtn.querySelector('.btn-label');
    if (!icon) return;
    if (isPaused || !gameRunning) {
        icon.src = 'assets/play.png';
        icon.alt = 'Continuar';
        pauseBtn.title = 'Continuar o jogo';
        pauseBtn.setAttribute('aria-label', 'Continuar');
        if (labelSpan) labelSpan.textContent = 'Continuar';
    } else {
        icon.src = 'assets/pause.png';
        icon.alt = 'Pausar';
        pauseBtn.title = 'Pausar o jogo';
        pauseBtn.setAttribute('aria-label', 'Pausar');
        if (labelSpan) labelSpan.textContent = 'Pausar';
    }
}

function resumeGame() {
    isPaused = false;
    pauseScreen.classList.add('hidden');
    updatePauseIcon();
    lastTime = performance.now();
    gameLoop(performance.now());
}

function quitGame() {
    gameRunning = false;
    isPaused = false;
    pauseScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    updatePauseIcon();
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
    // spawn de osso esporádico (aprox uma vez a cada 15s)
    boneTimer += deltaTime;
    if (boneTimer > 15000) {
        if (Math.random() < 0.5) bones.push(new Bone());
        boneTimer = 0;
    }

    // Player
    player.update(inputX);
    player.draw();

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {

        enemies[i].update();
        enemies[i].draw();

        if (enemies[i].y > player.y + player.height) {
            enemies.splice(i, 1);
        }
    }

    // Items
    for (let i = items.length - 1; i >= 0; i--) {

        items[i].update();
        items[i].draw();
        if (items[i].y > player.y + player.height) {
            items.splice(i, 1);
        }
    }

    // Bones
    for (let i = bones.length - 1; i >= 0; i--) {

        bones[i].update();
        bones[i].draw();

        if (bones[i].y > player.y + player.height) {
            bones.splice(i, 1);
        }
    }

    // Colisões
    checkCollisions();

    // efeitos visuais de colisão
    updateEffects();

    animationId = requestAnimationFrame(gameLoop);

}

function drawBackground() {
    // Chão / calçada
    const sidewalkY = canvas.height - 80;
    if (sidewalkImageLoaded) {
        // draw the sidewalk texture stretched to the sidewalk area
        ctx.drawImage(sidewalkImage, 0, sidewalkY, canvas.width, 80);
        // overlay lines to emphasize joints (no transparency)
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1.5;
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, sidewalkY);
            ctx.lineTo(x, sidewalkY + 80);
            ctx.stroke();
        }
        for (let y = sidewalkY; y <= sidewalkY + 80; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        ctx.restore();
    } else {
        // fallback: simple drawn sidewalk
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(0, sidewalkY, canvas.width, 80);
        // juntas da calçada (linhas entre ladrilhos)
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, sidewalkY);
            ctx.lineTo(x, sidewalkY + 80);
            ctx.stroke();
        }
        for (let y = sidewalkY; y <= sidewalkY + 80; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    // Nuvens
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    const time = Date.now() * 0.0001;
    for (let i = 0; i < 3; i++) {
        let nx = ((i * 200) + time * 50) % (canvas.width + 100) - 50;
        ctx.beginPath();
        ctx.arc(nx, 80, 30, 0, Math.PI * 2);
        ctx.arc(nx + 25, 70, 35, 0, Math.PI * 2);
        ctx.arc(nx + 50, 80, 25, 0, Math.PI * 2);
        ctx.fill();
    }
}

// effects generated by collisions (particles, flashes, etc.)
let effects = [];

function checkCollisions() {
    // Mosquito
    enemies.forEach((e, i) => {

        const p = player.getHitbox();
        const m = e.getHitbox();

        if (rectIntersect(
            p.x, p.y, p.width, p.height,
            m.x, m.y, m.width, m.height
        )) {
            lives--;
            sfxMosquitoHit.currentTime = 0;
            sfxMosquitoHit.play();
            enemies.splice(i, 1);
            updateHUD();
            screenShake();
            createEffect(player.x + player.width / 2, player.y + player.height / 2, 'hit');

            if (lives <= 0) gameOver();
        }
    });

    // Repelente
    items.forEach((item, itemIndex) => {

        const p = player.getHitbox();
        const r = item.getHitbox();

        if (rectIntersect(
            p.x, p.y, p.width, p.height,
            r.x, r.y, r.width, r.height
        )) {

            // remove o repelente
            items.splice(itemIndex, 1);

            const blastX = item.x + item.width / 2;
            const blastY = item.y + item.height / 2;

            // ✅ ganha +10 ao pegar
            score += 10;

            sfxRepel.currentTime = 0;
            sfxRepel.play();

            createEffect(blastX, blastY, 'collect');
            createEffect(blastX, blastY, 'repelBlast');

            // 🔥 LOOP REVERSO PARA NÃO CRASHAR
            for (let i = enemies.length - 1; i >= 0; i--) {

                const e = enemies[i];

                const mx = e.x + e.width / 2;
                const my = e.y + e.height / 2;

                if (distance(blastX, blastY, mx, my) <= REPEL_RADIUS) {

                    score += 5;

                    createEffect(mx, my, 'mosquitoDeath');
                    createEffect(mx, my, 'plusFive');

                    sfxMosquitoDeath.currentTime = 0;
                    sfxMosquitoDeath.play();


                    enemies.splice(i, 1);
                }
            }

            updateHUD();
        }
    });
    // Osso
    bones.forEach((b, i) => {
        const p = player.getHitbox();
        const boneHB = b.getHitbox();

        if (rectIntersect(
            p.x, p.y, p.width, p.height,
            boneHB.x, boneHB.y, boneHB.width, boneHB.height
        )) {
            bones.splice(i, 1);
            if (lives < 3) {
                lives++;
                sfxBone.currentTime = 0;
                sfxBone.play();
                updateHUD();
                createEffect(b.x + b.width / 2, b.y + b.height / 2, 'bone');
            }
        }
    });
}


function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
}

function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function screenShake() {
    canvas.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
    setTimeout(() => canvas.style.transform = 'none', 100);
}

// -----------------------------------
// Collision / particle effects
// -----------------------------------
class Effect {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.life = 40;
        this.maxLife = 40;
        this.radius = 20;

        // 🦴 BONE EXPLOSION
        if (type === 'bone') {
            this.particles = [];
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 4 + 2;

                this.particles.push({
                    x: 0,
                    y: 0,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * 6 + 4,
                    color: `hsl(${Math.random() * 60 + 30}, 100%, 60%)`
                });
            }
            this.ringRadius = 0;
        }

        // 🌿 REPEL BLAST
        if (type === 'repelBlast') {
            this.radius = 0;
        }

        // ➕ FLOATING +5
        if (type === 'plusFive') {
            this.floatY = y;
        }

        // ✨ FLOATING +10
        if (type === 'collect') {
            this.floatY = y;
        }
    }

    update() {
        this.life--;
        const alpha = this.life / this.maxLife;

        // 💥 HIT
        if (this.type === 'hit') {
            this.radius += 2;
        }

        // ✨ COLLECT +10
        if (this.type === 'collect') {
            this.floatY -= 1;
        }

        // 🦴 BONE
        else if (this.type === 'bone') {
            this.ringRadius += 4;

            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.95;
                p.vy *= 0.95;
                p.size *= 0.95;
            });
        }

        // 🌿 REPEL BLAST
        else if (this.type === 'repelBlast') {
            this.radius += 6;
        }

        // ➕ PLUS FIVE
        else if (this.type === 'plusFive') {
            this.floatY -= 1.2;
        }

        // 🦟 MOSQUITO DEATH
        else if (this.type === 'mosquitoDeath') {
            this.radius += 1.5;
        }
    }

    draw() {
        const alpha = this.life / this.maxLife;

        // 💥 HIT
        if (this.type === 'hit') {
            ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.4})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(255, 50, 50, ${alpha})`;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // ✨ COLLECT +10
        else if (this.type === 'collect') {
            ctx.font = `bold ${20 * alpha}px Arial`;
            ctx.fillStyle = `rgba(0,255,0,${alpha})`;
            ctx.fillText("+10", this.x - 15, this.floatY);
        }

        // 🦴 BONE EXPLOSION
        else if (this.type === 'bone') {

            // anel dourado
            ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.ringRadius, 0, Math.PI * 2);
            ctx.stroke();

            // partículas
            this.particles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(this.x + p.x, this.y + p.y, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // 🌿 REPEL BLAST
        else if (this.type === 'repelBlast') {
            ctx.strokeStyle = `rgba(0,255,150,${alpha})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // ➕ PLUS FIVE
        else if (this.type === 'plusFive') {
            ctx.font = `bold ${18 * alpha}px Arial`;
            ctx.fillStyle = `rgba(0,255,0,${alpha})`;
            ctx.fillText("+5", this.x - 12, this.floatY);
        }

        // 🦟 MOSQUITO DEATH
        else if (this.type === 'mosquitoDeath') {
            ctx.fillStyle = `rgba(255,0,0,${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
function createEffect(x, y, type) {
    effects.push(new Effect(x, y, type));
}

function updateEffects() {
    for (let i = effects.length - 1; i >= 0; i--) {
        const ef = effects[i];
        ef.update();
        ef.draw();
        if (ef.life <= 0) effects.splice(i, 1);
    }
}

function updateHUD() {
    document.getElementById('scoreDisplay').textContent = `Pontos: ${score}`;
    document.getElementById('healthDisplay').textContent = '❤️'.repeat(lives);
}

function startGame() {
    bgMusic.currentTime = 0;
    bgMusic.play();

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    score = 0;
    lives = 3;
    enemies = [];
    items = [];
    bones = [];
    enemyTimer = 0;
    itemTimer = 0;
    boneTimer = 0;
    speedMultiplier = 1;
    player = new Player();
    inputX = canvas.width / 2;

    updateHUD();
    gameRunning = true;
    isPaused = false;
    updatePauseIcon();
    lastTime = performance.now();
    gameLoop(performance.now());
}

function gameOver() {
    bgMusic.pause();

    sfxGameOver.currentTime = 0;
    sfxGameOver.play();

    gameRunning = false;
    cancelAnimationFrame(animationId);
    document.getElementById('final-score').textContent = score;
    // mostrar dica aleatória numerada
    const titleEl = document.getElementById('game-over-tip-title');
    const textEl = document.getElementById('game-over-tip-text');
    if (titleEl && textEl) {
        const randomIndex = Math.floor(Math.random() * preventionTips.length);
        titleEl.textContent = `Dica #${randomIndex + 1}`;
        textEl.textContent = preventionTips[randomIndex];
    }
    gameOverScreen.classList.remove('hidden');
}

// Tecla Escape para pause (PC)
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameRunning && !isPaused) {
        isPaused = true;
        pauseScreen.classList.remove('hidden');
    }
});

const toggleSoundBtn = document.getElementById("toggleSoundBtn");

toggleSoundBtn.addEventListener("click", () => {

    soundEnabled = !soundEnabled;

    if (!soundEnabled) {

        bgMusic.pause();

        sfxBone.muted = true;
        sfxRepel.muted = true;
        sfxMosquitoHit.muted = true;
        sfxMosquitoDeath.muted = true;
        sfxGameOver.muted = true;

        toggleSoundBtn.textContent = "🔇 Som: OFF";

    } else {

        bgMusic.play();

        sfxBone.muted = false;
        sfxRepel.muted = false;
        sfxMosquitoHit.muted = false;
        sfxMosquitoDeath.muted = false;
        sfxGameOver.muted = false;

        toggleSoundBtn.textContent = "🔊 Som: ON";
    }
});