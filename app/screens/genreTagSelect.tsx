import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button } from "react-native";
import { useGenreTags } from "../../hooks/useGenreTags";
import { useNavigation, useRoute } from "@react-navigation/native";


export interface GenreTag {
  id: string;
  name: string;
}

const GenreTagSelectScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { genreTags, loading, error } = useGenreTags();
  const [selectedGenreTags, setSelectedGenreTags] = useState<string[]>([]);

  const toggleTag = (tagId: string) => {
    setSelectedGenreTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = () => {
    if (route.params?.onSave) {
      route.params.onSave(selectedGenreTags);
    }
    navigation.goBack();
  };
  

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>Loading genre tags...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading genre tags: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Selecteer Genre-Tags</Text>
      <FlatList
        data={genreTags}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.tagButton,
              selectedGenreTags.includes(item.id) && styles.selectedTagButton,
            ]}
            onPress={() => toggleTag(item.id)}
          >
            <Text style={styles.tagText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      <Button title="Opslaan" onPress={handleSave} />
    </View>
  );
};

export default GenreTagSelectScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 16,
  },
  header: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  infoText: {
    color: "#ccc",
  },
  errorText: {
    color: "red",
  },
  tagButton: {
    backgroundColor: "#1E1E1E",
    padding: 10,
    marginVertical: 5,
    borderRadius: 6,
  },
  selectedTagButton: {
    backgroundColor: "#A020F0",
  },
  tagText: {
    color: "#fff",
  },
});
