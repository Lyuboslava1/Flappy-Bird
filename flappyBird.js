let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

let dayBgImg = new Image();
dayBgImg.src = "./flappybirdbg.png"; 

let nightBgImg = new Image();
nightBgImg.src = "./flappybirdbgnight.png"; 

let currentBg = "day"; 

let btnImgs = [];
let btnImgsIndex = 0;

let isAnimatingBtn = false;
let btnAnimInterval = null;


let frameCounter = 0;
let birdAnimInterval = null;

for (let i = 0; i < 4; i++) {
    let bImg = new Image();
    bImg.src = `./btn_animation/frame${i}.png`;
    btnImgs.push(bImg);
}

let birdWidth = 64;
let birdHeight = 45;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;
let birdImgs = [];
let birdImgsIndex = 0;

let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
};

let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

let velocityX = -2;
let velocityY = 0;
let gravity = 0.4;

let gameOver = false;
let score = 0;
let highScore = 0; 

let lives = 3;
let isPausedForDecision = false;

let wingSound = new Audio("./sound_file/sfx_wing.wav");
let hitSound = new Audio("./sound_file/sfx_hit.wav");
let bgMusic = new Audio("./sound_file/Rose.mp3");
let btnSwitch = new Audio("./sound_file/sfx_point.wav");
bgMusic.loop = true;

let soundMode = 0; 
let soundIcons = [
    "./speaker.png",      
    "./speaker_muted.png"  
];

function playSound(audioObj) {
    if (soundMode === 1) {
        return; 
    }
    if (audioObj) {
        audioObj.currentTime = 0;
        audioObj.play().catch(e => {});
    }
}

window.onload = function () {
    board = document.getElementById("board");
    board.width = boardWidth;
    board.height = boardHeight;

    context = board.getContext("2d");

    let soundBtn = document.getElementById("soundBtn");
    let soundIconElem = document.getElementById("soundIcon");

    if (soundBtn) {
        soundBtn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.blur();
            
            soundMode = (soundMode + 1) % 2;

            if (soundIconElem) {
                soundIconElem.src = soundIcons[soundMode];
            }
            
            if (soundMode === 1) {
                bgMusic.pause();
            } else {
               if (bgMusic.paused && !gameOver && !isPausedForDecision) {
                    bgMusic.play().catch(err => {});
               }
            }
        });
    }

    let themeBtn = document.getElementById("themeBtn");
    let btnIcon = document.getElementById("btnAnimIcon");

    if (themeBtn) {
        themeBtn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.blur();

            playSound(btnSwitch); 

            currentBg = (currentBg === "day") ? "night" : "day";

            if (isAnimatingBtn) {
                clearInterval(btnAnimInterval);
            }

            let startFrame = (currentBg === "day") ? 4 : 0;
            let endFrame = (currentBg === "day") ? 7 : 3;
            let currentFrameIdx = startFrame;

            isAnimatingBtn = true;

            if (btnIcon && btnImgs[currentFrameIdx]) {
                btnIcon.src = btnImgs[currentFrameIdx].src;
            }

            btnAnimInterval = setInterval(function() {
                currentFrameIdx++;
                if (currentFrameIdx > endFrame) {
                    clearInterval(btnAnimInterval);
                    isAnimatingBtn = false;
                } else {
                    if (btnIcon && btnImgs[currentFrameIdx]) {
                        btnIcon.src = btnImgs[currentFrameIdx].src;
                    }
                }
            }, 80); 
        });
    }

    for (let i = 0; i < 4; i++) {
        let birdImg = new Image();
        birdImg.src = `./flappybird${i}.png`;
        birdImgs.push(birdImg);
    }

    // Pipes
    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";

    requestAnimationFrame(update);
    
    
    birdAnimInterval = setInterval(animateBird, 100);

    document.addEventListener("keydown", moveBird);
    document.addEventListener("mousedown", moveBird);
    document.addEventListener("touchstart", moveBird);
}; 

