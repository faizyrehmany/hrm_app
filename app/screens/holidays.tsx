import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Dimensions,
    StatusBar as NativeStatusBar,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import BottomTabBar from '../components/BottomTabBar';
import { CustomToast } from '../components/CustomToast';
import { useTheme } from '../contexts/ThemeContext';
import { deleteHoliday, getHolidays } from '../services/holidays';

const { width } = Dimensions.get('window');

// Mocks removed in favor of dynamic data
const HOLIDAY_TYPES = ['Religious', 'National Holiday', 'Regional Holiday', 'International Holiday', 'Religious Observance']; // For mapping type ID to string

function SwipeableHolidayItem({ holiday, onDelete, colors, isDark }: any) {
    const RightAction = (prog: any, drag: any) => {
        return (
            <View style={{ flexDirection: 'row', width: 80 }}>
                <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: '#ef4444' }]}
                    onPress={onDelete}
                >
                    <MaterialIcons name="delete" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        );
    };

    const dynamicStyles = createItemStyles(colors, isDark);

    return (
        <ReanimatedSwipeable
            friction={2}
            enableTrackpadTwoFingerGesture
            rightThreshold={40}
            renderRightActions={RightAction}
            containerStyle={styles.swipeableContainer}
        >
            <View style={[styles.holidayItem, dynamicStyles.holidayItem]}>
                <View style={styles.holidayItemLeft}>
                    <View style={[styles.dateBox, dynamicStyles.dateBox]}>
                        <Text style={[styles.dateMonth, { color: colors.primary }]}>{holiday.month}</Text>
                        <Text style={[styles.dateDay, { color: colors.primary }]}>{holiday.day}</Text>
                    </View>
                    <View style={styles.holidayInfo}>
                        <Text style={[styles.holidayName, dynamicStyles.holidayName]}>{holiday.name}</Text>
                        <Text style={[styles.holidayType, dynamicStyles.holidayType]}>{holiday.type}</Text>
                    </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={isDark ? '#4b5563' : '#d1d5db'} />
            </View>
        </ReanimatedSwipeable>
    );
}

