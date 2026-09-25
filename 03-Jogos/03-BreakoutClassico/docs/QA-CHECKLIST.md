# QA e checklist de validação

## Comandos automatizados

Na raiz do projeto:

```bash
npm ci
npm test
npm run build
npm audit
```

Os testes atuais cobrem regras puras: formação de blocos e limites, progressão de resistência, ângulo/velocidade da rebatida, direção de input, vidas por modo, placar no Duelo e limite de velocidade.

## Checklist manual antes de publicar

### Inicialização e navegação

- [ ] Menu aparece sem erros no console.
- [ ] Abrir cada modo cria exatamente um canvas e um loop de jogo.
- [ ] Voltar ao menu e iniciar outra partida não acelera o jogo nem duplica a cena.
- [ ] Reiniciar durante jogo e após pausa reseta score, vidas, nível e power-ups.

### Jogabilidade

- [ ] Lançar com Espaço, clique e toque.
- [ ] Bola rebate nas paredes, tijolos e barras sem atravessá-los em velocidades altas.
- [ ] Colisão lateral/canto de tijolo não causa dano repetido enquanto a bola continua presa no mesmo bloco.
- [ ] Bola que passa da barra reduz vida apenas quando todas as bolas do jogador se perderam.
- [ ] Completar uma formação avança o nível e atualiza o score.
- [ ] Pausar por alguns segundos preserva o tempo restante dos power-ups.

### Modos

- [ ] Clássico começa com três vidas, concede vida bônus a cada três níveis e mostra Game Over ao esgotá-las.
- [ ] Sobrevivência começa com uma vida e termina ao perdê-la, salvo se coletar vida extra.
- [ ] Duelo concede pontos nos dois lados de forma simétrica e termina aos cinco pontos.
- [ ] Duelo não gera power-ups; os dois jogadores conseguem mover as barras ao mesmo tempo.

### Power-ups e controles

- [ ] Barra ampliada permanece dentro do campo mesmo quando ativada perto da borda.
- [ ] Recoletar Bola Lenta estende sua duração sem multiplicar a lentidão.
- [ ] Multibola adiciona bolas e remove o indicador quando resta apenas uma.
- [ ] Soltar analógico/D-pad do gamepad interrompe o movimento; testar desconexão.
- [ ] Perder foco da janela não deixa tecla de movimento presa.

### Layout/dispositivos

- [ ] Verificar larguras de 320, 390, 768 e 1440 px.
- [ ] Canvas mantém proporção, não cria overflow horizontal e continua recebendo touch.
- [ ] Testar Chrome/Edge e pelo menos um navegador móvel suportado pelo público-alvo.
- [ ] Confirmar controles com teclado e, quando disponível, gamepad físico.

## Estado conhecido da entrega

- A suite automatizada contém 7 testes e passou no ambiente de build usado para esta versão.
- `npm run build` passou. Vite pode emitir aviso de chunk grande para o Phaser; a carga do jogo é lazy, então o engine só é solicitado ao entrar em um modo.
- `npm audit` reportou zero vulnerabilidades no lockfile validado.
- **QA E2E/visual não está automatizado nesta entrega.** O Chromium headless do ambiente de autoria não iniciou por ausência de `libnspr4.so`; isso é uma dependência do ambiente, não uma mensagem de erro do jogo. Execute o checklist manualmente num navegador real antes de publicar.