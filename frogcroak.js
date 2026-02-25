// ═══════════════════════════════════════════════════════════
//  ASSETS — map each frog to its image and sound file
// ═══════════════════════════════════════════════════════════

const frogs = [
  "assets/Blue_frog_looking_down.jpg",
  "assets/Frog_with_red_eyes.png",
  "assets/green-frog.png",
  "assets/orange_frog_facing_left.jpg",
  "assets/purple_frog_looking_up.jpg",
  "assets/red_frog_with_white_eyes.jpg",
  "assets/yellow_frog_facing_left.jpg",
  "assets/frog.png",
];

const noises = [
  "big-ribbit - Copy.m4a",
  "deep-croak - Copy.m4a",
  "deep-ribbit - Copy.m4a",
  "freaky-croak.m4a",
  "lil-ribbit - Copy.m4a",
  "ooh-croak.m4a",
  "quick-croak.m4a",
  "weird-ribbit.m4a",
];

// ═══════════════════════════════════════════════════════════
//  FROG CLASS
// ═══════════════════════════════════════════════════════════

class theFrogs {
  constructor(color, eyes, looking, imgIndex) {
    this.color   = color;
    this.eyes    = eyes;
    this.looking = looking;
    this.img     = frogs[imgIndex];
    this.sound   = noises[imgIndex];
  }

  // Returns the correct answer object for this frog
  getAnswer() {
    return {
      color:   this.color,
      eyes:    this.eyes,
      looking: this.looking,
    };
  }

  // Plays this frog's associated sound
  playSound() {
    try {
      const audio = new Audio(this.sound);
      audio.play().catch(() => {}); // silent fail if file not found
    } catch (e) { /* ignore */ }
  }
}

// ═══════════════════════════════════════════════════════════
//  FROG INSTANCES  (color, eyes, looking, image/sound index)
// ═══════════════════════════════════════════════════════════

const blueFrog    = new theFrogs("blue",   "black", "down",  0);
const limeGreenFrog= new theFrogs("green", "red",   "left",  1);
const greenFrog   = new theFrogs("green",  "black", "right", 2);
const orangeFrog  = new theFrogs("orange", "black", "right",  3);
const purpleFrog  = new theFrogs("purple", "white", "up",    4);
const redFrog     = new theFrogs("red",    "white", "left",  5);
const yellowFrog  = new theFrogs("yellow", "brown", "left",  6);
const brownFrog   = new theFrogs("brown",  "brown", "right", 7);

// Master list — all frogs the game will cycle through
const allFrogs = [
  blueFrog, limeGreenFrog, greenFrog, orangeFrog,
  purpleFrog, redFrog, yellowFrog, brownFrog
];

// ═══════════════════════════════════════════════════════════
//  VALIDATION LOOP
//  Checks the player's three dropdown selections against
//  every frog in allFrogs. Returns the matched frog, or null.
// ═══════════════════════════════════════════════════════════

function validateAnswer(playerColor, playerEyes, playerLooking) {
  const results = [];

  for (let i = 0; i < allFrogs.length; i++) {
    const frog    = allFrogs[i];
    const correct = frog.getAnswer();

    const colorMatch   = playerColor   === correct.color;
    const eyesMatch    = playerEyes    === correct.eyes;
    const lookingMatch = playerLooking === correct.looking;
    const allCorrect   = colorMatch && eyesMatch && lookingMatch;

    results.push({
      frog,
      colorMatch,
      eyesMatch,
      lookingMatch,
      allCorrect,
    });
  }

  // Return the entry where all three properties match
  return results.find(r => r.allCorrect) || null;
}

// ═══════════════════════════════════════════════════════════
//  GAME STATE
// ═══════════════════════════════════════════════════════════

const SHOW_TIME    = 0.5;   // seconds frog is visible
const ANSWER_TIME  = 8;  // seconds to answer
const MAX_LIVES    = 3;
const POINTS_BASE  = 100;
const POINTS_BONUS = 10;  // extra per second remaining

let queue       = [];     // shuffled frogs for this game
let queueIndex  = 0;
let score       = 0;
let lives       = MAX_LIVES;
let correctCount= 0;
let currentFrog = null;

let showTimer    = null;
let answerTimer  = null;
let timeLeft     = 0;

// ═══════════════════════════════════════════════════════════
//  DOM REFS
// ═══════════════════════════════════════════════════════════

const scoreEl       = document.getElementById("score");
const roundEl       = document.getElementById("round-display");
const livesEl       = document.getElementById("lives");

const idleState     = document.getElementById("idle-state");
const revealState   = document.getElementById("reveal-state");
const answerState   = document.getElementById("answer-state");
const resultState   = document.getElementById("result-state");
const endScreen     = document.getElementById("end-screen");

const frogImg       = document.getElementById("frog-img");
const ringFill      = document.getElementById("ring-fill");
const ringNumber    = document.getElementById("ring-number");

