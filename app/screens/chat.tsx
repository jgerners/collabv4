"use client"

// ChatScreen.tsx
import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
  Platform,
  StyleSheet,
  Animated,
  Image,
  type ViewToken,
  type ColorValue,
} from "react-native"
import { BlurView } from "expo-blur"
import { useRoute, useNavigation } from "@react-navigation/native"
import { useAuth } from "../../context/authContext"
import useChatMessages, { type ChatMessage } from "../../hooks/useChatMessages"
import { Feather, Ionicons } from "@expo/vector-icons"
import { format } from "date-fns"
import { LinearGradient } from "expo-linear-gradient"

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

// Define gradient colors - more subtle difference between blue and purple
const GRADIENT_COLORS = {
  START: "#4169E1" as ColorValue, // Royal Blue
  END: "#6A5ACD" as ColorValue, // Slate Blue (more subtle purple)
}

// Helper function to interpolate colors smoothly
const interpolateColor = (position: number) => {
  // Start with RGB values for the royal blue
  const startR = 65
  const startG = 105
  const startB = 225

  // End with RGB values for the slate blue (subtle purple)
  const endR = 106
  const endG = 90
  const endB = 205

  // Use cubic easing for smoother transition
  const easeInOut = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  }

  // Apply easing function for smooth transition
  const eased = easeInOut(position)

  // Interpolate between the colors
  const r = Math.round(startR + (endR - startR) * eased)
  const g = Math.round(startG + (endG - startG) * eased)
  const b = Math.round(startB + (endB - startB) * eased)

  return `rgb(${r}, ${g}, ${b})` as ColorValue
}

// Pre-calculate colors for all possible positions
const PRECALCULATED_COLORS: ColorValue[] = Array.from({ length: 101 }, (_, i) => {
  const position = i / 100
  return interpolateColor(position)
})

// MessageBubble component
interface MessageBubbleProps {
  message: ChatMessage
  isCurrentUser: boolean
  showAvatar: boolean
  gradientPosition?: number // 0 to 1, where 0 is newest (blue) and 1 is oldest (purple)
  absolutePosition?: number // Position in the entire list (0 to 1)
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isCurrentUser,
  showAvatar,
  gradientPosition = 0,
  absolutePosition = 0,
}) => {
  const slideAnim = useRef(new Animated.Value(20)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const getMessageStatus = () => {
    if (isCurrentUser) {
      // You can implement read receipts based on your app's logic
      return <Feather name="check-circle" size={12} color="#3b82f6" />
    }
    return null
  }

  // Format the timestamp from ISO string
  const formattedTime = format(new Date(message.created_at), "h:mm a")

  // Calculate gradient colors based on position
  const getGradientColors = () => {
    if (!isCurrentUser) {
      return undefined // Only apply gradient to current user's messages
    }

    // Use the absolute position first (based on position in entire list)
    // This ensures messages at the top are always purple, even during fast scrolling
    const position = absolutePosition

    // Get the color from our pre-calculated array for better performance
    const colorIndex = Math.min(Math.floor(position * 100), 100)
    const color = PRECALCULATED_COLORS[colorIndex]

    // Create a gradient from the interpolated color to a slightly lighter version of it
    // This creates a subtle gradient effect within each bubble
    return [color, color] as const
  }

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isCurrentUser ? styles.currentUserRow : styles.otherUserRow,
        {
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {showAvatar && !isCurrentUser ? (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
      ) : (
        <View style={styles.avatarPlaceholder} />
      )}

      <View>
        {isCurrentUser ? (
          <LinearGradient
            colors={getGradientColors() || [GRADIENT_COLORS.START, GRADIENT_COLORS.START]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.messageBubble, styles.currentUserBubble]}
          >
            <Text style={styles.currentUserText}>{message.message}</Text>
            <View style={styles.statusContainer}>{getMessageStatus()}</View>
          </LinearGradient>
        ) : (
          <View style={[styles.messageBubble, styles.otherUserBubble]}>
            <Text style={styles.otherUserText}>{message.message}</Text>
            <View style={styles.statusContainer}>{getMessageStatus()}</View>
          </View>
        )}

        <Text style={[styles.timestamp, isCurrentUser ? styles.timestampRight : styles.timestampLeft]}>
          {formattedTime}
        </Text>
      </View>
    </Animated.View>
  )
}

