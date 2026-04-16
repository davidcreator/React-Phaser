const musicSelector = document.getElementById('music');
const backgroundMusic = document.getElementById('backgroundMusic');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
const source = audioCtx.createMediaElementSource(backgroundMusic);

source.connect(analyser);
analyser.connect(audioCtx.destination);
analyser.fftSize = 256;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

musicSelector.addEventListener('change', (event) => {
    const selectedMusic = event.target.value;
    backgroundMusic.src = `assets/musicas/${selectedMusic}`;
    backgroundMusic.load(); // Carrega a nova música
    backgroundMusic.play();
});

backgroundMusic.addEventListener('play', () => {
    audioCtx.resume().then(() => {
        setInterval(() => {
            if (!backgroundMusic.paused) {
                spawnNote(); // Gera notas baseadas na música em reprodução
            }
        }, 1000); // Intervalo para gerar notas (ajuste conforme necessário)
    });
});

function drawSpectrogram() {
    analyser.getByteFrequencyData(dataArray);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)'; // Cor do espectrograma
        ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);

        x += barWidth + 1;
    }
}
