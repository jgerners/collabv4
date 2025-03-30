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
    <TouchableOpacity style={styles.followBubble} onPress={toggleFollow}>
      <Text style={styles.followBubbleText}>
        {isFollowing ? "Following" : "Follow"}
      </Text>
      {/* Indien gewenst, kun je eventueel ook de foutmelding weergeven */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  followBubble: {
    backgroundColor: "#6A0DAD",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  followBubbleText: {
    color: "white",
    fontSize: 14,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
});

export default Follow;
