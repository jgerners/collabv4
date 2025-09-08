import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../routes"; // Zorg dat dit pad correct is!
import { useAuth } from "../../context/authContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>(); // Correct getypeerd
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
              <Ionicons name="chevron-back" size={26} color="#E6E6E6" />
            </Pressable>

            <Text style={styles.title}>Maak een nieuw account aan</Text>
            <Text style={styles.subtitle}>Registreer om direct aan de slag te gaan</Text>

            <View style={styles.card}>
              <View style={styles.segmentedControl}>
                <Pressable style={styles.segment} onPress={() => navigation.navigate("Login") }>
                  <Text style={styles.segmentText}>Login</Text>
                </Pressable>
                <Pressable style={[styles.segment, styles.segmentActive]} onPress={() => {}}>
                  <Text style={[styles.segmentText, styles.segmentTextActive]}>Register</Text>
                </Pressable>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="email-outline" color="#B8BDC7" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="E-mail"
                  placeholderTextColor="#8C919A"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="lock-outline" color="#B8BDC7" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Wachtwoord"
                  placeholderTextColor="#8C919A"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword(prev => !prev)} style={styles.eye} hitSlop={10}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#B8BDC7" />
                </Pressable>
              </View>

              <Pressable style={styles.primaryButton} onPress={handleRegister}>
                <Text style={styles.primaryButtonText}>Account aanmaken</Text>
              </Pressable>
            </View>

            <Text style={styles.bottomText}>
              Heb je al een account?
              <Text style={styles.bottomLink} onPress={() => navigation.navigate("Login")}>  Log hier in</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0E0E10" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 18,
  },
  title: { color: "#F2F2F3", fontSize: 28, fontWeight: "800", lineHeight: 34, marginBottom: 6 },
  subtitle: { color: "#9EA2AB", fontSize: 14, marginBottom: 18 },
  card: {
    backgroundColor: "#141416",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#0F1012",
    padding: 6,
    borderRadius: 14,
    marginBottom: 14,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  segmentActive: { backgroundColor: "#1E1F23" },
  segmentText: { color: "#8C919A", fontWeight: "600" },
  segmentTextActive: { color: "#F2F2F3" },
  error: { color: "#FF5A5F", marginBottom: 8, textAlign: "center" },
  inputRow: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#0F1012",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2024",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: "#E6E7EB",
    paddingVertical: 12,
    fontSize: 16,
  },
  eye: { padding: 4 },
  primaryButton: {
    backgroundColor: "#7CA787",
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  primaryButtonText: { color: "#0B0B0C", fontSize: 16, fontWeight: "700" },
  bottomText: { color: "#9EA2AB", textAlign: "center", marginTop: 16 },
  bottomLink: { color: "#88A889", fontWeight: "700" },
});
