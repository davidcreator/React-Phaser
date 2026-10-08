import Phaser from 'phaser'

/* =====================================================================
   TERCEIRO JOGO — TURBO TRILHAS: O DESAFIO DO POUSO PERFEITO
   ---------------------------------------------------------------------
   Uma corrida arcade lateral: acelere, salte nas rampas, faça manobras
   no ar e tente pousar sobre os dois pneus.

   Controles:
     → / D  acelerar       ← / A  frear
     ↑ / W  nariz para cima no ar
     ↓ / S  nariz para baixo no ar
     R      jogar de novo depois do fim

   Procure por ETAPA 0 até ETAPA 8. Cada ETAPA acrescenta uma ideia nova.
   O carro e os tilesets são PNGs locais; rampas e objetos são desenhados
   por código. Não há dependência de imagens hospedadas em sites externos.
   ===================================================================== */

/* =====================================================================
   ETAPA 0 — AJUSTES DO JOGO
   Mude estes valores para experimentar como o jogo se sente.
   ===================================================================== */
const LARGURA_TELA = 1280;
const ALTURA_TELA = 720;
const LARGURA_MUNDO = 5600;
const ALTURA_MUNDO = 900;
const CHAO_Y = 548;
const PROFUNDIDADE_PISTA = 230;
const X_INICIO = 180;
const X_CHEGADA = 5360;

const GRAVIDADE = 1100;
const ACELERACAO = 270;
const FORCA_FREIO = 510;
const ATRITO = 105;
const VELOCIDADE_MAXIMA = 460;
const VELOCIDADE_MINIMA = 0;
const IMPULSO_MANOBRA = 400; // graus por segundo enquanto a tecla estiver apertada

const INTEGRIDADE_INICIAL = 100;
const DANO_POUSO_RUIM = 25;
const DANO_OBSTACULO = 14;
const REPARO = 25;
const ANGULO_POUSO_SEGURO = 25;
const ANGULO_POUSO_PERFEITO = 8;
const VELOCIDADE_POUSO_SEGURA = 720;
const PONTOS_POUSO = 100;
const PONTOS_POUSO_PERFEITO = 100;
const PONTOS_VOLTA = 150;

// Cada trecho representa um pedaço de pista plana. Os espaços entre eles
// são buracos que o carro precisa atravessar com velocidade suficiente.
const TRECHOS_PISTA = [
    { x: 0, largura: 1500 },
    { x: 1730, largura: 1520 },
    { x: 3500, largura: 2100 },
];

// A rampa visual é decorativa; esta pequena zona dá o impulso para o salto.
const RAMPAS = [
    { x: 1220, gatilho: 1300, larguraGatilho: 52, impulso: -700, usada: false },
    { x: 2960, gatilho: 3030, larguraGatilho: 52, impulso: -650, usada: false },
    { x: 4200, gatilho: 4270, larguraGatilho: 52, impulso: -660, usada: false },
];

const COR_TEXTO = '#f8fafc';
const COR_DESTAQUE = '#fde047';

function limitar(valor, minimo, maximo) {
    return Math.max(minimo, Math.min(maximo, valor));
}

// Mantém o ângulo entre -180° e 180°, sem quebrar ao passar por 360°.
function normalizarAngulo(graus) {
    return ((graus + 180) % 360 + 360) % 360 - 180;
}

export class Jogo extends Phaser.Scene {
    constructor() {
        super('Jogo');
    }

    /* =================================================================
       ETAPA 0 — ASSETS: carregar PNGs e desenhar itens com Graphics
       ================================================================= */
    preload() {
        // Sprites e tilesets do projeto. Estes caminhos funcionam tanto no
        // index.html offline quanto em React/Vite (arquivos em public/assets).
        this.load.image('carro-turbo', 'assets/sprites/carro-turbo.png');
        this.load.image('montanhas-longe', 'assets/parallax/montanhas-longe.png');
        this.load.image('pista-solo', 'assets/tiles/pista-solo.png');
        this.desenharTexturas();
    }

    novoDesenho() {
        return this.make.graphics({ x: 0, y: 0, add: false });
    }

