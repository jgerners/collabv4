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


// 1. Definieer het type voor jouw navigator
export type RootStackParamList = {
  ChatList: undefined;
  Chat: { chatId: string };
  Profile: { userId: string };  // ✅ Nodig voor navigatie naar een profiel
  Requests: undefined; // ✅ Nodig voor de requests-tab
};

// 2. Specificeer het navigatietype voor dit scherm
type ChatListScreenNavigationProp = StackNavigationProp<RootStackParamList, "ChatList">;

// 3. Definieer de interfaces voor chat- en like-items
interface Chat {
  id: string;
  userName: string;
  userProfile: string | number;
  lastMessage: string;
  timestamp: number;
  unreadCount?: number;
}

interface Like {
  id: string;
  userName: string;
  userProfile: string | number;
  postImage: string | number;
  timestamp: number;
}

// ✅ Dummy data (vervang dit later met data uit de backend)
const dummyChats: Chat[] = [
  { id: "1", userName: "Bruno Mars", userProfile: require("../../assets/dummy/profile/dua_profile.png"), lastMessage: "Let's try some extra bass!", timestamp: Date.now() - 60000, unreadCount: 1 },
  { id: "2", userName: "Dua Lipa", userProfile: require("../../assets/dummy/profile/dua_profile.png"), lastMessage: "When do you think you can send over?", timestamp: Date.now() - 120000, unreadCount: 1 },
  { id: "3", userName: "Tate Mcrae", userProfile: require("../../assets/dummy/profile/dua_profile.png"), lastMessage: "That sounds so fire!!! 🔥", timestamp: Date.now() - 86400000, unreadCount: 0 },
  { id: "4", userName: "Justin Bieber", userProfile: require("../../assets/dummy/profile/dua_profile.png"), lastMessage: "Could you try to add some electric guitar?", timestamp: Date.now() - 3 * 86400000, unreadCount: 0 },
  { id: "5", userName: "The Weeknd", userProfile: require("../../assets/dummy/profile/dua_profile.png"), lastMessage: "Man, you're so dope...", timestamp: Date.now() - 5 * 86400000, unreadCount: 0 },
];

const dummyLikes: Like[] = [
  { id: "1", userName: "Skipvdv", userProfile: require("../../assets/dummy/profile/dua_profile.png"), postImage: require("../../assets/dummy/profile/dua_profile.png"), timestamp: Date.now() - 180000 },
  { id: "2", userName: "Dua Lipa", userProfile: require("../../assets/dummy/profile/dua_profile.png"), postImage: require("../../assets/dummy/profile/dua_profile.png"), timestamp: Date.now() - 300000 },
];

const ChatsListScreen: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  // We houden nu de actieve tab bij als 'Likes' | 'Chats' | 'Requests'
  // De volgorde komt overeen met de volgorde in de tab selector en scroll view.
  const [activeTab, setActiveTab] = useState<'Likes' | 'Chats' | 'Requests'>('Chats');
  const navigation = useNavigation<ChatListScreenNavigationProp>();

  // Bepaal de schermbreedte voor de paginaviews
  const windowWidth = Dimensions.get("window").width;
  // Maak een array met de tabs in volgorde
  const tabOrder: ('Likes' | 'Chats' | 'Requests')[] = ['Likes', 'Chats', 'Requests'];
  // Ref voor de ScrollView zodat we programmeerbaar kunnen scrollen
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      setChats(dummyChats);
      setLikes(dummyLikes);
      setLoading(false);
    }, 1000);
  }, []);

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

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity style={styles.chatItem} onPress={() => navigation.navigate("Chat", { chatId: item.id })}>
      <Image source={typeof item.userProfile === "string" ? { uri: item.userProfile } : item.userProfile} style={styles.profileImage} />
      <View style={styles.chatDetails}>
        <View style={styles.chatHeader}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderLikeItem = ({ item }: { item: Like }) => (
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

  // Update activeTab als er wordt geswiped
  const handleMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
    const newTab = tabOrder[newIndex];
    setActiveTab(newTab);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#A020F0" style={styles.loader} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Tab selector */}
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

      {/* Horizontale scroll view voor swipe navigatie */}
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
        {/* Pagina voor Chats */}
 <View style={{ width: windowWidth, padding: 16 }}>
          <FlatList data={chats} renderItem={renderChatItem} keyExtractor={(item) => item.id} />
        </View>
       {/* Pagina voor Requests */}
<View style={{ width: windowWidth, padding: 16 }}>
  <Requests/>
</View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default ChatsListScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#121212" },
  loader: { marginTop: 150 },
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
  placeholderText: { color: "#A0A0A0", textAlign: "center", marginTop: 20, fontSize: 16 },
});
