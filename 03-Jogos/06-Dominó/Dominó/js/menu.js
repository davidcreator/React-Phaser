/**
 * ===============================================
 * SISTEMA DE MENU E INTERFACE - menu.js
 * ===============================================
 * 
 * Este arquivo gerencia toda a interface do usuário:
 * - Menu principal com seleção de modalidades
 * - Modais de instruções e estatísticas
 * - Transições entre telas
 * - Gerenciamento de estatísticas
 * - Sistema de configurações
 * 
 * Desenvolvido para fins educacionais
 */

class GerenciadorMenu {
    constructor() {
        // Elementos do DOM
        this.menuPrincipal = document.getElementById('menuPrincipal');
        this.telaJogo = document.getElementById('telaJogo');
        this.modalInstrucoes = document.getElementById('modalInstrucoes');
        this.modalEstatisticas = document.getElementById('modalEstatisticas');
        this.modalFimJogo = document.getElementById('modalFimJogo');
        
        // Configurações das modalidades de jogo
        this.modalidades = {
            classico: {
                nome: 'Dominó Clássico',
                descricao: 'Modalidade tradicional com 28 peças',
                dificuldade: 'Fácil',
                regras: {
                    pecasIniciais: 7,
                    objetivo: 'Seja o primeiro a jogar todas as peças',
                    pontuacao: false,
                    especiais: []
                }
            },
            bloqueio: {
                nome: 'Dominó de Bloqueio',
                descricao: 'Foque em bloquear o adversário',
                dificuldade: 'Médio',
                regras: {
                    pecasIniciais: 7,
                    objetivo: 'Bloqueie o oponente e esvazie sua mão',
                    pontuacao: false,
                    especiais: ['Estratégia de bloqueio', 'Análise de mão do oponente']
                }
            },
            pontos: {
                nome: 'Dominó por Pontos',
                descricao: 'Primeiro a atingir 100 pontos vence',
                dificuldade: 'Difícil',
                regras: {
                    pecasIniciais: 7,
                    objetivo: 'Primeiro a atingir 100 pontos',
                    pontuacao: true,
                    metaPontos: 100,
                    especiais: ['Sistema de pontuação', 'Múltiplas rodadas']
                }
            },
            'duplo-seis': {
                nome: 'Duplo-Seis Especial',
                descricao: 'Regras especiais para peças duplas',
                dificuldade: 'Médio',
                regras: {
                    pecasIniciais: 7,
                    objetivo: 'Dominó clássico com bônus para duplas',
                    pontuacao: false,
                    especiais: ['Bônus para peças duplas', 'Regras especiais']
                }
            }
        };
        
        // Sistema de estatísticas
        this.estatisticas = this.carregarEstatisticas();
        
        // Estado atual
        this.modalidadeAtual = null;
        
        // Inicializar eventos
        this.inicializarEventos();
        
        // Atualizar display das estatísticas
        this.atualizarDisplayEstatisticas();
    }
    
    /**
     * Inicializa todos os event listeners da interface
     */
    inicializarEventos() {
        // Eventos do menu principal
        this.inicializarEventosMenu();
        
        // Eventos dos modais
        this.inicializarEventosModais();
        
        // Eventos da tela de jogo
        this.inicializarEventosJogo();
        
        // Eventos do teclado
        this.inicializarEventosTeclado();
    }
    
    /**
     * Inicializa eventos do menu principal
     */
    inicializarEventosMenu() {
        // Seleção de modalidades
        const modesJogo = document.querySelectorAll('.modo-jogo');
        modesJogo.forEach(modo => {
            modo.addEventListener('click', () => {
                const modalidade = modo.dataset.modo;
                this.selecionarModalidade(modalidade);
            });
            
            // Efeito hover aprimorado
            modo.addEventListener('mouseenter', () => {
                this.mostrarPreviewModalidade(modo);
            });
            
            modo.addEventListener('mouseleave', () => {
                this.esconderPreviewModalidade(modo);
            });
        });
        
        // Botões do rodapé
        document.getElementById('btnInstrucoes').addEventListener('click', () => {
            this.abrirModal('instrucoes');
        });
        
        document.getElementById('btnEstatisticas').addEventListener('click', () => {
            this.abrirModal('estatisticas');
        });
    }
    
