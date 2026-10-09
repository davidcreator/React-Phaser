# 🧑‍🏫 Material do Professor — Orientações Pedagógicas

Este guia auxilia educadores, instrutores de robótica/programação e pais que guiam jovens de 8 a 16 anos na criação do jogo **Guardiões do Reator**.

---

## 💡 Princípios Didáticos para Jovens de 8 a 16 anos

1. **Menos Sintaxe Rígida, Mais Feedback Visual Imediato:**
   * Crianças e adolescentes se desmotivam quando passam 40 minutos apenas digitando texto sem ver nada se mover na tela.
   * Por isso, o jogo foi estruturado com formas geométricas desenhadas via código (`Graphics`). Qualquer mudança de cor, tamanho ou velocidade aparece imediatamente no navegador.

2. **Analogias do Cotidiano para Conceitos Matemáticos:**
   * **Ângulo da Mira:** *"Pense no ponteiro do relógio: se o inimigo está às 3 horas, o ponteiro deita. Se está ao meio-dia, o ponteiro sobe."*
   * **Caminho / Curva Paramétrica:** *"Imagine uma linha de trem. O robô é o trem que só anda pelos trilhos de 0% até 100%."*
   * **Dano em Área (Splash Damage):** *"Como jogar uma bexiga de água no chão: ela molha quem está bem no meio e espirra em quem está em volta."*

3. **Inclusão do Modo de Ação Manual:**
   * Muitos jogos de Tower Defense puramente táticos podem se tornar monótonos para alunos mais novos (8–10 anos). O recurso de poder **clicar na torre e atirar você mesmo usando o mouse** traz adrenalina imediata e ensina sobre eventos de entrada (`Pointer Events`).

---

## 🛠️ Dúvidas Frequentes dos Alunos e Como Solucionar

### 1. "O jogo não abre ao clicar no index.html"
* **Causa:** O arquivo `lib/phaser.min.js` precisa estar exatamente na pasta `lib/` relativa ao `index.html`.
* **Solução:** Verifique se a estrutura de pastas do projeto está mantida.

### 2. "A torre não atira nos inimigos"
* **Causa:** Os alunos costumam errar o cálculo do raio de alcance ou a verificação do `tempoAtual > torre.proximoDisparo`.
* **Dica:** Peça para o aluno colocar `console.log(dist)` dentro de `atualizarTorres` para ver a distância medida pelo computador no console (tecla F12).

### 3. "Como colocar imagens/PNGs no lugar das formas geométricas?"
* O código foi feito com nomes de texturas padronizados em `this.desenharTexturas()`.
* Na Aula 8, convide os alunos que gostam de desenho digital a salvarem seus próprios arquivos PNG (em pixel art ou vetoriais) na pasta `assets/` e carregá-los via `this.load.image(...)` no método `preload()`.

---

## 🏆 Critérios de Avaliação Formativa
Ao invés de provas escritas, avalie os alunos por meio de sua criatividade e aplicação prática:
- **Nível 1 (Compreensão):** Consegue alterar as constantes de vida, velocidade e energia para equilibrar o jogo;
- **Nível 2 (Aplicação):** Consegue criar um novo tipo de torre ou inimigo copiando e adaptando a estrutura existente;
- **Nível 3 (Autonomia):** Consegue inventar uma nova regra de jogo (como minas terrestres, super bombas ou bônus de pontuação).
