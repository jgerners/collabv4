// PlaybackManager.tsx
import { Audio } from 'expo-av';

let currentPlayingAudio: Audio.Sound | null = null;

/**
 * Voordat nieuwe audio wordt gestart, pauzeer en reset de vorige audio.
 * Vervolgens wordt de nieuwe audio als actief ingesteld.
 */
export const setCurrentPlayingAudio = async (newAudio: Audio.Sound | null) => {
  if (currentPlayingAudio && currentPlayingAudio !== newAudio) {
    try {
      // Pauzeer en reset de vorige audio
      await currentPlayingAudio.pauseAsync();
      await currentPlayingAudio.setPositionAsync(0);
    } catch (error) {
      console.error("Fout bij stoppen vorige audio:", error);
    }
  }
  currentPlayingAudio = newAudio;
};

/**
 * Stop en reset de huidige actieve audio en maak deze leeg.
 */
export const stopCurrentAudio = async () => {
  if (currentPlayingAudio) {
    try {
      await currentPlayingAudio.pauseAsync();
      await currentPlayingAudio.setPositionAsync(0);
    } catch (error) {
      console.error("Fout bij stoppen huidige audio:", error);
    }
    currentPlayingAudio = null;
  }
};