// TypingIndicator component
interface TypingIndicatorProps {
  name: string
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ name }) => {
  const [dotOneAnim] = useState(new Animated.Value(0))
  const [dotTwoAnim] = useState(new Animated.Value(0))
  const [dotThreeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: -5,
            duration: 300,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ).start()
    }

    animateDot(dotOneAnim, 0)
    animateDot(dotTwoAnim, 150)
    animateDot(dotThreeAnim, 300)

    return () => {
      dotOneAnim.stopAnimation()
      dotTwoAnim.stopAnimation()
      dotThreeAnim.stopAnimation()
    }
  }, [])

  return (
    <View style={styles.typingRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name.charAt(0)}</Text>
      </View>

      <View style={styles.typingBubble}>
        <View style={styles.typingDotsContainer}>
          {[dotOneAnim, dotTwoAnim, dotThreeAnim].map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.typingDot,
                {
                  transform: [{ translateY: anim }],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  )
}

// Interface for tracking visible messages
interface VisibleMessage {
  id: string
  index: number
}

const ChatScreen: React.FC = () => {
  const route = useRoute()
  const { chatId, profileName, profile_pic } = route.params as {
    chatId: string
    profileName: string
    profile_pic: string
  }

  const navigation = useNavigation()
  const { user } = useAuth()
  const currentUserId = user?.id || ""

  // Use the custom useChatMessages hook (with socket.io realtime)
  const { messages, loading, error, refetch, sendMessage } = useChatMessages(chatId)
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const flatListRef = useRef<FlatList<ChatMessage>>(null)

  // Track if we should scroll to bottom (only for new messages)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false)

  // Add this with the other state variables
  const [isAtBottom, setIsAtBottom] = useState(true)

  // Track visible messages for gradient calculation
  const [visibleUserMessages, setVisibleUserMessages] = useState<VisibleMessage[]>([])

  // Track all user messages for absolute position calculation
  const [userMessageIndices, setUserMessageIndices] = useState<number[]>([])

  // Prepare the reversed messages list
  const reversedMessages = useMemo(() => {
    if (!messages || messages.length === 0) return []

    // First sort by timestamp
    const sorted = [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    // Then reverse for the inverted list
    return [...sorted].reverse()
  }, [messages])

  // Update user message indices when messages change
  useEffect(() => {
    if (reversedMessages.length > 0) {
      const indices = reversedMessages
        .map((msg, index) => (msg.sender_id === currentUserId ? index : -1))
        .filter((index) => index !== -1)
      setUserMessageIndices(indices)
    }
  }, [reversedMessages, currentUserId])

  const slideAnim = useRef(new Animated.Value(100)).current
  const keyboardAnim = useRef(new Animated.Value(0)).current
  const combinedTranslate = Animated.add(slideAnim, keyboardAnim)

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [slideAnim])

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        const offset = e.endCoordinates.height - 25
        Animated.timing(keyboardAnim, {
          toValue: -offset,
          duration: e.duration || 300,
          useNativeDriver: true,
        }).start()

        // When keyboard shows, we should scroll to bottom
        setShouldScrollToBottom(true)
      },
    )
    const keyboardHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (e) => {
        Animated.timing(keyboardAnim, {
          toValue: 0,
          duration: e?.duration || 300,
          useNativeDriver: true,
        }).start()
      },
    )
    return () => {
      keyboardShowListener.remove()
      keyboardHideListener.remove()
    }
  }, [keyboardAnim])

  const handleSend = async () => {
    if (inputText.trim().length === 0) return
    console.log("[ChatScreen] Sending message:", inputText)

    // Set flag to scroll to bottom after sending
    setShouldScrollToBottom(true)

    const response = await sendMessage({
      sender_id: currentUserId,
      message: inputText,
    })
    if (response.error) {
      console.error("[ChatScreen] Error sending message:", response.error)
      return
    }
    console.log("[ChatScreen] Message sent, response:", response.data)
    setInputText("")
  }

  // Handle scrolling when needed (for new messages)
  useEffect(() => {
    if (shouldScrollToBottom) {
      // With inverted list, scrolling to bottom means scrolling to offset 0
      flatListRef.current?.scrollToOffset({
        offset: 0,
        animated: true,
      })

      // Reset the flag
      setShouldScrollToBottom(false)
    }
  }, [shouldScrollToBottom, reversedMessages])

  // Add this function to the component
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y

    // For inverted lists, we're at the "bottom" (most recent messages)
    // when the offset is close to 0
    const isBottom = offsetY < 20
    setIsAtBottom(isBottom)
  }

  // Track which items are visible for gradient calculation
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    // Filter to only include user's messages
    const userMessages = viewableItems
      .filter((item) => {
        const message = item.item as ChatMessage
        return message.sender_id === currentUserId
      })
      .map((item) => ({
        id: (item.item as ChatMessage).id,
        index: item.index as number,
      }))
      .filter((item): item is VisibleMessage => item.index !== null)

    // Sort by index (for inverted list, lower index = newer message)
    userMessages.sort((a, b) => a.index - b.index)

    setVisibleUserMessages(userMessages)
  }).current

  // Calculate absolute position for each message (0 = newest/bottom, 1 = oldest/top)
  const getAbsolutePosition = (index: number) => {
    if (!userMessageIndices.length) return 0

    // Find the position of this message among all user messages
    const userMsgIndex = userMessageIndices.indexOf(index)

    // If not found, return default
    if (userMsgIndex === -1) return 0

    // Calculate position (0 = newest, 1 = oldest)
    return userMsgIndex / (userMessageIndices.length - 1 || 1)
  }

  // Calculate gradient position for visible messages
  const getVisibleGradientPosition = (index: number) => {
    // If no user messages are visible, use default color
    if (visibleUserMessages.length <= 1) return 0

    // Find this message in the visible user messages
    const messageIndex = visibleUserMessages.findIndex((msg) => msg.index === index)

    // If not found in visible messages, return default
    if (messageIndex === -1) return 0

    // Calculate position based on the message's index among visible user messages
    // For inverted list: 0 is the newest (bottom), 1 is the oldest (top)
    return messageIndex / (visibleUserMessages.length - 1)
  }

  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isCurrentUser = item.sender_id === currentUserId

    // For inverted lists, we need to check the next message (which is actually previous in time)
    const showAvatar =
      index === reversedMessages.length - 1 || reversedMessages[index + 1]?.sender_id !== item.sender_id

    // Calculate positions
    const absolutePosition = isCurrentUser ? getAbsolutePosition(index) : 0
    const visiblePosition = isCurrentUser ? getVisibleGradientPosition(index) : 0

    return (
      <MessageBubble
        message={item}
        isCurrentUser={isCurrentUser}
        showAvatar={showAvatar}
        gradientPosition={visiblePosition}
        absolutePosition={absolutePosition}
      />
    )
  }

  // Function to scroll to bottom when user taps a button
  const scrollToBottomManually = () => {
    // With inverted list, scrolling to bottom means scrolling to offset 0
    flatListRef.current?.scrollToOffset({
      offset: 0,
      animated: true,
    })
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#e5e7eb" />
        </TouchableOpacity>

        <Image source={{ uri: profile_pic }} style={styles.avatar} />

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{profileName}</Text>
          <Text style={styles.headerStatus}>Active now</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="phone" size={20} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="video" size={20} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="info" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <Animated.View style={[styles.container, { transform: [{ translateY: combinedTranslate }] }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error loading messages</Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={reversedMessages}
              inverted={true}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              windowSize={21} // Increased to track more items
              onScroll={handleScroll}
              scrollEventThrottle={8} // Even more frequent updates for smoother gradient changes
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{
                itemVisiblePercentThreshold: 20, // More sensitive
                minimumViewTime: 10, // Even more responsive
              }}
              // IMPORTANT: Remove any auto-scrolling behaviors
              maintainVisibleContentPosition={null}
              // IMPORTANT: Don't update scroll position on content size change
              // IMPORTANT: Don't update scroll position on layout
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No messages yet</Text>
                  <Text style={styles.emptySubtext}>Start the conversation!</Text>
                </View>
              }
              ListFooterComponent={isTyping ? <TypingIndicator name={profileName} /> : null}
            />

            {/* Scroll to bottom button - only visible when not at the bottom */}
            {reversedMessages.length > 10 && !isAtBottom && (
              <TouchableOpacity style={styles.scrollToBottomButton} onPress={scrollToBottomManually}>
                <Feather name="chevron-down" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Input area */}
        <AnimatedBlurView intensity={80} tint="dark" style={styles.inputOverlay}>
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="smile" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Message..."
                placeholderTextColor="#9ca3af"
                multiline
              />
              <View style={styles.inputActions}>
                <TouchableOpacity style={styles.inputActionButton}>
                  <Feather name="image" size={20} color="#9ca3af" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.inputActionButton}>
                  <Feather name="heart" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>

            {inputText.trim() === "" ? (
              <TouchableOpacity style={styles.iconButton}>
                <Feather name="mic" size={24} color="#9ca3af" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            )}
          </View>
        </AnimatedBlurView>
      </Animated.View>
    </SafeAreaView>
  )
}

