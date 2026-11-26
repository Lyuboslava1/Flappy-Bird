(() => {
  "use strict";

  const STORAGE_KEY = "flappyBirdTutorialSeen";
  const REQUIRED_HOPS = 3;     
  const AUTO_CLOSE_MS = 2500;  

  const board = document.getElementById("board");
  if (!board) {
    console.warn('Tutorial: canvas with id="board" was not found.');
    return;
  }

  let hops = 0;
  let finished = false;
  let gameStarted = false;
  let autoCloseTimer = null;

  const parent = board.parentElement || document.body;
  if (getComputedStyle(parent).position === "static") {
    parent.style.position = "relative";
  }

  const overlay = document.createElement("div");
  overlay.id = "flappyTutorial";
  overlay.innerHTML = `
    <section class="ft-banner" role="status" aria-live="polite">
      <div class="ft-top">
        <span class="ft-badge">HOP TO START • TUTORIAL</span>
        <div class="ft-progress">
          <span class="ft-dot active"></span>
          <span class="ft-dot"></span>
          <span class="ft-dot"></span>
        </div>
        <button type="button" id="ft-skip" class="ft-skip">Skip</button>
      </div>

      <div class="ft-body">
        <div class="ft-bird-wrap" id="ft-bird-wrap" aria-hidden="true">
          <span class="ft-bird">🐤</span>
          <span class="ft-tap-ring"></span>
          <span class="ft-hand">👆</span>
        </div>

        <div class="ft-text">
          <h2 id="ft-title">Hop 3 times to start! (0/3)</h2>
          <p id="ft-message">Bird hops in place. Click or press <strong>Space</strong> <strong>3 times</strong> to begin.</p>
        </div>
      </div>
    </section>

    <div class="ft-center-hint" id="ft-center-hint" aria-hidden="true">
      <span class="ft-pulse-circle"></span>
      <span class="ft-pointer">👆 Hop (0/3)</span>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #flappyTutorial {
      position: absolute;
      inset: 0;
      z-index: 9999;
      pointer-events: none;
      font-family: Arial, Helvetica, sans-serif;
      overflow: hidden;
      opacity: 1;
      transition: opacity 0.4s ease;
    }
    #flappyTutorial.ft-fade-out {
      opacity: 0;
    }
    #flappyTutorial * { box-sizing: border-box; }

    #flappyTutorial .ft-banner {
      pointer-events: none; 
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      width: min(92%, 350px);
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.22);
      border: 2px solid rgba(39, 169, 130, 0.45);
      animation: ft-slide-down 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      transition: transform 0.25s ease, border-color 0.25s ease;
    }
    #flappyTutorial .ft-banner.ft-bump {
      transform: translateX(-50%) scale(1.03);
      border-color: #27a982;
    }

    #flappyTutorial .ft-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    #flappyTutorial .ft-badge {
      background: #fff4e0;
      color: #b86b00;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.8px;
      padding: 3px 8px;
      border-radius: 99px;
      transition: all 0.25s ease;
    }
    #flappyTutorial .ft-badge.live {
      background: #e3f7f0;
      color: #168b70;
    }
    #flappyTutorial .ft-progress {
      display: flex;
      gap: 5px;
    }
    #flappyTutorial .ft-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #cbd5df;
      transition: all 0.25s ease;
    }
    #flappyTutorial .ft-dot.active {
      width: 18px;
      border-radius: 8px;
      background: #27a982;
    }
    #flappyTutorial .ft-skip {
      pointer-events: auto; 
      border: 0;
      background: transparent;
      color: #6c7b8b;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      padding: 2px 6px;
    }
    #flappyTutorial .ft-skip:hover { color: #172b40; }

    #flappyTutorial .ft-body {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    #flappyTutorial .ft-bird-wrap {
      position: relative;
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #eef8fc;
      border-radius: 12px;
    }
    #flappyTutorial .ft-bird {
      font-size: 28px;
      display: inline-block;
      animation: ft-hover 1.2s ease-in-out infinite;
    }
    #flappyTutorial .ft-bird-wrap.ft-flap .ft-bird {
      animation: ft-flap-jump 0.4s ease-out;
    }
    #flappyTutorial .ft-hand {
      position: absolute;
      right: -2px;
      bottom: -4px;
      font-size: 18px;
      animation: ft-tap-hand 1.2s ease-in-out infinite;
    }
    #flappyTutorial .ft-tap-ring {
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid #27a982;
      opacity: 0;
      animation: ft-ring 1.2s ease-out infinite;
    }

    #flappyTutorial .ft-text h2 {
      margin: 0 0 3px;
      font-size: 15px;
      color: #172b40;
    }
    #flappyTutorial .ft-text p {
      margin: 0;
      font-size: 12px;
      line-height: 1.45;
      color: #4f6072;
    }

    #flappyTutorial .ft-center-hint {
      position: absolute;
      top: 58%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      transition: opacity 0.35s ease;
    }
    #flappyTutorial .ft-pulse-circle {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.35);
      border: 2px solid #fff;
      box-shadow: 0 0 15px rgba(0,0,0,0.2);
      animation: ft-pulse 1.3s ease-in-out infinite;
    }
    #flappyTutorial .ft-pointer {
      background: rgba(23, 43, 64, 0.88);
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      padding: 5px 12px;
      border-radius: 99px;
      animation: ft-tap-hand 1.3s ease-in-out infinite;
    }

    @keyframes ft-slide-down {
      from { opacity: 0; transform: translate(-50%, -18px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    @keyframes ft-hover {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    @keyframes ft-flap-jump {
      0% { transform: translateY(0) rotate(0deg); }
      40% { transform: translateY(-12px) rotate(-18deg) scale(1.15); }
      100% { transform: translateY(0) rotate(0deg); }
    }
    @keyframes ft-tap-hand {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-5px) scale(0.92); }
    }
    @keyframes ft-ring {
      0% { transform: scale(0.4); opacity: 0.9; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    @keyframes ft-pulse {
      0%, 100% { transform: scale(0.85); opacity: 0.9; }
      50% { transform: scale(1.2); opacity: 0.4; }
    }
  `;
  document.head.appendChild(style);
  parent.appendChild(overlay);

  const banner = overlay.querySelector(".ft-banner");
  const badge = overlay.querySelector(".ft-badge");
  const birdWrap = overlay.querySelector("#ft-bird-wrap");
  const centerHint = overlay.querySelector("#ft-center-hint");
  const pointerLabel = overlay.querySelector(".ft-pointer");
  const title = overlay.querySelector("#ft-title");
  const message = overlay.querySelector("#ft-message");
  const dots = [...overlay.querySelectorAll(".ft-dot")];
  const skip = overlay.querySelector("#ft-skip");

  let launched = false;

 
  function launchGameNow() {
    if (launched) return;
    launched = true;
    try {
      if (typeof isTutorialWaiting !== "undefined") {
        isTutorialWaiting = false;
      }
      if (typeof velocityY !== "undefined") {
        velocityY = -6;
      }
      if (typeof playBackgroundMusic === "function") {
        playBackgroundMusic();
      }
    } catch (_) {}
  }

  function closeTutorial() {
    if (finished) return;
    finished = true;
    clearTimeout(autoCloseTimer);
    launchGameNow();
    overlay.classList.add("ft-fade-out");
    setTimeout(() => {
      overlay.remove();
    }, 400);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch (_) {}
  }

  function animateFeedback() {
    banner.classList.remove("ft-bump");
    birdWrap.classList.remove("ft-flap");
    void banner.offsetWidth;
    banner.classList.add("ft-bump");
    birdWrap.classList.add("ft-flap");
  }

  function startLiveGame() {
    gameStarted = true;
    launchGameNow();
    centerHint.style.opacity = "0";
    badge.textContent = "LIVE • FLYING";
    badge.classList.add("live");
    title.textContent = "Game started! (3/3) 🚀";
    message.innerHTML = "Dodge pipes &amp; monsters. Grab <strong>coins</strong> &amp; <strong>hearts</strong>!";
    if (dots[2]) dots[2].classList.add("active");
    skip.textContent = "Got it";

    const hand = overlay.querySelector(".ft-hand");
    const ring = overlay.querySelector(".ft-tap-ring");
    if (hand) hand.style.display = "none";
    if (ring) ring.style.display = "none";

    autoCloseTimer = setTimeout(closeTutorial, AUTO_CLOSE_MS);
  }

  function handleAction() {
    if (finished || gameStarted) return;

    hops++;
    animateFeedback();

    if (hops === 1) {
      if (dots[1]) dots[1].classList.add("active");
      title.textContent = "Nice hop! 2 more to start (1/3)";
      message.innerHTML = "You have <strong>3 lives</strong>. Watch out for pipe monsters!";
      if (pointerLabel) pointerLabel.textContent = "👆 Hop (1/3)";
    } else if (hops === 2) {
      title.textContent = "One more hop! (2/3)";
      message.innerHTML = "<strong>Coins</strong> give points, <strong>hearts</strong> restore 1 life.";
      if (pointerLabel) pointerLabel.textContent = "👆 Hop to start! (2/3)";
    } else if (hops >= REQUIRED_HOPS) {
      startLiveGame();
    }
  }

  function onKeyDown(event) {
    if (["Space", "ArrowUp", "KeyX"].includes(event.code)) {
      handleAction();
    }
  }

  function onPointerDown() {
    handleAction();
  }

  board.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("keydown", onKeyDown);
  skip.addEventListener("click", closeTutorial);

  const observer = new MutationObserver(() => {
    if (!document.getElementById("flappyTutorial")) {
      board.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(autoCloseTimer);
      launchGameNow();
      observer.disconnect();
    }
  });
  observer.observe(parent, { childList: true });
})();
