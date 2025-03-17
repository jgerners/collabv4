import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

// Definieer de interface voor een Post
export interface Post {
  [x: string]: any;
  id: string;
  userId: string;
  profileImage: string 
  username: string;
  media: string | number;
  mediaUrl: string | number;
  mediaType: "photo" | "video";
  audio?: string | number;
  title: string;
  description: string;
  timestamp: number;
  artistTags: string[];
  genreTags: string[];
  isLiked: boolean;
  isFollowed: boolean;
  isSaved: boolean;
  isPlaying: boolean;
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      console.log("🔄 fetchPosts() wordt aangeroepen...");
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          userId, 
          media,
          mediaUrl,
          mediaType,
          audioUrl,
          title,
          description,
          timestamp,
          artistTags,
          genreTags,
          isLiked,
          isFollowed,
          isSaved,
          isPlaying,
          profiles(username, profile_pic)
        `)
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("❌ Fout bij ophalen posts:", error);
        setError(error.message);
      } else {
        console.log("📥 Opgehaalde posts:", JSON.stringify(data, null, 2));

        // 🔹 Data correct mappen naar de `Post` interface
        const mappedPosts: Post[] = data.map((post: any) => ({
          id: post.id,
          userId: post.userId, // Correcte naamgeving
          profileImage: post.profiles?.profile_pic || "https://via.placeholder.com/50",
          username: post.profiles?.username || "Onbekend",
          media: post.media,
          mediaUrl: post.mediaurl, // Fix voor mediaUrl
          mediaType: post.mediatype, // Fix voor mediaType
          audio: post.audiourl,
          title: post.title,
          description: post.description,
          timestamp: post.timestamp,
          artistTags: post.artistTags ?? [],
          genreTags: post.genreTags ?? [],
          isLiked: post.isLiked,
          isFollowed: post.isFollowed,
          isSaved: post.isSaved,
          isPlaying: post.isPlaying,
        }));

        setPosts(mappedPosts);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  return { posts, loading, error };
};
