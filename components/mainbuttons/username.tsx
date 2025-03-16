// username.tsx
import React from "react";
import { Text, StyleSheet } from "react-native";

interface UsernameProps {
  name: string;
}

const Username: React.FC<UsernameProps> = ({ name }) => {
  return <Text style={styles.username}>{name}</Text>;
};

const styles = StyleSheet.create({
  username: {
    marginLeft: 10,
    color: "white",
    fontSize: 16,
  },
});

export default Username;
