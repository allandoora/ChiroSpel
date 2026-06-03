/* ===========================
   SUDOKU.JS
=========================== */

// ── Puzzle generator ────────────────────────────────────────────────────────

function generateSolvedBoard() {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    fillBoard(board);
    return board;
}

function fillBoard(board) {
    const nums = shuffle([1,2,3,4,5,6,7,8,9]);
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) {
                for (const n of shuffle([1,2,3,4,5,6,7,8,9])) {
                    if (isValid(board, r, c, n)) {
                        board[r][c] = n;
                        if (fillBoard(board)) return true;
                        board[r][c] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function isValid(board, row, col, num) {
    for (let i = 0; i < 9; i++) {
        if (board[row][i] === num) return false;
        if (board[i][col] === num) return false;
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++)
        for (let c = bc; c < bc + 3; c++)
            if (board[r][c] === num) return false;
    return true;
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function createPuzzle(solution, difficulty) {
    const clues = { easy: 36, medium: 28, hard: 22 }[difficulty] || 36;
    const puzzle = solution.map(r => [...r]);
    let toRemove = 81 - clues;
    const cells = shuffle([...Array(81).keys()]);
    for (const idx of cells) {
        if (toRemove === 0) break;
        const r = Math.floor(idx / 9);
        const c = idx % 9;
        puzzle[r][c] = 0;
        toRemove--;
    }
    return puzzle;
}

// ── State ────────────────────────────────────────────────────────────────────

let solution   = [];
let puzzle     = [];        // given cells (0 = empty)
let userBoard  = [];        // what the player has entered
let notes      = [];        // notes[r][c] = Set of numbers
let selected   = null;      // { r, c }
let mistakes   = 0;
let hintsLeft  = 3;
let timerSecs  = 0;
let timerHandle = null;
let gameOver   = false;
let difficulty = 'easy';
let noteMode   = false;

// ── DOM refs ─────────────────────────────────────────────────────────────────

const boardEl      = document.getElementById('board');
const timerEl      = document.getElementById('timer');
const mistakesEl   = document.getElementById('mistakes');
const hintsLeftEl  = document.getElementById('hintsLeft');
const hintBtn      = document.getElementById('hintBtn');
const newBtn       = document.getElementById('newBtn');
const winModal     = document.getElementById('winModal');
const loseModal    = document.getElementById('loseModal');
const winTimeEl    = document.getElementById('winTime');
const winMistakesEl= document.getElementById('winMistakes');
document.getElementById('modalNewBtn').addEventListener('click', newGame);
document.getElementById('modalRetryBtn').addEventListener('click', newGame);
newBtn.addEventListener('click', newGame);
hintBtn.addEventListener('click', giveHint);

// ── Difficulty buttons ───────────────────────────────────────────────────────

document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        difficulty = btn.dataset.diff;
        newGame();
    });
});

// ── Numpad ───────────────────────────────────────────────────────────────────

document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => enterNumber(parseInt(btn.dataset.num)));
});

// ── Keyboard ─────────────────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
    if (gameOver) return;
    if (e.key >= '1' && e.key <= '9') enterNumber(parseInt(e.key));
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') enterNumber(0);
    if (e.key === 'n' || e.key === 'N') toggleNoteMode();

    // Arrow navigation
    if (!selected) return;
    const dirs = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] };
    if (dirs[e.key]) {
        e.preventDefault();
        const [dr, dc] = dirs[e.key];
        selectCell(
            Math.max(0, Math.min(8, selected.r + dr)),
            Math.max(0, Math.min(8, selected.c + dc))
        );
    }
});

// ── Core: start a new game ────────────────────────────────────────────────────

function newGame() {
    closeModals();
    gameOver  = false;
    mistakes  = 0;
    hintsLeft = 3;
    selected  = null;
    noteMode  = false;

    solution  = generateSolvedBoard();
    puzzle    = createPuzzle(solution, difficulty);
    userBoard = puzzle.map(r => [...r]);
    notes     = Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => new Set()));

    mistakesEl.textContent  = `0 / 3`;
    hintsLeftEl.textContent = `${hintsLeft} hint${hintsLeft !== 1 ? 's' : ''} over`;
    hintBtn.disabled        = false;

    startTimer();
    renderBoard();
    updateNumpad();
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;

            const given = puzzle[r][c] !== 0;
            const val   = userBoard[r][c];

            if (given) {
                cell.classList.add('given');
                cell.textContent = val;
            } else if (val !== 0) {
                const correct = val === solution[r][c];
                cell.classList.add(correct ? 'user-val' : 'error-val');
                cell.textContent = val;
            } else {
                // notes
                const noteSet = notes[r][c];
                if (noteSet.size > 0) {
                    const grid = document.createElement('div');
                    grid.className = 'notes-grid';
                    for (let n = 1; n <= 9; n++) {
                        const span = document.createElement('span');
                        span.className = 'note';
                        span.textContent = noteSet.has(n) ? n : '';
                        grid.appendChild(span);
                    }
                    cell.appendChild(grid);
                }
            }

            cell.addEventListener('click', () => selectCell(r, c));
            boardEl.appendChild(cell);
        }
    }
    applyHighlights();
}

function getCellEl(r, c) {
    return boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
}

