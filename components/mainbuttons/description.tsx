import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
} from 'react-native';

const { width: windowWidth } = Dimensions.get('window');

interface DescriptionProps {
  description: string;
  style?: any;
  textStyle?: any;
  maxLines?: number;
}

const Description: React.FC<DescriptionProps> = ({
  description,
  style,
  textStyle,
  maxLines = 2,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [collapsedHeight, setCollapsedHeight] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;
  const [measured, setMeasured] = useState(false);

  // "See more" als de description lang is
  const shouldShowSeeMore = description.length > 80;

  // Reset bij nieuwe description
  useEffect(() => {
    setExpanded(false);
    if (collapsedHeight) animation.setValue(collapsedHeight);
  }, [description, maxLines]);

  // Animate height als user togglet
  useEffect(() => {
    if (!measured) return;
    Animated.timing(animation, {
      toValue: expanded ? contentHeight : collapsedHeight,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [expanded, measured, contentHeight, collapsedHeight]);

  return (
    <View style={[styles.wrapper, style]}>
      {/* Height meten voor open versie */}
      <View style={{ position: 'absolute', opacity: 0, left: 0, right: 0 }}>
        <Text
          style={[styles.description, textStyle]}
          onLayout={e => setContentHeight(e.nativeEvent.layout.height)}
        >
          {description}
        </Text>
      </View>
      {/* Height meten voor gesloten versie */}
      <View style={{ position: 'absolute', opacity: 0, left: 0, right: 0 }}>
        <Text
          style={[styles.description, textStyle]}
          numberOfLines={maxLines}
          ellipsizeMode="tail"
          onLayout={e => {
            if (!collapsedHeight) {
              setCollapsedHeight(e.nativeEvent.layout.height);
              animation.setValue(e.nativeEvent.layout.height);
              setMeasured(true);
            }
          }}
        >
          {description}
        </Text>
      </View>

      {/* Smooth animating height */}
      <Animated.View style={{ overflow: 'hidden', height: animation }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setExpanded(!expanded)}
        >
          <Text
            style={[styles.description, textStyle]}
            numberOfLines={expanded ? undefined : maxLines}
            ellipsizeMode="tail"
          >
            {description}
          </Text>
        </TouchableOpacity>
      </Animated.View>
      {!expanded && shouldShowSeeMore && (
        <TouchableOpacity
          onPress={() => setExpanded(true)}
          style={styles.seeMoreWrapper}
        >
          <Text style={styles.seeMoreText}>{'... See more'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const scale = windowWidth / 370;

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: windowWidth * 0.7,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  description: {
    color: '#e6e6e6',
    fontSize: scale * 12,
    opacity: 0.93,
    fontFamily: 'Manrope_400Regular',
  },
  seeMoreWrapper: {
    marginTop: scale * 1,
    alignSelf: 'flex-start',
  },
  seeMoreText: {
    color: '#e6e6e6',
    opacity: 1,
    fontSize: scale * 10,
    fontFamily: 'Manrope_700Bold',
  },
});

export default Description;
