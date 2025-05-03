import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';

interface MoreOptionsProps {
  /** Style for the trigger button */
  style?: ViewStyle;
  /** Style overrides for the menu container (position, offsets) */
  menuStyle?: ViewStyle;
}

const MoreOptions: React.FC<MoreOptionsProps> = ({ style, menuStyle }) => {
  const [visible, setVisible] = useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  return (
    <View>
      {/* Trigger Button */}
      <TouchableOpacity onPress={openMenu} style={[styles.button, style]}>
        <Icon name="more-horiz" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Menu Overlay */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        {/* Dismiss area */}
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        {/* Blurred menu container: translucency + backdrop blur */}
        <BlurView intensity={30} tint="light" style={[styles.menu, menuStyle]}>
          <TouchableOpacity onPress={() => {}} style={styles.menuItem}>
            <Text style={styles.menuText}>Report</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.menuItem}>
            <Text style={styles.menuText}>Block</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.menuItem}>
            <Text style={styles.menuText}>Share</Text>
          </TouchableOpacity>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    alignSelf: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menu: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingVertical: 4,
    overflow: 'hidden',
    width: 100,
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 16,
    color: '#000',
  },
});

export default MoreOptions;
