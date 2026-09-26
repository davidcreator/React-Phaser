# Roadmap e critérios de pronto

Este roadmap organiza o trabalho por validações de risco. Datas e tamanho de equipe ainda não foram definidos; os marcos são entregas, não estimativas de calendário.

## M0 — Base do projeto · concluído

**Entregas:** GDD em `docs/`, scaffold React + Phaser, README, documentação técnica e política de conteúdo.

**Pronto quando:**
- `npm install`, `npm run typecheck` e `npm run build` passam;
- o menu inicia uma corrida Phaser e permite voltar ao menu;
- a documentação aponta decisões provisórias e a meta 10+ como não oficial.

## M1 — Travessia e domínio do carro · implementado no protótipo

**Entregas:** controlador arcade lateral, travessias longas, rampas, recursos de corrida, pontuação por saltos/manobras e quatro tipos de criaturas fantásticas.

**Critérios ainda sujeitos a playtest:**
- cada rota deve atingir o alvo de 2–4 minutos;
- aceleração, combustível e layout devem permitir decisões sem criar bloqueios de progressão;
- saltos e cambalhotas devem premiar controle, sem exigir precisão de pixel;
- cada criatura pontua uma única vez (+500), com alternativa de desvio e sem efeitos gráficos;
- teclado e controles de toque devem usar o mesmo contrato de input.

## M2 — Protótipo jogável v0.4 · quatro rotas e quatro veículos

**Entregas implementadas:**
- quatro fases jogáveis com comprimentos, rampas, obstáculos, combustíveis, sucata, ordem de monstros, paletas e temas próprios;
- seleção de fase no mapa, desbloqueio sequencial e possibilidade de repetir fases liberadas;
- quatro veículos selecionáveis com diferenças de aceleração, velocidade, autonomia, controle aéreo, estabilidade e resistência;
- desbloqueios de veículo após 0, 1, 2 e 3 missões concluídas;
- cinco categorias de melhoria, três níveis cada, guardadas por veículo;
- sucata compartilhada, relatório de corrida, save local e migração das melhorias antigas para a Fagulha.

**Pronto quando:**
- as quatro fases e os quatro veículos passam pelo fluxo seleção → corrida → resultado;
- os desbloqueios sequenciais persistem após recarregar;
- atributos base, upgrades e modificadores da fase afetam a simulação;
- sucata de falha permanece disponível; cada monstro derrotado soma 500 pontos uma única vez;
- o orçamento de conteúdo (máximo de 12 monstros por fase, sem gore) é respeitado; 10+ continua identificado como meta não oficial.

## M2.5 — Armas, power-ups e dano ao veículo v0.5 · implementado no protótipo

**Entregas implementadas:**
- arma veicular com tecla padrão `J`, remapeamento, projéteis, cadência e munição limitada; pickups de munição;
- resistência por tipo de zumbi; neutralização não gráfica por disparos, com +500 pontos uma única vez;
- contato de zumbi ativo causa dano ao carro, enquanto buzina e desvio permanecem alternativas;
- pickups de reparo e escudo temporário; upgrade de armamento por veículo (dano, cadência e capacidade);
- dano por pouso sem rodas no chão e agravamento em capotamento; condição zero quebra o veículo e encerra a tentativa com relatório seguro;
- HUD, remapeamento, controles de toque, documentação e build v0.5 atualizados.

**Pronto quando:**
- disparar, consumir/repor munição, atingir diferentes tipos de zumbi e atualizar +500 por neutralização funcionarem em corrida;
- o contato, os danos de pouso/capotamento, escudo, reparo e quebra do veículo forem observados por teste de jogo;
- upgrade de armamento mudar dano, cadência e capacidade; o input funcionar em teclado e toque;
- apresentação permanecer sem gore e limite máximo de 12 zumbis por rota continuar respeitado;
- typecheck/build passarem e a meta 10+ permanecer identificada como não oficial, sujeita a revisão do build com armas.

## M2.6 — Spritesheets veiculares v0.6 · implementado

