const opdrachten = [
    "10 jumping jacks",
    "Zing een liedje",
    "Doe een dans",
    "Spring 20 keer",
    "Vertel een mop",
    "Doe een dier na",
    "Groepspose",
    "Ren heen en terug"
];

const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");

const radius = canvas.width / 2;

let angle = 0;
let spinning = false;

function drawWheel() {
    const slice = (2 * Math.PI) / opdrachten.length;

    for (let i = 0; i < opdrachten.length; i++) {
        const start = i * slice;

        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, start, start + slice);

        ctx.fillStyle = i % 2 === 0 ? "#ffcc00" : "#ff6666";
        ctx.fill();

        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(start + slice / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "black";
        ctx.font = "14px Arial";
        ctx.fillText(opdrachten[i], radius - 10, 5);
        ctx.restore();
    }
}

function rotateWheel() {
    ctx.clearRect(0, 0, 400, 400);

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(angle);
    ctx.translate(-radius, -radius);

    drawWheel();

    ctx.restore();
}

drawWheel();

function spin() {
    if (spinning) return;
    spinning = true;

    const result = document.getElementById("result");

    const extraRotatie = Math.random() * 10 + 10;
    const duration = 4000;
    const start = performance.now();
    const startAngle = angle;

    function animate(time) {
        let progress = (time - start) / duration;
        if (progress > 1) progress = 1;

        const easeOut = 1 - Math.pow(1 - progress, 3);

        angle = startAngle + easeOut * extraRotatie * Math.PI * 2;

        rotateWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {

            // ✅ CORRECTE FIX (pijltje bovenaan)
            const slice = (2 * Math.PI) / opdrachten.length;

            const pointerAngle = -Math.PI / 2;

            let normalizedAngle = angle % (2 * Math.PI);

            let effective = (pointerAngle - normalizedAngle) % (2 * Math.PI);

            if (effective < 0) effective += 2 * Math.PI;

            const index = Math.floor(effective / slice);

            result.innerText = "🎯 " + opdrachten[index];

            spinning = false;
        }
    }

    requestAnimationFrame(animate);
}