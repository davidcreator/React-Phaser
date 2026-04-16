# Jogo Ação Plataforma 2D

Este é um clone simples do jogo Metal Slug, desenvolvido em JavaScript utilizando a tag `<canvas>` para renderização gráfica. O objetivo do jogo é controlar um personagem que deve derrotar inimigos enquanto coleta pontos e gerencia sua saúde e vidas.

## Mecânicas do Jogo

### Movimentação do Personagem
- O personagem pode se mover para frente e para trás, rotacionando para a esquerda e direita.
- Teclas de controle:
  - `W` ou `Seta para cima`: Mover para frente
  - `S` ou `Seta para baixo`: Mover para trás
  - `A` ou `Seta para esquerda`: Rotacionar para a esquerda
  - `D` ou `Seta para direita`: Rotacionar para a direita

### Ataque do Personagem
- O personagem pode atacar de duas maneiras:
  - **Ataque à distância**: Disparar projéteis pressionando a barra de espaço (`Space`).
  - **Ataque corpo a corpo**: Atacar inimigos próximos pressionando a tecla `X`.

### Inimigos
- Existem três tipos de inimigos, cada um com habilidades, tamanhos e formas diferentes:
  - **Inimigo pequeno**: Rápido, com pouca saúde.
  - **Inimigo médio**: Velocidade moderada, pode atacar à distância.
  - **Inimigo grande**: Lento, com muita saúde.

### Inteligência de Movimento dos Inimigos
- Os inimigos se movem em direção ao jogador.
- Inimigos médios podem atacar o jogador à distância se estiverem dentro do alcance.

### Sistema de Saúde e Vidas
- O jogador possui uma barra de saúde e começa com 3 vidas.
- Se a saúde do jogador chegar a zero, ele perde uma vida e a saúde é restaurada.
- Se as vidas do jogador chegarem a zero, o jogo termina.

### Pontuação
- O jogador ganha pontos ao derrotar inimigos.
- A pontuação é exibida no canto superior esquerdo da tela.

## Como Jogar
1. Clone este repositório.
2. Abra o arquivo `index.html` em um navegador web.
3. Use as teclas de controle para mover o personagem e atacar os inimigos.
4. Tente sobreviver o máximo possível enquanto derrota inimigos e acumula pontos.

Divirta-se jogando!
