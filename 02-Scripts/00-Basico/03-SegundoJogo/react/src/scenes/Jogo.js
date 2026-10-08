// >>> VERSÃO REACT + VITE deste jogo. <<<
// É o mesmo código de src/scenes/Jogo.js da versão sem instalação, com duas
// diferenças pequenas (é assim que se usa Phaser dentro de um projeto React):
//   1) importar o Phaser como módulo (no lugar do <script> global)
//   2) 'export' na frente da classe, para o React poder importá-la.
// A cena é ligada ao React em src/PhaserGame.jsx.
import * as Phaser from 'phaser'

/* =====================================================================
   🎮 MEU SEGUNDO JOGO — AÇÃO E TIRO (estilo Metal Slug / Contra)
   ---------------------------------------------------------------------
   OBJETIVO: criar um jogo de tiro 2D de ação, com SCROLL LATERAL:
   a fase anda para o lado enquanto você controla um soldado que atira
   nos robôs inimigos. No fim do mapa, um CHEFÃO (tanque) te espera!

   🕹️ CONTROLES:
      ← → ou A/D .... andar
      ↑ ou ESPAÇO ou W ... pular
      Z ou X ........ atirar (segure para atirar várias vezes)
      R ............. jogar de novo (quando o jogo acabar)

   💡 A GRANDE IDEIA DESTE JOGO: no primeiro jogo a tela era fixa.
   Aqui o MUNDO é GIGANTE (4600 pixels de largura!) e a CÂMERA anda
   junto com o herói. Isso se chama "scroll lateral" — é o truque dos
   jogos Metal Slug e Contra! 🔄

   🎨 DESTAQUE DESTA AULA: NÃO usamos imagens prontas! Desenhamos
   TUDO com código (retângulos, círculos e triângulos), igual pixel art.
   Assim o jogo abre em qualquer lugar, sem baixar nada. Você também
   aprende que sprite é só "um desenho que o computador guarda".
   🔊 E os SONS? Também são sintetizados em código (Web Audio API) —
   sem arquivo de áudio nenhum — e tem MÚSICA DE FUNDO em loop! 🎶
   Veja criarSons(), som() e tocarMusica() na ETAPA 6.

   O arquivo está dividido em ETAPAS numeradas (procure "ETAPA").
   Cada etapa é um conceito novo. Leia os comentários com calma! 😊
   ===================================================================== */

/* ---------------------------------------------------------------------
   📦 CONSTANTES — os "ajustes" do jogo, todos com nome fácil.
   Mude aqui para deixar o jogo mais fácil ou mais difícil!
   --------------------------------------------------------------------- */
const LARGURA_TELA = 1280;
const ALTURA_TELA = 720;
const ALTURA_CHAO = 128;
const TOPO_CHAO = ALTURA_TELA - ALTURA_CHAO;   // 592: onde o chão começa
const TAMANHO_MUNDO = 4600;   // 🔄 o mundo é uma FILA enorme (4 telas e meia!)
const X_INICIO = 200;         // onde o herói nasce

const VEL_ANDAR = 300;        // velocidade do herói (px/s)
const FORCA_PULO = -700;      // força do pulo (negativo = para cima!)

const VEL_BALA = 950;         // velocidade da bala do herói
const CADENCIA_TIRO = 180;    // ⏱️ quanto tempo entre um tiro e outro (ms)
const DANO_BALA = 1;          // cada bala tira 1 de vida do inimigo

const VEL_BALA_INIMIGA = 430; // velocidade da bala inimiga
const VEL_BALA_CHEFE = 520;   // velocidade da bala do chefão

const VIDA_INIMIGO = 3;       // 💥 tiros necessários para derrubar um robô soldado
const VIDA_VOADOR = 2;        // 🚁 tiros necessários para derrubar o drone voador
const VIDA_PULADOR = 4;       // 🦘 tiros necessários para derrubar o robô saltador
const VIDA_CHEFE = 30;        // 💥 tiros necessários para derrubar o tanque

const VEL_INIMIGO = 130;      // velocidade de caminhada do robô soldado
const VEL_VOADOR = 110;       // velocidade de voo do drone
const VEL_PULADOR = 110;      // velocidade de caminhada do robô saltador
const FORCA_PULO_PULADOR = -620; // força do salto do robô pulador
const VEL_CHEFE = 55;         // o tanque anda devagar...

const CADENCIA_TIRO_CHEFE = 950; // ...mas atira quase 1 vez por segundo
const DISTANCIA_TIRO_INIMIGO = 560;  // o robô só atira se o herói estiver perto
const DISTANCIA_TIRO_VOADOR = 520;   // distância para o drone atirar

const INTERVALO_SPAWN = 2000; // ⏱️ nasce um inimigo a cada 2 segundos
const MAX_INIMIGOS = 7;       // limite de robôs vivos ao mesmo tempo

const X_CHEFE = TAMANHO_MUNDO - 260;   // posição do tanque no fim do mundo
const X_GATILHO_CHEFE = X_CHEFE - 1100; // quando o herói chega perto, o chefão entra

const VIDAS_INICIAIS = 3;     // corações do herói
const TEMPO_INVENCIVEL = 1500; // ⏱️ tempo piscando depois de levar dano (ms)
const PONTOS_INIMIGO = 100;   // pontos do soldado robô
const PONTOS_VOADOR = 150;    // pontos do drone voador
const PONTOS_PULADOR = 200;   // pontos do robô saltador
const PONTOS_CHEFE = 2000;    // pontos do chefão tanque

/* Cores do HUD, guardadas em constantes (visual consistente!). */
const COR_TEXTO = '#ffffff';
const COR_CONTORNO = '#1e2233';
const COR_DESTAQUE = '#ffe066';

/* ---------------------------------------------------------------------
   🖌️ A função "pintar" — o nosso pincel de pixel art!
   Em vez de carregar imagens, desenhamos com quadradinhos coloridos.
   É assim que se faz pixel art raiz: cada quadradinho é um pixel grandão.
   --------------------------------------------------------------------- */
function pintar(g, cor, x, y, largura, altura) {
    g.fillStyle(cor, 1);
    g.fillRect(x, y, largura, altura);
}

export class Jogo extends Phaser.Scene {

    constructor() {
        super('Jogo');
    }

    /* =================================================================
       ETAPA 0 — PRELOAD: carregar os sprites PNG da pasta assets/
       (com gerador procedural integrado como plano de contingência!)
       ================================================================= */
    preload() {
        // 📁 CARREGAR TODOS OS SPRITES PNG DA PASTA assets/
        // O jogo usa arquivos PNG reais, organizados e nítidos:
        this.load.image('ceu', 'assets/ceu.png');
        this.load.image('nuvem', 'assets/nuvem.png');
        this.load.image('montanha', 'assets/montanha.png');
        this.load.image('chao', 'assets/chao.png');
        this.load.image('plataforma', 'assets/plataforma.png');

        // Herói (Sargento Pixel - 5 poses)
        this.load.image('heroi-parado', 'assets/heroi-parado.png');
        this.load.image('heroi-andando-1', 'assets/heroi-andando-1.png');
        this.load.image('heroi-andando-2', 'assets/heroi-andando-2.png');
        this.load.image('heroi-pulando', 'assets/heroi-pulando.png');
        this.load.image('heroi-atirando', 'assets/heroi-atirando.png');

        // Inimigo 1: Soldado Robô Vermelho (anda no chão e atira reto)
        this.load.image('inimigo-1', 'assets/inimigo-1.png');
        this.load.image('inimigo-2', 'assets/inimigo-2.png');
        this.load.image('inimigo-atirando', 'assets/inimigo-atirando.png');

        // Inimigo 2: Drone Voador (aéreo, hélice girando, atira plasma verde)
        this.load.image('voador-1', 'assets/voador-1.png');
        this.load.image('voador-2', 'assets/voador-2.png');

        // Inimigo 3: Robô Saltador (pernas de mola, salta alto no ar)
        this.load.image('pulador-1', 'assets/pulador-1.png');
        this.load.image('pulador-2', 'assets/pulador-2.png');
        this.load.image('pulador-pulando', 'assets/pulador-pulando.png');

        // Chefão: Tanque Pesado
        this.load.image('chefao-1', 'assets/chefao-1.png');
        this.load.image('chefao-2', 'assets/chefao-2.png');

        // Itens, Projéteis e Efeitos Visuais (VFX)
        this.load.image('coracao', 'assets/coracao.png');
        this.load.image('bala', 'assets/bala.png');
        this.load.image('bala-inimiga', 'assets/bala-inimiga.png');
        this.load.image('bala-voador', 'assets/bala-voador.png');
        this.load.image('bala-chefe', 'assets/bala-chefe.png');
        this.load.image('particula', 'assets/particula.png');
        this.load.image('flash', 'assets/flash.png');
    }

    /* -----------------------------------------------------------------
       novoDesenho(): cria uma "folha de papel em branco" fora da tela.
       "add: false" = o desenho NÃO vira um objeto do jogo, só uma textura.
       ----------------------------------------------------------------- */
    novoDesenho() {
        return this.make.graphics({ x: 0, y: 0, add: false });
    }

    /* -----------------------------------------------------------------
       desenharTexturas(): desenha TODOS os sprites do jogo.
       💾 generateTexture('nome', largura, altura) guarda o desenho na
       memória do jogo com um apelido — depois é só usar this.add.sprite
       ou this.add.image com esse apelido!

       ⚠️ Se o jogo REINICIAR (tecla R), as texturas já existem.
       generateTexture com apelido repetido dá aviso no console,
       então só desenhamos tudo uma vez.
       ----------------------------------------------------------------- */
    desenharTexturas() {
        if (this.textures.exists('heroi-parado')) return; // já desenhamos!

        // ---- CENÁRIO ----
        this.desenharCeu();
        this.desenharNuvem();
        this.desenharMontanha();
        this.desenharChao();
        this.desenharPlataforma();

        // ---- PERSONAGENS ----
        this.desenharHeroi();
        this.desenharInimigo();
        this.desenharVoador();
        this.desenharPulador();
        this.desenharChefao();

        // ---- OBJETOS ----
        this.desenharCoracao();
        this.desenharBala();
        this.desenharBalaInimiga();
        this.desenharBalaVoador();
        this.desenharBalaChefe();
        this.desenharParticula();
        this.desenharFlash();
    }

