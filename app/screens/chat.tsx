// ChatScreen.tsx
import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
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
  StatusBar
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/authContext";
import { BlurView } from "expo-blur";
import useChatMessages, { ChatMessage } from "../../hooks/useChatMessages";
import useChatParticipants from "../../hooks/useChatParticipants";
import { ChatHeader } from "../../components/headers/chatHeader";

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
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
        marginVertical: 5,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        maxWidth: "75%",
        backgroundColor: isCurrentUser ? "#8A2BE2" : "#252525",
        alignSelf: isCurrentUser ? "flex-end" : "flex-start",
      }}
    >
      <Text style={styles.messageText}>{message}</Text>
    </Animated.View>
  );
};

const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { chatId } = route.params as { chatId: string };
  const { user } = useAuth();
  const currentUserId = user?.id || "";

  // fetch chat partner (the other user)
  const partner = useChatParticipants(chatId, currentUserId);

  // update header once partner is available
  useLayoutEffect(() => {
    if (!partner) return;
    navigation.setOptions({
      header: () => (
        <ChatHeader
          profileName={partner.username}
          profilePic={partner.profile_pic}
          onBack={() => navigation.goBack()}
        />
      ),
    });
  }, [navigation, partner]);

  const { messages, sendMessage } = useChatMessages(chatId);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const slideAnim = useRef(new Animated.Value(100)).current;
  const keyboardAnim = useRef(new Animated.Value(0)).current;
  const combinedTranslate = Animated.add(slideAnim, keyboardAnim);

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  }, [slideAnim]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subShow = Keyboard.addListener(showEvent, (e) => {
      const offset = e.endCoordinates.height - 25;
      Animated.timing(keyboardAnim, {
        toValue: -offset,
        duration: e.duration || 300,
        useNativeDriver: true,
      }).start();
    });
    const subHide = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    });
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [keyboardAnim]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const resp = await sendMessage({ sender_id: currentUserId, message: inputText });
    if (!resp.error) setInputText("");
  };

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [messages]
  );

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>      
      <View style={{ flex: 1 }}>
        <Animated.View style={[styles.container, { transform: [{ translateY: combinedTranslate }] }]}>        
          <FlatList
            ref={flatListRef}
            data={[...sortedMessages].reverse()}
            renderItem={({ item }) => <AnimatedMessage message={item.message} isCurrentUser={item.sender_id === currentUserId} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.contentContainer}
            style={{ flex: 1 }}
            inverted
            initialNumToRender={1000}
            maxToRenderPerBatch={1000}
            windowSize={21}
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
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#121212" },
  container: { flex: 1, position: "relative" },
  contentContainer: { paddingTop: 60, paddingBottom: 90, paddingHorizontal: 10 },
  messageText: { fontSize: 16, color: "white" },
  inputOverlay: { position: "absolute", left: "2%", right: "2%", bottom: 5, borderRadius: 25, overflow: "hidden" },
  inputBar: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: 1, borderColor: "rgba(76,76,76,0.19)", backgroundColor: "rgba(12,12,12,0.43)", borderRadius: 25, borderWidth: 1, width: "100%", height: 50, alignSelf: "center" },
  textInput: { flex: 1, height: 30, backgroundColor: "rgba(12,12,12,0.05)", borderRadius: 25, paddingHorizontal: 15, color: "white", fontSize: 14 },
  iconButton: { marginRight: 10 },
  sendButtonBubble: { marginLeft: 10, backgroundColor: "#8A2BE2", borderRadius: 25, justifyContent: "center", alignItems: "center", width: 60 },
  sendButtonContainer: { padding: 5, justifyContent: "center", alignItems: "center" }
});
