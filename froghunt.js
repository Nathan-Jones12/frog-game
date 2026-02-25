// ═══════════════════════════════════════════════════
//   FROG HUNT — Canvas Version JS
// ═══════════════════════════════════════════════════

const spank   = new Audio("thespank.m4a");
const counter = document.getElementById("counter");
const button  = document.getElementById("startButton");
const timer   = document.getElementById("timer");
const box     = document.getElementById("box");

// ─── CANVAS SETUP ─────────────────────────────────────────────────────────
// We grab the canvas element and get its 2D drawing context.
// ctx is the "toolbox" — it has all the drawing methods like
// drawImage(), clearRect(), fillRect(), etc.
const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

// Size the canvas resolution to match the screen.
// canvas.width / canvas.height = actual pixel resolution (not CSS size).
// If you skip this, the canvas defaults to 300x150px and your coordinates
// will be wrong even if CSS stretches it to fill the screen.
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();

// Re-size if the window changes (e.g. user resizes browser)
window.addEventListener("resize", () => {
  resizeCanvas();
  if (gameRunning) drawFrog(); // redraw at correct size after resize
});

// ─── LOAD THE FROG IMAGE ──────────────────────────────────────────────────
// ctx.drawImage() needs an Image object, not an <img> HTML element.
// We create one in JS, point it at the file, and wait for it to load.
// Once frogImg.onload fires, the image is ready to be drawn onto canvas.
const frogImg = new Image();
frogImg.src = "assets/frog_no_bg.png";
frogImg.onload = () => console.log("Frog image loaded and ready to draw!");

// ─── FROG STATE ───────────────────────────────────────────────────────────
// In the original, frog position was tracked by CSS (top/left as % strings).
// On canvas, we own the position ourselves as plain pixel numbers.
// frogX and frogY are the top-left corner of where we draw the frog.
const FROG_SIZE = 90; // matches the original CSS width/height of 90px
let frogX = 0;
let frogY = 0;

let count       = 0;
let seconds     = 0;
let motion      = null;
let gameRunning = false;

// Used for the catch flash effect (replaces the CSS .caught animation)
let flashAlpha = 0;





let targetX = frogX;
let targetY = frogY;
let isSliding = false;
let slideSpeed = 5; // pixels per frame


// ─── DRAW FUNCTION ────────────────────────────────────────────────────────
// This is the heart of canvas rendering.
// Canvas doesn't automatically update — you have to manually repaint.
// The pattern is always: CLEAR → REDRAW EVERYTHING.
//
//   ctx.clearRect(x, y, w, h)  — erases a rectangle of pixels
//   ctx.drawImage(img, x, y, w, h) — draws an image at (x,y) with size w×h
function drawFrog() {
  // Step 1: erase the whole canvas so the previous frame is gone
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameRunning) return; // nothing to draw if game isn't active

  // Step 2: draw the frog at its current position
  ctx.drawImage(frogImg, frogX, frogY, FROG_SIZE, FROG_SIZE);

  // Step 3: if a catch-flash is active, draw a golden overlay on top
  // ctx.globalAlpha sets the transparency of everything drawn after it.
  // 0.0 = invisible, 1.0 = fully opaque. Always reset it after use!
  if (flashAlpha > 0) {
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle   = "rgba(240, 192, 64, 1)";
    ctx.fillRect(frogX, frogY, FROG_SIZE, FROG_SIZE);
    ctx.globalAlpha = 1.0; // reset so future draws aren't affected
  }
}

// ─── CHANGE FROG LOCATION ─────────────────────────────────────────────────
// Original: image.style.top = x + "%"; image.style.left = y + "%";
// Canvas:   update frogX/frogY as pixel numbers, then call drawFrog().
//
// We subtract FROG_SIZE from the max so the frog stays fully on-screen
// (otherwise its top-left corner could be at the edge and it'd be cut off).
function changeLocation() {
  frogX = Math.floor(Math.random() * (canvas.width  - FROG_SIZE));
  frogY = Math.floor(Math.random() * (canvas.height - FROG_SIZE));
  drawFrog();
}
//setInterval(changeLocation, 2000);

