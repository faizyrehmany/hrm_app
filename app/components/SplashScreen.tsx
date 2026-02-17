import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const progressAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate progress from 0% to 100% over 2.5 seconds
        Animated.timing(progressAnimation, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: false, // width doesn't support native driver
        }).start(() => {
            // Once finished, trigger the callback
            onFinish();
        });
    }, []);

    const widthInterpolation = progressAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Decorative Background Elements matching HTML */}
            <LinearGradient
                colors={['rgba(19, 127, 236, 0.05)', 'transparent']}
                style={styles.topGradient}
            />
            <View style={styles.bottomBlurCircle} />

            {/* Main Content */}
            <View style={styles.contentContainer}>
                {/* Logo Section */}
                <View style={styles.logoWrapper}>
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={['rgba(19, 127, 236, 0.1)', 'transparent']}
                            style={styles.logoGradient}
                        />
                        <MaterialIcons name="groups" size={64} color="#137fec" />
                    </View>
                </View>

                {/* Text Section */}
                <Text style={styles.title}>Dreams HRM</Text>
                <Text style={styles.subtitle}>Managing your workforce efficiently</Text>
            </View>

            {/* Loading Section */}
            <View style={styles.bottomSection}>
                <View style={styles.progressContainer}>
                    <View style={styles.loadingLabelContainer}>
                        <Text style={styles.loadingLabel}>LOADING</Text>
                    </View>
                    <View style={styles.progressBarBackground}>
                        <Animated.View
                            style={[
                                styles.progressBarFill,
                                { width: widthInterpolation }
                            ]}
                        />
                    </View>
                </View>
                <Text style={styles.versionText}>Version 2.4.0</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f7f8',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    bottomBlurCircle: {
        position: 'absolute',
        bottom: -50,
        right: -50,
        width: 256,
        height: 256,
        backgroundColor: 'rgba(19, 127, 236, 0.05)',
        borderRadius: 128,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 32,
        zIndex: 10,
    },
    logoWrapper: {
        marginBottom: 32,
        alignItems: 'center',
    },
    logoContainer: {
        width: 112, // 28 * 4
        height: 112,
        borderRadius: 24,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: 'rgba(19, 127, 236, 0.1)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 10,
        position: 'relative',
        overflow: 'hidden',
    },
    logoGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        borderRadius: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#111418',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#617589',
        textAlign: 'center',
        maxWidth: 240,
        lineHeight: 20,
    },
    bottomSection: {
        width: '100%',
        paddingHorizontal: 48,
        paddingBottom: 48,
        alignItems: 'center',
        gap: 24,
        zIndex: 10,
    },
    progressContainer: {
        width: '100%',
        maxWidth: 200,
        gap: 8,
    },
    loadingLabelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    loadingLabel: {
        color: '#137fec',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    progressBarBackground: {
        height: 6,
        width: '100%',
        backgroundColor: '#dbe0e6',
        borderRadius: 9999,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#137fec',
        borderRadius: 9999,
    },
    versionText: {
        color: '#9ca3af', // gray-400
        fontSize: 10,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
});


