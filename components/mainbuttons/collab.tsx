import React, { useState, useEffect } from "react";
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from "react-native";
import { supabase } from "../../supabaseClient";
import { useFonts } from 'expo-font';
import { BlurView } from 'expo-blur';

import { Users } from "lucide-react-native";

interface CollabProps {
  senderId: string;
  receiverId: string;
  postId: string;
  width?: number;     // << nieuw!
}

const Collab: React.FC<CollabProps> = ({ senderId, receiverId, postId, width }) => {
  const [status, setStatus] = useState<"none" | "pending" | "accepted" | "rejected">("none");
  const [loading, setLoading] = useState(false);
  const [fontsLoaded] = useFonts({
    'Manrope_400Regular': require('../../assets/fonts/Manrope-VariableFont_wght.ttf'),
  });

  useEffect(() => {
    const subscription = supabase
      .channel("collab_requests_channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "collab_requests",
          filter: `sender_id=eq.${senderId}`,
        },
        (payload: any) => {
          if (payload.new.post_id === postId) {
            setStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [senderId, postId]);

  const handleCollabRequest = async () => {
    if (status === "pending") {
      // al verzonden
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("collab_requests")
      .insert([
        {
          sender_Id: senderId,
          receiver_Id: receiverId,
          post_Id: postId,
          status: "pending",
        },
      ])
      .select("*");
    setLoading(false);
    if (!error) setStatus("pending");
  };

  if (!fontsLoaded) return null;

  // Status indicator (optioneel: je kan deze verwijderen)
  if (status !== "none") {
    return (
      <BlurView intensity={35} tint="light" style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {status === "pending" ? "Verzoek verzonden" : status === "accepted" ? "Geaccepteerd!" : status === "rejected" ? "Geweigerd" : "Collab!"}
        </Text>
      </BlurView>
    );
  }

  return (
   <TouchableOpacity
  style={styles.bubble}
  onPress={handleCollabRequest}
  activeOpacity={0.85}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator color="#fff" size="small" />
  ) : (
    <View style={styles.rowCenter}>
      <Users size={17} color="#fff" style={{ marginRight: 7 }} />
      <Text style={styles.bubbleText}>collab</Text>
    </View>
  )}
</TouchableOpacity>

  );
};

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: "#4B0092", // Standaard achtergrondkleur, kan overschreven worden door de prop
    width: "100%", // Standaard breedte, kan overschreven worden door de prop
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 33,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 3,
  
  },
rowCenter: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 7, // Mag ook alleen marginRight op het icoon als je wilt
},

  bubbleText: {
    color: "#fff",
    fontWeight: "700",
    fontFamily: "Jost_700Bold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statusContainer: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 18,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    color: '#4800FF',
    fontSize: 15,
    fontWeight: "bold",
    fontFamily: "Manrope_400Regular",
    textAlign: "center",
  },
});

export default Collab;
