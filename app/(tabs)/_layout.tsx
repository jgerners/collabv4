import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// 📌 Screens Importeren
import FeedScreen from '../(tabs)/feedtest';
import ProfileScreen from '../(tabs)/profile';
import ChatListScreen from '../(tabs)/chat_list';
import ChatScreen from '../screens/chat';
import UploadScreen from '../(tabs)/upload';


// Dummy profielafbeelding
const userProfileImage = require('../../assets/dummy_images/skip_profiel.jpg');

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabsLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        headerTransparent: true,
        headerStyle: { height: 110 },
        headerBackground: () => (
          <BlurView intensity={50} tint="dark" style={styles.headerBackground} />
        ),
        headerTitleAlign: 'left',
        headerTitleStyle: {
          fontSize: 25,
          fontWeight: 'bold',
          color: 'white',
        },
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            <TouchableOpacity>
              <Image source={userProfileImage} style={styles.profileImage} />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginLeft: 15 }}>
              <IconSymbol size={24} name="magnifyingglass" color="white" />
            </TouchableOpacity>
          </View>
        ),
        tabBarStyle: Platform.select({
          ios: { position: 'absolute', height: 80 },
          default: { height: 80 },
        }),
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bubble.left.and.bubble.right.fill" color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
        }}
      />
          <Tab.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      
    </Tab.Navigator>
  );
}

// 📌 Hoofdstructuur van de app, met Tabs en Chat als Stack (🔥 `NavigationContainer` WEGGEHAALD)
export default function AppNavigator() {
  return (
    <Stack.Navigator>
      {/* Tabs met hoofdschermen */}
      <Stack.Screen name="Main" component={TabsLayout} options={{ headerShown: false }} />

      {/* Chat-scherm is GEEN tab, maar een apart scherm */}
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          headerShown: true,
          headerTitle: "Chat",
          headerBackTitle: "",
          headerTintColor: "white",
          headerStyle: {
            backgroundColor: "rgba(0,0,0,0.8)",
          },
        }}
      />
 
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  profileImage: {
    width: 25,
    height: 25,
    borderRadius: 20,
  },
  headerBackground: {
    flex: 1,
    backgroundColor: 'rgba(57, 57, 57, 0.81)',
  },
});
