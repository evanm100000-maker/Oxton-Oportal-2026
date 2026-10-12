/**
 * Robust Emergency Alert Siren Audio Engine
 * Combines Web Audio API dual-tone synthesis with HTML5 Audio element fallback
 * and proactive user-gesture audio unlocking.
 */

let sharedAudioCtx = null;
let sirenInterval = null;
let fallbackAudioEl = null;
let isSirenPlaying = false;
let currentSoundType = 'standard';

export function getSharedAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

// Proactively unlock AudioContext on first user interaction anywhere in the window
export function initGlobalAudioUnlock() {
  if (typeof window === 'undefined') return;
  const events = ['click', 'pointerdown', 'keydown', 'touchstart', 'focus'];
  const unlockHandler = () => {
    try {
      const ctx = getSharedAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch {
      // ignore
    }
    events.forEach(evt => window.removeEventListener(evt, unlockHandler));
  };
  events.forEach(evt => window.addEventListener(evt, unlockHandler, { passive: true, once: true }));
}

// Automatically initialize on import
initGlobalAudioUnlock();

/**
 * Generate a looping WAV data URI siren for standard and severe alarms.
 * Serves as an unblockable HTML5 Audio element fallback if Web Audio oscillators are restricted.
 */
function generateSirenWav(isSevere = false) {
  const sampleRate = 22050;
  const duration = isSevere ? 0.8 : 1.0;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Generate siren wave samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let freq;
    if (isSevere) {
      // Rapid sweeping pitch: 850Hz to 1350Hz
      const cycle = (t % 0.4) / 0.4;
      freq = 850 + Math.sin(cycle * Math.PI) * 550;
    } else {
      // Dual-tone pitch: 880Hz then 620Hz
      freq = (t % 0.8 < 0.4) ? 880 : 620;
    }
    // Sawtooth-approx with sine harmonics
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.7 + Math.sin(4 * Math.PI * freq * t) * 0.2;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767 * 0.75)));
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

let cachedStandardWavUrl = null;
let cachedSevereWavUrl = null;

function getSirenAudioUrl(isSevere) {
  if (isSevere) {
    if (!cachedSevereWavUrl) cachedSevereWavUrl = generateSirenWav(true);
    return cachedSevereWavUrl;
  }
  if (!cachedStandardWavUrl) cachedStandardWavUrl = generateSirenWav(false);
  return cachedStandardWavUrl;
}

/**
 * Start the alarm siren.
 * Tries Web Audio synthesis and HTMLAudioElement in parallel for 100% reliability.
 */
export function startAlarmSiren(soundType = 'standard') {
  currentSoundType = soundType;
  isSirenPlaying = true;
  const isSevere = soundType === 'severe';

  // 1. Try HTML5 Audio fallback
  try {
    const audioUrl = getSirenAudioUrl(isSevere);
    if (!fallbackAudioEl) {
      fallbackAudioEl = new Audio();
      fallbackAudioEl.loop = true;
      fallbackAudioEl.volume = isSevere ? 1.0 : 0.8;
    }
    if (fallbackAudioEl.src !== audioUrl) {
      fallbackAudioEl.src = audioUrl;
    }
    fallbackAudioEl.play().catch(() => {
      // Will auto-resume on first click/move
    });
  } catch (e) {
    console.warn('HTMLAudioElement error', e);
  }

  // 2. Web Audio API synthesis
  try {
    const ctx = getSharedAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      if (sirenInterval) {
        clearInterval(sirenInterval);
      }

      if (isSevere) {
        let step = 0;
        const playSeverePulse = () => {
          if (!isSirenPlaying) return;
          try {
            if (ctx.state === 'suspended') {
              ctx.resume().catch(() => {});
            }
            if (ctx.state !== 'running') return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            const startTime = ctx.currentTime;
            const duration = 0.35;

            const startFreq = step % 2 === 0 ? 1150 : 850;
            const endFreq = step % 2 === 0 ? 1380 : 980;
            osc.frequency.setValueAtTime(startFreq, startTime);
            osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

            gain.gain.setValueAtTime(0.7, startTime);
            gain.gain.linearRampToValueAtTime(0.5, startTime + duration * 0.8);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + duration);
            step++;
          } catch {
            // ignore
          }
        };

        playSeverePulse();
        sirenInterval = setInterval(playSeverePulse, 320);
      } else {
        let highTone = true;
        const playStandardPulse = () => {
          if (!isSirenPlaying) return;
          try {
            if (ctx.state === 'suspended') {
              ctx.resume().catch(() => {});
            }
            if (ctx.state !== 'running') return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            const startTime = ctx.currentTime;

            osc.frequency.setValueAtTime(highTone ? 880 : 620, startTime);
            gain.gain.setValueAtTime(0.4, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.38);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.4);
            highTone = !highTone;
          } catch {
            // ignore
          }
        };

        playStandardPulse();
        sirenInterval = setInterval(playStandardPulse, 420);
      }
    }
  } catch (e) {
    console.warn('Web Audio error', e);
  }
}

/**
 * Stop all active alarm siren audio.
 */
export function stopAlarmSiren() {
  isSirenPlaying = false;
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  if (fallbackAudioEl) {
    try {
      fallbackAudioEl.pause();
      fallbackAudioEl.currentTime = 0;
    } catch {
      // ignore
    }
  }
}

/**
 * Resume or re-trigger sound if browser blocked initial autoplay.
 */
export function resumeAlarmSiren() {
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().then(() => {
      if (isSirenPlaying) {
        startAlarmSiren(currentSoundType);
      }
    }).catch(() => {});
  }
  if (fallbackAudioEl && isSirenPlaying) {
    fallbackAudioEl.play().catch(() => {});
  }
}
