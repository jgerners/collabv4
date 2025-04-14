import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/authContext";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../routes";
import { SafeAreaView } from "react-native-safe-area-context";

// Functie om een pre-signed URL op te halen voor profielfoto's
const getPresignedUrl = async (
  uniqueName: string,
  contentType: string,
  uploadType: string
): Promise<string | null> => {
  try {
    const response = await fetch(
      `http://192.168.178.55:3000/get-presigned-url?fileName=${encodeURIComponent(
        uniqueName
      )}&contentType=${encodeURIComponent(contentType)}&uploadType=${uploadType}`
    );
    const json = await response.json();
    return json.url;
  } catch (error) {
    console.error("Error fetching presigned URL:", error);
    return null;
  }
};

// Functie om een bestand naar S3 te uploaden
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
    if (!presignedUrl) {
      throw new Error("Geen pre-signed URL ontvangen");
    }
    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    if (!uploadResponse.ok) {
      console.error("Upload naar S3 mislukt:", uploadResponse.statusText);
      return null;
    }
    // Stel de publieke URL samen voor profielfoto's
    if (uploadType === "profilepic") {
      return `https://collabprofilepic.s3.eu-north-1.amazonaws.com/${uniqueName}`;
    }
    return null;
  } catch (err) {
    console.error("Error in uploadFileToS3:", err);
    return null;
  }
};

export default function EditProfile() {
  const { profile, updateProfile } = useAuth();
  // Initiële waarden op basis van het bestaande profiel
  const [profilePic, setProfilePic] = useState(profile?.profile_pic || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [role, setRole] = useState(profile?.role || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [uploading, setUploading] = useState(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Profielfoto upload functie
  const chooseProfilePic = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const uploadedUrl = await uploadFileToS3(uri, "profilepics", "profilepic");
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

  // Profiel opslaan
  const handleSave = async () => {
    const updatedProfile = {
      profile_pic: profilePic,
      username,
      display_name: displayName,
      role,
      bio,
      // Andere velden (bijv. contactgegevens) worden hieronder ook opgeslagen
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
    <SafeAreaView style={styles.SafeAreaView}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        extraScrollHeight={20} // Dit verhoogt wat extra ruimte zodat je zicht op de input houdt
        enableOnAndroid={true}
        keyboardOpeningTime={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Edit Profile</Text>
        </View>

        {/* Profielfoto met edit-icoon */}
        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={chooseProfilePic}>
            <Image
              source={{ uri: profilePic || "https://via.placeholder.com/100" }}
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
            <TextInput style={styles.input} value={username} onChangeText={setUsername} />
            <Icon name="pencil" size={16} color="#A020F0" style={styles.editIcon} />
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Display Name</Text>
          <View style={styles.inputWrapper}>
            <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
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

        {/* Contact sectie */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Instagram</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} placeholder="Instagram URL" placeholderTextColor="#888" />
              <Icon name="pencil" size={16} color="#A020F0" style={styles.editIcon} />
            </View>
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Spotify</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} placeholder="Spotify URL" placeholderTextColor="#888" />
              <Icon name="pencil" size={16} color="#A020F0" style={styles.editIcon} />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{uploading ? "Uploading..." : "Save Profile"}</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  SafeAreaView: {
    flex: 1,
    backgroundColor: "#121212", // Zorgt voor een egale achtergrond (ook bovenaan)
  },
  container: {
    padding: 20,
    backgroundColor: "#121212",
    alignItems: "center",
    flexGrow: 1,
   
  },
  header: { marginBottom: 20 },
  headerText: { color: "white", fontSize: 24, fontWeight: "bold" },
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
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  editIconOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#A020F0",
    borderRadius: 12,
    padding: 4,
  },
  fieldContainer: { width: "100%", marginBottom: 15 },
  label: { color: "gray", marginBottom: 5 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  input: { flex: 1, color: "white", paddingVertical: 8 },
  editIcon: { marginLeft: 8 },
  section: { width: "100%", marginVertical: 20 },
  sectionTitle: { color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  saveButton: {
    backgroundColor: "#A020F0",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
