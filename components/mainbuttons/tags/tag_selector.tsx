// components/tags/TagSelector.tsx
import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import ArtistTag from "./artist_tags";
import GenreTag from "./genre_tags";

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
  artistTags: ArtistTagData[];
  genreTags: GenreTagData[];
}

const TagSelector: React.FC<TagSelectorProps> = ({
  artistTags,
  genreTags,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Artiest Tags</Text>
      <FlatList
        data={artistTags}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ArtistTag id={item.id} name={item.name} image={item.image} />
        )}
        contentContainerStyle={styles.listContainer}
        showsHorizontalScrollIndicator={false}
      />
      <Text style={styles.sectionTitle}>Genre/Stijl Tags</Text>
      <FlatList
        data={genreTags}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <GenreTag id={item.id} name={item.name} />}
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
});

export default TagSelector;
