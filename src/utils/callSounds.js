/**
 * Audio Manager for Voice Calls
 * - Incoming ringtone: loops `/sounds/incoming-call.mp3` (the user-uploaded sound)
 * - Outgoing calling tone: loops `/sounds/calling-sound.wav` (ringing dial tone)
 * - Disconnect/End call sound
 */

let incomingAudio = null;
let outgoingAudio = null;

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
