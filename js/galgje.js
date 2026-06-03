const WORDS = [
    { word: 'VLIEGTUIG',   cat: 'Voertuig'     },
    { word: 'BIBLIOTHEEK', cat: 'Gebouw'        },
    { word: 'SCHILDPAD',   cat: 'Dier'          },
    { word: 'CHOCOLADE',   cat: 'Eten'          },
    { word: 'WATERVAL',    cat: 'Natuur'        },
    { word: 'PARAPLU',     cat: 'Object'        },
    { word: 'COMPUTER',    cat: 'Technologie'   },
    { word: 'DINOSAURUS',  cat: 'Dier'          },
    { word: 'VUURWERK',    cat: 'Evenement'     },
    { word: 'GITAAR',      cat: 'Muziek'        },
    { word: 'KOELKAST',    cat: 'Apparaat'      },
    { word: 'PINGUIN',     cat: 'Dier'          },
    { word: 'MAGNEET',     cat: 'Wetenschap'    },
    { word: 'BALKON',      cat: 'Gebouw'        },
    { word: 'VUURVLIEG',   cat: 'Dier'          },
    { word: 'HORLOGE',     cat: 'Object'        },
    { word: 'VULKAAN',     cat: 'Natuur'        },
    { word: 'TRAMPOLINE',  cat: 'Sport'         },
    { word: 'ASTRONAUT',   cat: 'Beroep'        },
    { word: 'KAMELEON',    cat: 'Dier'          },
];

const MAX_WRONG = 6;
let word, category, guessed, wrong;

function drawGalg(n) {
    const svg = document.getElementById('galg-svg');
    const parts = [
        `<line x1="20"  y1="180" x2="140" y2="180" stroke="#534AB7" stroke-width="4" stroke-linecap="round"/>`,
        `<line x1="60"  y1="180" x2="60"  y2="20"  stroke="#534AB7" stroke-width="4" stroke-linecap="round"/>`,
        `<line x1="60"  y1="20"  x2="110" y2="20"  stroke="#534AB7" stroke-width="4" stroke-linecap="round"/>`,
        `<line x1="110" y1="20"  x2="110" y2="42"  stroke="#7F77DD" stroke-width="3" stroke-linecap="round"/>`,
        `<circle cx="110" cy="55" r="12" fill="#CECBF6" stroke="#534AB7" stroke-width="3"/>`,
        `<line x1="110" y1="67"  x2="110" y2="110" stroke="#534AB7" stroke-width="3" stroke-linecap="round"/>
     <line x1="110" y1="78"  x2="90"  y2="98"  stroke="#534AB7" stroke-width="3" stroke-linecap="round"/>
     <line x1="110" y1="78"  x2="130" y2="98"  stroke="#534AB7" stroke-width="3" stroke-linecap="round"/>`,
        `<line x1="110" y1="110" x2="92"  y2="138" stroke="#534AB7" stroke-width="3" stroke-linecap="round"/>
     <line x1="110" y1="110" x2="128" y2="138" stroke="#534AB7" stroke-width="3" stroke-linecap="round"/>`,
    ];
    svg.innerHTML = parts.slice(0, 3).join('') + (n > 0 ? parts.slice(3, 3 + n).join('') : '');
}

function renderWord() {
    document.getElementById('galg-word').innerHTML = word.split('').map(l =>
        l === ' '
            ? `<span class="letter space"></span>`
            : `<span class="letter">${guessed.has(l) ? l : ''}</span>`
    ).join('');
}

function renderLives() {
    document.getElementById('galg-lives').innerHTML = Array.from({ length: MAX_WRONG }, (_, i) =>
        `<span class="heart${i >= (MAX_WRONG - wrong) ? ' lost' : ''}">♥</span>`
    ).join('');
}

function renderKeys() {
    document.getElementById('galg-keyboard').innerHTML = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => {
        const isWrong   = guessed.has(l) && !word.includes(l);
        const isCorrect = guessed.has(l) &&  word.includes(l);
        return `<button class="key${isWrong ? ' wrong' : isCorrect ? ' correct' : ''}"
      ${guessed.has(l) ? 'disabled' : ''}
      onclick="guess('${l}')">${l}</button>`;
    }).join('');
}

function checkStatus() {
    const won  = word.replace(/ /g, '').split('').every(l => guessed.has(l));
    const lost = wrong >= MAX_WRONG;
    const status  = document.getElementById('galg-status');
    const restart = document.getElementById('galg-restart');

    if (won) {
        status.className = 'status win';
        status.textContent = 'Gewonnen!';
        restart.style.display = 'inline-block';
        document.querySelectorAll('.key').forEach(k => k.disabled = true);
    } else if (lost) {
        status.className = 'status lose';
        status.textContent = 'Het woord was: ' + word;
        restart.style.display = 'inline-block';
        document.querySelectorAll('.key').forEach(k => k.disabled = true);
        word.split('').forEach(l => { if (l !== ' ') guessed.add(l); });
        renderWord();
    } else {
        status.className = 'status';
        status.textContent = '';
    }
}

function guess(letter) {
    if (guessed.has(letter)) return;
    guessed.add(letter);
    if (!word.includes(letter)) wrong++;
    drawGalg(wrong);
    renderWord();
    renderLives();
    renderKeys();
    checkStatus();
}

function startGame() {
    const pick = WORDS[Math.floor(Math.random() * WORDS.length)];
    word     = pick.word;
    category = pick.cat;
    guessed  = new Set();
    wrong    = 0;

    document.getElementById('galg-cat').textContent       = category;
    document.getElementById('galg-status').textContent    = '';
    document.getElementById('galg-status').className      = 'status';
    document.getElementById('galg-restart').style.display = 'none';

    drawGalg(0);
    renderWord();
    renderLives();
    renderKeys();
}

document.addEventListener('keydown', e => {
    const l = e.key.toUpperCase();
    if (/^[A-Z]$/.test(l)) guess(l);
});

startGame();