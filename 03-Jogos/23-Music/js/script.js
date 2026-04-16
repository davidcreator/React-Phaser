const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

const keys = {
    'a': { pressed: false, color: 'red', lane: 0 },
    's': { pressed: false, color: 'blue', lane: 1 },
    'd': { pressed: false, color: 'green', lane: 2 },
    'f': { pressed: false, color: 'yellow', lane: 3 }
};

let score = 0;
let feedback = '';

const noteWidth = 60;
const noteHeight = 20;
const laneWidth = canvas.width / 4;

class Note {
    constructor(lane, color) {
        this.x = lane * laneWidth + (laneWidth - noteWidth) / 2;
        this.y = 0;
        this.width = noteWidth;
        this.height = noteHeight;
        this.color = color;
        this.active = true;
    }

    update() {
        this.y += 5; // Velocidade de descida da nota
    }

    draw() {
        if (this.active) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }

    checkHit() {
        if (this.y >= canvas.height - 150 && this.y <= canvas.height - 50) {
            const key = Object.keys(keys).find(k => keys[k].color === this.color);
            if (keys[key].pressed) {
                this.active = false;
                return 'perfect';
            }
            return 'miss';
        }
        return '';
    }
}

const notes = [];
const colors = ['red', 'blue', 'green', 'yellow'];

function spawnNote() {
    const lane = Math.floor(Math.random() * 4);
    const color = colors[lane];
    notes.push(new Note(lane, color));
}

function drawLine() {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 150);
    ctx.lineTo(canvas.width, canvas.height - 150);
    ctx.moveTo(0, canvas.height - 50);
    ctx.lineTo(canvas.width, canvas.height - 50);
    ctx.stroke();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(laneWidth * i, 0);
        ctx.lineTo(laneWidth * i, canvas.height);
        ctx.stroke();
    }
}

function drawKeyIndicators() {
    const keyLabels = ['A', 'S', 'D', 'F'];
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    keyLabels.forEach((label, index) => {
        ctx.fillText(label, laneWidth * index + laneWidth / 2 - 10, canvas.height - 20);
    });
}

function handleKeydown(event) {
    if (keys[event.key]) keys[event.key].pressed = true;
}

function handleKeyup(event) {
    if (keys[event.key]) {
        keys[event.key].pressed = false;
        const hitFeedback = notes.map(note => note.checkHit()).find(feedback => feedback);
        if (hitFeedback === 'perfect') {
            score += 100;
            feedback = 'Perfeito!';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(0, canvas.height - 150, canvas.width, 100);
        } else if (hitFeedback === 'miss') {
            feedback = 'Errou';
        } else {
            feedback = '';
        }
    }
}

document.addEventListener('keydown', handleKeydown);
document.addEventListener('keyup', handleKeyup);

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSpectrogram();
    drawLine();
    drawKeyIndicators();
    notes.forEach(note => note.update());
    notes.forEach(note => note.draw());
    document.getElementById('score').innerText = `Pontuação: ${score}`;
    document.getElementById('feedback').innerText = feedback;
    requestAnimationFrame(update);
}

setInterval(spawnNote, 1000);
update();
