// FeedHeader.tsx

import React, { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import * as Font from "expo-font"

export interface FeedHeaderProps {
  allGenres: { id: string; name: string }[]
  allArtists: { id: string; name: string }[]
  selectedGenres: string[]
  selectedArtists: string[]
  onSelectGenre: (id: string) => void
  onSelectArtist: (id: string) => void
  search: string
  setSearch: (v: string) => void
  onSearchFocus: () => void
}

const FeedHeader: React.FC<FeedHeaderProps> = ({
  allGenres,
  allArtists,
  selectedGenres,
  selectedArtists,
  onSelectGenre,
  onSelectArtist,
  search,
  setSearch,
  onSearchFocus,
}) => {
  const insets = useSafeAreaInsets()
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [filtersVisible, setFiltersVisible] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<"artist" | "genre" | null>(null)

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          Manrope: require("../assets/fonts/Manrope-VariableFont_wght.ttf"),
        })
        setFontsLoaded(true)
      } catch (error) {
        setFontsLoaded(true)
      }
    }
    loadFonts()
  }, [])

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Search bar + 'For you' button */}
      <View style={styles.row}>
        <View style={styles.searchWrapper}>
          <MaterialIcons name="search" size={20} color="#AAA" style={{ marginLeft: 8 }} />
          <TextInput
            placeholder="Search COLLABS!"
            placeholderTextColor="#AAA"
            style={[styles.searchInput, fontsLoaded && styles.customFont]}
            value={search}
            onChangeText={setSearch}
            selectionColor="#fff"
            onFocus={onSearchFocus}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearch("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={18} color="#AAA" />
            </TouchableOpacity>
          )}
        </View>

        {/* For you / filter-knop */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.foryouButton}
          onPress={() => setFiltersVisible((v) => !v)}
        >
          <Text style={styles.foryouText}>For you</Text>
          <MaterialIcons
            name={filtersVisible ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={22}
            color="#fff"
            style={{ marginLeft: 1, marginTop: 0 }}
          />
        </TouchableOpacity>
      </View>

      {/* Horizontale filterbalk, alleen zichtbaar als filtersVisible */}
      {filtersVisible && (
        <>
          <View style={{ marginTop: 10 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ alignItems: "center", flexGrow: 1, paddingLeft: 0, paddingRight: 12 }}
            >
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  activeDropdown === "artist" && styles.filterTabActive,
                ]}
                onPress={() =>
                  setActiveDropdown((d) => (d === "artist" ? null : "artist"))
                }
              >
                <Text style={styles.filterTabText}>Artist</Text>
                <MaterialIcons
                  name={
                    activeDropdown === "artist"
                      ? "keyboard-arrow-up"
                      : "keyboard-arrow-down"
                  }
                  size={18}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  activeDropdown === "genre" && styles.filterTabActive,
                ]}
                onPress={() =>
                  setActiveDropdown((d) => (d === "genre" ? null : "genre"))
                }
              >
                <Text style={styles.filterTabText}>Genre</Text>
                <MaterialIcons
                  name={
                    activeDropdown === "genre"
                      ? "keyboard-arrow-up"
                      : "keyboard-arrow-down"
                  }
                  size={18}
                  color="#fff"
                />
              </TouchableOpacity>
              {/* Meer filtercategorieën? Voeg hier toe */}
            </ScrollView>
          </View>

          {/* Dropdowns */}
          {activeDropdown === "artist" && (
            <View style={styles.dropdownContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {allArtists.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[
                      styles.chip,
                      selectedArtists.includes(a.id) && styles.chipActive,
                    ]}
                    onPress={() => onSelectArtist(a.id)}
                  >
                    <Text style={{ color: "#fff" }}>{a.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          {activeDropdown === "genre" && (
            <View style={styles.dropdownContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {allGenres.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.chip,
                      selectedGenres.includes(g.id) && styles.chipActive,
                    ]}
                    onPress={() => onSelectGenre(g.id)}
                  >
                    <Text style={{ color: "#fff" }}>{g.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#131313",
    paddingHorizontal: 18,
    paddingBottom: 0,
    marginBottom: 2,
    zIndex: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#131313",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "white",
    height: 36,
    marginRight: 10,
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    color: "#fff",
    fontSize: 15,
    paddingHorizontal: 8,
    paddingTop: 1,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  clearButton: {
    padding: 5,
    marginRight: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  foryouButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 0,
    marginLeft: 1
  },
  foryouText: {
    color: "#fff",
    fontFamily: "Jost_500Medium",
    fontSize: 16,
    marginRight: 4,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: "#1a1a1a",
    marginRight: 8,
    marginLeft: 5,
  },
  filterTabActive: {
    backgroundColor: "#4169e1",
  },
  filterTabText: {
    color: "#fff",
    fontWeight: "600",
    marginRight: 4,
    fontSize: 16,
  },
  customFont: {
    fontFamily: "Jost_400Regular",
  },
  dropdownContainer: {
    marginTop: 4,
    backgroundColor: "#181818",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    zIndex: 30,
    marginLeft: 5,
  },
  chip: {
    backgroundColor: "#242424",
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 6,
  },
  chipActive: {
    backgroundColor: "#4169e1",
  },
})

export default FeedHeader
