import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { EmployeeApi } from '../services/auth';
import { User } from '../services/SessionManager';

export default function EditableProfileScreen() {
    const router = useRouter();
    const { colors } = useTheme();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        setLoading(true);
        const data = await EmployeeApi.getEmployeeDetails();
        if (!data) {
            Alert.alert('Error', 'Failed to load user data');
            setLoading(false);
            return;
        }
        setUser(data);
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        const fullAddress = [data.addressLine1, data.addressLine2].filter(Boolean).join(', ');
        setAddress(fullAddress);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!user) return;

        try {
            const body: any = {
                firstName,
                lastName,
                email,
                phone,
                addressLine1: address,
                addressLine2: '',
            };
            if (password.trim()) {
                body.password = password;
            }
            const success = await EmployeeApi.postEmployeeDetails(body);
            if (!success) {
                Alert.alert('Error', 'Failed to update profile');
                return;
            }
            Alert.alert('Success', 'Profile updated successfully');
            setIsEditing(false);
        } catch (error) {
            Alert.alert('Error', 'Something went wrong');
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scroll}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                    >
                        <Text style={[styles.headerTitle, { color: colors.textMain }]}>Profile</Text>

                        <View style={[styles.card, { backgroundColor: colors.surface }]}>
                            <View style={styles.cardHeader}>
                                <Text style={[styles.cardTitle, { color: colors.textMain }]}>Personal Details</Text>
                                {!isEditing && (
                                    <TouchableOpacity
                                        style={[styles.editButton, { borderColor: colors.primary }]}
                                        onPress={() => setIsEditing(true)}
                                    >
                                        <MaterialIcons name="lock" size={18} color={colors.primary} style={{ marginRight: 4 }} />
                                        <Text style={{ color: colors.primary, fontWeight: '600' }}>Edit</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <InputField label="First Name" value={firstName} setValue={setFirstName} colors={colors} isEditing={isEditing} />
                            <InputField label="Last Name" value={lastName} setValue={setLastName} colors={colors} isEditing={isEditing} />
                            <InputField label="Email" value={email} setValue={setEmail} colors={colors} isEditing={isEditing} />
                            <InputField label="Phone Number" value={phone} setValue={setPhone} colors={colors} isEditing={isEditing} />
                            <InputField label="Residential Address" value={address} setValue={setAddress} colors={colors} isEditing={isEditing} multiline />
                            <InputField label="New Password" value={password} setValue={setPassword} colors={colors} isEditing={isEditing} secure />

                        </View>

                        {isEditing && (
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
                                <Text style={styles.saveText}>Save Changes</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function InputField({ label, value, setValue, multiline, secure, colors, isEditing }: any) {
    return (
        <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>{label}</Text>
            <TextInput
                value={value}
                editable={isEditing}
                onChangeText={setValue}
                secureTextEntry={secure}
                multiline={multiline}
                placeholder={label}
                placeholderTextColor={colors.textSub}
                style={[
                    styles.input,
                    {
                        backgroundColor: isEditing ? colors.background : colors.border + '15',
                        borderColor: isEditing ? colors.border : colors.border + '40',
                        color: colors.textMain,
                        height: multiline ? 90 : 50,
                    },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 40 },
    headerTitle: { fontSize: 26, fontWeight: '700', marginBottom: 20 },
    card: { borderRadius: 18, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
    inputGroup: { marginBottom: 18 },
    label: { fontSize: 13, marginBottom: 6, fontWeight: '600' },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 15 },
    saveButton: { marginTop: 25, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    saveText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    cardTitle: { fontSize: 16, fontWeight: '700' },
    editButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
});