    /* ---- céu com sol (duas faixas de cor = degradê simples) ---- */
    desenharCeu() {
        const g = this.novoDesenho();
        pintar(g, 0x4f9bd8, 0, 0, LARGURA_TELA, ALTURA_TELA);
        pintar(g, 0x8ec9ec, 0, 420, LARGURA_TELA, ALTURA_TELA - 420); // horizonte claro
        g.fillStyle(0xfff59d, 1); g.fillCircle(1080, 130, 70);       // sol (halo)
        g.fillStyle(0xffee58, 1); g.fillCircle(1080, 130, 50);       // sol (miolo)
        g.generateTexture('ceu', LARGURA_TELA, ALTURA_TELA);
        g.destroy();
    }

    /* ---- nuvem fofinha feita de círculos ---- */
    desenharNuvem() {
        const g = this.novoDesenho();
        g.fillStyle(0xffffff, 0.85);
        g.fillCircle(60, 70, 34); g.fillCircle(115, 48, 44); g.fillCircle(175, 72, 36);
        g.fillRect(30, 70, 175, 34);
        g.fillStyle(0xffffff, 0.5);
        g.fillCircle(95, 38, 20); g.fillCircle(150, 32, 24);
        g.generateTexture('nuvem', 256, 128);
        g.destroy();
    }

    /* ---- montanhas feitas de triângulos (com neve no pico) ---- */
    desenharMontanha() {
        const g = this.novoDesenho();
        g.fillStyle(0x607d8b, 1);
        g.fillTriangle(0, 256, 150, 30, 300, 256);
        g.fillStyle(0x455a64, 1);
        g.fillTriangle(220, 256, 380, 0, 540, 256);
        g.fillStyle(0xeceff1, 1); // neve
        g.fillTriangle(330, 42, 380, 0, 430, 42);
        g.fillTriangle(105, 70, 150, 30, 195, 70);
        g.generateTexture('montanha', 512, 256);
        g.destroy();
    }

    /* ---- chão de terra com graminha e pedrinhas (128x128, repetível) ---- */
    desenharChao() {
        const g = this.novoDesenho();
        pintar(g, 0x8d6e63, 0, 0, 128, 128);  // terra
        pintar(g, 0x7cb342, 0, 0, 128, 8);     // graminha no topo
        pintar(g, 0xa1887f, 0, 8, 128, 10);    // faixa mais clara
        pintar(g, 0x6d4c41, 20, 40, 18, 10);   // pedrinhas
        pintar(g, 0x6d4c41, 80, 70, 26, 12);
        pintar(g, 0x6d4c41, 50, 100, 20, 10);
        pintar(g, 0x6d4c41, 100, 30, 14, 8);
        pintar(g, 0x5d4037, 0, 118, 128, 10);  // base escura
        g.generateTexture('chao', 128, 128);
        g.destroy();
    }

    /* ---- plataforma de metal/cimento (128x64, repetível) ---- */
    desenharPlataforma() {
        const g = this.novoDesenho();
        pintar(g, 0x90a4ae, 0, 0, 128, 64);
        pintar(g, 0xb0bec5, 0, 0, 128, 10);    // topo claro
        pintar(g, 0x78909c, 0, 54, 128, 10);   // base
        pintar(g, 0x607d8b, 16, 20, 24, 8);    // manchinhas
        pintar(g, 0x607d8b, 84, 36, 28, 8);
        g.generateTexture('plataforma', 128, 64);
        g.destroy();
    }

    /* -----------------------------------------------------------------
       🪖 O HERÓI — o Sargento Pixel (48x64), olhando para a DIREITA.
       Cada "frame" é um desenho separado. Animação = trocar o desenho
       bem rápido (tipo desenho animado!).thet
       ----------------------------------------------------------------- */
    desenharHeroi() {
        // partes que se repetem em todos os frames
        const base = (g) => {
            pintar(g, 0x2e7d32, 12, 0, 24, 12);   // capacete
            pintar(g, 0x1b5e20, 8, 10, 32, 4);    // aba do capacete
            pintar(g, 0xffcc99, 15, 14, 18, 11);  // rosto
            pintar(g, 0x263238, 27, 17, 4, 4);    // olho (olha para a direita)
            pintar(g, 0x1e5aa8, 12, 25, 24, 19);  // tronco (camisa azul)
            pintar(g, 0x17457f, 12, 25, 24, 4);   // ombreira
            pintar(g, 0x5d4037, 12, 41, 24, 4);   // cinto
            pintar(g, 0x212121, 30, 29, 15, 6);   // metralhadora
            pintar(g, 0x424242, 45, 30, 3, 4);    // bico da arma
            pintar(g, 0xffcc99, 34, 32, 6, 5);    // mão na arma
            pintar(g, 0x17457f, 6, 27, 6, 14);    // braço de trás
        };
        const pernaParada = (g) => {
            pintar(g, 0x558b2f, 14, 45, 8, 15);   // perna esquerda
            pintar(g, 0x558b2f, 26, 45, 8, 15);   // perna direita
            pintar(g, 0x3e2723, 13, 60, 10, 4);   // bota esquerda
            pintar(g, 0x3e2723, 25, 60, 10, 4);   // bota direita
        };
        const pernaAndando1 = (g) => {            // passo aberto
            pintar(g, 0x558b2f, 10, 45, 7, 14);
            pintar(g, 0x3e2723, 8, 57, 10, 4);
            pintar(g, 0x558b2f, 29, 45, 7, 14);
            pintar(g, 0x3e2723, 28, 57, 11, 4);
        };
        const pernaAndando2 = (g) => {            // perna dobrada (meio passo)
            pintar(g, 0x558b2f, 14, 45, 8, 10);
            pintar(g, 0x3e2723, 13, 53, 10, 4);
            pintar(g, 0x558b2f, 26, 45, 8, 15);
            pintar(g, 0x3e2723, 25, 60, 10, 4);
        };
        const pernaPulando = (g) => {             // pernas dobradas no ar
            pintar(g, 0x558b2f, 12, 45, 7, 9);
            pintar(g, 0x558b2f, 27, 45, 7, 9);
            pintar(g, 0x3e2723, 10, 52, 10, 4);
            pintar(g, 0x3e2723, 26, 52, 10, 4);
        };

        let g = this.novoDesenho();
        base(g); pernaParada(g);
        g.generateTexture('heroi-parado', 48, 64); g.destroy();

        g = this.novoDesenho();
        base(g); pernaAndando1(g);
        g.generateTexture('heroi-andando-1', 48, 64); g.destroy();

        g = this.novoDesenho();
        base(g); pernaAndando2(g);
        g.generateTexture('heroi-andando-2', 48, 64); g.destroy();

        g = this.novoDesenho();
        base(g); pernaPulando(g);
        g.generateTexture('heroi-pulando', 48, 64); g.destroy();

        g = this.novoDesenho();
        base(g); pernaParada(g);
        pintar(g, 0x1e5aa8, 36, 27, 8, 5);        // braço estendido ao atirar
        g.generateTexture('heroi-atirando', 48, 64); g.destroy();
    }

    /* -----------------------------------------------------------------
       🤖 O INIMIGO — robô vermelho (48x64), olhando para a ESQUERDA
       (já nasce virado para o lado do herói!)
       ----------------------------------------------------------------- */
    desenharInimigo() {
        const base = (g) => {
            pintar(g, 0x616161, 23, 0, 3, 6);     // antena
            pintar(g, 0xff5252, 21, 0, 7, 5);     // luz da antena
            pintar(g, 0xe53935, 14, 6, 20, 14);   // cabeça
            pintar(g, 0xffeb3b, 17, 11, 5, 5);    // olho (olha para a esquerda)
            pintar(g, 0xc62828, 12, 20, 24, 26);  // corpo
            pintar(g, 0x8e0000, 18, 27, 12, 9);   // peito escuro
            pintar(g, 0xff8a80, 22, 30, 4, 4);    // luz do peito
            pintar(g, 0x8e0000, 6, 24, 8, 7);     // braço da arma
            pintar(g, 0x212121, 0, 27, 14, 5);    // arma apontando ESQUERDA
            pintar(g, 0x9e9e9e, 12, 28, 5, 4);    // garra na arma
            pintar(g, 0x8e0000, 36, 24, 6, 15);   // braço de trás
        };
        const perna1 = (g) => {
            pintar(g, 0x616161, 14, 46, 8, 14);
            pintar(g, 0x616161, 26, 46, 8, 14);
            pintar(g, 0x424242, 12, 60, 12, 4);
            pintar(g, 0x424242, 24, 60, 12, 4);
        };
        const perna2 = (g) => {                   // perna levantada
            pintar(g, 0x616161, 15, 46, 8, 11);
            pintar(g, 0x424242, 14, 55, 11, 4);
            pintar(g, 0x616161, 26, 46, 8, 14);
            pintar(g, 0x424242, 24, 60, 12, 4);
        };

        let g = this.novoDesenho();
        base(g); perna1(g);
        g.generateTexture('inimigo-1', 48, 64); g.destroy();

        g = this.novoDesenho();
        base(g); perna2(g);
        g.generateTexture('inimigo-2', 48, 64); g.destroy();

        g = this.novoDesenho();
        base(g); perna1(g);
        pintar(g, 0x8e0000, 4, 26, 10, 5);        // braço estendido ao atirar
        g.generateTexture('inimigo-atirando', 48, 64); g.destroy();
    }

    /* -----------------------------------------------------------------
       🚁 O INIMIGO VOADOR (Drone) — 48x32.
       Voa no ar com hélice girando e atira plasma verde.
       ----------------------------------------------------------------- */
    desenharVoador() {
        const base = (g) => {
            pintar(g, 0x37474f, 0, 13, 12, 6);
            pintar(g, 0x37474f, 36, 13, 12, 6);
            pintar(g, 0x546e7a, 10, 9, 28, 13);
            pintar(g, 0x78909c, 12, 11, 24, 5);
            pintar(g, 0xb2ebf2, 19, 11, 10, 5);
            pintar(g, 0x00e676, 10, 15, 4, 4);
            pintar(g, 0x455a64, 15, 22, 3, 6);
            pintar(g, 0x455a64, 30, 22, 3, 6);
            pintar(g, 0x455a64, 22, 5, 4, 4);
            pintar(g, 0x212121, 23, 22, 3, 8);
        };
        let g = this.novoDesenho();
        base(g); pintar(g, 0xeceff1, 16, 3, 16, 3);
        g.generateTexture('voador-1', 48, 32); g.destroy();

        g = this.novoDesenho();
        base(g); pintar(g, 0xeceff1, 22, 0, 4, 9);
        g.generateTexture('voador-2', 48, 32); g.destroy();
    }

