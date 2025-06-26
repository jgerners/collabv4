import React from "react";
import { createSharedElementStackNavigator } from "react-navigation-shared-element";
import FeedScreen from "./(tabs)/feedtest";           // Pas dit pad aan als nodig!
import PostDetailScreen from "./screens/PostDetailScreen"; // Pas dit pad aan als nodig!

const Stack = createSharedElementStackNavigator();

export default function PostStack() {
  return (
    <Stack.Navigator initialRouteName="Feed">
      <Stack.Screen
        name="Feed"
        component={FeedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ headerShown: false }}
        sharedElements={(route) => {
          const { postId } = route.params;
          return [`media-${postId}`];
        }}
      />
    </Stack.Navigator>
  );
}