export default function HolidaysScreen() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past'>('Upcoming');
    const [holidaysByMonth, setHolidaysByMonth] = useState<any[]>([]);
    const [rawHolidays, setRawHolidays] = useState<any[]>([]);
    const [nextHoliday, setNextHoliday] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Search State
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Toast State
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    const triggerToast = (msg: string, type: 'success' | 'error') => {
        setToastMessage(msg);
        setToastType(type);
        setToastVisible(true);
    };

    const dynamicStyles = createDynamicStyles(colors, isDark);

    const fetchHolidays = async () => {
        setIsLoading(true);
        // Always fetch for the current year as per user instruction to ensure IDs are present
        const currentYear = new Date().getFullYear();
        const result = await getHolidays(currentYear);

        if (result.success && Array.isArray(result.data)) {
            setRawHolidays(result.data);
        } else {
            setRawHolidays([]);
            setHolidaysByMonth([]);
            setNextHoliday(null);
        }
        setIsLoading(false);
    };

    // Effect to process holidays whenever dependencies change
    React.useEffect(() => {
        if (rawHolidays.length > 0) {
            processHolidays(rawHolidays);
        }
    }, [rawHolidays, activeTab, searchQuery]);

    const processHolidays = (data: any[]) => {
        // Sort by date
        const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const now = new Date();
        // Reset time part for accurate date comparison
        now.setHours(0, 0, 0, 0);

        let filteredHolidays = [];

        if (activeTab === 'Upcoming') {
            filteredHolidays = sorted.filter(h => new Date(h.date) >= now);
        } else {
            filteredHolidays = sorted.filter(h => new Date(h.date) < now);
            filteredHolidays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        // Apply Search Filter (search affects displayed list)
        const query = searchQuery.toLowerCase().trim();
        const filteredHolidaysByQuery = query
            ? filteredHolidays.filter(h =>
                h.title.toLowerCase().includes(query) ||
                (h.description && h.description.toLowerCase().includes(query))
            )
            : filteredHolidays;

        // Find next holiday (closest upcoming one) - independent of search to always show next
        // But dependent on the raw 'Upcoming' list
        let next = null;
        if (activeTab === 'Upcoming') {
            const upcomingRaw = sorted.filter(h => new Date(h.date) >= now);
            if (upcomingRaw.length > 0) {
                next = upcomingRaw[0];
            }
        }

        if (next) {
            setNextHoliday({
                id: next.id,
                name: next.title,
                date: new Date(next.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                day: new Date(next.date).getDate(),
                month: new Date(next.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
                year: new Date(next.date).getFullYear(),
                type: (next.type !== undefined && HOLIDAY_TYPES[next.type]) ? HOLIDAY_TYPES[next.type] : 'Holiday',
                description: next.description || 'No description',
                isPaid: next.isPaid,
                image: 'https://example.com/placeholder.jpg',
            });
        } else {
            setNextHoliday(null);
        }

        // Group by Month

        // Group by Month
        const grouped: any = {};
        filteredHolidaysByQuery.forEach(item => {
            const d = new Date(item.date);
            const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            if (!grouped[key]) {
                grouped[key] = { month: key, holidays: [] };
            }

            grouped[key].holidays.push({
                id: item.id || item._id,
                day: d.getDate(),
                month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
                name: item.title,
                type: (item.type !== undefined && HOLIDAY_TYPES[item.type]) ? HOLIDAY_TYPES[item.type] : 'Holiday',
                fullDate: d
            });
        });

        // Convert to array
        setHolidaysByMonth(Object.values(grouped));
    };

    useFocusEffect(
        useCallback(() => {
            fetchHolidays();
        }, [activeTab])
    );

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Holiday",
            "Are you sure you want to delete this holiday?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setIsLoading(true);
                        const result = await deleteHoliday(id);
                        if (result.success) {
                            triggerToast("Holiday deleted successfully", "success");
                            fetchHolidays();
                        } else {
                            triggerToast("Failed to delete holiday", "error");
                        }
                        setIsLoading(false);
                    }
                }
            ]
        );
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={[styles.container, dynamicStyles.container]}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <CustomToast
                    visible={toastVisible}
                    message={toastMessage}
                    type={toastType}
                    onHide={() => setToastVisible(false)}
                />
                <SafeAreaView style={styles.safeArea}>
                    {/* Header */}
                    <View style={[styles.header, dynamicStyles.header]}>
                        {!isSearchActive ? (
                            <>
                                <TouchableOpacity
                                    style={[styles.iconButton, dynamicStyles.iconButton]}
                                    onPress={() => router.back()}
                                >
                                    <MaterialIcons name="arrow-back-ios" size={24} color={colors.textMain} />
                                </TouchableOpacity>
                                <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Holidays</Text>
                                <View style={styles.headerIcons}>
                                    <TouchableOpacity
                                        style={[styles.iconButton, dynamicStyles.iconButton]}
                                        onPress={() => setIsSearchActive(true)}
                                    >
                                        <MaterialIcons name="search" size={24} color={colors.textMain} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.iconButton, dynamicStyles.iconButton]}
                                        onPress={() => router.push('/screens/add_holiday')}
                                    >
                                        <MaterialIcons name="add" size={24} color={colors.textMain} />
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <View style={styles.searchContainer}>
                                <View style={[styles.searchInputWrapper, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                    <MaterialIcons name="search" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                                    <TextInput
                                        style={[styles.searchInput, { color: colors.textMain }]}
                                        placeholder="Search holidays..."
                                        placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        autoFocus
                                    />
                                    {searchQuery.length > 0 && (
                                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                                            <MaterialIcons name="close" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsSearchActive(false);
                                        setSearchQuery('');
                                    }}
                                    style={styles.cancelButton}
                                >
                                    <Text style={{ color: colors.primary, fontWeight: '600' }}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Segmented Control */}
                    <View style={[styles.segmentedContainer, dynamicStyles.segmentedContainer]}>
                        <View style={[styles.segmentedControl, dynamicStyles.segmentedControl]}>
                            <TouchableOpacity
                                style={[
                                    styles.segmentedTab,
                                    activeTab === 'Upcoming' && [styles.segmentedTabActive, dynamicStyles.segmentedTabActive],
                                ]}
                                onPress={() => setActiveTab('Upcoming')}
                            >
                                <Text
                                    style={[
                                        styles.segmentedText,
                                        dynamicStyles.segmentedText,
                                        activeTab === 'Upcoming' && dynamicStyles.segmentedTextActive,
                                    ]}
                                >
                                    Upcoming
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.segmentedTab,
                                    activeTab === 'Past' && [styles.segmentedTabActive, dynamicStyles.segmentedTabActive],
                                ]}
                                onPress={() => setActiveTab('Past')}
                            >
                                <Text
                                    style={[
                                        styles.segmentedText,
                                        dynamicStyles.segmentedText,
                                        activeTab === 'Past' && dynamicStyles.segmentedTextActive,
                                    ]}
                                >
                                    Past
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Next Holiday Section */}
                        {activeTab === 'Upcoming' && nextHoliday ? (
                            <>
                                <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Next Holiday</Text>
                                <View style={styles.nextHolidayContainer}>
                                    <View style={[styles.premiumCard, dynamicStyles.premiumCard]}>
                                        <View style={styles.premiumCardInner}>
                                            {/* Date Box */}
                                            <View style={[styles.premiumDateBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                                                <Text style={[styles.premiumMonth, { color: colors.primary }]}>{nextHoliday.month}</Text>
                                                <Text style={[styles.premiumDay, { color: colors.primary }]}>{nextHoliday.day}</Text>
                                                <Text style={[styles.premiumYear, { color: colors.primary }]}>{nextHoliday.year}</Text>
                                            </View>

                                            {/* Content */}
                                            <View style={styles.premiumContent}>
                                                <View style={styles.premiumHeader}>
                                                    <View style={[styles.typeBadge, { backgroundColor: colors.primary + '15' }]}>
                                                        <Text style={[styles.typeBadgeText, { color: colors.primary }]}>
                                                            {nextHoliday.type.toUpperCase()}
                                                        </Text>
                                                    </View>
                                                    {nextHoliday.isPaid && (
                                                        <View style={[styles.typeBadge, { backgroundColor: '#10b98120', marginLeft: 6 }]}>
                                                            <Text style={[styles.typeBadgeText, { color: '#10b981' }]}>PAID</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={[styles.premiumTitle, dynamicStyles.premiumTitle]}>
                                                    {nextHoliday.name}
                                                </Text>
                                                {nextHoliday.description !== 'No description' && (
                                                    <Text style={[styles.premiumDesc, dynamicStyles.premiumDesc]} numberOfLines={2}>
                                                        {nextHoliday.description}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.premiumButton, { backgroundColor: colors.primary }]}
                                            onPress={() => router.push('/screens/add_holiday')}
                                        >
                                            <Text style={styles.premiumButtonText}>Add to Calendar</Text>
                                            <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        ) : activeTab === 'Upcoming' ? (
                            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>No upcoming holidays</Text>
                        ) : null}

                        {/* Monthly Breakdown */}
                        {holidaysByMonth.map((monthData, monthIndex) => (
                            <View key={monthData.month || monthIndex}>
                                <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle, { marginTop: monthIndex === 0 ? 24 : 24 }]}>
                                    {monthData.month}
                                </Text>
                                {monthData.holidays.map((holiday: any, index: number) => (
                                    <SwipeableHolidayItem
                                        key={holiday.id ? `${holiday.id}` : `${monthIndex}-${index}`}
                                        holiday={holiday}
                                        onDelete={() => handleDelete(holiday.id)}
                                        colors={colors}
                                        isDark={isDark}
                                    />
                                ))}
                            </View>
                        ))}

                        <View style={{ height: 100 }} />
                    </ScrollView>

                    {/* Bottom Tab Bar */}
                    <BottomTabBar activeTab="leaves" />
                </SafeAreaView>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 8,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 40,
        borderRadius: 8,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        padding: 0,
    },
    cancelButton: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    segmentedContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    segmentedControl: {
        flexDirection: 'row',
        height: 40,
        borderRadius: 8,
        padding: 2,
    },
    segmentedTab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
    },
    segmentedTabActive: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    segmentedText: {
        fontSize: 14,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    nextHolidayContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    nextHolidayHeader: {
        marginBottom: 8,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    premiumCard: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    premiumCardInner: {
        flexDirection: 'row',
        padding: 16,
        gap: 16,
    },
    premiumDateBox: {
        width: 70,
        height: 90,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    premiumMonth: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 2,
    },
    premiumDay: {
        fontSize: 28,
        fontWeight: '900',
        lineHeight: 32,
    },
    premiumYear: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
        opacity: 0.8,
    },
    premiumContent: {
        flex: 1,
        justifyContent: 'center',
    },
    premiumHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    premiumTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
        lineHeight: 24,
    },
    premiumDesc: {
        fontSize: 13,
        lineHeight: 18,
    },
    premiumButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    premiumButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    swipeableContainer: {
        marginBottom: 0,
    },
    holidayItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    holidayItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    dateBox: {
        width: 56,
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateMonth: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    dateDay: {
        fontSize: 20,
        fontWeight: '900',
    },
    holidayInfo: {
        flex: 1,
        gap: 2,
    },
    holidayName: {
        fontSize: 16,
        fontWeight: '700',
    },
    holidayType: {
        fontSize: 14,
    },
    deleteBtn: {
        width: 80,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

const createDynamicStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.surface,
        borderBottomColor: colors.border,
    },
    iconButton: {
        backgroundColor: 'transparent',
    },
    headerTitle: {
        color: colors.textMain,
    },
    segmentedContainer: {
        backgroundColor: colors.surface,
    },
    segmentedControl: {
        backgroundColor: isDark ? '#1f2937' : '#f0f2f4',
    },
    segmentedTabActive: {
        backgroundColor: colors.surface,
    },
    segmentedText: {
        color: isDark ? '#9ca3af' : '#617589',
    },
    segmentedTextActive: {
        color: colors.textMain,
    },
    sectionTitle: {
        color: colors.textMain,
    },
    premiumCard: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
    },
    premiumTitle: {
        color: colors.textMain,
    },
    premiumDesc: {
        color: colors.textSub,
    },
});

const createItemStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    holidayItem: {
        backgroundColor: colors.surface,
        borderBottomColor: colors.border,
    },
    dateBox: {
        backgroundColor: isDark ? '#1f2937' : colors.background,
        borderColor: colors.primary + '33',
    },
    holidayName: {
        color: colors.textMain,
    },
    holidayType: {
        color: colors.textSub,
    },
});



