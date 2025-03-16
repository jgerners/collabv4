// profilepic.tsx
import React from "react";
import { Image, StyleSheet } from "react-native";

interface ProfilePicProps {
  uri: string ; 
}

const ProfilePic: React.FC<ProfilePicProps> = ({ uri }) => {
  return (
    <Image
    source={{ uri }}
      style={styles.profilePic}
      resizeMode="cover"
    />
  );
};

const styles = StyleSheet.create({
  profilePic: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    overflow: "hidden", // ✅ Voorkomt dat de afbeelding buiten het rondje valt
  },
});

export default ProfilePic;
