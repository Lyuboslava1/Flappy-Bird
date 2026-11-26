let board;
const boardWidth = 360;
const boardHeight = 640;
let context;

const BG_DAY = "./flappybirdbg.png";
const BG_NIGHT = "./flappybirdbgnight.png";

const SWITCH_START_FRAME = 7;
const SWITCH_TO_NIGHT_FRAMES = [7, 6, 5, 4, 3];
const SWITCH_TO_DAY_FRAMES = [3, 2, 1, 0];
const SWITCH_FRAME_MS = 45;

const btnImgs = [];
let btnAnimInterval = null;

for (let i = 0; i < 8; i++) {
    const img = new Image();
    img.src = `./btn_animation/frame${i}.png`;
    btnImgs.push(img);
}


const birdWidth = 64;
const birdHeight = 45;
const birdX = boardWidth / 8;
const birdY = boardHeight / 2;

const birdImgs = [];
let birdImgsIndex = 0;
let birdAnimInterval = null;

const bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
};

const HITBOX_PAD_X = 8;
const HITBOX_PAD_Y = 6;

function getBirdHitbox() {
    return {
        x: bird.x + HITBOX_PAD_X,
        y: bird.y + HITBOX_PAD_Y,
        width: bird.width - HITBOX_PAD_X * 2,
        height: bird.height - HITBOX_PAD_Y * 2
    };
}


let pipeArray = [];
const pipeWidth = 64;
const pipeHeight = 512;
const pipeX = boardWidth;
const pipeY = 0;

let topPipeImg;
let bottomPipeImg;


const velocityX = -2;
let velocityY = 0;
const gravity = 0.4;


let coinArray = [];
let floatTexts = [];
let coinCount = 0;
const coinRadius = 12;
const ARC_CHANCE = 0.5;      
const PIPE_SPAWN_FRAMES = 90;                        
const pipeSpacing = -velocityX * PIPE_SPAWN_FRAMES;  


let heartArray = [];
const MAX_LIVES = 3;         
const heartRadius = 14;
const HEART_CHANCE = 0.12;   
const HEART_MIN_PIPES = 4;   
let pipesSinceHeart = 0;


const MONSTER_CHANCE = 0.30;        
const GREEN_SHOOTER_CHANCE = 0.5;   
const MONSTER_MIN_PIPES = 2;        
const MONSTER_MAX_EXT = 44;         
const MONSTER_HIDE = 70;            
const MONSTER_RISE = 18;            
const MONSTER_HOLD = 45;            
const MONSTER_FALL = 18;            
const MONSTER_CYCLE = MONSTER_HIDE + MONSTER_RISE + MONSTER_HOLD + MONSTER_FALL;
let pipesSinceMonster = 0;


let enemyFireballs = [];
const ENEMY_FIRE_SPEED_Y = 3.0;
const ENEMY_FIRE_RADIUS = 8;


let gameOver = false;
let score = 0;
let highScore = 0;
let lives = 3;
let isPausedForDecision = false;
var isTutorialWaiting = true;
let frameCounter = 0;
let isNightMode = false;


let mouseX = -1;
let mouseY = -1;


const wingSound = new Audio("./sound_file/sfx_wing.wav");
const hitSound = new Audio("./sound_file/sfx_hit.wav");
const dieSound = new Audio("./sound_file/sfx_die.wav");
const coinSound = new Audio("./sound_file/coin.mp3");
coinSound.volume = 0.25;
const heartSound = new Audio("./sound_file/heart-bonus.wav");
heartSound.volume = 0.35; 
heartSound.preload = "auto";
const bgMusic = new Audio("./sound_file/retro-arcade.mp3");
const btnSwitch = new Audio("./sound_file/switch.mp3");
bgMusic.loop = true;

let soundMode = 0;
const soundIcons = [
    "./speaker.png",
    "./speaker_muted.png"
];

function playSound(audioObj, volume = null) {
    if (soundMode === 1 || !audioObj) return;
    const snd = audioObj.cloneNode();
    if (volume !== null) {
        snd.volume = volume;
    } else if (typeof audioObj.volume === "number") {
        snd.volume = audioObj.volume;
    }
    snd.play().catch((err) => {
        console.warn("Error:", audioObj.src, err);
    });
}



