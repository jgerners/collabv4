// username.tsx
import React from "react";
import { Text, StyleSheet } from "react-native";
import {useFonts} from 'expo-font';

interface UsernameProps {
  name: string;
}

const Username: React.FC<UsernameProps> = ({ name }) => {
    const [loaded] = useFonts({
      'BebasNeue-Regular': require('../../../assets/fonts/BebasNeue-Regular.ttf'),
    });
  return <Text style={styles.username}>{name}</Text>;
};



const styles = StyleSheet.create({
  username: {
    marginLeft: 10,
    color: "white",
    fontSize: 16,
    fontFamily: 'BebasNeue-Regular',
    
    
  },
});

export default Username;
