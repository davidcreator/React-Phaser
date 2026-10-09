/* =====================================================================
   QUARTO JOGO — GUARDIÕES DO REATOR: TOWER DEFENSE DE AÇÃO 2D
   ---------------------------------------------------------------------
   Inspirado no estilo Mindustry e Plants vs. Zombies:
   Construa torres ao longo do caminho, evolua chassis e armas,
   e controle a mira para disparar nos invasores!

   Controles:
     • Botão Esquerdo do Mouse: Construir torres, abrir menu de upgrade,
                                ou mirar e atirar manualmente quando uma torre estiver selecionada.
     • Botão Direito ou ESC: Desmarcar torre selecionada.
     • Teclas 1, 2, 3: Atalho rápido para selecionar o tipo de torre a construir.
     • Espaço: Chamar a próxima onda antecipadamente (Bônus de energia!).
     • R: Recomeçar a partida após Vitória ou Derrota.

   Procure por ETAPA 0 até ETAPA 8 para entender a trilha pedagógica.
   Assets em assets/tiles/ e assets/sprites/!
   ===================================================================== */

/* =====================================================================
   ETAPA 0 — CONSTANTES E BALANCEAMENTO DO JOGO
   Mude estes valores para balancear a dificuldade do jogo!
   ===================================================================== */
const LARGURA_TELA = 1280;
const ALTURA_TELA = 720;

// Economia e Vida Inicial
const ENERGIA_INICIAL = 220;
const VIDA_BASE_MAXIMA = 100;
const TOTAL_ONDAS = 5;

// Pontos de Construção fixos (Slots estilo Plants vs Zombies)
const SLOTS_CONSTRUCAO = [
    { id: 1, x: 260, y: 160 },
    { id: 2, x: 420, y: 160 },
    { id: 3, x: 740, y: 160 },
    { id: 4, x: 920, y: 160 },

    { id: 5, x: 260, y: 380 },
    { id: 6, x: 500, y: 380 },
    { id: 7, x: 740, y: 380 },
    { id: 8, x: 1040, y: 380 },

    { id: 9, x: 140, y: 580 },
    { id: 10, x: 380, y: 580 },
    { id: 11, x: 620, y: 580 },
    { id: 12, x: 860, y: 580 }
];

// O caminho que os inimigos percorrem até o reator final
const PONTOS_CAMINHO = [
    { x: -50, y: 270 },
    { x: 340, y: 270 },
    { x: 340, y: 480 },
    { x: 800, y: 480 },
    { x: 800, y: 270 },
    { x: 1180, y: 270 },
    { x: 1180, y: 490 },
    { x: 1330, y: 490 }
];

// Configuração das 3 Torres disponíveis
const TIPOS_TORRES = {
    SENTINELA: {
        tipo: 'SENTINELA',
        nome: 'Sentinela',
        custo: 70,
        alcance: 185,
        cadencia: 300,
        dano: 16,
        velocidadeTiro: 580,
        linhaSheet: 0,
        corBase: 0x0284c7,
        descricao: 'Tiros rápidos de plasma leve'
    },
    CANHAO: {
        tipo: 'CANHAO',
        nome: 'Canhão',
        custo: 110,
        alcance: 230,
        cadencia: 920,
        dano: 58,
        velocidadeTiro: 430,
        raioExplosao: 65,
        linhaSheet: 1,
        corBase: 0xd97706,
        descricao: 'Projéteis pesados com dano em área'
    },
    CRIOGENICA: {
        tipo: 'CRIOGENICA',
        nome: 'Criogênica',
        custo: 90,
        alcance: 160,
        cadencia: 580,
        dano: 12,
        velocidadeTiro: 500,
        desaceleracao: 0.5,
        duracaoLentidao: 1800,
        linhaSheet: 2,
        corBase: 0x059669,
        descricao: 'Lança feixes gélidos que desaceleram'
    }
};

// Configuração dos 3 Inimigos
const TIPOS_INIMIGOS = {
    SCOUT: {
        nome: 'Drone Veloz',
        vidaMax: 50,
        velocidade: 140,
        recompensa: 18,
        danoBase: 10,
        raio: 15,
        animChave: 'scout-voando'
    },
    SWARM: {
        nome: 'Robô Enxame',
        vidaMax: 30,
        velocidade: 110,
        recompensa: 12,
        danoBase: 8,
        raio: 13,
        animChave: 'swarm-andando'
    },
    BRUTE: {
        nome: 'Tanque Bruto',
        vidaMax: 190,
        velocidade: 65,
        recompensa: 35,
        danoBase: 25,
        raio: 22,
        animChave: 'brute-rolando'
    }
};

class Jogo extends Phaser.Scene {
    constructor() {
        super('Jogo');
    }

