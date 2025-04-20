// components/ChatHeader.tsx
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";

interface Props {
  profileName: string;
  profilePic: string;
  onBack: () => void;
}

export function ChatHeader({ profileName, profilePic, onBack }: Props) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack} style={styles.back}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Image source={{ uri: profilePic }} style={styles.avatar} />
        <Text style={styles.name}>{profileName}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#121212",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 80,
    paddingHorizontal: 16,
    backgroundColor: "#121212",
  },
  back: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  name: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