function playBackgroundMusic() {
    if (soundMode !== 0 || gameOver || isPausedForDecision || isTutorialWaiting) return;
    if (bgMusic.paused) bgMusic.play().catch(() => {});
}

function stopBackgroundMusic() {
    bgMusic.pause();
}


window.addEventListener("load", () => {
    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;
    context = board.getContext("2d");

    const soundBtn = document.getElementById("soundBtn");
    const soundIconElem = document.getElementById("soundIcon");
    const themeBtn = document.getElementById("themeBtn");
    const btnIcon = document.getElementById("btnAnimIcon");


    if (btnIcon) {
        btnIcon.src = btnImgs[SWITCH_START_FRAME].src;
    }

    if (soundBtn) {
        soundBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            soundMode = (soundMode + 1) % 2;
            if (soundIconElem) {
                soundIconElem.src = soundIcons[soundMode];
            }

            if (soundMode === 1) {
                stopBackgroundMusic();
            } else {
                playBackgroundMusic();
            }
        });
    }

    
    const themeEl = themeBtn;
    const themeIcon = btnIcon || (themeEl ? themeEl.querySelector("img") : null);


function applyBackground() {
    const url = isNightMode ? BG_NIGHT : BG_DAY;
    board.style.backgroundImage = `url("${url}")`;
}

    function playToggleAnimation(toNight) {
        if (btnAnimInterval !== null) {
            clearInterval(btnAnimInterval);
            btnAnimInterval = null;
        }

        const order = toNight ? SWITCH_TO_NIGHT_FRAMES : SWITCH_TO_DAY_FRAMES;

        let idx = 0;
        console.log(order.join(" -> "));
        if (themeIcon) themeIcon.src = btnImgs[order[0]].src;

        btnAnimInterval = setInterval(() => {
            idx++;
            if (idx >= order.length) {
                clearInterval(btnAnimInterval);
                btnAnimInterval = null;
                return;
            }
            if (themeIcon) themeIcon.src = btnImgs[order[idx]].src;
            console.log(order[idx]);
        }, SWITCH_FRAME_MS);
    }

    function toggleTheme() {
        playSound(btnSwitch);
        isNightMode = !isNightMode;
        applyBackground();
        playToggleAnimation(isNightMode);
    }

    if (themeEl) {
        themeEl.addEventListener("click", (e) => {
            e.preventDefault();
            toggleTheme();
        });
        themeEl.addEventListener("pointerdown", (e) => e.stopPropagation());
    } else {
        console.warn("Error");
    }

    for (let i = 0; i < 4; i++) {
        const img = new Image();
        img.src = `./flappybird${i}.png`;
        birdImgs.push(img);
    }

    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";

    board.addEventListener("pointermove", (e) => {
        const rect = board.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) * (board.width / rect.width);
        mouseY = (e.clientY - rect.top) * (board.height / rect.height);
    });

    board.addEventListener("pointerleave", () => {
        mouseX = -1;
        mouseY = -1;
    });

    birdAnimInterval = setInterval(animateBird, 100);
    requestAnimationFrame(update);

    board.addEventListener("pointerdown", moveBird);
    document.addEventListener("keydown", moveBird);
});


