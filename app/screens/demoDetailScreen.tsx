import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Video, ResizeMode, Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import { useRoute } from "@react-navigation/native";
import { supabase } from "../../supabaseClient";

const { width: windowWidth } = Dimensions.get("window");
const scale = windowWidth / 370;

const DemoDetailScreen: React.FC = () => {
  const route = useRoute();
  const { demoId } = route.params as { demoId: string };

  const [demo, setDemo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const videoRef = useRef<Video | null>(null);
  const audioRef = useRef<Audio.Sound | null>(null);

  // 🔄 Demo ophalen uit Supabase
  useEffect(() => {
    const fetchDemo = async () => {
      const { data, error } = await supabase
        .from("demos")
        .select("*")
        .eq("id", demoId)
        .single();

      if (error) {
        console.error("Fout bij ophalen demo:", error);
      } else {
        setDemo(data);
      }

      setLoading(false);
    };

    fetchDemo();
  }, [demoId]);

  // Audio laden als het om een afbeelding met audio gaat
  useEffect(() => {
    if (demo?.media_url && demo?.audio_url && !demo.media_url.endsWith(".mp4")) {
      const loadAudio = async () => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: demo.audio_url },
            { shouldPlay: false }
          );
          audioRef.current = sound;
          sound.setOnPlaybackStatusUpdate(updatePlaybackStatus);
        } catch (error) {
          console.error("Error loading audio:", error);
        }
      };
      loadAudio();

      return () => {
        if (audioRef.current) audioRef.current.unloadAsync();
      };
    }
  }, [demo]);

  const updatePlaybackStatus = (status: any) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis);
      setDuration(status.durationMillis);
    }
  };

  const handlePlayPause = async () => {
    if (demo?.media_url.endsWith(".mp4") && videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    } else if (demo?.audio_url && audioRef.current) {
      if (isPlaying) {
        await audioRef.current.pauseAsync();
      } else {
        await audioRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (loading || !demo) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A020F0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePlayPause} style={styles.mediaContainer}>
        {demo.media_url.endsWith(".mp4") ? (
          <Video
            ref={videoRef}
            source={{ uri: demo.media_url }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isLooping
            onPlaybackStatusUpdate={updatePlaybackStatus}
          />
        ) : (
          <Image source={{ uri: demo.media_url }} style={styles.media} />
        )}
      </Pressable>

      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseButton}>
          <Text style={styles.playPauseText}>{isPlaying ? "Pause" : "Play"}</Text>
        </TouchableOpacity>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={duration ? currentTime / duration : 0}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="#000000"
          thumbTintColor="#FFFFFF"
          onSlidingComplete={async (value: number) => {
            const newPosition = value * duration;
            if (demo.media_url.endsWith(".mp4") && videoRef.current) {
              await videoRef.current.setPositionAsync(newPosition);
            } else if (demo.audio_url && audioRef.current) {
              await audioRef.current.setPositionAsync(newPosition);
            }
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", justifyContent: "center", alignItems: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212" },
  mediaContainer: {
    width: scale * 345,
    height: scale * 450,
    backgroundColor: "#000",
    borderRadius: scale * 10,
    overflow: "hidden",
  },
  media: { width: "100%", height: "100%" },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  playPauseButton: {
    padding: 10,
    backgroundColor: "#A020F0",
    borderRadius: 5,
    marginRight: 10,
  },
  playPauseText: {
    color: "white",
    fontSize: 16,
  },
  slider: {
    width: scale * 200,
    height: 40,
  },
});

export default DemoDetailScreen;
