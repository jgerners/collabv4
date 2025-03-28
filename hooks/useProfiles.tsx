import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export interface Profile {
  id: string;
  username: string;
  profile_pic: string;
}

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, profile_pic");
    if (error) {
      setError(error.message);
    } else {
      setProfiles(data as Profile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return { profiles, loading, error };
};
