import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import io from "socket.io-client";

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

const SOCKET_SERVER_URL = "http://192.168.178.143:3000"; // Your socket server URL

export const useChatMessages = (chatId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep socket reference
  const socketRef = useRef<any>(null);

  // Initial data fetch of chat history
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
      console.log("[useChatMessages] Messages fetched:", data.length);
      setMessages(data as ChatMessage[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!chatId) return;
    fetchMessages();
  }, [chatId]);

  

  // Socket.io initialization, join the room and listen for real-time updates
  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[useChatMessages] Socket connected:", socket.id);
      socket.emit("joinChat", chatId);
    });

    socket.on("chatMessage", (data: ChatMessage) => {
      console.log("[useChatMessages] Socket received message:", data);
      if (data.chat_id === chatId) {
        setMessages((prev) => {
          if (!prev.find((msg) => msg.id === data.id)) {
            const updated = [...prev, data];
            updated.sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );
            return updated;
          }
          return prev;
        });
      }
    });

    return () => {
      socket.disconnect();
      console.log("[useChatMessages] Socket disconnected");
    };
  }, [chatId]);

  // Send message: insert to Supabase and then emit via socket
  const sendMessage = async (newMessage: NewChatMessage) => {
    console.log("[useChatMessages] Sending message:", newMessage);
    
    // Insert the message to the database
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
      return { error };
    }

    console.log("[useChatMessages] Message sent successfully, response:", data);
    const insertedMessage = (data as ChatMessage[])[0];

    // Emit the full message via socket
    if (socketRef.current) {
      socketRef.current.emit("chatMessage", insertedMessage);
      console.log("[useChatMessages] Emitted chatMessage via socket:", insertedMessage);
    }

    setMessages((prev) => {
      if (!prev.find((msg) => msg.id === insertedMessage.id)) {
        const updated = [...prev, insertedMessage];
        updated.sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );
        return updated;
      }
      return prev;
    });

    return { data };
  };

  return { messages, setMessages, loading, error, refetch: fetchMessages, sendMessage };
};

export default useChatMessages;