# Guia de uso

## 1. Abrir o editor

Instale as dependências e rode o servidor:

```bash
npm install
npm run dev -- --host 0.0.0.0
```

A aplicação abre com a guia de uso. Ela pode ser fechada pelo botão **Entendi, vamos testar!** e reaberta no botão **Ajuda**.

O botão **Aa** alterna entre as escalas de interface de 100%, 115% e 130%. A preferência é salva quando o navegador permite o uso de `localStorage`.

## 2. Carregar um spritesheet

Há três caminhos:

- escolher um modelo em **Modelos**;
- usar **Enviar Spritesheet** no palco inicial;
- usar **Trocar spritesheet** na sidebar depois que um projeto já estiver aberto.

A imagem fica incorporada no projeto completo exportado. O formato recomendado é PNG com transparência.

## 3. Ajustar a leitura da imagem

Na aba **Anim**, abra **Leitura do Spritesheet**.

No modo uniforme, ajuste:

- **Larg. frame**;
- **Alt. frame**;
- **Margem**;
- **Espaço**.

A contagem de colunas, linhas e frames é recalculada automaticamente.

### Modo livre

Clique em **Editar áreas livremente** quando os frames não estiverem alinhados em uma grade regular.

No editor visual:

- selecione um frame;
- arraste o interior para mover o retângulo;
- arraste os cantos para redimensionar;
- desenhe novos retângulos quando necessário;
- use o zoom para trabalhar com imagens pequenas ou grandes.

O modo livre mantém cada `FrameRect` separado. O runtime cria um atlas com esses retângulos.

## 4. Criar uma animação

Na seção **Animações**:

1. clique em **+ Nova animação**;
2. altere o nome;
3. selecione o quadro inicial e final na grade, ou use os campos numéricos;
4. defina o FPS;
5. escolha `repeat = -1` para loop infinito;
6. habilite **Yoyo** para reproduzir ida e volta;
7. use **Ordem customizada** para sequências como `0,1,2,1`.

A animação selecionada aparece na timeline inferior.

## 5. Usar a timeline

A timeline oferece:

- parar e voltar ao início;
- frame anterior e próximo frame;
- reprodução e pausa;
- scrubbing pelo slider;
- miniaturas de todos os frames;
- onion skinning para visualizar o frame anterior e o próximo;
- marcadores de eventos de gameplay.

Clicar em uma miniatura também seleciona o frame no palco e nas ferramentas de transformação.

## 6. Criar eventos para scripts

Com uma animação em edição, abra a área **⚑ Eventos de gameplay**.

1. escolha o frame do marcador;
2. clique em **+ Marcador**;
3. informe um nome, por exemplo `attack_start`;
4. selecione o tipo (`script`, `sound`, `hitbox` ou `fx`);
5. informe um payload opcional.

Exemplo:

| Frame | Tipo | Nome | Payload |
| ---: | --- | --- | --- |
| 1 | hitbox | attack_start | sword |
| 2 | sound | footstep | grass |
| 3 | fx | dust | 4 |

O evento é salvo dentro da animação e disparado pelo `SpriteLabRuntime.ts` quando o frame entra em reprodução.

## 7. Ajustar o personagem

Na aba **Player**:

### Movimento e física

- modo plataforma ou top-down;
- velocidade e multiplicador de corrida;
- aceleração;
- gravidade;
- força e velocidade máxima do pulo;
- coyote time e jump buffer;
- controle no ar;
- pulo duplo.

### Transformação

- escala geral;
- escala X e Y;
- rotação;
- opacidade;
- offset X/Y;
- origem padrão X/Y.

A seção **Origem do frame ativo** permite alterar somente o pivô do frame selecionado. O valor global continua sendo usado como fallback para frames sem override.

## 8. Mapear estados

Em **Máquina de Estados**, associe animações aos estados:

- `idle`;
- `walk`;
- `run`;
- `jump`;
- `fall`;
- `action`;
- `hurt`.

O `SpriteScene` utiliza esses vínculos para trocar a animação de acordo com o movimento e as ações do player.

## 9. Hitboxes e NPCs

Na aba **Boxes**, crie áreas relativas ao frame:

- `hurtbox` para receber dano;
- `hitbox` para causar dano;
- `collision` para colisões físicas ou lógicas.

Cada área pode ser geral ou limitada a um frame específico.

Na aba **NPCs**, adicione instâncias com:

- posição;
- escala;
- tint;
- animação;
- comportamento idle, patrulha, seguir ou vagar;
- velocidade e alcance de patrulha.

## 10. FX, som e cena

Use as abas correspondentes para testar:

- partículas;
- rastro;
- glow;
- blend mode;
- shake e flash;
- squash/stretch;
- passos, salto, pouso e ação;
- ambiente Web Audio;
- fundo, gradiente, grade, chão, zoom e câmera.

## 11. Exportar

Use **Exportar** conforme a necessidade:

- **Projeto completo**: backup e reimportação no SpriteLab.
- **config.json**: configurações sem incorporar a imagem.
- **Atlas JSON**: frames retangulares compatíveis com atlas Phaser.
- **Runtime manifest**: arquivo leve para o jogo final.
- **SpriteLabRuntime.ts**: API de integração com scripts.
- **PhaserSprite.tsx**: componente React + Phaser.
- **Spritesheet PNG**: asset original.

## 12. Importar

O botão **Importar** espera um projeto completo com uma imagem `data:image/...` incorporada. Configurações ou manifests leves não substituem o projeto completo para reedição dentro do SpriteLab.
