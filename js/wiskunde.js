/* ===== STATE ===== */
const state = {
    score: 0,
    highscore: parseInt(localStorage.getItem('mathHighScore') || '0'),
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    questionNum: 1,
    level: 'easy',
    current: null,   // { a, b, op, answer }
    locked: false,   // prevent double-submit during transition
};

/* ===== DOM REFS ===== */
const $ = id => document.getElementById(id);
const scoreEl       = $('score');
const highscoreEl   = $('highscore');
const equationEl    = $('equation');
const answerInput   = $('answer-input');
const submitBtn     = $('submit-btn');
const feedbackEl    = $('feedback');
const opBadge       = $('op-badge');
const questionCount = $('question-count');
const correctEl     = $('correct-count');
const wrongEl       = $('wrong-count');
const streakEl      = $('streak');
const levelBtns     = document.querySelectorAll('.level-btn');
const confettiBox   = $('confetti-container');

/* ===== OPERATORS ===== */
const OPS = ['+', '-', '×', '÷'];

/* ===== GENERATE QUESTION ===== */
function generateQuestion() {
    const { level } = state;
    let a, b, op;

    // Pick operator
    if (level === 'easy') {
        op = OPS[Math.floor(Math.random() * 2)]; // + or -
    } else if (level === 'medium') {
        op = OPS[Math.floor(Math.random() * 3)]; // +, -, ×
    } else {
        op = OPS[Math.floor(Math.random() * 4)]; // all
    }

    // Generate numbers based on level
    if (level === 'easy') {
        a = rand(1, 20);
        b = rand(1, 20);
        if (op === '-' && b > a) [a, b] = [b, a]; // no negatives
    } else if (level === 'medium') {
        if (op === '×') { a = rand(2, 12); b = rand(2, 12); }
        else { a = rand(10, 100); b = rand(1, 50); }
        if (op === '-' && b > a) [a, b] = [b, a];
    } else {
        if (op === '×') { a = rand(2, 25); b = rand(2, 25); }
        else if (op === '÷') { b = rand(2, 12); a = b * rand(2, 15); }
        else { a = rand(50, 999); b = rand(50, 999); }
        if (op === '-' && b > a) [a, b] = [b, a];
    }

    // Calculate answer
    let answer;
    if (op === '+') answer = a + b;
    if (op === '-') answer = a - b;
    if (op === '×') answer = a * b;
    if (op === '÷') answer = a / b;

    return { a, b, op, answer };
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ===== RENDER QUESTION ===== */
function renderQuestion() {
    const q = generateQuestion();
    state.current = q;

    // Fade out, swap, fade in
    equationEl.classList.add('fade');
    setTimeout(() => {
        equationEl.textContent = `${q.a} ${q.op} ${q.b} = ?`;
        equationEl.classList.remove('fade');
        equationEl.style.transition = 'opacity .25s, transform .25s';
        equationEl.style.opacity = '0';
        equationEl.style.transform = 'translateY(10px)';
        requestAnimationFrame(() => requestAnimationFrame(() => {
            equationEl.style.opacity = '1';
            equationEl.style.transform = 'translateY(0)';
        }));
    }, 200);

    // Op badge
    opBadge.textContent = q.op;
    opBadge.setAttribute('data-op', q.op);

    // Question counter
    questionCount.textContent = `Vraag ${state.questionNum}`;

    // Clear input & feedback
    answerInput.value = '';
    answerInput.classList.remove('correct', 'wrong');
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    answerInput.focus();
    state.locked = false;
}

/* ===== CHECK ANSWER ===== */
function checkAnswer() {
    if (state.locked || answerInput.value === '') return;
    state.locked = true;

    const userAnswer = parseFloat(answerInput.value);
    const correct = Math.abs(userAnswer - state.current.answer) < 0.001;

    if (correct) {
        handleCorrect();
    } else {
        handleWrong();
    }
}

function handleCorrect() {
    state.score++;
    state.correctCount++;
    state.streak++;
    state.questionNum++;

    updateScoreDisplay();
    updateHighscore();

    // Input feedback
    answerInput.classList.add('correct');

    // Feedback text
    const msgs = ['🎉 Correct!', '✅ Goed zo!', '🔥 Juist!', '⚡ Perfect!', '🧠 Briljant!'];
    feedbackEl.textContent = msgs[Math.floor(Math.random() * msgs.length)];
    feedbackEl.className = 'feedback correct-fb';

    // Stats animation
    bump(correctEl);
    if (state.streak >= 3) bump(streakEl);

    // Confetti on milestones or streak
    if (state.score % 5 === 0 || state.streak >= 5) launchConfetti();

    // Next question
    setTimeout(() => renderQuestion(), 900);
}

function handleWrong() {
    state.wrongCount++;
    state.streak = 0;
    state.score = 0;
    state.questionNum++;
    scoreEl.textContent = '0';

    // Shake card
    const card = document.getElementById('main-card');
    card.classList.remove('shake');
    void card.offsetWidth; // reflow
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 500);

    // Input feedback
    answerInput.classList.add('wrong');

    // Feedback text with correct answer
    feedbackEl.innerHTML = `❌ Fout! Het antwoord was <strong>${state.current.answer}</strong>`;
    feedbackEl.className = 'feedback wrong-fb';

    // Reset streak display
    updateStatsDisplay();

    // Next question
    setTimeout(() => renderQuestion(), 1200);
}

/* ===== SCORE / HIGHSCORE ===== */
function updateScoreDisplay() {
    scoreEl.textContent = state.score;
    pop(scoreEl);
    updateStatsDisplay();
}

function updateStatsDisplay() {
    correctEl.textContent = state.correctCount;
    wrongEl.textContent   = state.wrongCount;
    streakEl.textContent  = state.streak;
}

function updateHighscore() {
    if (state.score > state.highscore) {
        state.highscore = state.score;
        localStorage.setItem('mathHighScore', state.highscore);
        highscoreEl.textContent = state.highscore;
        pop(highscoreEl);
    }
}

/* ===== ANIMATIONS ===== */
function pop(el) {
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 300);
}

function bump(el) {
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 250);
}

/* ===== CONFETTI ===== */
function launchConfetti() {
    const colors = ['#f5c518', '#ff4e4e', '#4edfb4', '#b06aff', '#ff8c42', '#ffffff'];
    const shapes = ['circle', 'square', 'rect'];
    for (let i = 0; i < 48; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';

        const color  = colors[Math.floor(Math.random() * colors.length)];
        const shape  = shapes[Math.floor(Math.random() * shapes.length)];
        const left   = Math.random() * 100;
        const delay  = Math.random() * 0.6;
        const dur    = 1.2 + Math.random() * 1.2;
        const size   = 6 + Math.random() * 10;

        piece.style.cssText = `
      left: ${left}%;
      top: 0;
      width: ${shape === 'rect' ? size * 1.8 : size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${shape === 'circle' ? '50%' : '2px'};
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
    `;
        confettiBox.appendChild(piece);
        setTimeout(() => piece.remove(), (dur + delay) * 1000 + 200);
    }
}

/* ===== LEVEL BUTTONS ===== */
levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        levelBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.level = btn.dataset.level;
        renderQuestion();
    });
});

/* ===== SUBMIT ===== */
submitBtn.addEventListener('click', checkAnswer);
answerInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') checkAnswer();
});

/* ===== INIT ===== */
function init() {
    highscoreEl.textContent = state.highscore;
    scoreEl.textContent     = '0';
    renderQuestion();
}

init();