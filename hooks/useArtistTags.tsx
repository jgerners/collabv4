import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export interface ArtistTag {
  id: string;
  name: string;
  image: string;
}

export const useArtistTags = () => {
  const [artistTags, setArtistTags] = useState<ArtistTag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtistTags = async () => {
      const { data, error } = await supabase.from("artistTags").select("*");
      console.log("Fetched artistTags:", data);

      if (error) {
        setError(error.message);
      } else {
        setArtistTags(data as ArtistTag[]);
      }
      setLoading(false);
    };

    fetchArtistTags();
  }, []);

  return { artistTags, loading, error };
};
