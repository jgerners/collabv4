// components/WaveForm.tsx
import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";

const BAR_COUNT = 5;
const BAR_MIN = 7;
const BAR_MAX = 21;
const ANIMATION_SPEED = 220;

interface WaveFormProps {
  style?: ViewStyle;
}

const WaveForm: React.FC<WaveFormProps> = ({ style }) => {
  const animatedHeights = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(BAR_MIN))
  ).current;

  useEffect(() => {
    let mounted = true;
    const animate = () => {
      if (!mounted) return;
      const animations = animatedHeights.map(anim =>
        Animated.timing(anim, {
          toValue: BAR_MIN + Math.random() * (BAR_MAX - BAR_MIN),
          duration: ANIMATION_SPEED,
          useNativeDriver: false,
        })
      );
      Animated.parallel(animations).start(() => {
        animate();
      });
    };
    animate();
    return () => {
      mounted = false;
      animatedHeights.forEach(anim => anim.stopAnimation());
    };
  }, []);

  return (
    <View style={[styles.wrapper, style]}>
      {animatedHeights.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            { height: anim }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 20,
    width: 25,
  },
  bar: {
    width: 2.5,
    marginHorizontal: 1,
    backgroundColor: "#C3C3C3",
    borderRadius: 4,
  },
});

export default WaveForm;
