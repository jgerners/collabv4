import React, { useRef } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useLike } from "../../hooks/useLike";

import * as Haptics from 'expo-haptics';

interface LikeProps {
  postId: string;
  userId: string;
  receiverId: string;
}

const Like: React.FC<LikeProps> = ({ postId, userId, receiverId }) => {
  const { liked, toggleLike, loading } = useLike({ userId, postId, receiverId });

  const scaleAnim = useRef(new Animated.Value(1)).current;

  

  const handlePress = async () => {

  // 1. Voel een lichte haptic-feedback
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Start animatie
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    toggleLike(); // Bel de originele logica
  };

  if (loading) {
    return <ActivityIndicator size="small" color="gray" />;
  }

  return (
    <TouchableOpacity onPress={handlePress} style={styles.likeButton}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Icon
          name={liked ? "heart" : "heart-outline"}
          size={26}
          color={liked ? "red" : "white"}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  likeButton: {

  },
});

export default Like;