    /* -----------------------------------------------------------------
       🦘 O INIMIGO PULADOR (Robô Saltador) — 48x64.
       Pernas de mola zigzag que pulam alto no ar!
       ----------------------------------------------------------------- */
    desenharPulador() {
        const base = (g) => {
            pintar(g, 0x616161, 23, 0, 3, 6);
            pintar(g, 0xffeb3b, 21, 0, 7, 5);
            pintar(g, 0xff8f00, 14, 6, 20, 14);
            pintar(g, 0x263238, 17, 11, 5, 5);
            pintar(g, 0xf57c00, 12, 20, 24, 24);
            pintar(g, 0xe65100, 18, 26, 12, 10);
            pintar(g, 0xffe082, 22, 29, 4, 4);
            pintar(g, 0xe65100, 6, 24, 8, 7);
            pintar(g, 0x8d6e63, 4, 29, 6, 5);
            pintar(g, 0xe65100, 36, 24, 6, 12);
        };
        const mola = (g, x) => {
            pintar(g, 0x8d6e63, x, 44, 8, 4);
            pintar(g, 0x8d6e63, x + 1, 48, 6, 4);
            pintar(g, 0x8d6e63, x, 52, 8, 4);
        };

        let g = this.novoDesenho();
        base(g); mola(g, 14); mola(g, 26);
        pintar(g, 0x4e342e, 12, 56, 12, 5); pintar(g, 0x4e342e, 24, 56, 12, 5);
        g.generateTexture('pulador-1', 48, 64); g.destroy();

        g = this.novoDesenho();
        base(g); mola(g, 15); mola(g, 26);
        pintar(g, 0x4e342e, 13, 52, 11, 5); pintar(g, 0x4e342e, 24, 56, 12, 5);
        g.generateTexture('pulador-2', 48, 64); g.destroy();

        g = this.novoDesenho();
        base(g);
        pintar(g, 0x8d6e63, 13, 44, 7, 4); pintar(g, 0x4e342e, 11, 48, 10, 4);
        pintar(g, 0x8d6e63, 28, 44, 7, 4); pintar(g, 0x4e342e, 27, 48, 10, 4);
        g.generateTexture('pulador-pulando', 48, 64); g.destroy();
    }

    /* -----------------------------------------------------------------
       🛢️ O CHEFÃO — um tanque (176x112), olhando para a ESQUERDA.
       Dois frames: as rodas da esteira mudam de lugar (ilusão de
       movimento, igual filme de flipbook!).
       ----------------------------------------------------------------- */
    desenharChefao() {
        const base = (g) => {
            pintar(g, 0x4b5320, 8, 42, 160, 42);   // corpo do tanque
            pintar(g, 0x6b8e23, 22, 30, 132, 14); // blindagem do topo
            pintar(g, 0x556b2f, 62, 10, 60, 24);  // torre
            pintar(g, 0x6b8e23, 74, 0, 36, 12);   // topo da torre
            pintar(g, 0x37474f, 4, 18, 60, 10);   // canhão (aponta ESQUERDA)
            pintar(g, 0x212121, 0, 16, 8, 14);    // boca do canhão
            pintar(g, 0xffee58, 156, 52, 10, 10); // farol
            pintar(g, 0x33691e, 30, 52, 20, 10);  // detalhes
            pintar(g, 0x33691e, 126, 52, 20, 10);
        };
        const esteiras1 = (g) => {
            pintar(g, 0x263238, 8, 84, 160, 24);  // esteira preta
            for (let i = 0; i < 6; i++) pintar(g, 0x546e7a, 18 + i * 26, 90, 14, 12);
        };
        const esteiras2 = (g) => {
            pintar(g, 0x263238, 8, 84, 160, 24);
            for (let i = 0; i < 6; i++) pintar(g, 0x546e7a, 31 + i * 26, 90, 14, 12);
        };

        let g = this.novoDesenho();
        base(g); esteiras1(g);
        g.generateTexture('chefao-1', 176, 112); g.destroy();

        g = this.novoDesenho();
        base(g); esteiras2(g);
        g.generateTexture('chefao-2', 176, 112); g.destroy();
    }

    /* ---- corações do HUD ---- */
    desenharCoracao() {
        const g = this.novoDesenho();
        g.fillStyle(0xff4757, 1);
        g.fillCircle(10, 11, 9);
        g.fillCircle(22, 11, 9);
        g.fillTriangle(2, 14, 30, 14, 16, 30);
        g.fillStyle(0xff8a80, 1);
        g.fillCircle(9, 9, 3); // brilinho
        g.generateTexture('coracao', 32, 32);
        g.destroy();
    }

    /* ---- bala do herói (cápsula amarela) ---- */
    desenharBala() {
        const g = this.novoDesenho();
        pintar(g, 0xffee58, 0, 2, 11, 4);
        pintar(g, 0xffa726, 11, 2, 5, 4);
        g.generateTexture('bala', 16, 8);
        g.destroy();
    }

    /* ---- bala inimiga (bolinha vermelha) ---- */
    desenharBalaInimiga() {
        const g = this.novoDesenho();
        g.fillStyle(0xff1744, 1); g.fillCircle(6, 6, 5);
        g.fillStyle(0xff8a80, 1); g.fillCircle(4, 4, 2);
        g.generateTexture('bala-inimiga', 12, 12);
        g.destroy();
    }

    /* ---- bala do drone voador (bolinha de plasma verde 12x12) ---- */
    desenharBalaVoador() {
        const g = this.novoDesenho();
        g.fillStyle(0x00e676, 1); g.fillCircle(6, 6, 5);
        g.fillStyle(0xb9f6ca, 1); g.fillCircle(4, 4, 2);
        g.generateTexture('bala-voador', 12, 12);
        g.destroy();
    }

    /* ---- bala do chefão (bolão vermelho) ---- */
    desenharBalaChefe() {
        const g = this.novoDesenho();
        g.fillStyle(0xd50000, 1); g.fillCircle(12, 7, 7);
        g.fillStyle(0xef5350, 1); g.fillCircle(10, 5, 3);
        g.generateTexture('bala-chefe', 24, 14);
        g.destroy();
    }

    /* ---- quadradinho usado nas explosões (partícula) ---- */
    desenharParticula() {
        const g = this.novoDesenho();
        g.fillStyle(0xffffff, 1);
        g.fillRect(1, 1, 6, 6);
        g.generateTexture('particula', 8, 8);
        g.destroy();
    }

    /* ---- flash amarelo que aparece na ponta da arma ao atirar ---- */
    desenharFlash() {
        const g = this.novoDesenho();
        g.fillStyle(0xfff176, 1); g.fillCircle(10, 10, 8);
        g.fillStyle(0xffffff, 1); g.fillCircle(10, 10, 4);
        g.generateTexture('flash', 20, 20);
        g.destroy();
    }

