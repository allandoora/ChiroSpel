// ===========================
// RAAD HET GETAL — game.js
// ===========================

// --- State ---
let secretNumber;
let attempts;
let gameOver;
let wins = 0;
let record = null;

// --- DOM refs ---
const guessInput    = document.getElementById('guessInput');
const guessBtn      = document.getElementById('guessBtn');
const resetBtn      = document.getElementById('resetBtn');
const playAgainBtn  = document.getElementById('playAgainBtn');
const feedbackPanel = document.getElementById('feedbackPanel');
const feedbackIcon  = document.getElementById('feedbackIcon');
const feedbackText  = document.getElementById('feedbackText');
const feedbackSub   = document.getElementById('feedbackSub');
const guessHistory  = document.getElementById('guessHistory');
const attemptsEl    = document.getElementById('attempts');
const recordEl      = document.getElementById('record');
const winsEl        = document.getElementById('wins');
const winOverlay    = document.getElementById('winOverlay');
const winNumber     = document.getElementById('winNumber');
const winMsg        = document.getElementById('winMsg');

// --- Init ---
function startGame() {
    secretNumber = Math.floor(Math.random() * 100) + 1;
    attempts = 0;
    gameOver = false;

    guessInput.value = '';
    guessInput.disabled = false;
    guessBtn.disabled = false;
    guessHistory.innerHTML = '';
    attemptsEl.textContent = '0';

    setFeedback('?', 'Ik denk aan een getal tussen 1 en 100.', 'Wat zou het zijn?', '');
    winOverlay.classList.remove('show');
    guessInput.focus();
}

// --- Feedback helper ---
function setFeedback(icon, text, sub, stateClass) {
    feedbackIcon.textContent = icon;
    feedbackText.textContent = text;
    feedbackSub.textContent  = sub;

    feedbackPanel.className = 'feedback-panel';
    if (stateClass) {
        feedbackPanel.classList.add('active', stateClass);
    }
}

// --- Add guess chip ---
function addChip(number, type) {
    const chip = document.createElement('span');
    chip.className = `guess-chip ${type}`;
    chip.textContent = number;
    guessHistory.appendChild(chip);
}

// --- Shake input ---
function shakeInput() {
    guessInput.classList.remove('shake');
    void guessInput.offsetWidth; // force reflow
    guessInput.classList.add('shake');
}

// --- Handle guess ---
function handleGuess() {
    if (gameOver) return;

    const raw = guessInput.value.trim();
    const guess = parseInt(raw, 10);

    // Validate
    if (isNaN(guess) || guess < 1 || guess > 100) {
        shakeInput();
        setFeedback('!', 'Voer een geldig getal in tussen 1 en 100.', 'Probeer opnieuw.', '');
        guessInput.value = '';
        guessInput.focus();
        return;
    }

    attempts++;
    attemptsEl.textContent = attempts;
    guessInput.value = '';
    guessInput.focus();

    if (guess < secretNumber) {
        addChip(guess, 'low');
        setFeedback(
            '↑',
            `${guess} is te laag!`,
            'Probeer een hoger getal.',
            'too-low'
        );
    } else if (guess > secretNumber) {
        addChip(guess, 'high');
        setFeedback(
            '↓',
            `${guess} is te hoog!`,
            'Probeer een lager getal.',
            'too-high'
        );
    } else {
        // Correct!
        gameOver = true;
        wins++;
        winsEl.textContent = wins;

        if (record === null || attempts < record) {
            record = attempts;
            recordEl.textContent = record;
        }

        addChip(guess, 'win');
        setFeedback('✓', `${guess} is correct!`, '', 'correct');

        guessInput.disabled = true;
        guessBtn.disabled   = true;

        // Show win overlay
        winNumber.textContent = secretNumber;
        winMsg.textContent = getWinMessage(attempts);

        setTimeout(() => {
            winOverlay.classList.add('show');
        }, 400);
    }
}

// --- Win message based on attempts ---
function getWinMessage(n) {
    if (n === 1)  return 'Ongelooflijk! Je raadde het meteen! 🎯';
    if (n <= 3)   return `Waanzinnig goed! Slechts ${n} pogingen!`;
    if (n <= 6)   return `Geweldig! ${n} pogingen — top prestatie!`;
    if (n <= 10)  return `Goed gedaan! ${n} pogingen.`;
    return `Gelukt in ${n} pogingen. Je kunt beter!`;
}

// --- Events ---
guessBtn.addEventListener('click', handleGuess);

guessInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleGuess();
});

resetBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', startGame);

// --- Start on load ---
startGame();