import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../../context/authContext";

export default function SettingsScreen() {
  const { signOut, user } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>
      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black", padding: 20 },
  title: { color: "white", fontSize: 24, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: "#9EA2AB", marginBottom: 20 },
  button: { backgroundColor: "#262626", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "700" },
});



