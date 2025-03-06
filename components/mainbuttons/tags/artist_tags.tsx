// components/tags/ArtistTag.tsx
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

interface ArtistTagProps {
  id: string;
  name: string;
  image: string;
}

const ArtistTag: React.FC<ArtistTagProps> = ({ id, name, image }) => {
  return (
    <View style={styles.container}>
      <Image source={{ uri: image }} style={styles.image} />
      <Text style={styles.name}>{name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",      // Zet de foto en tekst naast elkaar
        alignItems: "center",
        marginRight: 8,
        backgroundColor: "#444",
        paddingHorizontal: 10,     // Horizontale padding
        paddingVertical: 5,        // Verticale padding
        borderRadius: 20,
        marginVertical: 4,         // Kleine verticale marge
      },
      image: {
        width: 20,                 // Kleinere afbeelding
        height: 20,
        borderRadius: 10,          // Rond
        marginRight: 6,            // Ruimte tussen foto en tekst
      },
      name: {
        fontSize: 12,
        color: "white",
      },
});

export default ArtistTag;
