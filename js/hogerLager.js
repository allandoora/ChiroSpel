let currentNum = Math.floor(Math.random() * 13) + 1;
let score = 0;
document.getElementById('card').innerText = currentNum;

function guess(choice) {
    let nextNum = Math.floor(Math.random() * 13) + 1;
    let msg = document.getElementById('msg');

    if ((choice === 'higher' && nextNum >= currentNum) || (choice === 'lower' && nextNum <= currentNum)) {
        score++;
        msg.innerText = "Goed! Het was " + nextNum;
        msg.style.color = "green";
    } else {
        score = 0;
        msg.innerText = "Helaas! Het was " + nextNum;
        msg.style.color = "red";
    }

    currentNum = nextNum;
    document.getElementById('card').innerText = currentNum;
    document.getElementById('score').innerText = score;
}