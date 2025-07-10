import React, { useRef } from "react"
import { View, Text, Image, Pressable, StyleSheet, FlatList, Animated, Easing } from "react-native"
import { Video, ResizeMode } from 'expo-av'
import { Play } from "lucide-react-native"

export interface ForYouPostData {
  id: string
  username: string
  media: string
  mediaType: "image" | "video"
  artistId?: string   // ← voeg toe als je wilt filteren op artiest
  genreId?: string    // ← voeg toe als je wilt filteren op genre
}

interface ForYouRackProps {
  title?: string
  subtitle?: string
  posts: ForYouPostData[]
  onPressPost: (post: ForYouPostData) => void
  isAfterActivePost?: boolean
}

const ANIMATION_DURATION = 300
const ANIMATION_EASING = Easing.bezier(0.25, 0.46, 0.45, 0.94)
const EXIT_DURATION = 250
const EXIT_EASING = Easing.bezier(0.55, 0.06, 0.68, 0.19)

const MEDIA_HEIGHT = 140
const MEDIA_WIDTH = 100
const H_MARGIN = 25

const VideoOrImageBubble: React.FC<{
  item: ForYouPostData,
  isFirst: boolean,
  isLast: boolean,
  onPress: () => void
}> = ({ item, isFirst, isLast, onPress }) => {
  const videoRef = useRef<any>(null);

  const handlePress = async () => {
    // NIETS meer met geluid of position!
    onPress();
  };

  return (
    <Pressable style={styles.mediaBubble} onPress={handlePress}>
      <View style={{ position: 'relative' }}>
        {item.mediaType === "video" ? (
          <Video
            ref={videoRef}
            source={{ uri: item.media }}
            style={[
              styles.media,
              {
                borderTopLeftRadius: isFirst ? 16 : 0,
                borderBottomLeftRadius: isFirst ? 16 : 0,
                borderTopRightRadius: isLast ? 16 : 0,
                borderBottomRightRadius: isLast ? 16 : 0,
              },
            ]}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isMuted
            isLooping
            useNativeControls={false}
          />
        ) : (
          <Image
            source={{ uri: item.media }}
            style={[
              styles.media,
              {
                borderTopLeftRadius: isFirst ? 16 : 0,
                borderBottomLeftRadius: isFirst ? 16 : 0,
                borderTopRightRadius: isLast ? 16 : 0,
                borderBottomRightRadius: isLast ? 16 : 0,
              },
            ]}
          />
        )}
        <View style={styles.playIconOverlay}>
          <Play size={28} color="white" fill="white" />
        </View>
      </View>
      <Text style={styles.username} numberOfLines={1}>@{item.username}</Text>
    </Pressable>
  );
};


const ForYouRack: React.FC<ForYouRackProps> = ({
  title = "For you",
  subtitle,
  posts,
  onPressPost,
  isAfterActivePost = false,
}) => {
  const pushDownAnimation = useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    if (isAfterActivePost) {
      Animated.timing(pushDownAnimation, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        easing: ANIMATION_EASING,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(pushDownAnimation, {
        toValue: 0,
        duration: EXIT_DURATION,
        easing: EXIT_EASING,
        useNativeDriver: true,
      }).start()
    }
  }, [isAfterActivePost])

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: pushDownAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 50],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <FlatList
        data={posts}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <VideoOrImageBubble
            item={item}
            isFirst={index === 0}
            isLast={index === posts.length - 1}
            onPress={() => onPressPost(item)}
          />
        )}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    marginBottom: 40,
    marginHorizontal: H_MARGIN,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Jost_800ExtraBold",
    marginBottom: 0,
  },
  subtitle: {
    color: "#bcbcbc",
    fontSize: 11,
    fontFamily: "Jost_500Medium",
    marginBottom: 7,
  },
  listContent: {
    flexDirection: "row",
    gap: 2,
    paddingVertical: 3,
  },
  mediaBubble: {
    alignItems: "center",
    marginRight: 6,
    width: MEDIA_WIDTH,
  },
  media: {
    width: MEDIA_WIDTH,
    height: MEDIA_HEIGHT,
    backgroundColor: "#232323",
    marginBottom: 6,
    
  },
  username: {
    color: "#fff",
    fontSize: 8,
    fontFamily: "Jost_400Regular",
    textAlign: "center",
    maxWidth: MEDIA_WIDTH,
    opacity: 0.9,
    alignSelf: 'flex-start',
    paddingLeft : 5,
  },
  playIconOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: MEDIA_WIDTH,
    height: MEDIA_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
})

export default ForYouRack
