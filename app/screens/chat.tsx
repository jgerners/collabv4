// ChatScreen.tsx
import React, { useState, useRef } from "react";
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

// Hoogtes die invloed hebben op je layout (pas deze indien nodig aan)
const HEADER_HEIGHT = 110;
const TABBAR_HEIGHT = 80;

// Interface voor berichten
interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
}



const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "That sounds so fire!!! 🔥",
      sender: "other",
      timestamp: Date.now() - 60000,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (inputText.trim().length === 0) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "me",
      timestamp: Date.now(),
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputText("");

    // Scroll naar beneden zodat het nieuwe bericht zichtbaar is
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isCurrentUser = item.sender === "me";
    return (
      <View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
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
    // Deze marges zorgen ervoor dat de inhoud niet achter de header of tabbar valt
    marginTop: HEADER_HEIGHT - 60,
  
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
