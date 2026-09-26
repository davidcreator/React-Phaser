# Apocalypse Race: Fleeing Hell
## Game Design Document (GDD) — versão 0.5

> **Documento vivo de referência do projeto.** Esta revisão registra a versão jogável v0.5 com armas arcade, power-ups e danos ao veículo, além das quatro fases e quatro veículos; registra também os limites de conteúdo e decisões de design. O alvo de 2–4 minutos por fase e o balanceamento ainda precisam de playtests; decisões marcadas como provisórias podem ser revistas.

| Campo | Definição |
|---|---|
| Projeto | **Apocalypse Race: Fleeing Hell** |
| Tipo de documento | GDD — visão de produto e especificação de design |
| Versão / status | 0.5 — protótipo com quatro fases, quatro veículos, armas e power-ups; documento vivo, não especificação final de produção |
| Data | 25/09/2026 |
| Gênero | Corrida arcade 2D lateral / sobrevivência veicular |
| Jogadores | 1 jogador; experiência offline-first |
| Público pretendido | Aventura arcade para público familiar e jogadores casuais |
| Classificação pretendida | **Não recomendado para menores de 10 anos (10+) — objetivo de design, ainda não oficial** |
| Plataformas iniciais | Navegador desktop e mobile; controles e desempenho ainda sujeitos a validação |
| Tecnologia | React + TypeScript + Phaser 3; build com Vite (proposta) |
| Idioma inicial | Português brasileiro (pt-BR) |

---

## 1. Resumo executivo

**Apocalypse Race: Fleeing Hell** é um jogo 2D de corrida arcade com visão lateral. A pessoa escolhe entre quatro veículos e atravessa quatro rotas iniciais — Posto 7, Viaduto Caído, Pátio de Sucata e Saída do Anel — entre rampas, sucata, neblina e zumbis ficcionais. A diversão vem de dominar aceleração, combustível, impulsos e aterrissagens, escolher quando disparar ou desviar, além de somar pontos por saltos, manobras e neutralizações estilizadas sem gore. A campanha maior permanece planejada para 12 fases; apenas as quatro rotas iniciais estão implementadas.

A referência é o ritmo de corrida/sobrevivência veicular de jogos como *Zombie Derby*, reinterpretado com identidade própria e limites explícitos de conteúdo. O jogo não reproduz personagens, arte, interface, fases, textos, veículos identificáveis ou outros materiais de terceiros.

### Elevador pitch

> **Prepare o carro, escolha a rota e atravesse uma estrada em colapso. Cada rampa, litro de combustível e segundo de nitro pode ser a diferença entre chegar ao refúgio ou voltar para a oficina.**

### Promessa ao jogador

- Dirigir é imediatamente divertido, mas dominar o peso e o equilíbrio do carro exige prática.
- Cada trecho oferece escolhas legíveis: acelerar, conservar combustível, buscar sucata ou pegar uma rota mais segura.
- Falhar significa aprender e tentar de novo — nunca ver uma morte gráfica ou perder todo o progresso.
- O apocalipse é uma aventura estilizada: tensão leve, humor visual e perigo sem gore.

---

## 2. Visão do produto

### 2.1 Objetivos de design

1. Criar um controle lateral de veículo responsivo, gostoso de dominar com teclado, controle ou toque.
2. Fazer combustível, condição do carro e nitro gerarem decisões simples e relevantes durante uma corrida curta.
3. Entregar fases rejogáveis de aproximadamente **2 a 4 minutos**, com objetivos opcionais e medalhas.
4. Manter todo o conteúdo dentro do orçamento interno para buscar a faixa **10+**, sem tratar isso como garantia de classificação oficial.
5. Construir uma base técnica sustentável: React para o shell e interfaces de produto; Phaser para jogo, simulação e renderização.

### 2.2 Fora dos objetivos da versão 1.0

- Multiplayer, PvP, chat, voz, conteúdo gerado por usuários ou compartilhamento de imagens.
- Armas realistas, disparos contra humanos/animais, mortes em cena, sangue, ferimentos ou gore.
- Simulação realista de direção, mundo aberto ou campanha narrativa longa com cenas cinematográficas extensas.
- Caixas-surpresa, apostas, anúncios comportamentais ou compras que alterem o equilíbrio competitivo.
- Reproduzir a estrutura, o conteúdo ou a identidade visual de outro jogo.

### 2.3 Pilares de experiência

| Pilar | Regra prática de design |
|---|---|
| **Domínio do veículo** | A física deve comunicar peso, suspensão, tração e aterrissagem sem exigir precisão de simulador. |
| **Risco calculado** | Combustível, condição e nitro são recursos diferentes; o jogador entende o custo de cada decisão. |
| **Ação arcade sem gore** | Uma arma veicular estilizada só pode atingir zumbis ficcionais; a neutralização é instantânea, sem sangue, feridas, corpos ou sofrimento. |
| **Recomeço justo** | Reinício rápido, checkpoints selecionados e melhorias permanentes evitam punição excessiva. |
| **Leitura imediata** | Perigos, combustível, rotas e comandos são identificáveis mesmo em telas pequenas. |

---

## 3. Público, classificação e política de conteúdo

### 3.1 Meta de classificação

A meta de produção é **Não recomendado para menores de 10 anos (10+) no Brasil**. A indicação ainda não foi atribuída por uma loja, pelo IARC ou pelo Ministério da Justiça; portanto, não deve ser divulgada como classificação oficial antes da avaliação aplicável à versão final.

A referência normativa consultada para este GDD é a **5ª edição (2025) do Guia Prático de Classificação Indicativa**. O Guia considera a obra como um todo e avalia, entre outros aspectos, incidência, relevância narrativa, impacto imagético, composição, contexto, frequência e fatores atenuantes ou agravantes. **Não foi identificada uma cota oficial universal do tipo “até X impactos por fase”.** Por isso, os números abaixo são limites internos de produção e teste — não são uma fórmula oficial nem garantem uma classificação específica.