    /* =================================================================
       ETAPA 1 — CREATE: montar o mundo (céu, chão, herói, câmera...)
       ================================================================= */
    create() {

        // ---- ESTADO DO JOGO (as "anotações" da partida) ---------
        this.pontos = 0;
        this.vidas = VIDAS_INICIAIS;
        this.inimigosDerrotados = 0;
        this.invencivel = false;
        this.acabou = false;
        this.vitorioso = false;
        this.proximoTiro = 0;        // ⏱️ controle da cadência de tiro
        this.tempoAteAnimTiro = 0;   // pose "atirando" dura um instante
        this.tempoAnim = 0;          // ⏱️ troca de frame da animação
        this.frameAndando = false;
        this.texturaHeroi = '';
        this.chefao = null;
        this.chefeCriado = false;
        this.tempoInicio = this.time.now;
        this.musicaIniciada = false;   // a música de fundo começa na 1ª tecla
        if (this.timerMusica) {         // se reiniciou (R), limpa o timer antigo
            this.timerMusica.remove();
            this.timerMusica = null;
        }

        // ---- GARANTIA DE TEXTURAS (fallback caso abra direto sem servidor) -
        if (!this.textures.exists('heroi-parado')) {
            this.desenharTexturas();
        }

        // ---- CENÁRIO -----------------------------------------------
        // ☁️ O céu fica FIXO na tela (scrollFactor 0): ele não anda!
        this.add.image(0, 0, 'ceu').setOrigin(0, 0).setScrollFactor(0);

        // 🔄 Nuvens também fixas na tela, mas o ladrilho anda devagar (vento)
        this.nuvens = this.add.tileSprite(LARGURA_TELA / 2, 150, LARGURA_TELA, 240, 'nuvem')
            .setScrollFactor(0);

        // ⛰️ Montanhas com scrollFactor 0.35: andam 35% da velocidade da
        // câmera. Quanto MENOR o número, MAIS LONGE o objeto parece!
        // (é a ilusão de profundidade — chama-se PARALLAX)
        this.montanhas = this.add.tileSprite(TAMANHO_MUNDO / 2, TOPO_CHAO - 128,
                                             TAMANHO_MUNDO, 256, 'montanha')
            .setScrollFactor(0.35);

        // 🟫 O chão acompanha o mundo inteiro (scrollFactor 1 = padrão)
        this.chaoVisual = this.add.tileSprite(TAMANHO_MUNDO / 2, TOPO_CHAO + ALTURA_CHAO / 2,
                                              TAMANHO_MUNDO, ALTURA_CHAO, 'chao');

        // ---- FÍSICA DO MUNDO ---------------------------------------
        // 🌍 O mundo agora tem TAMANHO_MUNDO pixels de largura!
        this.physics.world.setBounds(0, 0, TAMANHO_MUNDO, ALTURA_TELA);

        // chão invisível que segura todo mundo (corpo ESTÁTICO = parado)
        this.chaoFisico = this.add.rectangle(TAMANHO_MUNDO / 2, TOPO_CHAO + ALTURA_CHAO / 2,
                                             TAMANHO_MUNDO, ALTURA_CHAO, 0x000000, 0);
        this.physics.add.existing(this.chaoFisico, true);

        // ---- HERÓI -------------------------------------------------
        // 🪖 add.sprite + setOrigin(0.5, 1): o ponto (x, y) vira a BASE
        // dos pés — assim fica fácil colocar o herói "em pé" no chão!
        // (⚠️ o herói precisa existir ANTES das plataformas, porque a
        // plataforma cria um colisor COM o herói!)
        this.jogador = this.add.sprite(X_INICIO, TOPO_CHAO - 2, 'heroi-parado').setOrigin(0.5, 1);
        this.physics.add.existing(this.jogador);
        this.jogador.body.setCollideWorldBounds(true);  // não sai do mundo
        this.jogador.body.setSize(26, 58);              // caixa de colisão menor
        this.jogador.body.setOffset(11, 6);             // alinhada com o desenho
        this.physics.add.collider(this.jogador, this.chaoFisico);

        // ---- PLATAFORMAS -------------------------------------------
        this.criarPlataforma(1700, 470, 192);
        this.criarPlataforma(2500, 400, 224);
        this.criarPlataforma(3300, 460, 192);

        // ---- CÂMERA (o truque do scroll lateral!) ------------------
        // 🎥 A câmera tem limites do tamanho do mundo e segue o herói.
        // Os dois últimos números (0.1 e 0.05) deixam o movimento SUAVE,
        // com um leve atraso gostoso (chama-se "lerp").
        this.cameras.main.setBounds(0, 0, TAMANHO_MUNDO, ALTURA_TELA);
        this.cameras.main.startFollow(this.jogador, true, 0.1, 0.05);

        // ---- GRUPOS (as "caixas organizadoras") --------------------
        // 📦 Um grupo guarda vários objetos do mesmo tipo:
        this.balas = this.physics.add.group();          // balas do herói
        this.balasInimigas = this.physics.add.group();  // balas dos inimigos
        this.inimigos = this.physics.add.group();       // robôs inimigos

        // ---- OVERLAPS (detectar toques sem bloquear) ---------------
        this.physics.add.overlap(this.balas, this.inimigos, this.balaAcertouInimigo, null, this);
        this.physics.add.overlap(this.balas, this.balasInimigas, this.balasSeAnulam, null, this);
        this.physics.add.overlap(this.balasInimigas, this.jogador, this.balaAcertouJogador, null, this);
        this.physics.add.overlap(this.jogador, this.inimigos, this.contatoComInimigo, null, this);

        // ---- TECLADO ------------------------------------------------
        this.cursors = this.input.keyboard.createCursorKeys();
        this.teclas = this.input.keyboard.addKeys({
            esq: Phaser.Input.Keyboard.KeyCodes.A,
            dir: Phaser.Input.Keyboard.KeyCodes.D,
            cima: Phaser.Input.Keyboard.KeyCodes.W,
            atirar: Phaser.Input.Keyboard.KeyCodes.Z,
            atirar2: Phaser.Input.Keyboard.KeyCodes.X,
        });
        // R reinicia o jogo quando acabar (ou quando vencer!)
        this.input.keyboard.on('keydown-R', () => {
            if (this.acabou || this.vitorioso) this.scene.restart();
        });

        // ---- SONS (efeitos sonoros sintetizados em código! 🔊) ------
        this.criarSons();

        // ---- INIMIGOS INICIAIS (variados ao longo do percurso) -----
        this.criarInimigo(1300);         // soldado no chão
        this.criarVoador(1750, 310);      // drone voador no ar
        this.criarPulador(2200);         // robô saltador
        this.criarInimigo(2700);         // soldado
        this.criarVoador(3050, 290);      // drone voador
        this.criarPulador(3200);         // robô saltador perto da meta

        // ---- SPAWN: um timer que "fabrica" robôs para sempre ---------
        this.timerSpawn = this.time.addEvent({
            delay: INTERVALO_SPAWN,
            loop: true,
            callback: this.tentarSpawnarInimigo,
            callbackScope: this,
        });

        // ---- HUD (interface) e instrução ----------------------------
        this.criarHUD();
        this.mostrarInstrucao();

        console.log('Segundo jogo pronto! Ande para a direita e derrote o chefão!');
    }

    /* ---------------------------------------------------------------
       criarPlataforma() — platforms flutuantes (iguais à Aula 11,
       só que agora espalhadas pelo mundo grande).
       --------------------------------------------------------------- */
    criarPlataforma(centroX, topoY, largura) {
        const altura = 64;
        this.add.tileSprite(centroX, topoY + altura / 2, largura, altura, 'plataforma');
        const corpo = this.add.rectangle(centroX, topoY + altura / 2, largura, altura, 0x000000, 0);
        this.physics.add.existing(corpo, true);
        this.physics.add.collider(this.jogador, corpo);
        return corpo;
    }

    /* =================================================================
       ETAPA 2 — TIRO: grupo de balas + cadência + flash
       ================================================================= */

    /* ---------------------------------------------------------------
       atirar() — cria uma bala na ponta da arma do herói.
       ⏱️ CADÊNCIA: this.time.now guarda o relógio do jogo (em ms).
       Só deixamos atirar de novo quando o relógio passar do próximo tiro.
       Segurar Z = atirar várias vezes, mas no máximo 1 a cada 180 ms!
       --------------------------------------------------------------- */
    atirar() {
        if (this.acabou || this.vitorioso) return;
        if (this.time.now < this.proximoTiro) return;   // ainda não pode!
        this.proximoTiro = this.time.now + CADENCIA_TIRO; // agenda o próximo

        // a bala nasce na ponta da arma, do lado para onde o herói olha
        const direcao = this.jogador.flipX ? -1 : 1;
        const bala = this.balas.create(this.jogador.x + direcao * 28, this.jogador.y - 33, 'bala');
        bala.setFlipX(this.jogador.flipX);
        bala.body.setAllowGravity(false);   // bala não cai!
        bala.body.setVelocityX(direcao * VEL_BALA);

        // 💥 flash na ponta da arma (aparece e some bem rápido)
        const flash = this.add.image(this.jogador.x + direcao * 32, this.jogador.y - 33, 'flash');
        flash.setScale(0.8);
        this.tweens.add({
            targets: flash, scale: 1.8, alpha: 0, duration: 90,
            onComplete: () => flash.destroy(),
        });

        this.som('tiro');   // 🔊 "pew!"

        // o herói faz a pose de atirando por um instante
        this.tempoAteAnimTiro = this.time.now + 160;
    }

    /* ---------------------------------------------------------------
       balasSeAnulam() — tiro no ar! Se a bala do herói tromba com a
       bala inimiga, as duas se destroem. (É um extra nosso — o Metal
       Slug original não tem isso, mas fica legal! 😄)
       --------------------------------------------------------------- */
    balasSeAnulam(bala, balaInimiga) {
        bala.destroy();
        balaInimiga.destroy();
        this.explosao(bala.x, bala.y, 0xfff176, 4);
    }

    /* =================================================================
       ETAPA 3 — INIMIGOS: soldado terrestre, drone voador e robô saltador!
       ================================================================= */

    /* ---------------------------------------------------------------
       tentarSpawnarInimigo() — roda toda vez que o timer dispara.
       Sorteia entre 3 tipos diferentes de robôs:
         - 40% chance: Soldado Robô (anda e atira reto)
         - 35% chance: Drone Voador (aéreo, desvia e atira plasma verde)
         - 25% chance: Robô Saltador (pernas de mola, pula obstáculos!)
       --------------------------------------------------------------- */
    tentarSpawnarInimigo() {
        if (this.acabou || this.vitorioso || this.chefeCriado) return;
        if (this.inimigos.countActive() >= MAX_INIMIGOS) return;
        if (this.jogador.x > X_GATILHO_CHEFE) return; // perto do chefão, não spawna

        // nasce FORA da tela, à direita — o jogador nem vê ele aparecer!
        const x = this.cameras.main.scrollX + LARGURA_TELA + Phaser.Math.Between(40, 140);
        const sorteio = Phaser.Math.Between(1, 100);

        if (sorteio <= 40) {
            this.criarInimigo(x);
        } else if (sorteio <= 75) {
            this.criarVoador(x, Phaser.Math.Between(260, 370));
        } else {
            this.criarPulador(x);
        }
    }

    /* ---------------------------------------------------------------
       criarInimigo(x) — Soldado Robô Vermelho (terrestre, patrulha).
       --------------------------------------------------------------- */
    criarInimigo(x) {
        const robo = this.add.sprite(x, TOPO_CHAO - 2, 'inimigo-1').setOrigin(0.5, 1);
        this.physics.add.existing(robo);
        robo.body.setCollideWorldBounds(true);
        robo.body.setSize(26, 58);
        robo.body.setOffset(11, 6);
        robo.tipo = 'soldado';
        robo.vida = VIDA_INIMIGO;
        robo.pontos = PONTOS_INIMIGO;
        robo.corExplosao = 0xff7043;
        robo.proximoTiro = this.time.now + Phaser.Math.Between(800, 2000);
        robo.tempoAnim = 0;
        robo.texturaAtual = 'inimigo-1';
        this.physics.add.collider(robo, this.chaoFisico);
        this.inimigos.add(robo);
        return robo;
    }

    /* ---------------------------------------------------------------
       criarVoador(x, y) — Drone Voador 🚁
       Voa no ar (sem gravidade!), oscila na vertical com senoide e
       atira esferas de plasma verde em direção ao herói.
       --------------------------------------------------------------- */
    criarVoador(x, y = 320) {
        const robo = this.add.sprite(x, y, 'voador-1').setOrigin(0.5, 0.5);
        this.physics.add.existing(robo);
        this.inimigos.add(robo);           // adiciona ao grupo primeiro
        robo.body.setCollideWorldBounds(false);
        robo.body.setAllowGravity(false); // ⚠️ desativa gravidade DEPOIS de entrar no grupo
        robo.body.setSize(38, 22);
        robo.body.setOffset(5, 5);
        robo.tipo = 'voador';
        robo.vida = VIDA_VOADOR;
        robo.pontos = PONTOS_VOADOR;
        robo.corExplosao = 0x00e676; // partículas verdes de plasma
        robo.yBase = y;
        robo.faseSeno = Math.random() * Math.PI * 2;
        robo.proximoTiro = this.time.now + Phaser.Math.Between(900, 2200);
        robo.tempoAnim = 0;
        robo.texturaAtual = 'voador-1';
        return robo;
    }

