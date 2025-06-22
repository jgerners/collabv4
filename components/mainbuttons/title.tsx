import React from 'react';
import { Text, StyleSheet, TextStyle, Dimensions } from 'react-native';

const { width: windowWidth } = Dimensions.get('window');
const scale = windowWidth / 370;

interface TitleProps {
  title: string;
  textStyle?: TextStyle;
  maxLines?: number;
}

const Title: React.FC<TitleProps> = ({ title, textStyle, maxLines = 2 }) => (
  <Text
    style={[styles.title, textStyle]}
    numberOfLines={maxLines}
    ellipsizeMode="tail"
  >
    {title}
  </Text>
);

const styles = StyleSheet.create({
  title: {
    color: '#fff',
    fontFamily: 'Manrope_700Bold', // Gebruik jouw bold font!
    fontSize: scale * 15,
    lineHeight: scale * 21,
    opacity: 0.97,
    maxWidth: windowWidth * 0.7, // <-- voeg deze regel toe!
  },
});

export default Title;
