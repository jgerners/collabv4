import React, { useState, useEffect, useRef, useCallback } from "react";
import { Animated, Text, StyleSheet, View } from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { supabase } from "../../supabaseClient";
import { useFonts } from 'expo-font';

interface CollabProps {
  senderId: string;
  receiverId: string;
  postId: string;
}

const Collab: React.FC<CollabProps> = ({ senderId, receiverId, postId }) => {
  const [status, setStatus] = useState<"none" | "pending" | "accepted" | "rejected">("none");
  const [isComplete, setIsComplete] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [locallyCompleted, setLocallyCompleted] = useState(false); // NEW: Track local completion

  const [fontsLoaded] = useFonts({
    'BebasNeue-Regular': require('../../assets/fonts/Manrope-VariableFont_wght.ttf'),
  });

  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const arrowOpacity1 = useRef(new Animated.Value(0.3)).current;
  const arrowOpacity2 = useRef(new Animated.Value(0.3)).current;
  const arrowOpacity3 = useRef(new Animated.Value(0.3)).current;
  const blueOpacity = useRef(new Animated.Value(0)).current;
  const popupScale = useRef(new Animated.Value(0)).current;
  const handleScale = useRef(new Animated.Value(1)).current;

  const buttonWidth = 280;
  const handleWidth = 56;
  const maxTranslate = buttonWidth - handleWidth - 10;

  // Your existing Supabase logic - UNCHANGED
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

  // Modified database logic - Don't set status immediately
  const handleCollabRequest = async () => {
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
    }
    // REMOVED: setStatus("pending") - let the subscription handle this
    // The popup will stay visible until the subscription updates the status
  };

  // Arrow animation
  useEffect(() => {
    const animateArrows = () => {
      Animated.loop(
        Animated.stagger(1000, [
          Animated.sequence([
            Animated.timing(arrowOpacity1, {
              toValue: 0.8,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(arrowOpacity1, {
              toValue: 0.3,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(arrowOpacity2, {
              toValue: 0.8,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(arrowOpacity2, {
              toValue: 0.3,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(arrowOpacity3, {
              toValue: 0.8,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(arrowOpacity3, {
              toValue: 0.3,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    if (status === "none" && !locallyCompleted) {
      animateArrows();
    }
  }, [status, locallyCompleted]);

  // Handle swipe completion - MODIFIED: Track local completion
  const handleSwipeComplete = async () => {
    setIsComplete(true);
    setShowPopup(true);
    setLocallyCompleted(true); // NEW: Mark as locally completed

    // Animate popup
    Animated.spring(popupScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    // Call your existing database logic
    await handleCollabRequest();

    // Popup stays visible permanently now
  };

  // Gesture handler events
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    // Don't allow gestures if already completed
    if (locallyCompleted) return;

    if (event.nativeEvent.state === State.BEGAN) {
      // Start drag - show blue background
      Animated.timing(blueOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Scale down handle slightly
      Animated.spring(handleScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }

    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      // Scale handle back to normal
      Animated.spring(handleScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      
      if (translationX > maxTranslate ) {
        // Complete the swipe
        Animated.spring(translateX, {
          toValue: maxTranslate,
          useNativeDriver: true,
        }).start(() => {
          handleSwipeComplete();
        });
      } else {
        // Bounce back with nice spring animation
        Animated.spring(translateX, {
          toValue: 5,
          tension: 400,
          friction: 8,
          useNativeDriver: true,
        }).start();
        
        // Hide blue background
        Animated.timing(blueOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  // MODIFIED: Show status container only if NOT locally completed
  // If locally completed, show the swiper with popup instead
  if (status !== "none" && !locallyCompleted) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {status === "pending" ? "Request Sent" : 
           status === "accepted" ? "Accepted!" : 
           status === "rejected" ? "Declined" : "COLLAB!"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {/* Blue background that smoothly follows from the left */}
        <View style={styles.blueContainer}>
          <Animated.View
            style={[
              styles.blueBackground,
              {
                opacity: blueOpacity,
                transform: [
                  // 1) schuif de pivot 1/2 breedte naar links
                  { translateX: -buttonWidth / 2 },

                  // 2) scaleX van 0→1 over de volle breedte
                  {
                    scaleX: translateX.interpolate({
                      inputRange: [0, maxTranslate],
                      outputRange: [0, 1],
                      extrapolate: 'clamp',
                    }),
                  },

                  // 3) schuif de pivot weer 1/2 breedte naar rechts
                  { translateX: buttonWidth / 2 },
                ],
              },
            ]}
          />
        </View>

        {/* Text - Hide when completed */}
        {!locallyCompleted && (
          <View style={styles.textContainer}>
            <Text style={styles.swipeText}>swipe to COLLAB!</Text>
          </View>
        )}

        {/* Animated arrows - Hide when completed */}
        {!locallyCompleted && (
          <View style={styles.arrowContainer}>
            <Animated.Text style={[styles.arrow, { opacity: arrowOpacity1 }]}>
              {">"}
            </Animated.Text>
            <Animated.Text style={[styles.arrow, { opacity: arrowOpacity2 }]}>
              {">"}
            </Animated.Text>
            <Animated.Text style={[styles.arrow, { opacity: arrowOpacity3 }]}>
              {">"}
            </Animated.Text>
          </View>
        )}

        {/* Draggable handle with gesture handler */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View
            style={[
              styles.handle,
              {
                transform: [
                  {
                    translateX: translateX.interpolate({
                      inputRange: [0, maxTranslate],
                      outputRange: [0, maxTranslate],
                      extrapolate: 'clamp',
                    }),
                  },
                  { scale: handleScale },
                ],
              },
            ]}
          >
            {isComplete && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </Animated.View>
        </PanGestureHandler>
      </View>

      {/* Success popup - Now stays visible permanently after completion */}
      {showPopup && (
        <Animated.View
          style={[
            styles.popup,
            {
              transform: [{ scale: popupScale }],
            },
          ]}
        >
          <Text style={styles.popupText}>✓ COLLAB! sent</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: 280,
    height: 56,
    backgroundColor: 'rgba(130, 130, 130, 0.35)',
    borderRadius: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  blueContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    alignItems: 'flex-start', // Align to left
    justifyContent: 'center',
    
  },
  blueBackground: {
    width: 280, // Full width
    height: 56,
    backgroundColor: '#0066ff',
    borderRadius: 28,
    
  },
  textContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'inter',
  },
  arrowContainer: {
    position: 'absolute',
    right: 24,
    top: 0,
    bottom: 2.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  arrow: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  handle: {
    position: 'absolute',
    left: 5,
    top: 6,
    width: 56,
    height: 44,
    backgroundColor: 'white',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  checkmark: {
    color: '#0066ff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  popup: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0066ff',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  popupText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'BebasNeue-Regular',
  },
  statusContainer: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#4800FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'BebasNeue-Regular',
  },
});

export default Collab;