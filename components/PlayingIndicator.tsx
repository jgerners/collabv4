import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface PlayingIndicatorProps {
  isPlaying: boolean;
  size?: number;
  color?: string;
}

const PlayingIndicator: React.FC<PlayingIndicatorProps> = ({ 
  isPlaying, 
  size = 16, 
  color = '#ffffff' 
}) => {
  const animation1 = useRef(new Animated.Value(0.3)).current;
  const animation2 = useRef(new Animated.Value(0.5)).current;
  const animation3 = useRef(new Animated.Value(0.8)).current;
  const animation4 = useRef(new Animated.Value(0.6)).current;
  const animation5 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isPlaying) {
      const createAnimation = (animValue: Animated.Value, delay: number = 0) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              delay,
              useNativeDriver: false,
            }),
            Animated.timing(animValue, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: false,
            }),
          ])
        );
      };

      // Start alle animaties met verschillende delays voor een natuurlijk effect
      createAnimation(animation1, 0).start();
      createAnimation(animation2, 100).start();
      createAnimation(animation3, 200).start();
      createAnimation(animation4, 300).start();
      createAnimation(animation5, 400).start();
    } else {
      // Stop alle animaties en reset naar basis hoogte
      animation1.stopAnimation();
      animation2.stopAnimation();
      animation3.stopAnimation();
      animation4.stopAnimation();
      animation5.stopAnimation();
      
      animation1.setValue(0.3);
      animation2.setValue(0.5);
      animation3.setValue(0.8);
      animation4.setValue(0.6);
      animation5.setValue(0.4);
    }
  }, [isPlaying]);

  if (!isPlaying) return null;

  return (
    <View style={[styles.container, { height: size }]}>
      <Animated.View 
        style={[
          styles.bar, 
          { 
            height: animation1.interpolate({
              inputRange: [0, 1],
              outputRange: [size * 0.3, size]
            }),
            backgroundColor: color,
            width: size * 0.15
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.bar, 
          { 
            height: animation2.interpolate({
              inputRange: [0, 1],
              outputRange: [size * 0.5, size]
            }),
            backgroundColor: color,
            width: size * 0.15
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.bar, 
          { 
            height: animation3.interpolate({
              inputRange: [0, 1],
              outputRange: [size * 0.8, size]
            }),
            backgroundColor: color,
            width: size * 0.15
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.bar, 
          { 
            height: animation4.interpolate({
              inputRange: [0, 1],
              outputRange: [size * 0.6, size]
            }),
            backgroundColor: color,
            width: size * 0.15
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.bar, 
          { 
            height: animation5.interpolate({
              inputRange: [0, 1],
              outputRange: [size * 0.4, size]
            }),
            backgroundColor: color,
            width: size * 0.15
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
  bar: {
    borderRadius: 1,
  },
});

export default PlayingIndicator;
