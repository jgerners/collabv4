// components/mainbuttons/save.tsx
import React, { useEffect, useState } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../supabaseClient";

interface SaveButtonProps {
  postId: string;
  userId: string;
}

const SaveButton: React.FC<SaveButtonProps> = ({ postId, userId }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Controleer of de post al is opgeslagen
  useEffect(() => {
    const checkSaved = async () => {
      const { data, error } = await supabase
        .from("saved_posts")
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking saved post:", error);
      } else if (data) {
        setIsSaved(true);
      }
    };

    checkSaved();
  }, [postId, userId]);

  const handleSaveToggle = async () => {
    setLoading(true);
    if (!isSaved) {
      // Voeg een record toe in de saved_posts tabel
      const { error } = await supabase
        .from("saved_posts")
        .insert([{ post_id: postId, user_id: userId }]);
      if (error) {
        console.error("Error saving post:", error);
      } else {
        setIsSaved(true);
      }
    } else {
      // Verwijder het record
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      if (error) {
        console.error("Error unsaving post:", error);
      } else {
        setIsSaved(false);
      }
    }
    setLoading(false);
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleSaveToggle} disabled={loading}>
      <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={30} color="white" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    
  },
});

export default SaveButton;
