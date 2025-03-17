import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../app/(tabs)/chat_list";
import { useCollabRequests, CollabRequest } from "../hooks/useCollabRequests"; // Zorg dat deze hook correct is
import { useAuth } from "../context/authContext";

import ProfileLink from "./profileLink";

const Requests: React.FC = () => {
  
  
  const { user } = useAuth();
  const receiverId = user!.id; // Zorg dat dit een string is; eventueel een fallback indien nodig
  
  const { requests, loading, error } = useCollabRequests(receiverId);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Request accepteren -> update de status in de database en navigeer naar ChatScreen
  const acceptRequest = (id: string) => {
    // Hier roep je eventueel een update-functie aan die de request status op "accepted" zet
    navigation.navigate("Chat", { chatId: id });
  };

  // Request afwijzen -> update de status in de database of verwijder het request
  const rejectRequest = (id: string) => {
    // Roep hier een update-functie aan die de request status op "rejected" zet
  };

  // Profiel bekijken -> Navigeren naar profielpagina
  const viewProfile = (userId: string) => {
    navigation.navigate("Profile", { userId });
  };

  if (loading) {
    return <Text style={styles.emptyText}>Loading requests...</Text>;
  }

  if (error) {
    return <Text style={styles.emptyText}>Error: {error}</Text>;
  }

  if (requests.length === 0) {
    return <Text style={styles.emptyText}>No requests yet.</Text>;
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={(item: CollabRequest) => item.id}
      renderItem={({ item }: { item: CollabRequest }) => (
        <View style={styles.requestItem}>
          {/* 🔥 Profielfoto en gebruikersnaam */}
          <View style={styles.userContainer}>
          <ProfileLink userId={item.sender_Id}>
           <Image
              source={
              typeof item.userProfile === "string"
            ? { uri: item.userProfile }
            : item.userProfile
             }
                  style={styles.profileImage}
                                              />
          </ProfileLink>
           
          <ProfileLink userId={item.sender_Id}>
             <Text style={styles.userName}>{item.userName}</Text>
                </ProfileLink>

            {/* 📌 Accept & Reject buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.acceptButton} onPress={() => acceptRequest(item.id)}>
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton} onPress={() => rejectRequest(item.id)}>
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.collabText}>wants to collab with you</Text>
          {/* 🔥 Post-media (rechts) */}
          <Image
            source={
              typeof item.postImage === "string"
                ? { uri: item.postImage }
                : item.postImage
            }
            style={styles.postImage}
          />
          {/* 🔥 Check Music knop */}
          <ProfileLink userId={item.sender_Id}>
             <Text style={styles.checkMusicText}>Check {item.userName}'s music</Text>
          </ProfileLink>
        </View>
      )}
    />
  );
};

export default Requests;

const styles = StyleSheet.create({
  emptyText: { 
    color: "#A0A0A0", 
    textAlign: "center", 
    marginTop: 20, 
    fontSize: 16 
  },
  requestItem: { 
    flexDirection: "column", 
    backgroundColor: "#1E1E1E", 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12, 
    width: "100%", 
    aspectRatio: 1, // Maakt de hoogte gelijk aan de breedte
    alignItems: "center",
  },
  userContainer: {
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    width: "100%", 
    marginBottom: 10
  },
  profileImage: { 
    width: 35, 
    height: 35, 
    borderRadius: 30, 
    marginRight: 12 
  },
  userName: { 
    fontSize: 14, 
    fontWeight: "bold", 
    color: "#FFF" 
  },
  buttonsContainer: { 
    flexDirection: "row", 
    marginLeft: "auto"
  },
  acceptButton: { 
    backgroundColor: "#A020F0", 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 6, 
    marginRight: 6,
  },
  rejectButton: { 
    backgroundColor: "#595959", 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 6 
  },
  buttonText: { 
    color: "#FFF", 
    fontSize: 10, 
    fontWeight: "bold" 
  },
  postImage: { 
    width: "60%", 
    height: "60%", 
    borderRadius: 8, 
    marginTop: 10, 
    alignSelf: "center"
  },
  checkMusicText: { 
    marginTop: 15, 
    color: "#A020F0", 
    fontSize: 16, 
    fontWeight: "bold", 
    textAlign: "center", 
    width: "100%", 
    paddingVertical: 3, 
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.1)", 
    borderRadius: 8,
    bottom: -17
  },
  collabText: { 
    fontSize: 12, 
    color: "#A0A0A0", 
    marginTop: 2,
    bottom: 20,
    right: 50
  }
});