    /* ---------------------------------------------------------------
       criarPulador(x) — Robô Saltador 🦘
       Tem pernas de mola zigzag: anda e salta alto no ar periodicamente,
       passando por cima dos tiros rasteiros e plataformas!
       --------------------------------------------------------------- */
    criarPulador(x) {
        const robo = this.add.sprite(x, TOPO_CHAO - 2, 'pulador-1').setOrigin(0.5, 1);
        this.physics.add.existing(robo);
        robo.body.setCollideWorldBounds(true);
        robo.body.setSize(26, 56);
        robo.body.setOffset(11, 8);
        robo.tipo = 'pulador';
        robo.vida = VIDA_PULADOR;
        robo.pontos = PONTOS_PULADOR;
        robo.corExplosao = 0xffa726; // partículas âmbar/douradas
        robo.proximoPulo = this.time.now + Phaser.Math.Between(1000, 2400);
        robo.tempoAnim = 0;
        robo.texturaAtual = 'pulador-1';
        this.physics.add.collider(robo, this.chaoFisico);
        this.inimigos.add(robo);
        return robo;
    }

    /* ---------------------------------------------------------------
       atualizarInimigos() — IA dos 3 tipos de inimigos a cada frame:
       - Soldado: anda no chão e atira reto se herói estiver perto;
       - Drone: voa com ondulação senoidal, hélices giram e atira plasma;
       - Saltador: anda no chão e pula alto no ar (mola).
       --------------------------------------------------------------- */
    atualizarInimigos() {
        this.inimigos.getChildren().forEach((robo) => {
            if (!robo.active) return;

            // robô que ficou para trás da tela sai de cena
            if (robo.x < this.cameras.main.scrollX - 80) {
                robo.destroy();
                return;
            }

            // ===== 1) SOLDADO ROBÔ (terrestre) =====
            if (robo.tipo === 'soldado') {
                robo.body.setVelocityX(-VEL_INIMIGO);

                // animação de andar (troca de textura a cada 180 ms)
                if (this.time.now > robo.tempoAnim) {
                    robo.tempoAnim = this.time.now + 180;
                    if (robo.texturaAtual === 'inimigo-atirando') {
                        robo.setTexture('inimigo-1');
                        robo.texturaAtual = 'inimigo-1';
                    } else {
                        const nova = robo.texturaAtual === 'inimigo-1' ? 'inimigo-2' : 'inimigo-1';
                        robo.setTexture(nova);
                        robo.texturaAtual = nova;
                    }
                }

                // atira reto se herói estiver perto
                const distancia = Phaser.Math.Distance.Between(
                    robo.x, robo.y, this.jogador.x, this.jogador.y);
                if (distancia < DISTANCIA_TIRO_INIMIGO && this.time.now > robo.proximoTiro) {
                    robo.proximoTiro = this.time.now + Phaser.Math.Between(1300, 2400);
                    this.inimigoAtirar(robo);
                }
            }

            // ===== 2) DRONE VOADOR (aéreo) =====
            else if (robo.tipo === 'voador') {
                robo.body.setVelocityX(-VEL_VOADOR);
                // ondulação suave vertical (senóide):
                const ondula = Math.sin((this.time.now / 350) + robo.faseSeno) * 45;
                robo.body.setVelocityY(ondula);

                // hélice girando (alterna rápido entre voador-1 e voador-2)
                if (this.time.now > robo.tempoAnim) {
                    robo.tempoAnim = this.time.now + 90;
                    const nova = robo.texturaAtual === 'voador-1' ? 'voador-2' : 'voador-1';
                    robo.setTexture(nova);
                    robo.texturaAtual = nova;
                }

                // atira plasma verde se herói estiver no alcance
                const distancia = Phaser.Math.Distance.Between(
                    robo.x, robo.y, this.jogador.x, this.jogador.y);
                if (distancia < DISTANCIA_TIRO_VOADOR && this.time.now > robo.proximoTiro) {
                    robo.proximoTiro = this.time.now + Phaser.Math.Between(1600, 2800);
                    this.voadorAtirar(robo);
                }
            }

            // ===== 3) ROBÔ SALTADOR (mola) =====
            else if (robo.tipo === 'pulador') {
                robo.body.setVelocityX(-VEL_PULADOR);

                const noChao = robo.body.blocked.down;

                // pulo com mola!
                if (noChao && this.time.now > robo.proximoPulo) {
                    robo.proximoPulo = this.time.now + Phaser.Math.Between(1400, 2600);
                    robo.body.setVelocityY(FORCA_PULO_PULADOR);
                    this.som('pulo');
                }

                // animação: no ar usa pose de pulo; no chão anda
                if (!noChao) {
                    if (robo.texturaAtual !== 'pulador-pulando') {
                        robo.setTexture('pulador-pulando');
                        robo.texturaAtual = 'pulador-pulando';
                    }
                } else {
                    if (this.time.now > robo.tempoAnim) {
                        robo.tempoAnim = this.time.now + 160;
                        const nova = robo.texturaAtual === 'pulador-1' ? 'pulador-2' : 'pulador-1';
                        robo.setTexture(nova);
                        robo.texturaAtual = nova;
                    }
                }
            }
        });
    }

    /* ---------------------------------------------------------------
       inimigoAtirar() — o soldado atira uma bala vermelha para a esquerda.
       --------------------------------------------------------------- */
    inimigoAtirar(robo) {
        const bala = this.balasInimigas.create(robo.x - 28, robo.y - 34, 'bala-inimiga');
        bala.body.setAllowGravity(false);
        bala.body.setVelocityX(-VEL_BALA_INIMIGA);

        // pose de atirando + flash vermelho na ponta da arma
        robo.setTexture('inimigo-atirando');
        robo.texturaAtual = 'inimigo-atirando';
        robo.tempoAnim = this.time.now + 250;

        const flash = this.add.image(robo.x - 28, robo.y - 34, 'flash');
        flash.setTint(0xff5252);
        flash.setScale(0.6);
        this.tweens.add({
            targets: flash, scale: 1.4, alpha: 0, duration: 90,
            onComplete: () => flash.destroy(),
        });

        this.som('tiroInimigo');   // 🔊 tiro do robô
    }

    /* ---------------------------------------------------------------
       voadorAtirar() — o drone atira esfera de plasma verde em direção
       ao herói (tiro angulado!).
       --------------------------------------------------------------- */
    voadorAtirar(robo) {
        const bala = this.balasInimigas.create(robo.x, robo.y + 12, 'bala-voador');
        bala.body.setAllowGravity(false);

        // mira no peito do herói
        const angulo = Math.atan2((this.jogador.y - 30) - robo.y, this.jogador.x - robo.x);
        bala.body.setVelocity(
            Math.cos(angulo) * VEL_BALA_INIMIGA,
            Math.sin(angulo) * VEL_BALA_INIMIGA
        );

        // flash verde na ponta do canhão do drone
        const flash = this.add.image(robo.x, robo.y + 16, 'flash');
        flash.setTint(0x00e676);
        flash.setScale(0.7);
        this.tweens.add({
            targets: flash, scale: 1.5, alpha: 0, duration: 90,
            onComplete: () => flash.destroy(),
        });

        this.som('tiroInimigo');
    }

    /* =================================================================
       ETAPA 4 — DANO: quando as balas acertam
       ================================================================= */

    /* ---------------------------------------------------------------
       balaAcertouInimigo() — bala do herói encontra qualquer robô.
       --------------------------------------------------------------- */
    balaAcertouInimigo(bala, inimigo) {
        if (!inimigo.active) return;
        bala.destroy();
        inimigo.vida -= DANO_BALA;

        // feedback visual: o robô pisca branco quando leva tiro
        inimigo.setTint(0xffffff);
        this.time.delayedCall(80, () => {
            if (inimigo.active) inimigo.clearTint();
        });

        if (inimigo.vida <= 0) this.derrotarInimigo(inimigo);
    }

    /* ---------------------------------------------------------------
       derrotarInimigo() — explosão colorida, pontos dinâmicos e adeus!
       --------------------------------------------------------------- */
    derrotarInimigo(inimigo) {
        const pontos = inimigo.pontos || PONTOS_INIMIGO;
        const cor = inimigo.corExplosao || 0xff7043;
        const offY = inimigo.tipo === 'voador' ? 0 : 20;

        this.explosao(inimigo.x, inimigo.y - offY, cor, 16);
        this.pontos += pontos;
        this.inimigosDerrotados++;
        this.mostrarPontosFlutuantes(inimigo.x, inimigo.y - 40, '+' + pontos);
        this.atualizarHUD();
        inimigo.destroy();
    }

    /* ---------------------------------------------------------------
       balaAcertouJogador() — bala inimiga encontra o herói.
       --------------------------------------------------------------- */
    balaAcertouJogador(jogador, bala) {
        bala.destroy();
        this.levarDano(jogador, bala.x);
    }

    /* ---------------------------------------------------------------
       contatoComInimigo() — encostar no robô também machuca!
       (No Metal Slug não dá para pisar no inimigo — encostou, levou!)
       --------------------------------------------------------------- */
    contatoComInimigo(jogador, inimigo) {
        if (!inimigo.active || this.invencivel) return;
        this.levarDano(jogador, inimigo.x);
    }

    /* ---------------------------------------------------------------
       levarDano() — o herói perde 1 coração e fica invencível por um
       tempo (fica piscando). Se acabar as vidas: GAME OVER.
       🛡️ "Invencibilidade temporária" nos jogos é chamada de i-frames!
       --------------------------------------------------------------- */
    levarDano(jogador, xDoAtaque) {
        if (this.invencivel || this.acabou || this.vitorioso) return;
        this.invencivel = true;

        this.vidas--;
        this.atualizarCoracoes();

        // feedback: tela treme, herói fica vermelho, som de impacto
        this.cameras.main.shake(220, 0.01);
        this.jogador.setTint(0xff6b6b);
        this.som('dano');   // 🔊 "ai!"
        this.time.delayedCall(250, () => this.jogador.clearTint());

        // knockback: empurra o herói para longe de quem atacou
        const direcao = jogador.x < xDoAtaque ? -1 : 1;
        jogador.body.setVelocityX(320 * direcao);
        jogador.body.setVelocityY(-380);

        // sem vidas? fim de jogo!
        if (this.vidas <= 0) {
            jogador.body.setVelocity(0, 0);
            this.time.delayedCall(700, () => this.gameOver());
            return;
        }

        // invencibilidade: o herói fica piscando por TEMPO_INVENCIVEL ms
        this.tweenPisca = this.tweens.add({
            targets: this.jogador, alpha: 0.35, duration: 90,
            yoyo: true, repeat: -1,
        });
        this.time.delayedCall(TEMPO_INVENCIVEL, () => {
            if (this.tweenPisca) this.tweenPisca.stop();
            this.jogador.setAlpha(1);
            this.invencivel = false;
        });
    }

