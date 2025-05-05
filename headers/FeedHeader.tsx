import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  LayoutChangeEvent,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');
const TAB_COUNT = 3;
const TAB_WIDTH = screenWidth / TAB_COUNT;

export interface FeedHeaderProps {
  onTabChange?: (index: number) => void;
}

const FeedHeader: React.FC<FeedHeaderProps> = ({ onTabChange }) => {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(1);
  const [layoutsReady, setLayoutsReady] = useState(false);

  // Animated values
  const translateX = useRef(new Animated.Value(0)).current;
  const bubbleWidth = useRef(new Animated.Value(0)).current;

  // Layout refs
  const parentLayouts = useRef<{ x: number; width: number }[]>([]);
  const textLayouts = useRef<{ x: number; width: number }[]>([]);

  // Constants
  const BUBBLE_PADDING = 15;
  const BUBBLE_VERTICAL_OFFSET = 3;
  const BUBBLE_HORIZONTAL_OFFSET = 0;
  const BUBBLE_HEIGHT = 32;
  const BUBBLE_RADIUS = BUBBLE_HEIGHT / 2;
  const HEADER_CONTENT_HEIGHT = 48;
  const CONTAINER_HEIGHT = insets.top + HEADER_CONTENT_HEIGHT;
  const BUBBLE_TOP = insets.top + (HEADER_CONTENT_HEIGHT - BUBBLE_HEIGHT) / 2 + BUBBLE_VERTICAL_OFFSET;

  // Initialize bubble once layouts are measured
  useEffect(() => {
    if (!layoutsReady) return;
    const p = parentLayouts.current[activeIndex];
    const t = textLayouts.current[activeIndex];
    const initX = p.x + t.x - BUBBLE_PADDING + BUBBLE_HORIZONTAL_OFFSET;
    const initW = t.width + BUBBLE_PADDING * 2;
    translateX.setValue(initX);
    bubbleWidth.setValue(initW);
  }, [layoutsReady]);

  const handleTabPress = (index: number) => {
    setActiveIndex(index);
    onTabChange?.(index);

    const p = parentLayouts.current[index];
    const t = textLayouts.current[index];
    if (p && t) {
      const targetX = p.x + t.x - BUBBLE_PADDING + BUBBLE_HORIZONTAL_OFFSET;
      const targetW = t.width + BUBBLE_PADDING * 2;
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: targetX,
          friction: 7,
          tension: 40,
          useNativeDriver: false,
        }),
        Animated.spring(bubbleWidth, {
          toValue: targetW,
          friction: 5,
          tension: 80,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const onParentLayout = (index: number) => (e: LayoutChangeEvent) => {
    parentLayouts.current[index] = e.nativeEvent.layout;
    if (parentLayouts.current.filter(Boolean).length === TAB_COUNT &&
        textLayouts.current.filter(Boolean).length === TAB_COUNT) {
      setLayoutsReady(true);
    }
  };

  const onTextLayout = (index: number) => (e: LayoutChangeEvent) => {
    textLayouts.current[index] = e.nativeEvent.layout;
    if (parentLayouts.current.filter(Boolean).length === TAB_COUNT &&
        textLayouts.current.filter(Boolean).length === TAB_COUNT) {
      setLayoutsReady(true);
    }
  };

  const tabs = ['Friends', 'Feed', 'Filters'];

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          height: CONTAINER_HEIGHT,
          paddingHorizontal: TAB_WIDTH * 0.2,
        },
      ]}
    >
      {/* Bubble */}
      {layoutsReady && (
        <Animated.View
          style={[
            styles.bubble,
            {
              height: BUBBLE_HEIGHT,
              borderRadius: BUBBLE_RADIUS,
              top: BUBBLE_TOP,
              transform: [{ translateX }],
              width: bubbleWidth,
            },
          ]}
        />
      )}

      {/* Tabs */}
      {tabs.map((tab, idx) => (
        <TouchableOpacity
          key={tab}
          style={styles.tab}
          onLayout={onParentLayout(idx)}
          activeOpacity={0.7}
          onPress={() => handleTabPress(idx)}
        >
          <Text
            onLayout={onTextLayout(idx)}
            style={
              idx === activeIndex
                ? styles.activeTabText
                : styles.tabText
            }
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    zIndex: 1,
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    zIndex: 1,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: '#4800FF',
    zIndex: 0,
  },
});

export default FeedHeader;
