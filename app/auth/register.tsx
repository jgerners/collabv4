import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../routes"; // Zorg dat dit pad correct is!
import { useAuth } from "../../context/authContext";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>(); // Correct getypeerd
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    try {
      await signUp(email, password);
      // Na succesvolle registratie navigeer direct naar EditProfile
      navigation.navigate("EditProfile");
    } catch (err) {
      setError("Registratie mislukt. Probeer een ander e-mailadres.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registreer</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        placeholderTextColor="#aaa"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Wachtwoord"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Account aanmaken" onPress={handleRegister} />
      <Text style={styles.loginText}>
        Heb je al een account?{" "}
        <Text style={styles.loginLink} onPress={() => navigation.navigate("Login")}>
          Log hier in
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212" },
  title: { color: "white", fontSize: 24, marginBottom: 20 },
  input: { backgroundColor: "#1E1E1E", color: "white", padding: 10, marginBottom: 10, width: "80%", borderRadius: 5 },
  error: { color: "red", marginBottom: 10 },
  loginText: { color: "white", textAlign: "center", marginTop: 10 },
  loginLink: { color: "#A020F0", fontWeight: "bold" },
});
