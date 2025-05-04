import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import SelectMediaScreen from '../app/screens/SelectMediaScreen'
import UploadScreen      from '../app/(tabs)/upload'   // jouw bestaande component

export type UploadStackParamList = {
  SelectMedia: undefined
  UploadForm     : { mediaUri: string; mediaType: 'video' | 'photo' }
}

const Stack = createNativeStackNavigator<UploadStackParamList>()

export default function UploadNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="SelectMedia"      // start in het keuzescherm
      screenOptions={{ 
         headerShown: false,
         presentation: 'transparentModal',  // <<< hier
         contentStyle: { backgroundColor: 'transparent' },

         }}
    >
      <Stack.Screen name="SelectMedia" component={SelectMediaScreen} />
      <Stack.Screen name="UploadForm"      component={UploadScreen}      />
    </Stack.Navigator>
  )
}
