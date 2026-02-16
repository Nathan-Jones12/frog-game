const SPEED = 250;          // how fast notes fall (pixels per second)
const PERFECT_RANGE = 50;   // how many ms counts as a perfect hit
const GOOD_RANGE = 120;     // how many ms counts as a good hit


// ============================================================
// THE BEATMAP - when notes appear and in which column
// time = milliseconds from when the game starts
// column = 0 (D), 1 (F), 2 (J), 3 (K)
// ============================================================

const BEATMAP = [
    { column: 0, time: 1000 },
    { column: 1, time: 1500 },
    { column: 2, time: 2000 },
    { column: 3, time: 2500 },
    { column: 0, time: 3000 },
    { column: 2, time: 3000 },
    { column: 1, time: 3500 },
    { column: 3, time: 3500 },
    { column: 0, time: 4000 },
    { column: 1, time: 4250 },
    { column: 2, time: 4500 },
    { column: 3, time: 4750 },
    { column: 0, time: 5000 },
    { column: 3, time: 5000 },
    { column: 1, time: 5500 },
    { column: 2, time: 5500 },
    { column: 0, time: 6000 },
    { column: 1, time: 6300 },
    { column: 2, time: 6600 },
    { column: 3, time: 6900 },
];

// How long the game runs (set this a bit after your last note)
const GAME_LENGTH = 8000;


// ============================================================
// KEYS - which key maps to which column
// column 0 = D, column 1 = F, column 2 = J, column 3 = K
// ============================================================

const KEYS = ['d', 'f', 'j', 'k'];


// ============================================================
// GAME STATE - variables that track what's happening
// ============================================================

let score = 0;
let combo = 0;
let gameRunning = false;
let startTime = null;

// notes[] stores every note currently visible on screen
// each note looks like: { element, column, hitTime, wasHit, wasMissed }
let notes = [];

// tracks which beatmap notes have already been spawned
let spawned = new Set();


// ============================================================
// GRAB HTML ELEMENTS
// ============================================================

const scoreDisplay = document.getElementById('score');
const comboDisplay = document.getElementById('combo');
const accuracyDisplay = document.getElementById('accuracy');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const finalScore = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Grab all 4 columns and hit bars into arrays
const columns = [
    document.getElementById('column-0'),
    document.getElementById('column-1'),
    document.getElementById('column-2'),
    document.getElementById('column-3'),
];

const hitBars = [
    document.getElementById('hit-bar-0'),
    document.getElementById('hit-bar-1'),
    document.getElementById('hit-bar-2'),
    document.getElementById('hit-bar-3'),
];


// ============================================================
// START AND RESTART
// ============================================================

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

function startGame() {
    // Reset everything
    score       = 0;
    combo       = 0;
    gameRunning = true;
    startTime   = performance.now();
    notes       = [];
    spawned     = new Set();

    // Clear any leftover note elements from the screen
    document.querySelectorAll('.note').forEach(n => n.remove());

    // Update displays
    scoreDisplay.text = '0';
    comboDisplay.textContent    = '';
    accuracyDisplay.textContent = '';

    // Hide screens
    startScreen.style.display    = 'none';
    gameOverScreen.style.display = 'none';

    // Schedule the game to end
    setTimeout(endGame, GAME_LENGTH);

    // Start the game loop
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;

    // Remove any remaining notes
    document.querySelectorAll('.note').forEach(n => n.remove());

    // Show game over screen with final score
    finalScore.textContent       = score;
    gameOverScreen.style.display = 'flex';
}


// ============================================================
// GAME LOOP - runs every frame (~60 times per second)
// ============================================================

function gameLoop(timestamp) {
    if (!gameRunning) return;

    // How many ms have passed since the game started
    const elapsed = timestamp - startTime;

    spawnNotes(elapsed);
    moveNotes(elapsed);

    // Keep looping
    requestAnimationFrame(gameLoop);
}


// ============================================================
// SPAWNING NOTES
// ============================================================

