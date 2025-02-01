import React from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";

// Dummy data zoals in Xcode
const samplePosts = [
  {
    id: "1",
    profileImage: "https://via.placeholder.com/40",
    username: "TateMcRae",
    media: "https://via.placeholder.com/300",
    title: "I need a full pop production for this guitar demo",
    description: "This is a vocal demo I made. It needs full production and Dua Lipa vibes.",
    tags: [
      { name: "Bruno Mars style", image: "https://via.placeholder.com/20" },
      { name: "Dua Lipa style", image: "https://via.placeholder.com/20" }
    ],
  },
  {
    id: "2",
    profileImage: "https://via.placeholder.com/40",
    username: "JustinBieber",
    media: "https://via.placeholder.com/300",
    title: "I want an acoustic guitar strum under my vocals",
    description: "This is a home-recorded demo. Let’s make it sound like SZA's Snooze.",
    tags: [{ name: "SZA style", image: "https://via.placeholder.com/20" }]
  }
];

const FeedScreen = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>FEED</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Image source={{ uri: "https://via.placeholder.com/30" }} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image source={{ uri: "https://via.placeholder.com/30" }} style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed Posts */}
      <FlatList
        data={samplePosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            {/* Bovenste rij met profiel, volgknop, en save */}
            <View style={styles.postHeader}>
              <Image source={{ uri: item.profileImage }} style={styles.profilePic} />
              <Text style={styles.username}>{item.username}</Text>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followText}>Follow</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Image source={{ uri: "https://via.placeholder.com/20" }} style={styles.icon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.collabButton}>
                <Text style={styles.collabText}>COLLAB!</Text>
              </TouchableOpacity>
            </View>

            {/* Media met play/pause */}
            <View style={styles.mediaContainer}>
              <Image source={{ uri: item.media }} style={styles.media} />
              <TouchableOpacity style={styles.playButton}>
                <Text style={styles.playText}>▶</Text>
              </TouchableOpacity>
            </View>

            {/* Titel, beschrijving en tags */}
            <View style={styles.postDetails}>
              <Text style={styles.postTitle}>{item.title}</Text>
              <Text style={styles.postDescription}>{item.description}</Text>
              <View style={styles.tagsContainer}>
                {item.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Image source={{ uri: tag.image }} style={styles.tagImage} />
                    <Text style={styles.tagText}>{tag.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Like en See More */}
            <View style={styles.postActions}>
              <TouchableOpacity>
                <Text style={styles.likeText}>❤️ Like</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.seeMoreText}>See more ↓</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1E1E1E", paddingTop: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", padding: 15, backgroundColor: "#121212" },
  title: { fontSize: 24, fontWeight: "bold", color: "white" },
  headerIcons: { flexDirection: "row" },
  icon: { width: 30, height: 30, marginLeft: 10 },
  postContainer: { backgroundColor: "#252525", borderRadius: 10, padding: 15, margin: 10 },
  postHeader: { flexDirection: "row", alignItems: "center" },
  profilePic: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  username: { fontSize: 16, color: "white", flex: 1 },
  followButton: { backgroundColor: "#444", padding: 5, borderRadius: 5 },
  followText: { color: "white", fontSize: 14 },
  collabButton: { backgroundColor: "purple", padding: 5, borderRadius: 5 },
  collabText: { color: "white", fontSize: 14 },
  mediaContainer: { position: "relative", alignItems: "center", marginVertical: 10 },
  media: { width: "100%", height: 200, borderRadius: 10 },
  playButton: { position: "absolute", top: "45%", left: "45%" },
  playText: { fontSize: 40, color: "white" },
  postDetails: { marginTop: 10 },
  postTitle: { fontSize: 16, fontWeight: "bold", color: "white" },
  postDescription: { fontSize: 14, color: "gray", marginVertical: 5 },
  tagsContainer: { flexDirection: "row", marginTop: 5 },
  tag: { flexDirection: "row", alignItems: "center", backgroundColor: "#333", padding: 5, borderRadius: 5, marginRight: 5 },
  tagImage: { width: 15, height: 15, borderRadius: 10, marginRight: 5 },
  tagText: { fontSize: 12, color: "white" },
  postActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  likeText: { fontSize: 14, color: "white" },
  seeMoreText: { fontSize: 14, color: "gray" }
});

export default FeedScreen;
