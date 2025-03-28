// ProfileMediaScreen.tsx
import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Image 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/authContext";

// Haal een pre-signed URL op vanuit de backend
const getPresignedUrl = async (
  uniqueName: string,
  contentType: string,
  uploadType: string
): Promise<string | null> => {
  try {
    const response = await fetch(
      `http://192.168.178.171:3000/get-presigned-url?fileName=${encodeURIComponent(uniqueName)}&contentType=${encodeURIComponent(contentType)}&uploadType=${uploadType}`
    );
    const json = await response.json();
    return json.url;
  } catch (error) {
    console.error("Error fetching presigned URL:", error);
    return null;
  }
};

// Upload een bestand naar S3
const uploadFileToS3 = async (
  fileUri: string,
  folder: string,
  uploadType: string
): Promise<string | null> => {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const fileName = fileUri.split("/").pop();
    const uniqueName = `${folder}/${Date.now()}_${fileName}`;
    const contentType = blob.type || "application/octet-stream";
    const presignedUrl = await getPresignedUrl(uniqueName, contentType, uploadType);
    if (!presignedUrl) throw new Error("Geen pre-signed URL ontvangen");
    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    if (!uploadResponse.ok) {
      console.error("Upload naar S3 mislukt:", uploadResponse.statusText);
      return null;
    }
    // Stel de publieke URL samen voor de bucket collabprofilemedia
    return `https://collabprofilemedia.s3.eu-north-1.amazonaws.com/${uniqueName}`;
  } catch (err) {
    console.error("Error in uploadFileToS3:", err);
    return null;
  }
};

// Genereer een video-thumbnail met expo-video-thumbnails
const generateVideoThumbnail = async (videoUri: string): Promise<string | null> => {
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time: 1500 });
    return uri;
  } catch (e) {
    console.warn("Error generating video thumbnail:", e);
    return null;
  }
};

const ProfileMediaScreen: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  // Media-object: { media: string, video_thumbnail?: string }
  const [mediaObject, setMediaObject] = useState<{ media: string; video_thumbnail?: string } | null>(null);
  // Extra state voor audio (voor foto's)
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const navigation = useNavigation();
  const { profile } = useAuth();

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        // Check of het een video betreft (eenvoudige extensie-check)
        if (uri.toLowerCase().endsWith(".mp4") || uri.toLowerCase().endsWith(".mov")) {
          // Upload de video naar "videos" in collabprofilemedia
          const videoUrl = await uploadFileToS3(uri, "videos", "profilemedia");
          if (!videoUrl) {
            Alert.alert("Fout", "Video upload mislukt.");
            return;
          }
          // Genereer de thumbnail
          const thumbnailLocalUri = await generateVideoThumbnail(uri);
          let thumbUrl = "";
          if (thumbnailLocalUri) {
            // Upload de thumbnail naar "video_thumbnails" in collabprofilemedia
            thumbUrl = (await uploadFileToS3(thumbnailLocalUri, "video_thumbnails", "profilemedia")) || "";
          }
          setMediaObject({ media: videoUrl, video_thumbnail: thumbUrl });
          // Voor video is er geen extra audio nodig
          setAudioUrl(null);
          Alert.alert("Succes", "Video en thumbnail geüpload!");
        } else {
          // Als het een afbeelding betreft, upload deze naar "demos" in collabprofilemedia
          const imageUrl = await uploadFileToS3(uri, "demos", "profilemedia");
          if (!imageUrl) {
            Alert.alert("Fout", "Afbeelding upload mislukt.");
            return;
          }
          setMediaObject({ media: imageUrl });
          Alert.alert("Succes", "Afbeelding geüpload! Voeg nu audio toe (optioneel).");
        }
      }
    } catch (error) {
      console.error("Error bij het kiezen van media:", error);
      Alert.alert("Fout", "Kon geen media selecteren.");
    }
  };

  // Functie om audio te selecteren en uploaden (alleen voor afbeeldingen)
  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
      if (!result.canceled && result.assets?.length > 0) {
        const audioUri = result.assets[0].uri;
        const uploadedAudioUrl = await uploadFileToS3(audioUri, "audio", "profilemedia");
        if (uploadedAudioUrl) {
          setAudioUrl(uploadedAudioUrl);
          Alert.alert("Succes", "Audio geüpload!");
        } else {
          Alert.alert("Fout", "Audio upload mislukt.");
        }
      }
    } catch (error) {
      console.error("Error bij het kiezen van audio:", error);
      Alert.alert("Fout", "Kon geen audio selecteren.");
    }
  };

  // Functie om de media (en audio, indien aanwezig) op te slaan in de demos-tabel
  const handleSaveMedia = async () => {
    if (!mediaObject) {
      Alert.alert("Fout", "Er is geen media om op te slaan.");
      return;
    }
    // Bouw het nieuwe demo-record op
    const newDemo = {
      profile_id: profile?.id, // Zorg dat dit overeenkomt met je database
      media_url: mediaObject.media,
      thumbnail: mediaObject.video_thumbnail ? mediaObject.video_thumbnail : mediaObject.media,
      audio_url: audioUrl, // Dit veld bevat de audio, indien geüpload (bij afbeeldingen)
      timestamp: new Date().toISOString(),
      // Voeg extra velden toe indien nodig (bijv. description)
    };

    const { error } = await supabase
      .from("demos")
      .insert([newDemo])
      .select();

    if (error) {
      Alert.alert("Fout", "Er is iets misgegaan bij het opslaan van de demo.");
      console.error("Database insert error:", error);
    } else {
      Alert.alert("Succes", "Demo opgeslagen!");
      navigation.goBack();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerText}>Upload Profile Media</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={pickMedia}>
        <Text style={styles.uploadText}>Select Media</Text>
      </TouchableOpacity>
      {mediaObject && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Preview:</Text>
          <Image
            source={{
              uri: mediaObject.video_thumbnail ? mediaObject.video_thumbnail : mediaObject.media,
            }}
            style={styles.previewImage}
          />
        </View>
      )}
      {/* Toon de audio upload-knop alleen als het een afbeelding betreft */}
      {mediaObject && !mediaObject.video_thumbnail && (
        <TouchableOpacity style={styles.uploadBox} onPress={pickAudio}>
          <Text style={styles.uploadText}>Select Audio (optioneel)</Text>
        </TouchableOpacity>
      )}
      {audioUrl && (
        <View style={styles.audioPreview}>
          <Text style={{ color: "white" }}>Audio toegevoegd</Text>
        </View>
      )}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveMedia}>
        <Text style={styles.saveButtonText}>
          {uploading ? "Uploading..." : "Save Media"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#121212", alignItems: "center" },
  headerText: { color: "white", fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  uploadBox: {
    backgroundColor: "#1E1E1E",
    padding: 20,
    marginBottom: 15,
    alignItems: "center",
    borderRadius: 8,
  },
  uploadText: { color: "#A0A0A0" },
  previewContainer: { marginVertical: 20, alignItems: "center" },
  previewLabel: { color: "white", marginBottom: 10, fontSize: 16 },
  previewImage: { width: 200, height: 200, borderRadius: 10 },
  audioPreview: { marginVertical: 10 },
  saveButton: {
    backgroundColor: "#A020F0",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});

export default ProfileMediaScreen;
