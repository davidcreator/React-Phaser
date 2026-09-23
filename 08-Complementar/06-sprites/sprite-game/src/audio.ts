// Simple procedural sound engine using Web Audio API.
// Generates step, action and ambient sounds without external assets.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambientOsc: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

function ensure(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setMasterVolume(v: number) {
  ensure();
  if (master) master.gain.value = v;
}

export function playTone(
  freq: number,
  duration = 0.12,
  type: OscillatorType = "square",
  vol = 0.4
) {
  const c = ensure();
  if (!master) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(vol, c.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start();
  osc.stop(c.currentTime + duration + 0.02);
}

export function playStep(freq: number) {
  playTone(freq, 0.08, "triangle", 0.25);
}

export function previewTone(freq: number, type: OscillatorType = "square") {
  playTone(freq, 0.18, type, 0.35);
}

export function playAction(freq: number) {
  const c = ensure();
  if (!master) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(freq, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 2, c.currentTime + 0.15);
  gain.gain.setValueAtTime(0.35, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.25);
  osc.connect(gain);
  gain.connect(master);
  osc.start();
  osc.stop(c.currentTime + 0.28);
}

export function startAmbient() {
  const c = ensure();
  if (!master || ambientOsc) return;
  ambientOsc = c.createOscillator();
  ambientGain = c.createGain();
  ambientOsc.type = "sine";
  ambientOsc.frequency.value = 55;
  ambientGain.gain.value = 0.06;
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 0.15;
  lfoGain.gain.value = 10;
  lfo.connect(lfoGain);
  lfoGain.connect(ambientOsc.frequency);
  ambientOsc.connect(ambientGain);
  ambientGain.connect(master);
  ambientOsc.start();
  lfo.start();
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
  if (ambientGain) {
    ambientGain.disconnect();
    ambientGain = null;
  }
}

export function resumeAudio() {
  ensure();
}
