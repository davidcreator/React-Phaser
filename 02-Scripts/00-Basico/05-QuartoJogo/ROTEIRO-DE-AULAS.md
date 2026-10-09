# 📋 Roteiro de Aulas — Guardiões do Reator
> **Duração:** 8 aulas de 50 a 60 minutos  
> **Faixa Etária:** 8 a 16 anos  
> **Requisitos:** Navegador moderno e editor de código simples (VS Code, Notepad++, etc.)

---

## 📅 Aula 1: O Mundo Futurista e a Trilha dos Invasores
* **Objetivo:** Compreender coordenadas 2D e aprender a desenhar uma estrada paramétrica usando o Phaser.
* **Conceito de Programação:** Vetores de coordenadas, objetos `{x, y}` e curvas contínuas (`Phaser.Curves.Path`).
* **Passo a passo prático:**
  1. Abrir `src/scenes/Jogo.js` e examinar o array `PONTOS_CAMINHO`.
  2. Modificar uma das curvas do caminho para entender como os pontos se conectam.
  3. Explorar a ferramenta `this.add.graphics()` para estilizar o asfalto futurista e a grade de fundo.
* **Desafio da aula:** Fazer a cor da linha guia de neon central pulsar ou mudar para verde fluo.

---

## 📅 Aula 2: A Marcha dos Inimigos e o Spawner de Ondas
* **Objetivo:** Fazer robôs surgirem e caminharem perfeitamente sobre a estrada curva até o Reator.
* **Conceito de Programação:** Proporção e porcentagem (`progressoCaminho` de `0.0` a `1.0`), timers com `this.time.addEvent()`.
* **Passo a passo prático:**
  1. Entender como a função `caminho.getPoint(progresso)` calcula a posição exata `(x, y)` do robô a cada milissegundo.
  2. Analisar o gerador de ondas (`iniciarProximaOnda`) e a fila com diferentes robôs (Scout, Swarm e Brute).
  3. Fazer os inimigos gerarem uma barra de vida vermelha e verde sobre a cabeça.
* **Desafio da aula:** Criar um novo tipo de inimigo: o "Mini-Corredor", que tem pouca vida mas se move duas vezes mais rápido.

---

## 📅 Aula 3: Plataformas de Construção e Gestão de Energia (PvZ Style)
* **Objetivo:** Adicionar plataformas clicáveis onde o jogador escolhe e constrói suas torres de defesa.
* **Conceito de Programação:** Eventos do mouse (`pointerdown`, `pointerover`), condicionais (`if (energia >= custo)`).
* **Passo a passo prático:**
  1. Percorrer o array `SLOTS_CONSTRUCAO` e instanciar os discos de apoio.
  2. Adicionar o teste de saldo de energia ao clicar no slot.
  3. Subtrair a energia e desenhar o chassi e o cano da torre selecionada.
* **Desafio da aula:** Adicionar uma animação de rotação rápida quando a torre é finalizada.

---

## 📅 Aula 4: O Olho Eletrônico — Mira Automática com Ângulos 2D
* **Objetivo:** Programar as torres para detectarem inimigos em seu raio de alcance e apontarem o canhão na direção certa.
* **Conceito de Programação:** Distância Euclidiana (`Distance.Between`), Ângulo em radianos (`Angle.Between`) e laços de repetição (`forEach`).
* **Passo a passo prático:**
  1. Explicar com um desenho no quadro a ideia de "raio de visão" da torre.
  2. Ensinar a lógica da torre que escolhe o alvo mais avançado no caminho (o mais perigoso!).
  3. Fazer o cano girar instantaneamente em direção ao inimigo selecionado.
* **Desafio da aula:** Fazer o círculo de alcance da torre piscar quando houver um inimigo dentro dele.

---

## 📅 Aula 5: Fogo! Balística 2D e Projéteis em Ação
* **Objetivo:** Disparar projéteis a partir da ponta do cano da torre usando a física Arcade do Phaser.
* **Conceito de Programação:** Trigonometria aplicada (`cos`/`sin`), vetores de velocidade (`physics.velocityFromRotation`) e grupos de reciclagem.
* **Passo a passo prático:**
  1. Calcular o ponto exato da boca do canhão para que a bala não saia do centro da torre.
  2. Adicionar o projétil ao `grupoProjeteis` e definir sua velocidade de voo.
  3. Adicionar o timer de auto-destruição para balas perdidas que voam para fora da tela.
* **Desafio da aula:** Alterar a velocidade dos tiros do Canhão para que pareçam projéteis pesados e lentos de artilharia.

---

## 📅 Aula 6: Colisões, Explosões em Área e Gelo
* **Objetivo:** Detectar impacto de balas contra robôs, causar dano em área e desacelerar alvos com a torre de gelo.
* **Conceito de Programação:** `physics.add.overlap`, laço de verificação circular de dano em área (*splash damage*) e estados temporários (`lentoAte`).
* **Passo a passo prático:**
  1. Ligar o evento de sobreposição entre balas e o grupo de inimigos.
  2. Implementar a explosão circular com `this.tweens.add()` para o projétil do Canhão.
  3. Aplicar o efeito de lentidão aos robôs atingidos pelo feixe criogênico.
* **Desafio da aula:** Fazer o robô congelado mudar visualmente de cor para azul-gelo enquanto durar a lentidão.

---

## 📅 Aula 7: Oficina de Upgrades e Controle Manual da Mira
* **Objetivo:** Permitir ao jogador evoluir o chassi e a arma das torres, e assumir o controle do canhão com o mouse.
* **Conceito de Programação:** Mutação de propriedades de objetos, flags de controle de entrada (`emControleManual`) e redefinição gráfica.
* **Passo a passo prático:**
  1. Criar a mecânica de subir nível: aumentando alcance, cadência e dano da torre.
  2. Implementar o cano duplo visual na arma Nível 2 (estilo *Mindustry*).
  3. Ao ativar o modo manual, ligar o clique do mouse diretamente ao gatilho de fogo!
* **Desafio da aula:** Dar um bônus de 20% de dano extra para disparos feitos manualmente pelo jogador.

---

## 📅 Aula 8: HUD, Polimento Sonoro/Visual e Batalha Final
* **Objetivo:** Criar tela de vitória, tela de derrota, tremor de câmera e balancear a economia das 5 ondas.
* **Conceito de Programação:** Máquina de estados do jogo (`game loop`), tremer câmera (`cameras.main.shake`), finalização de partida.
* **Passo a passo prático:**
  1. Fazer a base perder integridade ao ser atingida e tremer a tela.
  2. Verificar vitória após a eliminação da última onda.
  3. Apresentar os jogos customizados para os colegas de classe!
* **Desafio da aula:** Adicionar uma sexta onda secreta apelidada de "Onda Titã"!
