# UI/UX — telas, fluxos e sistema visual

## 1. Objetivo

A interface deve parecer um terminal de evacuação recuperado: legível, funcional e com personalidade de corrida arcade. O clima é de estrada abandonada e urgência, sem gore, sustos ou ruído visual gratuito. A UI funciona em desktop e mobile; no jogo, controles de toque aparecem em telas pequenas.

## 2. Mapa de navegação

```text
Menu inicial
├── Continuar jornada → próxima fase liberada → Corrida → Resultado
├── Mapa da campanha → seleção entre 4 fases → Corrida
├── Garagem → seleção entre 4 veículos → upgrades por veículo → Corrida
├── Opções
│   ├── Áudio
│   ├── Tela
│   ├── Controles
│   ├── Acessibilidade
│   └── Idioma
└── Créditos

Corrida
├── Pausar → Retomar / Reiniciar fase / Voltar ao menu
└── Chegada ou falha → Resultado → Repetir / Oficina / Mapa
```

As fases são liberadas em sequência e as já concluídas podem ser repetidas. Os veículos liberam após 0, 1, 2 e 3 missões concluídas. Todas as telas principais mantêm um botão claro para voltar; opções e progresso ficam salvos localmente.

## 3. Telas da versão atual

### Menu inicial

- Identidade do jogo, subtítulo *Fleeing Hell* e sinal do Refúgio.
- Painel dinâmico da próxima rota liberada, com região, objetivo e progresso em 4 fases.
- Ação principal: **Continuar jornada**; ações secundárias para mapa, garagem, opções e créditos.
- Ilustração vetorial original e aviso da névoa.
- Rodapé informa modo offline, jogador único e que “10+” é meta editorial provisória, não classificação oficial.

### Mapa da campanha

- Mapa estilizado com quatro nós, rota selecionada, fases concluídas e fases bloqueadas.
- Cards de **Posto 7**, **Viaduto Caído**, **Pátio de Sucata** e **Saída do Anel** mostram objetivo, duração-alvo e estado.
- Fase bloqueada não parece botão; o texto indica qual posto anterior precisa ser concluído.
- Selecionar uma rota e confirmar inicia o trecho. Rotas já concluídas podem ser repetidas.

### Garagem

- Seletor da frota: **Fagulha** (inicial), **Corisco**, **Vaga-Lume** e **Aurora**; bloqueios mostram quantas missões faltam.
- Ilustração, categoria, papel e atributos do veículo selecionado.
- Seis melhorias compráveis por sucata: motor, pneus, suspensão, tanque, para-choque e armamento; até três níveis cada. O armamento aumenta dano, cadência e capacidade de munição.
- Níveis de upgrade são individuais por carro, enquanto a sucata é compartilhada. Mudanças ficam salvas em `localStorage`.
- A corrida inicia com o veículo e a rota atualmente selecionados. Melhorias antigas do save são migradas para a Fagulha.

### Opções

Abas verticais no desktop e faixa de categorias no mobile:

| Aba | Controles | Estado |
|---|---|---|
| Áudio | volume geral, música e efeitos | valores persistidos; mixagem aguarda integração de áudio |
| Tela | alto contraste e alternância de tela cheia | responsiva; tela cheia depende do suporte do navegador |
| Controles | remapeamento de teclas por ação | captura implementada; setas continuam como alternativa |
| Acessibilidade | reduzir movimento, tremor, legendas e assistência | preferências salvas; contraste/movimento aplicam-se à interface |
| Idioma | Português (Brasil) / English em breve | pt-BR ativo |

Preferências são salvas em `localStorage`. Alto contraste e redução de movimento refletem na interface; tela cheia usa a API do navegador. Volume, tremor, legendas e assistência de direção estão expostos, mas aguardam integração completa. Restaurar padrões pede confirmação.

### Corrida, pausa e resultado

