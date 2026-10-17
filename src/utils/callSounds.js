/**
 * Audio Manager for Voice Calls
 * - Incoming ringtone: loops `/sounds/incoming-call.mp3`
 * - Outgoing calling tone: loops `/sounds/calling-sound.wav`
 * - Call disconnect/end: plays `/sounds/call-end.mp3`
 * - Mute/Unmute/Deafen/Undeafen/Waiting/Admin Mute: Instant low-latency Web Audio API synthesizers
 */

let incomingAudio = null;
let outgoingAudio = null;
let sharedAudioCtx = null;

function getAudioContext() {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function playToneSequence(tones) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    tones.forEach(({ freq, start, duration, gain = 0.14, type = 'sine' }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);

      gainNode.gain.setValueAtTime(0.0001, now + start);
      gainNode.gain.exponentialRampToValueAtTime(gain, now + start + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (err) {
    console.debug('Failed to play tone sequence:', err);
  }
}

export function playIncomingRingtone() {
  stopIncomingRingtone();
  try {
    incomingAudio = new Audio('/sounds/incoming-call.mp3');
    incomingAudio.loop = true;
    incomingAudio.volume = 0.9;
    const p = incomingAudio.play();
    if (p !== undefined) {
      p.catch(err => {
        console.debug('Autoplay prevented incoming ringtone until user interaction:', err?.message || err);
      });
    }
  } catch (err) {
    console.debug('Failed to initialize incoming ringtone:', err);
  }
}

export function stopIncomingRingtone() {
  if (incomingAudio) {
    try {
      incomingAudio.pause();
      incomingAudio.currentTime = 0;
    } catch {}
    incomingAudio = null;
  }
}

export function playOutgoingCallingSound() {
  stopOutgoingCallingSound();
  try {
    outgoingAudio = new Audio('/sounds/calling-sound.wav');
    outgoingAudio.loop = true;
    outgoingAudio.volume = 0.75;
    const p = outgoingAudio.play();
    if (p !== undefined) {
      p.catch(err => {
        console.debug('Autoplay prevented outgoing calling tone:', err?.message || err);
      });
    }
  } catch (err) {
    console.debug('Failed to initialize outgoing calling tone:', err);
  }
}

export function stopOutgoingCallingSound() {
  if (outgoingAudio) {
    try {
      outgoingAudio.pause();
      outgoingAudio.currentTime = 0;
    } catch {}
    outgoingAudio = null;
  }
}

export function playCallEndSound() {
  try {
    const endAudio = new Audio('/sounds/call-end.mp3');
    endAudio.volume = 0.85;
    const p = endAudio.play();
    if (p !== undefined) {
      p.catch(err => {
        console.debug('Autoplay prevented call-end sound:', err?.message || err);
      });
    }
  } catch (err) {
    console.debug('Failed to play call-end sound:', err);
  }
}

// Mute: Two-tone pleasant descending tone (e.g. 480Hz -> 360Hz)
export function playMuteSound() {
  playToneSequence([
    { freq: 480, start: 0, duration: 0.11, gain: 0.16 },
    { freq: 360, start: 0.09, duration: 0.16, gain: 0.14 }
  ]);
}

// Unmute: Two-tone pleasant ascending chime (e.g. 360Hz -> 480Hz)
export function playUnmuteSound() {
  playToneSequence([
    { freq: 360, start: 0, duration: 0.11, gain: 0.14 },
    { freq: 520, start: 0.09, duration: 0.16, gain: 0.16 }
  ]);
}

// Deafen: Deeper descending chime (e.g. 440Hz -> 330Hz -> 220Hz)
export function playDeafenSound() {
  playToneSequence([
    { freq: 440, start: 0, duration: 0.1, gain: 0.15 },
    { freq: 330, start: 0.08, duration: 0.1, gain: 0.15 },
    { freq: 220, start: 0.16, duration: 0.18, gain: 0.13 }
  ]);
}

// Undeafen: Rising melody chime (e.g. 260Hz -> 390Hz -> 520Hz)
export function playUndeafenSound() {
  playToneSequence([
    { freq: 260, start: 0, duration: 0.09, gain: 0.13 },
    { freq: 390, start: 0.08, duration: 0.09, gain: 0.15 },
    { freq: 520, start: 0.16, duration: 0.18, gain: 0.16 }
  ]);
}

// Call Waiting: Gentle double beep (so it doesn't interrupt active speech)
export function playCallWaitingBeep() {
  playToneSequence([
    { freq: 880, start: 0, duration: 0.09, gain: 0.12 },
    { freq: 880, start: 0.15, duration: 0.09, gain: 0.12 }
  ]);
}

// Admin Muted alert: Distinctive double tone notifying user an admin muted them
export function playAdminMutedSound() {
  playToneSequence([
    { freq: 650, start: 0, duration: 0.12, gain: 0.2, type: 'triangle' },
    { freq: 440, start: 0.14, duration: 0.22, gain: 0.18, type: 'sine' }
  ]);
}
