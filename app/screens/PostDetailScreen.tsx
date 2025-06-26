import React from "react";
import { View, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../routes"; // pas aan indien nodig!
import { Ionicons } from "@expo/vector-icons";
import PostComponent from "../../components/postcomponent"; // pas pad aan naar jouw bestand!

type PostDetailRouteProp = RouteProp<RootStackParamList, "PostDetail">;

const PostDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<PostDetailRouteProp>();

  // Hier ga je uit van: navigation.navigate("PostDetail", { post, artistTags, genreTags })
  const { post, artistTags, genreTags } = route.params;

  return (
    <View style={styles.container}>
      {/* Terug-knop */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 18, bottom: 18, left: 18, right: 18 }}
      >
        <Ionicons name="chevron-back" size={30} color="#fff" />
      </TouchableOpacity>
      {/* Jouw volledige postcomponent */}
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 120,
          alignItems: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        <PostComponent
          post={post}
          artistTags={artistTags}
          genreTags={genreTags}
          isActive={true}
          feedFocused={true}
          withinPreloadRange={true}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  backButton: {
    position: "absolute",
    left: 16,
    top: 48,
    zIndex: 10,
    padding: 6,
    backgroundColor: "rgba(20,20,20,0.3)",
    borderRadius: 22,
  },
});

export default PostDetailScreen;
