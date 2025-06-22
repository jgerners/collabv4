import React, { useState, useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, View } from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { supabase } from "../../supabaseClient";
import { useFonts } from 'expo-font';
import { BlurView } from 'expo-blur';

interface CollabProps {
  senderId: string;
  receiverId: string;
  postId: string;
}

const Collab: React.FC<CollabProps> = ({ senderId, receiverId, postId }) => {
  const [status, setStatus] = useState<"none" | "pending" | "accepted" | "rejected">("none");
  const [isComplete, setIsComplete] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [locallyCompleted, setLocallyCompleted] = useState(false);

  const [fontsLoaded] = useFonts({
    'Manrope_400Regular': require('../../assets/fonts/Manrope-VariableFont_wght.ttf'),
    // 'BebasNeue-Regular': require('../../assets/fonts/BebasNeue-Regular.ttf'), // Alleen als je deze ook wilt
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
  const maxTranslate = buttonWidth - 45 - 10; // 45 = nieuwe handle width

  // Supabase logic - ONGEWIJZIGD
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
  }, [status, locallyCompleted, arrowOpacity1, arrowOpacity2, arrowOpacity3]);

  const handleSwipeComplete = async () => {
    setIsComplete(true);
    setShowPopup(true);
    setLocallyCompleted(true);

    Animated.spring(popupScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    await handleCollabRequest();
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (locallyCompleted) return;

    if (event.nativeEvent.state === State.BEGAN) {
      Animated.timing(blueOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      Animated.spring(handleScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }

    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      Animated.spring(handleScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      
      if (translationX > maxTranslate ) {
        Animated.spring(translateX, {
          toValue: maxTranslate,
          useNativeDriver: true,
        }).start(() => {
          handleSwipeComplete();
        });
      } else {
        Animated.spring(translateX, {
          toValue: 5,
          tension: 400,
          friction: 8,
          useNativeDriver: true,
        }).start();
        
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

  // Status/blur melding
  if (status !== "none" && !locallyCompleted) {
    return (
      <BlurView intensity={50} tint="light" style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {status === "pending" ? "Request Sent" : 
            status === "accepted" ? "Accepted!" : 
            status === "rejected" ? "Declined" : "COLLAB!"}
        </Text>
      </BlurView>
    );
  }

  return (
    <View style={styles.container}>
      {/* BlurView als track background */}
      <BlurView intensity={40} tint="light" style={styles.track}>
        {/* Paarse background animatie */}
        <View style={styles.blueContainer}>
          <Animated.View
            style={[
              styles.blueBackground,
              {
                opacity: blueOpacity,
                transform: [
                  { translateX: -buttonWidth / 2 },
                  {
                    scaleX: translateX.interpolate({
                      inputRange: [0, maxTranslate],
                      outputRange: [0, 1],
                      extrapolate: 'clamp',
                    }),
                  },
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

        {/* Animated arrows */}
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

        {/* Draggable handle */}
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

        {/* Success popup */}
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
      </BlurView>
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
    borderRadius: 28,
    position: 'relative',
    overflow: 'hidden',
    // Geen backgroundColor! BlurView regelt dit.
  },
  blueContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  blueBackground: {
    width: 280,
    height: 56,
    backgroundColor: '#4800FF', // Paarse tint
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
    fontFamily: 'Manrope_400Regular', // Let op: zorg dat je deze font laadt!
    fontSize: 12,
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
    top: 9,
    width: 45,
    height: 38,
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
    backgroundColor: '#4800FF',
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
    // fontFamily: 'BebasNeue-Regular', // optioneel
  },
  statusContainer: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    // backgroundColor: '#4800FF', // Niet nodig, BlurView zorgt voor blur
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    // fontFamily: 'BebasNeue-Regular', // optioneel
  },
});

export default Collab;
