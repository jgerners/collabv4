import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import ArtistTag from "./artist_tags";
import GenreTag from "./genre_tags";
import { useArtistTags } from "../../../hooks/useArtistTags";
import { useGenreTags } from "../../../hooks/useGenreTags";

export interface ArtistTagData {
  id: string;
  name: string;
  image: string;
}

export interface GenreTagData {
  id: string;
  name: string;
}

interface TagSelectorProps {
  onSelectionChange: (selected: string[]) => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({ onSelectionChange }) => {
  // Haal de tags op via de aparte hooks:
  const { artistTags, loading: artistLoading, error: artistError } = useArtistTags();
  const { genreTags, loading: genreLoading, error: genreError } = useGenreTags();

  // Houd lokaal de geselecteerde tag-ID's bij
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Toggle-functie om een tag te selecteren of deselecteren
  const toggleTag = (tagId: string) => {
    let newSelection: string[];
    if (selectedTags.includes(tagId)) {
      newSelection = selectedTags.filter((id) => id !== tagId);
    } else {
      newSelection = [...selectedTags, tagId];
    }
    setSelectedTags(newSelection);
    onSelectionChange(newSelection);
  };

  if (artistLoading || genreLoading) {
    return <Text style={styles.loadingText}>Loading tags...</Text>;
  }
  if (artistError || genreError) {
    return <Text style={styles.errorText}>Error loading tags</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Artiest Tags</Text>
      <FlatList
        data={artistTags}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.tagButton,
              selectedTags.includes(item.id) && styles.selectedTagButton,
            ]}
            onPress={() => toggleTag(item.id)}
          >
            <ArtistTag id={item.id} name={item.name} image={item.image} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
        showsHorizontalScrollIndicator={false}
      />
      <Text style={styles.sectionTitle}>Genre/Stijl Tags</Text>
      <FlatList
        data={genreTags}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.tagButton,
              selectedTags.includes(item.id) && styles.selectedTagButton,
            ]}
            onPress={() => toggleTag(item.id)}
          >
            <GenreTag id={item.id} name={item.name} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 8,
  },
  listContainer: {
    paddingVertical: 8,
  },
  tagButton: {
    marginRight: 8,
  },
  selectedTagButton: {
    borderWidth: 1,
    borderColor: "#A020F0",
    borderRadius: 10,
    padding: 2,
  },
  loadingText: {
    color: "#aaa",
  },
  errorText: {
    color: "red",
  },
});

export default TagSelector;
