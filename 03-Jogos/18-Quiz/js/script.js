const canvas = document.getElementById('quizCanvas');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const nextButton = document.getElementById('nextButton');

let currentQuestion = 0;
let score = 0;
let questions = [
    {
        question: "Qual é a capital da França?",
        options: ["Berlim", "Madri", "Paris", "Roma"],
        correct: 1
    },
    {
        question: "Quem escreveu 'Dom Quixote'?",
        options: ["Shakespeare", "Cervantes", "Molière", "Dante"],
        correct: 0
    },
    {
        question: "Qual é o maior planeta do Sistema Solar?",
        options: ["Terra", "Marte", "Júpiter", "Saturno"],
        correct: 2
    }
];

const optionHeight = 40; // Altura de cada opção
const optionPadding = 10; // Espaço entre as opções
const questionYOffset = 50; // Offset vertical para a pergunta
const optionYOffset = 100; // Offset vertical inicial para as opções

function drawQuestion() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '20px Arial';
    ctx.fillStyle = '#333';

    const q = questions[currentQuestion];
    ctx.fillText(q.question, 20, questionYOffset);

    q.options.forEach((option, index) => {
        ctx.fillText(`${index + 1}. ${option}`, 20, optionYOffset + index * (optionHeight + optionPadding));
    });
}

function isInsideOption(x, y, index) {
    const optionTop = optionYOffset + index * (optionHeight + optionPadding) - optionHeight;
    const optionBottom = optionTop + optionHeight;

    return y > optionTop && y < optionBottom;
}

canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const q = questions[currentQuestion];

    for (let i = 0; i < q.options.length; i++) {
        if (isInsideOption(x, y, i)) {
            if (i === q.correct) {
                status.textContent = "Correto!";
                score++;
            } else {
                status.textContent = "Incorreto!";
            }
            nextButton.style.display = 'inline';
            break;
        }
    }
});

nextButton.addEventListener('click', function() {
    currentQuestion++;
    if (currentQuestion < questions.length) {
        drawQuestion();
        status.textContent = '';
        nextButton.style.display = 'none';
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillText(`Fim do Quiz! Sua pontuação: ${score}/${questions.length}`, 20, 200);
        status.textContent = '';
        nextButton.style.display = 'none';
    }
});

drawQuestion();
