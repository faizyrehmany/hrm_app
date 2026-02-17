import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Static colors that don't change with theme
const STATIC_COLORS = {
    danger: '#ef4444',
    success: '#10b981', // Added green for success
};

interface CustomToastProps {
    message: string;
    visible: boolean;
    onHide: () => void;
    type?: 'success' | 'error'; // Added type prop to distinguish message types
}

export const CustomToast = ({ message, visible, onHide, type = 'error' }: CustomToastProps) => {
    const { colors } = useTheme();
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.delay(2000),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                onHide();
            });
        }
    }, [visible]);

    if (!visible) return null;

    // Determine background color based on type
    const backgroundColor = type === 'success' ? STATIC_COLORS.success : STATIC_COLORS.danger;

    return (
        <Animated.View style={[styles.container, { opacity }]}>
            <View style={[styles.toast, { backgroundColor }]}>
                <Text style={styles.text}>{message}</Text>
            </View>
        </Animated.View>
    );
};

export default CustomToast;

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        elevation: 100,
    },
    toast: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