### 3.2 Orçamento interno de conteúdo

| Elemento | Limite de produção para o jogo inteiro | Como será representado |
|---|---:|---|
| Sangue ou líquido visualmente semelhante a sangue | **0** | Não criar, inclusive em partículas, decalques, menus, trailers ou imagens promocionais. |
| Feridas abertas, ossos expostos, vísceras, mutilação, desmembramento ou cadáveres | **0** | Não mostrar nem sugerir por enquadramento, som ou texto. |
| Morte em cena de humano/animal ou sofrimento prolongado | **0** | Nenhum personagem humano ou animal morre ou sofre dano em cena; sem morte gráfica. Zumbis ficcionais podem ser neutralizados por disparo sem representação de ferida, conforme os limites abaixo. |
| Ferimento ou morte de civis | **0** | Civis permanecem em locais seguros; não há vítimas em pista ou cenários. |
| Ataques contra humanos/animais, armas realistas ou efeitos de ferimento | **0** | Há uma arma veicular estilizada com projéteis abstratos, utilizável somente contra zumbis ficcionais; não há feridas, sangue, pontos vitais ou sofrimento. A meta 10+ exige revisão no build final e não é garantida. |
| Replays, câmera lenta ou close de impacto contra personagem | **0** | Impactos nunca recebem destaque cinematográfico. |
| Zumbis ficcionais neutralizados | **Até 12 por fase**, alvo interno de no máximo **4 em qualquer janela de 30 s**; efeito instantâneo | O zumbi desaparece ao ser atingido, sem corpo, sangue ou sofrimento. A rota também permite desviar ou usar a buzina; cada neutralização concede +500 pontos, não sucata. Reavaliar a classificação pela interação de disparo no build final. |
| Zumbis simultâneos em primeiro plano | **Até 3** | Silhuetas ficcionais estilizadas, sem decomposição, feridas ou sofrimento. |
| Momentos de tensão/medo leve | **Até 2 por fase**, no máximo **5 s cada** | Neblina, ruído de rádio ou perigo de pista claramente legível; sem sustos repentinos ou ameaça gráfica. |
| Surtos de luz / flashes | **0 flashes estroboscópicos** | Luzes estáveis ou transições suaves; opção de reduzir movimento e efeitos. |
| Gritos de dor, sons úmidos de impacto, ossos quebrando | **0** | Colisões usam sons mecânicos/cartunescos; criaturas usam vocalização de surpresa ou som de desaparecimento, nunca dor. |
| Linguagem ofensiva, sexualização, nudez, drogas ou apostas | **0** | Não fazem parte de narrativa, arte, áudio, anúncios ou funcionalidades. |

**Interpretação:** os limites de frequência servem como *content budget* de produção e facilitam auditoria. Uma ocorrência isolada de alto impacto pode pesar mais do que diversas ocorrências leves; ficar dentro desses números não assegura classificação 10+.

### 3.3 Regras obrigatórias de apresentação

- Os zumbis são alvos ficcionais estilizados — Errante, Corredor, Saltador e Blindado — sem aparência de cadáver, ferida ou anatomia humana realista.
- Disparos abstratos podem neutralizar um zumbi: ele some instantaneamente, sem corpo ou ferimento visível, e concede **500 pontos** uma única vez. O contato de um zumbi ainda ativo causa dano mecânico ao carro, mas não pontua nem mostra lesão no alvo.
- O jogador pode disparar, desviar, frear ou usar a buzina para afastar os zumbis. A rota oferece escolha entre segurança e pontuação; a arma só interage com os zumbis da fase, sem alvos humanos/animais ou combate realista.
- Em falha, o carro perde velocidade, para ou é rebocado para um ponto seguro. Não há ocupantes feridos, explosão com pessoas dentro nem tela de morte.
- Cenários pós-apocalípticos mostram infraestrutura abandonada, vegetação e veículos vazios — sem pilhas de corpos ou vestígios gráficos de vítimas.
- A mesma política vale para telas de carregamento, arte de loja, trailer, capturas, redes sociais, tutoriais e material de divulgação.
- Toda mudança de roteiro, animação, som, dificuldade ou marketing deve passar pela lista de verificação da seção 16 antes de ser aprovada.

### 3.4 Classificação digital e interação

O Guia de 2025 acrescentou o eixo de interatividade para produtos digitais. A versão inicial será offline-first: sem chat, voz, multiplayer, compras dentro do jogo, publicidade, compartilhamento de localização ou conteúdo de usuários. A faixa final e os descritores devem ser confirmados no processo de autoclassificação aplicável à plataforma de distribuição, inclusive no IARC quando exigido.

---

## 4. Universo e narrativa

### 4.1 Premissa

Após uma sequência de blecautes, uma névoa luminosa cobre as estradas do Vale Aurora e faz zumbis ficcionais de formas variadas vagarem sem direção. As comunidades se organizaram em postos de apoio. Lia, mecânica e piloto, recebe pelo rádio o último pedido de escolta até o Refúgio Aurora. Para chegar, precisa reabrir trechos da estrada, encontrar combustível e levar kits de reparo entre os postos.

O tom é de aventura de estrada com humor e companheirismo. O mistério da névoa é uma moldura narrativa; não há cenas de pessoas morrendo, luto gráfico ou terror realista.

### 4.2 Personagens

