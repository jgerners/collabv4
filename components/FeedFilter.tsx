import React from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native"

type Props = {
  allGenres: { id: string; name: string }[]
  allArtists: { id: string; name: string }[]
  selectedGenres: string[]
  selectedArtists: string[]
  onSelectGenre: (id: string) => void
  onSelectArtist: (id: string) => void
  onClose: () => void
}

const FeedFilter: React.FC<Props> = ({
  allGenres, allArtists, selectedGenres, selectedArtists,
  onSelectGenre, onSelectArtist, onClose
}) => {
  return (
    <View style={styles.overlay}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Filter op genres</Text>
        <View style={styles.row}>
          {allGenres.map(g => (
            <TouchableOpacity
              key={g.id}
              style={[
                styles.chip,
                selectedGenres.includes(g.id) && styles.chipActive
              ]}
              onPress={() => onSelectGenre(g.id)}
            >
              <Text style={{ color: "#fff" }}>{g.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.title}>Filter op artiesten</Text>
        <View style={styles.row}>
          {allArtists.map(a => (
            <TouchableOpacity
              key={a.id}
              style={[
                styles.chip,
                selectedArtists.includes(a.id) && styles.chipActive
              ]}
              onPress={() => onSelectArtist(a.id)}
            >
              <Text style={{ color: "#fff" }}>{a.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Sluiten</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000c", justifyContent: "center", zIndex: 50 },
  content: { backgroundColor: "#181818", margin: 32, borderRadius: 20, padding: 24, maxHeight: 540 },
  title: { color: "#fff", fontSize: 17, fontWeight: "bold", marginVertical: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chip: { backgroundColor: "#242424", borderRadius: 15, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: "#4169e1" },
  closeButton: { marginTop: 18, alignSelf: "flex-end", padding: 10, backgroundColor: "#333", borderRadius: 9 }
})

export default FeedFilter
