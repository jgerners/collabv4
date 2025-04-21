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
        justifyContent: "center", // Centreert de inhoud verticaal
        marginRight: 2,
        backgroundColor: "transparant",
        paddingHorizontal: 2,
        paddingVertical: 0,
        borderRadius: 7,
        marginVertical: 4,
        borderWidth: 0.5,               // Dunne rand
        borderColor: "white",         // Witte rand
      },
      text: {
        fontSize: 12,
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
        textAlignVertical: "center", // Voeg dit toe
        lineHeight: 20, // lineHeight gelijk aan de containerhoogte
       
    

      },
});

export default GenreTag;
