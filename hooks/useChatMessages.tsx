import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

// Nieuwe definitie voor een nieuw bericht (zonder id en created_at)
export type NewChatMessage = {
  sender_id: string;
  message: string;
};

export const useChatMessages = (chatId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ophalen van bestaande berichten
  const fetchMessages = async () => {
    console.log("[useChatMessages] Fetching messages for chatId:", chatId);
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[useChatMessages] Error fetching messages:", error.message);
      setError(error.message);
    } else if (data) {
      console.log("[useChatMessages] Messages fetched:", data);
      setMessages(data as ChatMessage[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!chatId) return;

    // Eerste fetch
    fetchMessages();

    console.log("[useChatMessages] Setting up realtime subscription for chatId:", chatId);
    const subscription = supabase
      .channel("chat_messages_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload: any) => {
          console.log("[useChatMessages] (DEBUG) Realtime payload received:", payload);
          setMessages((prev) => {
            // Verwijder eerst eventuele tijdelijke berichten die overeenkomen
            let newMessages = prev.filter(
              (msg) =>
                !(msg.id.startsWith("temp-") &&
                  msg.sender_id === payload.new.sender_id &&
                  msg.message === payload.new.message)
            );
            // Voeg het nieuwe bericht toe als het nog niet voorkomt
            if (!newMessages.find((msg) => msg.id === payload.new.id)) {
              newMessages.push(payload.new);
            }
            // Sorteer altijd op created_at (chronologisch)
            newMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            return newMessages;
          });
        }
      )
      .subscribe();

    console.log("[useChatMessages] Realtime subscription set up:", subscription);

    return () => {
      console.log("[useChatMessages] Removing realtime subscription for chatId:", chatId);
      supabase.removeChannel(subscription);
    };
  }, [chatId]);

  // Optimistische sendMessage functie
  const sendMessage = async (newMessage: NewChatMessage) => {
    console.log("[useChatMessages] Sending message:", newMessage);
    // Maak een tijdelijk bericht met een tijdelijke ID
    const tempId = "temp-" + new Date().getTime();
    const temporaryMessage: ChatMessage = {
      id: tempId,
      chat_id: chatId,
      sender_id: newMessage.sender_id,
      message: newMessage.message,
      created_at: new Date().toISOString(),
    };

    // Voeg het tijdelijke bericht meteen toe
    setMessages((prev) => [...prev, temporaryMessage]);

    const { data, error } = await supabase
      .from("chat_messages")
      .insert([
        {
          chat_id: chatId,
          sender_id: newMessage.sender_id,
          message: newMessage.message,
          created_at: new Date().toISOString(),
        },
      ])
      .select("*");
    if (error) {
      console.error("[useChatMessages] Error sending message:", error.message);
      // Verwijder het tijdelijke bericht als er een error is
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      return { error };
    }
    console.log("[useChatMessages] Message sent, response:", data);
    // Verwijder het tijdelijke bericht en voeg het echte bericht toe
    setMessages((prev) => {
      const filtered = prev.filter((msg) => msg.id !== tempId);
      return [...filtered, ...(data as ChatMessage[])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
    return { data };
  };

  return { messages, loading, error, refetch: fetchMessages, sendMessage };
};

export default useChatMessages;
