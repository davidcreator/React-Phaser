# React + Phaser Migration Checklist

Checklist unico para padronizar os exemplos da pasta `02 - Scripts`.

## 1) Estrutura React
- [ ] `package.json` no projeto
- [ ] `react` e `react-dom` em `dependencies`
- [ ] `index.html` com `<div id="root"></div>`
- [ ] `src/main.jsx` com `createRoot`

## 2) Integracao Phaser
- [ ] `phaser` em `dependencies`
- [ ] Componente React (`PhaserGame`) com `useEffect` + `useRef`
- [ ] `new Phaser.Game(config)` criado dentro do `useEffect`
- [ ] `game.destroy(true)` no cleanup do `useEffect`

## 3) Cenas e Config
- [ ] Scene exportada (`class ... extends Phaser.Scene`)
- [ ] Funcao exportada para config (`create...SceneConfig(parent)`)
- [ ] `scene: [MinhaScene]` definido no config
- [ ] `physics` definido de forma explicita

## 4) Qualidade minima
- [ ] `index.html` referencia script correto
- [ ] Sem arquivos HTML/CSS vazios
- [ ] Sem erro de sintaxe nos scripts
- [ ] `npm run build` sem erro

## Status atual
- 65 projetos migrados para estrutura React + Phaser.
- 1 projeto sem `js/script.js` original recebeu scene placeholder (`09 - Sprites`).
- 12 scripts HUD com `setText(...)` quebrado foram corrigidos automaticamente.
