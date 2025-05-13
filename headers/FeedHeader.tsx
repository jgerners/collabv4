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
  const indicatorWidth = useRef(new Animated.Value(0)).current;

  // Layout refs
  const parentLayouts = useRef<{ x: number; width: number }[]>([]);
  const textLayouts = useRef<{ x: number; width: number }[]>([]);

  // Constants
  const INDICATOR_HEIGHT = 3; // Dunne lijn
  const HEADER_CONTENT_HEIGHT = 48;
  const CONTAINER_HEIGHT = insets.top + HEADER_CONTENT_HEIGHT;
  const INDICATOR_BOTTOM_OFFSET = 2; // Kleine marge voor de indicator onder de tabs

  // Initialize indicator once layouts are measured
  useEffect(() => {
    if (!layoutsReady) return;
    const p = parentLayouts.current[activeIndex];
    const t = textLayouts.current[activeIndex];
    const initX = p.x + t.x;
    const initW = t.width;
    translateX.setValue(initX);
    indicatorWidth.setValue(initW);
  }, [layoutsReady]);

  const handleTabPress = (index: number) => {
    setActiveIndex(index);
    onTabChange?.(index);

    const p = parentLayouts.current[index];
    const t = textLayouts.current[index];
    if (p && t) {
      const targetX = p.x + t.x;
      const targetW = t.width;
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: targetX,
          friction: 7,
          tension: 40,
          useNativeDriver: false,
        }),
        Animated.spring(indicatorWidth, {
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
        { paddingTop: insets.top + 8, height: CONTAINER_HEIGHT },
      ]}
    >
      {/* Indicator (was bubble) */}
      {layoutsReady && (
        <Animated.View
          style={[
            styles.indicator,
            {
              height: INDICATOR_HEIGHT, // Dunne lijn
              transform: [{ translateX }],
              width: indicatorWidth,
              bottom: INDICATOR_BOTTOM_OFFSET, // Zet de indicator onder de tabs
            },
          ]}
        />
      )}

      {/* Tabs */}
      {tabs.map((tab, idx) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tab,
            { width: TAB_WIDTH * 1 }, // Tabs dichter bij elkaar (70% van de originele breedte)
          ]}
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
    margin: 4
    
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
  indicator: {
    position: 'absolute',
    backgroundColor: 'white',
    zIndex: 0,
  },
});

export default FeedHeader;
