// File: app/screens/SelectMediaScreen.tsx
import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../routes';
import { ZoomContext } from '../../context/zoomContext';  // let op: lowercase 'z'

type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

export default function SelectMediaScreen() {
  const navigation = useNavigation<RootNavProp>();
  const zoom = useContext(ZoomContext);

  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [mode, setMode] = useState<'video' | 'photo'>('photo');

  const numColumns = 4;
  const itemSize = Dimensions.get('window').width / numColumns;

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setDenied(true);
        setLoading(false);
        return;
      }
      try {
        const media = await MediaLibrary.getAssetsAsync({
          first: 100,
          mediaType: ['photo', 'video'],
          sortBy: ['creationTime'],
        });
        setAssets(media.assets);
      } catch (e) {
        console.error('Error loading media:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // sluit-overlay: eerst unmount modal, dan zoomIn
  const close = () => {
    navigation.goBack();
    zoom?.zoomIn();
  };

  // asset select: unmount modal, zoomIn, daarna upload-navigatie
  const onPressAsset = (asset: MediaLibrary.Asset) => {
    zoom?.zoomIn(() => {
      // NIET eerst goBack
      navigation.replace('UploadFormModal', {
        mediaUri: asset.uri,
        mediaType: asset.mediaType === 'video' ? 'video' : 'photo',
      });
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#A020F0" />
      </View>
    );
  }

  if (denied) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Toegang tot je media is geweigerd. Pas je instellingen aan.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.sheet}>
        <TouchableOpacity onPress={close} style={styles.closeBtn}>
          <Text style={styles.closeTxt}>×</Text>
        </TouchableOpacity>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'video' && styles.activeToggle]}
            onPress={() => setMode('video')}
          >
            <Text style={[styles.toggleLabel, mode === 'video' && styles.activeLabel]}>
              Video upload
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'photo' && styles.activeToggle]}
            onPress={() => setMode('photo')}
          >
            <Text style={[styles.toggleLabel, mode === 'photo' && styles.activeLabel]}>
              Photo upload
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.recentsContainer}>
          <Text style={styles.recentsText}>Recents</Text>
          <Text style={styles.recentsArrow}>⌄</Text>
        </View>
        <FlatList
          key={mode}
          data={assets.filter(a =>
            mode === 'video' ? a.mediaType === 'video' : a.mediaType === 'photo'
          )}
          keyExtractor={item => item.id}
          numColumns={numColumns}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => onPressAsset(item)}>
              <Image
                source={{ uri: item.uri }}
                contentFit="cover"
                style={{ width: itemSize, height: itemSize }}
              />
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          style={styles.grid}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: { color: 'white', textAlign: 'center' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: 'black',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
  },
  closeBtn: { position: 'absolute', top: 12, right: 12, zIndex: 10 },
  closeTxt: { color: 'white', fontSize: 35, lineHeight: 35 },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    transform: [{ translateY: 50 }],
  },
  toggleBtn: {
    width: 135,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 20,
    paddingVertical: 8,
    marginHorizontal: 30,
    alignItems: 'center',
  },
  activeToggle: { backgroundColor: '#4800FF', borderColor: 'black' },
  toggleLabel: { color: 'white', fontSize: 14 },
  activeLabel: { color: 'white', fontWeight: 'bold' },
  recentsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    transform: [{ translateY: 65 }],
  },
  recentsText: { color: 'white', fontSize: 12 },
  recentsArrow: { color: 'white', fontSize: 12, marginLeft: 4 },
  grid: { flex: 1, transform: [{ translateY: 80 }] },
});
