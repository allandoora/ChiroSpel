const canvas = document.getElementById("snakeGame");
const ctx = canvas.getContext("2d");
const grid = 20;
let count = 0;
let score = 0;

// SNELHEID: Verhoog dit getal voor trager (15 is erg traag, 10 is gemiddeld)
const gamespeed = 12;

let snake = {
    x: 160, y: 160, dx: grid, dy: 0,
    cells: [], maxCells: 4
};
let apple = { x: 80, y: 80 };

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function loop() {
    requestAnimationFrame(loop);
    if (++count < gamespeed) return;
    count = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    snake.x += snake.dx;
    snake.y += snake.dy;

    if (snake.x < 0) snake.x = canvas.width - grid;
    else if (snake.x >= canvas.width) snake.x = 0;
    if (snake.y < 0) snake.y = canvas.height - grid;
    else if (snake.y >= canvas.height) snake.y = 0;

    snake.cells.unshift({ x: snake.x, y: snake.y });
    if (snake.cells.length > snake.maxCells) snake.cells.pop();

    // Appel tekenen
    ctx.fillStyle = 'red';
    ctx.fillRect(apple.x, apple.y, grid - 1, grid - 1);

    // Slang tekenen
    ctx.fillStyle = '#2ecc71';
    snake.cells.forEach(function(cell, index) {
        ctx.fillRect(cell.x, cell.y, grid - 1, grid - 1);

        // Appel eten
        if (cell.x === apple.x && cell.y === apple.y) {
            snake.maxCells++;
            score++;
            document.getElementById('scoreVal').innerText = score;
            apple.x = getRandomInt(0, 15) * grid;
            apple.y = getRandomInt(0, 15) * grid;
        }

        // Zichzelf bijten (Game over)
        for (let i = index + 1; i < snake.cells.length; i++) {
            if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
                snake.x = 160; snake.y = 160;
                snake.cells = []; snake.maxCells = 4;
                snake.dx = grid; snake.dy = 0;
                score = 0;
                document.getElementById('scoreVal').innerText = score;
            }
        }
    });
}

// Pijltjestoetsen
document.addEventListener('keydown', function(e) {
    if (e.which === 37 && snake.dx === 0) { snake.dx = -grid; snake.dy = 0; }
    else if (e.which === 38 && snake.dy === 0) { snake.dy = -grid; snake.dx = 0; }
    else if (e.which === 39 && snake.dx === 0) { snake.dx = grid; snake.dy = 0; }
    else if (e.which === 40 && snake.dy === 0) { snake.dy = grid; snake.dx = 0; }
});

// Swipe voor gsm
let touchstartX = 0;
let touchstartY = 0;

document.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
    touchstartY = e.changedTouches[0].screenY;
}, false);

document.addEventListener('touchend', e => {
    let dx = e.changedTouches[0].screenX - touchstartX;
    let dy = e.changedTouches[0].screenY - touchstartY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && snake.dx === 0)      { snake.dx = grid;  snake.dy = 0; }
        else if (dx < 0 && snake.dx === 0) { snake.dx = -grid; snake.dy = 0; }
    } else {
        if (dy > 0 && snake.dy === 0)      { snake.dy = grid;  snake.dx = 0; }
        else if (dy < 0 && snake.dy === 0) { snake.dy = -grid; snake.dx = 0; }
    }
}, false);

requestAnimationFrame(loop);