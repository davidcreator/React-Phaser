# ⚡ Guardiões do Reator — Tower Defense de Ação 2D

> **Meu Quarto Jogo (React + Phaser)** · **Nível:** Intermediário · **Público:** 8–16 anos · **Tempo:** 8 aulas de 50–60 min  
> **Gênero:** Tower Defense tático com ação em tempo real (inspirado em *Mindustry* e *Plants vs. Zombies*).

Proteja o Núcleo de Energia construindo torres de defesa estrategicamente posicionadas na trilha! Invasores robóticos de diferentes classes tentarão marchar até o reator. Melhore as bases das torres para aumentar o alcance e o poder de fogo, instale canhões duplos e assuma o controle manual da mira para disparar diretamente com o mouse nos momentos mais críticos.

---

## 🎮 Jogue agora

### Jeito 1 — Sem instalar nada (Modo Offline Rápido)
1. Abra a pasta `05-QuartoJogo`.
2. Dê dois cliques em `index.html`.
3. O jogo abrirá no seu navegador favorito (Chrome, Edge, Firefox), sem precisar de internet ou instalação de dependências.

O Phaser já está incluído localmente em `lib/phaser.min.js`. Todos os gráficos de torres, projéteis, lasers e robôs são gerados matematicamente via código (`Phaser.Graphics`), facilitando a customização por qualquer aluno.

### Jeito 2 — React + Vite (Modo Moderno)
```bash
cd react
npm install
npm run dev
```
Abra o endereço que o Vite mostrar (normalmente `http://localhost:5173`). O React monta a interface externa e o componente `PhaserGame.jsx` encapsula a cena do jogo.

---

## 🕹️ Controles

| Comando | Ação |
|---|---|
| `Clique Esquerdo (Slot vazio)` | Constrói a torre atualmente selecionada |
| `Clique Esquerdo (Torre pronta)` | Abre o painel de upgrades e seleção de mira |
| `Botão Direito` ou `ESC` | Fecha o painel e desmarca a torre focada |
| `Teclas 1, 2 e 3` | Seleciona rapidamente entre Sentinela, Canhão e Criogênica |
| `Espaço` | Inicia a próxima onda de invasores antecipadamente |
| `Mouse + Clique (Modo Manual)` | Mira onde o mouse aponta e dispara rajadas manuais contínuas |
| `R` | Recomeça a partida após Vitória ou Derrota |

---

## 🎯 O que você aprende neste projeto

- **Caminhos e Trilha Paramétrica:** Criando curvas e trajetórias contínuas com `Phaser.Curves.Path`;
- **Inimigos Inteligentes:** Deslocamento proporcional usando frações de progresso e interpolação de pontos;
- **Grid / Slots Estilo PvZ:** Posicionamento de estruturas com controle de estados e custos;
- **Matemática da Mira 2D:** Cálculo de ângulo e direção usando `Phaser.Math.Angle.Between`;
- **Física Balística e Grupos:** Disparo de projéteis com velocidade vetorial (`velocityFromRotation`);
- **Dano em Área e Efeitos:** Explosões com raio de impacto (*splash damage*) e efeito de gelo;
- **Sistema de Upgrades:** Aprimoramento de chassi e troca de arma para cano duplo;
- **Modo Híbrido:** Transição suave entre automação tática e tiro de ação manual.

---

## 🗼 As Torres e suas Evoluções

1. **Sentinela (70⚡):** Torre de fogo rápido. Dispara lasers de plasma leve com alta cadência. Excelente contra enxames de inimigos pequenos.
2. **Canhão de Plasma (110⚡):** Torre de impacto pesado. Dispara ogivas que explodem ao tocar o alvo, causando dano a todos os robôs num raio de impacto (Mindustry style).
3. **Torre Criogênica (90⚡):** Torre de utilidade e controle de grupo. Lança pulsos gélidos que reduzem a velocidade de marcha dos robôs pela metade.

---

## 📚 Trilha de Aulas

O plano completo para os professores está em [`ROTEIRO-DE-AULAS.md`](ROTEIRO-DE-AULAS.md), as fichas de desafios para os estudantes estão em [`ATIVIDADES-DO-ALUNO.md`](ATIVIDADES-DO-ALUNO.md) e as explicações de termos técnicos em [`GLOSSARIO.md`](GLOSSARIO.md):

1. **Aula 1:** O Mundo Futurista e a Trilha de Concreto (`Curves.Path`);
2. **Aula 2:** A Marcha dos Inimigos e o Spawner de Ondas;
3. **Aula 3:** Plataformas de Construção e Gastos de Energia;
4. **Aula 4:** Mira Automática: Rastreador de Inimigos com Ângulos 2D;
5. **Aula 5:** Balística e Disparos (`Phaser.Physics.Arcade`);
6. **Aula 6:** Impacto, Dano em Área e Efeitos de Desaceleração;
7. **Aula 7:** A Oficina de Upgrades e a Mira Manual do Jogador;
8. **Aula 8:** HUD, Balanceamento de Ondas, Vitória e Derrota.

---

## 🧱 Estrutura dos Arquivos

```text
05-QuartoJogo/
├── README.md                  # Este documento
├── ROTEIRO-DE-AULAS.md        # Guia do professor para as 8 aulas
├── ATIVIDADES-DO-ALUNO.md     # Desafios práticos (Níveis Fácil, Médio e Hacker)
├── MATERIAL-DO-PROFESSOR.md   # Dicas pedagógicas e soluções de dúvidas
├── GLOSSARIO.md               # Dicionário de termos de desenvolvimento de jogos
├── index.html                 # Versão que roda sem instalar nada
├── index.css                  # Estilo da página
├── lib/
│   └── phaser.min.js          # Biblioteca Phaser 3 local
├── src/
│   ├── main.js                # Inicialização e configuração da tela
│   └── scenes/
│       └── Jogo.js            # Código didático completo dividido em ETAPAS 0 a 8
└── react/                     # Versão React + Vite
    ├── package.json
    └── src/
        ├── App.jsx
        ├── PhaserGame.jsx
        └── scenes/
            └── Jogo.js
```
