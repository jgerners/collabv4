import React from "react";
import { TouchableOpacity, StyleSheet, ActivityIndicator, View } from "react-native";
import { useFollow } from "../../hooks/useFollow";
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface FollowProps {
  followerId: string;
  followingId: string;
  onPress: () => Promise<void>;  // Voeg de onPress callback toe

}

const Follow: React.FC<FollowProps> = ({ followerId, followingId, onPress }) => {
  const {
    isFollowing,
    followCount,
    loading: followLoading,
    toggleFollow,
  } = useFollow({
    followerId: followerId,  // Geef de followerId door aan de hook
    followingId: followingId, // Gebruik de followingId voor de postId in de hook
    initialCount: 0,      // Pas eventueel aan voor de initiële followCount
  });

  // Voeg een animatie toe bij het klikken op de follow-knop
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Voegt haptische feedback toe
    await toggleFollow();  // Toggle de follow status via de callback functie
  };

  return (
    <View style={styles.iconButton}>
      <TouchableOpacity onPress={handlePress} style={styles.iconButton} disabled={followLoading}>
        <MaterialIcons
          name={isFollowing ? "person-remove" : "person-add"}
          size={22}
          color="white"
        />
       
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({

  iconButton: {
  },
});

export default Follow;
