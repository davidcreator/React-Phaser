# Documentação do SpriteLab

Esta pasta reúne a documentação técnica e o guia de utilização do editor.

## Índice

1. [Guia de uso](GUIA-DE-USO.md) — fluxo completo para importar, editar, animar e exportar um spritesheet.
2. [Arquitetura](ARQUITETURA.md) — organização dos módulos React, Phaser e do fluxo de estado.
3. [Integração com Phaser](INTEGRACAO-PHASER.md) — como usar o runtime exportado em um jogo web.
4. [Formato do projeto](FORMATO-PROJETO.md) — campos principais do JSON e regras de normalização.
5. [Responsividade e acessibilidade](RESPONSIVIDADE-E-ACESSIBILIDADE.md) — decisões de interface, escalas de texto e comportamento em telas menores.

## Conceitos importantes

- **Frame uniforme**: retângulo calculado a partir de uma grade.
- **Frame livre**: retângulo independente armazenado em `meta.frameRects`.
- **Frame edit**: transformações aplicadas somente a um frame, armazenadas em `frameEdits`.
- **Evento de animação**: marcador de gameplay disparado quando uma animação alcança determinado frame.
- **Anim mapping**: ligação entre estados (`idle`, `walk`, `jump`, `action` etc.) e animações.
- **Runtime manifest**: JSON sem a imagem incorporada, apropriado para ser distribuído junto com os assets do jogo.

## Manutenção

Ao adicionar um campo novo a `ProjectConfig`:

1. atualize os tipos em `src/types.ts`;
2. adicione um valor padrão em `emptyProject()`;
3. normalize o campo em `src/game/projectSchema.ts`;
4. verifique o import/export em `src/game/exportProject.ts`;
5. atualize esta documentação;
6. rode `npx tsc --noEmit` e `npm run build`.
