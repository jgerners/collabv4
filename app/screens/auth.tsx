import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { supabase } from "../../supabaseClient"; // Zorg dat dit pad klopt met jouw projectstructuur

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    setError(null);
    try {
      if (isRegistering) {
        // Registratie
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        console.log("Registratie succesvol:", data.user);
        // Hier kun je eventueel aangeven dat een verificatiemail is verstuurd
      } else {
        // Inloggen
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        console.log("Login succesvol:", data.user);
        // Sla eventueel de userID of sessie op in je state/context en navigeer door
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{isRegistering ? "Register" : "Login"}</Text>
      {error && <Text style={styles.errorText}>Error: {error}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={isRegistering ? "Register" : "Login"}
        onPress={handleAuth}
      />
      <Button
        title={`Switch to ${isRegistering ? "Login" : "Register"}`}
        onPress={() => setIsRegistering(!isRegistering)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#121212",
  },
  header: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1E1E1E",
    color: "#fff",
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
});

export default AuthScreen;
