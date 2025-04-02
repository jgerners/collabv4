// Follow.tsx
import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useFollow } from "../../hooks/useFollow"; // Zorg dat het pad klopt

interface FollowProps {
  followerId: string;  // De ingelogde gebruiker
  followingId: string; // De gebruiker die gevolgd wordt
}

const Follow: React.FC<FollowProps> = ({ followerId, followingId }) => {
  const { isFollowing, loading, error, toggleFollow } = useFollow({ followerId, followingId });

  if (loading) {
    return <ActivityIndicator size="small" color="gray" />;
  }

  return (
    <TouchableOpacity
      style={[styles.followBubble, isFollowing ? styles.following : styles.notFollowing]} // Dynamisch de stijl toepassen
      onPress={toggleFollow}
    >
      <Text style={[styles.followBubbleText, isFollowing ? styles.followingText : styles.notFollowingText]}>
        {isFollowing ? "Following" : "Follow"}
      </Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  followBubble: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  followBubbleText: {
    color: "white",
    fontSize: 14,
  },
  // Toevoeging van nieuwe stijlen
  following: {
    backgroundColor: "#121212", // Paars
    borderWidth: 1,               // Dunne rand
    borderColor: "white",         // Witte rand
  },
  followingText: {
    color: "white",  // Witte tekst
  },
  notFollowing: {
    backgroundColor: "#121212",  // Zwarte achtergrond zoals de post
    borderWidth: 1,               // Dunne rand
    borderColor: "white",         // Witte rand
  },
  notFollowingText: {
    color: "white",  // Witte tekst als je niet volgt
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
});

export default Follow;