function update() {
    requestAnimationFrame(update);
    if (!context) return;

    context.clearRect(0, 0, board.width, board.height);

    if (!gameOver && !isPausedForDecision && !isTutorialWaiting) {
        frameCounter++;
        if (frameCounter % PIPE_SPAWN_FRAMES === 0) {
            placePipes();
        }
        velocityY += gravity;
        bird.y = Math.max(bird.y + velocityY, 0);
    } else if (isTutorialWaiting && !gameOver) {
        velocityY += gravity * 0.4;
        bird.y += velocityY;

        if (bird.y > birdY + 24) {
            bird.y = birdY + 24;
            velocityY = -3.8;
        }
        if (bird.y < 10) {
            bird.y = 10;
            if (velocityY < 0) velocityY = 0;
        }
    }

    if (!gameOver && !isPausedForDecision && !isTutorialWaiting && bird.y > board.height) {
        loseLife();
    }

   
    updateAndDrawHearts();
    updateAndDrawCoins();
    updateAndDrawEnemyFireballs();

    const currentBirdImg = birdImgs[birdImgsIndex];
    if (currentBirdImg && currentBirdImg.complete && currentBirdImg.naturalWidth > 0) {
        context.drawImage(currentBirdImg, bird.x, bird.y, bird.width, bird.height);
    }

    let pipeHit = false;

    for (let i = 0; i < pipeArray.length; i++) {
        const pipe = pipeArray[i];

        if (!gameOver && !isPausedForDecision && !isTutorialWaiting) {
            pipe.x += velocityX;

            if (!pipe.passed && bird.x > pipe.x + pipe.width) {
                score += 0.5;
                pipe.passed = true;
                updateHighScore();
            }

            if (detectCollision(bird, pipe)) {
                pipeHit = true;
            }
        }

        
        if (pipe.monster && updateMonster(pipe)) {
            pipeHit = true;
        }

        if (pipe.img && pipe.img.complete && pipe.img.naturalWidth > 0) {
            context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);
        }
    }

    if (pipeHit) {
        loseLife();
    }

    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    context.save();
    context.fillStyle = "#ffffff";
    context.font = "500 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    context.textAlign = "left";
    context.shadowColor = "rgba(15, 23, 42, 0.25)";
    context.shadowBlur = 3;
    context.fillText(Math.floor(score), 12, 42);
    context.restore();

    for (let i = 0; i < lives; i++) {
        if (birdImgs[0] && birdImgs[0].complete && birdImgs[0].naturalWidth > 0) {
            context.drawImage(birdImgs[0], 90 + i * 45, 12, 40, 30);
        }
    }

    
    drawCoinHud();

    if (isPausedForDecision) {
        context.fillStyle = "rgba(0, 0, 0, 0.72)";
        context.fillRect(0, 0, board.width, board.height);

        context.textAlign = "center";
        context.fillStyle = "#ffffff";
        context.font = "600 33px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        context.fillText("Oops, Try Again!", board.width / 2, 175);

        context.fillStyle = "#ffd23f";
        context.font = "700 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        context.fillText("Score: " + Math.floor(score), board.width / 2, 225);

        context.fillStyle = "#ffffff";
        context.font = "500 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        context.fillText("Best Score: " + Math.floor(highScore), board.width / 2, 260);

        drawStyledButton(60, 290, 240, 50, "#309165", "#2cda8f", "CONTINUE", "▶");
        drawStyledButton(60, 355, 240, 50, "#e65a65", "#bd3141", "RESTART", "↻");

        context.fillStyle = "rgba(255, 255, 255, 0.75)";
        context.font = "400 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        context.fillText("Press C to CONTINUE or R to RESTART", board.width / 2, 435);

        context.textAlign = "left";
    }

    if (gameOver) {
        context.fillStyle = "rgba(0, 0, 0, 0.82)";
        context.fillRect(0, 0, board.width, board.height);

        context.textAlign = "center";
        context.fillStyle = "#ffffff";
        context.font = "600 33px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        context.fillText("GAME OVER", board.width / 2, 225);

        context.fillStyle = "#ffd23f";
        context.font = "700 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        context.fillText("Score: " + Math.floor(score), board.width / 2, 285);

        context.fillStyle = "#ffffff";
        context.font = "500 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        context.fillText("Best Score: " + Math.floor(highScore), board.width / 2, 325);

        context.fillStyle = "rgba(255, 255, 255, 0.75)";
        context.font = "400 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        context.fillText("Press Space to RESTART", board.width / 2, 385);

        context.textAlign = "left";
        stopBackgroundMusic();
    }
}

function loseLife() {
    if (gameOver || isPausedForDecision) return;

    playSound(hitSound);
    stopBackgroundMusic(); 
    lives--;

    if (lives > 0) {
        bird.y = birdY;
        velocityY = 0;
        cleanNearbyPipes();
        isPausedForDecision = true;
    } else {
        playSound(dieSound);
        gameOver = true;
        updateHighScore();
    }
}

function updateHighScore() {
    if (score > highScore) {
        highScore = score;
    }
}



