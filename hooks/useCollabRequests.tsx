// hooks/useCollabRequests.ts
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// 🔹 Dit interface beschrijft de ruwe data die we van Supabase terugkrijgen.
//    Let op: 'profiles' en 'posts' zijn de aliassen die we in de .select() gebruiken.
interface CollabRequestRow {
  id: string;
  sender_Id: string;
  receiver_Id: string;
  post_Id: string;
  status: string;
  profiles?: {
    username?: string;
    profile_pic?: string;
  };
  posts?: {
    mediaUrl?: string;
  };
}

// 🔹 Dit interface is wat we uiteindelijk in onze UI willen gebruiken.
//    We mappen de ruwe data naar velden als userName, userProfile, en postImage.
export interface CollabRequest {
  id: string;
  sender_Id: string;    // als je dit nodig hebt voor navigatie
  post_Id: string;      // als je dit nodig hebt
  status: string;
  userName: string;     // gemapte username
  userProfile: string;  // gemapte profielfoto
  postImage: string;    // gemapte post-afbeelding
}

// 🔹 Deze hook haalt de collab requests op voor een specifieke ontvanger (receiverId).
export const useCollabRequests = (receiverId: string) => {
  const [requests, setRequests] = useState<CollabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // 🔥 Relationele select om de data van 'profiles' en 'posts' op te halen
        const { data, error } = await supabase
          .from("collab_requests")
          .select(`
            id,
            sender_Id,
            receiver_Id,
            post_Id,
            status,
            profiles:profiles!collab_requests_sender_Id_fkey (
              username,
              profile_pic
            ),
            posts:posts!collab_requests_post_Id_fkey (
              mediaUrl
            )
          `)
          .eq("receiver_Id", receiverId)
          .eq("status", "pending");

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        // 🔥 Data mappen naar de UI-interface (CollabRequestUI)
        const mapped = (data as CollabRequestRow[]).map((row) => ({
          id: row.id,
          sender_Id: row.sender_Id,
          post_Id: row.post_Id,
          status: row.status,
          userName: row.profiles?.username ?? "Unknown",
          userProfile: row.profiles?.profile_pic ?? "https://via.placeholder.com/50",
          postImage: row.posts?.mediaUrl ?? "https://via.placeholder.com/100",
        }));

        setRequests(mapped);
      } catch (err: any) {
        // Mocht er iets anders fout gaan, bijvoorbeeld een netwerkfout
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [receiverId]);

  return { requests, loading, error };
};
