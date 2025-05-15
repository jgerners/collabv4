// components/ProfileBanner.tsx
import React from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  Dimensions,
  ViewProps,
  ImageBackgroundProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_HEIGHT = 220;

type Props = {
  uri?: string;
  height?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
// Hier voegen we in één keer alle ViewProps toe (inclusief pointerEvents)
& ViewProps
& ImageBackgroundProps;

export const ProfileBanner: React.FC<Props> = ({
  uri,
  height = DEFAULT_HEIGHT,
  children,
  style,
  ...rest // alles wat je extra meegeeft, o.a. pointerEvents
}) => {
  const containerStyle = [styles.banner, { height }, style];

  if (uri) {
    return (
      <ImageBackground
        {...rest}
        source={{ uri }}
        style={containerStyle}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        {children}
      </ImageBackground>
    );
  }

  return (
    <View {...rest} style={containerStyle}>
      <View style={styles.overlay} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});
