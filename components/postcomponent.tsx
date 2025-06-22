"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import {
  Animated,
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  UIManager,
  Platform,
  TouchableOpacity,
} from "react-native"
import { Video, ResizeMode, Audio } from "expo-av"
import { useAuth } from "../context/authContext"
import Slider from "@react-native-community/slider"
import { setCurrentPlayingMedia } from "../PlaybackManager"
import { Svg, Path } from "react-native-svg"

import Collab from "./mainbuttons/collab";
import MoreOptions from "./mainbuttons/moreOptions"; // check je pad!
import ArtistTag from "./mainbuttons/tags/artist_tags";
import GenreTag from "./mainbuttons/tags/genre_tags";
import Description from "./mainbuttons/description";
import Title from "./mainbuttons/title"; // pas het pad aan naar jouw structuur!
import ProfileLink from "./profileLink"; // Let op: pad aanpassen indien nodig!
import WaveForm from "./mainbuttons/waveForm"; // pas het pad aan als nodig









import { useLike } from "../hooks/useLike"
import { useSave } from "../hooks/useSave"
import { useFollow } from "../hooks/useFollow"
import { useUserProfile } from "../hooks/useUserProfile"
import { useFonts } from "expo-font"
import { getCachedAudio, setCachedAudio } from "../helpers/audioCache"

import ReplayButton from "./mainbuttons/replay"

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

const { width: windowWidth, height: windowHeight } = Dimensions.get("window")
const scale = windowWidth / 370

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
    "Manrope": require("../assets/fonts/Manrope-VariableFont_wght.ttf"),
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [manualPaused, setManualPaused] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)

  const videoRef = useRef<Video | null>(null)
  const audioRef = useRef<Audio.Sound | null>(null)

  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [animatedTime, setAnimatedTime] = useState(0);


  const awaitOrIgnore = async (fn: () => Promise<any>) => {
    try {
      await fn()
    } catch (error) {}
  }

  const updatePlaybackStatus = (status: any) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis)
       setAnimatedTime(status.positionMillis); // <- voeg deze toe!
      setDuration(status.durationMillis)
    }
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

  const hasAutoPlayedRef = useRef(false)
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

  const handleSlidingComplete = async (value: number) => {
    const newPosition = value * duration
    setAnimatedTime(newPosition); // direct visueel syncen!
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

useEffect(() => {
  let raf: number | undefined;
  let prev = Date.now();

  function animate() {
    if (isPlaying && duration > 0) {
      const now = performance.now();
      const elapsed = now - prev;
      prev = now;
      setAnimatedTime((prevTime) => {
        let next = prevTime + elapsed;
        return next > duration ? duration : next;
      });
      raf = requestAnimationFrame(animate);
    }
  }

  if (isPlaying) {
    prev = performance.now();
    raf = requestAnimationFrame(animate);
  }
  return () => {
    if (raf !== undefined) cancelAnimationFrame(raf);
  };
}, [isPlaying, duration]);




  // ---- MEDIA-ONLY JSX ----
  return (
  <View style={styles.fullScreen}>
    <View style={styles.mediaContainer}>
     <View style={styles.displayNameRoleOverlay}>
    <Text style={styles.displayNameRoleText}>
      {post.display_name} · {post.role}
    </Text>
  </View>

   {/* Rechtsboven: MoreOptions */}
  <TouchableOpacity style={styles.moreOptionsOverlay}>
  <MoreOptions />
</TouchableOpacity>




{/* profielfoto,username,titel, beschrijving en waveform */}
  <View style={styles.midoverlay}>
    <View style={styles.profileRow}>
  {/* Links: profielfoto + username samen */}
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    <ProfileLink userId={post.userId}>
      <Image source={{ uri: post.profileImage }} style={styles.profilePic} />
    </ProfileLink>
    <ProfileLink userId={post.userId}>
      <Text style={styles.profileUsername}>{post.username.toLowerCase()}</Text>
    </ProfileLink>
  </View>
  {/* Rechts: waveform */}
  <WaveForm style={styles.waveForm} />
</View>

    <Title title={post.title} maxLines={2} textStyle={{ marginBottom: scale * 5 }} />
    <Description description={post.description} maxLines={2} />
  </View>





{/* TAGS - OVERLAY */}
  <View style={styles.tagsBar}>
    <View style={styles.artistTagsRow}>
      {post.artistTags?.map((tagId, idx) => {
        const tag = artistTags.find(t => t.id === tagId);
        if (!tag) return null;
        return (
          <View key={tag.id} style={[
            styles.artistTagBubble,
            idx !== 0 && { marginLeft: -scale * 8 } // overlap effect!
          ]}>
            <ArtistTag id={tag.id} name={tag.name} image={tag.image} />
          </View>
        );
      })}
    </View>
    <View style={styles.genreTagsRow}>
      {post.genreTags?.map((tagId) => {
        const tag = genreTags.find(t => t.id === tagId);
        if (!tag) return null;
        return (
          <GenreTag key={tag.id} id={tag.id} name={tag.name} />
        );
      })}
    </View>
  </View>


      <Pressable onPress={handlePlayPause}>
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


        
        {/* Controls */}
        <View style={styles.controlsContainer}>
          {/* Current time */}
          <View style={styles.timeLabelCurrent}>
            <Text style={styles.timeText}>{formatTime(animatedTime)}</Text>
          </View>
          {/* Slider */}
          <View style={styles.seekbarContainer}>
            <Slider
              style={{ width: scale * 250, transform: [{ scaleY: 1.5,  }] }}
              minimumValue={0}
              maximumValue={1}
              value={duration ? animatedTime / duration : 0}
              minimumTrackTintColor="#FFFFFF"
              maximumTrackTintColor="#000000"
              thumbTintColor="#FFFFFF00"
              onSlidingComplete={handleSlidingComplete}
            />
          </View>
          {/* Remaining time */}
          <View style={styles.timeLabelRemaining}>
            <Text style={styles.timeText}>-{formatTime(duration - animatedTime)}</Text>
          </View>
          {/* Replay button */}
          <ReplayButton onPress={handleReplay} />
        </View>
      </Pressable>
    </View>
    
    {currentUserId && (
  <View style={styles.collabButtonWrapper}>
    <Collab senderId={currentUserId} receiverId={post.userId} postId={post.id} />
  </View>
)}

    
  </View>
)

}

