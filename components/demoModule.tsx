import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import PlayPause from "../components/mainbuttons/play_pause";
import ReplayButton from "../components/mainbuttons/replay";

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
      // Start de zoom-animatie
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

  useEffect(() => {
    // Cleanup bij afsluiten of unmounten
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

  const handlePlayPause = async () => {
    await togglePlayPause();
  };

  const handleReplay = async () => {
    if (!sound) return;
    // Zet de positie op 0 en speel opnieuw
    await (sound.setPositionAsync(0) || Promise.resolve());
    await (sound.playAsync() || Promise.resolve());
    setIsPlaying(true);
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
            resizeMode="cover"
          />
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
                value={duration ? position / duration : 0}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="#000000"
                thumbTintColor="rgba(255, 255, 255, 0)"
                onSlidingComplete={async (value: number) => {
                  const newPosition = value * duration;
                  // Check of sound bestaat voordat we de positie aanpassen
                  if (sound) {
                    await sound.setPositionAsync(newPosition);
                  }
                }}
              />
            </View>
            {/* Rechts: Replay */}
            <View style={styles.rightControls}>
              <ReplayButton onPress={handleReplay} />
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
    height: 450,
    backgroundColor: "#000",
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
  },
  expandedMedia: {
    width: "100%",
    height: "100%",
    

  },
  controlsContainer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0)",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  leftControls: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    bottom: 10,
    right: 10
  },
  centerControls: {
    flex: 1,
    marginHorizontal: 5,
    right: 2
  },
  slider: {
    width: "100%",
    height: 20,
  },
  rightControls: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});


