"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, ScrollView, Image } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import * as Font from "expo-font"

const { width: screenWidth } = Dimensions.get("window")

export interface FeedHeaderProps {
  onFilterChange?: (filter: string) => void
  onTabChange?: React.Dispatch<React.SetStateAction<number>>
}

const FeedHeader: React.FC<FeedHeaderProps> = ({ onFilterChange, onTabChange }) => {
  const insets = useSafeAreaInsets()
  const [activeFilter, setActiveFilter] = useState("For you")
  const scrollViewRef = useRef<ScrollView>(null)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  // Load fonts manually to have more control
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // Try to load the font with a more specific approach
          Manrope: require("../assets/fonts/Manrope-VariableFont_wght.ttf"),
        })
        console.log("Font loaded successfully")
        setFontsLoaded(true)
      } catch (error) {
        console.error("Error loading fonts:", error)
        // Continue without custom fonts
        setFontsLoaded(true)
      }
    }

    loadFonts()
  }, [])

  // Constants
  const HEADER_CONTENT_HEIGHT = 48
  const CONTAINER_HEIGHT = insets.top + HEADER_CONTENT_HEIGHT
  const LOGO_SIZE = 48

  const handleFilterPress = (filter: string) => {
    setActiveFilter(filter)
    if (onFilterChange) {
      onFilterChange(filter)
    }
  }

  // Filter options based on the Figma design
  const filters = ["For you", "Role", "Artist", "Style", "Instrument", "Genre", "Mood", "BPM"]

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8, height: CONTAINER_HEIGHT }]}>
      <View style={styles.headerContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={require("../assets/collab_logo.png")} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Horizontally scrollable filters */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {filters.map((filter, index) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, activeFilter === filter && styles.activeFilterButton]}
              activeOpacity={0.7}
              onPress={() => handleFilterPress(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  fontsLoaded && styles.customFont,
                  activeFilter === filter && styles.activeFilterText,
                ]}
              >
                {filter}
              </Text>
              <MaterialIcons
                name="keyboard-arrow-down"
                size={16}
                color={activeFilter === filter ? "#FFFFFF" : "#AAAAAA"}
                style={styles.chevronIcon}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    backgroundColor: "#000000",
    paddingHorizontal: 8,
    transform: [{ translateY: -64 }],
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  logoContainer: {
    marginRight: 8,
    zIndex: 2,
    height: 150,
    width: 150,
    transform: [{ translateX: -10 }],
  },
  logo: {
    height: 150,
    width: 150,
  },
  filtersContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 20, // Extra padding at the end for better scrolling
    transform: [{ translateY: 2 }],
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 12,
    borderRadius: 4,
  },
  activeFilterButton: {
    // No background color change as per design
  },
  filterText: {
    color: "#AAAAAA",
    fontSize: 16,
  },
  customFont: {
    fontFamily: "manrope",
    fontWeight: "regular", // Use a specific weight if needed
  },
  activeFilterText: {
    color: "#FFFFFF",
    fontWeight: "700", // Use font weight instead of a different font family
  },
  chevronIcon: {
    marginLeft: 4,
  },
})

export default FeedHeader
