import React, { useRef, useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

// Pas de interface aan zodat profileImage zowel een string als een number kan zijn
interface Post {
  id: string;
  profileImage: string | number;
  username: string;
  media: string | number; // string voor remote URL, number voor lokale require()
  title: string;
  description: string;
  tags: string[];
  isLiked: boolean;
  isFollowed: boolean;
  isSaved: boolean;
}

const samplePosts: Post[] = [
  {
    id: "1",
    profileImage: "https://i.scdn.co/image/ab67616100005174d6c2e9f3f63724e654532074",
    username: "Tate McRae",
    media: "https://via.placeholder.com/300",
    title: "I need a full pop production for this guitar demo",
    description: "This is a vocal demo I made. It needs full production and Dua Lipa vibes.",
    tags: ["Bruno Mars style", "Dua Lipa style"],
    isLiked: false,
    isFollowed: false,
    isSaved: false,
  },
  {
    id: "2",
    profileImage: "https://i.scdn.co/image/ab67616100005174943540ff7d38360b7d7d4a7b",
    username: "Justin Bieber",
    media: "https://via.placeholder.com/300",
    title: "I want an acoustic guitar strum under my vocals",
    description: "This is a home-recorded demo. Let’s make it sound like SZA's Snooze.",
    tags: ["SZA style"],
    isLiked: false,
    isFollowed: false,
    isSaved: false,
  },
  {
    id: "3",
    // Gebruik het lokale bestand voor de profielfoto van Dua Lipa
    profileImage: require('../../assets/dummy/profile/dua_profile.png'),
    username: "Dua Lipa",
    media: require('../../assets/dummy/profile/dua_profile.png'),
    title: "I need a synth solo on this track",
    description: "Add a funky synth solo to this finished pop song after the last chorus.",
    tags: ["Dua Lipa style", "The Weeknd style"],
    isLiked: false,
    isFollowed: false,
    isSaved: false,
  },
  {
    id: "4",
    profileImage: "https://i.scdn.co/image/ab67616100005174e29e618946c50f85a7fc7a55",
    username: "The Weeknd",
    media: "https://via.placeholder.com/300",
    title: "Looking for a futuristic sound for this track",
    description: "This track needs a retro synthwave sound like Kavinsky or Daft Punk.",
    tags: ["Synthwave", "Retro", "Daft Punk"],
    isLiked: false,
    isFollowed: false,
    isSaved: false,
  },
  {
    id: "5",
    profileImage: "https://i.scdn.co/image/ab6761610000517496c2d09e6df6b52bca0f998a",
    username: "Ariana Grande",
    media: "https://via.placeholder.com/300",
    title: "Need a smooth R&B beat for this vocal idea",
    description: "Something similar to Doja Cat's vibe with a smooth groove.",
    tags: ["R&B", "Doja Cat", "Soul"],
    isLiked: false,
    isFollowed: false,
    isSaved: false,
  },
  {
    id: "6",
    profileImage: "https://i.scdn.co/image/ab67616100005174b5c0a4c8e8b315efc46a8f6f",
    username: "Ed Sheeran",
    media: "https://via.placeholder.com/300",
    title: "Looking for a live violin recording",
    description: "A beautiful violin accompaniment for this acoustic song.",
    tags: ["Acoustic", "Violin", "Live Instruments"],
    isLiked: false,
    isFollowed: false,
    isSaved: false,
  },
];

const FeedScreen: React.FC = () => {
  // Posts in state
  const [posts, setPosts] = useState<Post[]>(samplePosts);

  // useRef voor dubbele-tap
  const lastTap = useRef<number | null>(null);

  // Toggle like-status
  const handleLike = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, isLiked: !post.isLiked } : post
      )
    );
  };

  // Toggle follow-status
  const handleFollow = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, isFollowed: !post.isFollowed } : post
      )
    );
  };

  // Toggle save-status
  const handleSave = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, isSaved: !post.isSaved } : post
      )
    );
  };

  // Handler voor dubbele tap op media
  const handleMediaPress = (postId: string) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap.current && now - lastTap.current < DOUBLE_PRESS_DELAY) {
      handleLike(postId);
    } else {
      lastTap.current = now;
    }
  };

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
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            {/* Bovenste rij met profiel, follow-, save- en collab-knoppen */}
            <View style={styles.postHeader}>
              <Image
                // Controleer of profileImage een string of een lokaal bestand is
                source={typeof item.profileImage === 'string' ? { uri: item.profileImage } : item.profileImage}
                style={styles.profilePic}
              />
              <Text style={styles.username}>{item.username}</Text>
              <View style={styles.headerButtons}>
                {/* Follow-knop: person-add-outline bij niet gevolgd, checkmark-outline bij gevolgd */}
                <TouchableOpacity style={styles.followButton} onPress={() => handleFollow(item.id)}>
                  <Icon name={item.isFollowed ? "checkmark-outline" : "person-add-outline"} size={24} color="white" />
                </TouchableOpacity>
                {/* Opslaan-knop */}
                <TouchableOpacity style={styles.saveButton} onPress={() => handleSave(item.id)}>
                  <Icon name={item.isSaved ? "bookmark" : "bookmark-outline"} size={24} color="white" />
                </TouchableOpacity>
                {/* Collab-knop */}
                <TouchableOpacity style={styles.collabButton}>
                  <Text style={styles.collabText}>COLLAB!</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Media met play/pause en dubbele-tap */}
            <View style={styles.mediaContainer}>
              <TouchableWithoutFeedback onPress={() => handleMediaPress(item.id)}>
                <Image
                  source={typeof item.media === 'string' ? { uri: item.media } : item.media}
                  style={styles.media}
                />
              </TouchableWithoutFeedback>
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
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Like en See More */}
            <View style={styles.postActions}>
              <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.likeButton}>
                <Icon name={item.isLiked ? "heart" : "heart-outline"} size={25} color={item.isLiked ? "red" : "white"} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.seeMoreButton}>
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
  container: { 
    flex: 1, 
    backgroundColor: "#1E1E1E", 
    paddingTop: 50 
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    padding: 20, 
    backgroundColor: "#121212" 
  },
  title: { 
    fontSize: 28, 
    fontWeight: "bold", 
    color: "white" 
  },
  headerIcons: { 
    flexDirection: "row" 
  },
  icon: { 
    width: 35, 
    height: 35, 
    marginLeft: 15 
  },
  postContainer: { 
    backgroundColor: "#252525", 
    borderRadius: 15,
    paddingTop: 5,
    paddingHorizontal: 20,
    paddingBottom: 30,
    margin: 10,
  },
  postHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between"
  },
  profilePic: { 
    width: 32,
    height: 32, 
    borderRadius: 25, 
    marginRight: 15,
    marginTop: 10,
    left: -10
  },
  username: { 
    fontSize: 15, 
    fontFamily: "helvetica",
    fontWeight: "thin",
    color: "white", 
    flex: 1, 
    maxWidth: 150, 
    overflow: "hidden",
    marginTop: 10,
    left: -15
  },
  headerButtons: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  followButton: { 
    backgroundColor: "transparent",
    padding: 0,
    marginRight: 8,
    bottom: -5,
    right: -10
  },
  saveButton: {
    backgroundColor: "transparent",
    padding: 0,
    marginRight: 8,
    bottom: -5,
    right: -10
  },
  collabButton: { 
    backgroundColor: "purple", 
    paddingVertical: 2, 
    paddingHorizontal: 20, 
    right: -10,
    borderRadius: 6,
    bottom: -5
  },
  collabText: { 
    color: "white", 
    fontSize: 16,
    fontWeight: "bold"
  },
  mediaContainer: { 
    position: "relative", 
    alignItems: "center", 
    marginVertical: 15 
  },
  media: { 
    width: "100%",
    height: 390,
    aspectRatio: 1,
    borderRadius: 12,
  },
  playButton: { 
    position: "absolute", 
    top: "45%", 
    left: "45%" 
  },
  playText: { 
    fontSize: 45, 
    color: "white" 
  },
  postDetails: { 
    alignSelf: "flex-start",
    marginLeft: -8,
    marginTop: 10,
    width: "90%",
  },
  postTitle: { 
    fontSize: 15, 
    fontWeight: "bold", 
    color: "white" 
  },
  postDescription: { 
    fontSize: 12, 
    color: "gray", 
    marginVertical: 8 
  },
  tagsContainer: { 
    flexDirection: "row", 
    marginTop: 8 
  },
  tag: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#333", 
    padding: 2,
    borderRadius: 6, 
    marginRight: 6 
  },
  tagText: { 
    fontSize: 10, 
    color: "white" 
  },
  postActions: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 40, 
    paddingHorizontal: 50, 
    paddingVertical: 5 
  },
  likeButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    width: 40,
  },
  seeMoreButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  seeMoreText: { 
    fontSize: 16, 
    color: "gray" 
  }
});

export default FeedScreen;