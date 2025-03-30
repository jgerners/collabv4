// demoModule.tsx
import React, { useEffect, useRef, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Modal, 
  Animated,
  Easing,
  StyleSheet 
} from "react-native";
import { BlurView } from "expo-blur";
import { Audio } from "expo-av";

type DemoModuleProps = {
  visible: boolean;
  mediaItem: any;
  onClose: () => void;
};

export default function DemoModule({ visible, mediaItem, onClose }: DemoModuleProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && mediaItem) {
      // Start de inzoom-animatie
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      // Laad en speel audio als er een URL beschikbaar is
      const audioUrl = mediaItem.audio_url || mediaItem.media_url;
      if (audioUrl) {
        loadSound(audioUrl);
      }
    }
  }, [visible, mediaItem]);

  // Cleanup wanneer de modal sluit of het component unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      setIsPlaying(status.isPlaying);
    } else if (status.error) {
      console.error("Audio error:", status.error);
    }
  };

  const loadSound = async (audioUrl: string) => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      console.error("Error loading audio", error);
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const closeModal = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(async () => {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible}>
      <View style={styles.modalContainer}>
        <BlurView intensity={50} style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.fullScreen} onPress={closeModal} activeOpacity={1} />
        </BlurView>
        <Animated.View style={[styles.expandedMediaContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Image 
            source={{ uri: mediaItem.media_url }}
            style={styles.expandedMedia}
            resizeMode="contain"
          />
          {/* Audio controls */}
          <View style={styles.audioControls}>
            <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton}>
              <Text style={styles.playPauseText}>{isPlaying ? "Pause" : "Play"}</Text>
            </TouchableOpacity>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
  },
  expandedMediaContainer: {
    width: "90%",
    backgroundColor: "#000",
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
  },
  expandedMedia: {
    width: "100%",
    height: "50%",
  },
  audioControls: {
    width: "100%",
    padding: 10,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
  },
  playPauseButton: {
    marginBottom: 10,
  },
  playPauseText: {
    color: "#A020F0",
    fontSize: 18,
    fontWeight: "bold",
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
  },
  timeText: {
    color: "white",
  },
});
