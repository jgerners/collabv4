import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useAuth } from "../../context/authContext";
import ProfilePic from "../../components/mainbuttons/profilepic";
import { ProfileBanner } from "../../components/profile_banner";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../routes";
import { supabase } from "../../supabaseClient";
import DemoModule from "../../components/demoModule";
import { Ionicons } from '@expo/vector-icons';

const BANNER_HEIGHT = 340;
const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_COUNT = 3;
const TABS = ['Demos', 'Releases', 'Contact'];
const USERNAME_TOP = BANNER_HEIGHT / 2 - 100;

export default function ProfileScreen() {
  const { profile } = useAuth();
  const [selectedTab, setSelectedTab] = useState("Demos");
  const [demos, setDemos] = useState<any[]>([]);
  const [loadingDemos, setLoadingDemos] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function fetchDemos() {
      if (!profile?.id) return;
      setLoadingDemos(true);
      const { data, error } = await supabase
        .from("demos")
        .select("*")
        .eq("profile_id", profile.id);
      if (error) {
        console.error("Error fetching demos:", error);
      } else {
        setDemos(data || []);
      }
      setLoadingDemos(false);
    }
    fetchDemos();
  }, [profile]);

  useEffect(() => {
    const index = TABS.indexOf(selectedTab);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    }
  }, [selectedTab]);

  const handleMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    const newTab = TABS[newIndex] || TABS[0];
    setSelectedTab(newTab);
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  const openModal = (mediaItem: any) => {
    setSelectedMedia(mediaItem);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    setSelectedMedia(null);
  };

  return (
    <View style={styles.root}>
      {/* Settings icon (only for own profile) */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Settings')}
        style={[styles.settingsBtn, { top: USERNAME_TOP }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="reorder-three-outline" size={28} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.absoluteBannerWrapper} pointerEvents="box-none">
        <ProfileBanner
          uri={profile?.profile_banner}
          height={BANNER_HEIGHT}
          style={styles.absoluteBanner}
        >
          <Text style={[styles.overlayUsername, { top: USERNAME_TOP }]}>
            {profile?.username || "Gebruiker"}
          </Text>
          <View style={styles.avatarContainer}>
            <ProfilePic uri={profile?.profile_pic || ""} />
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.displayname}>
              {profile?.display_name || "Geen display naam"}
            </Text>
            <Text style={styles.role}>
              {profile?.role || "Onbekende rol"}
            </Text>
          </View>
        </ProfileBanner>
      </View>

      <View style={styles.tabsWrapper}>
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={styles.tabItem}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.tabTrack} />
        <View
          style={[
            styles.tabIndicator,
            { left: TABS.indexOf(selectedTab) * (SCREEN_WIDTH / TAB_COUNT) },
          ]}
        />
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        ref={scrollViewRef}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        <View style={styles.page}>
          {loadingDemos ? (
            <ActivityIndicator size="small" color="#A020F0" />
          ) : demos.length > 0 ? (
            demos.map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => openModal(item)}
                style={styles.gridItemWrapper}
              >
                <Image
                  source={{ uri: item.thumbnail || item.media_url }}
                  style={styles.gridItem}
                />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noMediaText}>No demos uploaded</Text>
          )}
          <TouchableOpacity
            style={[styles.gridItemWrapper, styles.plusBubble]}
            onPress={() => navigation.navigate('uploadProfileMedia')}
          >
            <Text style={styles.plusText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.page}>
          {Array(6)
            .fill(null)
            .map((_, i) => (
              <View key={i} style={styles.gridItemWrapper}>
                <View style={styles.gridItem} />
              </View>
            ))}
        </View>
        <View style={styles.page}>
          <Text style={{ color: 'gray' }}>Contact info...</Text>
        </View>
      </ScrollView>

      {selectedMedia && (
        <DemoModule
          visible={modalVisible}
          mediaItem={selectedMedia}
          onClose={closeModal}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'black',
  },
  settingsBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 50,
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  absoluteBannerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  absoluteBanner: {
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    overflow: 'hidden',
  },
  overlayUsername: {
    position: 'absolute',
    top: BANNER_HEIGHT / 2 - 100,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  avatarContainer: {
    position: 'absolute',
    top: BANNER_HEIGHT / 2,
    left: 25,
    width: 60,
    height: 60,
    borderRadius: 40,
    overflow: 'hidden',
  },
  nameContainer: {
    position: 'absolute',
    top: BANNER_HEIGHT / 2 + 10 + 80,
    left: 30,
    alignItems: 'flex-start',
  },
  displayname: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  role: {
    color: '#ddd',
    fontSize: 16,
  },

  tabsWrapper: {
    position: 'relative',
    width: '100%',
    marginTop: BANNER_HEIGHT + 140,
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabItem: {
    width: SCREEN_WIDTH / TAB_COUNT,
    alignItems: 'center',
  },
  tabText: {
    color: 'gray',
    fontSize: 16,
    marginBottom: 10,
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '700',
  },

  tabTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: SCREEN_WIDTH / TAB_COUNT,
    height: 2,
    backgroundColor: '#fff',
  },

  page: {
    width: SCREEN_WIDTH,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItemWrapper: {
    width: 110,
    height: 110,
    marginBottom: 10,
  },
  gridItem: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
  },
  noMediaText: {
    color: 'gray',
    textAlign: 'center',
    width: '100%',
  },
  plusBubble: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 10,
  },
  plusText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
});
