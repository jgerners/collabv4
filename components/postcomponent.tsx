"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import {
  Animated,
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Dimensions,
  UIManager,
  Platform,
  LayoutAnimation,
  ScrollView,
} from "react-native"
import { Video, ResizeMode, Audio } from "expo-av"
import { useAuth } from "../context/authContext"
import Slider from "@react-native-community/slider"
import { setCurrentPlayingMedia } from "../PlaybackManager"
import { Svg, Path } from "react-native-svg"

import { useLike } from "../hooks/useLike"
import { useSave } from "../hooks/useSave"
import { useFollow } from "../hooks/useFollow"
import { useUserProfile } from "../hooks/useUserProfile"

import { useFonts } from "expo-font"

import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"

// Importeer de audio cache helper
import { getCachedAudio, setCachedAudio } from "../helpers/audioCache"

import ProfileLink from "./profileLink"
import Like from "./mainbuttons/like"
import Follow from "./mainbuttons/follow"
import MoreOptions from "./mainbuttons/moreOptions"
import Collab from "./mainbuttons/collab"
import ArtistTag from "./mainbuttons/tags/artist_tags"
import GenreTag from "./mainbuttons/tags/genre_tags"
import ReplayButton from "./mainbuttons/replay"
import SaveButton from "./mainbuttons/save"
import Timestamp from "./mainbuttons/timestamp"

// Activeer LayoutAnimation op Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

const { width: windowWidth, height: windowHeight } = Dimensions.get("window")
const scale = windowWidth / 370
const postHeight = windowHeight * 0.9

export interface ArtistTagData {
  id: string
  name: string
  image: string
}

export interface GenreTagData {
  id: string
  name: string
}

export interface PostData {
  id: string
  userId: string
  profileImage: string
  username: string
  display_name: string
  role: string
  media: string | number
  mediaUrl?: string | number
  mediaType?: "image" | "video" | "photo"
  audio?: string | number
  title: string
  description: string
  artistTags?: string[]
  genreTags: string[]
  like_count: number
  save_count: number
  follower_count: number
  timestamp: string
  isLiked: boolean
  isFollowed: boolean
  isSaved: boolean
  isPlaying?: boolean
}

interface PostProps {
  post: PostData
  artistTags: ArtistTagData[]
  genreTags: GenreTagData[]
  isActive: boolean
  feedFocused: boolean
  withinPreloadRange: boolean
}

// voor de timers bij de seekbar
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
}