    desenharTexturas() {
        if (this.textures.exists('pixel-branco')) return;

        let g = this.novoDesenho();

        // Pixel branco de 1x1: útil para criar plataformas de qualquer tamanho.
        g.fillStyle(0xffffff, 1);
        g.fillRect(0, 0, 1, 1);
        g.generateTexture('pixel-branco', 1, 1);
        g.destroy();

        // O carro principal agora é o PNG assets/sprites/carro-turbo.png.

        // Rampa triangular com faixas de segurança.
        g = this.novoDesenho();
        g.fillStyle(0xf97316, 1);
        g.fillTriangle(0, 64, 160, 64, 160, 0);
        g.fillStyle(0xfde047, 1);
        g.fillTriangle(18, 64, 160, 64, 160, 10);
        g.fillStyle(0x334155, 1);
        g.fillRect(4, 58, 154, 6);
        g.generateTexture('rampa', 160, 64);
        g.destroy();

        // Caixa-obstáculo.
        g = this.novoDesenho();
        g.fillStyle(0x8b5e34, 1);
        g.fillRect(4, 4, 56, 58);
        g.lineStyle(4, 0xf3c27a, 1);
        g.strokeRect(6, 6, 52, 54);
        g.lineStyle(5, 0x5b371e, 1);
        g.lineBetween(12, 12, 52, 54);
        g.lineBetween(52, 12, 12, 54);
        g.generateTexture('caixa', 64, 66);
        g.destroy();

        // Porca dourada de pontuação.
        g = this.novoDesenho();
        g.fillStyle(0xf59e0b, 1);
        g.fillCircle(20, 20, 17);
        g.lineStyle(4, 0xfff1a8, 1);
        g.strokeCircle(20, 20, 13);
        g.fillStyle(0xfff7cc, 1);
        g.fillCircle(20, 20, 4);
        g.generateTexture('porca', 40, 40);
        g.destroy();

        // Caixa de reparo com uma cruz verde.
        g = this.novoDesenho();
        g.fillStyle(0x166534, 1);
        g.fillRect(3, 3, 42, 42);
        g.fillStyle(0x4ade80, 1);
        g.fillRect(8, 8, 32, 32);
        g.fillStyle(0xffffff, 1);
        g.fillRect(20, 12, 8, 24);
        g.fillRect(12, 20, 24, 8);
        g.generateTexture('reparo', 48, 48);
        g.destroy();

        // Placa de chegada.
        g = this.novoDesenho();
        g.fillStyle(0xf8fafc, 1);
        g.fillRect(5, 4, 8, 80);
        g.fillStyle(0x0f172a, 1);
        g.fillRect(13, 4, 48, 38);
        g.fillStyle(0xf8fafc, 1);
        g.fillRect(13, 4, 24, 19);
        g.fillRect(37, 23, 24, 19);
        g.generateTexture('bandeira-chegada', 68, 90);
        g.destroy();
    }

    create() {
        this.iniciou = false;
        this.terminou = false;
        this.venceu = false;
        this.noAr = false;
        this.pousoPendente = false;
        this.rotacaoNoAr = 0;
        this.ultimaVelocidadeDescendo = 0;
        this.pontosExtras = 0;
        this.combo = 0;
        this.integridade = INTEGRIDADE_INICIAL;
        this.proximaBatida = 0;
        this.proximoDanoObstaculo = 0;
        for (const rampa of RAMPAS) rampa.usada = false;

        this.physics.world.setBounds(0, 0, LARGURA_MUNDO, ALTURA_MUNDO);

        this.criarCenario();
        this.criarPista();
        this.criarRampas();
        this.criarCarro();
        this.criarObstaculosEItens();
        this.criarHUD();
        this.prepararControles();
        this.criarColisoes();

        this.cameras.main.setBounds(0, 0, LARGURA_MUNDO, ALTURA_TELA);
        this.cameras.main.startFollow(this.carro, true, 0.10, 0.06);
        this.cameras.main.setDeadzone(280, 110);
    }

