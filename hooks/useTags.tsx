// useTags.ts
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export interface Tag {
  id: string;
  name: string;
  image?: string; // URL voor de artist tag-afbeelding, kan null zijn voor genre-tags
  tagType: "artist" | "genre";
}

export const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase.from("tags").select("*");
      if (error) {
        setError(error.message);
      } else {
        setTags(data as Tag[]);
      }
      setLoading(false);
    };

    fetchTags();
  }, []);

  return { tags, loading, error };
};
