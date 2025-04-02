// Like.tsx
import React from "react";
import { TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useLike } from "../../hooks/useLike"; // Zorg dat het pad klopt

interface LikeProps {
  postId: string;
  userId: string;
  receiverId: string; // Nieuwe prop: de eigenaar van de post
}

const Like: React.FC<LikeProps> = ({ postId, userId, receiverId }) => {
  const { liked, toggleLike, loading } = useLike({ userId, postId, receiverId });

  if (loading) {
    return <ActivityIndicator size="small" color="gray" />;
  }

  return (
    <TouchableOpacity onPress={toggleLike} style={styles.likeButton}>
      <Icon
        name={liked ? "heart" : "heart-outline"}
        size={25}
        color={liked ? "red" : "white"}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  likeButton: {
    marginRight: 10,
    
  },
});

export default Like;
