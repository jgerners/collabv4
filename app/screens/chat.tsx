import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useRoute } from "@react-navigation/native";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/authContext";

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

const ChatScreen: React.FC = () => {
  const route = useRoute();
  const { chatId } = route.params as { chatId: string };
  const { user } = useAuth();
  const currentUserId = user?.id || "";
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Functie om berichten op te halen
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

  // Realtime abonnement: Luister naar INSERTs in chat_messages voor dit chatId
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
          console.log("Realtime insert payload:", payload);
          setMessages((prevMessages) => [...prevMessages, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [chatId]);

  const handleSend = async () => {
    if (inputText.trim().length === 0) return;

    // Verstuur bericht naar de database
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

    // Fallback: haal de berichten opnieuw op zodat de UI direct up-to-date is
    fetchMessages();

    // Scroll naar beneden zodat het nieuwe bericht zichtbaar is
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            style={styles.flatList}
          />
          {/* Invoerbalk */}
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="musical-notes-outline" size={22} color="#A0A0A0" />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#A0A0A0"
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
              <Icon name="send" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  container: {
    flex: 1,
    marginTop: 50, // Pas aan indien nodig
  },
  keyboardAvoid: {
    flex: 1,
  },
  flatList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
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
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#1A1A1A",
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#333",
    borderRadius: 25,
    paddingHorizontal: 15,
    color: "white",
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#8A2BE2",
    borderRadius: 50,
    padding: 10,
  },
  iconButton: {
    marginRight: 10,
    padding: 8,
  },
});