function applyHighlights() {
    // clear all
    document.querySelectorAll('.cell').forEach(el => {
        el.classList.remove('selected', 'peer-highlight', 'same-number');
    });
    if (!selected) {
        boardEl.classList.remove('has-selection');
        return;
    }
    boardEl.classList.add('has-selection');

    const { r, c } = selected;
    const val = userBoard[r][c];

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const el = getCellEl(i, j);
            if (!el) continue;
            const isPeer =
                i === r || j === c ||
                (Math.floor(i/3) === Math.floor(r/3) && Math.floor(j/3) === Math.floor(c/3));
            if (i === r && j === c) {
                el.classList.add('selected');
            } else if (val !== 0 && userBoard[i][j] === val) {
                el.classList.add('same-number');
            } else if (isPeer) {
                el.classList.add('peer-highlight');
            }
        }
    }
}

// ── Select ────────────────────────────────────────────────────────────────────

function selectCell(r, c) {
    selected = { r, c };
    applyHighlights();
}

// ── Enter number ──────────────────────────────────────────────────────────────

function enterNumber(num) {
    if (!selected || gameOver) return;
    const { r, c } = selected;
    if (puzzle[r][c] !== 0) return; // given cell

    if (noteMode && num !== 0) {
        if (userBoard[r][c] === 0) {
            const set = notes[r][c];
            set.has(num) ? set.delete(num) : set.add(num);
            renderBoard();
            selectCell(r, c);
        }
        return;
    }

    if (num === 0) {
        userBoard[r][c] = 0;
        notes[r][c].clear();
        renderBoard();
        selectCell(r, c);
        updateNumpad();
        return;
    }

    // Clear notes from peers when placing a number
    clearPeerNotes(r, c, num);

    userBoard[r][c] = num;

    if (num !== solution[r][c]) {
        mistakes++;
        mistakesEl.textContent = `${mistakes} / 3`;
        const el = getCellEl(r, c);
        if (el) {
            el.classList.add('error-anim');
            el.addEventListener('animationend', () => el.classList.remove('error-anim'), { once: true });
        }
        if (mistakes >= 3) {
            renderBoard();
            endGame(false);
            return;
        }
    }

    renderBoard();
    selectCell(r, c);
    updateNumpad();

    if (checkWin()) {
        endGame(true);
    }
}

function clearPeerNotes(r, c, num) {
    for (let i = 0; i < 9; i++) {
        notes[r][i].delete(num);
        notes[i][c].delete(num);
    }
    const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
    for (let i = br; i < br+3; i++)
        for (let j = bc; j < bc+3; j++)
            notes[i][j].delete(num);
}

// ── Note mode toggle ──────────────────────────────────────────────────────────

function toggleNoteMode() {
    noteMode = !noteMode;
    // Visual feedback on hint btn area (reuse hints-left label)
    hintsLeftEl.textContent = noteMode
        ? '✏ Notities aan'
        : `${hintsLeft} hint${hintsLeft !== 1 ? 's' : ''} over`;
}

// ── Hint ──────────────────────────────────────────────────────────────────────

function giveHint() {
    if (hintsLeft <= 0 || gameOver) return;
    // Find empty or wrong cell
    const empties = [];
    for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
            if (puzzle[r][c] === 0 && userBoard[r][c] !== solution[r][c])
                empties.push({ r, c });
    if (empties.length === 0) return;

    const { r, c } = empties[Math.floor(Math.random() * empties.length)];
    userBoard[r][c] = solution[r][c];
    notes[r][c].clear();
    clearPeerNotes(r, c, solution[r][c]);

    hintsLeft--;
    hintsLeftEl.textContent = noteMode
        ? '✏ Notities aan'
        : `${hintsLeft} hint${hintsLeft !== 1 ? 's' : ''} over`;
    if (hintsLeft === 0) hintBtn.disabled = true;

    renderBoard();
    selectCell(r, c);
    // Flash hint animation
    const el = getCellEl(r, c);
    if (el) el.classList.add('hint-cell');

    updateNumpad();
    if (checkWin()) endGame(true);
}

// ── Numpad: dim fully-placed numbers ─────────────────────────────────────────

function updateNumpad() {
    const counts = Array(10).fill(0);
    for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
            if (userBoard[r][c] !== 0 && userBoard[r][c] === solution[r][c])
                counts[userBoard[r][c]]++;
    document.querySelectorAll('.num-btn[data-num]').forEach(btn => {
        const n = parseInt(btn.dataset.num);
        if (n >= 1 && n <= 9) {
            btn.classList.toggle('used', counts[n] >= 9);
        }
    });
}

// ── Win check ─────────────────────────────────────────────────────────────────

function checkWin() {
    for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
            if (userBoard[r][c] !== solution[r][c]) return false;
    return true;
}

// ── End game ──────────────────────────────────────────────────────────────────

function endGame(won) {
    gameOver = true;
    clearInterval(timerHandle);

    if (won) {
        winTimeEl.textContent     = `Opgelost in ${timerEl.textContent}`;
        winMistakesEl.textContent = `met ${mistakes} fout${mistakes !== 1 ? 'en' : ''}`;
        winModal.classList.add('show');
    } else {
        loseModal.classList.add('show');
    }
}

function closeModals() {
    winModal.classList.remove('show');
    loseModal.classList.remove('show');
}

// ── Timer ─────────────────────────────────────────────────────────────────────

function startTimer() {
    clearInterval(timerHandle);
    timerSecs = 0;
    timerEl.textContent = '00:00';
    timerHandle = setInterval(() => {
        timerSecs++;
        const m = String(Math.floor(timerSecs / 60)).padStart(2, '0');
        const s = String(timerSecs % 60).padStart(2, '0');
        timerEl.textContent = `${m}:${s}`;
    }, 1000);
}

// ── Boot ──────────────────────────────────────────────────────────────────────

newGame();