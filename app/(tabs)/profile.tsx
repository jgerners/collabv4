import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

export default function ProfileScreen() {
  const [selectedTab, setSelectedTab] = useState("Demos");

  return (
    <View style={styles.container}>
      {/* Header (zonder settings icoon) */}
      <View style={styles.header}>
        <Text style={styles.profileText}>Profile</Text>
      </View>

      {/* Profielfoto */}
      <TouchableOpacity style={styles.profileImageContainer}>
        <Image source={{ uri: "https://via.placeholder.com/100" }} style={styles.profileImage} />
        <Text style={styles.addIcon}>+</Text>
      </TouchableOpacity>

      {/* Gebruikersinformatie */}
      <Text style={styles.username}>Skipvdv</Text>
      <Text style={styles.role}>Producer</Text>
      <Text style={styles.location}>Producer from the Netherlands</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        {["Demos", "Releases", "Contact"].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setSelectedTab(tab)}>
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTab]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid met Demo’s / Releases */}
      <View style={styles.grid}>
        {Array(6).fill(null).map((_, index) => (
          <View key={index} style={styles.gridItem} />
        ))}
      </View>
    </View>
  );
}

// STIJLEN
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    paddingTop: 50
  },
  header: {
    width: "90%",
    marginBottom: 20,
    alignItems: "center",
  },
  profileText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold"
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 10
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45
  },
  addIcon: {
    position: "absolute",
    fontSize: 24,
    color: "white",
    bottom: 5
  },
  username: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold"
  },
  role: {
    color: "gray",
    fontSize: 16
  },
  location: {
    color: "gray",
    fontSize: 14,
    marginBottom: 20
  },
  tabs: {
    flexDirection: "row",
    width: "80%",
    justifyContent: "space-around",
    marginBottom: 20
  },
  tabText: {
    color: "gray",
    fontSize: 16
  },
  activeTab: {
    color: "#A020F0",
    fontWeight: "bold",
    textDecorationLine: "underline"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "80%",
    justifyContent: "space-between"
  },
  gridItem: {
    width: 80,
    height: 80,
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    marginBottom: 10
  }
});