    /* =================================================================
       ETAPA 0 — CARREGAMENTO DE TILESET, SPRITESHEETS E TEXTURAS
       ================================================================= */
    preload() {
        // Carrega o Tileset do Cenário (tiles de 64x64)
        this.load.spritesheet('cenario-tileset', 'assets/tiles/cenario-tileset.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        // Carrega a Spritesheet das Torres (frames 64x64)
        this.load.spritesheet('torres-sheet', 'assets/sprites/torres-sheet.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        // Carrega a Spritesheet dos Inimigos (frames 48x48)
        this.load.spritesheet('inimigos-sheet', 'assets/sprites/inimigos-sheet.png', {
            frameWidth: 48,
            frameHeight: 48
        });

        this.desenharTexturasProcedurais();
    }

    desenharTexturasProcedurais() {
        if (this.textures.exists('tiro-sentinela')) return;

        let g = this.make.graphics({ x: 0, y: 0, add: false });

        // Projétil Sentinela (laser ciano)
        g.fillStyle(0x38bdf8, 1);
        g.fillCircle(6, 6, 5);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(6, 6, 2);
        g.generateTexture('tiro-sentinela', 12, 12);
        g.clear();

        // Projétil Canhão (ogiva dourada pesada)
        g.fillStyle(0xf59e0b, 1);
        g.fillCircle(9, 9, 8);
        g.fillStyle(0xfef08a, 1);
        g.fillCircle(9, 9, 4);
        g.generateTexture('tiro-canhao', 18, 18);
        g.clear();

        // Projétil Criogênico (cristal de gelo)
        g.fillStyle(0x34d399, 1);
        g.fillCircle(7, 7, 6);
        g.fillStyle(0xe0f2fe, 1);
        g.fillCircle(7, 7, 3);
        g.generateTexture('tiro-crio', 14, 14);
        g.destroy();
    }

    /* =================================================================
       ETAPA 1 — CRIAÇÃO DO MUNDO, TILESET DO CENÁRIO E ANIMAÇÕES
       ================================================================= */
    create() {
        this.energia = ENERGIA_INICIAL;
        this.vidaBase = VIDA_BASE_MAXIMA;
        this.ondaAtual = 0;
        this.pontos = 0;
        this.emOnda = false;
        this.torreSelecionadaParaConstruir = 'SENTINELA';
        this.torreFocada = null;

        this.torres = [];
        this.inimigosRestantesOnda = 0;

        // Criar animações dos inimigos usando a Spritesheet
        this.criarAnimacoesInimigos();

        // Construindo o cenário com o tileset
        this.criarCenarioTileset();
        this.criarCaminho();
        this.criarReator();

        // Grupos de física Arcade
        this.grupoInimigos = this.physics.add.group();
        this.grupoProjeteis = this.physics.add.group();

        this.criarSlotsConstrucao();
        this.criarHUD();
        this.prepararControles();

        // Colisão entre projéteis e inimigos
        this.physics.add.overlap(
            this.grupoProjeteis,
            this.grupoInimigos,
            this.tratarColisaoTiroInimigo,
            null,
            this
        );

        this.mostrarMensagemTutorial('Construa torres nas bases e aperte [ESPAÇO] para iniciar a onda!');
    }

    criarAnimacoesInimigos() {
        if (!this.anims.exists('scout-voando')) {
            // Linha 0 (frames 0 a 3) = Scout
            this.anims.create({
                key: 'scout-voando',
                frames: this.anims.generateFrameNumbers('inimigos-sheet', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });

            // Linha 1 (frames 4 a 7) = Swarm
            this.anims.create({
                key: 'swarm-andando',
                frames: this.anims.generateFrameNumbers('inimigos-sheet', { start: 4, end: 7 }),
                frameRate: 8,
                repeat: -1
            });

            // Linha 2 (frames 8 a 11) = Brute Tank
            this.anims.create({
                key: 'brute-rolando',
                frames: this.anims.generateFrameNumbers('inimigos-sheet', { start: 8, end: 11 }),
                frameRate: 6,
                repeat: -1
            });
        }
    }

    criarCenarioTileset() {
        // Preenche o fundo com os tiles do tileset (64x64)
        const cols = Math.ceil(LARGURA_TELA / 64);
        const rows = Math.ceil(ALTURA_TELA / 64);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let x = c * 64 + 32;
                let y = r * 64 + 32;
                // Variação orgânica entre piso padrão (0) e metal reforçado (1) ou grade (4)
                let frameIndex = 0;
                if ((c + r) % 5 === 0) frameIndex = 1;
                if ((c * 3 + r * 7) % 13 === 0) frameIndex = 4;

                this.add.image(x, y, 'cenario-tileset', frameIndex).setDepth(0);
            }
        }
    }

    criarCaminho() {
        // Objeto Curva/Caminho do Phaser 3
        this.caminho = new Phaser.Curves.Path(PONTOS_CAMINHO[0].x, PONTOS_CAMINHO[0].y);
        for (let i = 1; i < PONTOS_CAMINHO.length; i++) {
            this.caminho.lineTo(PONTOS_CAMINHO[i].x, PONTOS_CAMINHO[i].y);
        }

        // Desenho visual da estrada de concreto tecnológico estilizado
        let trilhaG = this.add.graphics().setDepth(1);
        trilhaG.lineStyle(56, 0x1e293b, 1);
        this.caminho.draw(trilhaG);

        trilhaG.lineStyle(44, 0x334155, 1);
        this.caminho.draw(trilhaG);

        trilhaG.lineStyle(4, 0x0ea5e9, 0.7); // Linha central de energia ciano
        this.caminho.draw(trilhaG);
        trilhaG.lineStyle(2, 0xe0f2fe, 0.9);
        this.caminho.draw(trilhaG);
    }

    criarReator() {
        const pFinal = PONTOS_CAMINHO[PONTOS_CAMINHO.length - 2];

        // Tile 7 (Alerta amarelo/preto de perigo) ao redor do Reator
        this.add.image(pFinal.x, pFinal.y, 'cenario-tileset', 7).setDepth(2).setScale(1.2);

        // Tile 5 (Núcleo do Reator com energia ciano)
        this.reatorSprite = this.add.image(pFinal.x, pFinal.y, 'cenario-tileset', 5).setDepth(3).setScale(1.1);

        this.tweens.add({
            targets: this.reatorSprite,
            scale: { from: 1.05, to: 1.25 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.add.text(pFinal.x, pFinal.y + 52, 'NÚCLEO', {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#38bdf8',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(4);
    }

    /* =================================================================
       ETAPA 2 — SLOTS E CONSTRUÇÃO DE TORRES COM SPRITESHEET
       ================================================================= */
    criarSlotsConstrucao() {
        this.slots = [];
        SLOTS_CONSTRUCAO.forEach(pos => {
            // Usa o Tile 6 do tileset (Plataforma hexagonal tecnológica de montagem)
            let slot = this.add.image(pos.x, pos.y, 'cenario-tileset', 6).setDepth(2).setInteractive({ cursor: 'pointer' });
            slot.posicao = pos;
            slot.torre = null;

            slot.on('pointerdown', () => {
                this.clicarNoSlot(slot);
            });

            slot.on('pointerover', () => {
                slot.setTint(0x38bdf8);
            });
            slot.on('pointerout', () => {
                slot.clearTint();
            });

            this.slots.push(slot);
        });
    }

    clicarNoSlot(slot) {
        if (!slot.torre) {
            const dados = TIPOS_TORRES[this.torreSelecionadaParaConstruir];
            if (this.energia >= dados.custo) {
                this.energia -= dados.custo;
                this.construirTorre(slot, dados);
                this.atualizarHUD();
            } else {
                this.mostrarAlertaRapido('Energia insuficiente! (' + dados.custo + '⚡ necessários)');
            }
        } else {
            this.selecionarTorre(slot.torre);
        }
    }

    construirTorre(slot, modelo) {
        let torre = {
            slot: slot,
            x: slot.x,
            y: slot.y,
            tipo: modelo.tipo,
            nome: modelo.nome,
            linhaSheet: modelo.linhaSheet, // 0 = Sentinela, 1 = Canhão, 2 = Criogênica
            nivel: 1,
            armaNivel: 1,
            alcance: modelo.alcance,
            cadencia: modelo.cadencia,
            dano: modelo.dano,
            velocidadeTiro: modelo.velocidadeTiro,
            raioExplosao: modelo.raioExplosao || 0,
            desaceleracao: modelo.desaceleracao || 0,
            duracaoLentidao: modelo.duracaoLentidao || 0,
            corBase: modelo.corBase,
            proximoDisparo: 0,
            emControleManual: false,
            alvoAtual: null
        };

        // Frame da Base Nível 1: coluna 0 da linha da torre
        let frameBase = torre.linhaSheet * 4;
        torre.baseSprite = this.add.sprite(torre.x, torre.y, 'torres-sheet', frameBase).setDepth(3);

        // Frame do Cano Nível 1: coluna 2 da linha da torre
        let frameCano = torre.linhaSheet * 4 + 2;
        torre.canoSprite = this.add.sprite(torre.x, torre.y, 'torres-sheet', frameCano).setDepth(4);

        // Indicador de alcance
        torre.alcanceG = this.add.graphics().setDepth(2);
        torre.alcanceG.lineStyle(2, 0x38bdf8, 0.5);
        torre.alcanceG.strokeCircle(torre.x, torre.y, torre.alcance);
        torre.alcanceG.setVisible(false);

        // Efeito ao construir
        this.criarEfeitoFlash(torre.x, torre.y, 0x38bdf8);

        slot.torre = torre;
        this.torres.push(torre);
        this.selecionarTorre(torre);
    }

    /* =================================================================
       ETAPA 3 — HORDAS E INIMIGOS ANIMADOS COM SPRITESHEET
       ================================================================= */
    iniciarProximaOnda() {
        if (this.emOnda || this.ondaAtual >= TOTAL_ONDAS) return;

        this.ondaAtual++;
        this.emOnda = true;
        this.atualizarHUD();

        const configuracaoOndas = [
            { scout: 6, swarm: 0, brute: 0, intervalo: 1200 },
            { scout: 8, swarm: 6, brute: 0, intervalo: 1000 },
            { scout: 8, swarm: 10, brute: 2, intervalo: 850 },
            { scout: 12, swarm: 12, brute: 4, intervalo: 750 },
            { scout: 15, swarm: 18, brute: 7, intervalo: 600 }
        ];

        const cfg = configuracaoOndas[this.ondaAtual - 1];
        let filaInimigos = [];

        for (let i = 0; i < cfg.scout; i++) filaInimigos.push('SCOUT');
        for (let i = 0; i < cfg.swarm; i++) filaInimigos.push('SWARM');
        for (let i = 0; i < cfg.brute; i++) filaInimigos.push('BRUTE');

        filaInimigos.sort(() => Math.random() - 0.5);

        this.inimigosRestantesOnda = filaInimigos.length;
        this.mostrarMensagemTutorial(`⚡ Onda ${this.ondaAtual}/${TOTAL_ONDAS} se aproximando!`);

        let indice = 0;
        this.timerOnda = this.time.addEvent({
            delay: cfg.intervalo,
            repeat: filaInimigos.length - 1,
            callback: () => {
                let tipo = filaInimigos[indice++];
                this.gerarInimigo(tipo);
            }
        });
    }

    gerarInimigo(tipoChave) {
        const dados = TIPOS_INIMIGOS[tipoChave];

        // Cria o sprite com animação da Spritesheet
        let pontoInicial = this.caminho.getPoint(0);
        let inimigo = this.physics.add.sprite(pontoInicial.x, pontoInicial.y, 'inimigos-sheet');
        inimigo.play(dados.animChave);

        inimigo.body.setCircle(dados.raio, 24 - dados.raio, 24 - dados.raio);
        inimigo.setDepth(5);

        // Barra de vida acima da cabeça
        inimigo.barraVida = this.add.graphics().setDepth(6);

        // Atributos
        inimigo.tipo = tipoChave;
        inimigo.vidaMax = dados.vidaMax;
        inimigo.vida = dados.vidaMax;
        inimigo.velocidadeBase = dados.velocidade;
        inimigo.velocidadeAtual = dados.velocidade;
        inimigo.recompensa = dados.recompensa;
        inimigo.danoBase = dados.danoBase;
        inimigo.raio = dados.raio;
        inimigo.progressoCaminho = 0;
        inimigo.lentoAte = 0;

        this.grupoInimigos.add(inimigo);
        this.atualizarBarraVidaInimigo(inimigo);
    }

    atualizarBarraVidaInimigo(inimigo) {
        inimigo.barraVida.clear();
        if (inimigo.vida <= 0) return;

        let largura = 30;
        let altura = 4;
        let pct = Math.max(0, inimigo.vida / inimigo.vidaMax);

        // Fundo vermelho
        inimigo.barraVida.fillStyle(0xef4444, 0.9);
        inimigo.barraVida.fillRect(inimigo.x - largura / 2, inimigo.y - inimigo.raio - 12, largura, altura);

        // Preenchimento verde
        inimigo.barraVida.fillStyle(0x22c55e, 1);
        inimigo.barraVida.fillRect(inimigo.x - largura / 2, inimigo.y - inimigo.raio - 12, largura * pct, altura);
    }

    /* =================================================================
       ETAPA 4 — MIRA AUTOMÁTICA E DISPARO DAS TORRES
       ================================================================= */
    atualizarTorres(tempoAtual) {
        this.torres.forEach(torre => {
            // MODO MANUAL: cano segue o cursor do mouse
            if (torre.emControleManual) {
                let ponteiro = this.input.activePointer;
                let angulo = Phaser.Math.Angle.Between(torre.x, torre.y, ponteiro.x, ponteiro.y);
                torre.canoSprite.rotation = angulo;

                if (ponteiro.isDown && tempoAtual > torre.proximoDisparo) {
                    this.dispararTorre(torre, angulo);
                    torre.proximoDisparo = tempoAtual + (torre.cadencia * 0.82);
                }
                return;
            }

            // MIRA AUTOMÁTICA: busca o inimigo mais adiantado no alcance
            let melhorAlvo = null;
            let maiorProgresso = -1;

            this.grupoInimigos.getChildren().forEach(inimigo => {
                if (!inimigo.active) return;
                let dist = Phaser.Math.Distance.Between(torre.x, torre.y, inimigo.x, inimigo.y);
                if (dist <= torre.alcance) {
                    if (inimigo.progressoCaminho > maiorProgresso) {
                        maiorProgresso = inimigo.progressoCaminho;
                        melhorAlvo = inimigo;
                    }
                }
            });

            torre.alvoAtual = melhorAlvo;

            if (melhorAlvo) {
                let angulo = Phaser.Math.Angle.Between(torre.x, torre.y, melhorAlvo.x, melhorAlvo.y);
                torre.canoSprite.rotation = angulo;

                if (tempoAtual > torre.proximoDisparo) {
                    this.dispararTorre(torre, angulo);
                    torre.proximoDisparo = tempoAtual + torre.cadencia;
                }
            }
        });
    }

    dispararTorre(torre, angulo) {
        let textura = 'tiro-sentinela';
        if (torre.tipo === 'CANHAO') textura = 'tiro-canhao';
        if (torre.tipo === 'CRIOGENICA') textura = 'tiro-crio';

        // Ponto de saída na ponta do cano
        let distSaida = 24;
        let saidaX = torre.x + Math.cos(angulo) * distSaida;
        let saidaY = torre.y + Math.sin(angulo) * distSaida;

        let projetil = this.grupoProjeteis.create(saidaX, saidaY, textura);
        projetil.setDepth(4);
        projetil.torreOrigem = torre;
        projetil.dano = torre.dano;
        projetil.tipo = torre.tipo;
        projetil.raioExplosao = torre.raioExplosao;
        projetil.desaceleracao = torre.desaceleracao;
        projetil.duracaoLentidao = torre.duracaoLentidao;

        this.physics.velocityFromRotation(angulo, torre.velocidadeTiro, projetil.body.velocity);

        this.time.delayedCall(1600, () => {
            if (projetil && projetil.active) projetil.destroy();
        });
    }

    /* =================================================================
       ETAPA 5 — BALÍSTICA, EXPLOSÕES E DANO
       ================================================================= */
    tratarColisaoTiroInimigo(projetil, inimigo) {
        if (!projetil.active || !inimigo.active) return;

        if (projetil.tipo === 'CANHAO' && projetil.raioExplosao > 0) {
            this.criarExplosao(projetil.x, projetil.y, projetil.raioExplosao);
            this.grupoInimigos.getChildren().forEach(outro => {
                if (!outro.active) return;
                let dist = Phaser.Math.Distance.Between(projetil.x, projetil.y, outro.x, outro.y);
                if (dist <= projetil.raioExplosao) {
                    this.aplicarDanoInimigo(outro, projetil.dano);
                }
            });
        } else {
            this.aplicarDanoInimigo(inimigo, projetil.dano);

            if (projetil.tipo === 'CRIOGENICA') {
                inimigo.velocidadeAtual = inimigo.velocidadeBase * (1 - projetil.desaceleracao);
                inimigo.lentoAte = this.time.now + projetil.duracaoLentidao;
                inimigo.setTint(0x34d399); // Fica com tom de gelo
                this.time.delayedCall(projetil.duracaoLentidao, () => {
                    if (inimigo && inimigo.active) inimigo.clearTint();
                });
            }
        }

        projetil.destroy();
    }

    aplicarDanoInimigo(inimigo, valorDano) {
        inimigo.vida -= valorDano;
        this.atualizarBarraVidaInimigo(inimigo);

        this.tweens.add({
            targets: inimigo,
            alpha: 0.3,
            duration: 60,
            yoyo: true
        });

        if (inimigo.vida <= 0) {
            this.destruirInimigo(inimigo);
        }
    }

    destruirInimigo(inimigo) {
        this.energia += inimigo.recompensa;
        this.pontos += inimigo.recompensa * 10;
        this.criarEfeitoMorte(inimigo.x, inimigo.y, inimigo.raio);

        inimigo.barraVida.destroy();
        inimigo.destroy();

        this.verificarFimOnda();
        this.atualizarHUD();
    }

    criarExplosao(x, y, raio) {
        let g = this.add.graphics().setDepth(7);
        g.fillStyle(0xf59e0b, 0.7);
        g.fillCircle(x, y, raio);
        g.lineStyle(3, 0xfef08a, 1);
        g.strokeCircle(x, y, raio);

        this.tweens.add({
            targets: g,
            scale: { from: 0.3, to: 1.2 },
            alpha: { from: 1, to: 0 },
            duration: 260,
            onComplete: () => g.destroy()
        });
    }

    criarEfeitoMorte(x, y, raio) {
        let g = this.add.graphics().setDepth(7);
        g.lineStyle(2, 0x38bdf8, 1);
        g.strokeCircle(x, y, raio);

        this.tweens.add({
            targets: g,
            scale: { from: 1, to: 2.2 },
            alpha: { from: 1, to: 0 },
            duration: 280,
            onComplete: () => g.destroy()
        });
    }

    criarEfeitoFlash(x, y, cor) {
        let g = this.add.graphics().setDepth(7);
        g.fillStyle(cor, 0.6);
        g.fillCircle(x, y, 32);

        this.tweens.add({
            targets: g,
            alpha: { from: 1, to: 0 },
            scale: { from: 0.5, to: 1.5 },
            duration: 250,
            onComplete: () => g.destroy()
        });
    }

    /* =================================================================
       ETAPA 6 — OFICINA DE UPGRADES E CONTROLE MANUAL
       ================================================================= */
    selecionarTorre(torre) {
        if (this.torreFocada && this.torreFocada.alcanceG) {
            this.torreFocada.alcanceG.setVisible(false);
            this.torreFocada.emControleManual = false;
        }

        this.torreFocada = torre;
        torre.alcanceG.setVisible(true);
        this.atualizarPainelUpgrade();
    }

    desmarcarTorreFocada() {
        if (this.torreFocada) {
            this.torreFocada.alcanceG.setVisible(false);
            this.torreFocada.emControleManual = false;
            this.torreFocada = null;
            this.atualizarPainelUpgrade();
        }
    }

    evoluirChassiTorre(torre) {
        let custo = torre.nivel * 65;
        if (this.energia >= custo) {
            this.energia -= custo;
            torre.nivel += 1;
            torre.alcance += 25;
            torre.cadencia = Math.max(120, Math.floor(torre.cadencia * 0.82));
            torre.dano = Math.floor(torre.dano * 1.35);

            // Atualiza o sprite do Chassi para a versão reforçada (coluna 1 da Spritesheet)
            let frameBaseLv2 = torre.linhaSheet * 4 + 1;
            torre.baseSprite.setFrame(frameBaseLv2);

            // Atualiza o círculo de alcance visual
            torre.alcanceG.clear();
            torre.alcanceG.lineStyle(2, 0x38bdf8, 0.5);
            torre.alcanceG.strokeCircle(torre.x, torre.y, torre.alcance);

            this.criarEfeitoFlash(torre.x, torre.y, 0xfde047);
            this.atualizarHUD();
            this.atualizarPainelUpgrade();
            this.mostrarAlertaRapido(`⭐ ${torre.nome} subiu para o Nível ${torre.nivel}!`);
        } else {
            this.mostrarAlertaRapido(`Energia insuficiente! (${custo}⚡ necessários)`);
        }
    }

    evoluirArmaTorre(torre) {
        let custo = torre.armaNivel * 85;
        if (torre.armaNivel >= 2) {
            this.mostrarAlertaRapido('Arma já está no nível máximo!');
            return;
        }

        if (this.energia >= custo) {
            this.energia -= custo;
            torre.armaNivel = 2; // Cano Duplo!
            torre.dano = Math.floor(torre.dano * 1.4);
            if (torre.raioExplosao > 0) torre.raioExplosao += 25;

            // Atualiza o sprite do Cano para o Cano Duplo (coluna 3 da Spritesheet)
            let frameCanoDuplo = torre.linhaSheet * 4 + 3;
            torre.canoSprite.setFrame(frameCanoDuplo);

            this.criarEfeitoFlash(torre.x, torre.y, 0xf97316);
            this.atualizarHUD();
            this.atualizarPainelUpgrade();
            this.mostrarAlertaRapido(`🔥 Cano Duplo instalado na ${torre.nome}!`);
        } else {
            this.mostrarAlertaRapido(`Energia insuficiente! (${custo}⚡ necessários)`);
        }
    }

    alternarControleManual(torre) {
        torre.emControleManual = !torre.emControleManual;
        this.atualizarPainelUpgrade();
        if (torre.emControleManual) {
            this.mostrarAlertaRapido('🎮 MIRA MANUAL ATIVA! Mire com o mouse e clique para atirar!');
        }
    }

    /* =================================================================
       ETAPA 7 — INTERFACE (HUD), MENUS E ATALHOS
       ================================================================= */
    criarHUD() {
        const estiloTexto = { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '16px', color: '#f8fafc' };

        // Painel Superior
        this.painelHUD = this.add.graphics().setDepth(10);
        this.painelHUD.fillStyle(0x0f172a, 0.9);
        this.painelHUD.fillRect(0, 0, LARGURA_TELA, 48);
        this.painelHUD.lineStyle(2, 0x38bdf8, 0.4);
        this.painelHUD.lineBetween(0, 48, LARGURA_TELA, 48);

        this.textoEnergia = this.add.text(25, 14, `⚡ Energia: ${this.energia}`, { ...estiloTexto, color: '#38bdf8', fontStyle: 'bold' }).setDepth(11);
        this.textoVidaBase = this.add.text(210, 14, `❤️ Núcleo: ${this.vidaBase}%`, { ...estiloTexto, color: '#f43f5e', fontStyle: 'bold' }).setDepth(11);
        this.textoOnda = this.add.text(390, 14, `🌊 Onda: ${this.ondaAtual}/${TOTAL_ONDAS}`, { ...estiloTexto, color: '#fde047', fontStyle: 'bold' }).setDepth(11);
        this.textoPontos = this.add.text(560, 14, `🏆 Pontos: ${this.pontos}`, estiloTexto).setDepth(11);

        // Seletor de Torres
        this.botoesConstrucao = [];
        const torresArray = [
            { id: 'SENTINELA', rotulo: '[1] Sentinela (70⚡)' },
            { id: 'CANHAO', rotulo: '[2] Canhão (110⚡)' },
            { id: 'CRIOGENICA', rotulo: '[3] Criogênica (90⚡)' }
        ];

        torresArray.forEach((item, index) => {
            let x = 740 + index * 175;
            let txt = this.add.text(x, 14, item.rotulo, { ...estiloTexto, fontSize: '13px', backgroundColor: '#1e293b', padding: { x: 8, y: 4 } })
                .setDepth(11)
                .setInteractive({ cursor: 'pointer' });

            txt.on('pointerdown', () => {
                this.torreSelecionadaParaConstruir = item.id;
                this.atualizarBotoesConstrucao();
            });

            this.botoesConstrucao.push({ id: item.id, texto: txt });
        });

        // Painel de Upgrade
        this.painelUpgradeG = this.add.graphics().setDepth(10);
        this.containerUpgrade = this.add.container(960, 520).setDepth(11).setVisible(false);

        let fundoUp = this.add.graphics();
        fundoUp.fillStyle(0x0f172a, 0.95);
        fundoUp.fillRoundedRect(0, 0, 300, 180, 8);
        fundoUp.lineStyle(2, 0x38bdf8, 0.7);
        fundoUp.strokeRoundedRect(0, 0, 300, 180, 8);
        this.containerUpgrade.add(fundoUp);

        this.txtUpgradeTitulo = this.add.text(14, 12, '', { ...estiloTexto, fontStyle: 'bold', fontSize: '15px', color: '#fde047' });
        this.txtUpgradeStatus = this.add.text(14, 38, '', { ...estiloTexto, fontSize: '12px', color: '#94a3b8' });
        this.containerUpgrade.add([this.txtUpgradeTitulo, this.txtUpgradeStatus]);

        this.btnUpChassi = this.criarBotaoHUD(14, 75, 130, 36, '⭐ Nível (+Alc/Dano)', () => {
            if (this.torreFocada) this.evoluirChassiTorre(this.torreFocada);
        });
        this.containerUpgrade.add(this.btnUpChassi);

        this.btnUpArma = this.criarBotaoHUD(154, 75, 130, 36, '🔥 Cano Duplo', () => {
            if (this.torreFocada) this.evoluirArmaTorre(this.torreFocada);
        });
        this.containerUpgrade.add(this.btnUpArma);

        this.btnManual = this.criarBotaoHUD(14, 124, 270, 36, '🎮 Assumir Mira Manual', () => {
            if (this.torreFocada) this.alternarControleManual(this.torreFocada);
        });
        this.containerUpgrade.add(this.btnManual);

        this.atualizarBotoesConstrucao();
    }

    criarBotaoHUD(x, y, larg, alt, texto, acao) {
        let cont = this.add.container(x, y);
        let fundo = this.add.graphics();
        fundo.fillStyle(0x1e293b, 1);
        fundo.fillRoundedRect(0, 0, larg, alt, 6);
        fundo.lineStyle(1, 0x38bdf8, 0.6);
        fundo.strokeRoundedRect(0, 0, larg, alt, 6);

        let txt = this.add.text(larg / 2, alt / 2, texto, {
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: '11px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        cont.add([fundo, txt]);
        cont.setSize(larg, alt);
        cont.setInteractive(new Phaser.Geom.Rectangle(0, 0, larg, alt), Phaser.Geom.Rectangle.Contains);
        cont.input.cursor = 'pointer';

        cont.on('pointerdown', acao);
        cont.on('pointerover', () => fundo.lineStyle(2, 0xfde047, 1).strokeRoundedRect(0, 0, larg, alt, 6));
        cont.on('pointerout', () => fundo.lineStyle(1, 0x38bdf8, 0.6).strokeRoundedRect(0, 0, larg, alt, 6));

        return cont;
    }

    atualizarHUD() {
        this.textoEnergia.setText(`⚡ Energia: ${this.energia}`);
        this.textoVidaBase.setText(`❤️ Núcleo: ${this.vidaBase}%`);
        this.textoOnda.setText(`🌊 Onda: ${this.ondaAtual}/${TOTAL_ONDAS}`);
        this.textoPontos.setText(`🏆 Pontos: ${this.pontos}`);
    }

    atualizarBotoesConstrucao() {
        this.botoesConstrucao.forEach(btn => {
            if (btn.id === this.torreSelecionadaParaConstruir) {
                btn.texto.setStyle({ backgroundColor: '#0284c7', color: '#ffffff' });
            } else {
                btn.texto.setStyle({ backgroundColor: '#1e293b', color: '#94a3b8' });
            }
        });
    }

    atualizarPainelUpgrade() {
        if (!this.torreFocada) {
            this.containerUpgrade.setVisible(false);
            return;
        }

        const t = this.torreFocada;
        this.containerUpgrade.setVisible(true);
        this.txtUpgradeTitulo.setText(`${t.nome} (Nível ${t.nivel} • Arma v${t.armaNivel})`);
        this.txtUpgradeStatus.setText(`Dano: ${t.dano} | Alcance: ${t.alcance}px | Cadência: ${t.cadencia}ms`);

        let custoChassi = t.nivel * 65;
        let custoArma = t.armaNivel * 85;

        this.btnUpChassi.getAt(1).setText(`⭐ Chassi (${custoChassi}⚡)`);
        this.btnUpArma.getAt(1).setText(t.armaNivel >= 2 ? '🔥 Arma MÁX' : `🔥 Cano Duplo (${custoArma}⚡)`);

        let txtManual = t.emControleManual ? '🟢 MIRA MANUAL ATIVA (Clique p/ soltar)' : '🎮 Assumir Mira Manual';
        this.btnManual.getAt(1).setText(txtManual);
    }

    mostrarMensagemTutorial(texto) {
        if (this.txtTutorial) this.txtTutorial.destroy();

        this.txtTutorial = this.add.text(LARGURA_TELA / 2, 72, texto, {
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: '15px',
            color: '#fde047',
            backgroundColor: '#0f172aee',
            padding: { x: 16, y: 6 }
        }).setOrigin(0.5).setDepth(15);

        this.time.delayedCall(4500, () => {
            if (this.txtTutorial) this.txtTutorial.destroy();
        });
    }

    mostrarAlertaRapido(msg) {
        let txt = this.add.text(LARGURA_TELA / 2, ALTURA_TELA - 45, msg, {
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: '14px',
            color: '#ffedd5',
            backgroundColor: '#c2410cee',
            padding: { x: 14, y: 5 }
        }).setOrigin(0.5).setDepth(20);

        this.time.delayedCall(2200, () => txt.destroy());
    }

    prepararControles() {
        this.teclado = this.input.keyboard.createCursorKeys();
        this.teclaR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.teclaEspaco = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.tecla1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.tecla2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.tecla3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        this.teclaEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        this.tecla1.on('down', () => { this.torreSelecionadaParaConstruir = 'SENTINELA'; this.atualizarBotoesConstrucao(); });
        this.tecla2.on('down', () => { this.torreSelecionadaParaConstruir = 'CANHAO'; this.atualizarBotoesConstrucao(); });
        this.tecla3.on('down', () => { this.torreSelecionadaParaConstruir = 'CRIOGENICA'; this.atualizarBotoesConstrucao(); });
        this.teclaEspaco.on('down', () => { this.iniciarProximaOnda(); });
        this.teclaEsc.on('down', () => { this.desmarcarTorreFocada(); });
        this.teclaR.on('down', () => {
            if (this.jogoTerminado) this.scene.restart();
        });

        this.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {
                this.desmarcarTorreFocada();
            }
        });
    }

    /* =================================================================
       ETAPA 8 — GAME LOOP, CONDIÇÕES DE VITÓRIA E DERROTA
       ================================================================= */
    update(tempo, delta) {
        if (this.jogoTerminado) return;

        let deltaSegundos = delta / 1000;

        this.grupoInimigos.getChildren().forEach(inimigo => {
            if (!inimigo.active) return;

            if (tempo > inimigo.lentoAte) {
                inimigo.velocidadeAtual = inimigo.velocidadeBase;
            }

            let comprimentoTotal = this.caminho.getLength();
            let avanco = (inimigo.velocidadeAtual * deltaSegundos) / comprimentoTotal;
            inimigo.progressoCaminho += avanco;

            if (inimigo.progressoCaminho >= 1) {
                this.causarDanoBase(inimigo.danoBase);
                inimigo.barraVida.destroy();
                inimigo.destroy();
                this.verificarFimOnda();
            } else {
                let novaPos = this.caminho.getPoint(inimigo.progressoCaminho);
                inimigo.setPosition(novaPos.x, novaPos.y);
                this.atualizarBarraVidaInimigo(inimigo);
            }
        });

        this.atualizarTorres(tempo);
    }

    causarDanoBase(dano) {
        this.vidaBase -= dano;
        if (this.vidaBase < 0) this.vidaBase = 0;
        this.atualizarHUD();

        this.cameras.main.shake(250, 0.015);

        if (this.vidaBase <= 0) {
            this.finalizarJogo(false);
        }
    }

    verificarFimOnda() {
        if (!this.emOnda) return;

        let vivos = this.grupoInimigos.countActive(true);
        if (vivos === 0) {
            this.emOnda = false;
            let bonusOnda = this.ondaAtual * 40;
            this.energia += bonusOnda;
            this.pontos += this.ondaAtual * 150;
            this.atualizarHUD();

            if (this.ondaAtual >= TOTAL_ONDAS) {
                this.finalizarJogo(true);
            } else {
                this.mostrarMensagemTutorial(`🎉 Onda ${this.ondaAtual} vencida! +${bonusOnda}⚡ de bônus! Pressione [ESPAÇO] para a próxima.`);
            }
        }
    }

    finalizarJogo(venceu) {
        this.jogoTerminado = true;
        let telaFim = this.add.graphics().setDepth(30);
        telaFim.fillStyle(0x020617, 0.85);
        telaFim.fillRect(0, 0, LARGURA_TELA, ALTURA_TELA);

        let corTitulo = venceu ? '#38bdf8' : '#f43f5e';
        let textoTitulo = venceu ? '🏆 VITÓRIA! O NÚCLEO FOI DEFENDIDO!' : '💥 DERROTA! O NÚCLEO FOI DESTRUÍDO!';

        this.add.text(LARGURA_TELA / 2, ALTURA_TELA / 2 - 50, textoTitulo, {
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: '34px',
            fontStyle: 'bold',
            color: corTitulo
        }).setOrigin(0.5).setDepth(31);

        this.add.text(LARGURA_TELA / 2, ALTURA_TELA / 2 + 10, `Pontuação Final: ${this.pontos} pontos`, {
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: '22px',
            color: '#f8fafc'
        }).setOrigin(0.5).setDepth(31);

        this.add.text(LARGURA_TELA / 2, ALTURA_TELA / 2 + 70, 'Pressione [R] no teclado para jogar novamente', {
            fontFamily: 'Trebuchet MS, sans-serif',
            fontSize: '18px',
            color: '#fde047'
        }).setOrigin(0.5).setDepth(31);
    }
}

window.Jogo = Jogo;
export { Jogo }