export default ChatScreen

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000", // Changed to black
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222222",
    backgroundColor: "#111111", // Darker header
  },
  headerButton: {
    padding: 8,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 16,
    backgroundColor: "#4b5563",
    marginRight: 10,
    transform: [{ translateY: -20 }], // Negative value moves it left (closer to right edge)
  },
  avatarText: {
    color: "#f9fafb",
    fontWeight: "bold",
    textAlign: "center",
  },
  avatarPlaceholder: {
    width: 10,
    height: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: "#f9fafb",
    fontWeight: "600",
    fontSize: 14,
  },
  headerStatus: {
    color: "#9ca3af",
    fontSize: 12,
  },
  headerActions: {
    flexDirection: "row",
  },
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#000000", // Changed to black
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingTop: 50,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    maxWidth: "80%",
    marginBottom: 12,
  },
  currentUserRow: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  otherUserRow: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 2,
    maxWidth: "100%",
  },
  currentUserBubble: {
    borderBottomRightRadius: 4,
    transform: [{ translateX: 8 }], // Negative value moves it left (closer to right edge)
  },
  otherUserBubble: {
    backgroundColor: "#252525", // Your dark gray color
    borderBottomLeftRadius: 4,
    transform: [{ translateX: 0 }], // Negative value moves it left (closer to right edge)
  },
  currentUserText: {
    color: "#ffffff",
  },
  otherUserText: {
    color: "#f9fafb",
  },
  statusContainer: {
    position: "absolute",
    bottom: 4,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  timestamp: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 2,
  },
  timestampRight: {
    textAlign: "right",
    marginRight: 0,
  },
  timestampLeft: {
    marginLeft: 0,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 8,
  },
  typingBubble: {
    backgroundColor: "#252525",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 12,
  },
  typingDotsContainer: {
    flexDirection: "row",
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    height: 16,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#9ca3af",
    marginHorizontal: 2,
  },
  inputOverlay: {
    position: "absolute",
    left: "4%",
    right: "4%",
    bottom: 5,
    borderRadius: 25,
    overflow: "hidden",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderColor: "rgba(76, 76, 76, 0.19)",
    backgroundColor: "rgba(12, 12, 12, 0.43)",
    borderRadius: 25,
    borderWidth: 1,
    width: "100%",
    height: 50,
    alignSelf: "center",
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  textInputContainer: {
    flex: 1,
    position: "relative",
    marginHorizontal: 8,
  },
  textInput: {
    backgroundColor: "rgba(12, 12, 12, 0.05)",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
    color: "white",
    fontSize: 14,
    paddingRight: 80,
  },
  inputActions: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: [{ translateY: -12 }],
    flexDirection: "row",
  },
  inputActionButton: {
    padding: 4,
    marginLeft: 8,
  },
  sendButton: {
    backgroundColor: "#4169E1", // Changed to match the new blue gradient color
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#9ca3af",
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#ef4444",
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#6b7280",
    marginTop: 8,
  },
  scrollToBottomButton: {
    position: "absolute",
    right: 16,
    bottom: 80,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6A5ACD",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
})
