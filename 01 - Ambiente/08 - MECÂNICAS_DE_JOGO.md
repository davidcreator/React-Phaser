# ⚙️ Mecânicas de Jogo (React + Phaser)

## O que são mecânicas?
São as regras que definem o que o jogador pode fazer e como o jogo reage.

## Mecânicas básicas para MVP
- Movimento
- Colisão
- Pontuação
- Vitória/Derrota
- Reinício

## 🔁 Loop de jogo
1. Ler input
2. Atualizar estado
3. Resolver colisões
4. Atualizar HUD
5. Renderizar próximo frame

## Mapeamento no Phaser
- `Scene`: menu, jogo, game over
- `update(time, delta)`: loop principal
- `input.keyboard`: controles
- colisão física/manual: contato entre objetos
- `text`: placar e mensagens

## 📈 Progressão
- A cada ponto, aumente um pouco a dificuldade.
- Defina limite máximo para manter justiça.

## ✅ Checklist de qualidade
- Controle responde bem?
- Pontuação sobe corretamente?
- Game over funciona no ponto certo?
- Reinício zera o estado?
