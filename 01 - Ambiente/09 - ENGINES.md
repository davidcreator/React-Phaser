# 🧰 Engines para Jogos Web — Foco React + Phaser

## Objetivo
Comparar opções e definir um padrão didático para iniciantes.

## Comparação rápida
| Opção | Melhor uso | Curva | Observação |
|---|---|---|---|
| Phaser | Jogos 2D web | Média | Melhor custo-benefício para ensino |
| Three.js | 3D web | Alta | Bom para 3D, não ideal para início |
| Godot | 2D/3D completo | Média | Fluxo diferente da stack React |
| Unity | 2D/3D multiplataforma | Alta | Potente, mas mais pesada para iniciantes |

## ✅ Recomendação da trilha
- UI: React
- Jogo: Phaser
- Build: Vite
- Deploy: itch.io, Netlify ou Vercel

## Vantagens do React + Phaser
- Fácil de compartilhar no navegador.
- Bom para separar UI e lógica do jogo.
- Muito material didático disponível.

## Estrutura sugerida
```txt
src/
  scenes/
  objects/
  ui/
  PhaserGame.jsx
```

## Quando usar outra engine
- Use Three.js se o objetivo principal for 3D web.
- Use Godot/Unity se precisar pipeline de engine completa fora do React.
