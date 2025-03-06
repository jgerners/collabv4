// bookmark.tsx
import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

interface BookmarkProps {
  isSaved: boolean;
  onPress: () => void;
}

const Bookmark: React.FC<BookmarkProps> = ({ isSaved, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.bookmarkButton}>
      <Icon
        name={isSaved ? "bookmark" : "bookmark-outline"}
        size={25}
        color="white"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bookmarkButton: {
    marginRight: 10,
  },
});

export default Bookmark;
