// hooks/useChatParticipants.ts
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export interface Participant {
  id: string;
  username: string;
  profile_pic: string;
}

/**
 * Hook to fetch the chat partner (the user other than currentUserId) for a given chat.
 */
export default function useChatParticipants(
  chatId: string,
  currentUserId: string
): Participant | null {
  const [participant, setParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    const fetchParticipant = async () => {
      // 1. Fetch the chat row to get user_a and user_b
      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .select("user_a, user_b")
        .eq("id", chatId)
        .single();
      if (chatError || !chat) return;

      // 2. Determine partner ID
      const partnerId = chat.user_a === currentUserId ? chat.user_b : chat.user_a;

      // 3. Fetch partner's profile data
      const { data: user, error: userError } = await supabase
        .from("profiles")
        .select("username, profile_pic")
        .eq("id", partnerId)
        .single();
      if (userError || !user) return;

      setParticipant({ id: partnerId, username: user.username, profile_pic: user.profile_pic });
    };

    fetchParticipant();
  }, [chatId, currentUserId]);

  return participant;
}
