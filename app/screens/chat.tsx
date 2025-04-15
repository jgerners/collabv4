// ChatScreen.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
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
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/authContext";
import { BlurView } from "expo-blur";
import useChatMessages, { ChatMessage } from "../../hooks/useChatMessages";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface AnimatedMessageProps {
  message: string;
  isCurrentUser: boolean;
}

const AnimatedMessage: React.FC<AnimatedMessageProps> = ({ message, isCurrentUser }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          marginVertical: 5,
          paddingVertical: 12,
          paddingHorizontal: 15,
          borderRadius: 20,
          maxWidth: "75%",
          backgroundColor: isCurrentUser ? "#8A2BE2" : "#252525",
          alignSelf: isCurrentUser ? "flex-end" : "flex-start",
        },
      ]}
    >
      <Text style={styles.messageText}>{message}</Text>
    </Animated.View>
  );
};

const ChatScreen: React.FC = () => {
  const route = useRoute();
  const { chatId, profileName, profile_pic } = route.params as {
    chatId: string;
    profileName: string;
    profile_pic: string;
  };

  const navigation = useNavigation();
  const { user } = useAuth();
  const currentUserId = user?.id || "";

  // Gebruik de aangepaste useChatMessages-hook (met socket.io realtime)
  const { messages, loading, error, refetch, sendMessage } = useChatMessages(chatId);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // Scroll-gerelateerde variabelen
  const [containerHeight, setContainerHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const safeMargin = 50;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const keyboardAnim = useRef(new Animated.Value(0)).current;
  const combinedTranslate = Animated.add(slideAnim, keyboardAnim);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        const offset = e.endCoordinates.height - 25;
        Animated.timing(keyboardAnim, {
          toValue: -offset,
          duration: e.duration || 300,
          useNativeDriver: true,
        }).start();
      }
    );
    const keyboardHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (e) => {
        Animated.timing(keyboardAnim, {
          toValue: 0,
          duration: e?.duration || 300,
          useNativeDriver: true,
        }).start();
      }
    );
    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [keyboardAnim]);

  const handleSend = async () => {
    if (inputText.trim().length === 0) return;
    console.log("[ChatScreen] Verzend bericht:", inputText);
    const response = await sendMessage({
      sender_id: currentUserId,
      message: inputText,
    });
    if (response.error) {
      console.error("[ChatScreen] Fout bij versturen bericht:", response.error);
      return;
    }
    console.log("[ChatScreen] Bericht verzonden, reactie:", response.data);
    setInputText("");
  };

  const sortedMessages = useMemo(() => {
    console.log("[ChatScreen] Sorting messages, aantal berichten:", messages.length);
    return [...messages].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [messages]);

  useEffect(() => {
    if (containerHeight === 0 || contentHeight === 0) return;
    const targetOffset = contentHeight - containerHeight - safeMargin;
    console.log("[ChatScreen] Auto scroll (zonder animatie) naar offset:", targetOffset);
    flatListRef.current?.scrollToOffset({ offset: targetOffset, animated: false });
  }, [sortedMessages, containerHeight, contentHeight]);

  const handleContentSizeChange = (width: number, height: number) => {
    console.log("[ChatScreen] ContentSizeChange: height =", height);
    setContentHeight(height);
  };

  const handleContainerLayout = (event: any) => {
    console.log("[ChatScreen] Container layout:", event.nativeEvent.layout);
    setContainerHeight(event.nativeEvent.layout.height);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isCurrentUser = item.sender_id === currentUserId;
    console.log("[ChatScreen] Render item:", item.id, "isCurrentUser:", isCurrentUser);
    return <AnimatedMessage message={item.message} isCurrentUser={isCurrentUser} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Image source={{ uri: profile_pic }} style={styles.profilePic} />
        <Text style={styles.headerText}>{profileName}</Text>
      </View>

      <Animated.View
        style={[styles.container, { transform: [{ translateY: combinedTranslate }] }]}
        onLayout={handleContainerLayout}
      >
        <FlatList
          ref={flatListRef}
          key={`flatlist-${sortedMessages.length}`}
          data={sortedMessages}
          extraData={sortedMessages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.messagesContainer, { paddingBottom: 100 }]}
          style={styles.flatList}
          onContentSizeChange={handleContentSizeChange}
        />
        <AnimatedBlurView intensity={80} tint="dark" style={styles.inputOverlay}>
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="musical-notes-outline" size={20} color="#A0A0A0" />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#A0A0A0"
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendButtonBubble}>
              <View style={styles.sendButtonContainer}>
                <Icon name="send" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </AnimatedBlurView>
      </Animated.View>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#121212",
  },
  backButton: {
    marginRight: 10,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  container: {
    flex: 1,
    position: "relative",
  },
  messagesContainer: {
    flexGrow: 1,
    justifyContent: "flex-end",
    padding: 16,
  },
  flatList: {
    flex: 1,
  },
  messageText: {
    fontSize: 16,
    color: "white",
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
  textInput: {
    flex: 1,
    height: 30,
    backgroundColor: "rgba(12, 12, 12, 0.05)",
    borderRadius: 25,
    paddingHorizontal: 15,
    color: "white",
    fontSize: 14,
  },
  iconButton: {
    marginRight: 10,
  },
  sendButtonBubble: {
    marginLeft: 10,
    backgroundColor: "#8A2BE2",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    width: 60,
  },
  sendButtonContainer: {
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },
});
