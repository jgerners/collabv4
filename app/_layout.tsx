
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

import * as Haptics from 'expo-haptics'
import { useContext } from 'react'
import { ZoomContext, ZoomProvider } from '../context/zoomContext'

import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';



import FeedHeader from '../headers/FeedHeader';

import UploadNavigator from '../navigation/UploadNavigator';

import SelectMediaScreen from '../app/screens/SelectMediaScreen'


import { StatusBar } from 'expo-status-bar';

// 📌 Screens Importeren
import FeedScreen from './(tabs)/feedtest';
import ProfileScreen from './(tabs)/profile';
import search from './(tabs)/likes_test';
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
  const zoom = useContext(ZoomContext)!


  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#FFFFFF',
        headerShown: true,
        headerTransparent: true,
        headerStyle: { height: 110 },
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: 'white',
        },
        tabBarBackground: () => (
          <BlurView intensity={0} tint="dark" style={StyleSheet.absoluteFill} />
        ),
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            height: 80,
            backgroundColor: 'rgba(6, 6, 6, 0)',
            borderTopWidth: 0,
            paddingHorizontal: 25,      // <— minder zijdelingse ruimte
            justifyContent: 'space-evenly', // <— verdeel items compacter
          },
          default: {
            height: 80,
            backgroundColor: 'rgba(17, 17, 17, 0.81)',
            paddingHorizontal: 25,      // <— minder zijdelingse ruimte
            justifyContent: 'space-evenly', // <— verdeel items compacter
          },
        }),
       
        tabBarItemStyle: {
             paddingTop: 8,      

            },


             
        tabBarIcon: ({ focused, color }) => {
          // bepaal de juiste SF-Symbol-naam als string
          let iconName: string;
          switch (route.name) {
            case 'Feed':
              return (
                <MaterialCommunityIcons
                  name={focused ? 'home-variant' : 'home-variant-outline'}
                  size={25}
                  color={color}
                />
              );
            case 'COLLABS!':
              iconName = focused
                ? 'bubble.left.and.bubble.right.fill'
                : 'bubble.left.and.bubble.right';
              break;
              case 'Search':
                // Outline als inactive, solid Sharp als active
                return (
                  <Ionicons
                    name={focused ? 'search-sharp' : 'search-outline'}
                    size={25}
                    color={color}
                  />
                );
            case 'Profile':
              iconName = focused
                ? 'person.crop.circle.fill'
                : 'person.crop.circle';
              break;
              case 'Upload':
                return (
                  <View style={[
                    styles.uploadBubble,
                    focused && styles.uploadBubbleActive
                  ]}>
                    <Ionicons name="add" size={24} color={color} />
                  </View>
                );
            default:
              iconName = 'questionmark';
          }
          // cast naar any om de union-type check te omzeilen
          return <IconSymbol name={iconName as any} size={25} color={color} />;
        },
      })}
    >
      <Tab.Screen
  name="Feed"
  component={FeedScreen}
  options={{
    headerShown: false,    // ← hieruit halen dat doorzichtig headerje

           }}
       />
      <Tab.Screen name="COLLABS!" component={ChatListScreen} />
      <Tab.Screen
      name="Upload"
      component={FeedScreen}
      listeners={({ navigation }) => ({
          tabPress: e => {
          e.preventDefault();                         // voorkom echte tab‐switch
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          zoom.zoomOut()
          navigation.navigate('SelectMediaModal');    // open overlay‐modal
                         },
  })}                                          // ← sluit hier je listeners af
/>
      <Tab.Screen name="Search" component={search} />
      <Tab.Screen 
      name="Profile" 
      options={{headerShown: false}}
      component={ProfileScreen} />
  
      
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
    <Stack.Navigator
    screenOptions={{
      // alle schermen krijgen zwarte achtergrond onder je animatie
      cardStyle: { backgroundColor: 'black' },
    
    }}>
      
      {/* ✅ Als GEEN sessie → Toon Login/Register */}
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
        
        
          {/* ✅ Als WEL sessie → Toon de hoofdapp */}
           <Stack.Screen 
              name="Main" 
              component={TabsLayout} 
              options={{ headerShown: false }}
                                              />
          
     
     
          {/* 🔔 Overlay-modals bovenop je tabs */}
         <Stack.Group
           screenOptions={{
           presentation: 'transparentModal',
           cardStyle: { backgroundColor: 'transparent' },
           
            }}
         >
           {/* 1) Blur-overlay met gallery-sheet */}
           <Stack.Screen
              name="SelectMediaModal"
              component={SelectMediaScreen}
              options={{headerShown: false, }}
           />
            {/* 2) Fullscreen uploadpagina na selectie */}
            <Stack.Screen
              name="UploadFormModal"
             component={UploadScreen}
              options={{ 
                presentation: 'card', 
                headerShown: false}}
            />
          </Stack.Group>
          
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{
              headerShown: true,
              headerTitle: "chat",
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
      <View style={styles.root}>
      <ZoomProvider>
       <StatusBar style="light" backgroundColor="transparent" translucent />
      <AuthNavigator />
      </ZoomProvider>
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'black',
  },

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
  uploadBubble: {
    width: 60,
    height: 37,
    borderRadius: 10,
    backgroundColor: "#212121",
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBubbleActive: {
    backgroundColor: '#333',  // donkergrijs bubble
  },
});