**Entregas implementadas:**
- quatro spritesheets PNG transparentes de pixel art (96 × 80 px por quadro) e fontes SVG editáveis, uma por veículo;
- animação cíclica das rodas conforme a velocidade e orientação física do veículo;
- carregamento somente do carro selecionado e fallback para o desenho vetorial anterior;
- documentação dos arquivos e script-fonte para regeneração.

**Pronto quando:**
- os quatro spritesheets forem carregados sem erros no runtime e a orientação/escala encaixar na pista;
- a animação permanecer estável em movimento, salto, inclinação e capotamento;
- os carros continuarem legíveis no tamanho de jogo e em dispositivos móveis.

## M2.7 — Tilesets por fase e monstros v0.7 · implementação criada, playtest pendente

**Entregas:**
- quatro atlas ambientais de 48 tiles (32 × 32 px), cada um com PNG, SVG fonte, TSX externo para Tiled e manifesto JSON;
- IDs semânticos comuns entre Posto 7, Viaduto Caído, Pátio de Sucata e Saída do Anel; marcos específicos da fase usados no parallax da corrida;
- spritesheets PNG/SVG de Errante, Corredor, Saltador e Blindado, cada uma com quatro quadros transparentes de 64 × 64 px e animação integrada;
- geradores Python, registries editáveis independentes da cena e documentação de edição;
- geradores, typecheck e build executados com sucesso; atlas/monstros conferidos em dimensões, transparência, XML/JSON e resposta HTTP.

**Pronto quando:**
- todos os PNGs/TSX forem observados no runtime e as quatro fases exibirem seus marcos sem alterar a física;
- ciclo de caminhada, barra de resistência, estados de derrota/desvio/contato e fallback forem observados em playtest;
- um tileset puder ser aberto no Tiled e seus nomes/IDs corresponderem ao manifesto.

## M3 — Expansão da campanha

**Entregas futuras:** expansão para 12 fases em três regiões; checkpoints; rotas alternativas de segurança/risco; medalhas e contrarrelógio local; áudio final e assets de produção.

**Pronto quando:**
- cada fase acrescentar ou combinar mecânicas já ensinadas;
- cada veículo liberado puder concluir as fases disponíveis com balanceamento justo;
- saves e desbloqueios permanecerem íntegros após atualizar/reabrir;
- todos os assets e sons tiverem origem/licença registradas.

## M4 — Alpha e polimento

**Entregas:** conteúdo planejado completo, balanceamento, acessibilidade, QA funcional e revisão integral de conteúdo.

**Pronto quando:**
- não houver bugs bloqueadores conhecidos;
- controles essenciais funcionarem em teclado/toque;
- classificação/conteúdo forem revistos sobre o build real, não apenas no GDD;
- a lista de compatibilidade de hardware/navegadores estiver preenchida.

## M5 — Beta e distribuição

**Entregas:** build de release, material de loja, privacidade/licenças revisadas, classificação e descritores.

**Pronto quando:**
- o método de classificação aplicável à distribuição tiver sido completado;
- classificação e descritores estiverem corretos em todas as páginas/lojas;
- trailer e imagens promocionais passarem pelo mesmo gate editorial do jogo;
- changelog e plano de suporte estiverem publicados.

## Próximas prioridades

1. Fazer playtests reais das quatro rotas para medir a duração e ajustar combustível, pickups, obstáculos e danos.
2. Playtestar os spritesheets de carros e monstros, os atlas por fase (parallax, contraste e IDs), e a matriz de 4 fases × 4 veículos; verificar também munição, encontros com zumbis, colisões, capotamentos, escudos, reparos e quebras, mantendo as rotas recuperáveis.
3. Validar desbloqueios sequenciais, recompensas, save local e migração de um save v0.3 com upgrades da Fagulha.
4. Revisar apresentação e controles em telas pequenas; confirmar que HUD, garagem e quatro cards de fase cabem e continuam legíveis.
5. Fazer playtest real (incluindo toque/mobile) da arma e do dano, validar interseções de projéteis e balancear os pickups; executar `npm run typecheck`, `npm run build` e verificação HTTP da prévia.
6. Revisar a meta 10+ e os descritores no build real após a introdução de disparos contra zumbis; não prometer classificação oficial.