// Stylesheet: kan zo blijven, is geen enkel probleem
const styles = StyleSheet.create({
  fullScreen: {
    position: "relative",
    width: windowWidth,
    height: 780,
    backgroundColor: "#000",
  },
  mediaContainer: {
    width: windowWidth,
    borderRadius: scale * 10,
    overflow: "hidden",
    backgroundColor: "#000",
    height: scale * 575,
    alignSelf: "center",
    position: "relative",
  },
  media: {
    width: "100%",
    height: "100%",
    position: "relative",
    zIndex: 0,
  },
displayNameRoleOverlay: {
  position: "absolute",
  top: scale * 12,
  left: scale * 3,
  flexDirection: "row",
  alignItems: "center",
  zIndex: 12,
  
  borderRadius: scale * 8,
  paddingHorizontal: scale * 10,
  paddingVertical: scale * 5,
},
displayNameRoleText: {
  color: "#e6e6e6",
  fontWeight: "600",
  fontSize: scale * 10,
  fontFamily: 'Manrope_400Regular' // of 'Manrope_700Bold'
},

dot: {
  color: "#e6e6e6",
  fontSize: scale * 15,
  marginHorizontal: scale * 4,
  fontWeight: "600",
},

moreOptionsOverlay: {
  position: "absolute",
  top: scale * 10,
  right: scale * 7,
  zIndex: 12,
  // optioneel achtergrond of padding als je wilt dat 'ie beter afsteekt:
  // backgroundColor: "rgba(0,0,0,0.4)",
  // borderRadius: scale * 8,
  // padding: scale * 3,
},

profileRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between", // <-- BELANGRIJK!
  width: "100%",                   // <-- VOEG DEZE TOE!
  marginBottom: scale * 8,
},


profilePic: {
  width: scale * 23,
  height: scale * 23,
  borderRadius: scale * 14,
  marginRight: scale * 5,
  
 
},

profileUsername: {
  color: "#fff",
  fontFamily: "Manrope_700Bold",
  fontSize: scale * 12,
  
},


midoverlay: {
  position: "absolute",
  left: scale * 14,
  right: scale * 14,
  bottom: scale * 112, // net boven je tagsBar
  zIndex: 15,
  flexDirection: 'column',
  alignItems: 'flex-start',
},

waveForm: {
  marginLeft: "auto", // duwt de waveform helemaal rechts in de row
  alignSelf: "center",
},



tagsBar: {
  position: "absolute",
  left: scale * 14,      // zelfde padding als andere overlays
  right: scale * 14,
  bottom: scale * 70,    // nét boven je seekbar/controls, pas aan tot het mooi is
  flexDirection: "row",
  alignItems: "center",
  zIndex: 12,
},
artistTagsRow: {
  flexDirection: "row",
  alignItems: "center",
},
artistTagBubble: {
  zIndex: 10,
},
genreTagsRow: {
  flexDirection: "row",
  alignItems: "center",
  marginLeft: scale * 5,  // ruimte tussen artist en genre tags
},




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
  controlsContainer: {
    position: "absolute",
    bottom: scale * 30,
    left: scale * 10,
    right: scale * 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seekbarContainer: {
    width: scale * 200,
    right: scale * 10,

  },
  timeLabelCurrent: {
    width: scale * 40,
    alignItems: "center",
    right: scale * 5,
  },
  timeLabelRemaining: {
    width: scale * 40,
    alignItems: "center",
    left: scale * 40,
  },
  timeText: {
    color: "white",
    fontSize: scale * 10,
    fontFamily: "Manrope_400Regular", // of 'Manrope_700Bold'
  },
  collabButtonWrapper: {
  position: "absolute",
  left: 0,
  right: 0,
  top: scale * 575 - (scale * 25), // media hoogte min de helft van de knophoogte (stel knop is 50)
  alignItems: "center",
  zIndex: 20,
},

})

export default PostComponent
