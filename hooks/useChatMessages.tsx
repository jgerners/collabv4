import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import io from "socket.io-client";
import { useFocusEffect } from "@react-navigation/native";

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export type NewChatMessage = {
  sender_id: string;
  message: string;
};

const SOCKET_SERVER_URL = "http://192.168.178.145:3000"; // Pas dit aan indien nodig

export const useChatMessages = (chatId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bewaar de socket referentie
  const socketRef = useRef<any>(null);

  // Functie voor het ophalen van de chatgeschiedenis
  const fetchMessages = async () => {
    if (!chatId) return;
    
  
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

      console.log("[useChatMessages] Aantal opgehaalde berichten:", data?.length);


    if (error) {

      setError(error.message);
    } else if (data) {
  
      setMessages(data as ChatMessage[]);
    }
    setLoading(false);
  };

  // Initiale data-fetch bij mount of wanneer chatId verandert
  useEffect(() => {
    if (!chatId) return;
    fetchMessages();
  }, [chatId]);

  // Gebruik useFocusEffect om de chatgeschiedenis opnieuw op te halen zodra de chat in focus komt.
  useFocusEffect(
    useCallback(() => {
      if (chatId) {

        fetchMessages();
      }
    }, [chatId])
  );

  // Socket.io initialisatie: maak verbinding, join de chatroom en luister naar realtime updates.
  useEffect(() => {
    if (!chatId) return;
    const socket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {

      socket.emit("joinChat", chatId);
    });

    socket.on("chatMessage", (data: ChatMessage) => {
    
      if (data.chat_id === chatId) {
        setMessages((prev) => {
          if (!prev.find((msg) => msg.id === data.id)) {
            const updated = [...prev, data];
            updated.sort(
              (a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            return updated;
          }
          return prev;
        });
      }
    });

    return () => {
      socket.disconnect();
    
    };
  }, [chatId]);

  // Verstuur een nieuw bericht: insert naar Supabase en emit via socket
  const sendMessage = async (newMessage: NewChatMessage) => {
    
    
    // Insert het bericht naar de database
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

      return { error };
    }


    const insertedMessage = (data as ChatMessage[])[0];

    // Emit het bericht via socket
    if (socketRef.current) {
      socketRef.current.emit("chatMessage", insertedMessage);
      
    }

    // Update de lokale state met het nieuwe bericht
    setMessages((prev) => {
      if (!prev.find((msg) => msg.id === insertedMessage.id)) {
        const updated = [...prev, insertedMessage];
        updated.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        return updated;
      }
      return prev;
    });

    return { data };
  };

  return { messages, loading, error, refetch: fetchMessages, sendMessage };
};

export default useChatMessages;
