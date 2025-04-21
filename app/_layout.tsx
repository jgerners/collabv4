import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RootStackParamList } from '../routes';
import { AuthProvider, useAuth } from '../context/authContext'; // ✅ Import AuthContext
import  EditProfile  from "./screens/editprofile";

import { StatusBar } from 'expo-status-bar';

// 📌 Screens Importeren
import FeedScreen from './(tabs)/feedtest';
import ProfileScreen from './(tabs)/profile';
import ChatListScreen from './(tabs)/chat_list';
import ChatScreen from './screens/chat';
import UserProfileScreen from './screens/userprofile';
import UploadScreen from './(tabs)/upload';
import ArtistTagSelectScreen from "./screens/artistTagSelect";
import GenreTagSelectScreen from "./screens/genreTagSelect";
import LoginScreen from "./auth/login"; // ✅ Login
import RegisterScreen from "./auth/register"; // ✅ Register
import uploadProfileMediaScreen from "./screens/uploadProfileMediaScreen"; // ✅ Register
import demoDetailScreen from './screens/demoDetailScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// ✅ Tab-navigatie (Alleen zichtbaar als de gebruiker is ingelogd)
function TabsLayout() {
  const colorScheme = useColorScheme();
  const { profile } = useAuth(); // ✅ Profielfoto ophalen

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        headerTransparent: true,
        headerStyle: { height: 110, },
        
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontSize: 25,
          fontWeight: 'bold',
          color: 'white',
        },
       
        tabBarBackground: () => (
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        ),
        tabBarStyle: Platform.select({
          ios: { position: 'absolute', height: 80, backgroundColor: 'rgba(0, 0, 0, 0.81)',  borderTopWidth: 0, },
          default: { height: 80, backgroundColor: 'rgba(17, 17, 17, 0.81)' }
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
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="arrow.up.circle.fill" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ✅ AppNavigatie met Auth-check
function AuthNavigator() {
  const { user, loading } = useAuth();

  // ✅ Voorkom dat de app laadt voordat de sessie bekend is
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A020F0" />
      </View>
    );
  }


  
  return (
    <Stack.Navigator>
      {/* ✅ Als GEEN sessie → Toon Login/Register */}
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          {/* ✅ Als WEL sessie → Toon de hoofdapp */}
          <Stack.Screen name="Main" component={TabsLayout} options={{ headerShown: false }} />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{
              headerShown: true,
              headerTitle: "Chat",
              headerBackTitle: "",
              headerTintColor: "white",
              headerStyle: { backgroundColor: "rgba(0,0,0,0.8)" },
            }}
          />
          <Stack.Screen 
            name="UserProfile" 
            component={UserProfileScreen} 
            options={{
              headerShown: true,
              headerTitle: "Profile",
              headerTintColor: "white",
              headerStyle: { backgroundColor: "rgba(57, 57, 57, 0.95)" },
            }}
          />
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfile} 
            options={{ headerShown: false }} />

          <Stack.Screen 
            name="uploadProfileMedia" 
            component={uploadProfileMediaScreen} 
            options={{ headerShown: false }} 
          /> 

          <Stack.Screen 
           name="DemoDetail" 
           component={demoDetailScreen} 
           options={{ headerShown: true, headerTitle: "Demo Detail" }} 
           />
          <Stack.Screen 
            name="ArtistTagSelect" 
            component={ArtistTagSelectScreen} 
            options={{ headerShown: true, headerTitle: "Profile", headerTintColor: "white" }}
          />
          <Stack.Screen 
            name="GenreTagSelect" 
            component={GenreTagSelectScreen} 
            options={{ headerShown: true, headerTitle: "Tags", headerTintColor: "white" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// ✅ Hoofdexport met AuthProvider
export default function AppNavigator() {
  return (
    <AuthProvider>
       <StatusBar style="light" backgroundColor="transparent" translucent />
      <AuthNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({

  headerBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.81)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
});