function updateAndDrawCoins() {
    const active = !gameOver && !isPausedForDecision && !isTutorialWaiting;


    const hitbox = getBirdHitbox();

    for (let i = coinArray.length - 1; i >= 0; i--) {
        const coin = coinArray[i];

        if (active) {
            coin.x += velocityX;

            if (circleHitsRect(coin.x, coin.y, coinRadius, hitbox)) {
                collectCoin(coin);
                coinArray.splice(i, 1);
                continue;
            }
        }

        if (coin.x < -coinRadius * 2) {
            coinArray.splice(i, 1);
            continue;
        }

        
        const spin = Math.abs(Math.cos(performance.now() / 160 + coin.phase));
        drawCoin(coin.x, coin.y, coinRadius, spin);
    }

    
    for (let i = floatTexts.length - 1; i >= 0; i--) {
        const ft = floatTexts[i];

        if (active) {
            ft.y -= 0.8;
            ft.life--;
            ft.x += velocityX * 0.5;
        }

        if (ft.life <= 0) {
            floatTexts.splice(i, 1);
            continue;
        }

        context.save();
        context.globalAlpha = Math.min(1, ft.life / 20);
        context.fillStyle = ft.color;
        context.font = "700 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        context.textAlign = "center";
        context.shadowColor = "rgba(0, 0, 0, 0.45)";
        context.shadowBlur = 3;
        context.fillText(ft.text, ft.x, ft.y);
        context.restore();
    }
}

function collectCoin(coin) {
    coinCount++;
    playSound(coinSound, 0.25);

    floatTexts.push({ x: coin.x, y: coin.y - 10, text: "+1", color: "#ffe45c", life: 40 });
}

function circleHitsRect(cx, cy, r, rect) {
    const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
    const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy <= r * r;
}

function drawCoin(x, y, r, scaleX) {
    const w = Math.max(r * scaleX, 1.5);

    context.save();
    context.translate(x, y);

    
    context.beginPath();
    context.ellipse(0, 0, w, r, 0, 0, Math.PI * 2);
    context.fillStyle = "#c98a00";
    context.fill();

    const grad = context.createLinearGradient(-w, -r, w, r);
    grad.addColorStop(0, "#fff2a8");
    grad.addColorStop(0.5, "#ffd23f");
    grad.addColorStop(1, "#ffb700");

    context.beginPath();
    context.ellipse(0, 0, w * 0.8, r * 0.85, 0, 0, Math.PI * 2);
    context.fillStyle = grad;
    context.fill();

    
    if (w > 5) {
        const slotW = Math.max(w * 0.22, 1.5);
        context.beginPath();
        context.roundRect(-slotW / 2, -r * 0.45, slotW, r * 0.9, slotW / 2);
        context.fillStyle = "#e09a00";
        context.fill();
    }

    context.restore();
}

function drawCoinHud() {
    context.save();

    drawCoin(24, 72, 10, 1);

    context.fillStyle = "#ffffff";
    context.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.shadowColor = "rgba(15, 23, 42, 0.35)";
    context.shadowBlur = 3;
    context.fillText("× " + coinCount, 42, 73);

    context.restore();
}

function cleanNearbyCoins() {
    coinArray = coinArray.filter((coin) => {
        return coin.x > bird.x + bird.width + 120 || coin.x < bird.x - 50;
    });
    heartArray = heartArray.filter((heart) => {
        return heart.x > bird.x + bird.width + 120 || heart.x < bird.x - 50;
    });
    enemyFireballs = enemyFireballs.filter((fb) => {
        return fb.x > bird.x + bird.width + 120 || fb.x < bird.x - 50;
    });
}


function monsterExtension(timer) {
    const t = timer % MONSTER_CYCLE;

    if (t < MONSTER_HIDE) return 0;

    if (t < MONSTER_HIDE + MONSTER_RISE) {
        const x = (t - MONSTER_HIDE) / MONSTER_RISE;
        return MONSTER_MAX_EXT * (1 - (1 - x) * (1 - x));
    }

    if (t < MONSTER_HIDE + MONSTER_RISE + MONSTER_HOLD) return MONSTER_MAX_EXT;

    const f = (t - MONSTER_HIDE - MONSTER_RISE - MONSTER_HOLD) / MONSTER_FALL;
    return MONSTER_MAX_EXT * (1 - f);
}

function shootFireballFromGreenMonster(cx, edgeY, ext, fromTop) {
    const headOffset = 33;
    const fireY = fromTop
        ? edgeY + (ext - headOffset)
        : edgeY - (ext - headOffset);
    const dirY = fromTop ? 1 : -1;

    enemyFireballs.push({
        x: cx,
        y: fireY,
        vx: 0,
        vy: dirY * ENEMY_FIRE_SPEED_Y
    });
}


