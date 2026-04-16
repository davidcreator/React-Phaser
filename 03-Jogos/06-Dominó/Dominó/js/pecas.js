/**
 * ===============================================
 * SISTEMA DE PEÇAS DO DOMINÓ - pecas.js
 * ===============================================
 * 
 * Este arquivo contém toda a lógica relacionada às peças do dominó:
 * - Criação do conjunto completo de peças
 * - Renderização visual das peças
 * - Manipulação e posicionamento
 * - Cálculos e validações
 * 
 * Desenvolvido para fins educacionais
 */

class PecaDomino {
    /**
     * Construtor da classe PecaDomino
     * @param {number} id - Identificador único da peça
     * @param {number} ladoEsquerdo - Valor do lado esquerdo (0-6)
     * @param {number} ladoDireito - Valor do lado direito (0-6)
     */
    constructor(id, ladoEsquerdo, ladoDireito) {
        // Propriedades básicas da peça
        this.id = id;                          // Identificador único
        this.ladoEsquerdo = ladoEsquerdo;     // Valor lado esquerdo
        this.ladoDireito = ladoDireito;       // Valor lado direito
        
        // Propriedades visuais (posição e rotação)
        this.x = 0;                           // Posição X no canvas
        this.y = 0;                           // Posição Y no canvas
        this.rotacao = 0;                     // Rotação da peça (0 ou 90 graus)
        
        // Propriedades de estado
        this.selecionada = false;             // Se a peça está selecionada
        this.arrastando = false;              // Se está sendo arrastada
        this.visivel = true;                  // Se deve ser desenhada
        
        // Propriedades calculadas
        this.ehDupla = (ladoEsquerdo === ladoDireito);  // Se é uma peça dupla
        this.soma = ladoEsquerdo + ladoDireito;         // Soma dos valores
    }
    
    /**
     * Retorna uma cópia da peça (útil para não modificar a original)
     * @returns {PecaDomino} Nova instância da peça
     */
    clonar() {
        const clone = new PecaDomino(this.id, this.ladoEsquerdo, this.ladoDireito);
        clone.x = this.x;
        clone.y = this.y;
        clone.rotacao = this.rotacao;
        clone.selecionada = this.selecionada;
        clone.arrastando = this.arrastando;
        clone.visivel = this.visivel;
        return clone;
    }
    
    /**
     * Inverte os lados da peça (útil quando encaixamos uma peça)
     */
    inverter() {
        [this.ladoEsquerdo, this.ladoDireito] = [this.ladoDireito, this.ladoEsquerdo];
    }
    
    /**
     * Verifica se a peça pode ser conectada com um determinado valor
     * @param {number} valor - Valor para verificar conexão
     * @returns {boolean} True se pode conectar
     */
    podeConectar(valor) {
        return this.ladoEsquerdo === valor || this.ladoDireito === valor;
    }
    
    /**
     * Retorna o valor do lado oposto ao especificado
     * @param {number} valor - Valor do lado conhecido
     * @returns {number} Valor do lado oposto
     */
    getLadoOposto(valor) {
        if (this.ladoEsquerdo === valor) {
            return this.ladoDireito;
        } else if (this.ladoDireito === valor) {
            return this.ladoEsquerdo;
        }
        return -1; // Valor inválido
    }
    
    /**
     * Define a posição da peça
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     */
    setPosicao(x, y) {
        this.x = x;
        this.y = y;
    }
    
    /**
     * Verifica se um ponto está dentro da área da peça
     * @param {number} pontoX - Coordenada X do ponto
     * @param {number} pontoY - Coordenada Y do ponto
     * @param {number} largura - Largura da peça
     * @param {number} altura - Altura da peça
     * @returns {boolean} True se o ponto está dentro da peça
     */
    contemPonto(pontoX, pontoY, largura = 60, altura = 120) {
        return pontoX >= this.x && 
               pontoX <= this.x + largura && 
               pontoY >= this.y && 
               pontoY <= this.y + altura;
    }
}

/**
 * ===============================================
 * GERENCIADOR DE PEÇAS
 * ===============================================
 * 
 * Classe responsável por gerenciar o conjunto completo de peças,
 * incluindo criação, embaralhamento, distribuição e renderização
 */
class GerenciadorPecas {
    constructor() {
        // Configurações visuais das peças
        this.LARGURA_PECA = 60;     // Largura da peça em pixels
        this.ALTURA_PECA = 120;     // Altura da peça em pixels
        this.RAIO_PONTO = 4;        // Raio dos pontos das peças
        this.ESPACO_PECAS = 10;     // Espaçamento entre peças
        
        // Arrays para armazenar as peças
        this.todasPecas = [];       // Conjunto completo (28 peças)
        this.maoJogador = [];       // Peças do jogador
        this.maoIA = [];           // Peças da IA
        this.tabuleiro = [];       // Peças jogadas no tabuleiro
        this.estoque = [];         // Peças não distribuídas
        
        // Criar conjunto completo de peças
        this.criarConjuntoPecas();
    }
    
