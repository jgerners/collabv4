import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { useState } from "react";
import { useAuth } from "../../context/authContext";
import { router } from "expo-router";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      await signIn(email, password);
      router.replace("/(tabs)/feedtest"); // Stuur gebruiker naar de feed na inloggen
    } catch (err) {
      setError("Login mislukt. Controleer je gegevens.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput style={styles.input} placeholder="Email" onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Wachtwoord" secureTextEntry onChangeText={setPassword} />
      <Button title="Login" onPress={handleLogin} />
      <Text style={styles.registerText}>
  Nog geen account?{" "}
  <Text style={styles.registerLink} onPress={() => router.push("/auth/register")}>
    Registreer hier
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
  registerText: {
    color: "white",
    textAlign: "center",
    marginTop: 10,
  },
  registerLink: {
    color: "#A020F0", // Paarse kleur
    fontWeight: "bold",
  },
  
  loginText: {
    color: "white",
    textAlign: "center",
    marginTop: 10,
  },
  loginLink: {
    color: "#A020F0", // Paarse kleur
    fontWeight: "bold",
  },
  
});
