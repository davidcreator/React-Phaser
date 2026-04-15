# 📁 Guia do `.gitignore` para React + Phaser

## Por que usar?
Para não subir arquivos temporários, cache e segredos no repositório.

## Modelo pronto
```gitignore
# Dependências
node_modules/

# Build
dist/
build/

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# Ambiente
.env
.env.*
!.env.example

# Cache
.vite/
.cache/

# Sistema
.DS_Store
Thumbs.db
Desktop.ini

# Editores
.vscode/
.idea/

# Testes/cobertura
coverage/

# Arquivos locais
*.tmp
*.temp
```

## Comandos úteis
```bash
git status
git rm --cached nome-do-arquivo
```

## Dicas finais
- Crie o `.gitignore` no início do projeto.
- Nunca suba `.env` real.
- Revise o arquivo sempre que adicionar novas ferramentas.