const PostComponent: React.FC<PostProps> = ({
  post,
  isActive,
  artistTags,
  genreTags,
  feedFocused,
  withinPreloadRange,
}) => {
  const { user } = useAuth()
  const currentUserId = user?.id
  const {
    liked,
    likeCount,
    formatCount,
    loading: likeLoading,
    toggleLike,
  } = useLike({
    userId: currentUserId!,
    postId: post.id,
    receiverId: post.userId,
    initialCount: post.like_count,
  })
  const {
    saved,
    saveCount,
    loading: saveLoading,
    toggleSave,
  } = useSave({
    userId: currentUserId!,
    postId: post.id,
    initialCount: post.save_count,
  })
  const {
    isFollowing,
    followCount,
    loading: followLoading,
    toggleFollow,
  } = useFollow({
    followerId: currentUserId!,
    followingId: post.userId,
    initialCount: post.follower_count,
  })

  const { profile, loading: profileLoading, error: profileError } = useUserProfile(post.userId)

  const [fontsLoaded] = useFonts({
    "Manrope": require("../assets/fonts/Manrope-VariableFont_wght.ttf")
  })

  // Slide functionality
  const [activeSlide, setActiveSlide] = useState(0)
  const totalSlides = 3
  const scrollViewRef = useRef<ScrollView>(null)
  const scrollX = useRef(new Animated.Value(0)).current

  const [isPlaying, setIsPlaying] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [manualPaused, setManualPaused] = useState(false)
  const [showSeeMore, setShowSeeMore] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)

  const toggleAnim = useRef(new Animated.Value(0)).current
  const [artistExpanded, setArtistExpanded] = useState(false)

  const hasAutoPlayedRef = useRef(false)

  // Handle dot indicator press
  const handleDotPress = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: index * windowWidth, animated: true })
      setActiveSlide(index)
    }
  }

  // Handle scroll end to update active slide
  const handleScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x
    const newIndex = Math.round(contentOffsetX / windowWidth)
    setActiveSlide(newIndex)
  }

  const expandArtistTags = () => {
    if (!artistExpanded) {
      Animated.timing(toggleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start()
      setArtistExpanded(true)
    }
  }

  const collapseArtistTags = () => {
    if (artistExpanded) {
      Animated.timing(toggleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start()
      setArtistExpanded(false)
    }
  }

  const videoRef = useRef<Video | null>(null)
  const audioRef = useRef<Audio.Sound | null>(null)

  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const awaitOrIgnore = async (fn: () => Promise<any>) => {
    try {
      await fn()
    } catch (error) {
      // Eventuele logging
    }
  }

  const updatePlaybackStatus = (status: any) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis)
      setDuration(status.durationMillis)
    }
  }

  const toggleDescription = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setDescriptionExpanded(!descriptionExpanded)
  }

  const retryPlayAudio = async (sound: Audio.Sound, retries = 3): Promise<void> => {
    for (let i = 0; i < retries; i++) {
      try {
        const status = await sound.getStatusAsync()
        if (status.isLoaded) {
          await sound.playAsync()
          return
        }
      } catch (error) {}
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  const playAudio = async (reset = true) => {
    setAudioLoading(true)
    try {
      let sound = getCachedAudio(post.id)
      const audioUri = typeof post.audio === "string" ? post.audio : post.audio!.toString()
      if (sound) {
        const status = await sound.getStatusAsync()
        if (!status.isLoaded) {
          const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true })
          sound = newSound
          setCachedAudio(post.id, sound)
          sound.setOnPlaybackStatusUpdate(updatePlaybackStatus)
        } else {
          if (reset) {
            await sound.setPositionAsync(0)
          }
          sound.setOnPlaybackStatusUpdate(updatePlaybackStatus)
          await sound.playAsync()
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true })
        sound = newSound
        setCachedAudio(post.id, sound)
        sound.setOnPlaybackStatusUpdate(updatePlaybackStatus)
      }
      audioRef.current = sound
      setIsPlaying(true)
    } catch (error) {
      console.error("Fout bij het laden van audio:", error)
    }
    setAudioLoading(false)
  }

  useEffect(() => {
    if (post.mediaType === "video" && videoRef.current) {
      videoRef.current.setOnPlaybackStatusUpdate(updatePlaybackStatus)
    }
  }, [post.mediaType])

  // Auto-play effect
  useEffect(() => {
    const managePlayback = async () => {
      if (isActive && feedFocused) {
        if (post.mediaType === "video" && videoRef.current) {
          await setCurrentPlayingMedia(videoRef.current)
          awaitOrIgnore(() => videoRef.current!.playAsync())
          setIsPlaying(true)
          setManualPaused(false)
        } else if (post.mediaType === "photo" && post.audio) {
          const sound = getCachedAudio(post.id)
          if (sound) {
            const status = await sound.getStatusAsync()
            const shouldReset = status.isLoaded ? status.positionMillis === 0 : true
            await playAudio(shouldReset)
          } else {
            await playAudio(true)
          }
          setManualPaused(false)
        }
        hasAutoPlayedRef.current = true
      } else {
        if (feedFocused) {
          if (post.mediaType === "video" && videoRef.current) {
            awaitOrIgnore(() => videoRef.current!.pauseAsync())
            awaitOrIgnore(() => videoRef.current!.setPositionAsync(0))
            setIsPlaying(false)
            setManualPaused(false)
          } else if (post.mediaType === "photo" && post.audio && audioRef.current) {
            awaitOrIgnore(() => audioRef.current!.pauseAsync())
            awaitOrIgnore(() => audioRef.current!.setPositionAsync(0))
            setIsPlaying(false)
            setManualPaused(false)
          }
        } else {
          if (post.mediaType === "video" && videoRef.current) {
            awaitOrIgnore(() => videoRef.current!.pauseAsync())
            setIsPlaying(false)
            setManualPaused(false)
          } else if (post.mediaType === "photo" && post.audio && audioRef.current) {
            awaitOrIgnore(() => audioRef.current!.pauseAsync())
            setIsPlaying(false)
            setManualPaused(false)
          }
        }
        hasAutoPlayedRef.current = false
      }
    }

    managePlayback()
  }, [isActive, feedFocused])

  // Handmatige play/pause
  const handlePlayPause = async () => {
    if (post.mediaType === "video" && videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync()
        setIsPlaying(false)
        setManualPaused(true)
      } else {
        await videoRef.current.playAsync()
        setIsPlaying(true)
        setManualPaused(false)
      }
    } else if (post.mediaType === "photo" && post.audio) {
      if (audioRef.current) {
        if (isPlaying) {
          await audioRef.current.pauseAsync()
          setIsPlaying(false)
          setManualPaused(true)
        } else {
          await audioRef.current.playAsync()
          setIsPlaying(true)
          setManualPaused(false)
        }
      }
    }
  }

  // Seekbar-handler
  const handleSlidingComplete = async (value: number) => {
    const newPosition = value * duration
    if (post.mediaType === "video" && videoRef.current) {
      await videoRef.current.setPositionAsync(newPosition)
    } else if (post.mediaType === "photo" && post.audio && audioRef.current) {
      await audioRef.current.setPositionAsync(newPosition)
      const status = await audioRef.current.getStatusAsync()
      if (status.isLoaded && !status.isPlaying) {
        await audioRef.current.playAsync()
        setIsPlaying(true)
      }
    }
  }

  // Replay
  const handleReplay = async () => {
    if (post.mediaType === "video" && videoRef.current) {
      awaitOrIgnore(() => videoRef.current!.setPositionAsync(0))
      awaitOrIgnore(() => videoRef.current!.playAsync())
      setIsPlaying(true)
    } else if (post.mediaType === "photo" && post.audio && audioRef.current) {
      awaitOrIgnore(() => audioRef.current!.setPositionAsync(0))
      awaitOrIgnore(() => audioRef.current!.playAsync())
      setIsPlaying(true)
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (post.mediaType === "photo" && post.audio && audioRef.current) {
        awaitOrIgnore(() => audioRef.current!.pauseAsync())
      }
      if (post.mediaType === "video" && videoRef.current) {
        awaitOrIgnore(() => videoRef.current!.pauseAsync())
      }
    }
  }, [])

  const handleLayout = (event: any) => {
    const { height } = event.nativeEvent.layout
    console.log("Post height:", height)
  }

  return (
    <View style={styles.fullScreen}>
      {/* Background blur */}
      <View
        style={{
          position: "absolute",
          top: scale * 100,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {post.mediaType === "video" ? (
          <Video
            source={{ uri: post.mediaUrl as string }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isLooping={false}
          />
        ) : (
          <Image source={{ uri: post.mediaUrl as string }} style={StyleSheet.absoluteFill} />
        )}
        <BlurView
          intensity={45}
          tint="dark"
          style={[
            StyleSheet.absoluteFill,
            {
              borderTopLeftRadius: scale * 20,
              borderTopRightRadius: scale * 20,
            },
          ]}
        />
      </View>

      <LinearGradient colors={["transparent", "black"]} locations={[0.0, 0.0]} style={StyleSheet.absoluteFill} />

      <View style={styles.postContainer} onLayout={handleLayout}>
        {/* Indicator dots at the top */}
        <View style={styles.dotsContainer}>
          {Array.from({ length: totalSlides }).map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              style={[styles.dot, activeSlide === index && styles.activeDot]}
            />
          ))}
        </View>

        {/* Horizontal ScrollView for slides */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          style={styles.slideContainer}
        >
          {/* Slide 1 - Media Content with new layout */}
          <View style={styles.slide}>
            <View style={styles.mediaAndCollabContainer}>
              <Pressable onPress={handlePlayPause} style={styles.mediaContainer}>
                {/* Media */}
                {post.mediaType === "video" ? (
                  <Video
                    ref={videoRef}
                    source={{ uri: post.mediaUrl as string }}
                    style={styles.media}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                    isLooping
                    useNativeControls={false}
                  />
                ) : (
                  <Image source={{ uri: post.mediaUrl as string }} style={styles.media} />
                )}

                {/* Upper left overlay - display_name • role */}
                <View style={styles.upperLeftOverlay}>
                  <Text style={styles.displayNameRole}>
                    {post.display_name} <Text style={styles.dotText}>•</Text> {post.role}
                  </Text>
                  <TouchableOpacity style={styles.moreOptionsTopRight}>
                    <MoreOptions style={styles.moreOptionsButton} menuStyle={{ top: scale * 575, left: scale * 115 }} />
                  </TouchableOpacity>
                </View>

                {/* Play icon overlay when paused */}
                {!isPlaying && manualPaused && (
                  <View style={styles.playIconOverlay}>
                    <Svg width={50} height={50} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M8 5.14v14l11-7-11-7z"
                        fill="white"
                        stroke="white"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                )}

                {/* Profile overlay - ABOVE title */}
                <View style={styles.profileOverlay}>
                  <ProfileLink userId={post.userId}>
                    <Image
                      source={{ uri: post.profileImage }}
                      style={styles.profileImageOverlay}
                    />
                  </ProfileLink>
                  <ProfileLink userId={post.userId}>
                    <Text style={styles.usernameOverlay}>{post.username}</Text>
                  </ProfileLink>
                </View>

                {/* Title overlay - below profile */}
                <View style={styles.titleOverlay}>
                  <Text style={styles.postTitle}>{post.title}</Text>
                </View>

                {/* Description overlay - below title */}
                <View style={styles.descriptionOverlay}>
                  <TouchableOpacity onPress={toggleDescription} activeOpacity={0.8}>
                    <Text
                      style={[styles.postDescription, { marginBottom: descriptionExpanded ? 10 : 0 }]}
                      numberOfLines={descriptionExpanded ? undefined : 2}
                    >
                      {post.description}
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={[styles.postDescription, styles.hiddenText]}
                    onTextLayout={(e) => {
                      if (e.nativeEvent.lines.length > 2 && !showSeeMore) setShowSeeMore(true)
                    }}
                  >
                    {post.description}
                  </Text>

                  {showSeeMore && (
                    <TouchableOpacity onPress={toggleDescription}>
                      <Text style={styles.seeMoreText}>{descriptionExpanded ? "See less" : "...See more"}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Tags overlay */}
                <View style={styles.tagsOverlay}>
                  <TouchableOpacity onPress={expandArtistTags}>
                    <View style={styles.artistTagsContainer}>
                      {post.artistTags?.map((tagId, index) => {
                        const foundTag = artistTags.find((t) => t.id === tagId)
                        if (!foundTag) return null
                        const animatedMargin =
                          index === 0
                            ? 0
                            : toggleAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-10, 0],
                              })
                        return (
                          <Animated.View key={foundTag.id} style={{ marginLeft: animatedMargin }}>
                            <ArtistTag
                              id={foundTag.id}
                              name={foundTag.name}
                              image={foundTag.image}
                              disableModuleOpen={!artistExpanded}
                            />
                          </Animated.View>
                        )
                      })}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={collapseArtistTags}>
                    <View style={styles.genreTagsContainer}>
                      {post.genreTags?.map((tagId, index) => {
                        const foundTag = genreTags.find((t) => t.id === tagId)
                        if (!foundTag) return null
                        const animatedMargin =
                          index === 0
                            ? 0
                            : toggleAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [2, -20],
                              })
                        return (
                          <Animated.View key={foundTag.id} style={{ marginLeft: animatedMargin }}>
                            <GenreTag id={foundTag.id} name={foundTag.name} />
                          </Animated.View>
                        )
                      })}
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Seekbar overlay - beneath tags, above collab */}
                <View style={styles.seekbarOverlay}>
                  <View style={styles.timeLabelCurrent}>
                    <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                  </View>

                  <View style={styles.seekbarContainer}>
                    <Slider
                      style={{ width: scale * 200, transform: [{ scaleY: 1.5 }] }}
                      minimumValue={0}
                      maximumValue={1}
                      value={duration ? currentTime / duration : 0}
                      minimumTrackTintColor="#FFFFFF"
                      maximumTrackTintColor="#000000"
                      thumbTintColor="#FFFFFF00"
                      onSlidingComplete={handleSlidingComplete}
                    />
                  </View>

                  <View style={styles.timeLabelRemaining}>
                    <Text style={styles.timeText}>-{formatTime(duration - currentTime)}</Text>
                  </View>

                  <ReplayButton onPress={handleReplay} />
                </View>
              </Pressable>

              {/* Collab button - upper half overlayed, lower half below */}
              <View style={styles.collabContainer}>
                {currentUserId ? (
                  <Collab senderId={currentUserId} receiverId={post.userId} postId={post.id} />
                ) : (
                  <TouchableOpacity style={styles.collabDisabled} disabled>
                    <Text style={styles.collabText}>LOGIN TO COLLAB!</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Slide 2 - Profile Info with Action Buttons */}
          <View style={styles.slide}>
            <View style={styles.profileBubble}>
              <ScrollView
                style={styles.profileScrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.profileScrollContent}
              >
                {/* Profile Banner */}
                <View style={styles.profileBanner}>
                  <Image source={{ uri: profile?.profileBanner }} style={styles.profileBannerImage} />
                  <View style={styles.profileBannerOverlay}>
                    <Text style={styles.profileUsername}>{profile?.username}</Text>
                    <TouchableOpacity style={styles.followButtonSmall} onPress={toggleFollow} disabled={followLoading}>
                      <Text style={styles.followButtonText}>
                        {isFollowing ? "Following" : "Follow"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* About Me Section */}
                <View style={styles.profileSection}>
                  <Text style={styles.sectionTitle}>About me</Text>
                  <Text style={styles.sectionText}>{profile?.bio}</Text>
                </View>

                {/* Action Buttons Section */}
                <View style={styles.profileSection}>
                  <Text style={styles.sectionTitle}>Actions</Text>
                  <View style={styles.actionsContainer}>
                    {currentUserId && (
                      <>
                        {/* Like Button */}
                        <TouchableOpacity style={styles.actionButton} onPress={toggleLike} disabled={likeLoading}>
                          <View style={styles.actionWithCount}>
                            <Like liked={liked} onPress={toggleLike} />
                            <Text style={styles.counterText}>{formatCount(likeCount)}</Text>
                          </View>
                        </TouchableOpacity>

                        {/* Save Button */}
                        <TouchableOpacity style={styles.actionButton} onPress={toggleSave} disabled={saveLoading}>
                          <View style={styles.actionWithCount}>
                            <SaveButton saved={saved} onPress={toggleSave} postId={post.id} userId={currentUserId} />
                            <Text style={styles.counterText}>{formatCount(saveCount)}</Text>
                          </View>
                        </TouchableOpacity>

                        {/* Follow Button */}
                        <TouchableOpacity style={styles.actionButton} onPress={toggleFollow} disabled={followLoading}>
                          <View style={styles.actionWithCount}>
                            <Follow followerId={currentUserId} followingId={post.userId} onPress={toggleFollow} />
                            <Text style={styles.counterText}>{formatCount(followCount)}</Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

                {/* Stats Section */}
                <View style={styles.profileSection}>
                  <Text style={styles.sectionTitle}>Stats</Text>
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>42</Text>
                      <Text style={styles.statLabel}>Tracks</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>128</Text>
                      <Text style={styles.statLabel}>Collabs</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{formatCount(followCount)}</Text>
                      <Text style={styles.statLabel}>Followers</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Slide 3 - Equipment Info */}
          <View style={styles.slide}>
            <View style={styles.profileBubble}>
              <View style={styles.equipmentContainer}>
                <Text style={styles.sectionTitle}>Equipment</Text>
                <View style={styles.equipmentItem}>
                  <Text style={styles.equipmentLabel}>DAW</Text>
                  <Text style={styles.equipmentValue}>Ableton Live 11</Text>
                </View>
                <View style={styles.equipmentItem}>
                  <Text style={styles.equipmentLabel}>Instruments</Text>
                  <Text style={styles.equipmentValue}>Guitar, Piano, Synths</Text>
                </View>
                <View style={styles.equipmentItem}>
                  <Text style={styles.equipmentLabel}>Plugins</Text>
                  <Text style={styles.equipmentValue}>Serum, Omnisphere, Valhalla</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Timestamp */}
        <View style={styles.timestampContainer}>
          <Timestamp timestamp={post.timestamp} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fullScreen: {
    position: "relative",
    width: windowWidth,
    height: 780,
    backgroundColor: "#000",
  },
  postContainer: {
    backgroundColor: "transparent",
    borderRadius: scale * 15,
    height: "auto",
    width: windowWidth,
    alignSelf: "center",
  },
  // Dots indicator styles
  dotsContainer: {
    position: "absolute",
    top: scale * 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  dot: {
    width: scale * 5,
    height: scale * 5,
    borderRadius: scale * 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginHorizontal: scale * 4,
    marginTop: scale * 7,
  },
  activeDot: {
    backgroundColor: "white",
    transform: [{ scale: 1.2 }],
  },
  // Slide container styles
  slideContainer: {
    width: windowWidth,
    height: scale * 575,
  },
  slide: {
    width: windowWidth,
    height: scale * 575,
    justifyContent: "center",
    alignItems: "center",
  },
  // NEW: Container for media and collab positioning
  mediaAndCollabContainer: {
    width: windowWidth,
    height: scale * 575,
    position: "relative",
  },
  // FIXED: Media container - bigger height like original
  mediaContainer: {
    width: windowWidth,
    borderRadius: scale * 10,
    overflow: "hidden",
    backgroundColor: "#000",
    height: scale * 520, // Bigger height like original
    alignSelf: "center",
    position: "relative",
  },
  media: {
    width: "100%",
    height: "100%",
    position: "relative",
    zIndex: 0,
  },
  // FIXED: Upper left overlay - grey, smaller, no shadow
  upperLeftOverlay: {
    position: "absolute",
    top: scale * 15,
    left: scale * 15,
    right: scale * 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 3,
  },
  displayNameRole: {
    color: "rgba(255, 255, 255, 0.7)", // More grey
    fontSize: scale * 12, // Smaller
    fontWeight: "500", // Less bold
    // Removed shadow
  },
  dotText: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  moreOptionsTopRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  // FIXED: Profile overlay - ABOVE title
  profileOverlay: {
    position: "absolute",
    bottom: scale * 160, // Moved up to be above title
    left: scale * 15,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 3,
  },
  profileImageOverlay: {
    width: scale * 25,
    height: scale * 25,
    borderRadius: scale * 15,
    marginRight: scale * 8,
  },
  usernameOverlay: {
    color: "white",
    fontSize: scale * 14,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // NEW: Title overlay - separate from description
  titleOverlay: {
    position: "absolute",
    bottom: scale * 130,
    left: scale * 15,
    right: scale * 15,
    zIndex: 2,
  },
  postTitle: {
    color: "white",
    fontSize: scale * 16,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // NEW: Description overlay - below title, 50% width
  descriptionOverlay: {
    position: "absolute",
    bottom: scale * 90,
    left: scale * 15,
    width: windowWidth * 0.5, // 50% of media width
    zIndex: 2,
  },
  postDescription: {
    color: "white",
    fontSize: scale * 14,
    marginBottom: scale * 5,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hiddenText: {
    position: "absolute",
    opacity: 0,
    zIndex: -1,
  },
  seeMoreText: {
    color: "white",
    fontSize: scale * 12,
    marginTop: scale * 4,
    fontWeight: "bold",
    fontStyle: "italic",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // Play icon overlay styles
  playIconOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    opacity: 0.7,
  },
  // FIXED: Tags overlay repositioned
  tagsOverlay: {
    position: "absolute",
    bottom: scale * 50, // Above seekbar
    left: scale * 15,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 2,
  },
  artistTagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  genreTagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: scale * 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  // NEW: Seekbar overlay - on media container, beneath tags
  seekbarOverlay: {
    position: "absolute",
    bottom: scale * 15,
    left: scale * 15,
    right: scale * 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  seekbarContainer: {
    flex: 1,
    marginHorizontal: scale * 10,
  },
  timeLabelCurrent: {
    width: scale * 40,
    alignItems: "center",
  },
  timeLabelRemaining: {
    width: scale * 40,
    alignItems: "center",
  },
  timeText: {
    color: "white",
    fontSize: scale * 12,
  },
  // FIXED: Collab container - upper half overlayed, lower half below
  collabContainer: {
    position: "absolute",
    bottom: scale * -30, // Half overlayed, half below
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  collabDisabled: {
    opacity: 0.5,
  },
  collabText: {
    color: "#fff",
  },
  // Profile bubble styles
  profileBubble: {
    width: windowWidth,
    height: scale * 575,
    backgroundColor: "#191919",
    borderRadius: scale * 10,
    overflow: "hidden",
    marginHorizontal: scale * 10,
  },
  profileScrollView: {
    flex: 1,
  },
  profileScrollContent: {
    padding: scale * 15,
  },
  profileBanner: {
    width: "100%",
    height: scale * 200,
    borderRadius: scale * 15,
    overflow: "hidden",
    marginBottom: scale * 20,
    position: "relative",
    marginTop: scale * 20,
  },
  profileBannerImage: {
    width: "100%",
    height: "100%",
  },
  profileBannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: scale * 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileUsername: {
    color: "white",
    fontSize: scale * 18,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  followButtonSmall: {
    backgroundColor: "transparent",
    borderColor: "white",
    borderWidth: 1,
    borderRadius: scale * 15,
    paddingHorizontal: scale * 12,
    paddingVertical: scale * 5,
  },
  followButtonText: {
    color: "white",
    fontSize: scale * 12,
  },
  profileSection: {
    backgroundColor: "#2B2B2B",
    borderRadius: scale * 15,
    padding: scale * 15,
    marginBottom: scale * 15,
  },
  sectionTitle: {
    color: "white",
    fontSize: scale * 16,
    fontWeight: "bold",
    marginBottom: scale * 10,
  },
  sectionText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: scale * 14,
    lineHeight: scale * 20,
  },
  // Actions container for slide 2
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: scale * 10,
  },
  actionButton: {
    alignItems: "center",
    marginHorizontal: scale * 10,
  },
  actionWithCount: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: {
    color: "white",
    fontSize: scale * 12,
    fontWeight: "bold",
    marginLeft: scale * 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: scale * 10,
    padding: scale * 10,
    alignItems: "center",
    width: "30%",
  },
  statNumber: {
    color: "white",
    fontSize: scale * 18,
    fontWeight: "bold",
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: scale * 12,
    marginTop: scale * 5,
  },
  equipmentContainer: {
    padding: scale * 20,
  },
  equipmentItem: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: scale * 10,
    padding: scale * 15,
    marginBottom: scale * 10,
  },
  equipmentLabel: {
    color: "white",
    fontSize: scale * 14,
    fontWeight: "bold",
    marginBottom: scale * 5,
  },
  equipmentValue: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: scale * 12,
  },
  timestampContainer: {
    marginVertical: scale * 5,
    alignItems: "center",
    bottom: scale * 8,
    opacity: 0,
  },
  moreOptionsButton: {
    alignItems: "center",
    justifyContent: "center",
  },
})

export default PostComponent