| Personagem | Papel | Diretriz de representação |
|---|---|---|
| **Lia** | Mecânica e piloto; personagem jogável | Confiante, prática e solidária. Nunca é mostrada ferida. |
| **Pipo** | Rádio/assistente de rota instalado no painel | Dá instruções curtas, humor leve e feedback de controle; não coleta dados do jogador. |
| **Nara** | Responsável pela oficina do Refúgio Aurora | Libera veículos e melhorias; aparece em locais seguros. |
| **Zumbis da névoa** | Alvos ficcionais atraídos por luzes e ruídos | Quatro silhuetas estilizadas; podem ser evitados, desviados ou neutralizados de forma não gráfica. |
| **Comboio da Poeira** | Rivais de corrida em desafios opcionais | Competição amigável contra tempos/veículos sem combate ou lesões. |

### 4.3 Arco da campanha

1. **A partida:** Lia recebe o sinal do Refúgio Aurora e prepara o carro na oficina.
2. **Reabrir a estrada:** a piloto atravessa o Anel Velho e aprende a lidar com rampas, combustível e Errantes.
3. **Atravessar a pedreira:** rotas alternativas e equipamentos recuperados revelam uma passagem segura.
4. **A corrida final:** o comboio precisa vencer a aproximação da névoa e alcançar a estação de retransmissão.
5. **Chegada:** a campanha termina com a comunidade reunida em segurança. O encerramento é positivo; não há morte ou sacrifício mostrado.

A narrativa é entregue por diálogos curtos no rádio e cenas estáticas de baixa intensidade, sem interromper a corrida por longos períodos.

---

## 5. Estrutura de jogo e loop principal

### 5.1 Loop de uma sessão

1. Escolher uma fase no mapa.
2. Preparar o veículo na oficina: conferir atributos, combustível e módulos.
3. Correr, equilibrar o carro, escolher rotas e coletar sucata/combustível.
4. Saltar, executar cambalhotas controladas e escolher entre disparar contra zumbis para pontuar, desviá-los com a buzina ou evitar contato.
5. Chegar ao posto ou à linha de chegada; se falhar, consultar o relatório, manter a sucata coletada e preparar uma nova tentativa.
6. Comprar melhorias, desbloquear veículo/rota e iniciar a próxima fase.

### 5.2 Loop de direção

- Acelerar para ganhar velocidade e superar aclives.
- Frear para controlar aterrissagens e conservar combustível.
- Inclinar o veículo no ar para pousar com as rodas no chão.
- Usar nitro em retas, rampas ou trechos de subida.
- Ler a pista e escolher entre rota rápida arriscada e rota mais segura.
- Disparar com arma veicular estilizada (munição limitada), desviar com a buzina ou evitar zumbis ativos. Neutralizações são não gráficas e pontuam; contato de zumbi causa dano apenas à condição mecânica do carro.

### 5.3 Estados da corrida

`Preparação → Contagem curta → Corrida → Checkpoint (opcional) → Resultado → Oficina/Mapa`

- **Vitória:** cruzar a linha de chegada ou alcançar o posto de evacuação.
- **Falha recuperável:** combustível zerado ou condição do carro esgotada. No protótipo atual, a corrida termina sem ferimentos e abre o relatório; sucata coletada fica salva para comprar melhorias antes da próxima tentativa. Checkpoints são uma entrega futura.
- **Pausa:** congela a simulação; oferece retomar, reiniciar, configurações e sair.
- **Sem vidas limitadas:** o jogador pode tentar novamente sem perder melhorias ou moeda já conquistada.

---

## 6. Mecânicas

### 6.1 Veículo e física

A direção deve parecer arcade e legível, não simulador. O carro tem aceleração, frenagem, inclinação no ar, suspensão, aderência e resposta distinta sobre as superfícies. O terreno é composto por rampas, vales e segmentos de pista projetados para leitura clara.

**Requisitos de sensação:**

- Acelerar e frear respondem imediatamente, com inércia suficiente para dar peso.
- O jogador consegue corrigir uma aterrissagem usando inclinação; pousar sem as rodas no chão causa dano, e capotar aumenta o impacto. A recuperação arcade recoloca o carro sobre as rodas.
- Colisões ambientais ou com zumbis ativos causam perda de velocidade/condição do veículo, sem animação de ocupante atingido.
- O nitro não torna obrigatório acertar um salto com precisão de pixel.
- A pista indica saltos, buracos e rotas antes que seja tarde para reagir.

### 6.2 Recursos de corrida

| Recurso | Uso | Falha/limite | Reposição |
|---|---|---|---|
| **Combustível** | Aceleração e avanço | Ao zerar, o veículo para com segurança e vai ao checkpoint/reboque | Reservatórios de pista, postos e melhorias de tanque |
| **Condição do veículo** | Representa o estado mecânico | Em zero, o carro quebra e a tentativa termina; nunca representa ferimentos | Kits de reparo e oficina |
| **Nitro** | Impulso curto para rampas e trechos difíceis | Barra esvazia e recarrega com o tempo; não causa explosão | Recarga gradual e módulos de motor |
| **Munição** | Disparos contra zumbis ficcionais | Reserva finita; sem munição não há tiro | Caixas de munição e upgrade de armamento |
| **Escudo temporário** | Absorve impactos por curto período | Duração limitada; HUD indica o tempo | Pickups de escudo |
| **Sucata** | Moeda de progressão | Não é comprada com dinheiro real na versão 1.0 | Coletáveis, objetivos e resultados |

### 6.3 Armas, ferramentas e itens

- **Arma veicular:** dispara projéteis abstratos na direção da pista; `J` é o padrão e a ação pode ser remapeada. Segurar dispara em sequência, com cadência limitada. Cada carro começa com reserva finita.
- **Armamento calibrado:** upgrade individual de veículo, até 3 níveis; eleva dano por disparo, cadência e capacidade de munição.
- **Caixa de munição:** pickup que repõe parte da reserva, sem ultrapassar a capacidade do carro.
- **Buzina de rota:** emite um sinal musical curto que desvia zumbis próximos. É alternativa à arma, sem pontuação.
- **Kit de oficina:** recupera parte da condição mecânica do carro.
- **Escudo temporário:** absorve por alguns segundos danos de colisão, contato de zumbi e pouso/capotamento.
- **Galão de combustível:** recupera combustível; nitro recarrega gradualmente.

