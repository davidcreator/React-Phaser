/**
 * ===============================================
 * SISTEMA DE TABULEIRO DO DOMINÓ - tabuleiro.js
 * ===============================================
 * 
 * Este arquivo contém toda a lógica de renderização e desenho:
 * - Renderização das peças no canvas
 * - Desenho do tabuleiro e interface
 * - Efeitos visuais e animações
 * - Sistema de coordenadas e posicionamento
 * 
 * Desenvolvido para fins educacionais
 */

class RendererDomino {
    /**
     * Construtor do renderizador
     * @param {HTMLCanvasElement} canvas - Elemento canvas
     * @param {GerenciadorPecas} gerenciadorPecas - Instância do gerenciador de peças
     */
    constructor(canvas, gerenciadorPecas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pecas = gerenciadorPecas;
        
        // Configurações visuais
        this.COR_FUNDO = '#27ae60';           // Verde da mesa
        this.COR_PECA = '#f8f9fa';            // Cor base das peças
        this.COR_PECA_SELECIONADA = '#ffd700'; // Cor da peça selecionada
        this.COR_PECA_OPONENTE = '#8b4513';   // Cor do verso (IA)
        this.COR_BORDA = '#2c3e50';           // Cor das bordas
        this.COR_PONTOS = '#2c3e50';          // Cor dos pontos
        this.COR_ZONA_DROP = 'rgba(46, 204, 113, 0.3)'; // Zona de soltar
        
        // Configurações de animação
        this.animacoes = new Map();           // Mapa de animações ativas
        this.tempoAnimacao = 300;             // Duração das animações (ms)
        
        // Cache para otimização
        this.cachePatroesPontos = new Map();  // Cache dos padrões de pontos
        
        this.inicializarPatroesPontos();
    }
    