    /**
     * Inicializa eventos dos modais
     */
    inicializarEventosModais() {
    /**
     * Inicializa eventos dos modais
     */
    inicializarEventosModais() {

        // Botões de fechar modais
        document.querySelectorAll('.fechar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.fecharModal(e.target.closest('.modal'));
            });
        });
        
        // Fechar modal clicando no fundo
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.fecharModal(modal);
                }
            });
        });
        
        // Eventos específicos do modal de fim de jogo
        document.getElementById('btnJogarNovamente').addEventListener('click', () => {
            this.fecharModal(this.modalFimJogo);
            // Emitir evento para reiniciar jogo
            document.dispatchEvent(new CustomEvent('reiniciarJogo'));
        });
        
        document.getElementById('btnVoltarMenu').addEventListener('click', () => {
            this.fecharModal(this.modalFimJogo);
            this.voltarAoMenu();
        });
    }
    
    /**
     * Inicializa eventos da tela de jogo
     */
    inicializarEventosJogo() {
        // Botão voltar ao menu
        document.getElementById('btnMenu').addEventListener('click', () => {
            this.voltarAoMenu();
        });
        
        // Botões de ação do jogo
        document.getElementById('btnComprar').addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('comprarPeca'));
        });
        
        document.getElementById('btnPassar').addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('passarVez'));
        });
        
        document.getElementById('btnNovoJogo').addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('reiniciarJogo'));
        });
    }
    
    /**
     * Inicializa eventos do teclado
     */
    inicializarEventosTeclado() {
        document.addEventListener('keydown', (e) => {
            // Esc para fechar modais
            if (e.key === 'Escape') {
                const modalAberto = document.querySelector('.modal[style*="block"]');
                if (modalAberto) {
                    this.fecharModal(modalAberto);
                }
            }
            
            // Atalhos durante o jogo
            if (this.telaJogo.style.display !== 'none') {
                switch(e.key.toLowerCase()) {
                    case 'c':
                        document.dispatchEvent(new CustomEvent('comprarPeca'));
                        break;
                    case 'p':
                        document.dispatchEvent(new CustomEvent('passarVez'));
                        break;
                    case 'n':
                        document.dispatchEvent(new CustomEvent('reiniciarJogo'));
                        break;
                    case 'm':
                        this.voltarAoMenu();
                        break;
                }
            }
        });
    }
    
    /**
     * Seleciona uma modalidade de jogo e inicia
     * @param {string} modalidade - Nome da modalidade
     */
    selecionarModalidade(modalidade) {
        if (!this.modalidades[modalidade]) {
            console.error(`Modalidade desconhecida: ${modalidade}`);
            return;
        }
        
        this.modalidadeAtual = modalidade;
        const config = this.modalidades[modalidade];
        
        // Atualizar interface da tela de jogo
        document.getElementById('modoAtual').textContent = config.nome;
        
        // Mostrar/esconder elementos baseado na modalidade
        this.configurarInterfaceModalidade(config);
        
        // Transição para tela de jogo
        this.transicionarPara('jogo');
        
        // Emitir evento para inicializar jogo
        document.dispatchEvent(new CustomEvent('iniciarJogo', {
            detail: { modalidade, config }
        }));
        
        console.log(`Modalidade selecionada: ${config.nome}`);
    }
    
    /**
     * Configura a interface baseada na modalidade selecionada
     * @param {Object} config - Configuração da modalidade
     */
    configurarInterfaceModalidade(config) {
        const pontuacao = document.querySelector('.pontuacao');
        
        // Mostrar/esconder pontuação baseado na modalidade
        if (config.regras.pontuacao) {
            pontuacao.style.display = 'flex';
        } else {
            pontuacao.style.display = 'none';
        }
        
        // Configurar botões específicos da modalidade
        this.configurarBotoesModalidade(config);
    }
    
    /**
     * Configura botões específicos para cada modalidade
     * @param {Object} config - Configuração da modalidade
     */
    configurarBotoesModalidade(config) {
        const btnComprar = document.getElementById('btnComprar');
        const btnPassar = document.getElementById('btnPassar');
        
        // Personalizar tooltips baseado na modalidade
        if (config.regras.especiais.includes('Estratégia de bloqueio')) {
            btnComprar.title = 'Comprar peça (pode revelar informações ao oponente)';
            btnPassar.title = 'Passar vez (útil para estratégias de bloqueio)';
        } else {
            btnComprar.title = 'Comprar uma peça do estoque';
            btnPassar.title = 'Passar a vez sem jogar';
        }
    }
    
    /**
     * Mostra preview da modalidade ao passar o mouse
     * @param {Element} elemento - Elemento da modalidade
     */
    mostrarPreviewModalidade(elemento) {
        const modalidade = elemento.dataset.modo;
        const config = this.modalidades[modalidade];
        
        // Criar tooltip dinâmico
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-modalidade';
        tooltip.innerHTML = `
            <h4>${config.nome}</h4>
            <p><strong>Objetivo:</strong> ${config.regras.objetivo}</p>
            <p><strong>Peças iniciais:</strong> ${config.regras.pecasIniciais}</p>
            ${config.regras.especiais.length > 0 ? 
                `<p><strong>Especiais:</strong> ${config.regras.especiais.join(', ')}</p>` : 
                ''
            }
        `;
        
        document.body.appendChild(tooltip);
        
        // Posicionar tooltip
        const rect = elemento.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top}px`;
        tooltip.style.zIndex = '1000';
        tooltip.style.background = 'rgba(0,0,0,0.9)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '10px';
        tooltip.style.borderRadius = '5px';
        tooltip.style.maxWidth = '250px';
        tooltip.style.fontSize = '12px';
        
        elemento._tooltip = tooltip;
    }
    
    /**
     * Esconde preview da modalidade
     * @param {Element} elemento - Elemento da modalidade
     */
    esconderPreviewModalidade(elemento) {
        if (elemento._tooltip) {
            document.body.removeChild(elemento._tooltip);
            delete elemento._tooltip;
        }
    }
    
    /**
     * Transiciona entre telas
     * @param {string} tela - 'menu' ou 'jogo'
     */
    transicionarPara(tela) {
        if (tela === 'menu') {
            this.telaJogo.style.display = 'none';
            this.menuPrincipal.style.display = 'flex';
            this.menuPrincipal.classList.add('fade-in');
        } else if (tela === 'jogo') {
            this.menuPrincipal.style.display = 'none';
            this.telaJogo.style.display = 'flex';
            this.telaJogo.classList.add('fade-in');
        }
        
        // Remover classe de animação após completar
        setTimeout(() => {
            this.menuPrincipal.classList.remove('fade-in');
            this.telaJogo.classList.remove('fade-in');
        }, 500);
    }
    
    /**
     * Volta ao menu principal
     */
    voltarAoMenu() {
        // Confirmar se há jogo em andamento
        if (this.modalidadeAtual && this.confirmarSairJogo()) {
            this.modalidadeAtual = null;
            this.transicionarPara('menu');
            
            // Emitir evento para parar o jogo atual
            document.dispatchEvent(new CustomEvent('pararJogo'));
        } else if (!this.modalidadeAtual) {
            this.transicionarPara('menu');
        }
    }
    
    /**
     * Confirma se o jogador quer sair do jogo atual
     * @returns {boolean} True se confirmou
     */
    confirmarSairJogo() {
        return confirm('Tem certeza que deseja voltar ao menu? O jogo atual será perdido.');
    }
    
    /**
     * Abre um modal específico
     * @param {string} tipo - Tipo do modal ('instrucoes', 'estatisticas', 'fim-jogo')
     */
    abrirModal(tipo) {
        let modal;
        
        switch(tipo) {
            case 'instrucoes':
                modal = this.modalInstrucoes;
                break;
            case 'estatisticas':
                modal = this.modalEstatisticas;
                this.atualizarDisplayEstatisticas();
                break;
            case 'fim-jogo':
                modal = this.modalFimJogo;
                break;
            default:
                console.error(`Tipo de modal desconhecido: ${tipo}`);
                return;
        }
        
        modal.style.display = 'block';
        modal.classList.add('fade-in');
        
        // Focar no modal para acessibilidade
        modal.focus();
        
        // Remover classe de animação
        setTimeout(() => {
            modal.classList.remove('fade-in');
        }, 300);
    }
    
    /**
     * Fecha um modal
     * @param {Element} modal - Elemento do modal
     */
    fecharModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    /**
     * Exibe o modal de fim de jogo
     * @param {Object} resultado - Resultado do jogo
     */
    mostrarFimJogo(resultado) {
        const { vencedor, pontos, movimentos, modalidade } = resultado;
        
        // Atualizar estatísticas
        this.atualizarEstatisticas(vencedor, modalidade, pontos);
        
        // Configurar conteúdo do modal
        const titulo = document.getElementById('tituloFimJogo');
        const resultadoDiv = document.getElementById('resultadoJogo');
        
        // Definir título e classe baseado no resultado
        let classeResultado = '';
        let tituloTexto = '';
        let mensagem = '';
        
        if (vencedor === 'jogador') {
            classeResultado = 'vitoria';
            tituloTexto = 'Parabéns! Você venceu!';
            mensagem = `
                <h3>Vitória!</h3>
                <p>Você completou o jogo em ${movimentos} movimentos.</p>
                ${pontos ? `<p>Pontuação final: ${pontos.jogador} x ${pontos.ia}</p>` : ''}
                <p>Modalidade: ${this.modalidades[modalidade].nome}</p>
            `;
        } else if (vencedor === 'ia') {
            classeResultado = 'derrota';
            tituloTexto = 'Que pena! A IA venceu.';
            mensagem = `
                <h3>Derrota</h3>
                <p>A IA completou o jogo em ${movimentos} movimentos.</p>
                ${pontos ? `<p>Pontuação final: ${pontos.jogador} x ${pontos.ia}</p>` : ''}
                <p>Modalidade: ${this.modalidades[modalidade].nome}</p>
                <p>Tente novamente!</p>
            `;
        } else {
            classeResultado = 'empate';
            tituloTexto = 'Empate!';
            mensagem = `
                <h3>Empate</h3>
                <p>O jogo terminou sem vencedor após ${movimentos} movimentos.</p>
                ${pontos ? `<p>Pontuação final: ${pontos.jogador} x ${pontos.ia}</p>` : ''}
                <p>Modalidade: ${this.modalidades[modalidade].nome}</p>
            `;
        }
        
        titulo.textContent = tituloTexto;
        resultadoDiv.innerHTML = mensagem;
        resultadoDiv.className = `resultado-jogo ${classeResultado}`;
        
        // Mostrar modal
        this.abrirModal('fim-jogo');
    }
    
    /**
     * Atualiza as estatísticas do jogador
     * @param {string} vencedor - 'jogador', 'ia', ou 'empate'
     * @param {string} modalidade - Modalidade jogada
     * @param {Object} pontos - Pontuação (se aplicável)
     */
    atualizarEstatisticas(vencedor, modalidade, pontos = null) {
        if (!this.estatisticas[modalidade]) {
            this.estatisticas[modalidade] = {
                partidas: 0,
                vitorias: 0,
                derrotas: 0,
                empates: 0,
                melhorPontuacao: 0,
                sequenciaAtual: 0,
                melhorSequencia: 0
            };
        }
        
        const stats = this.estatisticas[modalidade];
        stats.partidas++;
        
        if (vencedor === 'jogador') {
            stats.vitorias++;
            stats.sequenciaAtual++;
            if (stats.sequenciaAtual > stats.melhorSequencia) {
                stats.melhorSequencia = stats.sequenciaAtual;
            }
        } else if (vencedor === 'ia') {
            stats.derrotas++;
            stats.sequenciaAtual = 0;
        } else {
            stats.empates++;
            stats.sequenciaAtual = 0;
        }
        
        // Atualizar melhor pontuação se aplicável
        if (pontos && pontos.jogador > stats.melhorPontuacao) {
            stats.melhorPontuacao = pontos.jogador;
        }
        
        // Salvar estatísticas
        this.salvarEstatisticas();
        
        console.log(`Estatísticas atualizadas para ${modalidade}:`, stats);
    }
    
    /**
     * Atualiza o display das estatísticas na interface
     */
    atualizarDisplayEstatisticas() {
        const modalidades = ['classico', 'bloqueio', 'pontos', 'duplo'];
        
        modalidades.forEach(modalidade => {
            const stats = this.estatisticas[modalidade] || { partidas: 0, vitorias: 0, melhorPontuacao: 0 };
            const taxa = stats.partidas > 0 ? Math.round((stats.vitorias / stats.partidas) * 100) : 0;
            
            // Mapear nomes dos elementos
            const nomeElemento = modalidade === 'duplo' ? 'duplo-seis' : modalidade;
            const sufixo = nomeElemento.charAt(0).toUpperCase() + nomeElemento.slice(1).replace('-', '');
            
            const partidasElem = document.getElementById(`partidas${sufixo}`);
            const vitoriasElem = document.getElementById(`vitorias${sufixo}`);
            const taxaElem = document.getElementById(`taxa${sufixo}`);
            
            if (partidasElem) partidasElem.textContent = stats.partidas;
            if (vitoriasElem) vitoriasElem.textContent = stats.vitorias;
            if (taxaElem) taxaElem.textContent = `${taxa}%`;
            
            // Elementos específicos
            if (modalidade === 'pontos') {
                const recordeElem = document.getElementById('recordePontos');
                if (recordeElem) recordeElem.textContent = stats.melhorPontuacao;
            }
        });
        
        // Estatísticas gerais
        this.atualizarEstatisticasGerais();
    }
    
    /**
     * Atualiza estatísticas gerais
     */
    atualizarEstatisticasGerais() {
        const totalPartidas = Object.values(this.estatisticas)
            .reduce((total, stats) => total + (stats.partidas || 0), 0);
        
        const totalVitorias = Object.values(this.estatisticas)
            .reduce((total, stats) => total + (stats.vitorias || 0), 0);
        
        const sequenciaAtual = Math.max(...Object.values(this.estatisticas)
            .map(stats => stats.sequenciaAtual || 0));
        
        const melhorSequencia = Math.max(...Object.values(this.estatisticas)
            .map(stats => stats.melhorSequencia || 0));
        
        const elementos = {
            totalPartidas: document.getElementById('totalPartidas'),
            totalVitorias: document.getElementById('totalVitorias'),
            sequenciaAtual: document.getElementById('sequenciaAtual'),
            melhorSequencia: document.getElementById('melhorSequencia')
        };
        
        if (elementos.totalPartidas) elementos.totalPartidas.textContent = totalPartidas;
        if (elementos.totalVitorias) elementos.totalVitorias.textContent = totalVitorias;
        if (elementos.sequenciaAtual) elementos.sequenciaAtual.textContent = sequenciaAtual;
        if (elementos.melhorSequencia) elementos.melhorSequencia.textContent = melhorSequencia;
    }
    
    /**
     * Carrega estatísticas salvas
     * @returns {Object} Estatísticas carregadas
     */
    carregarEstatisticas() {
        try {
            // Para this session, usar armazenamento em memória
            const stats = window.dominoEstatisticas || {};
            console.log('Estatísticas carregadas:', stats);
            return stats;
        } catch (error) {
            console.log('Erro ao carregar estatísticas:', error);
            return {};
        }
    }
    
    /**
     * Salva estatísticas
     */
    salvarEstatisticas() {
        try {
            // Armazenar em memória para esta sessão
            window.dominoEstatisticas = this.estatisticas;
            console.log('Estatísticas salvas:', this.estatisticas);
        } catch (error) {
            console.error('Erro ao salvar estatísticas:', error);
        }
    }
    
    /**
     * Redefine todas as estatísticas
     */
    resetarEstatisticas() {
        if (confirm('Tem certeza que deseja resetar todas as estatísticas? Esta ação não pode ser desfeita.')) {
            this.estatisticas = {};
            this.salvarEstatisticas();
            this.atualizarDisplayEstatisticas();
            alert('Estatísticas resetadas com sucesso!');
        }
    }
    
    /**
     * Atualiza informações da interface durante o jogo
     * @param {Object} info - Informações do jogo
     */
    atualizarInfoJogo(info) {
        const elementos = {
            statusJogo: document.getElementById('statusJogo'),
            pecasJogador: document.getElementById('pecasJogador'),
            pecasIA: document.getElementById('pecasIA'),
            pecasEstoque: document.getElementById('pecasEstoque'),
            numeroMovimentos: document.getElementById('numeroMovimentos'),
            pontosJogador: document.getElementById('pontosJogador'),
            pontosIA: document.getElementById('pontosIA')
        };
        
        if (elementos.statusJogo) elementos.statusJogo.textContent = info.status || 'Aguardando';
        if (elementos.pecasJogador) elementos.pecasJogador.textContent = info.pecasJogador || 0;
        if (elementos.pecasIA) elementos.pecasIA.textContent = info.pecasIA || 0;
        if (elementos.pecasEstoque) elementos.pecasEstoque.textContent = info.pecasEstoque || 0;
        if (elementos.numeroMovimentos) elementos.numeroMovimentos.textContent = info.movimentos || 0;
        
        // Atualizar pontuação se aplicável
        if (info.pontos) {
            if (elementos.pontosJogador) elementos.pontosJogador.textContent = info.pontos.jogador || 0;
            if (elementos.pontosIA) elementos.pontosIA.textContent = info.pontos.ia || 0;
        }
        
        // Atualizar estado dos botões
        this.atualizarEstadoBotoes(info);
    }
    
    /**
     * Atualiza o estado dos botões de ação
     * @param {Object} info - Informações do jogo
     */
    atualizarEstadoBotoes(info) {
        const btnComprar = document.getElementById('btnComprar');
        const btnPassar = document.getElementById('btnPassar');
        
        // Habilitar/desabilitar baseado no turno e estado do jogo
        const turnoJogador = info.turnoAtual === 'jogador';
        const temEstoque = info.pecasEstoque > 0;
        const podeJogar = info.podeJogar !== false;
        
        if (btnComprar) {
            btnComprar.disabled = !turnoJogador || !temEstoque;
        }
        
        if (btnPassar) {
            btnPassar.disabled = !turnoJogador || podeJogar;
        }
    }
    
    /**
     * Mostra notificação temporária
     * @param {string} mensagem - Mensagem a mostrar
     * @param {string} tipo - Tipo da notificação ('info', 'sucesso', 'erro')
     */
    mostrarNotificacao(mensagem, tipo = 'info') {
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao ${tipo}`;
        notificacao.textContent = mensagem;
        
        // Estilos inline para garantir visibilidade
        notificacao.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${tipo === 'erro' ? '#e74c3c' : tipo === 'sucesso' ? '#27ae60' : '#3498db'};
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;
        
        document.body.appendChild(notificacao);
        
        // Remover após 3 segundos
        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.parentNode.removeChild(notificacao);
            }
        }, 3000);
    }
    
    /**
     * Obtém a modalidade atual
     * @returns {string|null} Modalidade atual ou null
     */
    getModalidadeAtual() {
        return this.modalidadeAtual;
    }
    
    /**
     * Obtém configuração da modalidade atual
     * @returns {Object|null} Configuração ou null
     */
    getConfigModalidadeAtual() {
        return this.modalidadeAtual ? this.modalidades[this.modalidadeAtual] : null;
    }
}