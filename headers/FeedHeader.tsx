import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
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
  const indicator = useRef(new Animated.Value(1)).current;

  const tabs = ['Friends', 'Feed', 'Filters'];

  useEffect(() => {
    indicator.setValue(1);
  }, []);

  const handleTabPress = (index: number) => {
    setActiveIndex(index);
    Animated.spring(indicator, {
      toValue: index,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();
    onTabChange?.(index);
  };

  const INDICATOR_WIDTH = TAB_WIDTH * 0.2;
  const HORIZONTAL_OFFSET = (TAB_WIDTH - INDICATOR_WIDTH) / 2;

  const translateX = indicator.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      HORIZONTAL_OFFSET,
      TAB_WIDTH + HORIZONTAL_OFFSET,
      2 * TAB_WIDTH + HORIZONTAL_OFFSET,
    ],
  });

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 8, height: insets.top + 48 },
      ]}
    >
      {tabs.map((tab, idx) => (
        <TouchableOpacity
          key={tab}
          style={styles.tab}
          activeOpacity={0.7}
          onPress={() => handleTabPress(idx)}
        >
          <Text
            style={[
              styles.tabText,
              idx === activeIndex && styles.activeTabText,
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}

      <Animated.View
        style={[
          styles.indicator,
          {
            width: INDICATOR_WIDTH,
            bottom: 2,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    alignItems: 'center',
    position: 'relative',
  },
  tab: {
    width: TAB_WIDTH * 0.7,  // b.v. 70% van je tab-breedte
    flex: 1,
    marginHorizontal: 4,     // optionele kleine marge ertussen
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  tabText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '400',
  },
  activeTabText: {
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#FFF',
  },
});

export default FeedHeader;