O armamento só pode atingir zumbis ficcionais; não há alvos humanos/animais, munição realista, feridas, sangue ou sofrimento. O jogador pode concluir a rota sem disparar.

### 6.4 Obstáculos e adversidades

- Sucata e veículos vazios; rampas e valas; placas caídas; lama, cascalho e poças; portões que abrem em ciclo; rajadas de vento; trechos com baixa aderência.
- Os perigos devem ser antecipados por silhueta, cor, animação ou sinal sonoro.
- Obstáculos atingidos geram faíscas pequenas, poeira ou peças leves — nunca sangue, fogo envolvendo pessoas ou destroços corporais.
- Sem armadilhas instantaneamente fatais. Todo obstáculo deve ter uma resposta de direção, frenagem ou escolha de rota.

### 6.5 Zumbis da névoa

A rota combina zumbis ficcionais com silhuetas, movimentos, resistência e cores diferentes. O disparo que esgota a resistência os neutraliza de imediato e sem gore; se um zumbi ainda ativo tocar o veículo, o carro perde condição e velocidade. O contato não concede pontos nem mostra ferimento. Desviar ou tocar a buzina continua sendo uma opção.

| Tipo | Comportamento / resistência | Leitura/contrajogo |
|---|---|---|
| **Errante** | Caminha em pequenos zigue-zagues; resistência baixa | Aproximação lenta; permite disparar, saltar ou desviar |
| **Corredor** | Desloca-se lateralmente; resistência baixa | Tente atingi-lo antes do contato ou desvie |
| **Saltador** | Faz pequenos saltos sobre a pista; resistência média | A altura varia; pode ser atingido no ar ou contornado |
| **Blindado** | Silhueta robusta, resistência alta | Requer mais disparos sem upgrade ou armamento melhorado; também pode ser desviado |

Uma buzina de rota pode desviar os zumbis próximos, sem pontuação. Cada uma das quatro fases jogáveis contém até 12 encontros no total, distribuídos ao longo do percurso; a cena limita aparições em primeiro plano.

### 6.6 Pontuação e medalhas

O placar recompensa domínio do veículo e a progressão da corrida:

- **Salto:** 100 pontos base + 70 por segundo no ar (até 3 s); pouso controlado concede mais 100.
- **Cambalhota completa:** +500 por rotação controlada, registrada quando o carro aterrissa com segurança; máximo de 3 por salto.
- **Zumbi neutralizado:** +500 pontos por alvo atingido até esgotar sua resistência; cada zumbi pontua uma vez. Desvio por buzina, contato com o carro e colisão com obstáculo não concedem pontos.
- Tempo, combustível restante e condições da corrida aparecem no relatório final; podem influenciar medalhas em fases futuras.

No protótipo, concluir concede 1 medalha; pontuação de 7.000 concede 2 e de 13.000 concede 3 (limiares provisórios de balanceamento). Tentativas interrompidas registram pontuação e sucata coletada, mas não concedem medalhas de conclusão. A pontuação não é convertida diretamente em sucata.

---

## 7. Progressão, carros e economia

### 7.1 Veículos do protótipo

Os quatro veículos estão implementados com atributos efetivos e paletas/silhuetas próprias. Os requisitos de desbloqueio contam missões concluídas com sucesso.

| Veículo | Perfil | Ponto forte | Troca de balanceamento | Liberação |
|---|---|---|---|---:|
| **Fagulha** | Picape inicial equilibrada | Controle geral e atributos medianos | Sem especialização | Inicial |
| **Corisco** | Furgão de oficina | Tanque, estabilidade e consumo eficiente | Velocidade máxima menor | 1 missão |
| **Vaga-Lume** | Buggy de trilha | Aceleração, velocidade e controle aéreo | Tanque menor e pouca proteção | 2 missões |
| **Aurora** | Caminhão de resgate | Tanque grande, tolerância a pousos e armadura | Aceleração e velocidade mais baixas | 3 missões |

Nomes, silhuetas e detalhes visuais são originais; não usar marcas ou modelos reais sem licença. A progressão de fases é sequencial e os postos já concluídos podem ser repetidos.

### 7.2 Melhorias

Cada veículo tem seu próprio conjunto de até 3 níveis por categoria; a sucata é compartilhada entre a frota:

1. **Motor:** aceleração e velocidade máxima.
2. **Pneus de trilha:** reduzem a perda de velocidade, considerando o terreno da fase.
3. **Suspensão elevada:** aumenta controle no ar e tolerância a pousos.
4. **Tanque estendido:** amplia a capacidade de combustível e o ganho por galão.
5. **Para-choque reforçado:** reduz perda de condição e velocidade em impactos.
6. **Armamento calibrado:** aumenta dano por disparo, cadência e capacidade de munição.

A oficina e as compras por sucata estão implementadas. O carro inicial começa sem melhorias e com 180 unidades de sucata, o bastante para escolher entre instalações de nível 1. Os upgrades de cada veículo são persistidos localmente e seus efeitos são passados à simulação. A migração de saves v0.3 preserva os níveis antigos na Fagulha.

### 7.3 Economia e desbloqueios

