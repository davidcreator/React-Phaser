# Documentação do projeto

Este diretório é a fonte de verdade para decisões de produto, conteúdo e produção de *Apocalypse Race: Fleeing Hell*.

## Documentos

1. [GDD — visão e especificação do jogo](GDD_v0.1.md)
2. [Spritesheets dos carros](SPRITESHEETS_CARROS.md)
3. [Tilesets ambientais por fase](TILESETS_FASES.md)
4. [Spritesheets dos monstros](SPRITESHEETS_MONSTROS.md)
5. [Arquitetura técnica — React + Phaser](ARQUITETURA.md)
6. [Política de conteúdo e classificação indicativa](POLITICA_DE_CONTEUDO_E_CLASSIFICACAO.md)
7. [UI/UX — telas, fluxos e sistema visual](UI_UX.md)
8. [Roadmap e critérios de pronto](ROADMAP.md)
9. [Changelog da documentação e do protótipo](CHANGELOG.md)

## Estado do protótipo

O protótipo v0.7 mantém as quatro fases e os quatro veículos, com tilesets ambientais independentes por rota e spritesheets pixel art para os quatro monstros, além de armas, munição, kits de reparo, escudos temporários e dano mecânico por contato/capotamento. Conserva quatro fases jogáveis — **Posto 7**, **Viaduto Caído**, **Pátio de Sucata** e **Saída do Anel** — e quatro veículos — **Fagulha**, **Corisco**, **Vaga-Lume** e **Aurora**. A campanha desbloqueia fases em sequência; veículos são liberados após 0, 1, 2 e 3 missões concluídas. Cada rota mantém alvo de 2–4 minutos, sujeito a balanceamento e playtest. A meta 10+ continua editorial e não oficial.

## Regra de atualização

Quando uma decisão mudar, atualizar primeiro o documento correspondente e registrar a alteração no [changelog](CHANGELOG.md). O GDD mantém a visão do jogo; a arquitetura descreve a implementação; a política de conteúdo define os limites editoriais; o documento de UI/UX registra telas e padrões de interação; o roadmap registra entregas e critérios de aceite.
