import { View, Text, TextInput, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { useState } from "react";
import { useAuth } from "../../context/authContext";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../routes"; // Zorg dat dit pad correct is!
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>(); // ✅ Correct getypeerd
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      await signIn(email, password);
      navigation.navigate("Main");
    } catch (err) {
      setError("Login mislukt. Controleer je gegevens.");
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

            <Text style={styles.title}>Ga aan de slag en maak je account</Text>
            <Text style={styles.subtitle}>Log in om een strakke ervaring te krijgen</Text>

            <View style={styles.card}>
              <View style={styles.segmentedControl}>
                <Pressable style={[styles.segment, styles.segmentActive]} onPress={() => {}}>
                  <Text style={[styles.segmentText, styles.segmentTextActive]}>Login</Text>
                </Pressable>
                <Pressable style={styles.segment} onPress={() => navigation.navigate("Register") }>
                  <Text style={styles.segmentText}>Register</Text>
                </Pressable>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="email-outline" color="#B8BDC7" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#8C919A"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="lock-outline" color="#B8BDC7" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#8C919A"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword(prev => !prev)} style={styles.eye} hitSlop={10}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#B8BDC7" />
                </Pressable>
              </View>

              <View style={styles.rowBetween}>
                <Pressable style={styles.rememberMe} onPress={() => setRememberMe(!rememberMe)}>
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe ? <Ionicons name="checkmark" color="#111" size={14} /> : null}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </Pressable>

                <Pressable onPress={() => {}}>
                  <Text style={styles.link}>Forgot Password?</Text>
                </Pressable>
              </View>

              <Pressable style={styles.primaryButton} onPress={handleLogin}>
                <Text style={styles.primaryButtonText}>Login</Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.orText}>Or login with</Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.socialRow}>
                <Pressable style={styles.socialButton}>
                  <Ionicons name="logo-google" size={18} color="#DE5246" />
                  <Text style={styles.socialText}>Google</Text>
                </Pressable>
                <Pressable style={styles.socialButton}>
                  <Ionicons name="logo-facebook" size={18} color="#1877F2" />
                  <Text style={styles.socialText}>Facebook</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.bottomText}>
              Geen account?
              <Text style={styles.bottomLink} onPress={() => navigation.navigate("Register")}>  Registreer</Text>
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
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6, marginBottom: 12 },
  rememberMe: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#3A3B40",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: { backgroundColor: "#7CA787", borderColor: "#7CA787" },
  rememberText: { color: "#C7CAD1" },
  link: { color: "#88A889", fontWeight: "600" },
  primaryButton: {
    backgroundColor: "#7CA787",
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  primaryButtonText: { color: "#0B0B0C", fontSize: 16, fontWeight: "700" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  divider: { flex: 1, height: 1, backgroundColor: "#1F2024" },
  orText: { color: "#8C919A", marginHorizontal: 10 },
  socialRow: { flexDirection: "row", gap: 12 },
  socialButton: {
    flex: 1,
    borderColor: "#1F2024",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#0F1012",
  },
  socialText: { color: "#E6E7EB", fontWeight: "600" },
  bottomText: { color: "#9EA2AB", textAlign: "center", marginTop: 16 },
  bottomLink: { color: "#88A889", fontWeight: "700" },
});
