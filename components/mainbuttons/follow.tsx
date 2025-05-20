import React from "react";
import { TouchableOpacity, StyleSheet, ActivityIndicator, View } from "react-native";
import { useFollow } from "../../hooks/useFollow";
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';



import {
  AntDesign,
  Entypo,
  Feather,
  FontAwesome,
  FontAwesome5,
  Foundation,
  Ionicons,
  MaterialCommunityIcons,
  Octicons,
  SimpleLineIcons,
} from '@expo/vector-icons'
console.log(Object.keys(FontAwesome5.getRawGlyphMap()).filter(name => name.includes('follow')));

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
        <FontAwesome5 
          name={isFollowing ? "user-check" : "user-circle"} // Gebruik FontAwesome5 voor de iconen
          size={22}
          color="white"
        />
       
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({

  iconButton: {
    transform: [{ translateX: 1 }],
  },
});

export default Follow;
