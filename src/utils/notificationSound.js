/**
 * Audio Manager for Oportal Notifications
 * Plays custom sounds for points rewards vs general system notifications.
 * Respects Do Not Disturb (DND) state.
 */

const POINTS_SOUND_URL = '/sounds/mixkit-positive-notification-951.wav';
const GENERAL_SOUND_URL = '/sounds/universfield-new-notification-010-352755.mp3';

let pointsAudio = null;
let generalAudio = null;

function getAudioElement(url) {
  try {
    const audio = new Audio(url);
    audio.preload = 'auto';
    return audio;
  } catch {
    return null;
  }
}

/**
 * Checks if Do Not Disturb mode is enabled in localStorage.
 */
export function isDndActive() {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem('oxton_dnd_enabled');
    return val === 'true' || val === '1';
  } catch {
    return false;
  }
}

/**
 * Sets Do Not Disturb mode in localStorage.
 */
export function setDndActive(active) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('oxton_dnd_enabled', active ? 'true' : 'false');
  } catch {
    // ignore
  }
}

/**
 * Plays the appropriate notification sound.
 * @param {'general'|'points'|string} soundType - 'points' for points/rewards, 'general' for announcements/tasks/etc.
 * @param {boolean} [overrideDndCheck=false] - Whether to bypass DND check (e.g. preview)
 */
export function playNotificationSound(soundType = 'general', overrideDndCheck = false) {
  if (typeof window === 'undefined') return;

  if (!overrideDndCheck && isDndActive()) {
    // Suppressed by Do Not Disturb
    return;
  }

  const isPoints = soundType === 'points' || 
                   soundType === 'reward' || 
                   (typeof soundType === 'string' && soundType.toLowerCase().includes('point'));

  const url = isPoints ? POINTS_SOUND_URL : GENERAL_SOUND_URL;

  try {
    const audio = new Audio(url);
    audio.volume = isPoints ? 0.75 : 0.85;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        // Autoplay may be restricted until user interacts with the page
        console.debug('Notification sound playback note:', err?.message || err);
      });
    }
  } catch (err) {
    console.debug('Notification audio init failed:', err);
  }
}
