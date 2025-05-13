// components/mainbuttons/like.tsx
import React, { useRef } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { FontAwesome } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { useLike } from "../../hooks/useLike";
import * as Haptics from 'expo-haptics';

interface LikeProps {
  postId?: string;              // origineel nodig voor andere functies
  userId?: string;              // de id van de huidige gebruiker
  receiverId?: string;          // de eigenaar van de post
  liked: boolean;              // of de post momenteel geliked is
  onPress: () => Promise<void>; // callback om like te togglen
}

const Like: React.FC<LikeProps> = ({
  postId,
  userId,
  receiverId,
  liked,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

    await onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.button}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <MaterialIcons
          name={liked ? "favorite" : "favorite-border"}  // MaterialIcons heeft goede outline iconen
          size={28}
          color={liked ? "red" : "white"}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  button: {},
});

export default Like;