    /* =================================================================
       ETAPA 5 — O CHEFÃO: tanque no fim do mundo + barra de vida
       ================================================================= */

    /* ---------------------------------------------------------------
       criarChefao() — quando o herói chega perto do fim do mundo,
       o tanque aparece! A partir daí, a fase é só do chefão.
       --------------------------------------------------------------- */
    criarChefao() {
        this.chefeCriado = true;

        this.chefao = this.add.sprite(X_CHEFE, TOPO_CHAO - 2, 'chefao-1').setOrigin(0.5, 1);
        this.physics.add.existing(this.chefao);
        this.chefao.body.setSize(150, 82);
        this.chefao.body.setOffset(13, 30);
        this.chefao.body.setImmovable(true);      // o tanque não é empurrado pelo herói
        // 💡⚠️ CUIDADO: corpo IMÓVEL + gravidade = atravessa o chão! (no motor
        // Arcade, dois corpos "imóveis" não se resolvem — o chão é imóvel!)
        // Por isso o tanque não tem gravidade: ele fica "em pé" na altura do
        // chão e anda só com a velocidade horizontal. Experimente tirar esta
        // linha e veja o tanque cair! 🪂
        this.chefao.body.setAllowGravity(false);
        this.chefao.vida = VIDA_CHEFE;
        this.chefao.vidaMaxima = VIDA_CHEFE;
        this.chefao.proximoTiro = this.time.now + 1200;
        this.chefao.tempoAnim = 0;
        this.chefao.texturaAtual = '';

        this.physics.add.collider(this.jogador, this.chefao);   // não atravessa
        this.physics.add.overlap(this.balas, this.chefao, this.balaAcertouChefao, null, this);
        this.physics.add.overlap(this.jogador, this.chefao, this.contatoComChefao, null, this);

        // os robôs que sobraram se recolhem com explosões coloridas
        this.inimigos.getChildren().forEach((robo) => {
            const cor = robo.corExplosao || 0xef5350;
            const offY = robo.tipo === 'voador' ? 0 : 20;
            this.explosao(robo.x, robo.y - offY, cor, 8);
            robo.destroy();
        });

        // HUD do chefão aparece (barra vermelha no topo)
        this.textoChefe.setVisible(true);
        this.barraChefeFundo.setVisible(true);
        this.barraChefe.setVisible(true);

        // impacto de aparição: tela treme + aviso piscando
        this.cameras.main.shake(400, 0.012);
        const aviso = this.add.text(LARGURA_TELA / 2, ALTURA_TELA / 2 - 60, 'O CHEFÃO CHEGOU!', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '54px',
            color: '#ff6b6b', stroke: '#2a0000', strokeThickness: 12,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2000);
        this.tweens.add({
            targets: aviso, scale: 1.25, duration: 250, yoyo: true,
            onComplete: () => {
                this.tweens.add({
                    targets: aviso, alpha: 0, duration: 600,
                    onComplete: () => aviso.destroy(),
                });
            },
        });

        console.log('O chefão entrou em cena! Vida do tanque: ' + VIDA_CHEFE);
    }

    /* ---------------------------------------------------------------
       atualizarChefao() — o cérebro do tanque: anda devagar até perto
       do herói, anima as esteiras e metralha com o canhão.
       --------------------------------------------------------------- */
    atualizarChefao() {
        const c = this.chefao;
        if (!c || !c.active) return;

        // anda para a esquerda, mas para quando chega perto do herói
        if (c.x > this.jogador.x + 260) c.body.setVelocityX(-VEL_CHEFE);
        else c.body.setVelocityX(0);

        // animação das esteiras (rodas girando)
        if (this.time.now > c.tempoAnim) {
            c.tempoAnim = this.time.now + 220;
            const nova = c.texturaAtual === 'chefao-1' ? 'chefao-2' : 'chefao-1';
            c.setTexture(nova);
            c.texturaAtual = nova;
        }

        // tiro do canhão (respeita a cadência)
        if (this.time.now > c.proximoTiro) {
            c.proximoTiro = this.time.now + CADENCIA_TIRO_CHEFE;
            const bala = this.balasInimigas.create(c.x - 92, c.y - 90, 'bala-chefe');
            bala.body.setAllowGravity(false);
            bala.body.setVelocityX(-VEL_BALA_CHEFE);

            const flash = this.add.image(c.x - 92, c.y - 90, 'flash');
            flash.setTint(0xff5252);
            flash.setScale(1.1);
            this.tweens.add({
                targets: flash, scale: 2.2, alpha: 0, duration: 120,
                onComplete: () => flash.destroy(),
            });

            this.som('tiroChefe');   // 🔊 "BOOM" do canhão
        }

        // barra de vida do chefão encolhe conforme ele apanha
        this.barraChefe.displayWidth = 300 * (c.vida / c.vidaMaxima);
    }

    /* ---------------------------------------------------------------
       balaAcertouChefao() — cada bala do herói arranca 1 de vida.

       💡⚠️ ARMADILHA DA ORDEM DOS ARGUMENTOS! Quando registramos um
       overlap entre um GRUPO e um SPRITE (this.balas × this.chefao), o
       Phaser chama o callback na ordem (SPRITE, MEMBRO DO GRUPO) — ou
       seja, (chefao, bala), NÃO (bala, chefao)! Se inverter, o
       bala.destroy() destrói o tanque em vez da bala. 😱 Compare com
       balaAcertouInimigo(bala, inimigo), que é grupo×grupo e aí a ordem
       é a ordem do registro. Cada tipo de colisão tem sua ordem!
       --------------------------------------------------------------- */
    balaAcertouChefao(chefao, bala) {
        bala.destroy();
        chefao.vida--;
        chefao.setTint(0xffffff);
        this.time.delayedCall(70, () => {
            if (chefao.active) chefao.clearTint();
        });
        this.barraChefe.displayWidth = 300 * (chefao.vida / chefao.vidaMaxima);
        if (chefao.vida <= 0) this.derrotarChefao();
    }

    contatoComChefao(jogador, chefao) {
        if (this.invencivel) return;
        this.levarDano(jogador, chefao.x);
    }

    /* ---------------------------------------------------------------
       derrotarChefao() — tanque destruído = VITÓRIA! 🎉
       --------------------------------------------------------------- */
    derrotarChefao() {
        const c = this.chefao;
        this.explosao(c.x, c.y - 40, 0xffa726, 26);
        this.explosao(c.x - 40, c.y - 20, 0xff7043, 18);
        this.explosao(c.x + 40, c.y - 30, 0xffee58, 18);
        this.cameras.main.flash(500, 255, 200, 80);
        this.cameras.main.shake(600, 0.02);

        this.pontos += PONTOS_CHEFE;
        this.atualizarHUD();

        c.destroy();
        this.chefao = null;

        this.time.delayedCall(1400, () => this.vitoria());
    }

    /* =================================================================
       ETAPA 6 — EFEITOS: partículas + SONS (juice! 🍋🔊)
       ================================================================= */

    /* ---------------------------------------------------------------
       explosao() — partículas são quadradinhos coloridos que voam
       para todos os lados e somem. É o "tempero" que deixa o jogo
       gostoso de jogar (os profissionais chamam de "game feel"/"juice").
       Cada partícula é um image + um tween (animação automática).
       --------------------------------------------------------------- */
    explosao(x, y, cor, quantidade = 12) {
        this.som('explosao');   // 💥 a explosão também faz barulho!
        for (let i = 0; i < quantidade; i++) {
            const p = this.add.image(x, y, 'particula');
            p.setTint(cor);
            p.setDepth(50);
            const angulo = Phaser.Math.Between(0, 360);
            const distancia = Phaser.Math.Between(40, 160);
            const rad = angulo * Math.PI / 180;
            this.tweens.add({
                targets: p,
                x: x + Math.cos(rad) * distancia,
                y: y + Math.sin(rad) * distancia * 0.6 + 30,
                alpha: 0,
                scale: 0.1,
                duration: Phaser.Math.Between(350, 750),
                onComplete: () => p.destroy(),
            });
        }
    }

