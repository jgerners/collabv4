// ChatsListScreen.tsx
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
import { useProfiles } from "../../hooks/useProfiles";
import { useLikes, Like } from "../../hooks/useLikes";
import { useFollows, FollowNotification } from "../../hooks/useFollows";

// 1. Definieer het type voor jouw navigator
export type RootStackParamList = {
  ChatList: undefined;
  Chat: { chatId: string };
  Profile: { userId: string };
  Requests: undefined;
};

// 2. Specificeer het navigatietype voor dit scherm
type ChatListScreenNavigationProp = StackNavigationProp<RootStackParamList, "ChatList">;

// 3. Definieer de interface voor chat-items (ongewijzigd)
export interface Chat {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
};

// Gebruik de useChats-hook in plaats van dummyChats
import { useChats } from "../../hooks/useChats";

// We definiëren een union type voor notificaties
type NotificationItem = 
  | (Like & { type: "like" })
  | (FollowNotification & { type: "follow" });

const ChatsListScreen: React.FC = () => {
  const { user } = useAuth();
  const { profiles, loading: profilesLoading, error: profilesError } = useProfiles();
  const currentUserId = user?.id || "";
  const { chats, loading: chatsLoading, error: chatsError } = useChats(currentUserId);
  const { likes, loading: likesLoading, error: likesError } = useLikes(currentUserId);
  const { follows, loading: followsLoading, error: followsError } = useFollows(currentUserId);
  // We gebruiken nu drie tabs: Notificaties (gecombineerd likes en follows), Chats en Requests.
  const [activeTab, setActiveTab] = useState<'Notifications' | 'Chats' | 'Requests'>('Chats');
  const navigation = useNavigation<ChatListScreenNavigationProp>();

  const windowWidth = Dimensions.get("window").width;
  const tabOrder: ('Notifications' | 'Chats' | 'Requests')[] = ['Notifications', 'Chats', 'Requests'];
  const scrollViewRef = useRef<ScrollView>(null);

  // Zorg dat de ScrollView op de juiste pagina start
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

  // Render Chat-item (ongewijzigd)
  const renderChatItem = ({ item }: { item: Chat }) => {
    const otherUserId = item.user_a === currentUserId ? item.user_b : item.user_a;
    const otherProfile = profiles.find((p) => p.id === otherUserId);

    return (
      <TouchableOpacity style={styles.chatItem} onPress={() => navigation.navigate("Chat", { chatId: item.id })}>
        <Image source={{ uri: otherProfile?.profile_pic }} style={styles.profileImage} />
        <View style={styles.chatDetails}>
          <View style={styles.chatHeader}>
            <Text style={styles.userName}>{otherProfile?.username || otherUserId}</Text>
            <Text style={styles.timestamp}>{formatTime(new Date(item.created_at).getTime())}</Text>
          </View>
          <Text style={styles.lastMessage}>Chat with {otherProfile?.username || otherUserId}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render Notification-item voor zowel likes als follows
  const renderNotificationItem = ({ item }: { item: NotificationItem }) => {
    if (item.type === "like") {
      return (
        <View style={styles.notificationItem}>
          {/* Profielfoto van de liker */}
          <Image
            source={typeof item.userProfile === "string" ? { uri: item.userProfile } : item.userProfile}
            style={styles.profileImage}
          />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationText}>
              <Text style={{ fontWeight: "bold" }}>{item.userName}</Text> liked your post.
            </Text>
          </View>
          {/* Media van de post */}
          {item.media ? (
            <Image source={{ uri: item.media }} style={styles.mediaImage} />
          ) : null}
        </View>
      );
    } else if (item.type === "follow") {
      return (
        <View style={styles.notificationItem}>
          {/* Profielfoto van de volger */}
          <Image
            source={typeof item.followerProfile === "string" ? { uri: item.followerProfile } : item.followerProfile}
            style={styles.profileImage}
          />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationText}>
              <Text style={{ fontWeight: "bold" }}>{item.followerName}</Text> started following you.
            </Text>
          </View>
        </View>
      );
    }
    return null;
  };

  // Combineer likes en follows tot notificaties
  const notifications: NotificationItem[] = [
    ...likes.map((like) => ({ ...like, type: "like" as const })),
    ...follows.map((follow) => ({ ...follow, type: "follow" as const })),
  ].sort((a, b) => b.timestamp - a.timestamp);

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
        {/* Notificaties (Likes + Follows) */}
        <View style={{ width: windowWidth, padding: 16 }}>
          {likesLoading || followsLoading ? (
            <ActivityIndicator size="large" color="#A020F0" />
          ) : likesError || followsError ? (
            <Text style={styles.emptyText}>
              Error: {likesError || followsError}
            </Text>
          ) : notifications.length === 0 ? (
            <Text style={styles.emptyText}>You haven't received any notifications yet.</Text>
          ) : (
            <FlatList data={notifications} renderItem={renderNotificationItem} keyExtractor={(item) => item.id} />
          )}
        </View>
        {/* Chats */}
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
        {/* Requests */}
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
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  notificationContent: { flex: 1, marginLeft: 10 },
  notificationText: { color: "#FFF", fontSize: 14 },
  mediaImage: { width: 60, height: 60, borderRadius: 8, marginLeft: 10 },
  emptyText: { color: "#A0A0A0", textAlign: "center", marginTop: 20, fontSize: 16 },
});
