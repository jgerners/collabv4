// ProfileScreen.tsx
import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ActivityIndicator 
} from "react-native";
import { useAuth } from "../../context/authContext";
import ProfilePic from "../../components/mainbuttons/profilepic";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../routes";
import { supabase } from "../../supabaseClient";

export default function ProfileScreen() {
  const { profile } = useAuth();
  const [selectedTab, setSelectedTab] = useState("Demos");
  const [demos, setDemos] = useState<any[]>([]);
  const [loadingDemos, setLoadingDemos] = useState<boolean>(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Haal demo's op uit de demos-tabel voor de huidige gebruiker
  useEffect(() => {
    const fetchDemos = async () => {
      if (profile?.id) {
        setLoadingDemos(true);
        const { data, error } = await supabase
          .from("demos")
          .select("*")
          .eq("profile_id", profile.id);
        if (error) {
          console.error("Error fetching demos:", error);
        } else {
          setDemos(data);
        }
        setLoadingDemos(false);
      }
    };
    fetchDemos();
  }, [profile]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.profileText}>
          {profile?.username || "Gebruiker"}
        </Text>
      </View>

      {/* Profielfoto */}
      <TouchableOpacity style={styles.profileImageContainer}>
        <ProfilePic
          uri={profile?.profile_pic || "https://via.placeholder.com/100"}
        />
      </TouchableOpacity>

      {/* Gebruikersinformatie */}
      <Text style={styles.displayname}>
        {profile?.display_name || "Geen display naam"}
      </Text>
      <Text style={styles.role}>{profile?.role || "Onbekende rol"}</Text>
      <Text style={styles.bio}>{profile?.bio || "Geen bio beschikbaar"}</Text>

      {/* Edit Profile knop */}
      <TouchableOpacity
        style={styles.editProfileButton}
        onPress={() => navigation.navigate("EditProfile")}
      >
        <Text style={styles.editProfileText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabs}>
        {["Demos", "Releases", "Contact"].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setSelectedTab(tab)}>
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTab]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid met Demo’s / Releases */}
      <View style={styles.grid}>
        {selectedTab === "Demos" ? (
          <>
            {loadingDemos ? (
              <ActivityIndicator size="small" color="#A020F0" />
            ) : demos && demos.length > 0 ? (
              demos.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => navigation.navigate("DemoDetail", { demoId: item.id })}
                >
                  <Image
                    source={{ uri: item.thumbnail ? item.thumbnail : item.media_url }}
                    style={styles.gridItem}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noMediaText}>No demos uploaded</Text>
            )}
            {/* Plus-bubble */}
            <TouchableOpacity
              style={[styles.gridItem, styles.plusBubble]}
              onPress={() => navigation.navigate("uploadProfileMedia")}
            >
              <Text style={styles.plusText}>+</Text>
            </TouchableOpacity>
          </>
        ) : selectedTab === "Releases" ? (
          // Placeholder voor Releases
          Array(6)
            .fill(null)
            .map((_, index) => (
              <View key={index} style={styles.gridItem} />
            ))
        ) : (
          // Contact-tab
          <Text style={{ color: "gray" }}>Contact info...</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    paddingTop: 130,
  },
  header: {
    width: "90%",
    marginBottom: 20,
    alignItems: "center",
  },
  profileText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 10,
  },
  displayname: {
    color: "white",
    fontSize: 18,
  },
  role: {
    color: "gray",
    fontSize: 16,
  },
  bio: {
    color: "gray",
    fontSize: 14,
    marginBottom: 20,
  },
  editProfileButton: {
    backgroundColor: "#A020F0",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  editProfileText: {
    color: "white",
    fontWeight: "bold",
  },
  tabs: {
    flexDirection: "row",
    width: "80%",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  tabText: {
    color: "gray",
    fontSize: 16,
  },
  activeTab: {
    color: "#A020F0",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "80%",
    justifyContent: "space-between",
  },
  gridItem: {
    width: 80,
    height: 80,
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    marginBottom: 10,
  },
  noMediaText: {
    color: "gray",
    textAlign: "center",
    width: "100%",
  },
  plusBubble: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#A020F0",
  },
  plusText: {
    color: "#A020F0",
    fontSize: 30,
    fontWeight: "bold",
  },
});


