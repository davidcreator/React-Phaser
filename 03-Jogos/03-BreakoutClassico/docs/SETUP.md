# Instalação e execução

## Requisitos

- Node.js 20 ou superior (recomendado: versão LTS).
- npm 10 ou compatível.
- Navegador moderno com suporte a Canvas; o Phaser tenta usar WebGL quando disponível e pode recorrer ao Canvas.

> O pacote `node_modules` não faz parte do ZIP/repositório. Instale as dependências antes de executar.

## Desenvolvimento

Execute a partir da raiz do projeto — a pasta que contém `package.json`:

```bash
npm ci
npm run dev
```

O Vite inicia o servidor na porta `5173` e informa a URL no terminal. Abra essa URL no navegador. Não abra `index.html` diretamente com `file://`: a aplicação usa módulos ES e deve ser servida por um servidor HTTP.

## Testes e build

```bash
npm test       # testes unitários das regras puras
npm run build  # build de produção em dist/
npm run preview # serve o build localmente, após npm run build
npm audit      # verifica vulnerabilidades conhecidas das dependências
```

## Servidor e preview

- `npm run dev` vincula o servidor em `0.0.0.0`; no desenvolvimento local, use a URL impressa pelo Vite.
- A porta de desenvolvimento está definida como `5173` e `strictPort: true`. Se estiver ocupada, encerre o processo que a usa ou altere `server.port` em `vite.config.js`.
- O servidor de preview de produção usa a porta padrão do Vite Preview, salvo configuração diferente.
- Se o processo do servidor for encerrado, execute novamente `npm run dev`. Se aparecer `vite: not found`, volte à raiz e rode `npm ci`.

## Reprodutibilidade

`package-lock.json` fixa as versões resolvidas. Prefira `npm ci` para uma instalação limpa e reproduzível; use `npm install` apenas quando estiver alterando dependências.