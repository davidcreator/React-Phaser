// Simple procedural sound engine using Web Audio API.
// Generates step, action and ambient sounds without external assets.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambientOsc: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;
let ambientLfo: OscillatorNode | null = null;
let ambientLfoGain: GainNode | null = null;

function ensure(): AudioContext {
  if (!ctx) {
    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) throw new Error("Web Audio API não suportada.");

    ctx = new AudioContextCtor();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMasterVolume(v: number) {
  try {
    ensure();
    if (master) master.gain.value = Math.max(0, Math.min(1, v));
  } catch {
    // Sem Web Audio, os demais recursos do editor continuam funcionando.
  }
}

export function playTone(
  freq: number,
  duration = 0.12,
  type: OscillatorType = "square",
  vol = 0.4
) {
  let c: AudioContext;
  try {
    c = ensure();
  } catch {
    return;
  }
  if (!master) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, freq), c.currentTime);
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(Math.max(0, vol), c.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    c.currentTime + Math.max(0.02, duration)
  );
  osc.connect(gain);
  gain.connect(master);
  osc.start();
  osc.stop(c.currentTime + Math.max(0.02, duration) + 0.02);
}

export function playStep(
  freq: number,
  type: OscillatorType = "triangle"
) {
  playTone(freq, 0.08, type, 0.25);
}

export function previewTone(freq: number, type: OscillatorType = "square") {
  playTone(freq, 0.18, type, 0.35);
}

export function playAction(
  freq: number,
  type: OscillatorType = "sawtooth"
) {
  let c: AudioContext;
  try {
    c = ensure();
  } catch {
    return;
  }
  if (!master) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, freq), c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(
    Math.max(2, freq * 2),
    c.currentTime + 0.15
  );
  gain.gain.setValueAtTime(0.35, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.25);
  osc.connect(gain);
  gain.connect(master);
  osc.start();
  osc.stop(c.currentTime + 0.28);
}

export function startAmbient() {
  let c: AudioContext;
  try {
    c = ensure();
  } catch {
    return;
  }
  if (!master || ambientOsc) return;
  ambientOsc = c.createOscillator();
  ambientGain = c.createGain();
  ambientLfo = c.createOscillator();
  ambientLfoGain = c.createGain();

  ambientOsc.type = "sine";
  ambientOsc.frequency.value = 55;
  ambientGain.gain.value = 0.06;
  ambientLfo.frequency.value = 0.15;
  ambientLfoGain.gain.value = 10;

  ambientLfo.connect(ambientLfoGain);
  ambientLfoGain.connect(ambientOsc.frequency);
  ambientOsc.connect(ambientGain);
  ambientGain.connect(master);
  ambientOsc.start();
  ambientLfo.start();
}

export function stopAmbient() {
  if (ambientOsc) {
    try {
      ambientOsc.stop();
    } catch {
      /* noop */
    }
    ambientOsc.disconnect();
    ambientOsc = null;
  }
  if (ambientLfo) {
    try {
      ambientLfo.stop();
    } catch {
      /* noop */
    }
    ambientLfo.disconnect();
    ambientLfo = null;
  }
  if (ambientLfoGain) {
    ambientLfoGain.disconnect();
    ambientLfoGain = null;
  }
  if (ambientGain) {
    ambientGain.disconnect();
    ambientGain = null;
  }
}

export function resumeAudio() {
  try {
    ensure();
  } catch {
    // A interface continua utilizável mesmo em browsers sem Web Audio.
  }
}
