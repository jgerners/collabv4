import React, { createContext, useContext, useState } from "react";
import { Audio } from "expo-av";
import { PostData } from "../components/postcomponent"; // Pas het pad aan indien nodig

// We breiden de cache-entry uit met een veld voor video.
// Voor video slaan we hier een boolean op om aan te geven dat we de video-URI al hebben "opgewarmd".
interface MediaCacheEntry {
  audio?: Audio.Sound;
  videoPreloaded?: boolean;
}

interface MediaCache {
  [postId: string]: MediaCacheEntry;
}

interface MediaPreloadContextType {
  /**
   * Preload de media voor de posts rondom de actieve post: 2 vóór en 2 ná.
   */
  preloadAdjacent: (posts: PostData[], activeIndex: number) => Promise<void>;
  /**
   * Haal de voorgepreloade audio op voor een bepaalde post, indien beschikbaar.
   */
  getPreloadedAudio: (postId: string) => Audio.Sound | undefined;
  /**
   * Geef de media voor een post vrij (unload) en verwijder deze uit de cache.
   */
  releaseMedia: (postId: string) => Promise<void>;
}

const MediaPreloadContext = createContext<MediaPreloadContextType | undefined>(undefined);

export const MediaPreloadProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [mediaCache, setMediaCache] = useState<MediaCache>({});

  /**
   * Preload de media voor posts in de buurt van de actieve post.
   * We preloaden de posts van index (activeIndex - 2) tot (activeIndex + 2), mits deze bestaan.
   */
  const preloadAdjacent = async (posts: PostData[], activeIndex: number): Promise<void> => {
    const start = Math.max(0, activeIndex - 4);
    const end = Math.min(posts.length - 1, activeIndex + 4);

   

    for (let i = start; i <= end; i++) {
      const post = posts[i];
      

      // Preload audio voor foto+audio posts.
      if (post.mediaType === "photo" && post.audio) {
        if (!mediaCache[post.id]?.audio) {
          try {
            const audioUri = typeof post.audio === "string" ? post.audio : post.audio.toString();
         
            const { sound } = await Audio.Sound.createAsync(
              { uri: audioUri },
              { shouldPlay: false }
            );
            setMediaCache((prev) => ({ ...prev, [post.id]: { ...prev[post.id], audio: sound } }));
    
           
          } catch (error) {
            
          }
        }
      }

      // Preload video voor video posts.
      if (post.mediaType === "video" && post.mediaUrl) {
        if (!mediaCache[post.id]?.videoPreloaded) {
          try {
            // Een simpele techniek: doe een fetch zodat de video-URI door de native/HTTP-cache kan worden opgewarmd.
            const videoUri = post.mediaUrl.toString();
          
            await fetch(videoUri);
            // Markeer dat deze video "opgewarmd" is.
            setMediaCache((prev) => ({ ...prev, [post.id]: { ...prev[post.id], videoPreloaded: true } }));
          
          } catch (error) {
  
          }
        }
      }
    }

    // Verwijder items uit de cache die buiten het bereik vallen.
    const idsToKeep = new Set(posts.slice(start, end + 1).map((p) => p.id));
    Object.keys(mediaCache).forEach(async (postId) => {
      if (!idsToKeep.has(postId)) {
        await releaseMedia(postId);
      }
    });
  };

  const getPreloadedAudio = (postId: string): Audio.Sound | undefined => {
    return mediaCache[postId]?.audio;
  };

  const releaseMedia = async (postId: string): Promise<void> => {
    const entry = mediaCache[postId];
    if (entry?.audio) {
      try {
        await entry.audio.unloadAsync();
      } catch (error) {
      
      }
    }
    // We verwijderen zowel audio als het videoPreloaded vlagje.
    setMediaCache((prev) => {
      const newCache = { ...prev };
      delete newCache[postId];
      return newCache;
    });
  };

  return (
    <MediaPreloadContext.Provider value={{ preloadAdjacent, getPreloadedAudio, releaseMedia }}>
      {children}
    </MediaPreloadContext.Provider>
  );
};

export const useMediaPreload = (): MediaPreloadContextType => {
  const context = useContext(MediaPreloadContext);
  if (context === undefined) {
    throw new Error("useMediaPreload must be used within a MediaPreloadProvider");
  }
  return context;
};
