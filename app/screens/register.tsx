
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
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
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

import { CustomToast } from '../components/CustomToast';
import { registerUser } from '../services/auth';

export default function RegisterScreen() {
    const router = useRouter();
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    // const [password, setPassword] = useState('Hazq123'); // Preset for testing if needed
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('error');

    // Password Validation State
    const [hasMinLength, setHasMinLength] = useState(false);
    const [hasUpperCase, setHasUpperCase] = useState(false);
    const [hasNonAlphaNumeric, setHasNonAlphaNumeric] = useState(false);

    useEffect(() => {
        setHasMinLength(password.length >= 10);
        setHasUpperCase(/[A-Z]/.test(password));
        setHasNonAlphaNumeric(/[^a-zA-Z0-9]/.test(password));
    }, [password]);

    const isPasswordValid = hasMinLength && hasUpperCase && hasNonAlphaNumeric;

    const getPasswordStrength = () => {
        let strength = 0;
        if (hasMinLength) strength++;
        if (hasUpperCase) strength++;
        if (hasNonAlphaNumeric) strength++;
        return strength;
    };

    const getStrengthColor = () => {
        const s = getPasswordStrength();
        if (s === 0) return '#e2e8f0';
        if (s === 1) return '#ef4444'; // Red - Weak
        if (s === 2) return '#f59e0b'; // Amber - Medium
        return '#22c55e'; // Green - Strong
    };

    const getStrengthText = () => {
        const s = getPasswordStrength();
        if (s === 0) return '';
        if (s === 1) return 'Weak';
        if (s === 2) return 'Medium';
        return 'Strong';
    };

    const triggerToast = (msg: string, type: 'success' | 'error' = 'error') => {
        setToastMessage(msg);
        setToastType(type);
        setToastVisible(true);
    };

    const handleRegister = async () => {
        if (isLoading) return;

        // Basic validation
        if (!userName || !email || !password || !fullName) {
            triggerToast("Please fill in all fields");
            return;
        }

        if (!isPasswordValid) {
            triggerToast("Please meet all password requirements");
            return;
        }

        setIsLoading(true);

        try {
            const result = await registerUser({
                userName,
                email,
                password,
                fullName
            });

            if (result.success) {
                triggerToast("Register Successfully", 'success');

                // Redirect to login screen after a short delay to let the toast be seen
                setTimeout(() => {
                    router.push('/screens');
                }, 1500);
            } else {
                // Attempt to extract meaningful error message
                let msg = 'Registration failed';

                if (result.data) {
                    if (typeof result.data === 'string') {
                        msg = result.data;
                    } else if (result.data.message) {
                        msg = result.data.message;
                    } else if (result.data.title) {
                        msg = result.data.title; // sometimes errors come as ProblemDetails
                    } else if (Array.isArray(result.data)) {
                        // Handle array of error messages (like password errors)
                        msg = result.data[0];
                    }
                }

                triggerToast(msg);
            }
        } catch (e) {
            triggerToast('Error: ' + e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />

            {/* Render Custom Toast */}
            <CustomToast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                onHide={() => setToastVisible(false)}
            />

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

                        {/* Title Text */}
                        <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} style={styles.titleContainer}>
                            <MaskedView
                                style={{ height: 40 }}
                                maskElement={
                                    <Text style={[styles.title, { backgroundColor: 'transparent' }]}>Create Account</Text>
                                }
                            >
                                <LinearGradient
                                    colors={['#38519bff', '#0b163aff']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{ flex: 1 }}
                                >
                                    <Text style={[styles.title, { opacity: 0 }]}>Create Account</Text>
                                </LinearGradient>
                            </MaskedView>
                            <Text style={styles.subtitle}>Sign up to get started!</Text>
                        </Animated.View>

                        {/* Form Section */}
                        <Animated.View entering={FadeInDown.delay(300).duration(600).springify()} style={styles.formContainer}>

                            {/* Full Name Input */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIconContainer}>
                                    <Ionicons name="person-outline" size={20} color="#9ca3af" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    placeholderTextColor="#9ca3af"
                                    value={fullName}
                                    onChangeText={setFullName}
                                    editable={!isLoading}
                                />
                            </View>

                            {/* User Name Input */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIconContainer}>
                                    <Ionicons name="person-circle-outline" size={20} color="#9ca3af" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="User Name"
                                    placeholderTextColor="#9ca3af"
                                    value={userName}
                                    onChangeText={setUserName}
                                    autoCapitalize="none"
                                    editable={!isLoading}
                                />
                            </View>

                            {/* Email Input */}
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputIconContainer}>
                                    <Ionicons name="mail-outline" size={20} color="#9ca3af" />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="#9ca3af"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
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

                            {/* Password Strength Indicator */}
                            {password.length > 0 && (
                                <View style={styles.strengthContainer}>
                                    <View style={styles.strengthHeader}>
                                        <Text style={styles.strengthLabel}>Password Strength:</Text>
                                        <Text style={[styles.strengthValue, { color: getStrengthColor() }]}>
                                            {getStrengthText()}
                                        </Text>
                                    </View>

                                    {/* Strength Bar */}
                                    <View style={styles.strengthBarContainer}>
                                        <View style={[styles.strengthBarChunk, { backgroundColor: getPasswordStrength() >= 1 ? '#ef4444' : '#e2e8f0' }]} />
                                        <View style={[styles.strengthBarChunk, { backgroundColor: getPasswordStrength() >= 2 ? '#f59e0b' : '#e2e8f0' }]} />
                                        <View style={[styles.strengthBarChunk, { backgroundColor: getPasswordStrength() >= 3 ? '#22c55e' : '#e2e8f0' }]} />
                                    </View>

                                    {/* Requirements List */}
                                    <View style={styles.requirementsContainer}>
                                        <View style={styles.requirementItem}>
                                            <Ionicons
                                                name={hasMinLength ? "checkmark-circle" : "ellipse-outline"}
                                                size={16}
                                                color={hasMinLength ? "#22c55e" : "#94a3b8"}
                                            />
                                            <Text style={[styles.requirementText, hasMinLength && styles.requirementTextMet]}>
                                                At least 10 characters
                                            </Text>
                                        </View>
                                        <View style={styles.requirementItem}>
                                            <Ionicons
                                                name={hasUpperCase ? "checkmark-circle" : "ellipse-outline"}
                                                size={16}
                                                color={hasUpperCase ? "#22c55e" : "#94a3b8"}
                                            />
                                            <Text style={[styles.requirementText, hasUpperCase && styles.requirementTextMet]}>
                                                At least one uppercase letter (A-Z)
                                            </Text>
                                        </View>
                                        <View style={styles.requirementItem}>
                                            <Ionicons
                                                name={hasNonAlphaNumeric ? "checkmark-circle" : "ellipse-outline"}
                                                size={16}
                                                color={hasNonAlphaNumeric ? "#22c55e" : "#94a3b8"}
                                            />
                                            <Text style={[styles.requirementText, hasNonAlphaNumeric && styles.requirementTextMet]}>
                                                At least one symbol (e.g., @, #, $)
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {/* Register Button */}
                            <TouchableOpacity
                                style={[styles.registerButtonContainer, !isPasswordValid && password.length > 0 && styles.disabledButton]}
                                onPress={handleRegister}
                                disabled={isLoading}
                            >
                                <LinearGradient
                                    colors={isPasswordValid ? ['#1e3a8a', '#172554'] : ['#94a3b8', '#cbd5e1']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.registerButton}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                                    ) : (
                                        <>
                                            <Text style={styles.registerButtonText}>Register</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Back to Login */}
                            <View style={styles.footerContainer}>
                                <Text style={styles.footerText}>Do you have an account? </Text>
                                <TouchableOpacity onPress={() => router.push('/screens')}>
                                    <Text style={styles.loginLink}>Login</Text>
                                </TouchableOpacity>
                            </View>

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
    // Password Strength Styles
    strengthContainer: {
        marginBottom: 24,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    strengthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    strengthLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    strengthValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    strengthBarContainer: {
        flexDirection: 'row',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        gap: 4,
        marginBottom: 16,
    },
    strengthBarChunk: {
        flex: 1,
        borderRadius: 3,
    },
    requirementsContainer: {
        gap: 8,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    requirementText: {
        fontSize: 13,
        color: '#94a3b8',
    },
    requirementTextMet: {
        color: '#334155',
        fontWeight: '500',
    },
    registerButtonContainer: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 8,
    },
    disabledButton: {
        shadowOpacity: 0.1,
        elevation: 1,
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    registerButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
    buttonIcon: {
        marginLeft: 4,
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    footerText: {
        fontSize: 14,
        color: '#64748b',
    },
    loginLink: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '700',
    },
});
