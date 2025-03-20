import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useAuth } from "../../context/authContext";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../routes"; // Zorg dat dit pad klopt


export default function EditProfile() {
  const { profile, updateProfile } = useAuth(); // updateProfile: functie om profiel bij te werken
  // Stel initiële waarden in op basis van het bestaande profiel
  const [profilePic, setProfilePic] = useState(profile?.profile_pic || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [role, setRole] = useState(profile?.role || "");
  const [bio, setBio] = useState(profile?.bio || "");
  // Placeholder voor andere secties (muziek, contact, etc.)

  // Initialiseer de navigator met het juiste type
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  

  const handleSave = async () => {
    const updatedProfile = {
      profile_pic: profilePic,
      username,
      display_name: displayName,
      role,
      bio,
      // Voeg hier eventueel andere velden toe
    };

    try {
      await updateProfile(updatedProfile);
      // Na succesvol opslaan, navigeer naar de Profile-tab binnen de Main-navigator
      console.log("Updating profile with:", updatedProfile); // Log de waarden
      navigation.navigate("Main", { screen: "Profile" });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Functie voor het kiezen van een nieuwe profielfoto (placeholder)
  const chooseProfilePic = () => {
    // Open de image picker en update setProfilePic met de nieuwe URL of local URI.
    console.log("Kies een nieuwe profielfoto");
  };

  // Functie voor het toevoegen van nieuwe media (demo's/releases)
  const addMedia = () => {
    console.log("Voeg nieuw mediabestand toe");
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
          <TextInput
            style={styles.input}
            value={role}
            onChangeText={setRole}
          />
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

      {/* Muziek sectie (demo's en releases) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Muziek</Text>
        <View style={styles.mediaContainer}>
          {/* Toon al bestaande media als grid-items */}
          {Array(3)
            .fill(null)
            .map((_, index) => (
              <View key={index} style={styles.mediaItem} />
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
        <Text style={styles.saveButtonText}>Save Profile</Text>
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
    backgroundColor: "#333",
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 10,
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


