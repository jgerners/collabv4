import React, { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type FeedNavBarProps = {
  state: any;
  descriptors: any;
  navigation: any;
  visible: boolean;
  onPressPlus: () => void;
};

const FeedNavBar: React.FC<FeedNavBarProps> = ({
  state,
  descriptors,
  navigation,
  visible,
  onPressPlus,
}) => {
  const barAnim = useRef(new Animated.Value(0)).current;

  // Floating plus wordt getoond zolang tabbar NIET 100% zichtbaar is
  const [showFloatingPlus, setShowFloatingPlus] = useState(!visible);

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: visible ? 0 : 100,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  useEffect(() => {
    const id = barAnim.addListener(({ value }) => {
      setShowFloatingPlus(value > 0); // Floating plus als tabbar NIET volledig zichtbaar is
    });
    return () => barAnim.removeListener(id);
  }, [barAnim]);

  return (
    <>
      {showFloatingPlus && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.floatingPlus}
          onPress={onPressPlus}
        >
          <View style={styles.uploadBubble}>
            <Ionicons name="add" size={32} color="white" />
          </View>
        </TouchableOpacity>
      )}
      <Animated.View
        style={[
          styles.tabBar,
          {
            transform: [{ translateY: barAnim }],
            opacity: barAnim.interpolate({
              inputRange: [0, 100],
              outputRange: [1, 0],
            }),
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          let icon;
          switch (route.name) {
            case 'Feed':
              icon = (
                <MaterialCommunityIcons
                  name="home-variant"
                  size={22}
                  color={isFocused ? '#fff' : '#aaa'}
                />
              );
              break;
            case 'COLLABS!':
              icon = (
                <MaterialCommunityIcons
                  name="chat"
                  size={22}
                  color={isFocused ? '#fff' : '#aaa'}
                />
              );
              break;
            case 'Search':
              icon = (
                <Ionicons
                  name="search"
                  size={22}
                  color={isFocused ? '#fff' : '#aaa'}
                />
              );
              break;
            case 'Profile':
              icon = (
                <Ionicons
                  name="person"
                  size={22}
                  color={isFocused ? '#fff' : '#aaa'}
                />
              );
              break;
            case 'Upload':
              icon = (
                <View style={styles.uploadBubble}>
                  <Ionicons name="add" size={32} color="white" />
                </View>
              );
              break;
            default:
              icon = null;
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              style={[
                styles.tabItem,
                route.name === 'Upload' && styles.tabItemUpload,
              ]}
              onPress={() => {
                if (route.name === 'Upload') {
                  onPressPlus();
                } else {
                  navigation.navigate(route.name);
                }
              }}
            >
              {icon}
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    flexDirection: 'row',
    backgroundColor: '#131313',
    borderTopWidth: 0,
    paddingHorizontal: 50,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    zIndex: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    marginTop: -15, // Zet hier bijvoorbeeld -8, -12 of wat jij mooi vindt
  },
  tabItemUpload: {},
  uploadBubble: {
    width: 60,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#262626",
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#262626",
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 7,
    
  },
  floatingPlus: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    marginLeft: -30,
    zIndex: 20,

  },
});

export default FeedNavBar;