function update() {
    requestAnimationFrame(update);

    context.clearRect(0, 0, board.width, board.height);
    let bgToDraw = (currentBg === "day") ? dayBgImg : nightBgImg;
    context.drawImage(bgToDraw, 0, 0, board.width, board.height);

    if (!gameOver && !isPausedForDecision) {
        frameCounter++;
        if (frameCounter % 90 === 0) {
            placePipes();
        }

        velocityY += gravity;
        bird.y = Math.max(bird.y + velocityY, 0);

        if (bird.y > board.height) {
            playSound(hitSound);
            bgMusic.pause();
            lives--;

            if (lives > 0) {
                bird.y = birdY;
                velocityY = 0;
                cleanNearbyPipes();
                isPausedForDecision = true;
            } else {
                gameOver = true;
                bgMusic.pause();
            }
        }
    }

    context.drawImage(
        birdImgs[birdImgsIndex],
        bird.x,
        bird.y,
        bird.width,
        bird.height
    );
    
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];

        if (!gameOver && !isPausedForDecision) {
            pipe.x += velocityX;

            if (!pipe.passed && bird.x > pipe.x + pipe.width) {
                score += 0.5;
                pipe.passed = true;
            }

            if (detectCollision(bird, pipe)) {
                playSound(hitSound);
                bgMusic.pause();
                lives--;

                if (lives > 0) {
                    bird.y = birdY;
                    velocityY = 0;
                    cleanNearbyPipes();
                    isPausedForDecision = true; 
                } else {
                    gameOver = true;
                    bgMusic.pause();
                }
            }
        }

        context.drawImage(
            pipe.img,
            pipe.x,
            pipe.y,
            pipe.width,
            pipe.height
        );
    }
    
    while (
        pipeArray.length > 0 &&
        pipeArray[0].x < -pipeWidth
    ) {
        pipeArray.shift();
    }

    context.fillStyle = "white";
    context.font = "40px sans-serif";
    context.fillText(Math.floor(score), 10, 45);

    for (let i = 0; i < lives; i++) {
        if (birdImgs.length > 0 && birdImgs[0]) {
            context.drawImage(birdImgs[0], 90 + (i * 45), 12, 40, 30);
        }
    }

    if (isPausedForDecision) {
        context.fillStyle = "rgba(0, 0, 0, 0.7)";
        context.fillRect(0, 0, board.width, board.height);

        context.fillStyle = "white";
        context.font = "30px sans-serif";
        context.textAlign = "center";
        context.fillText("LOST A LIFE!", board.width / 2, 200);

       
        context.fillStyle = "#4CAF50"; 
        context.fillRect(board.width / 2 - 120, 260, 240, 50);
        context.fillStyle = "white";
        context.font = "20px sans-serif";
        context.fillText("CONTINUE (C)", board.width / 2, 292);

        
        context.fillStyle = "#f44336"; 
        context.fillRect(board.width / 2 - 120, 325, 240, 50);
        context.fillStyle = "white";
        context.fillText("RESTART (R)", board.width / 2, 357);
        
        context.textAlign = "left"; 
    }
  
    if (gameOver) {
        if (score > highScore) {
            highScore = score;
        }

        context.fillStyle = "rgba(0, 0, 0, 0.8)";
        context.fillRect(0, 0, board.width, board.height);

        context.textAlign = "center";
        context.fillStyle = "white";
        context.font = "35px sans-serif";
        context.fillText("GAME OVER", board.width / 2, 220);
        
        context.font = "20px sans-serif";
        context.fillText("Press Space to RESTART", board.width / 2, 280);
        
        context.font = "25px sans-serif";
        context.fillText("Best Score: " + Math.floor(highScore), board.width / 2, 320);

        context.textAlign = "left";

        if (!bgMusic.paused) {
            bgMusic.pause();
        }
    }
}

function cleanNearbyPipes() {
    
    pipeArray = pipeArray.filter(pipe => {
        return pipe.x > bird.x + bird.width + 120 || pipe.x + pipe.width < bird.x - 50;
    });
}

function animateBird() {
    birdImgsIndex++;
    birdImgsIndex %= birdImgs.length;
}

function placePipes() {
    let randomPipeY =
        pipeY -
        pipeHeight / 4 -
        Math.random() * (pipeHeight / 2);

    let openingSpace = board.height / 4;

    let topPipe = {
        img: topPipeImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    };

    pipeArray.push(topPipe);

    let bottomPipe = {
        img: bottomPipeImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    };

    pipeArray.push(bottomPipe);
}

function moveBird(e) {
    if (e.target && (e.target.closest("#themeBtn") || e.target.closest("#soundBtn"))) {
        return;
    }

    let clickX = 0;
    let clickY = 0;
    if (e.type === "mousedown" || e.type === "touchstart") {
        let rect = board.getBoundingClientRect();
        let clientX = e.clientX || (e.touches && e.touches[0].clientX);
        let clientY = e.clientY || (e.touches && e.touches[0].clientY);
        clickX = clientX - rect.left;
        clickY = clientY - rect.top;
    }

    
    if (isPausedForDecision) {
        let clickedContinue = e.code === "KeyC" || (e.type === "mousedown" || e.type === "touchstart" && clickY >= 260 && clickY <= 310);
        let clickedRestart = e.code === "KeyR" || (e.type === "mousedown" || e.type === "touchstart" && clickY >= 320 && clickY <= 370);

        if (clickedContinue) {
            isPausedForDecision = false;
            cleanNearbyPipes(); 
            if (soundMode === 0 && bgMusic.paused) {
                bgMusic.play().catch(err => {});
            }
        } else if (clickedRestart) {
            bird.y = birdY;
            velocityY = 0;
            pipeArray = [];
            score = 0;
            lives = 3;
            highScore = 0; 
            frameCounter = 0;
            isPausedForDecision = false;

            if (soundMode === 0) {
                bgMusic.currentTime = 0;
                bgMusic.play().catch(err => {});
            }
        }
        return;
    }

    
    if (gameOver) {
        if (e.code === "Space" || e.type === "mousedown" || e.type === "touchstart") {
            bird.y = birdY;
            velocityY = 0;
            pipeArray = [];
            score = 0;
            lives = 3;
            highScore = 0; 
            frameCounter = 0;
            gameOver = false;

            if (soundMode === 0) {
                bgMusic.currentTime = 0;
                bgMusic.play().catch(err => {});
            }
        }
        return;
    }

    
    if (soundMode === 0 && bgMusic.paused) {
        bgMusic.play().catch(err => {});
    }

    playSound(wingSound);

    if (
        e.code === "Space" ||
        e.code === "ArrowUp" ||
        e.code === "KeyX" ||
        e.type === "mousedown" ||
        e.type === "touchstart"
    ) {
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