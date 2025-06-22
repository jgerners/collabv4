import React from "react";
import { Text, StyleSheet, Dimensions } from "react-native";

// Bereken de schaalfactor (als je dit op meerdere plekken wilt hergebruiken kun je dit eventueel in een apart util-bestand plaatsen)
const { width: windowWidth } = Dimensions.get("window");
const scale = windowWidth / 370;

interface UserRoleProps {
  role: string;
  style?: object;
}

const UserRole: React.FC<UserRoleProps> = ({ role }) => {
  if (!role) return null;
  return <Text style={styles.userRole}>{role}</Text>;
};

const styles = StyleSheet.create({
  userRole: {
    color: "white",
    fontSize: scale * 10, // iets kleiner dan de username
    marginTop: scale * 2,
  },
});

export default UserRole;
