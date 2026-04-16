/**
 * ===============================================
 * LÓGICA PRINCIPAL DO JOGO DE DOMINÓ - script.js
 * ===============================================
 * 
 * Este é o arquivo principal que orquestra todo o jogo:
 * - Controla o fluxo do jogo
 * - Gerencia turnos e estados
 * - Processa eventos de jogador e IA
 * - Coordena todos os outros módulos
 * - Implementa as regras das diferentes modalidades
 * 
 * Desenvolvido para fins educacionais
 */

class JogoDomino {
    constructor() {
        // Componentes principais
        this.canvas = document.getElementById('canvasJogo');
        this.ctx = this.canvas.getContext('2d');
        
        // Inicializar módulos
        this.pecas = new GerenciadorPecas();
        this.renderer = new RendererDomino(this.canvas, this.pecas);
        this.menu = new GerenciadorMenu();
        
        // Estado do jogo
        this.estadoJogo = {
            ativo: false,
            modalidade: null,
            turnoAtual: 'jogador', // 'jogador' ou 'ia'
            pecaSelecionada: null,
            arrastando: false,
            pecaArrastada: null,
            posicaoMouse: { x: 0, y: 0 },
            movimentos: 0,
            pontos: { jogador: 0, ia: 0 },
            vencedor: null,
            bloqueado: false
        };
        
        // Configurações de IA
        this.ia = {
            dificuldade: 'medio', // 'facil', 'medio', 'dificil'
            tempoEspera: 1000,    // Tempo de espera antes de jogar (ms)
            estrategia: 'padrao'  // Estratégia atual da IA
        };
        
        // Controle de drag and drop
        this.dragInfo = {
            iniciado: false,
            offset: { x: 0, y: 0 },
            pecaOriginal: null,
            posicaoOriginal: { x: 0, y: 0 }
        };
        
        // Inicializar jogo
        this.inicializar();
    }
    
    /**
     * Inicializa o jogo e todos os seus componentes
     */
    inicializar() {
        console.log('🎲 Iniciando Jogo de Dominó Educacional...');
        
        // Configurar canvas
        this.configurarCanvas();
        
        // Vincular eventos
        this.vincularEventos();
        
        // Iniciar loop de renderização
        this.iniciarLoop();
        
        console.log('✅ Jogo inicializado com sucesso!');
        console.log('💡 Controles disponíveis:');
        console.log('   - Arrastar: Mover peças');
        console.log('   - Clique direito: Comprar do estoque');
        console.log('   - Tecla C: Comprar peça');
        console.log('   - Tecla P: Passar vez');
        console.log('   - Tecla N: Novo jogo');
        console.log('   - Tecla M: Voltar ao menu');
    }
    
    /**
     * Configura as dimensões e propriedades do canvas
     */
    configurarCanvas() {
        const redimensionar = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            
            // Atualizar posições das peças quando redimensionar
            if (this.estadoJogo.ativo) {
                this.atualizarTodasPosicoes();
            }
        };
        
        // Redimensionar inicialmente
        redimensionar();
        
        // Redimensionar quando a janela mudar de tamanho
        window.addEventListener('resize', redimensionar);
        
        // Evitar menu de contexto padrão no canvas
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * Vincula todos os event listeners necessários
     */
    vincularEventos() {
        // Eventos do canvas (mouse e touch)
        this.vincularEventosCanvas();
        
        // Eventos personalizados do menu
        this.vincularEventosMenu();
        
        // Eventos de teclado
        this.vincularEventosTeclado();
    }
    
    /**
     * Vincula eventos específicos do canvas
     */
    vincularEventosCanvas() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.aoClicarMouse(e));
        this.canvas.addEventListener('mousemove', (e) => this.aoMoverMouse(e));
        this.canvas.addEventListener('mouseup', (e) => this.aoSoltarMouse(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.aoClicarBotaoDireito(e);
        });
        
        // Touch events para dispositivos móveis
        this.canvas.addEventListener('touchstart', (e) => this.aoTocarTela(e));
        this.canvas.addEventListener('touchmove', (e) => this.aoMoverToque(e));
        this.canvas.addEventListener('touchend', (e) => this.aoSoltarToque(e));
    }
    
    /**
     * Vincula eventos personalizados do sistema de menu
     */
    vincularEventosMenu() {
        document.addEventListener('iniciarJogo', (e) => {
            const { modalidade } = e.detail;
            this.iniciarNovoJogo(modalidade);
        });
    }
}
