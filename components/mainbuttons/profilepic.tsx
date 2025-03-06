// profilepic.tsx
import React from "react";
import { Image, StyleSheet } from "react-native";

interface ProfilePicProps {
  source: string | number;
}

const ProfilePic: React.FC<ProfilePicProps> = ({ source }) => {
  return (
    <Image
      source={typeof source === "string" ? { uri: source } : source}
      style={styles.profilePic}
    />
  );
};

const styles = StyleSheet.create({
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default ProfilePic;
