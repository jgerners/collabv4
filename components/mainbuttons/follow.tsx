// follow.tsx
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface FollowProps {
  isFollowed: boolean;
  onPress: () => void;
}

const Follow: React.FC<FollowProps> = ({ isFollowed, onPress }) => {
  return (
    <TouchableOpacity style={styles.followBubble} onPress={onPress}>
      <Text style={styles.followBubbleText}>
        {isFollowed ? "Following" : "Follow"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  followBubble: {
    backgroundColor: "purple",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  followBubbleText: {
    color: "white",
    fontSize: 14,
  },
});

export default Follow;
