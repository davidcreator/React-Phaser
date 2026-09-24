export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-2 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="my-2 max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl sm:my-0 sm:max-h-[90dvh] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            📖 Guia de Uso — SpriteLab
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 text-sm text-slate-300">
          <Step n="1" title="Carregar um spritesheet">
            Clique em <b>“Enviar Spritesheet”</b> e escolha um arquivo PNG. O app
            tenta adivinhar o tamanho do frame automaticamente. Ajuste{" "}
            <b>largura</b> e <b>altura</b> do frame até a grade dividir os
            sprites corretamente (veja a pré-visualização de frames).
          </Step>

          <Step n="2" title="Criar animações + Timeline">
            Na aba <b>🎬 Anim</b>, clique em <b>+ Nova animação</b>. Defina{" "}
            <b>frame inicial/final</b> clicando na grade. Ajuste <b>FPS</b>,{" "}
            <b>repeat</b> (-1 = loop) e <b>yoyo</b>. Selecione uma animação
            (clique no quadrado colorido) para abrir a <b>Timeline</b> na parte
            inferior — com <b>play/pause</b>, <b>scrubbing</b>, navegação frame a
            frame e <b>🧅 onion skinning</b> (estilo Aseprite).
          </Step>

          <Step n="3" title="Mapear estados">
            Em <b>Estados do Personagem</b>, associe cada animação a um estado:{" "}
            <b>idle</b>, <b>walk</b>, <b>jump</b> e <b>action</b>. O motor troca
            de animação automaticamente conforme você se move.
          </Step>

          <Step n="4" title="Controlar o personagem">
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <KeyRow k="← → / A D" d="Mover" />
              <KeyRow k="↑ / W" d="Cima (top-down)" />
              <KeyRow k="Espaço / K" d="Pular" />
              <KeyRow k="J" d="Ação / ataque" />
              <KeyRow k="🎮 Analógico/D-Pad" d="Mover" />
              <KeyRow k="🎮 Botão A / X" d="Pular" />
              <KeyRow k="🎮 Botão X / □" d="Ação" />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Conecte um <b>controle USB/Bluetooth</b> e pressione qualquer botão
              — o navegador o detecta automaticamente (indicador 🎮 fica verde).
            </p>
          </Step>

          <Step n="5" title="NPCs, Hitboxes e transformações">
            Na aba <b>🧍 NPCs</b> adicione personagens com IA simples (patrulha,
            seguir, vagar) — como em Unity/Godot. Na aba <b>🟩 Boxes</b> defina{" "}
            <b>hurtbox / hitbox / colisão</b> (estilo engines de luta). Na aba{" "}
            <b>🏃 Player</b> ajuste escala X/Y, rotação e opacidade. Origem X/Y
            pode ser ajustada somente no frame ativo, sem afetar os demais quadros;
            também há pulo duplo, coyote time, buffer de pulo, controle no ar e
            curvas de <b>ease</b>.
          </Step>

          <Step n="6" title="Efeitos visuais e sonoros">
            Nas abas <b>✨ FX</b> e <b>🔊 Som</b>: rastro, partículas, squash &
            stretch, shake/flash de câmera, blend modes e sons procedurais
            (Web Audio) com formas de onda e teste ▶. Use a barra <b>🔍 zoom</b>{" "}
            no palco para aproximar/afastar a câmera.
          </Step>

          <Step n="7" title="Eventos de gameplay por frame">
            Dentro da animação, use <b>⚑ Marcador</b> para criar eventos como
            <b> attack_start</b>, <b>footstep</b> ou <b>hurtbox_on</b>. Escolha
            o tipo e um payload opcional. No runtime, esses eventos são emitidos
            exatamente quando o frame entra em cena para seu script reagir.
          </Step>

          <Step n="8" title="Exportar / Importar para a web">
            Use <b>⬇ Exportar</b> para baixar:
            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs">
              <li>
                <b>Projeto completo (.json)</b> — reimportável com o botão{" "}
                <b>📂 Importar</b> (inclui a imagem).
              </li>
              <li>
                <b>Atlas JSON</b> — retângulos reais, inclusive no modo livre.
              </li>
              <li>
                <b>Runtime manifest</b> — configurações leves para produção.
              </li>
              <li>
                <b>SpriteLabRuntime.ts</b> — API Phaser com animações, eventos,
                overrides de frame e consulta de hitboxes.
              </li>
              <li>
                <b>PhaserSprite.tsx</b> — componente React + Phaser pronto.
              </li>
              <li>
                <b>Spritesheet (PNG)</b> — imagem original.
              </li>
            </ul>
          </Step>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-sky-500 py-2.5 font-semibold text-white hover:bg-sky-400"
        >
          Entendi, vamos testar!
        </button>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sm font-bold text-sky-400">
        {n}
      </div>
      <div>
        <h3 className="mb-1 font-semibold text-white">{title}</h3>
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function KeyRow({ k, d }: { k: string; d: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-800/60 px-2 py-1.5">
      <kbd className="rounded bg-slate-950 px-2 py-0.5 font-mono text-xs text-sky-300">
        {k}
      </kbd>
      <span className="text-xs text-slate-400">{d}</span>
    </div>
  );
}