- Quatro travessias com distância lógica de 68.000 a 82.000 unidades, 21–24 rampas, 20–23 obstáculos, pickups de combustível, sucata, munição, reparo e escudo, e no máximo 12 zumbis por fase.
- Todas as rotas têm duração-alvo de 2–4 minutos; o alvo precisa de playtest e ajuste.
- Cada rota tem tema, paleta, distribuição e modificadores próprios; os carros alteram atributos reais de simulação.
- HUD mostra fase/carro, velocidade, pontuação, sucata, zumbis neutralizados, saltos, cambalhotas, combustível, nitro, condição, munição, escudo e progresso.
- Saltos/pousos e manobras pontuam; cada zumbi neutralizado vale 500 pontos uma única vez.
- Disparo com `J` (remapeável) usa munição finita; botões de toque oferecem a mesma ação. Zumbis atingidos são neutralizados sem gore; se um zumbi ativo tocar o carro, a condição mecânica cai. Kits reparam e escudos temporários absorvem impactos.
- `Esc` ou **Pausar** congela a cena Phaser. Pousos sem rodas no chão e capotamentos causam dano; condição zero quebra o carro e encerra a tentativa sem ferimentos do piloto. O resultado mostra pontos, recursos e tempo; falhas preservam a sucata coletada.

## 4. Paleta de cores

| Token | Cor | Uso |
|---|---|---|
| Noite/carvão | `#0D1112` | fundo, estados inativos, clima de terminal |
| Carvão elevado | `#171F20` | cards, painéis e modais |
| Cinza/poeira | `#98A097` | descrição, metadados e conteúdo secundário |
| Ossos claro | `#EBE5D4` | texto principal e títulos |
| Ferrugem | `#CF603C` | alerta, ação principal e destaque de marca |
| Âmbar | `#D8A653` | coordenadas, sucata e foco secundário |
| Verde ácido | `#B6C85C` | seleção, sinal seguro e confirmação |
| Verde rádio | `#7FC7B2` | rota e feedback positivo |

Cor nunca é o único canal de informação: estados também usam texto, ícone, forma ou posição. Flashes estroboscópicos são excluídos.

## 5. Hierarquia e linguagem

- **Nível 1:** título da tela ou objetivo da corrida.
- **Nível 2:** rota, status do veículo, estado da opção ou ação primária.
- **Nível 3:** explicação, metadado, coordenada e progresso secundário.
- Botões primários usam verbo + destino (“Continuar jornada”, “Iniciar Saída do Anel”).
- Mensagens de falha descrevem o estado mecânico; não usam “morreu”, “eliminado” nem linguagem punitiva.
- Microcopy tem tom de rádio/terminal curto, mas evita abreviações que prejudiquem compreensão.

## 6. Acessibilidade e interação

- Navegação por teclado, foco visível, botões semânticos e controles com `aria-label`/estado.
- Alvos de toque adequados, com `touch-action: none` nos botões de direção.
- Reduzir movimento desativa animações decorativas da interface.
- Alto contraste ajusta tokens de texto, contornos e estados.
- `Esc` cancela uma remapagem; bindings duplicados são rejeitados com mensagem.
- `Escape` pausa/retoma durante a corrida; `blur` da janela solta inputs de toque.

## 7. Critérios de aceite de UX

1. Em até uma tela, a pessoa consegue iniciar a próxima rota ou chegar ao mapa/garagem/opções.
2. Fases bloqueadas informam a condição de desbloqueio e não aceitam ativação.
3. A garagem indica carro selecionado, atributos, bloqueios e melhorias individuais.
4. As opções persistem após recarregar; restaurar padrões pede confirmação.
5. Layout não sobrepõe o canvas em desktop; em mobile, controles e HUD continuam legíveis.
6. A meta 10+ não é divulgada como indicação oficial. Disparos e impactos são não gráficos e limitados a zumbis ficcionais; não há ferimentos de ocupantes.
7. A camada Phaser só é carregada ao iniciar uma corrida.

## 8. Arquivos de implementação

- `src/App.tsx` — navegação, campanha, garagem, persistência e resultados.
- `src/styles.css` — tokens, layout responsivo e estados.
- `src/game/content.ts` — conteúdo de fases, veículos e regras de desbloqueio.
- `src/game/stageLayout.ts` — distribuição determinística de rampas, coletáveis, obstáculos e monstros.
- `src/game/input.ts` — contrato de teclas e controles de toque.
- `src/game/scenes/RaceScene.ts` — simulação e HUD da corrida.