- As fases contêm pacotes de sucata (20 unidades cada) e combustível; concluir concede 45 unidades de bônus. A sucata coletada também permanece em uma tentativa interrompida.
- Neutralizar zumbis rende pontuação, não sucata adicional; isso separa placar de economia de oficina.
- Sucata, upgrades por veículo, carro selecionado e fases concluídas são salvos em `localStorage`.
- A primeira fase é aberta por padrão; concluir uma rota abre a próxima. Rotas anteriores podem ser repetidas.
- Corisco, Vaga-Lume e Aurora são liberados após 1, 2 e 3 missões concluídas, respectivamente.
- Melhorias não podem ser compradas com dinheiro real na versão 1.0; não há energia diária, vidas ou temporizadores de espera.
- Rejogar fases é opcional; o progresso principal não depende de repetição excessiva.

---

## 8. Modos e conteúdo de lançamento

### 8.1 Modos

- **Campanha atual:** 4 fases jogáveis em três regiões, com desbloqueio progressivo. **Meta futura:** expansão para 12 fases.
- **Contrarrelógio:** repetir fases para melhorar o próprio tempo; fantasma local opcional.
- **Treino:** pista curta na oficina, com comandos, física e obstáculos básicos.

Sem placar online ou interação entre usuários na primeira versão.

### 8.2 Regiões e fases jogáveis

As quatro rotas abaixo estão implementadas no protótipo v0.5. Cada uma tem alvo de duração de **2–4 minutos**; os comprimentos e recursos foram definidos para esse intervalo, ainda sujeito a playtest e balanceamento.

| Código | Fase / região | Distância lógica | Rampas / obstáculos | Combustível / sucata | Munição / reparo / escudo | Zumbis | Identidade/modificador |
|---|---|---:|---:|---:|---:|---|
| 01 | **Posto 7** · Anel Velho | 68.000 | 21 / 20 | 9 / 12 | 6 / 4 / 3 | 12 | Corredor urbano; terreno e consumo-base |
| 02 | **Viaduto Caído** · Anel Velho | 72.000 | 22 / 21 | 10 / 13 | 6 / 4 / 3 | 12 | Estruturas suspensas; rugosidade 1,14× e consumo 1,03× |
| 03 | **Pátio de Sucata** · Pedreira Clara | 76.000 | 23 / 22 | 10 / 15 | 7 / 4 / 3 | 12 | Pedreira irregular; rugosidade 1,32× e consumo 1,08× |
| 04 | **Saída do Anel** · Cinturão Verde | 82.000 | 24 / 23 | 11 / 16 | 7 / 5 / 4 | 12 | Faixa verde com neblina; rugosidade 1,20× e consumo 1,12× |

As três regiões e quatro fases adicionais permanecem no escopo futuro da campanha de 12 fases. O mapa libera fases em sequência; uma rota concluída pode ser repetida. A pressão vem da estrada, dos recursos e da escolha de risco, não de uma luta contra chefe.

### 8.3 Blueprint da primeira fase — “Posto 7”

1. **Largada segura:** Lia e Pipo apresentam aceleração e HUD sem perigo.
2. **Primeiras rampas:** o jogador aprende a controlar saltos; pousos limpos e cambalhotas somam pontos.
3. **Postos de recursos:** galões, sucata, munição, kits de reparo e escudos aparecem ao longo de aproximadamente 68 mil unidades de pista, com duração-alvo de 2–4 minutos.
4. **Zumbis da névoa:** até 12 encontros no total; distribui Errantes, Corredores, Saltadores e Blindados. Disparos neutralizam (+500 pontos cada); desvio com buzina ou evitar contato também são possíveis. Zumbis não neutralizados que atingem o carro causam dano mecânico.
5. **Obstáculos alternados:** sucata na pista fica depois de rampas, oferecendo risco para quem não consegue saltar ou frear.
6. **Posto de chegada:** relatório apresenta pontuação, saltos, manobras, zumbis neutralizados, condição, combustível e sucata; a oficina permite instalar até 3 níveis por componente.

A reserva inicial permite preparar o carro antes da primeira tentativa. Sucata coletada em uma tentativa interrompida permanece disponível, evitando bloqueio de progressão.

---

## 9. Controles

### 9.1 Teclado

| Ação | Padrão |
|---|---|
| Acelerar | `W` ou `↑` |
| Frear | `S` ou `↓` |
| Inclinar para frente/trás | `A` / `D` ou `←` / `→` |
| Nitro | `Shift` |
| Buzina de rota | `Espaço` |
| Disparar arma (segure para disparos em sequência) | `J` |
| Pausar | `Esc` |

### 9.2 Toque e controle

- **Mobile:** modo paisagem; botões para acelerar, frear, inclinar, nitro, buzina e disparo. Botões devem ficar afastados da área de câmera/notch e permitir ajuste de opacidade/tamanho.
- **Gamepad:** acelerador e freio nos gatilhos; inclinação no analógico; nitro e buzina em botões remapeáveis; Start pausa.
- A pessoa pode remapear teclas e alterar sensibilidade/assistência.

---

## 10. Interface e fluxo de telas

### 10.1 Telas

1. **Título:** iniciar, continuar, configurações, créditos.
2. **Mapa da campanha:** regiões, fases, medalhas, objetivos e desbloqueios.
3. **Oficina:** selecionar veículo, aplicar melhorias, ver atributos comparativos.
4. **Corrida:** HUD e pausa.
5. **Resultado:** medalhas, sucata, objetivo concluído e opções de repetir/continuar.
6. **Configurações:** controles, acessibilidade, áudio, idioma e opções visuais.

### 10.2 HUD durante a corrida

- Velocidade; combustível; condição mecânica; nitro; munição; duração de escudo.
- Pontuação, zumbis neutralizados, saltos/manobras e indicador de progresso/rota.
- Feedback de tutorial contextual, dispensável depois da primeira leitura.
- Pausa sempre acessível e sem penalidade por abrir.

### 10.3 Regras de UX

