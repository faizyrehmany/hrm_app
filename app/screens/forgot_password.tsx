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

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async () => {
        if (!email) return;

        setIsLoading(true);

        // TODO: Call your reset password API here
        setTimeout(() => {
            setIsLoading(false);
            router.back();
        }, 1500);
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />

            {/* Background Header */}
            <View style={styles.headerBackground}>
                <Image
                    source={require('../../assets/images/login_bg.jpg')}
                    style={styles.headerImage}
                    resizeMode="cover"
                />

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


                        {/* Title */}
                        <Animated.View
                            entering={FadeInDown.delay(200).duration(600).springify()}
                            style={styles.titleContainer}
                        >
                            <MaskedView
                                style={{ height: 40 }}
                                maskElement={
                                    <Text style={[styles.title, { backgroundColor: 'transparent' }]}>
                                        Forgot Password
                                    </Text>
                                }
                            >
                                <LinearGradient
                                    colors={['#38519bff', '#0b163aff']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{ flex: 1 }}
                                >
                                    <Text style={[styles.title, { opacity: 0 }]}>
                                        Forgot Password
                                    </Text>
                                </LinearGradient>
                            </MaskedView>

                            <Text style={styles.subtitle}>
                                Enter your email to receive reset instructions.
                            </Text>
                        </Animated.View>


                        {/* Form */}
                        <Animated.View
                            entering={FadeInDown.delay(300).duration(600).springify()}
                            style={styles.formContainer}
                        >
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIconContainer}>
                                    <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    placeholderTextColor="#9ca3af"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                            </View>

                            {/* Reset Button */}
                            <TouchableOpacity
                                style={styles.loginButtonContainer}
                                onPress={handleReset}
                                disabled={isLoading}
                            >
                                <LinearGradient
                                    colors={['#1e3a8a', '#172554']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.loginButton}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <>
                                            <Text style={styles.loginButtonText}>
                                                Send Reset Link
                                            </Text>
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

                            {/* Back to Login */}
                            <View style={styles.registerContainer}>
                                <Text style={styles.registerText}>
                                    Remember your password?
                                </Text>
                                <TouchableOpacity onPress={() => router.back()}>
                                    <Text style={styles.registerLink}> Log In</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>

                        <Animated.View
                            entering={FadeInUp.delay(400).duration(600)}
                            style={styles.footer}
                        >
                            <Text style={styles.footerText}>
                                Secure Employee Portal v2.4.0
                            </Text>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    headerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.45,
        overflow: 'hidden',
    },
    headerImage: { width: '100%', height: '100%' },
    headerGradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    safeArea: { flex: 1 },
    keyboardAvoidingView: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingTop: height * 0.2,
        paddingHorizontal: 24,
        paddingBottom: 20,
        alignItems: 'center', // 👈 ADD THIS

    },
    titleContainer: { alignItems: 'center', marginBottom: 32 },
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
    formContainer: { width: '100%' },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        height: 56,
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    inputIconContainer: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: '#334155' },
    loginButtonContainer: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
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
    loginButtonIcon: { marginLeft: 4 },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    registerText: { fontSize: 14, color: '#64748b' },
    registerLink: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '700',
    },
    footer: { alignItems: 'center', marginTop: 'auto' },
    footerText: { fontSize: 12, color: '#94a3b8' },



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
});