function updateMonster(pipe) {
    const m = pipe.monster;
    const active = !gameOver && !isPausedForDecision && !isTutorialWaiting;

    if (active) m.timer++;

    const ext = monsterExtension(m.timer);
    if (ext <= 0) return false;

    const cx = pipe.x + pipe.width / 2;
    const edgeY = m.fromTop ? pipe.y + pipe.height : pipe.y;

    
    if (active && m.isGreen && !m.hasShot && ext >= MONSTER_MAX_EXT * 0.75) {
        shootFireballFromGreenMonster(cx, edgeY, ext, m.fromTop);
        m.hasShot = true;
    }

    if (m.timer % MONSTER_CYCLE === 0) {
        m.hasShot = false;
    }

    drawPiranha(cx, edgeY, ext, m.fromTop, m.timer, m.isGreen);

    if (!active || ext < 6) return false;

    const rect = {
        x: cx - 13,
        y: m.fromTop ? edgeY : edgeY - ext,
        width: 26,
        height: ext
    };

    const birdHit = getBirdHitbox();

    return detectCollision(birdHit, rect);
}

function drawPiranha(cx, edgeY, ext, fromTop, timer, isGreen) {
    const H = 48;   

    context.save();
    context.translate(cx, edgeY);
    if (fromTop) context.scale(1, -1);
    context.translate(0, H - ext);   

    context.fillStyle = isGreen ? "#15803d" : "#2f9e44";
    context.fillRect(-4, -22, 8, 28);

    context.fillStyle = isGreen ? "#16a34a" : "#37b24d";
    context.beginPath();
    context.ellipse(-9, -10, 8, 3.5, -0.5, 0, Math.PI * 2);
    context.ellipse(9, -10, 8, 3.5, 0.5, 0, Math.PI * 2);
    context.fill();

    context.translate(0, -33);
    context.beginPath();
    context.arc(0, 0, 15, 0, Math.PI * 2);
    context.fillStyle = isGreen ? "#22c55e" : "#e11d48";
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = isGreen ? "#14532d" : "#7f1d1d";
    context.stroke();

    context.fillStyle = isGreen ? "#fef08a" : "#ffffff";
    [[-8, 4], [8, 4], [0, 9]].forEach(([sx, sy]) => {
        context.beginPath();
        context.arc(sx, sy, 3, 0, Math.PI * 2);
        context.fill();
    });

    const mouth = 0.3 + Math.abs(Math.sin(timer / 6)) * 0.5;
    context.beginPath();
    context.moveTo(0, 0);
    context.arc(0, 0, 15, -Math.PI / 2 - mouth, -Math.PI / 2 + mouth);
    context.closePath();
    context.fillStyle = "#2b0a14";
    context.fill();

    context.fillStyle = "#ffffff";
    [-1, 1].forEach((sign) => {
        const a = -Math.PI / 2 + sign * mouth;
        [0.62, 0.86].forEach((k) => {
            context.beginPath();
            context.arc(Math.cos(a) * 15 * k, Math.sin(a) * 15 * k, 2, 0, Math.PI * 2);
            context.fill();
        });
    });

    context.restore();
}

function updateAndDrawEnemyFireballs() {
    const active = !gameOver && !isPausedForDecision && !isTutorialWaiting;

    const hitbox = getBirdHitbox();

    let fireHit = false;

    for (let i = enemyFireballs.length - 1; i >= 0; i--) {
        const fb = enemyFireballs[i];

        if (active) {
            fb.x += fb.vx + velocityX;
            fb.y += fb.vy;

            if (circleHitsRect(fb.x, fb.y, ENEMY_FIRE_RADIUS - 1, hitbox)) {
                fireHit = true;
                enemyFireballs.splice(i, 1);
                continue;
            }
        }

        if (
            fb.x < -ENEMY_FIRE_RADIUS * 3 ||
            fb.y < -ENEMY_FIRE_RADIUS * 3 ||
            fb.y > board.height + ENEMY_FIRE_RADIUS * 3
        ) {
            enemyFireballs.splice(i, 1);
            continue;
        }

        drawEnemyFireball(fb.x, fb.y, ENEMY_FIRE_RADIUS);
    }

    if (fireHit) {
        loseLife();
    }
}

