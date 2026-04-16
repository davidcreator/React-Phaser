# 🏓 PongEdu — Aprendizado Interativo com Jogos

> Uma recriação pedagógica do clássico Pong, construída com **Phaser 3** + **React 18**, baseada em metodologias modernas de aprendizagem por jogos.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Como Executar](#como-executar)
- [Telas e Funcionalidades](#telas-e-funcionalidades)
- [Controles](#controles)
- [Opções de Jogo](#opções-de-jogo)
- [Metodologia Pedagógica](#metodologia-pedagógica)
- [Arquitetura do Projeto](#arquitetura-do-projeto)
- [Customização](#customização)
- [Créditos](#créditos)
- [Licença](#licença)

---

## 🎯 Visão Geral

**PongEdu** é mais do que um simples jogo — é uma **plataforma de aprendizado interativa** que utiliza o jogo Pong como veículo pedagógico para desenvolver habilidades cognitivas e motoras em estudantes de todas as idades.

O projeto combina:
- A **simplicidade** e o **engajamento** do arcade clássico
- **Dificuldade adaptável** baseada na Zona de Desenvolvimento Proximal (Vygotsky)
- **Feedback imediato** com dicas pedagógicas contextuais
- **Gamificação** para aumentar motivação intrínseca

---

## 🛠 Tecnologias

| Tecnologia       | Versão  | Função                                |
|------------------|---------|---------------------------------------|
| **Phaser 3**     | 3.60.0  | Motor de renderização e física do jogo |
| **React**        | 18.x    | Gerenciamento de UI e estado (telas)   |
| **Babel**        | Latest  | Transpilação JSX inline no browser    |
| **Web Audio API**| Native  | Efeitos sonoros procedurais           |
| **CSS3**         | Native  | Animações, gradientes, scanlines      |

**Dependências via CDN** (sem necessidade de instalação):
```
https://unpkg.com/react@18/umd/react.production.min.js
https://unpkg.com/react-dom@18/umd/react-dom.production.min.js
https://unpkg.com/@babel/standalone/babel.min.js
https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js
```

---

## 🚀 Como Executar

### Modo Simples (recomendado para sala de aula)

1. Faça o download do arquivo `index.html`
2. Abra diretamente em qualquer navegador moderno (Chrome, Firefox, Edge, Safari)
3. **Nenhuma instalação necessária!**

### Modo Servidor Local (recomendado para desenvolvimento)

```bash
# Com Python 3
python -m http.server 8080

# Com Node.js / npx
npx serve .

# Acesse: http://localhost:8080
```

### Requisitos Mínimos

- Navegador com suporte a **ES6+** e **Web Audio API**
- Resolução mínima: **800 × 500 px**
- Conexão com internet (apenas para carregar as fontes e bibliotecas CDN no primeiro uso)

---

## 🖥 Telas e Funcionalidades

### 🏠 Tela Inicial (Home)

A tela principal apresenta o logotipo animado **PongEDU** com efeito de gradiente e estrelas pulsantes no fundo. Botões de navegação:

| Botão         | Destino                           |
|---------------|-----------------------------------|
| ▶ Jogar       | Inicia a partida com as opções atuais |
| ⚙ Opções      | Configurações detalhadas do jogo  |
| 📚 Metodologia | Explicação da base pedagógica     |
| ★ Créditos    | Informações sobre o projeto       |

### ⚙ Tela de Opções

Permite configurar:
- **Dificuldade**: Iniciante / Intermediário / Avançado
- **Modo de Jogo**: 1 Jogador (vs IA) / 2 Jogadores
- **Pontuação para vencer**: 3 / 5 / 7 / 11 pontos
- **Dicas Pedagógicas**: Ativas/Inativas (toggle)
- **Som**: Ligado/Desligado (toggle)
- **Rastro da Bola**: Ligado/Desligado (toggle)

### 📚 Tela de Metodologia

Apresenta as bases teóricas do projeto com descrição de cada abordagem pedagógica aplicada.

### ★ Tela de Créditos

Informações sobre o projeto, tecnologias utilizadas e referências ao Pong original (Atari, 1972).

### 🎮 Tela de Jogo

- **HUD** com placar em tempo real, nome do modo e dificuldade
- **Dicas em toast** exibidas após cada ponto (se ativado)
- **Overlay de Pausa** com dica aleatória
- **Overlay de Game Over** com estatísticas da partida e mensagem motivacional

---

## 🎮 Controles

| Ação                    | Jogador 1 | Jogador 2 (modo 2P) |
|-------------------------|-----------|----------------------|
| Mover paddle para cima  | `W`       | `↑`                  |
| Mover paddle para baixo | `S`       | `↓`                  |
| Pausar / Retomar        | `ESC`     | `ESC`                |

> No modo **1 Jogador**, o Jogador 2 é controlado por IA com velocidade proporcional à dificuldade escolhida.

---

## ⚙ Opções de Jogo

### Dificuldades

| Nível         | Velocidade da Bola | Velocidade da IA | Indicado para           |
|---------------|--------------------|------------------|-------------------------|
| Iniciante     | 3.5×               | 2.5×             | Primeiros contatos, crianças até 8 anos |
| Intermediário | 5.5×               | 4.0×             | Alunos com experiência básica em jogos  |
| Avançado      | 8.0×               | 6.5×             | Desafio competitivo, adultos            |

### Sistema de Pontuação

- Cada vez que a bola ultrapassa o paddle adversário, o jogador marca **1 ponto**
- O jogo termina quando um jogador atinge a **pontuação configurada**
- O rally máximo (trocas consecutivas de bola) é registrado nas estatísticas finais

---

## 📚 Metodologia Pedagógica

O PongEdu foi projetado com base em cinco pilares educacionais:

### 1. 🧱 Construtivismo (Jean Piaget)

> *"O conhecimento não é dado, ele é construído pelo aprendiz."*

O jogo encoraja o **aprendizado pela ação direta**. Cada partida é uma oportunidade de testar hipóteses (se eu mover o paddle aqui, a bola irá para lá), observar resultados e construir modelos mentais sobre trajetórias e física básica.

### 2. 🤝 Zona de Desenvolvimento Proximal (Lev Vygotsky)

A **dificuldade adaptável** mantém o desafio calibrado ao nível do jogador:
- **Iniciante**: margem de erro maior, IA previsível → zona de conforto
- **Intermediário**: equilíbrio entre erro e acerto → zona de aprendizagem ideal (ZDP)
- **Avançado**: IA muito reativa, bola rápida → zona de desconforto produtivo

### 3. 🎮 Gamificação (Karl Kapp)

Elementos de gamificação implementados:
- **Pontuação em tempo real** → senso de progresso
- **Contagem de rally** → recompensa por consistência
- **Mensagem personalizada no Game Over** → feedback emocional
- **Efeitos visuais e sonoros** → reforço sensorial imediato

### 4. 💬 Feedback Imediato

Pesquisas em neurociência da aprendizagem mostram que **feedback imediato** acelera a aquisição de habilidades. Após cada ponto, uma dica pedagógica contextual é exibida abordando:
- Raciocínio antecipatório
- Estratégias de posicionamento
- Regulação emocional e resiliência
- Física do movimento (ângulos, velocidade)

### 5. 🔁 Aprendizagem Baseada em Jogo (GBL — James Paul Gee)

O jogo como ambiente de aprendizado desenvolve:

| Habilidade                  | Como o Pong a desenvolve                          |
|-----------------------------|--------------------------------------------------|
| **Coordenação olho-mão**    | Rastrear a bola e mover o paddle sincronizadamente |
| **Raciocínio espacial**     | Prever trajetórias em 2D                         |
| **Pensamento antecipatório**| Posicionar-se antes da chegada da bola           |
| **Regulação emocional**     | Lidar com vitórias, derrotas e sequências        |
| **Concentração sustentada** | Manter o foco durante o jogo inteiro             |
| **Persistência**            | Tentar novamente após perder                     |

### 6. 🌀 Metacognição

As dicas incentivam o jogador a **refletir sobre o próprio processo de aprendizagem**, desenvolvendo consciência metacognitiva. Exemplos:

- *"Cada erro é uma oportunidade de aprendizado. Observe o padrão."*
- *"Foque nos movimentos, não no placar. O desempenho virá!"*
- *"Raciocínio antecipatório: visualize a trajetória da bola."*

---

## 🏗 Arquitetura do Projeto

```
index.html
│
├── HTML / CSS (Estilo Global)
│   ├── CSS Variables (tema de cores)
│   ├── Scanline overlay (efeito retro)
│   ├── Componentes visuais (.btn, .panel, .chip, .toggle)
│   └── Animações (fadeIn, twinkle, toast)
│
└── JavaScript / JSX (Babel transpilado)
    │
    ├── CONSTANTS
    │   ├── TIPS[]          — Array de dicas pedagógicas
    │   └── DIFFICULTIES{}  — Configurações por nível
    │
    ├── React Components
    │   ├── <Stars />        — Background animado
    │   ├── <HomeScreen />   — Tela inicial
    │   ├── <OptionsScreen />— Configurações
    │   ├── <PedagogyScreen />— Metodologia
    │   ├── <CreditsScreen />— Créditos
    │   ├── <GameScreen />   — Wrapper do jogo (HUD, overlays)
    │   └── <App />          — Roteador de telas (state machine)
    │
    └── Phaser 3
        └── GameScene (Phaser.Scene)
            ├── create()     — Inicializa assets, paddles, bola, input
            ├── update()     — Loop de física e input
            ├── launchBall() — Lança/relança a bola com ângulo aleatório
            ├── setupSound() — Inicializa Web Audio API
            ├── playBeep()   — Síntese de som procedural
            └── flashPaddle()— Feedback visual de colisão
```

### Fluxo de Dados React ↔ Phaser

```
React (App State)
    │
    ├── options (difficulty, mode, winScore, tips, sound, trail)
    │         ↓ passado como parâmetro
    └── createPhaserGame(containerId, options, callbacks)
                │
                ├── callbacks.onScore(p1, p2)  → atualiza React state
                ├── callbacks.onPause()         → exibe overlay de pausa
                └── callbacks.onGameOver(...)   → exibe overlay de game over
```

---

## 🎨 Customização

### Adicionar Novas Dicas

Edite o array `TIPS` no início do script:

```javascript
const TIPS = [
  "💡 Sua nova dica aqui!",
  // ... outras dicas
];
```

### Adicionar Novo Nível de Dificuldade

```javascript
const DIFFICULTIES = {
  // ... níveis existentes
  expert: { aiSpeed: 9.0, ballSpeed: 11.0, label: "Expert", color: "#ff9900" },
};
```

### Alterar Pontuação Padrão

Modifique o estado inicial em `<App />`:

```javascript
const [options, setOptions] = useState({
  winScore: 11,  // ← Altere aqui
  // ...
});
```

### Trocar Cores do Tema

Edite as CSS Variables no `<style>`:

```css
:root {
  --accent:  #00e5ff;  /* Cor principal (jogador 1) */
  --accent2: #ff4081;  /* Cor secundária (jogador 2 / IA) */
  --accent3: #69ff47;  /* Cor de destaque (nível, rally) */
}
```

---

## 👥 Uso em Sala de Aula

### Sugestões Pedagógicas

1. **Aquecimento cognitivo (5 min)**: Inicie a aula com uma rodada rápida no modo Iniciante para ativar concentração
2. **Discussão sobre física (10 min)**: Use o jogo para falar sobre ângulos, reflexão e velocidade
3. **Trabalho em equipe (2 jogadores)**: Explore dinâmicas de cooperação/competição
4. **Reflexão metacognitiva**: Peça aos alunos para descreverem sua estratégia após cada partida
5. **Progressão de dificuldade**: Avance o nível conforme a turma demonstra domínio

### Faixas Etárias Recomendadas

| Faixa Etária | Dificuldade | Modo       | Foco Pedagógico                |
|--------------|-------------|------------|-------------------------------|
| 6–9 anos     | Iniciante   | 1 Jogador  | Coordenação e concentração     |
| 10–13 anos   | Iniciante/Interm. | 2 Jogadores | Estratégia e trabalho em equipe |
| 14+ anos     | Intermediário/Avançado | Ambos | Raciocínio e regulação emocional |

---

## 📜 Créditos

**Jogo Original**
- **Pong** — Atari Inc., 1972
- Criado por **Allan Alcorn**, supervisionado por **Nolan Bushnell**

**Bibliotecas**
- [Phaser 3](https://phaser.io) — Richard Davey & Photon Storm Ltd.
- [React](https://react.dev) — Meta Open Source
- [Orbitron Font](https://fonts.google.com/specimen/Orbitron) — Matt McInerney

**Referências Teóricas**
- PIAGET, J. *A Epistemologia Genética*, 1970
- VYGOTSKY, L. *A Formação Social da Mente*, 1978
- KAPP, K. *The Gamification of Learning and Instruction*, 2012
- GEE, J. P. *What Video Games Have to Teach Us About Learning and Literacy*, 2003

---

## 📄 Licença

```
MIT License

Copyright (c) 2025 PongEdu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

---

<div align="center">

**PongEdu** — Onde o clássico encontra o aprendizado 🏓📚

*"Jogar é a forma mais elevada de pesquisa."* — Albert Einstein

</div>