// components/mainbuttons/save.tsx
import React, { useRef } from "react";
import { TouchableOpacity, StyleSheet, Animated } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from "expo-haptics";

interface SaveButtonProps {
  /** Optioneel: ID van de post voor analytics of toekomstige use-cases */
  postId?: string;
  /** Optioneel: ID van de huidige gebruiker voor analytics */
  userId?: string;
  /** Staat de post opgeslagen? */
  saved: boolean;
  /** Callback vanuit parent om toggleSave aan te roepen */
  onPress: () => Promise<void>;
}

/**
 * SaveButton met animatie en haptics, consistent met de Like-component.
 */
const SaveButton: React.FC<SaveButtonProps> = ({ postId, userId, saved, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = async () => {
    // Haptics voor feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Scale animatie
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    // Callback
    await onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.button} activeOpacity={0.7}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <MaterialIcons
          name={saved ? "bookmark" : "bookmark-border"}
          size={28}
          color={saved ? "gold" : "white"}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    // Voeg hier eventueel margins/padding toe
  },
});

export default SaveButton;
