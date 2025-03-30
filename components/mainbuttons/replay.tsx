import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReplayButtonProps {
  onPress: () => void;
}

const ReplayButton: React.FC<ReplayButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Ionicons name="reload" size={20} color="#fff" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 30,
    height: 30,
    transform: [{ translateY: -1 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ReplayButton;
