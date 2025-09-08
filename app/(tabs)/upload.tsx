import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "../../supabaseClient";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/authContext";
import { generateVideoThumbnail } from "../../helpers/videoThumbnailHelper";
import ArtistTag from "../../components/mainbuttons/tags/artist_tags";
import GenreTag from "../../components/mainbuttons/tags/genre_tags";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";



// ExtendedUser interface
export interface ExtendedUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
  profileImage: string;
}

// Functie om een pre-signed URL op te halen
const getPresignedUrl = async (
  uniqueName: string,
  contentType: string
): Promise<string | null> => {
  try {
    const response = await fetch(
      `http://192.168.178.101:3000/get-presigned-url?fileName=${encodeURIComponent(
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

// Upload functie naar S3
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

    const publicUrl = `https://collabpostmedia.s3.amazonaws.com/${uniqueName}`;
    console.log("Publieke URL verkregen:", publicUrl);
    return publicUrl;
  } catch (err) {
    console.error("Error in uploadFileToS3:", err);
    return null;
  }
};

const UploadScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  // States
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null);
  const [allArtistTags, setAllArtistTags] = useState<any[]>([]);
  const [allGenreTags, setAllGenreTags] = useState<any[]>([]);
  const [uploadType, setUploadType] = useState<"video" | "photo">("video");
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArtistTags, setSelectedArtistTags] = useState<string[]>([]);
  const [selectedGenreTags, setSelectedGenreTags] = useState<string[]>([]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user data:", error);
        } else {
          const formattedUser: ExtendedUser = {
            id: data.id,
            username: data.username,
            displayName: data.display_name,
            role: data.role,
            profileImage: data.profile_pic,
          };
          setCurrentUser(formattedUser);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Fetch tags
  useEffect(() => {
    const fetchArtistTags = async () => {
      const { data, error } = await supabase.from("artistTags").select("*");
      if (error) {
        console.error("Error fetching artist tags:", error);
      } else {
        setAllArtistTags(data);
      }
    };

    const fetchGenreTags = async () => {
      const { data, error } = await supabase.from("genreTags").select("*");
      if (error) {
        console.error("Error fetching genre tags:", error);
      } else {
        setAllGenreTags(data);
      }
    };

    fetchArtistTags();
    fetchGenreTags();
  }, []);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: uploadType === "video" 
        ? ImagePicker.MediaTypeOptions.Videos 
        : ImagePicker.MediaTypeOptions.Images,
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

  const handleUploadTypeChange = (type: "video" | "photo") => {
    setUploadType(type);
    // Reset media when switching types
    setSelectedMedia(null);
    setSelectedAudio(null);
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
    let videoThumbnailUrl = "";

    if (selectedMedia) {
      const folder = uploadType === "video" ? "videos" : "images";
      const url = await uploadFileToS3(selectedMedia, folder);

      if (url) {
        mediaPublicUrl = url;
      } else {
        setError("Fout bij uploaden van media.");
        setUploading(false);
        return;
      }

      if (uploadType === "video") {
        console.log("Generating thumbnail for video:", selectedMedia);
        const thumbnailLocalUri = await generateVideoThumbnail(selectedMedia);
        if (thumbnailLocalUri) {
          console.log("Thumbnail generated, uploading to S3...");
          const thumbnailUrl = await uploadFileToS3(thumbnailLocalUri, "video_thumbnails");
          if (thumbnailUrl) {
            videoThumbnailUrl = thumbnailUrl;
            console.log("Thumbnail uploaded successfully:", thumbnailUrl);
          } else {
            console.warn("Failed to upload thumbnail, continuing without thumbnail");
            // Don't fail the entire upload if thumbnail fails
            videoThumbnailUrl = "";
          }
        } else {
          console.warn("Failed to generate thumbnail, continuing without thumbnail");
          // Don't fail the entire upload if thumbnail generation fails
          videoThumbnailUrl = "";
        }
      }
    }

    if (selectedAudio) {
      const url = await uploadFileToS3(selectedAudio, "audio");
      if (url) {
        audioPublicUrl = url;
      } else {
        setError("Fout bij uploaden van audio.");
        setUploading(false);
        return;
      }
    }

    const newPost = {
      userId: currentUser?.id,
      media: mediaPublicUrl,
      mediaUrl: mediaPublicUrl,
      video_thumbnail: videoThumbnailUrl,
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

    try {
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
        navigation.goBack();
      }
    } catch (err) {
      setError("Er is iets misgegaan bij het opslaan van de post.");
    }

    setUploading(false);
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

  const renderArtistTags = () => {
    if (selectedArtistTags.length === 0) {
      return <Text style={styles.selectText}>Select</Text>;
    }
    return selectedArtistTags.map((tagId: string) => {
      const cleanId = tagId.trim();
      const tagObj = allArtistTags.find((t) => t.id.trim() === cleanId);
      if (!tagObj) {
        return (
          <Text key={cleanId} style={styles.selectedTagText}>
            {cleanId}
          </Text>
        );
      }
      return (
        <ArtistTag
          key={tagObj.id}
          id={tagObj.id}
          name={tagObj.name}
          image={tagObj.image}
          disableModuleOpen={true}
        />
      );
    });
  };

  const renderGenreTags = () => {
    if (selectedGenreTags.length === 0) {
      return <Text style={styles.selectText}>Select</Text>;
    }
    return selectedGenreTags.map((tagId: string) => {
      const cleanId = tagId.trim();
      const tagObj = allGenreTags.find((t) => t.id.trim() === cleanId);
      if (!tagObj) {
        const name = cleanId.replace(/^genre_/, "");
        return (
          <Text key={cleanId} style={styles.selectedTagText}>
            {name}
          </Text>
        );
      }
      return <GenreTag key={tagObj.id} id={tagObj.id} name={tagObj.name} />;
    });
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: "white", textAlign: "center", marginTop: 20 }}>
          Gebruikersgegevens laden...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>make a post</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        extraScrollHeight={20}
        enableOnAndroid={true}
        keyboardOpeningTime={0}
      >
        {/* Upload Type Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              uploadType === "video" && styles.toggleButtonActive
            ]}
            onPress={() => handleUploadTypeChange("video")}
          >
            <Text style={[
              styles.toggleButtonText,
              uploadType === "video" && styles.toggleButtonTextActive
            ]}>
              Video
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              uploadType === "photo" && styles.toggleButtonActive
            ]}
            onPress={() => handleUploadTypeChange("photo")}
          >
            <Text style={[
              styles.toggleButtonText,
              uploadType === "photo" && styles.toggleButtonTextActive
            ]}>
              Photo + Audio
            </Text>
          </TouchableOpacity>
        </View>

        {/* Media Preview */}
        <TouchableOpacity style={styles.mediaContainer} onPress={pickMedia}>
          {selectedMedia ? (
            <Image source={{ uri: selectedMedia }} style={styles.mediaPreview} />
          ) : (
            <View style={styles.mediaPlaceholder}>
              <Text style={styles.mediaPlaceholderText}>
                Tap to select {uploadType === "video" ? "video" : "photo"}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Audio Upload (alleen voor photo) */}
        {uploadType === "photo" && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Upload your audio</Text>
            <TouchableOpacity style={styles.audioButton} onPress={pickAudio}>
              <Text style={styles.audioButtonText}>
                {selectedAudio ? "Change Audio" : "Select Audio File"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Caption it in a few words: who and what are you looking for..."
            placeholderTextColor="#666"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell users a little bit more about the post and about you..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Artist Tags */}
        <View style={styles.section}>
          <View style={styles.tagRow}>
            <Text style={styles.sectionLabel}>Artist tags:</Text>
            <TouchableOpacity style={styles.tagSelector} onPress={goToArtistTagSelect}>
              <View style={styles.tagContent}>{renderArtistTags()}</View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Genre Tags */}
        <View style={styles.section}>
          <View style={styles.tagRow}>
            <Text style={styles.sectionLabel}>Genre tags:</Text>
            <TouchableOpacity style={styles.tagSelector} onPress={goToGenreTagSelect}>
              <View style={styles.tagContent}>{renderGenreTags()}</View>
            </TouchableOpacity>
          </View>
        </View>

        {/* I'm looking for */}
        <View style={styles.section}>
          <View style={styles.tagRow}>
            <Text style={styles.sectionLabel}>I'm looking for a:</Text>
            <TouchableOpacity style={styles.tagSelector}>
              <Text style={styles.selectText}>Select</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={uploading}
        >
          <Text style={styles.uploadButtonText}>
            {uploading ? "Uploading..." : "Post"}
          </Text>
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>Error: {error}</Text>}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default UploadScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    color: "white",
    fontSize: 24,
    fontWeight: "300",
  },
  headerTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  closeButton: {
    color: "white",
    fontSize: 24,
    fontWeight: "300",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#2a2a2a",
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#6B46C1",
  },
  toggleButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  toggleButtonTextActive: {
    color: "white",
  },
  mediaContainer: {
    width: "100%",
    height: 400,
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 30,
    backgroundColor: "#1a1a1a",
  },
  mediaPreview: {
    width: "100%",
    height: "100%",
  },
  mediaPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
  },
  mediaPlaceholderText: {
    color: "#666",
    fontSize: 16,
  },
  section: {
    marginBottom: 25,
  },
  sectionLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#2a2a2a",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    color: "white",
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  audioButton: {
    backgroundColor: "#2a2a2a",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
  },
  audioButtonText: {
    color: "#666",
    fontSize: 14,
  },
  tagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagSelector: {
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    minWidth: 80,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  selectText: {
    color: "#666",
    fontSize: 14,
  },
  selectedTagText: {
    color: "white",
    fontSize: 12,
    marginRight: 5,
  },
  uploadButton: {
    backgroundColor: "#6B46C1",
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 20,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "red",
    marginTop: 15,
    textAlign: "center",
    fontSize: 14,
  },
});