/* =====================================================================
   LIGA O JOGO — versão que funciona sem React e sem instalação.
   Ordem dos arquivos no index.html: Phaser -> Jogo.js -> main.js.
   ===================================================================== */
const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#82d7f5',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1100 },
            debug: new URLSearchParams(window.location.search).has('physics'),
        },
    },
    scene: [window.Jogo],
};

window.jogo = new Phaser.Game(config);
