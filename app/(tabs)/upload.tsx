import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
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
import ProfileLink from "../../components/profileLink";
import ArtistTag from "../../components/mainbuttons/tags/artist_tags";
import GenreTag from "../../components/mainbuttons/tags/genre_tags";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

// ExtendedUser interface; pas dit aan indien nodig
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
      `http://192.168.178.143:3000/get-presigned-url?fileName=${encodeURIComponent(
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

  // Volledige gebruiker ophalen uit Supabase (pas de tabelnaam "profiles" aan indien nodig)
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null);
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
            displayName: data.display_name, // Zorg dat dit overeenkomt met jouw databaseveld
            role: data.role,
            profileImage: data.profile_pic, // Pas aan indien je veld anders heet
          };
          setCurrentUser(formattedUser);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Volledige lijst met tags ophalen uit de database
  const [allArtistTags, setAllArtistTags] = useState<any[]>([]);
  const [allGenreTags, setAllGenreTags] = useState<any[]>([]);
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

  // Overige states voor upload en content
  const [uploadType, setUploadType] = useState<"video" | "photo">("video");
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // De geselecteerde tags worden hier als arrays van id's opgeslagen (bijv. "artist_1")
  const [selectedArtistTags, setSelectedArtistTags] = useState<string[]>([]);
  const [selectedGenreTags, setSelectedGenreTags] = useState<string[]>([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);

  const windowWidth = Dimensions.get("window").width;
  const scale = windowWidth / 370;

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
      }
    } catch (err) {
      console.error("Fout bij post-insert:", err);
      setError("Er is iets misgegaan bij het opslaan van de post.");
    }
    setUploading(false);
    console.log("handleUpload beëindigd");
  };

  // Navigatie naar de tag-selectie-schermen (let op: doorgeven van functies geeft een non-serializable warning)
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

  // Render helper voor artist-tags: lookup in de opgehaalde "allArtistTags"-lijst
  const renderArtistTags = () => {
    if (selectedArtistTags.length === 0) {
      return <Text style={styles.previewTagText}>Artist Tags</Text>;
    }
    return selectedArtistTags.map((tagId: string) => {
      const cleanId = tagId.trim();
      const tagObj = allArtistTags.find((t) => t.id.trim() === cleanId);
      if (!tagObj) {
        return <Text key={cleanId} style={styles.previewTagText}>{cleanId}</Text>;
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

  // Render helper voor genre-tags: lookup in de opgehaalde "allGenreTags"-lijst en toon alleen de naam
  const renderGenreTags = () => {
    if (selectedGenreTags.length === 0) {
      return <Text style={styles.previewTagText}>Genre Tags</Text>;
    }
    return selectedGenreTags.map((tagId: string) => {
      const cleanId = tagId.trim();
      const tagObj = allGenreTags.find((t) => t.id.trim() === cleanId);
      if (!tagObj) {
        const name = cleanId.replace(/^genre_/, "");
        return <Text key={cleanId} style={styles.previewTagText}>{name}</Text>;
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
       {/* Close-knop bovenaan */}
       <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeTxt}>×</Text>
      </TouchableOpacity>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.contentContainer}
        extraScrollHeight={20}
        enableOnAndroid={true}
        keyboardOpeningTime={0}
      >
        {/* Toggle voor Video / Photo Upload */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              uploadType === "video" && styles.activeToggleButton,
            ]}
            onPress={() => setUploadType("video")}
          >
            <Text
              style={[
                styles.toggleText,
                uploadType === "video" && styles.activeToggleText,
              ]}
            >
              Video Upload
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              uploadType === "photo" && styles.activeToggleButton,
            ]}
            onPress={() => setUploadType("photo")}
          >
            <Text
              style={[
                styles.toggleText,
                uploadType === "photo" && styles.activeToggleText,
              ]}
            >
              Photo Upload
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preview Card */}
        <View style={styles.previewCard}>
          {/* Header: Profile en Tags */}
          <View style={styles.previewHeader}>
            <View style={styles.profileContainer}>
              <ProfileLink userId={currentUser.id}>
                <Image
                  source={{
                    uri: currentUser.profileImage || "https://via.placeholder.com/30",
                  }}
                  style={styles.profilePic}
                />
              </ProfileLink>
              <ProfileLink userId={currentUser.id}>
                <View style={styles.userInfo}>
                  <Text style={styles.usernameText}>
                    {currentUser.username || "YourUsername"}
                  </Text>
                  <Text style={styles.displayNameText}>
                    {currentUser.displayName || "Display Name"}{" "}
                    <Text style={styles.dot}>•</Text> {currentUser.role || "Role"}
                  </Text>
                </View>
              </ProfileLink>
            </View>
            {/* Tags-sectie */}
            <View style={styles.previewTagsContainer}>
              <TouchableOpacity onPress={goToArtistTagSelect}>
                <View style={styles.artistTagsContainerHeader}>
                  {renderArtistTags()}
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={goToGenreTagSelect}>
                <View style={styles.genreTagsContainerHeader}>
                  {renderGenreTags()}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Media Container met overlay voor Title en Description */}
          <TouchableOpacity style={styles.previewMediaContainer} onPress={pickMedia}>
            {selectedMedia ? (
              <Image source={{ uri: selectedMedia }} style={styles.previewMedia} />
            ) : (
              <View style={styles.previewMediaPlaceholder}>
                <Text style={styles.previewMediaPlaceholderText}>Select Media</Text>
              </View>
            )}
            <View style={styles.mediaOverlay}>
              {editingTitle ? (
                <TextInput
                  style={styles.titleInput}
                  value={title}
                  onChangeText={setTitle}
                  onBlur={() => setEditingTitle(false)}
                  placeholder="Post Title"
                  placeholderTextColor="#aaa"
                  autoFocus
                />
              ) : (
                <TouchableOpacity onPress={() => setEditingTitle(true)}>
                  <Text style={styles.previewPostTitle}>
                    {title || "Post Title"}
                  </Text>
                </TouchableOpacity>
              )}
              {editingDescription ? (
                <TextInput
                  style={styles.descriptionInput}
                  value={description}
                  onChangeText={setDescription}
                  onBlur={() => setEditingDescription(false)}
                  placeholder="Post Description"
                  placeholderTextColor="#aaa"
                  multiline
                  autoFocus
                />
              ) : (
                <TouchableOpacity onPress={() => setEditingDescription(true)}>
                  <Text style={styles.previewPostDescription}>
                    {description || "Post Description..."}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>

          {/* Audio Upload knop (alleen bij photo-upload) */}
          {uploadType === "photo" && (
            <TouchableOpacity style={styles.audioUploadButton} onPress={pickAudio}>
              <Text style={styles.audioUploadButtonText}>
                {selectedAudio ? "Change Audio" : "Select Audio"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Upload knop */}
          <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
            <Text style={styles.uploadButtonText}>
              {uploading ? "Uploading..." : "Upload"}
            </Text>
          </TouchableOpacity>
          {error && <Text style={styles.errorText}>Error: {error}</Text>}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default UploadScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ translateY: -20 }],
    paddingBottom: 20,
  },
  closeBtn: {
    position: 'absolute',
    bottom: 720,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  closeTxt: {
    color: 'white',
    fontSize: 28,
    lineHeight: 28,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "black",
    padding: 6,
    borderRadius: 10,
    marginBottom: 10,
    width: "75%",
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
  previewCard: {
    backgroundColor: "black",
    borderRadius: 15,
    padding: 10,
    width: "90%",
    height: Dimensions.get("window").height * 0.6,
    alignSelf: "center",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profilePic: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#555",
    marginRight: 10,
  },
  userInfo: {},
  usernameText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  displayNameText: {
    color: "#ccc",
    fontSize: 12,
  },
  dot: {
    marginHorizontal: 4,
  },
  previewTagsContainer: {
    alignItems: "flex-end",
  },
  artistTagsContainerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  genreTagsContainerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 5,
  },
  previewTagText: {
    color: "#A0A0A0",
    fontSize: 12,
  },
  previewMediaContainer: {
    width: "100%",
    height: 450,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 10,
  },
  previewMedia: {
    width: "100%",
    height: "100%",
  },
  previewMediaPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  previewMediaPlaceholderText: {
    color: "#aaa",
  },
  mediaOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
  },
  previewPostTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  previewPostDescription: {
    color: "white",
    fontSize: 14,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  titleInput: {
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    padding: 5,
  },
  descriptionInput: {
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "white",
    fontSize: 14,
    padding: 5,
    marginTop: 5,
  },
  audioUploadButton: {
    backgroundColor: "#1E1E1E",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  audioUploadButtonText: {
    color: "#A0A0A0",
  },
  uploadButton: {
    backgroundColor: "#A020F0",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  uploadButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
});
