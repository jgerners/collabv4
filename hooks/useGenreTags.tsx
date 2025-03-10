import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export interface GenreTag {
  id: string;
  name: string;
}

export const useGenreTags = () => {
  const [genreTags, setGenreTags] = useState<GenreTag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenreTags = async () => {
      const { data, error } = await supabase.from("genreTags").select("*");
      if (error) {
        setError(error.message);
      } else {
        setGenreTags(data as GenreTag[]);
      }
      setLoading(false);
    };

    fetchGenreTags();
  }, []);

  return { genreTags, loading, error };
};
