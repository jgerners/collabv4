// username.tsx
import React from "react";
import { Text, StyleSheet } from "react-native";

interface UsernameProps {
  username: string;
}

const Username: React.FC<UsernameProps> = ({ username }) => {
  return <Text style={styles.username}>{username}</Text>;
};

const styles = StyleSheet.create({
  username: {
    marginLeft: 10,
    color: "white",
    fontSize: 16,
  },
});

export default Username;
