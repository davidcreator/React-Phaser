export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
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
            <div className="mt-2 grid grid-cols-2 gap-2">
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
            <b>🏃 Player</b> ajuste escala X/Y, rotação, origem, opacidade,
            pulo duplo, controle no ar e curvas de <b>ease</b>.
          </Step>

          <Step n="6" title="Efeitos visuais e sonoros">
            Nas abas <b>✨ FX</b> e <b>🔊 Som</b>: rastro, partículas, squash &
            stretch, shake/flash de câmera, blend modes e sons procedurais
            (Web Audio) com formas de onda e teste ▶. Use a barra <b>🔍 zoom</b>{" "}
            no palco para aproximar/afastar a câmera.
          </Step>

          <Step n="7" title="Exportar / Importar">
            Use <b>⬇ Exportar</b> para baixar:
            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs">
              <li>
                <b>Projeto completo (.json)</b> — reimportável com o botão{" "}
                <b>📂 Importar</b> (inclui a imagem).
              </li>
              <li>
                <b>config.json</b> — todas as configurações (sem a imagem).
              </li>
              <li>
                <b>PhaserSprite.tsx</b> — componente React + Phaser pronto com
                todas as animações registradas.
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