const answerBar     = document.getElementById("answer-timer-bar");
const answerBarText = document.getElementById("answer-timer-text");

const selColor      = document.getElementById("sel-color");
const selEyes       = document.getElementById("sel-eyes");
const selLooking    = document.getElementById("sel-looking");

const startBtn      = document.getElementById("start-btn");
const submitBtn     = document.getElementById("submit-btn");
const nextBtn       = document.getElementById("next-btn");
const replayBtn     = document.getElementById("replay-btn");

const resultIcon    = document.getElementById("result-icon");
const resultTitle   = document.getElementById("result-title");
const resultDetails = document.getElementById("result-details");

const endTitle      = document.getElementById("end-title");
const endMessage    = document.getElementById("end-message");
const endStats      = document.getElementById("end-stats");

// ═══════════════════════════════════════════════════════════
//  BUBBLE ANIMATION (decorative)
// ═══════════════════════════════════════════════════════════

function spawnBubbles() {
  const container = document.getElementById("bubbles");
  for (let i = 0; i < 12; i++) {
    const b = document.createElement("div");
    b.className = "bubble";
    const size = Math.random() * 30 + 10;
    b.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 12 + 8}s;
      animation-delay: ${Math.random() * 10}s;
      opacity: ${Math.random() * 0.4 + 0.1};
    `;
    container.appendChild(b);
  }
}

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showState(name) {
  [idleState, revealState, answerState, resultState].forEach(el => {
    el.classList.add("hidden");
  });
  document.getElementById(`${name}-state`)?.classList.remove("hidden");
}

function updateScoreboard() {
  scoreEl.textContent = score;
  roundEl.textContent = `${queueIndex + 1} / ${allFrogs.length}`;
  livesEl.textContent = "❤️".repeat(lives) + "🖤".repeat(MAX_LIVES - lives);
}

function resetDropdowns() {
  selColor.value   = "";
  selEyes.value    = "";
  selLooking.value = "";
}

// ═══════════════════════════════════════════════════════════
//  RING COUNTDOWN (during frog reveal)
// ═══════════════════════════════════════════════════════════

const CIRCUMFERENCE = 163.4; // 2 * π * 26

function startRevealCountdown(seconds, onDone) {
  let remaining = seconds;
  ringFill.style.strokeDashoffset = "0";
  ringNumber.textContent = remaining;
  ringFill.classList.remove("warning");

  showTimer = setInterval(() => {
    remaining--;
    ringNumber.textContent = remaining;
    const progress = 1 - (remaining / seconds);
    ringFill.style.strokeDashoffset = CIRCUMFERENCE * progress;
    if (remaining <= 1) ringFill.classList.add("warning");
    if (remaining <= 0) {
      clearInterval(showTimer);
      onDone();
    }
  }, 1000);
}

// ═══════════════════════════════════════════════════════════
//  ANSWER COUNTDOWN
// ═══════════════════════════════════════════════════════════

function startAnswerCountdown(seconds, onExpire) {
  timeLeft = seconds;
  answerBar.style.width = "100%";
  answerBar.classList.remove("urgent");
  answerBarText.textContent = `${seconds}s to answer`;

  answerTimer = setInterval(() => {
    timeLeft -= 0.1;
    const pct = Math.max(0, (timeLeft / seconds) * 100);
    answerBar.style.width = `${pct}%`;
    answerBarText.textContent = `${Math.ceil(timeLeft)}s remaining`;
    if (timeLeft <= 3) answerBar.classList.add("urgent");
    if (timeLeft <= 0) {
      clearInterval(answerTimer);
      onExpire();
    }
  }, 100);
}

function stopAnswerCountdown() {
  clearInterval(answerTimer);
}

// ═══════════════════════════════════════════════════════════
//  CORE GAME FLOW
// ═══════════════════════════════════════════════════════════

function startGame() {
  queue        = shuffle(allFrogs);
  queueIndex   = 0;
  score        = 0;
  lives        = MAX_LIVES;
  correctCount = 0;

  endScreen.classList.add("hidden");
  document.querySelector(".stage").style.display = "";
  updateScoreboard();
  showNextFrog();
}

function showNextFrog() {
  currentFrog = queue[queueIndex];

  // Load image
  frogImg.src = currentFrog.img;
  frogImg.onerror = () => { frogImg.alt = `🐸 ${currentFrog.color} frog`; };

  // Play sound
  currentFrog.playSound();

  showState("reveal");
  updateScoreboard();

  startRevealCountdown(SHOW_TIME, () => {
    showState("answer");
    resetDropdowns();
    startAnswerCountdown(ANSWER_TIME, () => {
      // Time ran out
      handleSubmit(true);
    });
  });
}

// ═══════════════════════════════════════════════════════════
//  SUBMIT HANDLER
// ═══════════════════════════════════════════════════════════

function handleSubmit(timedOut = false) {
  stopAnswerCountdown();

  const playerColor   = selColor.value;
  const playerEyes    = selEyes.value;
  const playerLooking = selLooking.value;

  const correct  = currentFrog.getAnswer();
  const matched  = validateAnswer(playerColor, playerEyes, playerLooking);

  // Check if the match is specifically THIS frog (not another frog with same properties)
  const isCorrect = !timedOut && matched && matched.frog === currentFrog;

  // Build per-property result
  const colorOk   = playerColor   === correct.color;
  const eyesOk    = playerEyes    === correct.eyes;
  const lookingOk = playerLooking === correct.looking;

  if (isCorrect) {
    const bonus = Math.round(timeLeft) * POINTS_BONUS;
    score += POINTS_BASE + bonus;
    correctCount++;
    showResult(true, correct, { playerColor, playerEyes, playerLooking },
               { colorOk, eyesOk, lookingOk }, bonus);
  } else {
    lives--;
    showResult(false, correct, { playerColor, playerEyes, playerLooking },
               { colorOk, eyesOk, lookingOk }, 0, timedOut);
  }

  updateScoreboard();
}

// ═══════════════════════════════════════════════════════════
//  RESULT DISPLAY
// ═══════════════════════════════════════════════════════════

function showResult(correct, answer, player, checks, bonus, timedOut = false) {
  showState("result");

  if (correct) {
    resultIcon.textContent  = "🎉";
    resultTitle.textContent = bonus > 0 ? `Correct! +${POINTS_BASE + bonus} pts` : "Correct!";
    resultTitle.className   = "result-title correct";
  } else if (timedOut) {
    resultIcon.textContent  = "⏰";
    resultTitle.textContent = "Time's Up!";
    resultTitle.className   = "result-title wrong";
  } else {
    resultIcon.textContent  = "❌";
    resultTitle.textContent = "Not Quite!";
    resultTitle.className   = "result-title wrong";
  }

  // Build detail rows
  const rows = [
    { label: "Body Color",  playerVal: player.playerColor   || "—", correct: answer.color,   ok: checks.colorOk   },
    { label: "Eye Color",   playerVal: player.playerEyes    || "—", correct: answer.eyes,    ok: checks.eyesOk    },
    { label: "Looking",     playerVal: player.playerLooking || "—", correct: answer.looking, ok: checks.lookingOk },
  ];

  resultDetails.innerHTML = rows.map(r => `
    <div class="detail-row">
      <span class="detail-label">${r.label}</span>
      <span class="detail-value">
        <span class="chip ${r.ok ? "correct-chip" : "wrong-chip"}">
          You: ${r.playerVal}
        </span>
        ${!r.ok ? `<span class="chip correct-chip">✓ ${r.correct}</span>` : ""}
      </span>
    </div>
  `).join("");
}

// ═══════════════════════════════════════════════════════════
//  NEXT ROUND / GAME OVER
// ═══════════════════════════════════════════════════════════

function advanceRound() {
  queueIndex++;

  if (lives <= 0) {
    showEndScreen("Game Over 💀", "You ran out of lives!");
    return;
  }

  if (queueIndex >= queue.length) {
    showEndScreen("All Frogs Cleared! 🏆", "You identified every frog!");
    return;
  }

  showNextFrog();
}

function showEndScreen(title, message) {
  showState("idle"); // hide stage states
  document.querySelector(".stage").style.display = "none";
  endScreen.classList.remove("hidden");

  endTitle.textContent   = title;
  endMessage.textContent = message;
  endStats.innerHTML = `
    <div class="end-stat"><span class="end-stat-val">${score}</span><span class="end-stat-lbl">Total Score</span></div>
    <div class="end-stat"><span class="end-stat-val">${correctCount} / ${allFrogs.length}</span><span class="end-stat-lbl">Correct</span></div>
    <div class="end-stat"><span class="end-stat-val">${lives}</span><span class="end-stat-lbl">Lives Left</span></div>
  `;
}

// ═══════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ═══════════════════════════════════════════════════════════

startBtn.addEventListener("click", startGame);

submitBtn.addEventListener("click", () => {
  if (!selColor.value || !selEyes.value || !selLooking.value) {
    // Shake the dropdowns if incomplete
    document.querySelectorAll(".select-wrap").forEach(w => {
      if (!w.querySelector("select").value) {
        w.classList.add("shake");
        setTimeout(() => w.classList.remove("shake"), 500);
      }
    });
    return;
  }
  handleSubmit(false);
});

nextBtn.addEventListener("click", advanceRound);
replayBtn.addEventListener("click", startGame);

// ─── Shake keyframe (injected via JS to keep CSS clean) ───
const shakeStyle = document.createElement("style");
shakeStyle.textContent = `
  .shake { animation: shake 0.4s ease; }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-6px); }
    40%      { transform: translateX(6px); }
    60%      { transform: translateX(-4px); }
    80%      { transform: translateX(4px); }
  }
`;
document.head.appendChild(shakeStyle);

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════

spawnBubbles();
updateScoreboard();
