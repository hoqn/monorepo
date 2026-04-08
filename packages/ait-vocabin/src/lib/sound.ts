/**
 * Web Audio API sound synthesis utilities for VocaBin.
 * All sounds are generated programmatically — no external audio files needed.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Clean bell-like tone: crisp attack, smooth exponential decay. */
function playTone(
  frequency: number,
  duration: number,
  { gain = 0.08, delay = 0 } = {},
) {
  const ac = getCtx();
  const start = ac.currentTime + delay;

  const vol = ac.createGain();
  vol.gain.setValueAtTime(0.001, start);
  vol.gain.linearRampToValueAtTime(gain, start + 0.005);
  vol.gain.exponentialRampToValueAtTime(0.001, start + duration);

  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  osc.connect(vol).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration);
}

/**
 * Soft rounded tone for negative feedback.
 * Slightly falling pitch gives a gentle deflated feel.
 */
function playSoftTone(
  frequency: number,
  duration: number,
  { gain = 0.07, delay = 0 } = {},
) {
  const ac = getCtx();
  const start = ac.currentTime + delay;

  const vol = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = frequency * 2;
  filter.Q.value = 0.5;

  vol.gain.setValueAtTime(0.001, start);
  vol.gain.linearRampToValueAtTime(gain, start + 0.010);
  vol.gain.setTargetAtTime(0.001, start + 0.010, duration * 0.20);

  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, start);
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.93, start + duration);

  osc.connect(vol).connect(filter).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration);
}

// ── Public API ────────────────────────────────────────

/** Short, crisp two-note ding — unmistakably correct */
export function playCorrect() {
  playTone(440.00, 0.14, { gain: 0.09 });              // A4
  playTone(587.33, 0.18, { gain: 0.10, delay: 0.09 }); // D5  (4도 상행)
}

/** Soft descending tones for incorrect answers */
export function playIncorrect() {
  playSoftTone(329.63, 0.20, { gain: 0.08 }); // E4
  playSoftTone(261.63, 0.28, { gain: 0.07, delay: 0.13 }); // C4
}

/** Combo sound — pitch rises very subtly with combo count */
export function playCombo(count: number) {
  const base = 523.25; // C5
  const pitch = base + Math.min(count, 10) * 10; // 최대 +100 Hz (거의 안 느껴지는 수준)
  playTone(pitch, 0.10, { gain: 0.07 });
  playTone(pitch * 1.25, 0.14, { gain: 0.08, delay: 0.07 });
}

/** Session complete fanfare (C5→E5→G5) */
export function playComplete() {
  playTone(523.25, 0.18, { gain: 0.08 }); // C5
  playTone(659.25, 0.18, { gain: 0.09, delay: 0.14 }); // E5
  playTone(783.99, 0.28, { gain: 0.10, delay: 0.28 }); // G5
}

/** Perfect score arpeggio (C5→E5→G5→C6) */
export function playPerfect() {
  playTone(523.25, 0.14, { gain: 0.08 }); // C5
  playTone(659.25, 0.14, { gain: 0.09, delay: 0.11 }); // E5
  playTone(783.99, 0.14, { gain: 0.10, delay: 0.22 }); // G5
  playTone(1046.50, 0.34, { gain: 0.11, delay: 0.33 }); // C6
}

/** Sad descending tone for game over (G4→E4→C4) */
export function playGameOver() {
  playSoftTone(392.00, 0.28, { gain: 0.08 }); // G4
  playSoftTone(329.63, 0.28, { gain: 0.07, delay: 0.20 }); // E4
  playSoftTone(261.63, 0.42, { gain: 0.06, delay: 0.40 }); // C4
}
