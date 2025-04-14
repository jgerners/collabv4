import React, { useState, useEffect, useRef } from "react";
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
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/authContext";
import { BlurView } from "expo-blur";

// Maak een Animated variant van de BlurView
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

const ChatScreen: React.FC = () => {
  const route = useRoute();
  // Verwacht dat via route.params ook de profieldata wordt meegegeven
  const { chatId, profileName, profile_pic } = route.params as {
    chatId: string;
    profileName: string;
    profile_pic: string;
  };
  const navigation = useNavigation();
  const { user } = useAuth();
  const currentUserId = user?.id || "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");

  const flatListRef = useRef<FlatList>(null);

  // Deze animated value voor de mount-animatie
  const slideAnim = useRef(new Animated.Value(100)).current;
  // Deze animated value past de positie van de hele container aan bij toetsenbord-events
  const keyboardAnim = useRef(new Animated.Value(0)).current;
  // Combineer de twee animaties zodat ze samen de container transformeren.
  const combinedTranslate = Animated.add(slideAnim, keyboardAnim);

  // Haal berichten op
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Error fetching messages:", error);
    } else if (data) {
      setMessages(data as Message[]);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [chatId]);

  // Realtime abonnement voor nieuwe berichten
  useEffect(() => {
    const subscription = supabase
      .channel("chat_messages_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_id=eq.'${chatId}'`,
        },
        (payload: any) => {
          setMessages((prevMessages) => [...prevMessages, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [chatId]);

  // Voer de slide-in animatie uit bij het mounten
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  // Luister naar toetsenbord events en update keyboardAnim voor de gehele container
  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        // We trekken een kleine marge (bijv. 25px) af voor een nette speling
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

    const { error } = await supabase
      .from("chat_messages")
      .insert([
        {
          chat_id: chatId,
          sender_id: currentUserId,
          message: inputText,
          created_at: new Date().toISOString(),
        },
      ])
      .select("*");

    if (error) {
      console.error("Error sending message:", error);
      return;
    }
    setInputText("");
    fetchMessages();
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isCurrentUser = item.sender_id === currentUserId;
    return (
      <View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
        ]}
      >
        <Text style={styles.messageText}>{item.message}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Custom header */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Image
          source={{ uri: profile_pic }}
          style={styles.profilePic}
        />
        <Text style={styles.headerText}>{profileName}</Text>
      </View>

      {/* De Animated.View omvat zowel FlatList als invoerbalk, samen verplaatst */}
      <Animated.View style={[styles.container, { transform: [{ translateY: combinedTranslate }] }]}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.messagesContainer, { paddingBottom: 100 }]}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />
        {/* Invoerbalk: absolute gepositioneerd */}
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
  messageBubble: {
    marginVertical: 5,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 20,
    maxWidth: "75%",
  },
  currentUserBubble: {
    backgroundColor: "#8A2BE2",
    alignSelf: "flex-end",
  },
  otherUserBubble: {
    backgroundColor: "#252525",
    alignSelf: "flex-start",
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
