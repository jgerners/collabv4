import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export interface Post {
  [x: string]: any;
  id: string;
  userId: string;
  profileImage: string;
  username: string;
  display_name: string; 
  role: string;
  media: string | number;
  mediaUrl: string | number;
  mediaType: "photo" | "video";
  audio?: string | number;
  title: string;
  description: string;
  timestamp: number;
  artistTags: string[];
  genreTags: string[];
  like_count: number;
  save_count: number;
  follower_count: number;
  isLiked: boolean;
  isFollowed: boolean;
  isSaved: boolean;
  isPlaying: boolean;
}

const PAGE_SIZE = 20;

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);

  const fetchPostsForPage = async (pageNumber: number): Promise<Post[]> => {
    console.log(`🔄 fetchPosts() wordt aangeroepen voor pagina ${pageNumber}...`);
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
        like_count,
        save_count,
        isLiked,
        isFollowed,
        isSaved,
        isPlaying,
        profiles(username, profile_pic, display_name, role, follower_count)
      `)
      .order("timestamp", { ascending: false })
      .range((pageNumber - 1) * PAGE_SIZE, pageNumber * PAGE_SIZE - 1);

    if (error) {
      console.error("❌ Fout bij ophalen posts:", error);
      throw new Error(error.message);
    } else {
      console.log("📥 Opgehaalde posts pagina:", JSON.stringify(data, null, 2));

      const mappedPosts: Post[] = data.map((post: any) => ({
        id: post.id,
        userId: post.userId,
        profileImage: post.profiles?.profile_pic || "https://via.placeholder.com/50",
        username: post.profiles?.username || "Onbekend",
        display_name: post.profiles?.display_name,
        role: post.profiles?.role,
        media: post.media,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        audio: post.audioUrl,
        title: post.title,
        description: post.description,
        timestamp: post.timestamp,
        artistTags: post.artistTags ?? [],
        genreTags: post.genreTags ?? [],
        like_count: post.like_count,
        save_count: post.save_count,
        follower_count: post.profiles.follower_count,
        isLiked: post.isLiked,
        isFollowed: post.isFollowed,
        isSaved: post.isSaved,
        isPlaying: post.isPlaying,
      }));

      return mappedPosts;
    }
  };

  // Laad de initiële posts (eerste batch)
  useEffect(() => {
    const loadInitialPosts = async () => {
      try {
        setInitialLoading(true);
        const initialPosts = await fetchPostsForPage(1);
        setPosts(initialPosts);
        setPage(1);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Fout bij het laden van posts");
      }
      setInitialLoading(false);
    };
    loadInitialPosts();
  }, []);

  // Laad meer posts (extra batches)
  const loadMorePosts = async () => {
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const morePosts = await fetchPostsForPage(nextPage);
      setPosts((prevPosts) => [...prevPosts, ...morePosts]);
      setPage(nextPage);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Fout bij het laden van meer posts");
    }
    setLoadingMore(false);
  };

  const refetch = async () => {
    try {
      setInitialLoading(true);
      const freshPosts = await fetchPostsForPage(1);
      setPosts(freshPosts);
      setPage(1);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Fout bij herladen van posts");
    }
    setInitialLoading(false);
  };

  return { posts, initialLoading, loadingMore, error, loadMorePosts, refetch };
};