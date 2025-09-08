// src/helpers/videoThumbnailHelper.ts
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';

export const generateVideoThumbnail = async (
  videoUri: string,
  time: number = 1500 // standaardtijd 1.5 sec
): Promise<string | null> => {
  try {
    console.log("Attempting to generate thumbnail for:", videoUri);
    
    // Check if file exists and is accessible
    const fileInfo = await FileSystem.getInfoAsync(videoUri);
    if (!fileInfo.exists) {
      console.error("Video file does not exist:", videoUri);
      return null;
    }
    
    console.log("File info:", fileInfo);
    
    // Try to generate thumbnail
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { 
      time,
      quality: 0.8 // Add quality parameter
    });
    
    console.log("Thumbnail generated successfully:", uri);
    return uri;
  } catch (e) {
    console.error("Error generating thumbnail:", e);
    
    // Try alternative approach with different time
    try {
      console.log("Trying alternative thumbnail generation...");
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { 
        time: 0, // Try at the beginning of the video
        quality: 0.5
      });
      console.log("Alternative thumbnail generated:", uri);
      return uri;
    } catch (e2) {
      console.error("Alternative thumbnail generation also failed:", e2);
      return null;
    }
  }
};

