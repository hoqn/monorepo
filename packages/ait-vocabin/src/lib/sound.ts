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

function playTone(
  frequency: number,
  duration: number,
  {
    type = 'sine' as OscillatorType,
    gain = 0.15,
    delay = 0,
    detune = 0,
  } = {},
) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const vol = ac.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  osc.detune.value = detune;

  const start = ac.currentTime + delay;
  vol.gain.setValueAtTime(gain, start);
  vol.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.connect(vol).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration);
}

// ── Public API ────────────────────────────────────────

/** Bright ascending two-note "ding" for correct answers */
export function playCorrect() {
  playTone(523.25, 0.12, { gain: 0.13 }); // C5
  playTone(659.25, 0.18, { gain: 0.15, delay: 0.08 }); // E5
}

/** Low descending tone for incorrect answers */
export function playIncorrect() {
  playTone(329.63, 0.15, { type: 'triangle', gain: 0.12 }); // E4
  playTone(261.63, 0.22, { type: 'triangle', gain: 0.10, delay: 0.1 }); // C4
}

/** Combo sound — pitch rises with combo count */
export function playCombo(count: number) {
  const base = 587.33; // D5
  const pitch = base + count * 40;
  playTone(pitch, 0.08, { gain: 0.10 });
  playTone(pitch * 1.25, 0.12, { gain: 0.12, delay: 0.06 });
}

/** Session complete fanfare (C5→E5→G5) */
export function playComplete() {
  playTone(523.25, 0.15, { gain: 0.12 }); // C5
  playTone(659.25, 0.15, { gain: 0.13, delay: 0.12 }); // E5
  playTone(783.99, 0.25, { gain: 0.15, delay: 0.24 }); // G5
}

/** Perfect score arpeggio (C5→E5→G5→C6) */
export function playPerfect() {
  playTone(523.25, 0.12, { gain: 0.12 }); // C5
  playTone(659.25, 0.12, { gain: 0.13, delay: 0.10 }); // E5
  playTone(783.99, 0.12, { gain: 0.14, delay: 0.20 }); // G5
  playTone(1046.50, 0.30, { gain: 0.16, delay: 0.30 }); // C6
}

/** Sad descending tone for game over (G4→E4→C4) */
export function playGameOver() {
  playTone(392.00, 0.18, { type: 'triangle', gain: 0.11 }); // G4
  playTone(329.63, 0.18, { type: 'triangle', gain: 0.10, delay: 0.15 }); // E4
  playTone(261.63, 0.30, { type: 'triangle', gain: 0.09, delay: 0.30 }); // C4
}
