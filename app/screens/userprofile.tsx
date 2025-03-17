import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator } from "react-native";
import { useRoute } from "@react-navigation/native";
import { supabase } from "../../supabaseClient";

const UserProfileScreen = () => {
  const route = useRoute();
  const { userId } = route.params as { userId: string };

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      console.log("📡 Ophalen profielgegevens voor:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("❌ Fout bij ophalen profiel:", error);
        setError(error.message);
      } else {
        console.log("✅ Profielgegevens opgehaald:", data);
        setProfile(data);
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>❌ {error}</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>❌ Gebruiker niet gevonden</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: profile.profile_pic || "https://via.placeholder.com/100" }}
        style={styles.profileImage}
      />
      <Text style={styles.username}>{profile.username || "Geen naam gevonden"}</Text>
      <Text style={styles.bio}>{profile.bio || "Geen bio beschikbaar"}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    paddingTop: 130,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  username: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  bio: {
    color: "gray",
    fontSize: 16,
    textAlign: "center",
    marginHorizontal: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});

export default UserProfileScreen;
