import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Requests from "../../components/requests";
import { useAuth } from "../../context/authContext";

// 1. Definieer het type voor jouw navigator
export type RootStackParamList = {
  ChatList: undefined;
  Chat: { chatId: string };
  Profile: { userId: string };
  Requests: undefined;
};

// 2. Specificeer het navigatietype voor dit scherm
type ChatListScreenNavigationProp = StackNavigationProp<RootStackParamList, "ChatList">;

// 3. Definieer de interface voor chat-items
// Deze interface kan worden aangepast naar wat je in de useChats-hook retourneert.
export interface Chat {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  // Voeg eventueel extra velden toe (zoals de naam en profielfoto van de 'ander')
  // Als je deze informatie niet direct in de "chats" tabel hebt opgeslagen, kun je deze later
  // via een JOIN of een aparte API-call ophalen.
}

// Gebruik de useChats-hook in plaats van dummyChats
import { useChats } from "../../hooks/useChats";

// Dummy data voor Likes, voor nu
const dummyLikes = [
  { id: "1", userName: "Skipvdv", userProfile: require("../../assets/dummy/profile/dua_profile.png"), postImage: require("../../assets/dummy/profile/dua_profile.png"), timestamp: Date.now() - 180000 },
  { id: "2", userName: "Dua Lipa", userProfile: require("../../assets/dummy/profile/dua_profile.png"), postImage: require("../../assets/dummy/profile/dua_profile.png"), timestamp: Date.now() - 300000 },
];

const ChatsListScreen: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.id || "";
  const { chats, loading: chatsLoading, error: chatsError } = useChats(currentUserId);
  const [likes, setLikes] = useState(dummyLikes);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'Likes' | 'Chats' | 'Requests'>('Chats');
  const navigation = useNavigation<ChatListScreenNavigationProp>();

  const windowWidth = Dimensions.get("window").width;
  const tabOrder: ('Likes' | 'Chats' | 'Requests')[] = ['Likes', 'Chats', 'Requests'];
  const scrollViewRef = useRef<ScrollView>(null);

  // Zorg dat de ScrollView op de juiste pagina start (standaard 'Chats' = index 1)
  useEffect(() => {
    const initialIndex = tabOrder.indexOf(activeTab);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: initialIndex * windowWidth, animated: false });
    }
  }, []);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Voor Chats gebruiken we nu de data uit useChats
  const renderChatItem = ({ item }: { item: Chat }) => {
    // Bepaal wie de 'ander' is
    const otherUserId = item.user_a === currentUserId ? item.user_b : item.user_a;

    // Placeholder: Je zou hier extra informatie (naam, profielfoto) van de 'ander' willen tonen.
    return (
      <TouchableOpacity style={styles.chatItem} onPress={() => navigation.navigate("Chat", { chatId: item.id })}>
        <Image source={{ uri: "https://via.placeholder.com/50" }} style={styles.profileImage} />
        <View style={styles.chatDetails}>
          <View style={styles.chatHeader}>
            <Text style={styles.userName}>Chat with {otherUserId}</Text>
            {/* Voor nu gebruiken we de timestamp als placeholder */}
            <Text style={styles.timestamp}>{formatTime(new Date(item.created_at).getTime())}</Text>
          </View>
          {/* Placeholder voor de laatste boodschap */}
          <Text style={styles.lastMessage}>Last message...</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLikeItem = ({ item }: { item: any }) => (
    <View style={styles.likeItem}>
      <Image
        source={typeof item.userProfile === "string" ? { uri: item.userProfile } : item.userProfile}
        style={styles.profileImage}
      />
      <Text style={styles.likeText}>
        <Text style={{ fontWeight: 'bold' }}>{item.userName}</Text> liked your post
      </Text>
      <Image
        source={typeof item.postImage === "string" ? { uri: item.postImage } : item.postImage}
        style={styles.postImage}
      />
    </View>
  );

  const handleMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
    const newTab = tabOrder[newIndex];
    setActiveTab(newTab);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.tabSelector}>
        {tabOrder.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
            onPress={() => {
              setActiveTab(tab);
              scrollViewRef.current?.scrollTo({ x: tabOrder.indexOf(tab) * windowWidth, animated: true });
            }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        ref={scrollViewRef}
        contentOffset={{ x: windowWidth, y: 0 }}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {/* Pagina voor Likes */}
        <View style={{ width: windowWidth, padding: 16 }}>
          <FlatList data={likes} renderItem={renderLikeItem} keyExtractor={(item) => item.id} />
        </View>
        {/* Pagina voor Chats (gebruik useChats data) */}
        <View style={{ width: windowWidth, padding: 16 }}>
          {chatsLoading ? (
            <ActivityIndicator size="large" color="#A020F0" />
          ) : chatsError ? (
            <Text style={styles.emptyText}>Error: {chatsError}</Text>
          ) : chats.length === 0 ? (
            <Text style={styles.emptyText}>No chats yet.</Text>
          ) : (
            <FlatList data={chats} renderItem={renderChatItem} keyExtractor={(item) => item.id} />
          )}
        </View>
        {/* Pagina voor Requests */}
        <View style={{ width: windowWidth, padding: 16 }}>
          <Requests />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChatsListScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#121212" },
  tabSelector: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    backgroundColor: "#1E1E1E",
    paddingVertical: 10,
    borderRadius: 10,
    margin: 16,
    marginTop: 70,
  },
  tabButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  activeTab: { backgroundColor: "#A020F0" },
  tabText: { color: "#B0B0B0", fontWeight: "bold" },
  activeTabText: { color: "#FFF" },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  profileImage: { width: 50, height: 50, borderRadius: 25 },
  chatDetails: { flex: 1, marginLeft: 12 },
  chatHeader: { flexDirection: "row", justifyContent: "space-between" },
  userName: { fontSize: 16, fontWeight: "bold", color: "#FFF" },
  timestamp: { fontSize: 12, color: "#A0A0A0" },
  lastMessage: { fontSize: 14, color: "#A0A0A0" },
  likeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  likeText: { flex: 1, color: "#FFF", fontSize: 14, marginLeft: 10 },
  postImage: { width: 40, height: 40, borderRadius: 8, marginLeft: 10 },
  emptyText: { 
    color: "#A0A0A0", 
    textAlign: "center", 
    marginTop: 20, 
    fontSize: 16 
  },
});
