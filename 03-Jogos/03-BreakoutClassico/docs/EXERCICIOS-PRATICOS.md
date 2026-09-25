# Exercícios práticos

Os exercícios aumentam gradualmente de dificuldade. Faça uma alteração por vez, rode os testes e confira o [checklist de QA](./QA-CHECKLIST.md). A intenção é aprender pelo código do projeto, não copiar um tutorial sem observar a Scene.

## Nível 1 — Ajustar parâmetros do jogo

**Objetivo:** mudar a velocidade da barra e entender as constantes.

1. Abra `src/game/rules.js` e altere `PADDLE.speed`.
2. Rode `npm test` e `npm run build`.
3. Teste movimentação para a esquerda e direita no jogo.

**Critérios:** a barra continua dentro do campo; o teclado e gamepad mantêm o mesmo comportamento; nenhuma regra de score ou colisão muda.

## Nível 2 — Personalizar a formação de tijolos

**Objetivo:** desenhar outro padrão sem misturar dados e sprites.

1. Edite `buildBrickLayout()` em `src/game/rules.js` para gerar um padrão alternado, buracos ou uma pirâmide.
2. Preserve limites do mundo e tamanho dos tijolos.
3. Acrescente um teste em `rules.test.js` para o padrão (use um RNG fixo).
4. Teste ao menos dois níveis e o modo Duelo.

**Critérios:** não há tijolos fora do campo nem sobre a barra; a contagem inicial e o avanço de nível continuam corretos.

## Nível 3 — Criar um power-up temporário

**Objetivo:** aprender geração, coleta, timer, HUD e expiração.

Como exercício, adicione um efeito “Paddle Turbo” que aumenta temporariamente a velocidade da barra:

1. Defina label, ícone, cor e duração em `POWER_UPS`.
2. Implemente a ativação em `collectPowerUp()` e use `startTimedEffect()`.
3. Implemente a restauração em `expireEffect()`.
4. Decida e implemente o que acontece se coletar o mesmo efeito novamente (sugestão: estender o timer, sem multiplicar velocidade).
5. Verifique que pausa congela a duração e que reiniciar/perder vida remove o efeito.

**Critérios:** sem velocidade acumulada após várias coletas; HUD mostra o tempo; barra ainda respeita os limites do campo.

## Nível 4 — Adicionar um modo de jogo

**Objetivo:** seguir uma regra do menu até a Scene.

Crie um modo “Precisão” com uma vida e pontos bônus por rebater a bola perto do centro da barra:

1. Adicione a chave ao objeto `MODES` e um cartão em `MODE_CARDS` no `App.jsx`.
2. Defina vidas e regras do modo em funções puras em `rules.js`.
3. Faça a Scene aplicar bônus de centro sem alterar o comportamento dos outros modos.
4. Atualize o HUD e os textos de controles.
5. Escreva testes para as regras novas.

**Critérios:** modo inicia e reinicia isoladamente; os outros três modos não mudam; tela final explica score/resultado.

## Nível 5 — Melhorar cobertura de QA

**Objetivo:** transformar uma sequência manual em automação de navegador.

Crie um teste E2E com Playwright ou ferramenta equivalente para:

1. abrir a página;
2. selecionar o modo Clássico;
3. aguardar o canvas e o indicador “PRONTO”;
4. lançar com Espaço;
5. pausar e continuar;
6. retornar ao menu e abrir outro modo;
7. falhar se o console registrar erro ou existirem canvases duplicados.

**Critérios:** o teste roda em CI com as dependências do browser instaladas e os erros de ambiente ficam diferenciados de erros da aplicação.

## Desafio final — revisar uma mudança como em equipe

Antes de considerar um exercício concluído, responda no pull request:

- Qual regra mudou e onde ela mora?
- Que teste demonstra o comportamento esperado?
- Que estados precisam ser limpos ao reiniciar?
- Quais modos/dispositivos foram verificados?
- Há efeito colateral no tamanho do bundle ou no input?