    /* =================================================================
       ETAPA 1 — MUNDO, CÂMERA E CENÁRIO COM PARALLAX
       ================================================================= */
    criarCenario() {
        this.cameras.main.setBackgroundColor('#82d7f5');

        // TileSprite: a camada distante desliza a 18% da velocidade da câmera.
        // O PNG contém duas metades espelhadas para repetir sem emenda aparente.
        this.add.tileSprite(0, 100, LARGURA_MUNDO, 448, 'montanhas-longe')
            .setOrigin(0, 0).setDepth(-10).setScrollFactor(0.18, 0.35);

        // Nuvens e sol em camadas leves.
        this.add.circle(1070, 120, 52, 0xfff0a6, 0.95).setScrollFactor(0).setDepth(-8);
        for (let x = 160; x < LARGURA_MUNDO; x += 690) {
            const y = 105 + (Math.floor(x / 690) % 3) * 42;
            this.add.ellipse(x, y, 115, 34, 0xffffff, 0.72).setScrollFactor(0.08).setDepth(-7);
            this.add.ellipse(x - 27, y + 3, 42, 32, 0xffffff, 0.72).setScrollFactor(0.08).setDepth(-7);
            this.add.ellipse(x + 27, y - 4, 48, 39, 0xffffff, 0.72).setScrollFactor(0.08).setDepth(-7);
        }

        // Pequenos morros próximos da pista.
        const morros = this.add.graphics().setDepth(-3).setScrollFactor(0.42, 0.8);
        morros.fillStyle(0x7fca87, 1);
        for (let x = -100; x < LARGURA_MUNDO + 500; x += 560) {
            morros.fillEllipse(x + 230, 552, 520, 120);
        }
    }

