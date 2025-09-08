import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import React, { useState, useContext } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RootStackParamList } from '../routes';
import { AuthProvider, useAuth } from '../context/authContext'; // ✅ Import AuthContext
import  EditProfile  from "./screens/editprofile";

import { useFonts, Manrope_400Regular, Manrope_700Bold,  } from '@expo-google-fonts/manrope';
import { 
  Jost_100Thin,
  Jost_200ExtraLight,
  Jost_300Light,
  Jost_400Regular,
  Jost_500Medium,
  Jost_600SemiBold,
  Jost_700Bold,
  Jost_800ExtraBold,
  Jost_900Black,
} from '@expo-google-fonts/jost';

import * as Haptics from 'expo-haptics'
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
import SettingsScreen from './(tabs)/settings';
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

// ⬇️ DIT IS DE ENIGE EXTRA IMPORT
import FeedNavBar from '../components/FeedNavBar';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// ✅ Tab-navigatie (Alleen zichtbaar als de gebruiker is ingelogd)
function TabsLayout() {
  const colorScheme = useColorScheme();
  const { profile } = useAuth(); // ✅ Profielfoto ophalen
  const zoom = useContext(ZoomContext)!

  // STATE: voor feed tabbar visibility
  const [feedBarVisible, setFeedBarVisible] = useState(true);

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
            backgroundColor: 'rgb(6, 6, 6)',
            borderTopWidth: 0,
            paddingHorizontal: 50,
            justifyContent: 'space-evenly',
          },
          default: {
            height: 80,
            backgroundColor: 'rgb(17, 17, 17)',
            paddingHorizontal: 25,
            justifyContent: 'space-evenly',
          },
        }),
        tabBarItemStyle: {
          paddingTop: 14,
        },

        tabBarIcon: ({ focused, color }) => {
          const opacity = focused ? 1 : 0.8;
          switch (route.name) {
            case 'Feed':
              return (
                <MaterialCommunityIcons
                  name="home-variant"
                  size={22}
                  color={color}
                  style={{ opacity }}
                />
              );
            case 'COLLABS!':
              return (
                <MaterialCommunityIcons
                  name="chat"
                  size={22}
                  color={color}
                  style={{ opacity }}
                />
              );
            case 'Search':
              return (
                <Ionicons
                  name="search"
                  size={22}
                  color={color}
                  style={{ opacity }}
                />
              );
            case 'Profile':
              return (
                <Ionicons
                  name="person"
                  size={22}
                  color={color}
                  style={{ opacity }}
                />
              );
            case 'Upload':
              return (
                <View style={styles.uploadBubble}>
                  <Ionicons
                    name="add"
                    size={32}
                    color="white"
                    
                  />
                </View>
              );
            default:
              return null;
          }
        },
      })}
      // ⬇️ TABBAR: Custom alleen als FEED actief, anders standaard
      tabBar={props => {
        const isFeedActive = props.state.routes[props.state.index].name === 'Feed';
        if (isFeedActive) {
          return (
            <FeedNavBar
              {...props}
              visible={feedBarVisible}
              onPressPlus={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                props.navigation.navigate('SelectMediaModal');
              }}
            />
          );
        }
        // Gewoon de standaard react-navigation tabbar
        return <BottomTabBar {...props} />;
      }}
    >
      <Tab.Screen
        name="Feed"
        children={props => (
          <FeedScreen {...props} setFeedBarVisible={setFeedBarVisible} />
        )}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="COLLABS!" component={ChatListScreen} />
      <Tab.Screen
        name="Upload"
        component={FeedScreen}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            zoom.zoomOut()
            navigation.navigate('SelectMediaModal');
          },
        })}
      />
      <Tab.Screen name="Search" component={search} />
      <Tab.Screen
        name="Profile"
        options={{ headerShown: false }}
        component={ProfileScreen}
      />
      {/** Settings is not a tab; added to Stack below */}
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
              options={{ headerShown: false }}
            />
            {/* 2) Fullscreen uploadpagina na selectie */}
            <Stack.Screen
              name="UploadFormModal"
              component={UploadScreen}
              options={{
                presentation: 'card',
                headerShown: false
              }}
            />
          </Stack.Group>
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerShown: true,
              headerTitle: 'Settings',
              headerTintColor: 'white',
              headerStyle: { backgroundColor: 'black' },
            }}
          />
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
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
    Jost_100Thin,
    Jost_200ExtraLight,
    Jost_300Light,
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    Jost_700Bold,
    Jost_800ExtraBold,
    Jost_900Black,
  });

  if (!fontsLoaded) {
    return null;
  }

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
    height: 45,
    borderRadius: 10,
    backgroundColor: "#262626",  // Altijd witte bubble
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBubbleActive: {
    backgroundColor: '#333',  // Niet meer nodig, kan blijven staan als fallback
  },
});