// ─── CATCH FLASH ──────────────────────────────────────────────────────────
// Original used a CSS @keyframes animation class (.caught).
// On canvas we animate manually using requestAnimationFrame.
//
// requestAnimationFrame(fn) asks the browser to call fn just before it
// repaints the screen (~60 times per second). It's the standard way to
// animate on canvas — smoother and more efficient than setInterval.
function catchFlash() {
  flashAlpha = 0.85; // start bright

  function fadeOut() {
    flashAlpha -= 0.075;    // reduce alpha a little each frame
    drawFrog();             // repaint frog + flash at updated alpha
    if (flashAlpha > 0) {
      requestAnimationFrame(fadeOut); // schedule the next frame
    } else {
      flashAlpha = 0;
      drawFrog(); // final clean draw with no flash
    }
  }

  requestAnimationFrame(fadeOut); // kick off the animation loop
}

// ─── CLICK DETECTION ──────────────────────────────────────────────────────
// Original: the <img id="froggy"> received click events automatically
// because HTML elements do that natively.
//
// Canvas is one big rectangle — the whole thing is one element.
// Clicks go to the canvas, not to the frog specifically.
// So we manually check whether the click (x, y) falls inside the
// frog's bounding box using simple math.
function didClickFrog(e) {
  return (
    e.clientX >= frogX &&
    e.clientX <= frogX + FROG_SIZE &&
    e.clientY >= frogY &&
    e.clientY <= frogY + FROG_SIZE
  );
}

canvas.addEventListener("click", (e) => {
  if (!gameRunning) return;

  if (didClickFrog(e)) {
  spank.currentTime = 0;
  spank.play();

  changeCount();

  // 1️⃣ Teleport instantly
  changeLocation();

  // 2️⃣ Set a NEW slide target
  targetX = Math.random() * (canvas.width - FROG_SIZE);
  targetY = Math.random() * (canvas.height - FROG_SIZE);

  isSliding = true;

  catchFlash();
  }})

// ─── HELPERS (mostly same as original) ────────────────────────────────────

function changeCount() {
  count++;
  counter.textContent = count;
  counter.classList.remove("pop");
  void counter.offsetWidth; // force reflow to restart animation
  counter.classList.add("pop");
  setTimeout(() => counter.classList.remove("pop"), 350);
}

function tick() {
  timer.textContent = `Time left: ${seconds}s`;

  if (seconds <= 3 && seconds > 0) {
    timer.classList.add("urgent");
  } else {
    timer.classList.remove("urgent");
  }

  seconds--;

  if (seconds === 0) {
    button.style.display = "flex";
  }

  if (seconds >= 0) {
    setTimeout(tick, 1000);
  } else {
    endGame();
  }
}

function updateFrog() {
  if (!isSliding) return;

  let dx = targetX - frogX;
  let dy = targetY - frogY;

  let distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < slideSpeed) {
    frogX = targetX;
    frogY = targetY;
    isSliding = false;
  } else {
    frogX += (dx / distance) * slideSpeed;
    frogY += (dy / distance) * slideSpeed;
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFrog();

updateFrog()


  requestAnimationFrame(gameLoop);
}

gameLoop();

// ─── START GAME ───────────────────────────────────────────────────────────
function startGame() {
  count       = 0;
  seconds     = 10;
  gameRunning = true;

  counter.textContent  = count;
  button.style.display = "none";

  // Enable pointer-events so the canvas receives clicks during the game.
  // We set it to "none" by default in CSS so the canvas doesn't block
  // the start button underneath it before the game begins.
  canvas.style.pointerEvents = "auto";
  box.style.visibility = "visible";

  changeLocation(); // place frog at a random starting position
  tick();
  //motion = setInterval(changeLocation, 1000);
}

// ─── END GAME ─────────────────────────────────────────────────────────────
function endGame() {
  gameRunning = false;
  clearInterval(motion);

  // "Remove" the frog by clearing the canvas.
  // On canvas there's no element to hide — you just stop drawing it.
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Turn off canvas pointer-events so it doesn't block the button again
  canvas.style.pointerEvents = "none";
  box.style.visibility = "hidden";

  timer.textContent = "⏰ Time's up!";
  timer.classList.remove("urgent");
}

// ─── INITIAL STATE ────────────────────────────────────────────────────────
counter.textContent = count;

button.addEventListener("click", startGame);

// Pan follows cursor (same as original)
document.addEventListener("mousemove", (e) => {
  box.style.left = e.clientX + "px";
  box.style.top  = e.clientY + "px";
});