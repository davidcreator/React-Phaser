/**
 * Efeitos sonoros sintetizados via WebAudio (sem arquivos externos).
 * Resolve o item P1-7 do diagnóstico: Pong sem som não é Pong.
 *
 * Política de autoplay: o contexto é criado/desbloqueado no primeiro clique
 * do usuário (startMatch → sfx.unlock()), exigência dos navegadores modernos.
 */

type Wave = OscillatorType;

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  duration = 0.06,
  wave: Wave = 'square',
  volume = 0.05,
  delay = 0,
): void {
  const ac = audio();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();

  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export const sfx = {
  unlock(): void {
    const ac = audio();
    if (ac && ac.state === 'suspended') void ac.resume();
  },
  click(): void {
    tone(520, 0.04, 'square', 0.03);
  },
  wall(): void {
    tone(200, 0.05, 'square', 0.035);
  },
  paddle(): void {
    tone(440, 0.06, 'square', 0.05);
  },
  block(): void {
    tone(300, 0.05, 'sawtooth', 0.04);
  },
  powerUp(): void {
    tone(660, 0.07, 'square', 0.05);
    tone(880, 0.08, 'square', 0.045, 0.07);
  },
  goal(): void {
    tone(150, 0.16, 'sawtooth', 0.06);
    tone(90, 0.24, 'sawtooth', 0.05, 0.1);
  },
  win(): void {
    [523, 659, 784, 1046].forEach((f, i) =>
      tone(f, 0.14, 'square', 0.05, i * 0.12),
    );
  },
  lose(): void {
    [392, 330, 262, 196].forEach((f, i) =>
      tone(f, 0.16, 'sawtooth', 0.05, i * 0.14),
    );
  },
  draw(): void {
    [523, 392].forEach((f, i) => tone(f, 0.18, 'triangle', 0.05, i * 0.16));
  },
};