    /**
     * Cria o conjunto completo de 28 peças de dominó
     * No dominó tradicional, temos peças de 0-0 até 6-6
     */
    criarConjuntoPecas() {
        this.todasPecas = [];
        let id = 0;
        
        // Criar todas as combinações possíveis
        for (let i = 0; i <= 6; i++) {
            for (let j = i; j <= 6; j++) {
                const peca = new PecaDomino(id++, i, j);
                this.todasPecas.push(peca);
            }
        }
        
        console.log(`✅ Criadas ${this.todasPecas.length} peças de dominó`);
    }
    
    /**
     * Embaralha o array de peças usando o algoritmo Fisher-Yates
     * @param {Array} array - Array para embaralhar
     * @returns {Array} Array embaralhado
     */
    embaralhar(array) {
        const arrayEmbaralhado = [...array]; // Criar cópia para não modificar original
        
        for (let i = arrayEmbaralhado.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arrayEmbaralhado[i], arrayEmbaralhado[j]] = [arrayEmbaralhado[j], arrayEmbaralhado[i]];
        }
        
        return arrayEmbaralhado;
    }
    
    /**
     * Distribui as peças para iniciar um novo jogo
     * Cada jogador recebe 7 peças, o resto fica no estoque
     */
    distribuirPecas() {
        // Embaralhar todas as peças
        const pecasEmbaralhadas = this.embaralhar(this.todasPecas);
        
        // Limpar arrays anteriores
        this.maoJogador = [];
        this.maoIA = [];
        this.estoque = [];
        this.tabuleiro = [];
        
        // Distribuir 7 peças para cada jogador
        for (let i = 0; i < 7; i++) {
            this.maoJogador.push(pecasEmbaralhadas[i]);
            this.maoIA.push(pecasEmbaralhadas[i + 7]);
        }
        
        // O resto vai para o estoque (14 peças)
        for (let i = 14; i < pecasEmbaralhadas.length; i++) {
            this.estoque.push(pecasEmbaralhadas[i]);
        }
        
        // Resetar propriedades visuais das peças
        this.todasPecas.forEach(peca => {
            peca.selecionada = false;
            peca.arrastando = false;
            peca.visivel = true;
            peca.rotacao = 0;
        });
        
        console.log(`🎲 Peças distribuídas: Jogador(${this.maoJogador.length}) IA(${this.maoIA.length}) Estoque(${this.estoque.length})`);
    }
    
    /**
     * Encontra a maior peça dupla entre todos os jogadores
     * @returns {Object} {jogador: 0|1, peca: PecaDomino}
     */
    encontrarMaiorDupla() {
        // Buscar duplas do jogador
        const duplasJogador = this.maoJogador.filter(peca => peca.ehDupla);
        const maiorDuplaJogador = duplasJogador.reduce((maior, peca) => 
            !maior || peca.ladoEsquerdo > maior.ladoEsquerdo ? peca : maior, null
        );
        
        // Buscar duplas da IA
        const duplasIA = this.maoIA.filter(peca => peca.ehDupla);
        const maiorDuplaIA = duplasIA.reduce((maior, peca) => 
            !maior || peca.ladoEsquerdo > maior.ladoEsquerdo ? peca : maior, null
        );
        
        // Determinar quem tem a maior dupla
        if (maiorDuplaJogador && (!maiorDuplaIA || maiorDuplaJogador.ladoEsquerdo > maiorDuplaIA.ladoEsquerdo)) {
            return { jogador: 0, peca: maiorDuplaJogador };
        } else if (maiorDuplaIA) {
            return { jogador: 1, peca: maiorDuplaIA };
        }
        
        return null; // Nenhum jogador tem dupla
    }
    
    /**
     * Atualiza as posições visuais das peças na mão do jogador
     * @param {number} larguraCanvas - Largura do canvas
     * @param {number} alturaCanvas - Altura do canvas
     */
    atualizarPosicoesJogador(larguraCanvas, alturaCanvas) {
        const totalLargura = this.maoJogador.length * (this.LARGURA_PECA + this.ESPACO_PECAS);
        const inicioX = Math.max(20, (larguraCanvas - totalLargura) / 2);
        const posicaoY = alturaCanvas - this.ALTURA_PECA - 20;
        
        this.maoJogador.forEach((peca, indice) => {
            peca.setPosicao(
                inicioX + indice * (this.LARGURA_PECA + this.ESPACO_PECAS),
                posicaoY
            );
        });
    }
    
    /**
     * Atualiza as posições visuais das peças na mão da IA
     * @param {number} larguraCanvas - Largura do canvas
     */
    atualizarPosicoesIA(larguraCanvas) {
        const totalLargura = this.maoIA.length * (this.LARGURA_PECA + this.ESPACO_PECAS);
        const inicioX = Math.max(20, (larguraCanvas - totalLargura) / 2);
        const posicaoY = 20;
        
        this.maoIA.forEach((peca, indice) => {
            peca.setPosicao(
                inicioX + indice * (this.LARGURA_PECA + this.ESPACO_PECAS),
                posicaoY
            );
        });
    }
    
    /**
     * Atualiza as posições das peças no tabuleiro
     * @param {number} larguraCanvas - Largura do canvas
     * @param {number} alturaCanvas - Altura do canvas
     */
    atualizarTabuleiro(larguraCanvas, alturaCanvas) {
        if (this.tabuleiro.length === 0) return;
        
        const totalLargura = this.tabuleiro.length * (this.LARGURA_PECA + 5);
        const inicioX = (larguraCanvas - totalLargura) / 2;
        const posicaoY = (alturaCanvas - this.ALTURA_PECA) / 2;
        
        this.tabuleiro.forEach((peca, indice) => {
            peca.setPosicao(
                inicioX + indice * (this.LARGURA_PECA + 5),
                posicaoY
            );
        });
    }
    
    /**
     * Encontra uma peça nas coordenadas especificadas
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @param {Array} pecas - Array de peças para buscar (padrão: mão do jogador)
     * @returns {PecaDomino|null} Peça encontrada ou null
     */
    encontrarPecaEm(x, y, pecas = this.maoJogador) {
        // Buscar de trás para frente (última peça desenhada = primeira encontrada)
        for (let i = pecas.length - 1; i >= 0; i--) {
            const peca = pecas[i];
            if (peca.contemPonto(x, y, this.LARGURA_PECA, this.ALTURA_PECA)) {
                return peca;
            }
        }
        return null;
    }
    
    /**
     * Remove uma peça de um array específico
     * @param {PecaDomino} peca - Peça a ser removida
     * @param {Array} array - Array do qual remover
     * @returns {boolean} True se removeu com sucesso
     */
    removerPeca(peca, array) {
        const indice = array.findIndex(p => p.id === peca.id);
        if (indice !== -1) {
            array.splice(indice, 1);
            return true;
        }
        return false;
    }
    
    /**
     * Compra uma peça do estoque para o jogador
     * @returns {PecaDomino|null} Peça comprada ou null se estoque vazio
     */
    comprarPeca() {
        if (this.estoque.length > 0) {
            const peca = this.estoque.pop();
            this.maoJogador.push(peca);
            console.log(`🎯 Jogador comprou peça: ${peca.ladoEsquerdo}-${peca.ladoDireito}`);
            return peca;
        }
        return null;
    }
    
    /**
     * IA compra uma peça do estoque
     * @returns {PecaDomino|null} Peça comprada ou null se estoque vazio
     */
    iaComprarPeca() {
        if (this.estoque.length > 0) {
            const peca = this.estoque.pop();
            this.maoIA.push(peca);
            console.log(`🤖 IA comprou peça: ${peca.ladoEsquerdo}-${peca.ladoDireito}`);
            return peca;
        }
        return null;
    }
    
    /**
     * Verifica se o jogador pode jogar alguma peça
     * @param {number} extremidadeEsquerda - Valor da extremidade esquerda do tabuleiro
     * @param {number} extremidadeDireita - Valor da extremidade direita do tabuleiro
     * @returns {boolean} True se pode jogar
     */
    jogadorPodeJogar(extremidadeEsquerda, extremidadeDireita) {
        if (this.tabuleiro.length === 0) return this.maoJogador.length > 0;
        
        return this.maoJogador.some(peca => 
            peca.podeConectar(extremidadeEsquerda) || 
            peca.podeConectar(extremidadeDireita)
        );
    }
    
    /**
     * Verifica se a IA pode jogar alguma peça
     * @param {number} extremidadeEsquerda - Valor da extremidade esquerda do tabuleiro
     * @param {number} extremidadeDireita - Valor da extremidade direita do tabuleiro
     * @returns {boolean} True se pode jogar
     */
    iaPodeJogar(extremidadeEsquerda, extremidadeDireita) {
        if (this.tabuleiro.length === 0) return this.maoIA.length > 0;
        
        return this.maoIA.some(peca => 
            peca.podeConectar(extremidadeEsquerda) || 
            peca.podeConectar(extremidadeDireita)
        );
    }
    
    /**
     * Obtém as extremidades do tabuleiro atual
     * @returns {Object} {esquerda: number, direita: number}
     */
    getExtremidadesTabuleiro() {
        if (this.tabuleiro.length === 0) {
            return { esquerda: null, direita: null };
        }
        
        return {
            esquerda: this.tabuleiro[0].ladoEsquerdo,
            direita: this.tabuleiro[this.tabuleiro.length - 1].ladoDireito
        };
    }
    
    /**
     * Retorna informações estatísticas do jogo atual
     * @returns {Object} Objeto com estatísticas
     */
    getEstatisticas() {
        return {
            totalPecas: this.todasPecas.length,
            maoJogador: this.maoJogador.length,
            maoIA: this.maoIA.length,
            tabuleiro: this.tabuleiro.length,
            estoque: this.estoque.length,
            somaJogador: this.maoJogador.reduce((soma, peca) => soma + peca.soma, 0),
            somaIA: this.maoIA.reduce((soma, peca) => soma + peca.soma, 0)
        };
    }
}