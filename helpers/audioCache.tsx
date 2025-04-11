// src/helpers/audioCache.ts

import { Audio } from "expo-av";

interface AudioCache {
  [postId: string]: Audio.Sound;
}

const audioCache: AudioCache = {};

/**
 * Haalt de gecachte audio-instantie op voor een bepaalde post.
 * @param postId De unieke id van de post.
 * @returns De Audio.Sound instantie als deze al gecached is, anders undefined.
 */
export const getCachedAudio = (postId: string): Audio.Sound | undefined => {
  return audioCache[postId];
};

/**
 * Slaat een Audio.Sound instantie op in de cache gekoppeld aan een postId.
 * @param postId De unieke id van de post.
 * @param sound De audio-instantie die je wilt cachen.
 */
export const setCachedAudio = (postId: string, sound: Audio.Sound): void => {
  audioCache[postId] = sound;
};
