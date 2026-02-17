import React, { ReactNode } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface ThreeDPanelProps {
    leftMenu: ReactNode;
    children: ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    menuWidth?: number;
    speed?: number;
}

export default function ThreeDPanel({
    leftMenu,
    children,
    isOpen,
    onToggle,
    menuWidth = width * 0.66,
    speed = 500
}: ThreeDPanelProps) {

    const progress = useSharedValue(0);

    React.useEffect(() => {
        progress.value = withTiming(isOpen ? 1 : 0, { duration: speed });
    }, [isOpen, speed]);

    const MENU_WIDTH = 280; // Fixed width for reliability

    // Content Animation (The Dashboard)
    const contentStyle = useAnimatedStyle(() => {
        const rotateY = interpolate(progress.value, [0, 1], [0, -15]);
        const translateX = interpolate(progress.value, [0, 1], [0, MENU_WIDTH - 40]); // Overlap slightly
        const scale = interpolate(progress.value, [0, 1], [1, 0.8]);
        const borderRadius = interpolate(progress.value, [0, 1], [0, 20]);

        return {
            transform: [
                { perspective: 1000 },
                { translateX },
                { rotateY: `${rotateY}deg` },
                { scale },
            ],
            borderRadius,
            overflow: 'hidden',
        };
    });

    // Menu Animation
    const menuStyle = useAnimatedStyle(() => {
        const translateX = interpolate(progress.value, [0, 1], [-50, 0]);
        // Fade in
        const opacity = interpolate(progress.value, [0, 1], [0, 1]);

        return {
            transform: [{ translateX }],
            opacity,
            width: MENU_WIDTH,
        };
    });

    return (
        <View style={styles.container}>
            {/* The Menu Layer - Behind everything */}
            <View style={styles.menuLayer}>
                <Animated.View style={[styles.menuContainer, menuStyle]}>
                    {leftMenu}
                </Animated.View>
            </View>

            {/* The Content Layer - The Dashboard card */}
            <Animated.View style={[styles.contentContainer, contentStyle]}>
                {children}

                {/* Clickable overlay to close */}
                {isOpen && (
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={onToggle}
                    />
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // Or '#F3F4F6'
    },
    menuLayer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    menuContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        zIndex: 10, // Ensure on top
        // Shadow for the tilted card effect
        shadowColor: "#000",
        shadowOffset: {
            width: -10,
            height: 0,
        },
        shadowOpacity: 0.2, // Visible shadow
        shadowRadius: 10,
        elevation: 15,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(0,0,0,0.05)'
    },
});