- Não cobrir a próxima seção da pista com HUD ou botão.
- Usar ícone + texto/cor para recursos, não depender apenas de cor.
- Exibir tutorial em blocos curtos; permitir reler na oficina.
- Evitar compras ou anúncios intercalados na tela de resultado.
- Ao perder, dizer a causa de forma neutra (“combustível esgotado”, “veículo precisa de reparo”), sem tela ou frase de morte.

---

## 11. Direção de arte e animação

### 11.1 Estilo

- 2D lateral com formas claras, contorno legível e proporções levemente exageradas.
- Veículos com materiais de sucata e cores de alto contraste; personagens amigáveis e expressivos.
- Cenários pós-apocalípticos sem imagens de vítimas: estradas vazias, placas, oficinas, vegetação e equipamentos abandonados.
- Paleta de base em cinza-azulado e terra, contrastada com amarelo de sinalização, verde-limão e ciano para itens e rotas seguras.
- Evitar a associação do vermelho intenso com sangue; danos do veículo usam amarelo, branco, poeira e pequenas faíscas.

### 11.2 Animação

- Suspensão, rodas, poeira, balanço do chassi e inclinação são os principais sinais de velocidade.
- Reações de Errantes devem durar pouco e comunicar surpresa/desorientação, não dor.
- Sem detalhe de ferimento, decomposição, partes do corpo ou sofrimento.
- A câmera não aproxima para impacto. Tremor de tela é baixo por padrão e pode ser desligado.

### 11.3 Produção de assets

Todo asset deve ter: nome, tamanho-alvo, animações, camadas de parallax, licença/origem, contraste, uso em telas pequenas e revisão de conteúdo. Assets de terceiros precisam de licença compatível com distribuição comercial.

---

## 12. Áudio e música

- **Música:** aventura rítmica, percussão leve e synth/cordas; intensidade aumenta em trechos de fuga, sem terror persistente.
- **Veículo:** motor, suspensão, pneus, vento e avisos de painel com prioridade de mixagem.
- **Interface:** sinais curtos e distintos para combustível, nitro, checkpoint e objetivo.
- **Errantes:** sons estilizados e baixos, como murmúrio curioso ou surpresa; nunca gritos de dor, respiração realista angustiante ou som úmido de impacto.
- Controles separados para música, efeitos, ambiente e voz; opção de legendas para falas de rádio.
- Sem picos bruscos de volume; sustos sonoros não são usados como mecânica.

---

## 13. Acessibilidade, segurança e privacidade

### 13.1 Acessibilidade

- Assistência de direção opcional, janela mais generosa para rampas e redução do consumo de combustível.
- Opção de reduzir tremor, partículas, movimento de fundo e velocidade dos efeitos.
- Sem flashes estroboscópicos; alertas visuais sempre acompanhados por som ou texto quando adequado.
- Contraste alto, tamanho de texto ajustável e escala de HUD.
- Paletas alternativas e ícones/símbolos para diferenciar recursos, sem depender apenas de cor.
- Controles remapeáveis e modo de toque configurável.
- Pausa a qualquer momento, inclusive durante falas e sequência de fuga.

### 13.2 Segurança e dados

- Primeira versão single-player, sem chat, voz, perfil público, geolocalização ou conteúdo de usuário.
- Salvamento local com progresso, configurações e recordes pessoais; sem exigir conta.
- Se telemetria vier a ser considerada, será minimizada, documentada e revisada quanto a privacidade antes de entrar no build. Não coletar nome, localização ou dados sensíveis para medir desempenho do jogo.
- Não direcionar publicidade comportamental a crianças. Modelo comercial ainda deve ser definido; proposta inicial: jogo pago ou demonstração gratuita sem anúncios e sem loot boxes.

---

## 14. Arquitetura técnica implementada — React + Phaser

### 14.1 Responsabilidades

- **React:** shell da aplicação, título, mapa, oficina, configurações, telas de resultado e componentes de interface fora do canvas.
- **Phaser:** cenas de corrida, renderização, câmera, entrada em tempo real, animações, colisões, áudio de jogo e HUD que precisa acompanhar a simulação.
- **TypeScript:** contratos tipados entre dados, cenas e camada React.
- **Vite:** desenvolvimento e build web; dependências e versões fixadas no lockfile.

A aplicação deve manter uma única instância de `Phaser.Game` por sessão. O componente React cria a instância ao montar o container e encerra listeners/instância ao desmontar; React não deve renderizar em cada frame da simulação.

### 14.2 Organização implementada

```text
src/
  App.tsx                       # telas, fluxo de campanha, garagem e save
  styles.css                    # interface responsiva
  game/
    content.ts                  # fases, carros, atributos, paletas e desbloqueios
    createRaceGame.ts           # inicialização Phaser por seleção
    input.ts                    # contrato teclado/toque
    stageLayout.ts              # layout determinístico por fase
    types.ts                    # resultado e callbacks
    upgrades.ts                 # categorias, custos e sanitização
    scenes/RaceScene.ts         # corrida, HUD, cenários e simulação
```

### 14.3 Decisões técnicas iniciais

- Prototipar um controlador arcade de veículo com atualização de física em passo fixo, terreno segmentado e suspensão simplificada. O objetivo é sensação consistente, não simulação automotiva.
- Usar colisões/sensores do Phaser para obstáculos, itens e limites; revisar a escolha de física após o protótipo da primeira rampa. Não iniciar produção de fases antes de validar dirigibilidade.
- Comunicar eventos de jogo ao React por um barramento tipado (ex.: `RACE_STARTED`, `FUEL_CHANGED`, `STAGE_FINISHED`). Os listeners devem ser removidos corretamente ao sair de cenas.
- Separar dados de fase e veículo do código para balanceamento sem alterar a lógica principal.
- Salvar versão de schema. Ao atualizar o jogo, migrar saves antigos ou oferecer um reset seguro.

