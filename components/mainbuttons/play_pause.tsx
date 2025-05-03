// play_pause.tsx
import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

interface PlayPauseProps {
  isPlaying: boolean;
  onPress: () => void;
}

const PlayPause: React.FC<PlayPauseProps> = ({ isPlaying, onPress }) => {
  return (
    <TouchableOpacity style={styles.playButton} onPress={onPress}>
      <Icon
        name={isPlaying ? "pause" : "play-outline"}
        size={22}
        color="white"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  playButton: {
    left: 20,
    transform: [{ translateY: 10 }],
  
  },
});

export default PlayPause;
