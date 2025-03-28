// src/helpers/videoThumbnailHelper.ts
import * as VideoThumbnails from 'expo-video-thumbnails';

export const generateVideoThumbnail = async (
  videoUri: string,
  time: number = 1500 // standaardtijd 1.5 sec
): Promise<string | null> => {
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time });
    return uri;
  } catch (e) {
    console.warn("Error generating thumbnail:", e);
    return null;
  }
};

