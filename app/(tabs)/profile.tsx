import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import {supabase} from '@/lib/supabase'
import Post from '@/components/Post' 
import Avatar from "@/components/Avatar";


export default function ProfileScreen() {
  const [selectedTab, setSelectedTab] = useState("Demos");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);


  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setUsername(data.username);
      setAvatarUrl(data.avatar_url);
    } catch (error) {
      if (error instanceof Error) Alert.alert("Error fetching profile", error.message);
    }
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.profileText}>Profile</Text>
      </View>

      {/* Profile Image */}
      <View>
      <Avatar
      size={200}
      url={avatarUrl}
      onUpload={async (filePath) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Update the profile in Supabase
          const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: filePath })
            .eq('id', user.id);

          if (error) throw error;

          // Refresh the profile data
          fetchProfile();
        } catch (error) {
          if (error instanceof Error) Alert.alert("Error updating avatar", error.message);
        }
      }}
    />

      </View>

      {/* User Info */}
      <Text style={styles.username}>{username ?? "Loading..."}</Text>
      <Text style={styles.role}>Producer</Text>
      <Text style={styles.location}>Producer from the Netherlands</Text>

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

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {selectedTab === "Demos" ? (
          <Post content="This is a sample post!" userId='123' />
        ) : selectedTab === "Releases" ? (
          <Text style={styles.placeholderText}>No releases available</Text>
        ) : selectedTab === "Contact" ? (
          <Text style={styles.placeholderText}>Contact details here</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    paddingTop: 50,
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
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  addIcon: {
    position: "absolute",
    fontSize: 24,
    color: "white",
    bottom: 5,
  },
  placeholderText: {
    color: "gray",
    fontSize: 14,
  },
  username: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  role: {
    color: "gray",
    fontSize: 16,
  },
  location: {
    color: "gray",
    fontSize: 14,
    marginBottom: 20,
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
  contentContainer: {
    flex: 1,
    width: "100%",
  },
});

