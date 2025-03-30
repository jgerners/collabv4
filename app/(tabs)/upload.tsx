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
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "../../supabaseClient";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/authContext"; // ✅ AuthContext importeren
import { generateVideoThumbnail } from "../../helpers/videoThumbnailHelper";

const getPresignedUrl = async (
  uniqueName: string,
  contentType: string
): Promise<string | null> => {
  try {
    const response = await fetch(
      `http://192.168.178.55:3000/get-presigned-url?fileName=${encodeURIComponent(
        uniqueName
      )}&contentType=${encodeURIComponent(contentType)}`
    );
    const json = await response.json();
    return json.url;
  } catch (error) {
    console.error("Error fetching presigned URL:", error);
    return null;
  }
};

const uploadFileToS3 = async (
  fileUri: string,
  folder: string
): Promise<string | null> => {
  try {
    console.log("uploadFileToS3 gestart voor:", fileUri, "in folder:", folder);
    const response = await fetch(fileUri);
    const blob = await response.blob();
    console.log("Blob verkregen, size:", blob.size);
    const fileName = fileUri.split("/").pop();
    const uniqueName = `${folder}/${Date.now()}_${fileName}`;
    console.log("UniqueName gegenereerd:", uniqueName);
    const contentType = blob.type || "application/octet-stream";
    const presignedUrl = await getPresignedUrl(uniqueName, contentType);
    if (!presignedUrl) {
      throw new Error("Geen pre-signed URL ontvangen");
    }
    console.log("Presigned URL ontvangen:", presignedUrl);
    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: blob,
    });
    if (!uploadResponse.ok) {
      console.error("Upload naar S3 mislukt:", uploadResponse.statusText);
      return null;
    }
    // Stel de publieke URL samen (pas dit aan met jouw bucketnaam)
    const publicUrl = `https://collabpostmedia.s3.amazonaws.com/${uniqueName}`;
    console.log("Publieke URL verkregen:", publicUrl);
    return publicUrl;
  } catch (err) {
    console.error("Error in uploadFileToS3:", err);
    return null;
  }
};

const UploadScreen: React.FC = () => {
  const { user } = useAuth(); // ✅ Haal de ingelogde gebruiker op
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
    console.log("pickMedia gestart");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });
    console.log("Result van ImagePicker:", result);
    if (!result.canceled) {
      console.log("Media geselecteerd:", result.assets[0].uri);
      setSelectedMedia(result.assets[0].uri);
    }
  };

  const pickAudio = async () => {
    console.log("pickAudio gestart");
    const result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
    console.log("Result van DocumentPicker:", result);
    if (!result.canceled && result.assets?.length > 0) {
      console.log("Audio geselecteerd:", result.assets[0].uri);
      setSelectedAudio(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!user) {
      setError("Je moet ingelogd zijn om een post te plaatsen.");
      return;
    }

    setUploading(true);
    setError(null);

    let mediaPublicUrl = "";
    let audioPublicUrl = "";
    // Gebruik een lokale variabele voor de video thumbnail URL
    let videoThumbnailUrl = "";

    if (selectedMedia) {
      console.log("Geselecteerde media URI:", selectedMedia);
      const folder = uploadType === "video" ? "videos" : "images";
      const url = await uploadFileToS3(selectedMedia, folder);
      console.log("Media URL van uploadFileToS3:", url);
      if (url) {
        mediaPublicUrl = url;
      } else {
        setError("Fout bij uploaden van media.");
        setUploading(false);
        return;
      }

      // Als het een video betreft, genereer en upload de thumbnail
      if (uploadType === "video") {
        const thumbnailLocalUri = await generateVideoThumbnail(selectedMedia);
        if (thumbnailLocalUri) {
          const thumbnailUrl = await uploadFileToS3(thumbnailLocalUri, "video_thumbnails");
          if (thumbnailUrl) {
            videoThumbnailUrl = thumbnailUrl;
            console.log("Video thumbnail URL:", videoThumbnailUrl);
          } else {
            setError("Fout bij uploaden van video thumbnail.");
            setUploading(false);
            return;
          }
        } else {
          setError("Fout bij genereren van video thumbnail.");
          setUploading(false);
          return;
        }
      }
    }

    if (selectedAudio) {
      console.log("Geselecteerde audio URI:", selectedAudio);
      const url = await uploadFileToS3(selectedAudio, "audio");
      console.log("Audio URL van uploadFileToS3:", url);
      if (url) {
        audioPublicUrl = url;
      } else {
        setError("Fout bij uploaden van audio.");
        setUploading(false);
        return;
      }
    }

    console.log("mediaPublicUrl:", mediaPublicUrl);
    console.log("audioPublicUrl:", audioPublicUrl);
    console.log("videoThumbnailUrl:", videoThumbnailUrl);

    const newPost = {
      userId: user?.id,
      media: mediaPublicUrl,
      mediaUrl: mediaPublicUrl,
      video_thumbnail: videoThumbnailUrl, // Gebruik de lokale variabele
      mediaType: uploadType,
      audioUrl: audioPublicUrl,
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

    console.log("Nieuwe post object:", newPost);

    try {
      const { error: supabaseError } = await supabase
        .from("posts")
        .insert([newPost])
        .select();
      if (supabaseError) {
        setError(supabaseError.message);
        console.error("Database insert error:", supabaseError);
      } else {
        console.log("Post succesvol aangemaakt");
        setTitle("");
        setDescription("");
        setSelectedMedia(null);
        setSelectedAudio(null);
        setSelectedArtistTags([]);
        setSelectedGenreTags([]);
        videoThumbnailUrl = ""; // reset de lokale variabele
      }
    } catch (err) {
      console.error("Fout bij post-insert:", err);
      setError("Er is iets misgegaan bij het opslaan van de post.");
    }

    setUploading(false);
    console.log("handleUpload beëindigd");
  };

  const handleMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
    setUploadType(tabOrder[newIndex]);
  };

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
