import { Audio } from 'expo-av';

export interface PlayableMedia {
  playAsync: () => Promise<any>;
  pauseAsync: () => Promise<any>;
  setPositionAsync: (position: number) => Promise<any>;
}

let currentPlayingMedia: PlayableMedia | null = null;

export const setCurrentPlayingMedia = async (newMedia: PlayableMedia | null) => {
  if (currentPlayingMedia && currentPlayingMedia !== newMedia) {
    try {
      await currentPlayingMedia.pauseAsync();
      await currentPlayingMedia.setPositionAsync(0);
    } catch (error) {
      console.error("Error stopping previous media:", error);
    }
  }
  currentPlayingMedia = newMedia;
};

export const stopCurrentMedia = async () => {
  if (currentPlayingMedia) {
    try {
      await currentPlayingMedia.pauseAsync();
      await currentPlayingMedia.setPositionAsync(0);
    } catch (error) {
      console.error("Error stopping current media:", error);
    }
    currentPlayingMedia = null;
  }
};
