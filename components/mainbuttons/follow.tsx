// Follow.tsx
import React from "react";
import { TouchableOpacity, StyleSheet, ActivityIndicator, View, Text } from "react-native";
import { useFollow } from "../../hooks/useFollow";
import { Ionicons } from '@expo/vector-icons';



interface FollowProps {
  followerId: string;
  followingId: string;
}

const Follow: React.FC<FollowProps> = ({ followerId, followingId }) => {
  const { isFollowing, loading, error, toggleFollow } = useFollow({ followerId, followingId });



  if (loading) {
    return <ActivityIndicator size="small" color="gray" />;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleFollow} style={styles.iconButton}>
        <Ionicons
          name={isFollowing ? "checkmark-circle" : "person-add-outline"}
          size={22}
          color="white"
        />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconButton: {
    
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center'
  },
});

export default Follow;
