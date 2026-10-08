# 📖 Glossário — Turbo Trilhas

Palavras novas do jogo explicadas com exemplos simples. Não precisa decorar: volte aqui quando encontrar um termo no código.

| Palavra | O que quer dizer | No jogo |
|---|---|---|
| **Aceleração** | A mudança da velocidade ao longo do tempo. | Segurar `D` faz o carro ganhar velocidade. |
| **Arcade Physics** | O sistema simples de física do Phaser. | Ajuda a aplicar gravidade e colisões. |
| **Ângulo** | Quanto algo está girado; medimos em graus. | O carro inclina durante uma manobra. |
| **Atrito** | Força que diminui o movimento. | Soltar o acelerador reduz a velocidade aos poucos. |
| **Câmera** | A janela que mostra uma parte do mundo. | Ela acompanha o carro pela pista. |
| **Colisão** | Quando dois corpos encostam no jogo. | O carro pode bater na pista ou numa caixa. |
| **Combo** | Uma sequência de acertos sem falhar. | Pousos seguros seguidos aumentam o multiplicador. |
| **Constante** | Um valor com nome, fácil de encontrar e ajustar. | `GRAVIDADE` guarda a força que puxa o carro para baixo. |
| **Corpo (body)** | A forma usada pela física para calcular colisões. | O corpo Arcade do carro é um retângulo. |
| **Delta time (`delta`)** | Tempo passado desde a atualização anterior do jogo. | Usamos segundos para mover o carro sem depender do computador. |
| **Debug** | Modo de investigação que mostra informações úteis para encontrar problemas. | `?debug` mostra os sensores dos pneus; `?physics` mostra corpos de colisão. |
| **Evidência** | Observação que ajuda a sustentar uma conclusão. | Comparar o HUD antes e depois de pegar um reparo. |
| **Gravidade** | Força que puxa os objetos para baixo. | Depois de uma rampa, o carro volta a descer. |
| **HUD** | Informações do jogo desenhadas na tela. | Pontos, integridade, combo e distância. |
| **Hipótese** | Uma explicação ou previsão que pode ser testada. | “Se eu reduzir o impulso, o salto ficará mais baixo.” |
| **Integridade** | Quanto o carro ainda aguenta antes do fim da corrida. | Batidas reduzem a barra; reparos recuperam parte dela. |
| **Manobra** | Movimento especial feito enquanto o carro está no ar. | Uma volta completa pode render pontos após um pouso seguro. |
| **Multiplicador** | Número pelo qual os pontos são multiplicados. | Um combo pode transformar 100 pontos em 200 ou 300. |
| **Overlap / sobreposição** | Checagem de que dois objetos estão ocupando uma área em comum, sem empurrar um ao outro. | Coletar uma porca ou uma caixa de reparo. |
| **Parallax** | Camadas do cenário se movendo em velocidades diferentes. | Nuvens (`0.08`), montanhas (`0.18`) e colinas (`0.42`) parecem estar a distâncias diferentes. |
| **TileSprite** | Imagem que se repete para preencher uma área. | O piso repete `pista-solo.png` ao longo dos trechos da pista. |
| **Tileset** | Imagem ou conjunto de imagens que formam as peças repetidas de uma fase. | O piso e a montanha distante ficam em `assets/tiles` e `assets/parallax`. |
| **Pouso seguro** | Aterrissagem controlada, com os pneus e o carro numa posição adequada. | O jogo avalia os dois sensores, o ângulo e a velocidade do impacto. |
| **Playtest** | Testar um jogo para observar como funciona e o que pode melhorar. | Uma dupla joga a pista criada por outra e dá feedback. |
| **Previsão** | O que você acha que vai acontecer antes do teste. | Escrever se aumentar o impulso vai ajudar a cruzar o buraco. |
| **Rampa** | Parte elevada que prepara um salto. | Ao passar pela zona da rampa, o carro recebe um impulso. |
| **Sensor** | Um ponto usado para perceber algo sem aparecer no desenho final. | Dois sensores virtuais representam os pneus. |
| **Sprite** | Um objeto visual que aparece no jogo. | O carro, a porca e a caixa são sprites. |
| **Textura** | A imagem que um sprite usa. | O carro usa `assets/sprites/carro-turbo.png`; rampas e itens usam texturas geradas por `Graphics`. |
| **Tween** | Uma mudança animada entre dois valores. | O texto de “Pouso perfeito!” sobe e desaparece. |
| **Variável** | Um valor que pode mudar; em um teste de design, ajustamos um parâmetro entre tentativas. | Alterar `ACELERACAO` no código muda a resposta do carro ao teclado. |
| **Velocidade vertical** | O quanto o objeto se move para cima ou para baixo. | Ajuda a descobrir se o pouso foi suave ou forte. |
| **World / mundo** | O espaço total da fase, maior ou menor que a tela. | A pista inteira é muito mais comprida que a janela visível. |
| **`update()`** | Função chamada várias vezes por segundo para atualizar o jogo. | Lê o teclado, aplica aceleração e verifica os sensores. |

## Três ideias essenciais deste projeto

1. **A tela não é o mundo inteiro.** A câmera mostra só um pedaço da pista.
2. **O desenho e a física podem ser diferentes.** A arte do carro gira; seu corpo retangular do Arcade Physics não gira junto.
3. **A regra pode combinar vários sinais.** Para pontuar um pouso, olhamos os dois pneus, o ângulo, a velocidade e se aquele salto já foi avaliado.
