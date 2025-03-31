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
import PlayPause from "../../components/mainbuttons/play_pause";
import ReplayButton from "../../components/mainbuttons/replay";

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

  const awaitOrIgnore = async (fn: () => Promise<any>) => {
    try {
      await fn();
    } catch (error) {
      console.error("Ignored error:", error);
    }
  };

  const updatePlaybackStatus = (status: any) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis);
      setDuration(status.durationMillis);
    }
  };

  // Demo ophalen
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

  // Audio laden als het een afbeelding met audio betreft
  useEffect(() => {
    if (demo && demo.audio_url && !demo.media_url.endsWith(".mp4")) {
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

  const handlePlayPause = async () => {
    if (!demo) return;
    if (demo.media_url.endsWith(".mp4") && videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    } else if (demo.audio_url && audioRef.current) {
      if (isPlaying) {
        await audioRef.current.pauseAsync();
      } else {
        await audioRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleReplay = async () => {
    if (!demo) return;
    if (demo.media_url.endsWith(".mp4") && videoRef.current) {
      console.log(`Replaying video ${demo.id}`);
      awaitOrIgnore(() => {
        return videoRef.current 
          ? videoRef.current.setPositionAsync(0)
          : Promise.resolve();
      });
      awaitOrIgnore(() => {
        return videoRef.current 
          ? videoRef.current.playAsync()
          : Promise.resolve();
      });
      setIsPlaying(true);
   
    } else if (demo.audio_url && audioRef.current) {
      console.log(`Replaying audio for demo ${demo.id}`);
      awaitOrIgnore(() => {
        return audioRef.current 
          ? audioRef.current.setPositionAsync(0)
          : Promise.resolve();
      });
      awaitOrIgnore(() => {
        return audioRef.current 
          ? audioRef.current.playAsync()
          : Promise.resolve();
      });
      setIsPlaying(true);
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
            useNativeControls={false}
          />
        ) : (
          <Image source={{ uri: demo.media_url }} style={styles.media} />
        )}
        {/* Controls Overlay */}
        <View style={styles.controlsContainer}>
          {/* Linkerkant: Play/Pause */}
          <View style={styles.leftControls}>
            <PlayPause isPlaying={isPlaying} onPress={handlePlayPause} />
          </View>
          {/* Midden: Seekbar */}
          <View style={styles.centerControls}>
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
          {/* Rechts: Replay */}
          <View style={styles.rightControls}>
            <ReplayButton onPress={handleReplay} />
          </View>
        </View>
      </Pressable>
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
    position: "absolute",
    bottom: scale * 2,
    left: scale * 10,
    right: scale * 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: scale * 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  leftControls: {
    // Pas eventueel de grootte van de play/pause-knop aan
    width: scale * 30,
    height: scale * 30,
    justifyContent: "center",
    alignItems: "center",
  },
  centerControls: {
    flex: 1,
    marginHorizontal: 5,
  },
  slider: {
    width: "100%",
    height: scale * 20,
  },
  rightControls: {
    // Zorg dat de replay-knop dezelfde grootte heeft als in je PostComponent
    width: scale * 30,
    height: scale * 30,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default DemoDetailScreen;
