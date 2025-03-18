// collab.tsx
import React, { useState, useEffect } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { supabase } from "../../supabaseClient";

interface CollabProps {
  senderId: string;
  receiverId: string;
  postId: string;
}

const Collab: React.FC<CollabProps> = ({ senderId, receiverId, postId }) => {
  // Houd de status van het verzoek bij: "none", "pending", "accepted" of "rejected"
  const [status, setStatus] = useState<"none" | "pending" | "accepted" | "rejected">("none");

  // Realtime abonnement zodat je updates krijgt als de status verandert in de database
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

  // Functie om het collab verzoek te versturen
  const handlePress = async () => {
    if (status === "pending") {
      console.log("Er is al een verzoek in behandeling.");
      return;
    }
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

    console.log("Insert response:", { data, error });

    // Als error een leeg object is, gaan we ervan uit dat er geen fout is
    if (error && Object.keys(error).length > 0) {
      console.error("Fout bij verzenden collab request:", error);
      return;
    } else {
      setStatus("pending");
    }
  };

  return (
    <TouchableOpacity style={styles.collabButton} onPress={handlePress}>
      <Text style={styles.collabText}>
        {status === "pending" ? "Request Sent" : "COLLAB!"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  collabButton: {
    backgroundColor: "purple",
    padding: 5,
    borderRadius: 15,
    marginRight: 10,
    height: 30,
    width: 100,
    alignItems: "center",
  },
  collabText: {
    color: "white",
  },
});

export default Collab;
