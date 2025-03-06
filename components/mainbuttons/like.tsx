// like.tsx
import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

interface LikeProps {
  isLiked: boolean;
  onPress: () => void;
}

const Like: React.FC<LikeProps> = ({ isLiked, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.likeButton}>
      <Icon
        name={isLiked ? "heart" : "heart-outline"}
        size={25}
        color={isLiked ? "red" : "white"}
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
