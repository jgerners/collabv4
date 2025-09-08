import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";

interface TitleProps {
  title: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Title: React.FC<TitleProps> = ({ title, style, textStyle }) => {
  return (
    <View style={[styles.container, style]}>
      <Text
        style={[styles.text, textStyle]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  text: {
    fontSize: 12,
    color: "#fff",
    fontFamily: "Jost_300Light",
    lineHeight: 16,
  },
});

export default Title;
