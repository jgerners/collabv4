// components/tags/GenreTag.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface GenreTagProps {
  id: string;
  name: string;
}

const GenreTag: React.FC<GenreTagProps> = ({ id, name }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 8,
        backgroundColor: "#444",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        marginVertical: 4,
      },
      text: {
        fontSize: 12,
        color: "white",
      },
});

export default GenreTag;