    /**
     * Inicializa os padrões de pontos para cada número (0-6)
     * Cada padrão define as posições relativas dos pontos
     */
    inicializarPatroesPontos() {
        // Definir padrões de pontos para cada valor (0-6)
        this.cachePatroesPontos.set(0, []); // Vazio
        this.cachePatroesPontos.set(1, [[0, 0]]); // Centro
        this.cachePatroesPontos.set(2, [[-1, -1], [1, 1]]); // Diagonal
        this.cachePatroesPontos.set(3, [[-1, -1], [0, 0], [1, 1]]); // Diagonal + centro
        this.cachePatroesPontos.set(4, [[-1, -1], [1, -1], [-1, 1], [1, 1]]); // Cantos
        this.cachePatroesPontos.set(5, [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]]); // Cantos + centro
        this.cachePatroesPontos.set(6, [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]); // Duas colunas
    }
    
    /**
     * Método principal de renderização - desenha todo o jogo
     * @param {Object} estadoJogo - Estado atual do jogo
     */
    renderizar(estadoJogo) {
        // Limpar canvas
        this.limparCanvas();
        
        // Desenhar fundo da mesa
        this.desenharFundo();
        
        // Desenhar instruções iniciais se tabuleiro vazio
        if (this.pecas.tabuleiro.length === 0) {
            this.desenharInstrucoesIniciais();
        }
        
        // Desenhar tabuleiro (peças jogadas)
        this.desenharTabuleiro();
        
        // Desenhar zonas de drop se há peça selecionada
        if (estadoJogo.pecaSelecionada) {
            this.desenharZonasDeposito(estadoJogo.pecaSelecionada);
        }
        
        // Desenhar mão da IA (verso das peças)
        this.desenharMaoIA();
        
        // Desenhar mão do jogador
        this.desenharMaoJogador();
        
        // Desenhar peça sendo arrastada
        if (estadoJogo.arrastando && estadoJogo.pecaArrastada) {
            this.desenharPecaArrastada(estadoJogo.pecaArrastada, estadoJogo.posicaoMouse);
        }
        
        // Desenhar informações adicionais
        this.desenharInformacoesJogo(estadoJogo);
        
        // Desenhar animações ativas
        this.processarAnimacoes();
    }
    
    /**
     * Limpa completamente o canvas
     */
    limparCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Desenha o fundo da mesa de dominó
     */
    desenharFundo() {
        // Gradiente para dar profundidade
        const gradiente = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width / 2
        );
        gradiente.addColorStop(0, '#2ecc71');
        gradiente.addColorStop(1, '#27ae60');
        
        this.ctx.fillStyle = gradiente;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Adicionar textura sutil
        this.adicionarTexturaFundo();
    }
    
    /**
     * Adiciona uma textura sutil ao fundo para simular feltro
     */
    adicionarTexturaFundo() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.1;
        
        // Criar padrão de ruído
        for (let i = 0; i < 200; i++) {
            this.ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
            this.ctx.fillRect(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                2, 2
            );
        }
        
        this.ctx.restore();
    }
    
    /**
     * Desenha instruções para o jogador quando o tabuleiro está vazio
     */
    desenharInstrucoesIniciais() {
        this.ctx.save();
        
        // Configurar texto
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const centroX = this.canvas.width / 2;
        const centroY = this.canvas.height / 2;
        
        // Texto principal
        this.ctx.fillText(
            'Arraste uma peça para o centro para começar',
            centroX, centroY - 20
        );
        
        // Texto secundário
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fillText(
            'Clique com botão direito para comprar do estoque',
            centroX, centroY + 20
        );
        
        // Desenhar área destacada
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        this.ctx.strokeRect(
            centroX - 200, centroY - 100,
            400, 200
        );
        this.ctx.setLineDash([]);
        
        this.ctx.restore();
    }
    
    /**
     * Desenha todas as peças do tabuleiro
     */
    desenharTabuleiro() {
        this.pecas.tabuleiro.forEach((peca, indice) => {
            this.desenharPeca(peca, false, false);
            
            // Desenhar efeito de conexão entre peças
            if (indice > 0) {
                this.desenharConexao(this.pecas.tabuleiro[indice - 1], peca);
            }
        });
    }
    
    /**
     * Desenha uma linha de conexão entre duas peças no tabuleiro
     * @param {PecaDomino} peca1 - Primeira peça
     * @param {PecaDomino} peca2 - Segunda peça
     */
    desenharConexao(peca1, peca2) {
        this.ctx.save();
        
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 3]);
        
        const x1 = peca1.x + this.pecas.LARGURA_PECA;
        const y1 = peca1.y + this.pecas.ALTURA_PECA / 2;
        const x2 = peca2.x;
        const y2 = peca2.y + this.pecas.ALTURA_PECA / 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }
    
    /**
     * Desenha as zonas onde o jogador pode soltar uma peça
     * @param {PecaDomino} pecaSelecionada - Peça que está sendo arrastada
     */
    desenharZonasDeposito(pecaSelecionada) {
        if (this.pecas.tabuleiro.length === 0) {
            // Primeira peça - zona central
            this.desenharZonaCentral();
        } else {
            // Peças nas extremidades
            this.desenharZonasExtremidades(pecaSelecionada);
        }
    }
    
    /**
     * Desenha a zona central para a primeira peça
     */
    desenharZonaCentral() {
        this.ctx.save();
        
        const centroX = this.canvas.width / 2;
        const centroY = this.canvas.height / 2;
        const largura = 300;
        const altura = 200;
        
        // Área destacada
        this.ctx.fillStyle = this.COR_ZONA_DROP;
        this.ctx.fillRect(
            centroX - largura / 2, centroY - altura / 2,
            largura, altura
        );
        
        // Borda pulsante
        this.ctx.strokeStyle = '#2ecc71';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        this.ctx.strokeRect(
            centroX - largura / 2, centroY - altura / 2,
            largura, altura
        );
        this.ctx.setLineDash([]);
        
        // Texto
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Solte aqui', centroX, centroY);
        
        this.ctx.restore();
    }
    
    /**
     * Desenha as zonas nas extremidades do tabuleiro
     * @param {PecaDomino} pecaSelecionada - Peça selecionada
     */
    desenharZonasExtremidades(pecaSelecionada) {
        const extremidades = this.pecas.getExtremidadesTabuleiro();
        const primeiraPeca = this.pecas.tabuleiro[0];
        const ultimaPeca = this.pecas.tabuleiro[this.pecas.tabuleiro.length - 1];
        
        // Zona esquerda
        if (pecaSelecionada.podeConectar(extremidades.esquerda)) {
            this.desenharZonaExtremidade(
                primeiraPeca.x - 50, primeiraPeca.y,
                'esquerda', extremidades.esquerda
            );
        }
        
        // Zona direita
        if (pecaSelecionada.podeConectar(extremidades.direita)) {
            this.desenharZonaExtremidade(
                ultimaPeca.x + this.pecas.LARGURA_PECA + 10, ultimaPeca.y,
                'direita', extremidades.direita
            );
        }
    }
    
    /**
     * Desenha uma zona de extremidade específica
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {string} lado - 'esquerda' ou 'direita'
     * @param {number} valor - Valor da extremidade
     */
    desenharZonaExtremidade(x, y, lado, valor) {
        this.ctx.save();
        
        const largura = 40;
        const altura = this.pecas.ALTURA_PECA + 20;
        
        // Área destacada
        this.ctx.fillStyle = this.COR_ZONA_DROP;
        this.ctx.fillRect(x, y - 10, largura, altura);
        
        // Borda
        this.ctx.strokeStyle = '#2ecc71';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 3]);
        this.ctx.strokeRect(x, y - 10, largura, altura);
        this.ctx.setLineDash([]);
        
        // Número da extremidade
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            valor.toString(),
            x + largura / 2,
            y + this.pecas.ALTURA_PECA / 2
        );
        
        this.ctx.restore();
    }
    
    /**
     * Desenha a mão da IA (verso das peças)
     */
    desenharMaoIA() {
        this.pecas.maoIA.forEach(peca => {
            this.desenharVerso(peca);
        });
        
        // Desenhar contador de peças
        if (this.pecas.maoIA.length > 0) {
            this.desenharContadorPecas(
                this.pecas.maoIA[0].x - 30,
                this.pecas.maoIA[0].y + this.pecas.ALTURA_PECA / 2,
                this.pecas.maoIA.length,
                'IA'
            );
        }
    }
    
    /**
     * Desenha a mão do jogador
     */
    desenharMaoJogador() {
        this.pecas.maoJogador.forEach(peca => {
            const selecionada = peca.selecionada && !peca.arrastando;
            this.desenharPeca(peca, selecionada, false);
        });
        
        // Desenhar contador de peças
        if (this.pecas.maoJogador.length > 0) {
            this.desenharContadorPecas(
                this.pecas.maoJogador[0].x - 30,
                this.pecas.maoJogador[0].y + this.pecas.ALTURA_PECA / 2,
                this.pecas.maoJogador.length,
                'Você'
            );
        }
    }
    
    /**
     * Desenha um contador de peças ao lado da mão
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {number} quantidade - Número de peças
     * @param {string} jogador - Nome do jogador
     */
    desenharContadorPecas(x, y, quantidade, jogador) {
        this.ctx.save();
        
        // Fundo do contador
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x - 15, y - 25, 30, 50);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - 15, y - 25, 30, 50);
        
        // Número
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(quantidade.toString(), x, y - 5);
        
        // Label
        this.ctx.font = '10px Arial';
        this.ctx.fillText(jogador, x, y + 10);
        
        this.ctx.restore();
    }
    
    /**
     * Desenha uma peça sendo arrastada
     * @param {PecaDomino} peca - Peça sendo arrastada
     * @param {Object} posicao - {x, y} posição do mouse
     */
    desenharPecaArrastada(peca, posicao) {
        this.ctx.save();
        
        // Sombra da peça
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;
        
        // Desenhar peça com transparência
        this.ctx.globalAlpha = 0.8;
        const pecaTemp = peca.clonar();
        pecaTemp.setPosicao(
            posicao.x - this.pecas.LARGURA_PECA / 2,
            posicao.y - this.pecas.ALTURA_PECA / 2
        );
        
        this.desenharPeca(pecaTemp, true, false);
        
        this.ctx.restore();
    }
    
    /**
     * Desenha uma peça completa (frente)
     * @param {PecaDomino} peca - Peça a desenhar
     * @param {boolean} selecionada - Se está selecionada
     * @param {boolean} destacada - Se deve ser destacada
     */
    desenharPeca(peca, selecionada = false, destacada = false) {
        if (!peca.visivel) return;
        
        this.ctx.save();
        
        const { x, y } = peca;
        const cor = selecionada ? this.COR_PECA_SELECIONADA : this.COR_PECA;
        
        // Criar gradiente para profundidade
        const gradiente = this.ctx.createLinearGradient(
            x, y, x + this.pecas.LARGURA_PECA, y + this.pecas.ALTURA_PECA
        );
        gradiente.addColorStop(0, cor);
        gradiente.addColorStop(1, this.escurecerCor(cor, 0.1));
        
        // Desenhar corpo da peça
        this.ctx.fillStyle = gradiente;
        this.ctx.fillRect(x, y, this.pecas.LARGURA_PECA, this.pecas.ALTURA_PECA);
        
        // Borda da peça
        this.ctx.strokeStyle = selecionada ? '#ff6b35' : this.COR_BORDA;
        this.ctx.lineWidth = selecionada ? 3 : 2;
        this.ctx.strokeRect(x, y, this.pecas.LARGURA_PECA, this.pecas.ALTURA_PECA);
        
        // Borda interna para efeito 3D
        if (!selecionada) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x + 1, y + 1, this.pecas.LARGURA_PECA - 2, this.pecas.ALTURA_PECA - 2);
        }
        
        // Linha divisória central
        this.ctx.strokeStyle = this.COR_BORDA;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 5, y + this.pecas.ALTURA_PECA / 2);
        this.ctx.lineTo(x + this.pecas.LARGURA_PECA - 5, y + this.pecas.ALTURA_PECA / 2);
        this.ctx.stroke();
        
        // Desenhar valores
        this.desenharValorPeca(x, y, peca.ladoEsquerdo, 'superior');
        this.desenharValorPeca(x, y, peca.ladoDireito, 'inferior');
        
        // Efeito para peça dupla
        if (peca.ehDupla) {
            this.desenharEfeitoDupla(x, y);
        }
        
        // Efeito de destaque se necessário
        if (destacada) {
            this.desenharEfeiteDestaque(x, y);
        }
        
        this.ctx.restore();
    }
    
    /**
     * Desenha o verso de uma peça (para IA)
     * @param {PecaDomino} peca - Peça a desenhar
     */
    desenharVerso(peca) {
        if (!peca.visivel) return;
        
        this.ctx.save();
        
        const { x, y } = peca;
        
        // Gradiente para o verso
        const gradiente = this.ctx.createLinearGradient(
            x, y, x + this.pecas.LARGURA_PECA, y + this.pecas.ALTURA_PECA
        );
        gradiente.addColorStop(0, this.COR_PECA_OPONENTE);
        gradiente.addColorStop(1, this.escurecerCor(this.COR_PECA_OPONENTE, 0.2));
        
        // Desenhar corpo
        this.ctx.fillStyle = gradiente;
        this.ctx.fillRect(x, y, this.pecas.LARGURA_PECA, this.pecas.ALTURA_PECA);
        
        // Borda
        this.ctx.strokeStyle = this.COR_BORDA;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, this.pecas.LARGURA_PECA, this.pecas.ALTURA_PECA);
        
        // Padrão decorativo
        this.desenharPadraoVerso(x, y);
        
        this.ctx.restore();
    }
    
    /**
     * Desenha o padrão decorativo no verso das peças
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     */
    desenharPadraoVerso(x, y) {
        this.ctx.save();
        
        // Fundo interno
        this.ctx.fillStyle = '#daa520';
        this.ctx.fillRect(x + 5, y + 5, this.pecas.LARGURA_PECA - 10, this.pecas.ALTURA_PECA - 10);
        
        // Linhas decorativas
        this.ctx.strokeStyle = this.COR_PECA_OPONENTE;
        this.ctx.lineWidth = 2;
        
        for (let i = 0; i < 4; i++) {
            const yLinha = y + 20 + (i * 20);
            this.ctx.beginPath();
            this.ctx.moveTo(x + 10, yLinha);
            this.ctx.lineTo(x + this.pecas.LARGURA_PECA - 10, yLinha);
            this.ctx.stroke();
        }
        
        // Logo ou símbolo central
        this.ctx.fillStyle = this.COR_PECA_OPONENTE;
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            '🎲',
            x + this.pecas.LARGURA_PECA / 2,
            y + this.pecas.ALTURA_PECA / 2
        );
        
        this.ctx.restore();
    }
    
    /**
     * Desenha o valor (pontos) em uma metade da peça
     * @param {number} x - Posição X da peça
     * @param {number} y - Posição Y da peça
     * @param {number} valor - Valor a desenhar (0-6)
     * @param {string} posicao - 'superior' ou 'inferior'
     */
    desenharValorPeca(x, y, valor, posicao) {
        const centroX = x + this.pecas.LARGURA_PECA / 2;
        const centroY = posicao === 'superior' ? 
            y + this.pecas.ALTURA_PECA / 4 : 
            y + (3 * this.pecas.ALTURA_PECA) / 4;
        
        // Desenhar fundo sutil para os pontos
        if (valor > 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            this.ctx.beginPath();
            this.ctx.arc(centroX, centroY, 18, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Obter padrão de pontos
        const padrao = this.cachePatroesPontos.get(valor) || [];
        const espacoPontos = 8;
        
        // Desenhar cada ponto
        this.ctx.fillStyle = this.COR_PONTOS;
        padrao.forEach(([dx, dy]) => {
            this.ctx.beginPath();
            this.ctx.arc(
                centroX + dx * espacoPontos,
                centroY + dy * espacoPontos,
                this.pecas.RAIO_PONTO,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            // Sombra dos pontos para profundidade
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(
                centroX + dx * espacoPontos + 0.5,
                centroY + dy * espacoPontos + 0.5,
                this.pecas.RAIO_PONTO * 0.8,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            this.ctx.fillStyle = this.COR_PONTOS;
        });
    }
    
    /**
     * Desenha efeito especial para peças duplas
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     */
    desenharEfeiteDupla(x, y) {
        this.ctx.save();
        
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([3, 3]);
        this.ctx.strokeRect(x + 3, y + 3, this.pecas.LARGURA_PECA - 6, this.pecas.ALTURA_PECA - 6);
        this.ctx.setLineDash([]);
        
        this.ctx.restore();
    }
    
    /**
     * Desenha efeito de destaque
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     */
    desenharEfeiteDestaque(x, y) {
        this.ctx.save();
        
        this.ctx.shadowColor = '#3498db';
        this.ctx.shadowBlur = 15;
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x - 2, y - 2, this.pecas.LARGURA_PECA + 4, this.pecas.ALTURA_PECA + 4);
        
        this.ctx.restore();
    }
    
    /**
     * Desenha informações adicionais do jogo
     * @param {Object} estadoJogo - Estado atual do jogo
     */
    desenharInformacoesJogo(estadoJogo) {
        this.desenharStatusJogo(estadoJogo);
        this.desenharInformacoesTabuleiro();
    }
    
    /**
     * Desenha o status atual do jogo
     * @param {Object} estadoJogo - Estado do jogo
     */
    desenharStatusJogo(estadoJogo) {
        this.ctx.save();
        
        // Fundo do status
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, this.canvas.height / 2 - 60, 200, 120);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(10, this.canvas.height / 2 - 60, 200, 120);
        
        // Texto do status
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        let yPos = this.canvas.height / 2 - 50;
        const espaco = 18;
        
        const textos = [
            `Turno: ${estadoJogo.turnoAtual === 0 ? 'Você' : 'IA'}`,
            `Suas peças: ${this.pecas.maoJogador.length}`,
            `Peças IA: ${this.pecas.maoIA.length}`,
            `Estoque: ${this.pecas.estoque.length}`,
            `Movimentos: ${estadoJogo.movimentos || 0}`,
            `Modo: ${estadoJogo.modo || 'Clássico'}`
        ];
        
        textos.forEach(texto => {
            this.ctx.fillText(texto, 20, yPos);
            yPos += espaco;
        });
        
        this.ctx.restore();
    }
    
    /**
     * Desenha informações específicas do tabuleiro
     */
    desenharInformacoesTabuleiro() {
        if (this.pecas.tabuleiro.length === 0) return;
        
        const extremidades = this.pecas.getExtremidadesTabuleiro();
        
        this.ctx.save();
        
        // Mostrar valores das extremidades
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const primeiraPeca = this.pecas.tabuleiro[0];
        const ultimaPeca = this.pecas.tabuleiro[this.pecas.tabuleiro.length - 1];
        
        // Extremidade esquerda
        this.ctx.fillText(
            extremidades.esquerda.toString(),
            primeiraPeca.x - 25,
            primeiraPeca.y - 15
        );
        
        // Extremidade direita
        this.ctx.fillText(
            extremidades.direita.toString(),
            ultimaPeca.x + this.pecas.LARGURA_PECA + 25,
            ultimaPeca.y - 15
        );
        
        this.ctx.restore();
    }
    
    /**
     * Processa e desenha animações ativas
     */
    processarAnimacoes() {
        const agora = Date.now();
        
        this.animacoes.forEach((animacao, id) => {
            const progresso = Math.min((agora - animacao.inicio) / this.tempoAnimacao, 1);
            
            if (progresso >= 1) {
                // Animação completa
                this.animacoes.delete(id);
                if (animacao.callback) animacao.callback();
            } else {
                // Desenhar frame da animação
                this.desenharFrameAnimacao(animacao, progresso);
            }
        });
    }
    
    /**
     * Desenha um frame de animação
     * @param {Object} animacao - Dados da animação
     * @param {number} progresso - Progresso (0-1)
     */
    desenharFrameAnimacao(animacao, progresso) {
        if (animacao.tipo === 'mover') {
            this.animarMovimento(animacao, progresso);
        } else if (animacao.tipo === 'destacar') {
            this.animarDestaque(animacao, progresso);
        }
    }
    
    /**
     * Anima o movimento de uma peça
     * @param {Object} animacao - Dados da animação
     * @param {number} progresso - Progresso da animação
     */
    animarMovimento(animacao, progresso) {
        const { peca, de, para } = animacao;
        
        // Interpolação suave
        const fator = this.easeInOutQuad(progresso);
        peca.x = de.x + (para.x - de.x) * fator;
        peca.y = de.y + (para.y - de.y) * fator;
        
        // Desenhar peça na posição interpolada
        this.desenharPeca(peca, false, true);
    }
    
    /**
     * Anima efeito de destaque
     * @param {Object} animacao - Dados da animação
     * @param {number} progresso - Progresso da animação
     */
    animarDestaque(animacao, progresso) {
        const { peca } = animacao;
        
        this.ctx.save();
        
        const intensidade = Math.sin(progresso * Math.PI * 4) * 0.5 + 0.5;
        this.ctx.shadowColor = `rgba(52, 152, 219, ${intensidade})`;
        this.ctx.shadowBlur = 20;
        
        this.desenharPeca(peca, false, false);
        
        this.ctx.restore();
    }
    
    /**
     * Função de easing para animações suaves
     * @param {number} t - Progresso (0-1)
     * @returns {number} Valor com easing aplicado
     */
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    /**
     * Escurece uma cor hexadecimal
     * @param {string} cor - Cor em formato hex
     * @param {number} fator - Fator de escurecimento (0-1)
     * @returns {string} Cor escurecida
     */
    escurecerCor(cor, fator) {
        const num = parseInt(cor.replace('#', ''), 16);
        const amt = Math.round(2.55 * fator * 100);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        
        return `rgb(${Math.max(R, 0)}, ${Math.max(G, 0)}, ${Math.max(B, 0)})`;
    }
    
    /**
     * Inicia uma animação
     * @param {string} id - ID único da animação
     * @param {string} tipo - Tipo de animação
     * @param {Object} dados - Dados específicos da animação
     * @param {Function} callback - Função a executar ao final
     */
    iniciarAnimacao(id, tipo, dados, callback = null) {
        this.animacoes.set(id, {
            tipo,
            inicio: Date.now(),
            callback,
            ...dados
        });
    }
    
    /**
     * Para uma animação específica
     * @param {string} id - ID da animação
     */
    pararAnimacao(id) {
        this.animacoes.delete(id);
    }
    
    /**
     * Para todas as animações
     */
    pararTodasAnimacoes() {
        this.animacoes.clear();
    }
    
    /**
     * Verifica se há animações em execução
     * @returns {boolean} True se há animações ativas
     */
    temAnimacoesAtivas() {
        return this.animacoes.size > 0;
    }
}