    /* =================================================================
       ETAPA 2 — PISTA: trechos sólidos, buracos e chegada
       ================================================================= */
    criarPista() {
        this.pista = this.physics.add.staticGroup();
        this.segmentos = [];

        for (const trecho of TRECHOS_PISTA) {
            const segmento = { x: trecho.x, direita: trecho.x + trecho.largura, y: CHAO_Y };
            this.segmentos.push(segmento);

            // Bloco invisível com corpo estático para o carro poder pousar.
            const bloco = this.pista.create(
                trecho.x + trecho.largura / 2,
                CHAO_Y + PROFUNDIDADE_PISTA / 2,
                'pixel-branco'
            );
            bloco.setDisplaySize(trecho.largura, PROFUNDIDADE_PISTA);
            bloco.setAlpha(0);
            bloco.refreshBody();

            // A arte repete o tileset na horizontal; o corpo de colisão continua separado.
            this.add.tileSprite(trecho.x, CHAO_Y, trecho.largura, PROFUNDIDADE_PISTA, 'pista-solo')
                .setOrigin(0, 0).setDepth(2);
        }

        // Avisos para ajudar a pessoa a perceber os buracos antes de saltar.
        for (const x of [1540, 3280]) {
            this.add.text(x, CHAO_Y - 72, 'CUIDADO: BURACO!', {
                fontFamily: 'Trebuchet MS, Arial', fontSize: '17px',
                color: '#7c2d12', fontStyle: 'bold', backgroundColor: '#ffedd5',
                padding: { x: 8, y: 5 },
            }).setOrigin(0.5).setDepth(5);
        }

        this.add.image(X_CHEGADA, CHAO_Y, 'bandeira-chegada')
            .setOrigin(0.5, 1).setDepth(5);
        this.add.text(X_CHEGADA, CHAO_Y - 105, 'CHEGADA', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '20px',
            color: '#ffffff', fontStyle: 'bold', stroke: '#0f172a', strokeThickness: 5,
        }).setOrigin(0.5).setDepth(5);
    }

    /* =================================================================
       ETAPA 3 — RAMPAS: zonas que lançam o carro
       ================================================================= */
    criarRampas() {
        for (const rampa of RAMPAS) {
            this.add.image(rampa.x, CHAO_Y, 'rampa')
                .setOrigin(0, 1).setDepth(4);
            this.add.text(rampa.x + 77, CHAO_Y - 73, 'SALTO', {
                fontFamily: 'Trebuchet MS, Arial', fontSize: '15px',
                color: '#7c2d12', fontStyle: 'bold', stroke: '#fff7ed', strokeThickness: 3,
            }).setOrigin(0.5).setDepth(5);
        }
    }

    /* =================================================================
       ETAPA 2/3 — CARRO, TECLADO E CORPOS DE FÍSICA
       ================================================================= */
    criarCarro() {
        this.carro = this.physics.add.image(X_INICIO, CHAO_Y - 25, 'carro-turbo');
        this.carro.setDepth(10);
        this.carro.setOrigin(0.5, 0.5);
        this.carro.setAngle(0);
        this.carro.body.setSize(128, 50, true);
        this.carro.body.setMaxVelocity(VELOCIDADE_MAXIMA, 1250);
        this.carro.body.setCollideWorldBounds(false);
        this.carro.body.setBounce(0);
        this.carro.body.setAllowGravity(true);
        this.carro.body.setVelocityX(150);

        // Os pontos invisíveis acompanham as rodas. Em modo DEBUG, ficam verdes.
        this.sensorFrente = this.add.circle(0, 0, 7, 0x22c55e, 0.8).setDepth(20);
        this.sensorTras = this.add.circle(0, 0, 7, 0x22c55e, 0.8).setDepth(20);
        const mostrarSensores = new URLSearchParams(window.location.search).has('debug');
        this.sensorFrente.setVisible(mostrarSensores);
        this.sensorTras.setVisible(mostrarSensores);
    }

    prepararControles() {
        this.teclas = this.input.keyboard.addKeys({
            direita: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            esquerda: Phaser.Input.Keyboard.KeyCodes.LEFT,
            cima: Phaser.Input.Keyboard.KeyCodes.UP,
            baixo: Phaser.Input.Keyboard.KeyCodes.DOWN,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            s: Phaser.Input.Keyboard.KeyCodes.S,
        });

        this.input.keyboard.on('keydown-R', () => {
            if (this.terminou) this.scene.restart();
        });
    }

    /* =================================================================
       ETAPA 6 — OBSTÁCULOS, PORCAS E REPAROS
       ================================================================= */
    criarObstaculosEItens() {
        this.obstaculos = this.physics.add.staticGroup();
        for (const x of [850, 2390, 4000, 4890]) {
            const caixa = this.obstaculos.create(x, CHAO_Y - 32, 'caixa');
            caixa.refreshBody();
        }

        this.itens = this.physics.add.staticGroup();
        const porcas = [
            { x: 1535, y: 375 },
            { x: 3310, y: 365 },
            { x: 4380, y: 455 },
            { x: 5100, y: 430 },
        ];
        for (const ponto of porcas) {
            const item = this.itens.create(ponto.x, ponto.y, 'porca');
            item.setData('tipo', 'porca');
            item.refreshBody();
        }

        const reparos = [
            { x: 2170, y: CHAO_Y - 36 },
            { x: 4580, y: CHAO_Y - 36 },
        ];
        for (const ponto of reparos) {
            const item = this.itens.create(ponto.x, ponto.y, 'reparo');
            item.setData('tipo', 'reparo');
            item.refreshBody();
        }
    }

    criarColisoes() {
        this.physics.add.collider(this.carro, this.pista, this.colidiuComPista, null, this);
        // As caixas são quebráveis: overlap dá feedback sem bloquear a corrida.
        this.physics.add.overlap(this.carro, this.obstaculos, this.colidiuComObstaculo, null, this);
        this.physics.add.overlap(this.carro, this.itens, this.coletarItem, null, this);
    }

    /* =================================================================
       ETAPA 4 — CONTROLES, ACELERAÇÃO E VOO
       ================================================================= */
    update(time, delta) {
        if (this.terminou || !this.carro || !this.carro.body) return;
        const dt = Math.min(delta / 1000, 0.04); // evita saltos grandes se a aba travar

        this.atualizarMotor(dt);
        this.verificarRampa();
        this.atualizarInclinacao(dt);
        this.atualizarSensores();
        this.detectarQuedaDaPista();

        if (this.noAr) {
            const vy = this.carro.body.velocity.y;
            if (vy > 0) this.ultimaVelocidadeDescendo = Math.max(this.ultimaVelocidadeDescendo, vy);
            const rodas = this.verificarRodas();
            // O callback da colisão agenda a checagem para o próximo frame,
            // quando o corpo e os sensores já estão na posição final do pouso.
            if (this.pousoPendente || (vy >= 0 && rodas.frente && rodas.tras)) {
                this.pousoPendente = false;
                this.resolverPouso();
            }
        }

        if (this.carro.y > 795) {
            this.finalizarJogo(false, 'O carro caiu no buraco. Tente outra vez!');
            return;
        }

        if (this.carro.x >= X_CHEGADA) {
            this.finalizarJogo(true, 'Você chegou com ' + this.integridade + '% de integridade.');
            return;
        }

        this.atualizarHUD();
    }

    atualizarMotor(dt) {
        const apertouAcelerar = this.teclas.direita.isDown || this.teclas.d.isDown;
        const apertouFreio = this.teclas.esquerda.isDown || this.teclas.a.isDown;
        let velocidade = this.carro.body.velocity.x;

        if (apertouAcelerar) velocidade += ACELERACAO * dt;
        else velocidade -= ATRITO * dt;
        if (apertouFreio) velocidade -= FORCA_FREIO * dt;

        velocidade = limitar(velocidade, VELOCIDADE_MINIMA, VELOCIDADE_MAXIMA);
        this.carro.body.setVelocityX(velocidade);
    }

    verificarRampa() {
        if (this.noAr || this.carro.body.velocity.y < -20) return;
        const rodas = this.verificarRodas();
        const estaApoiando = this.carro.body.blocked.down || this.carro.body.touching.down || rodas.frente || rodas.tras;
        if (!estaApoiando) return;

        for (const rampa of RAMPAS) {
            if (rampa.usada) continue;
            if (this.carro.x >= rampa.gatilho && this.carro.x <= rampa.gatilho + rampa.larguraGatilho) {
                rampa.usada = true;
                this.lancarDaRampa(rampa.impulso);
                break;
            }
        }
    }

    lancarDaRampa(impulso) {
        this.noAr = true;
        this.pousoPendente = false;
        this.rotacaoNoAr = 0;
        this.ultimaVelocidadeDescendo = 0;
        this.carro.body.setVelocityY(impulso);
        this.mostrarTextoMundial(this.carro.x, this.carro.y - 62, 'SALTO!', '#fde047');
        this.cameras.main.shake(110, 0.002);
    }

    iniciarQuedaNatural() {
        this.noAr = true;
        this.pousoPendente = false;
        this.rotacaoNoAr = 0;
        this.ultimaVelocidadeDescendo = Math.max(0, this.carro.body.velocity.y);
    }

    detectarQuedaDaPista() {
        if (this.noAr) return;
        const rodas = this.verificarRodas();
        const semChao = !this.carro.body.blocked.down && !this.carro.body.touching.down && !rodas.frente && !rodas.tras;
        if (semChao && this.carro.body.velocity.y > 45 && this.carro.x > X_INICIO + 20) {
            this.iniciarQuedaNatural();
        }
    }

    atualizarInclinacao(dt) {
        if (!this.noAr) {
            if (Math.abs(this.carro.angle) > 0.1) this.carro.setAngle(0);
            return;
        }

        const inclinarParaCima = this.teclas.cima.isDown || this.teclas.w.isDown;
        const inclinarParaBaixo = this.teclas.baixo.isDown || this.teclas.s.isDown;
        let direcao = 0;
        if (inclinarParaCima && !inclinarParaBaixo) direcao = -1;
        if (inclinarParaBaixo && !inclinarParaCima) direcao = 1;

        const deltaAngulo = direcao * IMPULSO_MANOBRA * dt;
        this.rotacaoNoAr += deltaAngulo;
        this.carro.setAngle(normalizarAngulo(this.carro.angle + deltaAngulo));
    }

    /* =================================================================
       ETAPA 5 — SENSORES DAS RODAS E QUALIDADE DO POUSO
       Arcade Physics não gira a caixa de colisão junto com o desenho.
       Por isso, calculamos os pontos das duas rodas usando o ângulo visual.
       ================================================================= */
    posicaoSensor(localX, localY) {
        const radianos = Phaser.Math.DegToRad(this.carro.angle);
        const cos = Math.cos(radianos);
        const sin = Math.sin(radianos);
        // body.center é a posição atualizada pelo motor de física. No frame
        // exato da colisão, o desenho pode ainda estar um instante atrasado.
        const centroX = this.carro.body.center.x;
        const centroY = this.carro.body.center.y;
        return {
            x: centroX + localX * cos - localY * sin,
            y: centroY + localX * sin + localY * cos,
        };
    }

    atualizarSensores() {
        const frente = this.posicaoSensor(43, 16);
        const tras = this.posicaoSensor(-43, 16);
        this.sensorFrente.setPosition(frente.x, frente.y);
        this.sensorTras.setPosition(tras.x, tras.y);
    }

    rodaTocandoChao(ponto) {
        const raioRoda = 10;
        const parteDeUmaPista = this.segmentos.some((trecho) => {
            const xEstaNoTrecho = ponto.x >= trecho.x - 4 && ponto.x <= trecho.direita + 4;
            const diferencaVertical = Math.abs((ponto.y + raioRoda) - trecho.y);
            return xEstaNoTrecho && diferencaVertical <= 18;
        });
        return parteDeUmaPista;
    }

    verificarRodas() {
        const frente = this.posicaoSensor(43, 16);
        const tras = this.posicaoSensor(-43, 16);
        return {
            frente: this.rodaTocandoChao(frente),
            tras: this.rodaTocandoChao(tras),
        };
    }

    colidiuComPista(carro, bloco) {
        if (!this.noAr) return;
        if (carro.body.blocked.down || carro.body.touching.down) this.pousoPendente = true;
    }

    resolverPouso() {
        if (!this.noAr || this.terminou) return; // um resultado por salto

        const rodas = this.verificarRodas();
        const ambosPneus = rodas.frente && rodas.tras;
        const angulo = Math.abs(normalizarAngulo(this.carro.angle));
        const velocidadeDoImpacto = Math.max(
            this.ultimaVelocidadeDescendo,
            Math.max(0, this.carro.body.velocity.y)
        );
        const anguloBom = angulo <= ANGULO_POUSO_SEGURO;
        const impactoSuave = velocidadeDoImpacto <= VELOCIDADE_POUSO_SEGURA;
        const pousoSeguro = ambosPneus && anguloBom && impactoSuave;

        if (pousoSeguro) {
            this.combo = Math.min(this.combo + 1, 6);
            const multiplicador = Math.min(3, 1 + Math.floor((this.combo - 1) / 2));
            const voltas = Math.floor(Math.abs(this.rotacaoNoAr) / 360);
            const perfeito = angulo <= ANGULO_POUSO_PERFEITO && velocidadeDoImpacto <= VELOCIDADE_POUSO_SEGURA * 0.72;
            let pontos = PONTOS_POUSO + voltas * PONTOS_VOLTA;
            if (perfeito) pontos += PONTOS_POUSO_PERFEITO;
            pontos *= multiplicador;
            this.pontosExtras += pontos;

            const mensagem = perfeito ? 'POUSO PERFEITO! +' + pontos : 'POUSO SEGURO! +' + pontos;
            this.mostrarTextoMundial(this.carro.x, this.carro.y - 80, mensagem, perfeito ? '#fde047' : '#86efac');
            this.cameras.main.flash(100, 255, 245, 170, false);
        } else {
            this.combo = 0;
            let dano = DANO_POUSO_RUIM;
            let motivo = 'Pouso torto!';
            if (!ambosPneus) motivo = 'Pouse nos dois pneus!';
            else if (!impactoSuave) motivo = 'Impacto forte!';
            else if (!anguloBom) motivo = 'Carro desalinhado!';
            this.receberDano(dano, motivo);
        }

        this.noAr = false;
        this.pousoPendente = false;
        this.rotacaoNoAr = 0;
        this.ultimaVelocidadeDescendo = 0;
        this.carro.setAngle(0);
        this.carro.body.setVelocityY(0);
        this.atualizarSensores();
        this.atualizarHUD();
    }

    /* =================================================================
       ETAPA 6 — BATIDAS, DANO, COLETAS E REPARO
       ================================================================= */
    colidiuComObstaculo(carro, obstaculo) {
        if (!obstaculo || !obstaculo.active || this.terminou || this.noAr) return;
        // A caixa some no primeiro impacto, então nunca prende o carro.
        obstaculo.destroy();
        this.mostrarTextoMundial(obstaculo.x, obstaculo.y - 38, 'CAIXA QUEBRADA!', '#fde68a');
        if (this.time.now < this.proximoDanoObstaculo) return;
        this.proximoDanoObstaculo = this.time.now + 750;
        this.carro.body.setVelocityX(Math.max(70, this.carro.body.velocity.x * 0.52));
        this.receberDano(DANO_OBSTACULO, 'Bateu na caixa!');
    }

    receberDano(quantidade, motivo) {
        if (this.terminou) return;
        this.integridade = Math.max(0, this.integridade - quantidade);
        this.carro.setTint(0xff7777);
        this.time.delayedCall(220, () => {
            if (this.carro && this.carro.active) this.carro.clearTint();
        });
        this.cameras.main.shake(170, 0.006);
        this.mostrarTextoMundial(this.carro.x, this.carro.y - 88, motivo + '  -' + quantidade, '#fca5a5');
        if (this.integridade <= 0) {
            this.finalizarJogo(false, 'O carro ficou sem integridade. Faça ajustes e tente de novo!');
        }
    }

    coletarItem(carro, item) {
        if (!item.active || !item.body || !item.body.enable) return;
        const tipo = item.getData('tipo');
        if (tipo === 'reparo') {
            const anterior = this.integridade;
            this.integridade = Math.min(INTEGRIDADE_INICIAL, this.integridade + REPARO);
            const reparou = this.integridade - anterior;
            this.mostrarTextoMundial(item.x, item.y - 25, '+' + reparou + '% REPARO', '#86efac');
        } else {
            this.pontosExtras += 50;
            this.mostrarTextoMundial(item.x, item.y - 25, '+50', '#fde047');
        }
        item.body.enable = false;
        item.destroy();
        this.atualizarHUD();
    }

    /* =================================================================
       ETAPA 7 — HUD: pontos, condição, combo e distância
       ================================================================= */
    criarHUD() {
        const painel = this.add.rectangle(640, 64, 1230, 100, 0x112033, 0.92)
            .setScrollFactor(0).setDepth(100);
        painel.setStrokeStyle(2, 0x94a3b8, 0.4);

        this.add.text(32, 22, 'TURBO TRILHAS', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '24px',
            color: '#5eead4', fontStyle: 'bold',
        }).setScrollFactor(0).setDepth(101);
        this.add.text(34, 52, 'O DESAFIO DO POUSO PERFEITO', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '12px',
            color: '#cbd5e1',
        }).setScrollFactor(0).setDepth(101);

        this.textoPontos = this.add.text(335, 29, 'PONTOS 0000', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '20px', color: COR_TEXTO, fontStyle: 'bold',
        }).setScrollFactor(0).setDepth(101);

        this.textoCondicao = this.add.text(545, 25, 'CARRO 100%', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '17px', color: '#bbf7d0', fontStyle: 'bold',
        }).setScrollFactor(0).setDepth(101);
        this.add.rectangle(645, 59, 198, 13, 0x334155).setScrollFactor(0).setDepth(101);
        this.barraCondicao = this.add.rectangle(547, 59, 194, 9, 0x4ade80)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(102);

        this.textoCombo = this.add.text(790, 28, 'COMBO x1', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '18px', color: COR_DESTAQUE, fontStyle: 'bold',
        }).setScrollFactor(0).setDepth(101);
        this.textoDistancia = this.add.text(1000, 29, 'DISTÂNCIA 0%', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '18px', color: COR_TEXTO,
        }).setScrollFactor(0).setDepth(101);

        this.add.rectangle(640, 120, 1210, 8, 0x1e293b).setScrollFactor(0).setDepth(100);
        this.barraProgresso = this.add.rectangle(38, 120, 5, 4, 0x2dd4bf)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);

        this.add.rectangle(640, 682, 710, 42, 0x112033, 0.82).setScrollFactor(0).setDepth(100);
        this.add.text(640, 682, '→ / D acelera   •   ← / A freia   •   ↑ / W e ↓ / S fazem manobras no ar', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '16px', color: '#f8fafc',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // Tela de vitória/fim de jogo, escondida até o momento certo.
        const fundo = this.add.rectangle(640, 360, 660, 300, 0x0f172a, 0.96);
        fundo.setStrokeStyle(4, 0x5eead4, 1);
        this.tituloFim = this.add.text(640, 280, '', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '40px', color: '#f8fafc',
            fontStyle: 'bold', align: 'center',
        }).setOrigin(0.5);
        this.textoFim = this.add.text(640, 350, '', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '22px', color: '#cbd5e1',
            align: 'center', wordWrap: { width: 560 },
        }).setOrigin(0.5);
        this.textoReiniciar = this.add.text(640, 435, 'Aperte R para correr de novo', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '20px', color: '#fde047',
            fontStyle: 'bold',
        }).setOrigin(0.5);
        this.telaFim = this.add.container(0, 0, [fundo, this.tituloFim, this.textoFim, this.textoReiniciar])
            .setScrollFactor(0).setDepth(200).setVisible(false);

        this.atualizarHUD();
    }

    atualizarHUD() {
        if (!this.textoPontos || !this.carro) return;
        const distancia = Math.max(0, this.carro.x - X_INICIO);
        const progresso = limitar(distancia / (X_CHEGADA - X_INICIO), 0, 1);
        const pontosDistancia = Math.floor(distancia / 20);
        const pontuacao = this.pontosExtras + pontosDistancia;
        const multiplicador = this.combo <= 0 ? 1 : Math.min(3, 1 + Math.floor((this.combo - 1) / 2));

        this.textoPontos.setText('PONTOS ' + String(pontuacao).padStart(4, '0'));
        this.textoCondicao.setText('CARRO ' + this.integridade + '%');
        this.textoCondicao.setColor(this.integridade > 50 ? '#bbf7d0' : this.integridade > 25 ? '#fde68a' : '#fca5a5');
        this.barraCondicao.setDisplaySize(194 * (this.integridade / INTEGRIDADE_INICIAL), 9);
        this.barraCondicao.setFillStyle(this.integridade > 50 ? 0x4ade80 : this.integridade > 25 ? 0xfacc15 : 0xef4444);
        this.textoCombo.setText('COMBO x' + multiplicador);
        this.textoDistancia.setText('DISTÂNCIA ' + Math.round(progresso * 100) + '%');
        this.barraProgresso.setDisplaySize(Math.max(5, 1204 * progresso), 4);
    }

    /* =================================================================
       ETAPA 8 — FEEDBACK, VITÓRIA, GAME OVER E REINÍCIO
       ================================================================= */
    mostrarTextoMundial(x, y, mensagem, cor) {
        const texto = this.add.text(x, y, mensagem, {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '20px',
            color: cor, fontStyle: 'bold', stroke: '#0f172a', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({
            targets: texto, y: y - 48, alpha: 0, duration: 900,
            ease: 'Cubic.easeOut', onComplete: () => texto.destroy(),
        });
    }

    finalizarJogo(venceu, mensagem) {
        if (this.terminou) return;
        this.terminou = true;
        this.venceu = venceu;
        this.carro.body.setVelocity(0, 0);
        this.carro.body.setAcceleration(0, 0);
        this.carro.body.setAllowGravity(false);
        this.tituloFim.setText(venceu ? 'CHEGADA!' : 'FIM DE CORRIDA');
        this.tituloFim.setColor(venceu ? '#5eead4' : '#fca5a5');
        this.textoFim.setText(mensagem + '\nPontuação final: ' + (this.pontosExtras + Math.floor(Math.max(0, this.carro.x - X_INICIO) / 20)));
        this.telaFim.setVisible(true);
        this.atualizarHUD();
    }
}

// A versão React importa a cena por módulo; a versão sem instalação usa
// a variável global. Esta linha não atrapalha a abertura direta no navegador.
if (typeof window !== 'undefined') window.Jogo = Jogo;
