# 📖 Glossário Gamer e Tech — Guardiões do Reator

Este glossário explica em linguagem simples e descontraída as palavras que programadores de jogos usam todos os dias!

---

### 👾 Tower Defense (Defesa de Torres)
Gênero de jogo em que o objetivo do jogador é impedir que ondas de inimigos cheguem a um objetivo (como uma base ou reator), construindo torres e armadilhas automáticas ao longo do caminho. Exemplos famosos: *Kingdom Rush*, *Bloons TD*, *Plants vs. Zombies*.

### 🕹️ Action Tower Defense (Ação em Tempo Real)
Uma variação do Tower Defense tradicional onde o jogador não fica apenas assistindo à ação. Ele pode controlar armas manualmente, atirar com o mouse ou movimentar um herói no campo de batalha (estilo *Mindustry* e *Orcs Must Die!*).

### 📍 Path / Trilha Paramétrica
Um traçado matemático imaginário feito de pontos interligados. Em vez de dizermos ao inimigo "ande para a direita, depois vire para baixo", dizemos: *"siga 10% deste caminho, depois 20%, depois 30%..."*. Isso garante curvas suaves e movimentação perfeita.

### ⏱️ Spawner (Gerador de Inimigos)
O trecho de código responsável por criar e colocar inimigos no jogo em intervalos regulares de tempo (ex: a cada 1 segundo cria um novo robô até a onda acabar).

### 📐 Radianos e Ângulos 2D
O computador mede rotações usando **radianos** (que vão de `0` até aproximadamente `6.28`, correspondendo a uma volta completa de 360°). A função `Phaser.Math.Angle.Between(x1, y1, x2, y2)` calcula exatamente a inclinação que o cano da torre precisa ter para apontar para o inimigo.

### 🚀 Balística 2D
O ramo da física dos jogos que cuida do lançamento, velocidade e trajetória de projéteis (balas, foguetes, lasers). No Phaser, usamos `velocityFromRotation(angulo, velocidade, corpo)` para fazer o projétil voar na direção que o cano apontava.

### 💥 Splash Damage (Dano em Área)
Quando um projétil ou míssil explode e causa estrago não apenas no inimigo atingido diretamente, mas também em todos os inimigos próximos que estiverem dentro do raio da explosão.

### 🔄 Cadência de Tiro (Cooldown / Rate of Fire)
O tempo de espera necessário entre um disparo e o próximo. Quanto menor o tempo de recarga, mais rápido a arma atira.

### 🛡️ Hitbox / Raio de Colisão
A área geométrica invisível (círculo ou retângulo) usada pelo motor do jogo para saber se dois objetos se encostaram. Se o raio da bala cruzar o raio do robô, houve colisão!

### 📈 Game Loop (Laço Principal do Jogo)
O coração do jogo (`update`), que roda cerca de 60 vezes por segundo. Ele lê as entradas do teclado/mouse, move os personagens, calcula colisões e redesenha a tela.