function spawnNotes(elapsed) {
    BEATMAP.forEach((beat, index) => {
        // Skip if already spawned
        if (spawned.has(index)) return;

        // Figure out how long a note takes to fall to the hit bar
        const fallTime = getFallTime();

        // Spawn the note early enough so it arrives at the hit bar at beat.time
        const spawnAt = beat.time - fallTime;

        if (elapsed >= spawnAt) {
            spawned.add(index);

            // Create the note div
            const noteEl = document.createElement('div');
            noteEl.className = 'note';
            noteEl.style.top = '0px';

            // Add it to the correct column
            columns[beat.column].appendChild(noteEl);
            
            // Store note info for tracking
            notes.push({
                element:   noteEl,
                column:    beat.column,
                hitTime:   beat.time,    // when it should be hit (ms)
                wasHit:    false,
                wasMissed: false,
            });
        }
    });
}


// ============================================================
// MOVING NOTES DOWN THE SCREEN
// ============================================================

function moveNotes(elapsed) {
    notes.forEach(note => {
        if (note.wasHit || note.wasMissed) return;

        // How far should this note have fallen?
        // It needs to travel from the top to the hit bar by note.hitTime
        const fallTime     = getFallTime();
        const progress     = (elapsed - (note.hitTime - fallTime)) / fallTime;
        const columnHeight = columns[note.column].offsetHeight;
        const hitBarHeight = hitBars[note.column].offsetHeight;
        const targetY      = columnHeight - hitBarHeight - note.element.offsetHeight;
        

        note.element.style.top = (progress * targetY) + 'px';

        // If the note has gone past the hit window, it's a miss
        if (elapsed > note.hitTime + GOOD_RANGE) {
            note.wasMissed = true;
            showAccuracy('MISS', 'red');
            combo = 0;
            comboDisplay.textContent = '';
            note.element.remove();
        }
    });

    // Clean up missed/hit notes from the array
    notes = notes.filter(n => !n.wasHit && !n.wasMissed);
}


// ============================================================
// KEYBOARD INPUT
// ============================================================

document.addEventListener('keydown', (e) => {
    const column = KEYS.indexOf(e.key.toLowerCase());
    if (column === -1) return;          // key isn't D, F, J or K
    if (!gameRunning) return;

    // Light up the hit bar
    hitBars[column].classList.add('lit');

    // Try to hit a note
    tryHit(column);
});

document.addEventListener('keyup', (e) => {
    const column = KEYS.indexOf(e.key.toLowerCase());
    if (column === -1) return;

    // Turn off hit bar highlight
    hitBars[column].classList.remove('lit');
});


// ============================================================
// HIT DETECTION
// ============================================================

function tryHit(column) {
    const elapsed = performance.now() - startTime;

    // Find the note in this column closest to the hit time
    let closestNote = null;
    let closestDiff = Infinity;

    notes.forEach(note => {
        if (note.column !== column) return;
        if (note.wasHit || note.wasMissed) return;

        const diff = Math.abs(elapsed - note.hitTime);

        if (diff < closestDiff) {
            closestDiff = diff;
            closestNote = note;
        }
    });

    // No note found in this column
    if (!closestNote) return;

    // Check how accurate the hit was
    if (closestDiff <= PERFECT_RANGE) {
        registerHit(closestNote, 'PERFECT', 300);
    } else if (closestDiff <= GOOD_RANGE) {
        registerHit(closestNote, 'GOOD', 100);
    }
    // If outside both ranges, do nothing (not a valid hit)
}


// ============================================================
// REGISTERING A HIT
// ============================================================

function registerHit(note, label, points) {
    note.wasHit = true;
    combo++;

    // Bonus points for high combos
    const multiplier = combo >= 10 ? 2 : 1;
    score += points * multiplier;

    scoreDisplay.textContent = score;
    comboDisplay.textContent = combo > 1 ? combo + 'x' : '';

    showAccuracy(label, label === 'PERFECT' ? 'gold' : 'white');

    note.element.remove();
}


// ============================================================
// SHOW ACCURACY TEXT (Perfect / Good / Miss)
// ============================================================

let accuracyTimeout;

function showAccuracy(text, color) {
    accuracyDisplay.textContent = text;
    accuracyDisplay.style.color = color;

    // Clear the text after 500ms
    clearTimeout(accuracyTimeout);
    accuracyTimeout = setTimeout(() => {
        accuracyDisplay.textContent = '';
    }, 500);
}


// ============================================================
// HELPER: how long (ms) it takes a note to fall to the hit bar
// ============================================================

function getFallTime() {
    const column   = columns[0];
    const hitBar   = hitBars[0];
    const distance = column.offsetHeight - hitBar.offsetHeight;
    return (distance / SPEED) * 1000;
}
