// File: context/zoomContext.tsx
import React, { createContext, useRef, ReactNode } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface ZoomContextValue {
  zoomOut(): void;
  zoomIn(callback?: () => void): void;
}

export const ZoomContext = createContext<ZoomContextValue | null>(null);

export function ZoomProvider({ children }: { children: ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;

  const zoomOut = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      overshootClamping: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const zoomIn = (callback?: () => void) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      overshootClamping: true,
      tension: 80,
      friction: 10,
    }).start(() => {
      // force exact 1
      scale.setValue(1);
      callback?.();
    });
  };

  return (
    <ZoomContext.Provider value={{ zoomOut, zoomIn }}>
      <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </ZoomContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: 'black',   // écht zwart achter de gezoomde content
  },
});