    /* ---------------------------------------------------------------
       mostrarPontosFlutuantes() — o "+100" que sobe e some quando
       você derrota um inimigo (feedback instantâneo! ⚡)
       --------------------------------------------------------------- */
    mostrarPontosFlutuantes(x, y, texto) {
        const aviso = this.add.text(x, y, texto, {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '30px',
            color: COR_DESTAQUE, stroke: '#3a2a00', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(1000);
        this.tweens.add({
            targets: aviso, y: aviso.y - 60, alpha: 0, duration: 700,
            onComplete: () => aviso.destroy(),
        });
    }

    /* ---------------------------------------------------------------
       criarSons() — os EFEITOS SONOROS, feitos em código! 🔊
       Não usamos ARQUIVOS de áudio: cada som é sintetizado na hora com
       a Web Audio API (um "oscilador" é como uma voz do computador que
       toca uma certa frequência). Som nada mais é do que ONDA sonora —
       igual uma flauta, um apito ou um trovão! Assim o jogo continua
       abrindo em qualquer lugar, sem baixar NADA. 🎵

       💡 O navegador só deixa tocar áudio depois da 1ª tecla ou clique
       do jogador (regra de "autoplay"). Por isso destravamos no 1º
       keydown/pointerdown — e de novo dentro do som(), por garantia.
       --------------------------------------------------------------- */
    criarSons() {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        // se a cena reiniciar (tecla R), reaproveitamos o mesmo "estúdio"
        if (!this.audio) this.audio = new AudioCtx();

        const destravar = () => {
            if (this.audio && this.audio.state === 'suspended') this.audio.resume();
            // a 1ª tecla também liga a MÚSICA DE FUNDO (agora que o áudio destravou!)
            if (!this.musicaIniciada) {
                this.musicaIniciada = true;
                this.tocarMusica();
            }
        };
        this.input.keyboard.on('keydown', destravar);
        this.input.on('pointerdown', destravar);
    }

    /* ---------------------------------------------------------------
       som(nome) — toca um efeito sonoro sintetizado na hora. 🎶
       Cada som é uma "receita": um oscilador (a onda) ligada num ganho
       (o volume) que nasce alto e morre rápido — o tal do envelope!
       Os nomes: pulo, tiro, tiroInimigo, tiroChefe, explosao, dano,
       vitoria e gameover.
       --------------------------------------------------------------- */
    som(nome) {
        if (!this.audio) return;
        if (this.audio.state === 'suspended') this.audio.resume();
        const ctx = this.audio;
        const agora = ctx.currentTime;

        // 🎚️ envelope: o volume nasce no máximo e cai até quase zero
        const envelope = (ganho, duracao) => {
            const g = ctx.createGain();
            g.gain.setValueAtTime(ganho, agora);
            g.gain.exponentialRampToValueAtTime(0.001, agora + duracao);
            return g;
        };

        // 🎹 nota musical: uma frequência tocando por um tempinho
        const nota = (freq, inicio, duracao, tipo, ganho) => {
            const osc = ctx.createOscillator();
            osc.type = tipo;
            osc.frequency.setValueAtTime(freq, inicio);
            const g = ctx.createGain();
            g.gain.setValueAtTime(ganho, inicio);
            g.gain.exponentialRampToValueAtTime(0.001, inicio + duracao);
            osc.connect(g).connect(ctx.destination);
            osc.start(inicio);
            osc.stop(inicio + duracao + 0.05);
        };

        if (nome === 'pulo') {
            // som de mola: frequência subindo rapidinho
            const osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(280, agora);
            osc.frequency.exponentialRampToValueAtTime(520, agora + 0.09);
            osc.connect(envelope(0.08, 0.1)).connect(ctx.destination);
            osc.start(agora);
            osc.stop(agora + 0.12);
        } else if (nome === 'tiro') {
            // "pew!" — frequência descendo rápido (efeito laser)
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(950, agora);
            osc.frequency.exponentialRampToValueAtTime(140, agora + 0.12);
            osc.connect(envelope(0.1, 0.14)).connect(ctx.destination);
            osc.start(agora);
            osc.stop(agora + 0.16);
        } else if (nome === 'tiroInimigo') {
            const osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(480, agora);
            osc.frequency.exponentialRampToValueAtTime(90, agora + 0.16);
            osc.connect(envelope(0.08, 0.18)).connect(ctx.destination);
            osc.start(agora);
            osc.stop(agora + 0.2);
        } else if (nome === 'tiroChefe') {
            // "BOOM" grave do canhão do tanque
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(260, agora);
            osc.frequency.exponentialRampToValueAtTime(50, agora + 0.28);
            osc.connect(envelope(0.18, 0.32)).connect(ctx.destination);
            osc.start(agora);
            osc.stop(agora + 0.35);
        } else if (nome === 'explosao') {
            // 💥 chiado de ruído (filtrado) + um "bum" grave de tanque
            const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
            const dados = buffer.getChannelData(0);
            for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;
            const fonte = ctx.createBufferSource();
            fonte.buffer = buffer;
            const filtro = ctx.createBiquadFilter();
            filtro.type = 'lowpass';
            filtro.frequency.setValueAtTime(1400, agora);
            filtro.frequency.exponentialRampToValueAtTime(80, agora + 0.4);
            fonte.connect(filtro).connect(envelope(0.22, 0.45)).connect(ctx.destination);
            fonte.start(agora);
            fonte.stop(agora + 0.5);
            nota(130, agora, 0.4, 'sine', 0.25);   // o "bum" grave
        } else if (nome === 'dano') {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(420, agora);
            osc.frequency.exponentialRampToValueAtTime(70, agora + 0.3);
            osc.connect(envelope(0.15, 0.32)).connect(ctx.destination);
            osc.start(agora);
            osc.stop(agora + 0.35);
        } else if (nome === 'vitoria') {
            // 🎺 "tá-dá-dááám!" — 3 notas SUBINDO (Dó-Mi-Sol)
            nota(523, agora, 0.16, 'square', 0.1);
            nota(659, agora + 0.16, 0.16, 'square', 0.1);
            nota(784, agora + 0.32, 0.4, 'square', 0.12);
        } else if (nome === 'gameover') {
            // 🎺 3 notas DESCENDO — "tchã-tchã-tchããám..."
            nota(392, agora, 0.28, 'sawtooth', 0.1);
            nota(311, agora + 0.28, 0.28, 'sawtooth', 0.1);
            nota(247, agora + 0.56, 0.5, 'sawtooth', 0.1);
        }
    }

    /* ---------------------------------------------------------------
       tocarMusica() — a MÚSICA DE FUNDO: uma melodia simples de 8
       notas em loop, tocada com um timer. É um "chiptune" — aquele
       som de videogame antigo, feito só com osciladores! 🎶🎮
       Começa na 1ª tecla (quando o navegador destrava o áudio) e
       para sozinha no game over / na vitória.
       --------------------------------------------------------------- */
    tocarMusica() {
        if (!this.audio) return;
        if (this.timerMusica) this.timerMusica.remove();  // se reiniciou, limpa o timer antigo
        const melodia = [262, 330, 392, 523, 392, 330, 262, 220];  // Dó-Mi-Sol-Dó-Mi-Dó-Lá-Sol
        let i = 0;
        this.timerMusica = this.time.addEvent({
            delay: 260, loop: true,
            callback: () => {
                if (this.acabou || this.vitorioso) return;   // jogo acabou: a música para
                const ctx = this.audio;
                const agora = ctx.currentTime;
                const osc = ctx.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(melodia[i % melodia.length], agora);
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.045, agora);
                g.gain.exponentialRampToValueAtTime(0.001, agora + 0.22);
                osc.connect(g).connect(ctx.destination);
                osc.start(agora);
                osc.stop(agora + 0.25);
                i++;
            },
        });
    }

    /* =================================================================
       ETAPA 7 — HUD: vidas, pontos, barra de progresso e barra do chefão
       ================================================================= */

    /* ---------------------------------------------------------------
       criarHUD() — a interface fixa no topo da tela.
       ⚠️ setScrollFactor(0) em TUDO: o HUD não pode andar junto com
       a câmera — ele precisa ficar pregado no canto da tela!
       --------------------------------------------------------------- */
    criarHUD() {
        // faixa escura atrás do HUD (ajuda a ler sobre qualquer cenário)
        this.add.rectangle(LARGURA_TELA / 2, 52, LARGURA_TELA, 104, 0x000000, 0.25)
            .setScrollFactor(0).setDepth(999);

        // corações (vidas), à esquerda
        this.coracoes = [];
        for (let i = 0; i < VIDAS_INICIAIS; i++) {
            const coracao = this.add.image(60 + i * 60, 62, 'coracao')
                .setScrollFactor(0).setDepth(1000);
            coracao.setScale(0.75);
            this.coracoes.push(coracao);
        }

        // pontos e robôs derrotados, à direita
        this.textoPontos = this.add.text(LARGURA_TELA - 40, 36, 'PONTOS: 0', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '30px',
            color: COR_DESTAQUE, stroke: COR_CONTORNO, strokeThickness: 6,
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);

        this.textoRobos = this.add.text(LARGURA_TELA - 40, 80, 'ROBÔS: 0', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '24px',
            color: '#c9d4ff', stroke: COR_CONTORNO, strokeThickness: 6,
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);

        // barra de progresso "META" no centro do topo
        this.add.text(LARGURA_TELA / 2, 14, 'META', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '22px',
            color: COR_TEXTO, stroke: COR_CONTORNO, strokeThickness: 6,
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1000);

        this.add.rectangle(LARGURA_TELA / 2 - 152, 66, 304, 18, 0x000000, 0.5)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(1000);
        this.barraMetaFundo = this.add.rectangle(LARGURA_TELA / 2 - 150, 66, 300, 14, 0x263238)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(1000);
        this.barraMeta = this.add.rectangle(LARGURA_TELA / 2 - 150, 66, 0, 14, 0x7cb342)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);

        // barra de vida do CHEFÃO (escondida até ele aparecer)
        this.textoChefe = this.add.text(LARGURA_TELA / 2, 96, 'CHEFÃO', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '22px',
            color: '#ff8a80', stroke: COR_CONTORNO, strokeThickness: 6,
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1001).setVisible(false);

        this.barraChefeFundo = this.add.rectangle(LARGURA_TELA / 2 - 150, 128, 300, 14, 0x263238)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001).setVisible(false);
        this.barraChefe = this.add.rectangle(LARGURA_TELA / 2 - 150, 128, 300, 14, 0xe53935)
            .setOrigin(0, 0.5).setScrollFactor(0).setDepth(1002).setVisible(false);
    }

    /* ---------------------------------------------------------------
       atualizarHUD() — refresh dos textos quando os pontos mudam.
       --------------------------------------------------------------- */
    atualizarHUD() {
        this.textoPontos.setText('PONTOS: ' + this.pontos);
        this.textoRobos.setText('ROBÔS: ' + this.inimigosDerrotados);
    }

    /* ---------------------------------------------------------------
       atualizarCoracoes() — mostra só os corações das vidas que sobraram.
       --------------------------------------------------------------- */
    atualizarCoracoes() {
        this.coracoes.forEach((coracao, indice) => {
            coracao.setVisible(indice < this.vidas);
        });
    }

    /* ---------------------------------------------------------------
       mostrarInstrucao() — lembrete dos controles que some sozinho
       depois de alguns segundos (UX: o jogo ensina a jogar! 😊)
       --------------------------------------------------------------- */
    mostrarInstrucao() {
        const texto = this.add.text(LARGURA_TELA / 2, ALTURA_TELA - 50,
            'Setas/A-D: andar  ·  Espaço/W: pular  ·  Z/X: atirar', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '26px',
            color: COR_TEXTO, stroke: COR_CONTORNO, strokeThickness: 6,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

        // pisca para chamar atenção
        this.tweenInstrucao = this.tweens.add({
            targets: texto, alpha: 0.35, duration: 700, yoyo: true, repeat: -1,
        });

        // depois de 6 segundos, some devagar
        this.time.delayedCall(6000, () => {
            if (this.tweenInstrucao) this.tweenInstrucao.stop();
            this.tweens.add({
                targets: texto, alpha: 0, duration: 800,
                onComplete: () => texto.destroy(),
            });
        });
    }

    /* =================================================================
       ETAPA 8 — GAME OVER e VITÓRIA
       ================================================================= */

    /* ---------------------------------------------------------------
       gameOver() — perdeu todas as vidas. Congela a física, mostra o
       painel escuro e permite jogar de novo com R.
       --------------------------------------------------------------- */
    gameOver() {
        this.acabou = true;
        this.physics.pause();              // ❄️ congela o mundo físico
        this.jogador.body.setVelocity(0, 0);
        this.jogador.setTint(0xff6b6b);
        this.som('gameover');              // 🔊 3 notas descendo...

        const painel = this.add.rectangle(LARGURA_TELA / 2, ALTURA_TELA / 2,
            LARGURA_TELA, ALTURA_TELA, 0x0b1020, 0.72).setScrollFactor(0).setDepth(2000);

        this.add.text(LARGURA_TELA / 2, 220, 'GAME OVER', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '86px',
            color: '#ff6b6b', stroke: '#2a0000', strokeThickness: 14,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

        this.add.text(LARGURA_TELA / 2, 330, 'Você fez ' + this.pontos + ' pontos', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '38px',
            color: COR_TEXTO, stroke: COR_CONTORNO, strokeThickness: 8,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

        this.add.text(LARGURA_TELA / 2, 400, 'Robôs derrotados: ' + this.inimigosDerrotados, {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '28px',
            color: '#c9d4ff', stroke: COR_CONTORNO, strokeThickness: 6,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

        const reiniciar = this.add.text(LARGURA_TELA / 2, 520, 'Aperte R para jogar de novo', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '32px',
            color: COR_DESTAQUE, stroke: COR_CONTORNO, strokeThickness: 8,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

        this.tweens.add({
            targets: reiniciar, scale: 1.08, duration: 600,
            ease: 'Sine.inOut', yoyo: true, repeat: -1,
        });

        console.log('GAME OVER! Pontos: ' + this.pontos);
    }

    /* ---------------------------------------------------------------
       vitoria() — derrotou o chefão! 🎉 Mostra o tempo que levou.
       --------------------------------------------------------------- */
    vitoria() {
        this.vitorioso = true;
        this.physics.pause();
        this.jogador.body.setVelocity(0, 0);
        this.jogador.setTexture('heroi-parado');
        this.jogador.clearTint();
        this.som('vitoria');   // 🔊🎺 "tá-dá-dááám!"

        const segundos = Math.floor((this.time.now - this.tempoInicio) / 1000);

        this.add.rectangle(LARGURA_TELA / 2, ALTURA_TELA / 2,
            LARGURA_TELA, ALTURA_TELA, 0x1b5e20, 0.78).setScrollFactor(0).setDepth(2000);

        this.add.text(LARGURA_TELA / 2, 200, 'VOCÊ VENCEU!', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '86px',
            color: '#ffe066', stroke: '#3a2a00', strokeThickness: 14,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

        this.add.text(LARGURA_TELA / 2, 310, 'O tanque foi destruído!', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '36px',
            color: COR_TEXTO, stroke: COR_CONTORNO, strokeThickness: 8,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

        this.add.text(LARGURA_TELA / 2, 380,
            'Pontos: ' + this.pontos + '  ·  Robôs: ' + this.inimigosDerrotados +
            '  ·  Tempo: ' + segundos + 's', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '28px',
            color: '#c9d4ff', stroke: COR_CONTORNO, strokeThickness: 6,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

        const reiniciar = this.add.text(LARGURA_TELA / 2, 510, 'Aperte R para jogar de novo', {
            fontFamily: 'Trebuchet MS, Arial', fontSize: '32px',
            color: COR_DESTAQUE, stroke: COR_CONTORNO, strokeThickness: 8,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

        this.tweens.add({
            targets: reiniciar, scale: 1.08, duration: 600,
            ease: 'Sine.inOut', yoyo: true, repeat: -1,
        });

        console.log('VITÓRIA! Pontos: ' + this.pontos + ' em ' + segundos + 's');
    }

    /* =================================================================
       UPDATE — o "cérebro" que roda ~60 vezes por segundo
       ================================================================= */
    update() {

        // se o jogo acabou ou venceu, ninguém se mexe
        if (this.acabou || this.vitorioso) return;

        // ---- ENTRADA (teclado) ----
        const apertouEsquerda = this.cursors.left.isDown || this.teclas.esq.isDown;
        const apertouDireita = this.cursors.right.isDown || this.teclas.dir.isDown;
        const apertouPulo = this.cursors.up.isDown || this.cursors.space.isDown || this.teclas.cima.isDown;
        const apertouTiro = this.teclas.atirar.isDown || this.teclas.atirar2.isDown;

        // ---- MOVIMENTO DO HERÓI ----
        if (apertouEsquerda) {
            this.jogador.body.setVelocityX(-VEL_ANDAR);
            this.jogador.setFlipX(true);    // vira o desenho para a esquerda
        } else if (apertouDireita) {
            this.jogador.body.setVelocityX(VEL_ANDAR);
            this.jogador.setFlipX(false);   // olha para a direita
        } else {
            this.jogador.body.setVelocityX(0);
        }

        const estaNoChao = this.jogador.body.blocked.down;
        if (apertouPulo && estaNoChao) {
            this.jogador.body.setVelocityY(FORCA_PULO);
            this.som('pulo');
        }

        // ---- TIRO (segurado = atira várias vezes, com cadência) ----
        if (apertouTiro) this.atirar();

        // ---- ANIMAÇÃO DO HERÓI (troca de textura conforme o estado) ----
        let estado = 'parado';
        if (!estaNoChao) estado = 'pulando';
        else if (apertouEsquerda || apertouDireita) estado = 'andando';
        if (this.time.now < this.tempoAteAnimTiro) estado = 'atirando';
        this.animarHeroi(estado);

        // ---- IA DOS INIMIGOS ----
        this.atualizarInimigos();

        // ---- CHEFÃO: aparece quando o herói chega perto do fim ----
        if (!this.chefeCriado && this.jogador.x > X_GATILHO_CHEFE) {
            this.criarChefao();
        }
        if (this.chefao) this.atualizarChefao();

        // ---- LIMPEZA: balas que saem da tela são destruídas ----
        this.limparBalas(this.balas);
        this.limparBalas(this.balasInimigas);

        // ---- PARALLAX: vento nas nuvens ----
        this.nuvens.tilePositionX += 0.4;

        // ---- HUD: barra de progresso da META ----
        const progresso = Phaser.Math.Clamp(this.jogador.x / TAMANHO_MUNDO, 0, 1);
        this.barraMeta.displayWidth = 300 * progresso;
    }

    /* ---------------------------------------------------------------
       animarHeroi(estado) — escolhe qual textura mostrar.
       Só troca quando muda (trocar toda hora deixaria o jogo lento!).
       --------------------------------------------------------------- */
    animarHeroi(estado) {
        let textura;
        if (estado === 'pulando') {
            textura = 'heroi-pulando';
        } else if (estado === 'atirando') {
            textura = 'heroi-atirando';
        } else if (estado === 'andando') {
            // alterna entre os 2 frames de caminhada
            if (this.time.now > this.tempoAnim) {
                this.tempoAnim = this.time.now + 120;
                this.frameAndando = !this.frameAndando;
            }
            textura = this.frameAndando ? 'heroi-andando-1' : 'heroi-andando-2';
        } else {
            textura = 'heroi-parado';
        }

        if (this.texturaHeroi !== textura) {
            this.jogador.setTexture(textura);
            this.texturaHeroi = textura;
        }
    }

    /* ---------------------------------------------------------------
       limparBalas(grupo) — destrói as balas que saíram da tela
       (se não destruir, o jogo vai ficando lento com o tempo! 🐢)
       --------------------------------------------------------------- */
    limparBalas(grupo) {
        const limiteEsq = this.cameras.main.scrollX - 80;
        const limiteDir = this.cameras.main.scrollX + LARGURA_TELA + 80;
        grupo.getChildren().forEach((bala) => {
            if (bala.active && (bala.x < limiteEsq || bala.x > limiteDir)) {
                bala.destroy();
            }
        });
    }
}

/* =====================================================================
   🏆 PARABÉNS! Você terminou o SEGUNDO JOGO — um run and gun completo!
   =====================================================================
   Você aprendeu conceitos que os jogos Metal Slug e Contra usam:
     - mundo largo com SCROLL LATERAL (câmera que segue o herói);
     - tiros com grupo de balas e CADÊNCIA (fire rate);
     - IA inimiga simples (patrulha + tiro com distância);
     - dano, knockback e invencibilidade temporária (i-frames);
     - CHEFÃO com barra de vida no fim da fase;
     - partículas de explosão e "game feel" (juice);
     - HUD fixo na tela com scrollFactor(0).

   🎯 DESAFIOS PARA VOCÊ (do fácil ao difícil):
   1) Deixe o jogo mais fácil: VIDAS_INICIAIS = 5, VIDA_CHEFE = 10.
   2) MUNIÇÃO LIMITADA: conte os tiros (this.tirosRestantes--) e mostre
      no HUD. Quando zerar, precisa esperar 1 segundo para recarregar.
   3) PULO DUPLO: deixe o herói pular de novo no ar (1 vez só).
   4) ESPINGARDA: um tiro que vira 3 balas em leque (use ângulos).
   5) INIMIGO VOADOR: um drone que voa reto e atira para baixo.
   6) MÚSICA: crie uma melodia de fundo em loop (som() já mostra como!).
   7) RECORDE: salve a maior pontuação com localStorage.
   8) PAUSA: tecla P pausa e retoma o jogo (this.physics.pause()).
   9) TELA DE PAUSE com texto "PAUSADO" no meio da tela.
  10) Personalize tudo: cores, velocidades, tamanho do chefão! 🎨
   ===================================================================== */
