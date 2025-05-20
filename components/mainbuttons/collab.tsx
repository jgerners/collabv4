import React, { useState, useEffect, useRef, useCallback } from "react";
import { Animated, TouchableOpacity, Text, StyleSheet, Easing } from "react-native";
import { supabase } from "../../supabaseClient";
import { LinearGradient } from "expo-linear-gradient";

import {useFonts} from 'expo-font';


interface CollabProps {
  senderId: string;
  receiverId: string;
  postId: string;
}

const Collab: React.FC<CollabProps> = ({ senderId, receiverId, postId }) => {
  const [status, setStatus] = useState<"none" | "pending" | "accepted" | "rejected">("none");

  const [fontsLoaded] = useFonts({
    'BebasNeue-Regular': require('../../assets/fonts/BebasNeue-Regular.ttf'),
  }); 


  // Realtime abonnement voor status updates
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
    if (error && Object.keys(error).length > 0) {
      console.error("Fout bij verzenden collab request:", error);
      return;
    } else {
      setStatus("pending");
    }
  };

  // Maak een Animated.Value aan
  const animValue = useRef(new Animated.Value(0)).current;

  // Functie die de animatie start
  const startAnimation = useCallback(() => {
    // Reset de animatie-waarde
    animValue.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [animValue]);

  // Start de animatie bij mount
  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  // Interpoleer de animated waarde naar de startpositie
  // Wanneer animValue oploopt van 0 naar 1: start.x gaat van 0 naar 1
  // Wanneer animValue teruggaat van 1 naar 0: start.x gaat weer van 1 naar 0,
  // zodat de knop eerst donkerder wordt (donkere kleur meer dominant)
  // en dan weer lichter (lichte kleur komt weer naar voren).
  const animatedStartX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (!fontsLoaded) {
    return null;
  }

  
  const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

  return (
    <TouchableOpacity onPress={handlePress} style={styles.buttonContainer}>
      {/* Gebruik onLayout om de animatie opnieuw te starten wanneer de component wordt gelayout */}
      <AnimatedLinearGradient
        style={styles.collabButton}
        onLayout={startAnimation}
        start={{ x: animatedStartX, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={["transparant", "transparant"]}
      >
        <Text style={styles.collabText}>
          {status === "pending" ? "Request Sent" : "COLLAB!"}
        </Text>
      </AnimatedLinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    
  },
  collabButton: {
    paddingVertical: 3,
    paddingHorizontal: 20,
    borderRadius: 12,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "blue",

    
   
    
  },
  collabText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    fontFamily: 'Boldonse-Regular',
    fontWeight: 'bold',
    left: 1
   
  },
});

export default Collab;
