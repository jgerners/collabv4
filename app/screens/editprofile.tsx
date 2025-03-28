import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/authContext";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../routes";

export default function EditProfile() {
  const { profile, updateProfile } = useAuth();
  // Stel initiële waarden in op basis van het bestaande profiel
  const [profilePic, setProfilePic] = useState(profile?.profile_pic || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [role, setRole] = useState(profile?.role || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [uploading, setUploading] = useState(false);
  // State voor demo media (als array van URL's)
  const [demoMedia, setDemoMedia] = useState<string[]>([]);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // ---------------------------
  //   1. Profielfoto upload
  // ---------------------------
  // Helper functie: Haal pre-signed URL op voor profielfoto (uploadType=profilepic)
  const getPresignedUrlProfile = async (
    uniqueName: string,
    contentType: string
  ): Promise<string | null> => {
    try {
      const url = `http://192.168.178.31:3000/get-presigned-url?fileName=${encodeURIComponent(
        uniqueName
      )}&contentType=${encodeURIComponent(contentType)}&uploadType=profilepic`;
      const response = await fetch(url);
      const json = await response.json();
      return json.url;
    } catch (error) {
      console.error("Error fetching presigned URL for profile picture:", error);
      return null;
    }
  };

  // Helper functie: Upload de profielfoto naar S3
  const uploadProfilePicToS3 = async (fileUri: string): Promise<string | null> => {
    try {
      setUploading(true);
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const fileName = fileUri.split("/").pop();
      const uniqueName = `profilepics/${Date.now()}_${fileName}`;

      const contentType = blob.type || "application/octet-stream";

      const presignedUrl = await getPresignedUrlProfile(uniqueName, contentType);
      if (!presignedUrl) {
        throw new Error("Geen pre-signed URL ontvangen");
      }

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

      const publicUrl = `https://collabprofilepic.s3.eu-north-1.amazonaws.com/${uniqueName}`;
      return publicUrl;
    } catch (err) {
      console.error("Error in uploadProfilePicToS3:", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const chooseProfilePic = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const uploadedUrl = await uploadProfilePicToS3(uri);
        if (uploadedUrl) {
          setProfilePic(uploadedUrl);
          Alert.alert("Succes", "Profielfoto geüpdatet!");
        } else {
          Alert.alert("Fout", "Er is iets misgegaan bij het uploaden.");
        }
      }
    } catch (error) {
      console.error("Error bij het kiezen van profielfoto:", error);
      Alert.alert("Fout", "Kon geen profielfoto selecteren.");
    }
  };

  // ---------------------------
  //   2. Demo media upload (Profilemedia)
  // ---------------------------
  // Helper functie: Haal pre-signed URL op voor demo media (uploadType=profilemedia)
  const getPresignedUrlProfileMedia = async (
    uniqueName: string,
    contentType: string
  ): Promise<string | null> => {
    try {
      const url = `http://192.168.178.31:3000/get-presigned-url?fileName=${encodeURIComponent(
        uniqueName
      )}&contentType=${encodeURIComponent(contentType)}&uploadType=profilemedia`;
      const response = await fetch(url);
      const json = await response.json();
      return json.url;
    } catch (error) {
      console.error("Error fetching presigned URL for profile media:", error);
      return null;
    }
  };

  // Helper functie: Upload demo media naar S3
  const uploadProfileMediaToS3 = async (fileUri: string): Promise<string | null> => {
    try {
      setUploading(true);
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const fileName = fileUri.split("/").pop();
      // Gebruik een map/prefix als 'demos' (kan je aanpassen naar wens)
      const uniqueName = `demos/${Date.now()}_${fileName}`;

      const contentType = blob.type || "application/octet-stream";

      const presignedUrl = await getPresignedUrlProfileMedia(uniqueName, contentType);
      if (!presignedUrl) {
        throw new Error("Geen pre-signed URL ontvangen");
      }

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

      // Stel de publieke URL samen voor de profilemedia bucket
      const publicUrl = `https://collabprofilemedia.s3.eu-north-1.amazonaws.com/${uniqueName}`;
      return publicUrl;
    } catch (err) {
      console.error("Error in uploadProfileMediaToS3:", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Functie voor het kiezen en uploaden van demo media
  const addMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const uploadedUrl = await uploadProfileMediaToS3(uri);
        if (uploadedUrl) {
          setDemoMedia([...demoMedia, uploadedUrl]);
          Alert.alert("Succes", "Demo media geüpload!");
        } else {
          Alert.alert("Fout", "Er is iets misgegaan bij het uploaden.");
        }
      }
    } catch (error) {
      console.error("Error bij het kiezen van demo media:", error);
      Alert.alert("Fout", "Kon geen demo media selecteren.");
    }
  };

  // ---------------------------
  //   3. Profiel opslaan
  // ---------------------------
  const handleSave = async () => {
    const updatedProfile = {
      profile_pic: profilePic,
      username,
      display_name: displayName,
      role,
      bio,
      // Voeg hier eventueel andere velden toe (Instagram, Spotify, demo_media, etc.)
      demos: demoMedia, // Bijvoorbeeld opslaan als JSON/array in de database
    };

    try {
      await updateProfile(updatedProfile);
      console.log("Updating profile with:", updatedProfile);
      navigation.navigate("Main", { screen: "Profile" });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Edit Profile</Text>
      </View>

      {/* Profielfoto met edit-icoon */}
      <View style={styles.profileImageContainer}>
        <TouchableOpacity onPress={chooseProfilePic}>
          <Image
            source={{
              uri: profilePic || "https://via.placeholder.com/100",
            }}
            style={styles.profileImage}
          />
          <View style={styles.editIconOverlay}>
            <Icon name="pencil" size={16} color="white" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Persoonlijke info */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Username</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />
          <Icon name="pencil" size={16} color="#A020F0" style={styles.editIcon} />
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Display Name</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
          />
          <Icon name="pencil" size={16} color="#A020F0" style={styles.editIcon} />
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Role</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} value={role} onChangeText={setRole} />
          <Icon name="pencil" size={16} color="#A020F0" style={styles.editIcon} />
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Bio</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={bio}
            onChangeText={setBio}
            multiline
          />
          <Icon name="pencil" size={16} color="#A020F0" style={styles.editIcon} />
        </View>
      </View>

      {/* Muziek sectie (Demo's en releases) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Muziek</Text>
        <View style={styles.mediaContainer}>
          {/* Toon bestaande demo media als grid-items */}
          {demoMedia.map((mediaUrl, index) => (
            <Image
              key={index}
              source={{ uri: mediaUrl }}
              style={styles.mediaItem}
            />
          ))}
          {/* Plus-icoon voor toevoegen */}
          <TouchableOpacity onPress={addMedia} style={styles.addMediaButton}>
            <Icon name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contact sectie */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Instagram</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Instagram URL"
              placeholderTextColor="#888"
            />
            <Icon name="pencil" size={16} color="#A020F0" style={styles.editIcon} />
          </View>
        </View>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Spotify</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Spotify URL"
              placeholderTextColor="#888"
            />
            <Icon name="pencil" size={16} color="#A020F0" style={styles.editIcon} />
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>
          {uploading ? "Uploading..." : "Save Profile"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#121212",
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
  },
  headerText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIconOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#A020F0",
    borderRadius: 12,
    padding: 4,
  },
  fieldContainer: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    color: "gray",
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    color: "white",
    paddingVertical: 8,
  },
  editIcon: {
    marginLeft: 8,
  },
  section: {
    width: "100%",
    marginVertical: 20,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  mediaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  mediaItem: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: "#333",
  },
  addMediaButton: {
    width: 80,
    height: 80,
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#A020F0",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
