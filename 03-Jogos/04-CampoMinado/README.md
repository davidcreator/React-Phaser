# 💣 Campo Minado - Projeto Educativo
Um projeto prático para aprender programação através do desenvolvimento de um jogo clássico

# 📋 Índice
* [O que é este projeto?](#o-que-é-este-projeto)
* [Por que Campo Minado?](#por-que-campo-minado)
* [O que você vai aprender](#o-que-voce-vai-aprender)
* [Como funciona o jogo](#como-funciona-o-jogo)
* [Estrutura do projeto](#estrutura-do-projeto)
* [Primeiros passos](#primeiros-passos)
* [Desafios progressivos](#desafios-progressivos)
* [Recursos adicionais](#recursos-adicionais)

# Por que Campo Minado?
* O que você vai aprender
* Como funciona o jogo
* Estrutura do projeto
* Primeiros passos
* Desafios progressivos
* Recursos adicionais

# 🎯 O que é este projeto?
Este é um projeto educativo onde você vai desenvolver do zero o famoso jogo Campo Minado. O objetivo é aprender programação de forma prática, construindo algo divertido e funcional.

# 🎮 Informações do Jogo
* **Nome:** Campo Minado
* **Criado por:** Robert Donner (1989)
* **Popularizado:** Microsoft Windows 3.1 (1992)
* **Tipo:** Jogo de lógica e estratégia
* **Dificuldade de implementação:** ⭐⭐⭐ (Intermediário)

# 🤔 Por que Campo Minado?
Campo Minado é perfeito para iniciantes porque:
## ✅ Conceitos Fundamentais
* Estruturas de dados (arrays/matrizes)
* Loops e condicionais
* Funções e modularização
* Manipulação de eventos

## ✅ Algoritmos Importantes
* Geração de números aleatórios
* Busca em profundidade (DFS)
* Detecção de vizinhos
* Validação de condições

## ✅ Interface Gráfica
* Criação de botões interativos
* Manipulação de cliques
* Atualização visual em tempo real
* Feedback ao usuário

# 🎓 O que você vai aprender
Ao completar este projeto, você terá experiência com:
ÁreaConceitosLógica de ProgramaçãoCondicionais, loops, arrays bidimensionaisAlgoritmosBusca recursiva, geração proceduralInterfaceEventos de mouse, atualização de UIArquiteturaSeparação de responsabilidades, classes/objetosDebuggingIdentificação e correção de bugs

# 🎮 Como funciona o jogo
## Regras Básicas
### Campo
* Grade de células (ex: 9x9, 16x16)
* Minas: Algumas células contêm minas ocultas
* Objetivo: Revelar todas as células sem minas
* Números: Indicam quantas minas existem nas células adjacentes
* Bandeiras: Marque células suspeitas de conter minas

### Exemplo Visual
    ? ? ? ?    →    1 💣 1 0
    ? ? ? ?    →    2 2 2 0  
    ? ? ? ?    →    💣 1 1 0
    ? ? ? ?    →    1 1 0 0

### Condições de Vitória/Derrota
* Vitória: Todas as células sem minas foram reveladas
* Derrota: Clicou em uma célula com mina

# 🏗️ Estrutura do projeto
## Componentes Principais
📁 Campo-Minado/
├── 📄 index.html       # Arquivo principal
├── 📁 css              
    └── 📄 styles.css   # Representação do tabuleiro
├── 📁 js               
    └── 📄 script.js    # Interface gráfica

## Funcionalidades Essenciais
 * Criar tabuleiro
 * Posicionar minas aleatoriamente
 * Calcular números das células
 * Revelar células (incluindo área vazia)
 * Marcar/desmarcar bandeiras
 * Detectar vitória/derrota
 * Reiniciar jogo

# 🚀 Primeiros passos
1. Configuração Inicial
    * Crie um novo diretório para o projeto
    * Dentro do diretório, crie os arquivos:
        * `index.html`
        * `styles.css`
        * `script.js`
1. Configurações básicas
    * Abra `styles.css` e adicione estilos básicos
    * Abra `script.js` e adicione configurações básicas
    * Abra `index.html` e adicione a estrutura básica
1. Estrutura da Célula
    * Cada célula precisa armazenar:
        * `temMina` (boolean)
        * `foiRevelada` (boolean)
        * `temBandeira` (boolean)
        * `numeroMinasAdjacentes` (int)
        * Número de minas adjacentes (0-8)

1. Primeira Implementação
    * Comece criando:
        * Função para criar o tabuleiro
        * Função para posicionar minas
        * Função para calcular números

# 🎯 Desafios progressivos
## Nível 1: Básico
    * Criar matriz do tabuleiro
    * Posicionar minas aleatoriamente
    * Calcular números das células

## Nível 2: Intermediário
    * Implementar revelação de células
    * Revelar automaticamente células vazias
    * Sistema de bandeiras
    * Detecção de vitória/derrota

## Nível 3: Avançado
    * Interface gráfica
    * Diferentes níveis de dificuldade
    * Contador de tempo
    * Sistema de recordes

## Nível 4: Expert
    * Garantir que o primeiro clique nunca seja uma mina
    * Animações visuais
    * Sons de feedback
    * Modo multijogador local

# 📚 Recursos adicionais
## Documentação e Tutoriais
Documentação JavaScript Canvas
Tutorial JavaScript Canvas
Algoritmos de Busca

# 🏆 Objetivos de Aprendizagem
Ao final deste projeto, você será capaz de:
* Planejar a arquitetura de um software
* Implementar algoritmos de busca e lógica
* Criar interfaces de usuário interativas
* Debugar e testar código sistematicamente
* Documentar seu código adequadamente

# 💡 Dicas importantes
## Para Iniciantes
* **Comece simples:** primeiro faça funcionar no console
* Teste cada funcionalidade individualmente
* Use muitos comentários no código
* Não tenha medo de pesquisar e pedir ajuda

## Para Avançados
* Implemente padrões de design (MVC, Observer)
* Adicione testes automatizados
* Considere performance para tabuleiros grandes
* Explore diferentes algoritmos de geração

**Bom desenvolvimento! 🚀**
*Lembre-se: o importante não é fazer perfeito na primeira vez, mas aprender no processo.*