import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { View, Text, StyleSheet, Image } from 'react-native';

interface PostProps {
  content: string;
  userId: string;
  mediaURL: string;
}

// Define the Post component using the export default function syntax
export default function Post({ content, userId, mediaURL }: PostProps) {
  const [downloadedImageUrl, setDownloadedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (mediaURL) {
      downloadImage(mediaURL);
    }
  }, [mediaURL]);

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);

      if (error) {
        throw error;
      }

      const fr = new FileReader();
      fr.readAsDataURL(data);
      fr.onload = () => {
        setDownloadedImageUrl(fr.result as string);
      };
    } catch (error) {
      if (error instanceof Error) {
        console.log('Error downloading image: ', error.message);
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.content}>{content}</Text>
      <Text style={styles.userId}>Posted by: {userId}</Text>
      {downloadedImageUrl ? (
        <Image
          source={{ uri: downloadedImageUrl }}
          accessibilityLabel="Post"
          style={styles.postImage}
        />
      ) : (
        <Text>Loading image...</Text>
      )}
    </View>
  );
}

// Define styles for the component
const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  content: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  userId: {
    fontSize: 14,
    color: '#555',
  },
  postImage: {
    padding: 10,
    height: 150,
    width: 150,
  },
});