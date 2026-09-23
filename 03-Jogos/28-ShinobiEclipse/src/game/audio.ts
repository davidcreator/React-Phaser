export type SoundEffect =
  | "sword"
  | "shuriken"
  | "hit"
  | "enemyDown"
  | "jump"
  | "hurt"
  | "life"
  | "victory"
  | "select";

/** Lightweight Web Audio soundtrack so the game has no external audio dependency. */
export class AudioDirector {
  private context: AudioContext | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private drone: OscillatorNode[] = [];
  private musicTimer: number | null = null;
  private beat = 0;
  private musicVolume = 0.55;
  private sfxVolume = 0.75;
  private musicEnabled = true;
  private sfxEnabled = true;
  private unlocked = false;

  private ensureContext() {
    if (this.context) return this.context;
    const AudioCtor = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    this.context = new AudioCtor();
    this.musicBus = this.context.createGain();
    this.sfxBus = this.context.createGain();
    this.musicBus.connect(this.context.destination);
    this.sfxBus.connect(this.context.destination);
    this.applyVolumes();
    return this.context;
  }

  private applyVolumes() {
    if (!this.context) return;
    const now = this.context.currentTime;
    this.musicBus?.gain.setTargetAtTime(this.musicEnabled ? this.musicVolume * 0.24 : 0, now, 0.04);
    this.sfxBus?.gain.setTargetAtTime(this.sfxEnabled ? this.sfxVolume * 0.45 : 0, now, 0.02);
  }

  configure(musicVolume: number, sfxVolume: number, musicEnabled: boolean, sfxEnabled: boolean) {
    this.musicVolume = musicVolume;
    this.sfxVolume = sfxVolume;
    this.musicEnabled = musicEnabled;
    this.sfxEnabled = sfxEnabled;
    this.applyVolumes();
    if (!musicEnabled) this.stopMusic();
  }

  async unlock() {
    const context = this.ensureContext();
    if (context?.state === "suspended") await context.resume();
    this.unlocked = context?.state === "running";
  }

  startMusic() {
    if (!this.unlocked || !this.musicEnabled || this.musicTimer !== null) return;
    const context = this.ensureContext();
    if (!context) return;

    // A quiet fifth creates the continuous, tense night-time bed.
    [55, 82.41].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.value = index === 0 ? 0.12 : 0.045;
      oscillator.connect(gain).connect(this.musicBus!);
      oscillator.start();
      this.drone.push(oscillator);
    });

    const melody = [220, 261.63, 293.66, 329.63, 293.66, 261.63, 196, 220];
    const tick = () => {
      if (!this.context || !this.musicBus) return;
      if (this.beat % 2 === 0) this.note(melody[(this.beat / 2) % melody.length], 0.32, 0.035, "triangle", this.musicBus);
      if (this.beat % 4 === 0) this.note(this.beat % 8 === 0 ? 110 : 98, 0.5, 0.045, "sine", this.musicBus);
      this.beat += 1;
    };
    tick();
    this.musicTimer = window.setInterval(tick, 360);
  }

  stopMusic() {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.drone.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch {
        // The oscillator may have already ended while the tab was suspended.
      }
    });
    this.drone = [];
  }

  sfx(effect: SoundEffect) {
    const context = this.ensureContext();
    if (!context || !this.sfxEnabled || !this.sfxBus) return;
    void this.unlock();
    const sequences: Record<SoundEffect, Array<[number, number, number, OscillatorType]>> = {
      sword: [[640, 0.05, 0.16, "sawtooth"], [310, 0.08, 0.12, "triangle"]],
      shuriken: [[880, 0.06, 0.11, "square"], [1240, 0.035, 0.06, "sine"]],
      hit: [[135, 0.09, 0.2, "square"]],
      enemyDown: [[190, 0.08, 0.18, "sawtooth"], [95, 0.22, 0.2, "triangle"]],
      jump: [[260, 0.06, 0.08, "sine"], [390, 0.08, 0.07, "sine"]],
      hurt: [[105, 0.18, 0.25, "sawtooth"]],
      life: [[440, 0.08, 0.12, "sine"], [660, 0.1, 0.11, "sine"], [880, 0.16, 0.1, "triangle"]],
      victory: [[392, 0.14, 0.12, "triangle"], [523.25, 0.18, 0.11, "triangle"], [783.99, 0.35, 0.1, "sine"]],
      select: [[520, 0.06, 0.08, "triangle"]],
    };
    sequences[effect].forEach(([frequency, duration, volume, type], index) => {
      window.setTimeout(() => this.note(frequency, duration, volume, type, this.sfxBus!), index * 55);
    });
  }

  private note(
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
    destination: AudioNode,
  ) {
    if (!this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (type === "sawtooth") oscillator.frequency.exponentialRampToValueAtTime(Math.max(45, frequency * 0.55), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  destroy() {
    this.stopMusic();
    void this.context?.close();
    this.context = null;
    this.unlocked = false;
  }
}