### 14.4 Requisitos técnicos-alvo

- Resolução lógica inicial: 1280 × 720; escala responsiva com prioridade para paisagem e área segura de dispositivos móveis.
- Meta de 60 FPS em hardware-alvo definido no protótipo; modo degradado estável em aparelhos modestos.
- Carregamento de fase com feedback; assets comprimidos e carregados por região.
- Não depender de recursos remotos para iniciar uma sessão offline após o carregamento inicial.
- Compatibilidade validada em navegadores-alvo, teclado, toque e ao menos um gamepad no ciclo de testes.

---

## 15. Escopo, produção e entregas

### 15.1 Protótipo jogável (v0.5)

- Menu, mapa, garagem, opções, pausa e resultados em React; corrida em Phaser.
- Quatro fases jogáveis (68.000–82.000 unidades lógicas), com alvo de 2–4 minutos e contagens de rampas, obstáculos e recursos definidas na seção 8.2.
- Quatro veículos selecionáveis com atributos, silhuetas/paletas e desbloqueios após 0, 1, 2 e 3 missões concluídas.
- Seis categorias de upgrade com até três níveis por veículo, incluindo armamento; sucata compartilhada e persistência local.
- Pontuação por saltos/pousos, cambalhotas controladas e +500 por zumbi neutralizado uma única vez; nenhum ponto por obstáculo, contato ou zumbi desviado. Arma, munição e melhorias de armamento implementadas.
- Teclado e toque; dano por contato com zumbi, obstáculo e pouso sem rodas no chão; capotamento com impacto agravado; escudo, reparo e quebra por condição zero. Falha termina sem dano a ocupantes e preserva sucata coletada. Checkpoints ainda não estão implementados.
- Saves anteriores migram upgrades existentes para a Fagulha.

**Critérios de validação:** todas as quatro rotas devem concluir com as configurações liberadas; seleção, unlocks e save devem persistir; upgrades e atributos dos carros alteram a simulação; duração de 2–4 minutos ainda requer medição real. Manter no máximo 12 zumbis por fase e não ultrapassar os limites de conteúdo da seção 3.

### 15.2 Escopo-alvo da versão 1.0

- Campanha com 12 fases e 3 regiões.
- 4 veículos, 6 categorias de melhoria e 3 sequências de fuga.
- Campanha, treino e contrarrelógio local.
- Português brasileiro; estrutura pronta para incluir inglês e espanhol.
- Acessibilidade e controles da seção 13; nenhuma funcionalidade social/online.
- Avaliação da faixa indicativa e dos descritores antes de distribuição pública.

### 15.3 Fases de produção

| Marco | Entrega | Condição para avançar |
|---|---|---|
| **M0 — GDD** | Visão, escopo e política de conteúdo aprovados | Decisões fundamentais registradas |
| **M1 — Protótipo de direção** | Carro, rampa, terreno e câmera | Controle divertido e previsível em teclado/toque |
| **M2 — Protótipo jogável v0.4** | Quatro fases, quatro veículos, UI, saves e desbloqueios | Fluxo seleção → corrida → resultado e builds automatizadas funcionando; balanceamento ainda em teste |
| **M2.5 — Protótipo de combate arcade v0.5** | Armas, munição, power-ups, dano de zumbis/pouso/capotamento e quebra do veículo | Disparos, upgrades, dano, reparo e escudo validados em playtest; revisão de conteúdo/classificação feita no build real |
| **M3 — Expansão de conteúdo** | Oito fases restantes, áudio, checkpoints e rotas alternativas | Ferramentas de balanceamento e pipeline estáveis |
| **M4 — Alpha** | Conteúdo completo, acessibilidade e QA interno | Sem bloqueadores de conteúdo, funcionalidade ou performance |
| **M5 — Beta/release** | Polimento, classificação, páginas de loja e build final | IARC/processo aplicável, descritores e divulgação revisados |

---

## 16. QA, testes e critérios de aceite

### 16.1 Testes de jogo

- Cada fase é concluível com o veículo e os recursos liberados naquele ponto.
- Existem ao menos duas estratégias viáveis em trechos-chave: velocidade/risco e segurança/eficiência.
- Falha por combustível ou condição sempre comunica causa e opção de recuperação.
- Checkpoints não deixam o jogador preso nem removem progresso permanente.
- A física não varia de forma perceptível com taxa de atualização diferente.
- Disparo consome munição, caixas repõem até a capacidade, tipos com resistência maior exigem mais acertos sem upgrade e cada neutralização concede +500 uma vez.
- Zumbi ativo em contato danifica o veículo; pouso sem rodas e capotamento causam dano; kit/escudo afetam esses resultados e condição zero encerra a corrida.
- Todos os controles essenciais funcionam em teclado e toque; gamepad é validado antes da versão 1.0.
- O save persiste após fechar/reabrir e não corrompe ao atualizar a versão.

### 16.2 Revisão de conteúdo a cada build

Para cada cena, animação, som, texto, item, captura e peça de marketing, confirmar:

- [ ] Nenhum sangue, ferida, corpo, morte em cena, gore ou detalhe realista.
- [ ] Nenhum ocupante ferido em colisão; nenhuma vítima humana em cenário.
- [ ] Nenhum som de dor, grito, osso, impacto úmido ou susto sonoro brusco.
- [ ] Limites de frequência da seção 3 respeitados por fase e por sequência.
- [ ] Pontos por zumbi são concedidos uma única vez por neutralização; sem repetição de impacto, corpos ou bônus de moeda. Disparos não atingem humanos ou animais.
- [ ] A neutralização por disparo é instantânea, cartunesca e sem sofrimento; sempre existe opção de evitar ou desviar com a buzina, sem obrigação de atirar.
- [ ] Sem flashes estroboscópicos, tremor excessivo ou texto ofensivo.
- [ ] Descritores e classificação não são anunciados como oficiais antes de confirmação.

