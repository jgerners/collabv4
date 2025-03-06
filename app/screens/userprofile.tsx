// UserProfileScreen.tsx
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { RootStackParamList } from "../../routes";
import { RouteProp } from "@react-navigation/native";

// Stel dat je dummy gebruikersdata hebt; importeer die
import dummyUsers from "../../dummy_data/dummy_id";

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

interface UserProfileScreenProps {
  route: UserProfileRouteProp;
}


const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ route }) => {
  // Stap 1: Haal de userId uit de route parameters

  const { userId } = route.params;

  // Stap 2: Zoek de gebruiker in je dummy data op basis van de userId
  const user = dummyUsers.find((u) => u.userId === userId);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  // Stap 3: Weergeef de profielgegevens van de gebruiker
  return (
    <View style={styles.container}>
      <Image
        source={
          typeof user.userProfile === "string"
            ? { uri: user.userProfile }
            : user.userProfile
        }
        style={styles.profileImage}
      />
      <Text style={styles.username}>{user.userName}</Text>
      <Text style={styles.bio}>{user.bio}</Text>
      {/* Voeg hier eventueel meer profielinformatie toe, zoals posts of contactgegevens */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    paddingTop: 130,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  username: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  bio: {
    color: "gray",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});

export default UserProfileScreen;