function drawEnemyFireball(x, y, r) {
    const flicker = r + (Math.random() - 0.5) * 1.3;
    const glow = flicker * 1.8;

    const g = context.createRadialGradient(x, y, 0, x, y, glow);
    g.addColorStop(0, "#fffbe0");
    g.addColorStop(0.35, "#ffd23f");
    g.addColorStop(0.7, "#ff5500");
    g.addColorStop(1, "rgba(255, 30, 0, 0)");

    context.save();
    context.fillStyle = g;
    context.beginPath();
    context.arc(x, y, glow, 0, Math.PI * 2);
    context.fill();
    context.restore();
}


function updateAndDrawHearts() {
    const active = !gameOver && !isPausedForDecision && !isTutorialWaiting;

    const hitbox = getBirdHitbox();

    for (let i = heartArray.length - 1; i >= 0; i--) {
        const heart = heartArray[i];
        const now = performance.now();

        if (active) {
            heart.x += velocityX;
        }

        const bob = Math.sin(now / 300 + heart.phase) * 4;
        const beat = 1 + Math.abs(Math.sin(now / 260 + heart.phase)) * 0.12;

        if (active && circleHitsRect(heart.x, heart.y + bob, heartRadius, hitbox)) {
            collectHeart(heart);
            heartArray.splice(i, 1);
            continue;
        }

        if (heart.x < -heartRadius * 2) {
            heartArray.splice(i, 1);
            continue;
        }

        drawHeart(heart.x, heart.y + bob, heartRadius, beat);
    }
}

function collectHeart(heart) {
    lives = Math.min(MAX_LIVES, lives + 1);
    playSound(heartSound, 0.35);
    floatTexts.push({
        x: bird.x + bird.width / 2,
        y: bird.y - 8,
        text: "+1 LIFE",
        color: "#ff8fb1",
        life: 60
    });
}

function drawHeart(x, y, r, scale) {
    context.save();
    context.translate(x, y);
    context.scale(scale, scale);

    context.shadowColor = "rgba(255, 80, 120, 0.7)";
    context.shadowBlur = 12;

    context.beginPath();
    context.moveTo(0, r * 0.95);
    context.bezierCurveTo(-r * 1.5, -r * 0.05, -r * 0.7, -r * 1.25, 0, -r * 0.4);
    context.bezierCurveTo(r * 0.7, -r * 1.25, r * 1.5, -r * 0.05, 0, r * 0.95);
    context.closePath();

    const grad = context.createLinearGradient(0, -r, 0, r);
    grad.addColorStop(0, "#ff7a9a");
    grad.addColorStop(1, "#e11d48");
    context.fillStyle = grad;
    context.fill();

    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.lineWidth = 2;
    context.strokeStyle = "#9f1239";
    context.stroke();

    context.beginPath();
    context.ellipse(-r * 0.45, -r * 0.35, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2);
    context.fillStyle = "rgba(255, 255, 255, 0.75)";
    context.fill();

    context.restore();
}


function drawStyledButton(x, y, width, height, color1, color2, text, icon) {
    context.save();

    const radius = 13;
    const isHovered =
        mouseX >= x &&
        mouseX <= x + width &&
        mouseY >= y &&
        mouseY <= y + height;

    const hoverOffset = isHovered ? -3 : 0;
    context.translate(0, hoverOffset);

    context.shadowColor = "rgba(0, 0, 0, 0.18)";
    context.shadowBlur = isHovered ? 15 : 10;
    context.shadowOffsetY = isHovered ? 5 : 3;

    context.beginPath();
    context.roundRect(x, y, width, height, radius);

    const gradient = context.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, isHovered ? color1 : color2);
    gradient.addColorStop(1, isHovered ? color2 : color1);

    context.fillStyle = gradient;
    context.fill();

    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;

    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.font = "500 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    context.fillText(icon, x + 43, y + height / 2);

    context.font = "600 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    context.fillText(text, x + width / 2 + 12, y + height / 2);

    context.restore();
}

function cleanNearbyPipes() {
    pipeArray = pipeArray.filter((pipe) => {
        return pipe.x > bird.x + bird.width + 120 || pipe.x + pipe.width < bird.x - 50;
    });
    cleanNearbyCoins();
}

function animateBird() {
    if (birdImgs.length === 0) return;
    birdImgsIndex = (birdImgsIndex + 1) % birdImgs.length;
}

