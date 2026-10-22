import { Vibration } from 'react-native';

/**
 * Error feedback for critical failures (e.g. a delivery code that did not confirm the
 * delivery): a vibration pattern + a short two-tone error sound.
 *
 * The sound respects the phone's silent switch (playsInSilentMode: false). expo-audio is a
 * native module: it is loaded lazily so an older build without it still vibrates instead of
 * crashing.
 */
let player: any = null;
let audioReady: Promise<boolean> | null = null;

function loadAudio(): Promise<boolean> {
  if (audioReady) return audioReady;
  audioReady = (async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const audio = require('expo-audio');
      await audio.setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false });
      player = audio.createAudioPlayer(require('../assets/sounds/error.wav'));
      return true;
    } catch {
      player = null;
      return false;
    }
  })();
  return audioReady;
}

export function playErrorFeedback() {
  try { Vibration.vibrate([0, 300, 150, 300]); } catch {}
  loadAudio()
    .then(async ok => {
      if (!ok || !player) return;
      try {
        await player.seekTo(0);
        player.play();
      } catch {}
    })
    .catch(() => {});
}

/** Short confirmation buzz (no sound) for a successful critical action. */
export function playSuccessFeedback() {
  try { Vibration.vibrate(120); } catch {}
}