### 16.3 Teste com público

Realizar sessões formativas com consentimento e acompanhamento apropriado, observando compreensão dos controles, leitura dos perigos, nível de tensão e clareza da falha. Não coletar informações pessoais de crianças. Comentários sobre medo/desconforto devem ser tratados como sinal para revisar a cena, não como teste de tolerância.

---

## 17. Métricas de sucesso

Métricas de produto, sem perfilamento invasivo:

- porcentagem de pessoas que concluem o tutorial sem ajuda externa;
- taxa de conclusão da primeira fase e de cada região;
- tempo médio por fase e frequência de reinícios voluntários;
- uso de rotas alternativas e melhorias;
- taxa de falhas atribuídas a confusão de controle versus desafio intencional;
- desempenho (FPS, carregamento, erros e quedas) nos aparelhos-alvo;
- feedback qualitativo de acessibilidade e adequação do tom.

O placar local da corrida registra zumbis neutralizados para explicar os pontos; essa contagem não será usada como métrica externa de engajamento, retenção ou perfilamento.

---

## 18. Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Física do carro fica frustrante ou imprevisível | Alto | Prototipar uma rampa antes de criar muitas fases; usar física arcade e checkpoints. |
| Armas e neutralizações interativas elevam a classificação acima da meta | Alto | Projéteis abstratos, zumbis ficcionais até 12 por fase, desaparecimento instantâneo sem gore, alternativa de desvio; revisar frequência, contexto, interação e impacto no build e no processo IARC. A classificação final não é garantida pelo GDD. |
| Toque ocupa a pista ou é impreciso | Alto | Testes em paisagem, botões redimensionáveis e assistência de direção. |
| Escopo de 12 fases excede a capacidade de produção | Médio/alto | Fechar vertical slice antes; reutilizar módulos de pista sem repetir o mesmo desafio. |
| Arte/áudio de terceiros sem licença adequada | Alto | Inventário de fontes, contratos/licenças e aprovação antes de integrar. |
| Salvamento local se perde ou quebra entre versões | Médio | Versionar schema, testar migrações e permitir recuperação/reset compreensível. |
| Métricas entram em conflito com privacidade de público jovem | Alto | Offline-first; sem conta, chat, geolocalização ou coleta de dados pessoais. |

---

## 19. Decisões registradas e questões abertas

### Decisões desta versão

- **D01:** jogo de corrida arcade com visão lateral, em 2D.
- **D02:** a meta editorial é 10+; classificação oficial ainda pendente.
- **D03:** sem gore, armas realistas, disparos contra humanos/animais, morte/ferimento em cena nem sofrimento gráfico; arma veicular estilizada só afeta zumbis ficcionais, que desaparecem sem restos ou dor.
- **D04:** single-player e offline-first na primeira versão.
- **D05:** React + TypeScript para shell/interfaces; Phaser 3 para jogo.
- **D06:** falha é mecânica e recuperável; sem tela de morte.
- **D07:** pontuação premia saltos, cambalhotas e zumbis neutralizados por arma (+500 uma vez); contato com zumbi causa dano apenas ao carro. Sem gore, repetição de impacto ou sucata por neutralização.

### Decisões a fechar antes da produção completa

1. Plataforma prioritária de lançamento: web, Steam, mobile ou lançamento escalonado.
2. Modelo comercial: jogo pago, demo gratuita ou outro modelo sem anúncios invasivos.
3. Configuração mínima de hardware e navegadores oficialmente suportados.
4. O contrarrelógio usará fantasma local gravado ou apenas recordes pessoais?
5. Idiomas da versão 1.0 além de pt-BR.
6. Nome comercial, disponibilidade de marca/domínio e revisão jurídica do título.

---

## 20. Glossário

- **Zumbis da névoa:** quatro tipos ficcionais (Errante, Corredor, Saltador e Blindado) com silhueta e resistência próprias.
- **Fase:** percurso de corrida com largada, obstáculos, itens, zumbis e chegada; as quatro rotas jogáveis têm duração-alvo de 2–4 minutos.
- **Checkpoint:** ponto seguro que permite retomar uma corrida após falha.
- **Nitro:** impulso temporário de velocidade.
- **Sucata:** moeda não premium obtida jogando e usada na oficina.
- **Orçamento de conteúdo:** limites internos de produção; não substitui avaliação oficial.
- **Vertical slice:** pequena parte completa do jogo que valida direção, arte, tecnologia, interface e conteúdo.

---

## 21. Referências e nota de conformidade

1. **Ministério da Justiça e Segurança Pública — Guia Prático de Audiovisual, Aplicativos e RPG, 5ª edição (2025).** [PDF oficial](https://www.gov.br/mj/pt-br/assuntos/seus-direitos/classificacao-1/classind-audio-visual-2025-vs-10-nova-faixa.pdf)
2. **MJSP — lançamento da 5ª edição do Guia Prático de Classificação Indicativa (17/11/2025).** [Página oficial](https://www.gov.br/mj/pt-br/assuntos/noticias/mjsp-lanca-nova-edicao-do-guia-pratico-de-classificacao-indicativa)
3. **MJSP — legislação de Classificação Indicativa, incluindo Portaria MJSP nº 1.048/2025.** [Página oficial](https://www.gov.br/mj/pt-br/assuntos/seus-direitos/classificacao-1/paginas-classificacao-indicativa/legislacao)

> **Nota:** este GDD é uma diretriz de desenvolvimento, não um parecer jurídico nem uma classificação emitida pelo poder público ou por uma loja. Antes da publicação, revisar a versão final do jogo, o questionário do sistema de classificação aplicável, os descritores, os materiais de divulgação e as normas vigentes na data do lançamento.
