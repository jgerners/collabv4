import React, { useState, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  ScrollView,
  Button,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "../../supabaseClient";
import { useNavigation } from "@react-navigation/native";

const UploadScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [uploadType, setUploadType] = useState<"video" | "photo">("video");
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedArtistTags, setSelectedArtistTags] = useState<string[]>([]);
  const [selectedGenreTags, setSelectedGenreTags] = useState<string[]>([]);

  const windowWidth = Dimensions.get("window").width;
  const tabOrder: ("video" | "photo")[] = ["video", "photo"];
  const scrollViewRef = useRef<ScrollView>(null);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setSelectedMedia(result.assets[0].uri);
    }
  };

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
    if (!result.canceled && result.assets?.length > 0) {
      setSelectedAudio(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    setError(null);

    const newPost = {
      id: Date.now().toString(),
      userId: "1",
      profileImage: "https://via.placeholder.com/100",
      username: "Bruno Mars",
      media: selectedMedia || "",
      mediaUrl: selectedMedia || "",
      mediaType: uploadType,
      audioUrl: selectedAudio,
      title,
      description,
      timestamp: new Date().toISOString(),
      artistTags: selectedArtistTags,
      genreTags: selectedGenreTags,
      isLiked: false,
      isFollowed: false,
      isSaved: false,
      isPlaying: false,
    };

    const { error: supabaseError } = await supabase
      .from("posts")
      .insert([newPost])
      .select();

    if (supabaseError) {
      setError(supabaseError.message);
    } else {
      setTitle("");
      setDescription("");
      setSelectedMedia(null);
      setSelectedAudio(null);
      setSelectedArtistTags([]);
      setSelectedGenreTags([]);
    }
    setUploading(false);
  };

  const handleMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
    setUploadType(tabOrder[newIndex]);
  };

  // Navigatieknoppen met callback doorgeven
  const goToArtistTagSelect = () => {
    navigation.navigate("ArtistTagSelect", {
      onSave: (tags: string[]) => setSelectedArtistTags(tags),
    });
  };

  const goToGenreTagSelect = () => {
    navigation.navigate("GenreTagSelect", {
      onSave: (tags: string[]) => setSelectedGenreTags(tags),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.toggleContainer}>
        {tabOrder.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.toggleButton,
              uploadType === option && styles.activeToggleButton,
            ]}
            onPress={() => {
              setUploadType(option);
              scrollViewRef.current?.scrollTo({
                x: tabOrder.indexOf(option) * windowWidth,
                animated: true,
              });
            }}
          >
            <Text
              style={[
                styles.toggleText,
                uploadType === option && styles.activeToggleText,
              ]}
            >
              {option === "video" ? "Video Upload" : "Photo Upload"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tagsContainer}>
        <Button title="Selecteer Artiest-Tags" onPress={goToArtistTagSelect} />
        <Button title="Selecteer Genre-Tags" onPress={goToGenreTagSelect} />
        <Text style={styles.infoText}>
          Geselecteerde Artiest-Tags: {selectedArtistTags.join(", ")}
        </Text>
        <Text style={styles.infoText}>
          Geselecteerde Genre-Tags: {selectedGenreTags.join(", ")}
        </Text>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        ref={scrollViewRef}
        contentOffset={{ x: windowWidth, y: 0 }}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        <View style={{ width: windowWidth, padding: 20 }}>
          <TouchableOpacity style={styles.uploadBox} onPress={pickMedia}>
            <Text style={styles.uploadText}>
              {selectedMedia ? "Change Media" : "Select Media"}
            </Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Title"
            placeholderTextColor="#aaa"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.description]}
            placeholder="Description"
            placeholderTextColor="#aaa"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
            <Text style={styles.uploadButtonText}>
              {uploading ? "Uploading..." : "Upload"}
            </Text>
          </TouchableOpacity>
          {error && <Text style={styles.errorText}>Error: {error}</Text>}
        </View>

        <View style={{ width: windowWidth, padding: 20 }}>
          <TouchableOpacity style={styles.uploadBox} onPress={pickMedia}>
            <Text style={styles.uploadText}>
              {selectedMedia ? "Change Media" : "Select Media"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBox} onPress={pickAudio}>
            <Text style={styles.uploadText}>
              {selectedAudio ? "Change Audio" : "Select Audio"}
            </Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Title"
            placeholderTextColor="#aaa"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.description]}
            placeholder="Description"
            placeholderTextColor="#aaa"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
            <Text style={styles.uploadButtonText}>
              {uploading ? "Uploading..." : "Upload"}
            </Text>
          </TouchableOpacity>
          {error && <Text style={styles.errorText}>Error: {error}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UploadScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#1E1E1E",
    padding: 6,
    borderRadius: 10,
    marginTop: 70,
    width: "75%",
    alignSelf: "center",
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  activeToggleButton: {
    backgroundColor: "#A020F0",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#B0B0B0",
  },
  activeToggleText: {
    color: "#FFF",
  },
  uploadBox: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    marginBottom: 15,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 30,
  },
  uploadText: { color: "#A0A0A0" },
  input: {
    backgroundColor: "#1E1E1E",
    color: "#FFF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  description: { height: 80 },
  uploadButton: {
    backgroundColor: "#A020F0",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  uploadButtonText: { color: "#FFF", fontWeight: "bold" },
  errorText: { color: "red", marginTop: 10 },
  tagsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  infoText: {
    color: "#ccc",
    marginVertical: 4,
  },
});