function placePipes() {
    const randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    const openingSpace = board.height / 4;

    const topPipe = {
        img: topPipeImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    };

    const bottomPipe = {
        img: bottomPipeImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    };

    pipeArray.push(topPipe);
    pipeArray.push(bottomPipe);

    pipesSinceMonster++;

    if (pipesSinceMonster >= MONSTER_MIN_PIPES && Math.random() < MONSTER_CHANCE) {
        const fromTop = Math.random() < 0.5;
        (fromTop ? topPipe : bottomPipe).monster = {
            fromTop: fromTop,
            isGreen: Math.random() < GREEN_SHOOTER_CHANCE,
            hasShot: false,
            timer: Math.floor(Math.random() * MONSTER_CYCLE)
        };
        pipesSinceMonster = 0;
    }

    placeCoins(randomPipeY + pipeHeight + openingSpace / 2);
}

function placeCoins(gapCenterY) {
    coinArray.push({
        x: pipeX + pipeWidth / 2,
        y: gapCenterY,
        phase: Math.random() * Math.PI * 2
    });

    pipesSinceHeart++;

    const freeZoneCenterX = pipeX + pipeWidth + (pipeSpacing - pipeWidth) / 2;

    if (
        lives < MAX_LIVES &&
        heartArray.length === 0 &&
        pipesSinceHeart >= HEART_MIN_PIPES &&
        Math.random() < HEART_CHANCE
    ) {
        heartArray.push({
            x: freeZoneCenterX,
            y: gapCenterY,
            phase: Math.random() * Math.PI * 2
        });
        pipesSinceHeart = 0;
        return;
    }

    if (Math.random() < ARC_CHANCE) {
        const offsetsX = [-30, 0, 30];
        const offsetsY = [0, -18, 0];
        for (let i = 0; i < 3; i++) {
            coinArray.push({
                x: freeZoneCenterX + offsetsX[i],
                y: gapCenterY + offsetsY[i],
                phase: Math.random() * Math.PI * 2
            });
        }
    }
}

function resetGame() {
    bird.y = birdY;
    velocityY = 0;
    pipeArray = [];
    coinArray = [];
    heartArray = [];
    enemyFireballs = [];
    pipesSinceHeart = 0;
    pipesSinceMonster = 0;
    floatTexts = [];
    coinCount = 0;
    score = 0;
    lives = 3;
    frameCounter = 0;
    gameOver = false;
    isPausedForDecision = false;
    isTutorialWaiting = false;
    playBackgroundMusic();
}

function moveBird(e) {
    const isKeyboard = e.type === "keydown";
    const isPointer = e.type === "pointerdown";
    if (!isKeyboard && !isPointer) return;

    if (isKeyboard) {
        if (!["Space", "ArrowUp", "KeyX", "KeyC", "KeyR"].includes(e.code)) {
            return;
        }
        e.preventDefault();
    }

    let clickX = 0;
    let clickY = 0;

    if (isPointer) {
        const rect = board.getBoundingClientRect();
        clickX = (e.clientX - rect.left) * (board.width / rect.width);
        clickY = (e.clientY - rect.top) * (board.height / rect.height);
    }

    if (isPausedForDecision) {
        const clickedContinue =
            (isKeyboard && e.code === "KeyC") ||
            (isPointer && clickX >= 60 && clickX <= 300 && clickY >= 290 && clickY <= 340);

        const clickedRestart =
            (isKeyboard && e.code === "KeyR") ||
            (isPointer && clickX >= 60 && clickX <= 300 && clickY >= 355 && clickY <= 405);

        if (clickedContinue) {
            isPausedForDecision = false;
            cleanNearbyPipes();
            playBackgroundMusic();
        } else if (clickedRestart) {
            resetGame();
        }
        return;
    }

    if (gameOver) {
        if ((isKeyboard && e.code === "Space") || isPointer) {
            resetGame();
        }
        return;
    }

    if (isTutorialWaiting) {
        const shouldHop =
            (isKeyboard && ["Space", "ArrowUp", "KeyX"].includes(e.code)) || isPointer;
        if (shouldHop) {
            playSound(wingSound);
            velocityY = -5.2;
        }
        return;
    }

    const shouldFlap =
        (isKeyboard && ["Space", "ArrowUp", "KeyX"].includes(e.code)) || isPointer;

    if (shouldFlap) {
        playBackgroundMusic();
        playSound(wingSound);
        velocityY = -6;
    }
}

function detectCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}
