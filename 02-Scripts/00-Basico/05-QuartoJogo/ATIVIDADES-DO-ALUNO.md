# 🚀 Atividades do Aluno — Desafios de Código

Bem-vindo à equipe de engenharia do **Guardiões do Reator**!  
Aqui estão seus desafios práticos divididos em três patamares de maestria:
- 🟢 **Nível Piloto (Fácil):** Mudança de valores e balanceamento.
- 🟡 **Nível Engenheiro (Médio):** Criação de novas regras e efeitos.
- 🔴 **Nível Hacker (Avançado):** Criação de mecânicas totalmente novas.

---

## 🟢 Desafios Nível Piloto (Fácil)

### Desafio 1.1: O Cofre Inicial
Abra o arquivo `src/scenes/Jogo.js`.
* Procure por `ENERGIA_INICIAL = 220;`.
* Altere para `500` e teste o jogo. O que aconteceu? Ficou mais fácil começar a construir defesas?
* Agora teste com `100`. Como isso muda sua estratégia de defesa?

### Desafio 1.2: A Super Sentinela
* Na constante `TIPOS_TORRES`, localize a torre `SENTINELA`.
* Reduza a `cadencia` de `320` para `100`.
* Teste o jogo: veja sua metralhadora disparar rajadas super velozes!

### Desafio 1.3: As Cores do Esquadrão
* Mude as cores das torres alterando os valores hexadecimais (exemplo: `0x0284c7` para azul, `0xef4444` para vermelho vibrante ou `0x10b981` para verde esmeralda).

---

## 🟡 Desafios Nível Engenheiro (Médio)

### Desafio 2.1: Criando o "Robô Escudo"
* No objeto `TIPOS_INIMIGOS`, crie um novo tipo chamado `ESCUDO`:
```javascript
ESCUDO: {
    nome: 'Robô com Escudo',
    vidaMax: 300,
    velocidade: 45,
    recompensa: 60,
    danoBase: 35,
    raio: 25,
    cor: 0x3b82f6 // Azul blindado
}
```
* Adicione o `ESCUDO` na lista de invasores da Onda 4 e 5 dentro de `iniciarProximaOnda()`.

### Desafio 2.2: O Canhão com Mega Onda de Choque
* Modifique a função `criarExplosao(x, y, raio)`.
* Adicione um segundo círculo de explosão com cor diferente para fazer uma onda de choque dupla e futurista!

---

## 🔴 Desafios Nível Hacker (Avançado)

### Desafio 3.1: Torre de Laser Contínuo
* Inspire-se no *Mindustry*: crie um tipo de torre que, em vez de disparar bolinhas ou ogivas, desenha uma linha reta de laser contínuo ligando o topo da torre diretamente ao inimigo enquanto ele estiver dentro do alcance!

### Desafio 3.2: Recompensa por Disparo Manual (Ação 2D!)
* Na função `dispararTorre`, verifique se `torre.emControleManual === true`.
* Se for um disparo manual feito pelo jogador, dobre o tamanho da bala (`projetil.setScale(1.6)`) e adicione 50% de dano extra como recompensa pela sua habilidade de mira!

### Desafio 3.3: Mina Terrestre
* Adicione uma tecla `[4]` para selecionar uma "Mina Terrestre" que você pode colocar diretamente sobre a estrada. Quando um robô pisar nela, a mina explode e some da pista!
