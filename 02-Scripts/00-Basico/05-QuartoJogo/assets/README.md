# 🎨 Assets Gráficos: Tileset e Spritesheets

Todos os assets visuais deste projeto foram gerados no formato de pixel art futurista em alta fidelidade e estão prontos para uso didático no jogo.

---

## 🗺️ 1. Tileset do Cenário (`assets/tiles/cenario-tileset.png`)
- **Tamanho:** 256x128 pixels (8 tiles de 64x64 dispostos em 2 linhas x 4 colunas).
- **Conteúdo de cada Tile:**
  - **Tile 0 (x=0, y=0):** Piso de metal escuro com parafusos e bordas de precisão;
  - **Tile 1 (x=64, y=0):** Placa de metal reforçada com ranhuras industriais;
  - **Tile 2 (x=128, y=0):** Asfalto/concreto tecnológico para trilhas;
  - **Tile 3 (x=192, y=0):** Pista com canaleta de neon ciano condutora de energia;
  - **Tile 4 (x=0, y=64):** Grade metálica de ventilação de exaustores;
  - **Tile 5 (x=64, y=64):** Núcleo Gerador do Reator (energia brilhante);
  - **Tile 6 (x=128, y=64):** Plataforma hexagonal de montagem de torres (Slots);
  - **Tile 7 (x=192, y=64):** Faixas amarelas e pretas de alerta de perigo (*Hazard Stripes*).

---

## 🗼 2. Spritesheet das Torres (`assets/sprites/torres-sheet.png`)
- **Tamanho:** 256x192 pixels (frames de 64x64).
- **Estrutura:**
  - **Linha 0:** Torre Sentinela (Ciano/Azul)
  - **Linha 1:** Canhão de Plasma (Laranja/Amarelo)
  - **Linha 2:** Torre Criogênica (Verde Esmeralda/Menta)
- **Colunas:**
  - **Coluna 0 (Base Nível 1):** Chassi padrão com anel de sustentação;
  - **Coluna 1 (Base Nível 2+):** Chassi blindado com 4 condensadores de energia nos cantos;
  - **Coluna 2 (Arma Nível 1):** Cano de precisão único apontado a 0 radianos (direita);
  - **Coluna 3 (Arma Nível 2+):** Cano duplo reforçado para disparo em rajada (*Mindustry style*).

---

## 👾 3. Spritesheet dos Inimigos (`assets/sprites/inimigos-sheet.png`)
- **Tamanho:** 192x144 pixels (frames de 48x48).
- **Estrutura de Animação:**
  - **Linha 0 (Frames 0 a 3):** *Drone Veloz (Scout)* — animação de propulsão com asas pulsantes e núcleo laser;
  - **Linha 1 (Frames 4 a 7):** *Robô Enxame (Swarm)* — robô esférico com movimento alternado de pernas mecânicas;
  - **Linha 2 (Frames 8 a 11):** *Tanque Bruto (Brute)* — esteiras reforçadas com blindagem pesada roxa.

---

## ✏️ Como os alunos podem editar ou criar seus próprios Sprites
1. Qualquer software de desenho simples pode ser utilizado: **Piskel** (gratuito no navegador), **Aseprite**, **Photoshop** ou **GIMP**;
2. Basta manter o tamanho dos frames (64x64 para torres e tiles, 48x48 para inimigos) e substituir as imagens na pasta `assets/`!
