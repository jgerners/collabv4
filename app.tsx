import React from 'react';
import { AuthProvider } from './context/authContext'; // Zorg dat het pad klopt
import AppNavigator from './app/(tabs)/_layout'; // Dit is jouw layout.tsx als navigator

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
