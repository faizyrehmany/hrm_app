
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { loginUser } from '../services/auth'; // Changed from require to import

const { width, height } = Dimensions.get('window');

import { jwtDecode } from "jwt-decode";
import { startBackgroundTracking } from '../components/backgroundLocation';
import { CustomToast } from '../components/CustomToast';
import { startTracking } from '../components/LocationTrack';
import SplashScreen from '../components/SplashScreen';
import { SessionManager } from '../services/SessionManager';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isAppReady, setIsAppReady] = useState(false);




  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  if (!isAppReady) {
    return <SplashScreen onFinish={() => setIsAppReady(true)} />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      {/* Render Custom Toast */}
      <CustomToast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />

      {/* Background Header - Simulating the building image with a gradient/pattern */}
      <View style={styles.headerBackground}>
        {/* Use the generated image if available, else fallback to gradient */}
        <Image
          source={require('../../assets/images/login_bg.jpg')}
          style={styles.headerImage}
          resizeMode="cover"
        />

        {/* Gradient Overlay for better text contrast if needed, or just style matching the image */}
        <LinearGradient
          colors={['rgba(59, 130, 246, 0)', 'rgba(255, 255, 255, 1)']}
          style={styles.headerGradientOverlay}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0, y: 1 }}
        />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo Section */}
            <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.logoContainer}>
              <View style={styles.logoBox}>
                <Image
                  source={require('../../assets/images/new_logo.png')}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              </View>
            </Animated.View>

            {/* Welcome Text */}
            <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} style={styles.titleContainer}>
              <MaskedView
                style={{ height: 40 }}
                maskElement={
                  <Text style={[styles.title, { backgroundColor: 'transparent' }]}>Welcome Back</Text>
                }
              >
                <LinearGradient
                  colors={['#38519bff', '#0b163aff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                >
                  <Text style={[styles.title, { opacity: 0 }]}>Welcome Back</Text>
                </LinearGradient>
              </MaskedView>
              <Text style={styles.subtitle}>Please sign in to your employee portal.</Text>
            </Animated.View>

            {/* Form Section */}
            <Animated.View entering={FadeInDown.delay(300).duration(600).springify()} style={styles.formContainer}>

              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email / Username"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push('/screens/forgot_password')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginButtonContainer}
                disabled={isLoading}
                onPress={async () => {
                  if (isLoading) return;

                  if (!email || !password) {
                    triggerToast("Please enter email and password");
                    return;
                  }

                  setIsLoading(true);

                  try {
                    const result = await loginUser(email.trim(), password);

                    if (result?.success && result?.data?.accessToken) {
                      const token = result.data.accessToken;

                      // 🔥 Decode JWT to extract enrollNo
                      let enrollNo = "";
                      try {
                        const decoded: any = jwtDecode(token);
                        enrollNo = decoded?.unique_name || "";
                        console.log("Decoded enrollNo:", enrollNo);
                      } catch (err) {
                        console.log("Token decode failed:", err);
                      }

                      const userRole = result.data?.role || "Employee";

                      // ✅ Save everything in session
                      await SessionManager.saveSession(
                        {
                          ...result.data,
                          id: result.data.employeeId,
                          employeeId: result.data.employeeId,
                          role: userRole,
                          enrollNo: enrollNo,
                          departmentName: result.data?.departmentName || null,
                        },
                        token
                      );

                      console.log("Session saved successfully");

                      await startTracking();

                      await startBackgroundTracking();

                      // THEN navigate
                      if (userRole.toLowerCase() === "admin") {
                        router.replace("/screens/dashboard");
                      } else {
                        router.replace("/screens/employee_dashboard");
                      }
                    } else {
                      // ❌ Handle login failure
                      let msg = "";

                      if (typeof result?.data === "string") {
                        msg = result.data;
                      } else if (result?.data?.message) {
                        msg = result.data.message;
                      } else if (result?.error) {
                        msg = JSON.stringify(result.error);
                      } else {
                        msg = "Login failed";
                      }

                      if (
                        msg.toLowerCase().includes("invalid") ||
                        msg.toLowerCase().includes("credential")
                      ) {
                        triggerToast("Invalid Credentials");
                      } else {
                        triggerToast(msg);
                      }
                    }
                  } catch (error: any) {
                    console.log("Login error:", error);
                    triggerToast("Something went wrong. Please try again.");
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                <LinearGradient
                  colors={["#1e3a8a", "#172554"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButton}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Log In</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color="#fff"
                        style={styles.loginButtonIcon}
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Buttons */}
              <View style={styles.socialButtonsContainer}>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="happy-outline" size={22} color="#4b5563" style={{ marginRight: 8 }} />
                  <Text style={styles.socialButtonText}>Face ID</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/screens/register')}>
                  <Text style={styles.registerLink}>Register</Text>
                </TouchableOpacity>
              </View>

            </Animated.View>

            <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.footer}>
              <Text style={styles.footerText}>Secure Employee Portal v2.4.0</Text>
              <TouchableOpacity>
                <Text style={styles.helpText}>Need help signing in?</Text>
              </TouchableOpacity>
            </Animated.View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.45,
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: height * 0.15,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  logoBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.5,
    maxWidth: 400,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 56,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#334155',
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 14,
  },
  loginButtonContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  loginButtonIcon: {
    marginLeft: 4,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  socialButton: {
    width: '60%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  registerText: {
    fontSize: 14,
    color: '#64748b',
  },
  registerLink: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '700',
  },
});



