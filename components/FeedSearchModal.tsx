// FeedSearchModal.tsx
import React, { useRef, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"

interface FeedSearchModalProps {
  visible: boolean
  search: string
  setSearch: (v: string) => void
  onRequestClose: () => void
  recentSearches: string[]
  setRecentSearches: (v: string[]) => void
  onSubmit: () => void
}

const FeedSearchModal: React.FC<FeedSearchModalProps> = ({
  visible,
  search,
  setSearch,
  onRequestClose,
  recentSearches,
  setRecentSearches,
  onSubmit,
}) => {
  const insets = useSafeAreaInsets()
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [visible])

  if (!visible) return null

  return (
    <View style={[styles.modalBackground, { paddingTop: insets.top + 12 }]}>
      {/* Searchbar only, NO filters! */}
      <View style={styles.row}>
        <View style={styles.searchWrapper}>
          <MaterialIcons name="search" size={20} color="#AAA" style={{ marginLeft: 8 }} />
          <TextInput
            ref={inputRef}
            placeholder="Search COLLABS!"
            placeholderTextColor="#AAA"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            selectionColor="#fff"
            autoFocus
            onSubmitEditing={onSubmit}
            returnKeyType="search"

          />
        </View>
        <TouchableOpacity onPress={onRequestClose} style={{ marginLeft: 8 }}>
          <MaterialIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <View style={{ marginTop: 28, paddingHorizontal: 8 }}>
          <Text style={{ color: "#bbb", fontWeight: "600", marginBottom: 10, fontSize: 15 }}>Recent</Text>
          {recentSearches.map(item => (
            <View key={item} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setSearch(item)
                  onRequestClose()
                }}
                style={{ flex: 1 }}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>{item}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  setRecentSearches(recentSearches.filter((v) => v !== item))
                }
              >
                <MaterialIcons name="close" size={18} color="#AAA" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      
    </View>
  )
}

const styles = StyleSheet.create({
  modalBackground: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#0C0C0C",
    zIndex: 999,
    paddingHorizontal: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0C0C0C",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "white",
    height: 36,
    marginRight: 10,
    marginLeft: 0,
  },
  searchInput: {
    flex: 1,
    height: 36,
    color: "#fff",
    fontFamily: "Jost_400Regular",
    fontSize: 15,
    paddingHorizontal: 8,
    paddingTop: Platform.OS === "ios" ? 2 : 0,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
})

export default FeedSearchModal
