// collab.tsx
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface CollabProps {
  onPress: () => void;
}

const Collab: React.FC<CollabProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.collabButton} onPress={onPress}>
      <Text style={styles.collabText}>COLLAB!</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  collabButton: {
    backgroundColor: "purple",
    padding: 5,
    borderRadius: 15,
    marginRight: 10,
    height: 30,
    width: 100,
    alignItems: "center"
  },
  collabText: {
    color: "white",
  },
});

export default Collab;
