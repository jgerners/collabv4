// components/tags/GenreTag.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

import {useFonts} from 'expo-font';

interface GenreTagProps {
  id: string;
  name: string;
}

const GenreTag: React.FC<GenreTagProps> = ({ id, name }) => {
  const [loaded] = useFonts({
    'BebasNeue-Regular': require('../../../assets/fonts/BebasNeue-Regular.ttf'),
  });
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
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        marginVertical: 4,
        borderWidth: 1,               // Dunne rand
        borderColor: "white",         // Witte rand
       
      },
      text: {
        fontSize: 11,
        color: "white",
        fontFamily: 'Manrope_700Regular', // of 'Manrope_700Bold'
        fontWeight: "bold",
        textAlign: "center",
        textAlignVertical: "center", // Voeg dit toe
        lineHeight: 20, // lineHeight gelijk aan de containerhoogte
       
    

      },
});

export default GenreTag;
