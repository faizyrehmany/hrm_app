import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmployeeHeader from '../components/EmployeeHeader';
import SideMenu from '../components/SideMenu';
import { useTheme } from '../contexts/ThemeContext';
import { EmployeeApi } from '../services/auth';
import { getDepartments, getDesignations } from '../services/designation';
import { User } from '../services/SessionManager';

const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = String(date.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    } catch {
        return dateStr;
    }
};

const convertToISO = (dateStr: string) => {
    if (!dateStr) return null;
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}T/)) return dateStr.split('.')[0];
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            const parts = dateStr.trim().split(/\s+/);
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const month = months.findIndex(m => m.toLowerCase() === parts[1].toLowerCase().substring(0, 3));
                const year = parseInt(parts[2], 10);
                if (!isNaN(day) && month !== -1 && !isNaN(year)) {
                    return new Date(year, month, day).toISOString().split('.')[0];
                }
            }
            return dateStr;
        }
        return date.toISOString().split('.')[0];
    } catch {
        return dateStr;
    }
};

const formatShiftTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) return time;
    const hourNum = Number(hours);
    const minuteNum = Number(minutes);
    if (Number.isNaN(hourNum) || Number.isNaN(minuteNum)) return time;
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = ((hourNum + 11) % 12) + 1;
    return `${String(hour12).padStart(2, '0')}:${String(minuteNum).padStart(2, '0')} ${period}`;
};

const SelectionModal = ({ visible, onClose, options, onSelect, title, colors, isDark }: any) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
            <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.modalHandle} />
                <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.pickerTitle, { color: colors.textMain }]}>{title}</Text>
                    <TouchableOpacity
                        onPress={onClose}
                        style={[styles.closeBtn, { backgroundColor: colors.border + '30' }]}
                    >
                        <MaterialIcons name="close" size={18} color={colors.textMain} />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={options}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.pickerItem, { borderBottomColor: colors.border + '50' }]}
                            onPress={() => { onSelect(item); onClose(); }}
                        >
                            <Text style={{ color: colors.textMain, fontSize: 15 }}>{item.name}</Text>
                            <MaterialIcons name="chevron-right" size={20} color={colors.textSub} />
                        </TouchableOpacity>
                    )}
                />
            </View>
        </TouchableOpacity>
    </Modal>
);

// ── Section wrapper ──────────────────────────────────────────
const Section = ({ title, icon, children, colors }: any) => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border + '40' }]}>
            <View style={[styles.sectionIconWrap, { backgroundColor: colors.primary + '15' }]}>
                <MaterialIcons name={icon} size={16} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{title}</Text>
        </View>
        <View style={styles.sectionBody}>{children}</View>
    </View>
);

export default function EditableProfileScreen() {
    const router = useRouter();
    const { colors } = useTheme();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Store original values for cancel functionality
    const [originalValues, setOriginalValues] = useState<any>({});

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('');
    const [password, setPassword] = useState('');
    const [departmentId, setDepartmentId] = useState<number | string>('');
    const [designationId, setDesignationId] = useState<number | string>('');
    const [joiningDate, setJoiningDate] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [shiftId, setShiftId] = useState<number | string>('');
    const [shiftName, setShiftName] = useState('');
    const [shiftStartTime, setShiftStartTime] = useState('');
    const [shiftEndTime, setShiftEndTime] = useState('');
    const [shifts, setShifts] = useState<any[]>([]);
    const [showShiftPicker, setShowShiftPicker] = useState(false);
    const [headId, setHeadId] = useState<number | string>('');
    const [headName, setHeadName] = useState('');
    const [heads, setHeads] = useState<any[]>([]);
    const [showHeadPicker, setShowHeadPicker] = useState(false);
    const [employmentStatus, setEmploymentStatus] = useState('');
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [designations, setDesignations] = useState<any[]>([]);
    const [designationName, setDesignationName] = useState('');
    const [departments, setDepartments] = useState<string[]>([]);
    const [departmentName, setDepartmentName] = useState('');
    const [showDesignationPicker, setShowDesignationPicker] = useState(false);
    const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
    const [isMenuVisible, setMenuVisible] = useState(false);


    useEffect(() => {
        loadUser();
        loadShifts();
        loadHeads();
    }, []);

    const loadShifts = async () => {
        try {
            const shiftRes = await EmployeeApi.getShifts();
            if (shiftRes.success) setShifts(shiftRes.data);
        } catch { setShifts([]); }
    };

    const loadHeads = async () => {
        try {
            const headRes = await EmployeeApi.getHeads();
            if (headRes.success) setHeads(headRes.data);
        } catch { setHeads([]); }
    };

    useEffect(() => {
        if (shiftId && shifts.length > 0) {
            const matchedShift = shifts.find((s) => String(s.id) === String(shiftId));
            if (matchedShift) {
                setShiftName(`${matchedShift.shiftName || matchedShift.name || `Shift ${shiftId}`} (${formatShiftTime(matchedShift.startTime || matchedShift.start_time)} - ${formatShiftTime(matchedShift.endTime || matchedShift.end_time)})`);
                setShiftStartTime(matchedShift.startTime || matchedShift.start_time || '');
                setShiftEndTime(matchedShift.endTime || matchedShift.end_time || '');
            }
        }
    }, [shiftId, shifts]);

    useEffect(() => {
        if (headId && heads.length > 0) {
            const matchedHead = heads.find((h) => String(h.id) === String(headId));
            if (matchedHead) setHeadName(matchedHead.fullName || matchedHead.name || `Manager ${headId}`);
        }
    }, [headId, heads]);

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
        setAddress(data.addressLine1 || '');
        setCity(data.city || '');
        setState(data.state || '');
        setPostalCode(data.postalCode || '');
        setCountry(data.country || '');
        setDepartmentId(data.departmentId || '');
        setDepartmentName((data as any).departmentName || (data as any).departName || (data as any).department || '');
        setDesignationId(data.designationId || '');
        setDesignationName((data as any).designationName || (data as any).name || (data as any).designation || '');
        setJoiningDate(formatDisplayDate(data.joiningDate || ''));
        setDateOfBirth(formatDisplayDate(data.dateOfBirth || ''));
        setShiftId(data.shiftId || '');
        setShiftName(data.shiftName || (data as any).shift?.name || (data.shiftId === 1 ? 'Morning Shift' : data.shiftId === 2 ? 'Afternoon Shift' : data.shiftId === 3 ? 'Night Shift' : data.shiftId ? `Shift ${data.shiftId}` : ''));
        setShiftStartTime((data as any).startTime || (data as any).start_time || '');
        setShiftEndTime((data as any).endTime || (data as any).end_time || '');
        setHeadId(data.headId || '');
        setHeadName((data as any).headName || (data as any).managerName || (data as any).manager?.fullName || (data as any).head?.fullName || '');
        setEmploymentStatus(data.employmentStatus || '');

        try {
            const [desRes, depRes] = await Promise.all([getDesignations(), getDepartments()]);
            if (depRes.success) {
                const rawDeps = depRes.data;
                const depList = Array.isArray(rawDeps) ? rawDeps : (rawDeps?.data || []);
                setDepartments(depList.map((d: any) => typeof d === 'string' ? d : (d.departName || d.name || d.departmentName)));
            } else {
                setDepartments([]);
            }
            if (desRes.success) {
                const rawData = desRes.data;
                const actualList = Array.isArray(rawData) ? rawData : (rawData?.data || []);
                if (actualList.length > 0) {
                    setDesignations(actualList);
                    const found = actualList.find((d: any) => d.id === data.designationId);
                    if (found && !designationName) setDesignationName(found.name);
                }
            }
        } catch (err) {
            setDepartments([]);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!user) return;
        try {
            const body: any = {
                firstName, lastName, email, phone,
                addressLine1: address, city, state, postalCode, country,
                departmentId: departmentId ? Number(departmentId) : null,
                designationId: designationId ? Number(designationId) : null,
                joiningDate: user.joiningDate ? user.joiningDate.split('.')[0] : null,
                dateOfBirth: convertToISO(dateOfBirth),
                shiftId: shiftId ? Number(shiftId) : null,
                headId: headId ? Number(headId) : null,
                employmentStatus,
            };
            if (password.trim()) body.epassword = password;
            const success = await EmployeeApi.updateProfile(body);
            if (!success) { Alert.alert('Error', 'Failed to update profile'); return; }
            Alert.alert('Success', 'Profile updated successfully');
            setIsEditing(false);
        } catch {
            Alert.alert('Error', 'Something went wrong');
        }
    };

    const handleEdit = () => {
        // Store original values before entering edit mode
        setOriginalValues({
            firstName, lastName, email, phone, address, city, state, postalCode, country,
            departmentId, designationId, joiningDate, dateOfBirth, shiftId, shiftName,
            shiftStartTime, shiftEndTime, headId, headName, employmentStatus,
            departmentName, designationName
        });
        setIsEditing(true);
    };

    const handleCancel = () => {
        // Restore original values
        setFirstName(originalValues.firstName || '');
        setLastName(originalValues.lastName || '');
        setEmail(originalValues.email || '');
        setPhone(originalValues.phone || '');
        setAddress(originalValues.address || '');
        setCity(originalValues.city || '');
        setState(originalValues.state || '');
        setPostalCode(originalValues.postalCode || '');
        setCountry(originalValues.country || '');
        setDepartmentId(originalValues.departmentId || '');
        setDesignationId(originalValues.designationId || '');
        setJoiningDate(originalValues.joiningDate || '');
        setDateOfBirth(originalValues.dateOfBirth || '');
        setShiftId(originalValues.shiftId || '');
        setShiftName(originalValues.shiftName || '');
        setShiftStartTime(originalValues.shiftStartTime || '');
        setShiftEndTime(originalValues.shiftEndTime || '');
        setHeadId(originalValues.headId || '');
        setHeadName(originalValues.headName || '');
        setEmploymentStatus(originalValues.employmentStatus || '');
        setDepartmentName(originalValues.departmentName || '');
        setDesignationName(originalValues.designationName || '');
        setPassword(''); // Clear password field
        setIsEditing(false);
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.3)' };
            case 'inactive': return { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' };
            case 'terminated': return { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' };
            default: return { bg: 'rgba(100,116,139,0.12)', color: '#64748b', border: 'rgba(100,116,139,0.3)' };
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSub }]}>Loading profile...</Text>
            </View>
        );
    }

    const statusColors = getStatusColor(employmentStatus);
    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <EmployeeHeader
                title="My Profile"
                onMenuPress={() => setMenuVisible(true)}
            />
            <SideMenu visible={isMenuVisible} onClose={() => setMenuVisible(false)} />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scroll}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                    >
                        {/* ── Page Header ── */}
                        <View style={styles.pageHeader}>
                            {!isEditing ? (
                                <TouchableOpacity
                                    style={[styles.editBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
                                    onPress={handleEdit}
                                >
                                    <MaterialIcons name="edit" size={15} color={colors.primary} />
                                    <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.editBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }]}
                                    onPress={handleCancel}
                                >
                                    <MaterialIcons name="close" size={15} color="#ef4444" />
                                    <Text style={[styles.editBtnText, { color: '#ef4444' }]}>Cancel</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* ── Avatar Banner ── */}
                        <View style={[styles.avatarCard, { backgroundColor: colors.surface }]}>
                            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                                <Text style={styles.avatarInitials}>{initials || '?'}</Text>
                            </View>
                            <View style={styles.avatarInfo}>
                                <Text style={[styles.avatarName, { color: colors.textMain }]}>
                                    {firstName} {lastName}
                                </Text>
                                <Text style={[styles.avatarDesignation, { color: colors.textSub }]}>
                                    {designationName || 'No Designation'}
                                </Text>
                                <View style={[styles.statusPill, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
                                    <View style={[styles.statusDot, { backgroundColor: statusColors.color }]} />
                                    <Text style={[styles.statusPillText, { color: statusColors.color }]}>
                                        {employmentStatus || 'Unknown'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* ── Section 1: Personal Info ── */}
                        <Section title="Personal Information" icon="person-outline" colors={colors}>
                            <View style={styles.row}>
                                <View style={styles.halfField}>
                                    <InputField label="First Name" value={firstName} setValue={setFirstName} colors={colors} isEditing={isEditing} />
                                </View>
                                <View style={styles.halfField}>
                                    <InputField label="Last Name" value={lastName} setValue={setLastName} colors={colors} isEditing={isEditing} />
                                </View>
                            </View>
                            <InputField label="Email Address" value={email} setValue={setEmail} colors={colors} isEditing={isEditing} keyboardType="email-address" />
                            <InputField label="Phone Number" value={phone} setValue={setPhone} colors={colors} isEditing={isEditing} keyboardType="phone-pad" />
                            <View style={styles.row}>
                                <View style={styles.halfField}>
                                    <InputField label="Date of Birth" value={dateOfBirth} setValue={setDateOfBirth} colors={colors} isEditing={isEditing} />
                                </View>
                                <View style={styles.halfField}>
                                    <InputField label="Joining Date" value={joiningDate} setValue={setJoiningDate} colors={colors} isEditing={false} />
                                </View>
                            </View>
                        </Section>

                        {/* ── Section 2: Work Info ── */}
                        <Section title="Work Information" icon="work-outline" colors={colors}>
                            <PickerField
                                label="Department"
                                value={departmentName}
                                placeholder="Select Department"
                                onPress={() => isEditing && setShowDepartmentPicker(true)}
                                colors={colors}
                                isEditing={isEditing}
                            />
                            <PickerField
                                label="Designation"
                                value={designationName}
                                placeholder="Select Designation"
                                onPress={() => {
                                    if (!isEditing) return;
                                    if (!departmentName) { Alert.alert('Notice', 'Please select a department first'); return; }
                                    setShowDesignationPicker(true);
                                }}
                                colors={colors}
                                isEditing={isEditing}
                            />
                            <PickerField
                                label="Manager"
                                value={headName || (headId ? `Manager ${headId}` : '')}
                                placeholder="Select Manager"
                                onPress={() => isEditing && setShowHeadPicker(true)}
                                colors={colors}
                                isEditing={isEditing}
                            />
                            <PickerField
                                label="Shift"
                                value={shiftName || (shiftId ? `Shift ${shiftId}` : '')}
                                placeholder="Select Shift"
                                onPress={() => isEditing && setShowShiftPicker(true)}
                                colors={colors}
                                isEditing={isEditing}
                            />
                            <PickerField
                                label="Employment Status"
                                value={employmentStatus}
                                placeholder="Select Status"
                                onPress={() => isEditing && setShowStatusPicker(true)}
                                colors={colors}
                                isEditing={isEditing}
                                statusColor={employmentStatus ? getStatusColor(employmentStatus).color : undefined}
                            />
                        </Section>

                        {/* ── Section 3: Address ── */}
                        <Section title="Address" icon="location-on" colors={colors}>
                            <InputField label="Street Address" value={address} setValue={setAddress} colors={colors} isEditing={isEditing} />
                            <View style={styles.row}>
                                <View style={styles.halfField}>
                                    <InputField label="City" value={city} setValue={setCity} colors={colors} isEditing={isEditing} />
                                </View>
                                <View style={styles.halfField}>
                                    <InputField label="State" value={state} setValue={setState} colors={colors} isEditing={isEditing} />
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.halfField}>
                                    <InputField label="Postal Code" value={postalCode} setValue={setPostalCode} colors={colors} isEditing={isEditing} keyboardType="numeric" />
                                </View>
                                <View style={styles.halfField}>
                                    <InputField label="Country" value={country} setValue={setCountry} colors={colors} isEditing={isEditing} />
                                </View>
                            </View>
                        </Section>

                        {/* ── Section 4: Security ── */}
                        <Section title="Security" icon="lock-outline" colors={colors}>
                            <InputField label="New Password" value={password} setValue={setPassword} colors={colors} isEditing={isEditing} secure />
                            {isEditing && (
                                <Text style={[styles.passwordHint, { color: colors.textSub }]}>
                                    Leave blank to keep your current password unchanged.
                                </Text>
                            )}
                        </Section>

                        {/* ── Save Button ── */}
                        {isEditing && (
                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                                onPress={handleSave}
                                activeOpacity={0.85}
                            >
                                <MaterialIcons name="check" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.saveText}>Save Changes</Text>
                            </TouchableOpacity>
                        )}

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>

            {/* ── Modals ── */}
            <SelectionModal
                visible={showDesignationPicker}
                onClose={() => setShowDesignationPicker(false)}
                options={designations.filter(d => (d.department || d.departmentName) === departmentName)}
                title="Select Designation"
                colors={colors}
                onSelect={(item: any) => { setDesignationId(item.id); setDesignationName(item.name); }}
            />
            <SelectionModal
                visible={showShiftPicker}
                onClose={() => setShowShiftPicker(false)}
                options={shifts.map((shift) => ({
                    ...shift,
                    id: shift.id,
                    name: `${shift.shiftName || shift.name || `Shift ${shift.id}`} (${formatShiftTime(shift.startTime || shift.start_time)} - ${formatShiftTime(shift.endTime || shift.end_time)})`,
                }))}
                title="Select Shift"
                colors={colors}
                onSelect={(item: any) => {
                    setShiftId(item.id);
                    setShiftName(item.name);
                    setShiftStartTime(item.startTime || item.start_time || '');
                    setShiftEndTime(item.endTime || item.end_time || '');
                }}
            />
            <SelectionModal
                visible={showHeadPicker}
                onClose={() => setShowHeadPicker(false)}
                options={heads.map((head) => ({ id: head.id, name: head.fullName || head.name || head.roleName || `Manager ${head.id}` }))}
                title="Select Manager"
                colors={colors}
                onSelect={(item: any) => { setHeadId(item.id); setHeadName(item.name); }}
            />
            <SelectionModal
                visible={showDepartmentPicker}
                onClose={() => setShowDepartmentPicker(false)}
                options={departments.map((dept, idx) => ({ id: idx, name: dept }))}
                title="Select Department"
                colors={colors}
                onSelect={(item: any) => {
                    setDepartmentName(item.name);
                    setDesignationId('');
                    setDesignationName('');
                }}
            />
            <SelectionModal
                visible={showStatusPicker}
                onClose={() => setShowStatusPicker(false)}
                options={[
                    { id: 'Active', name: 'Active' },
                    { id: 'Inactive', name: 'Inactive' },
                    { id: 'Terminated', name: 'Terminated' },
                    { id: 'Resigned', name: 'Resigned' },
                ]}
                title="Select Status"
                colors={colors}
                onSelect={(item: any) => setEmploymentStatus(item.name)}
            />
        </SafeAreaView>
    );
}

// ── InputField ───────────────────────────────────────────────
function InputField({ label, value, setValue, multiline, secure, colors, isEditing, keyboardType }: any) {
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
                placeholderTextColor={colors.textSub + '80'}
                keyboardType={keyboardType}
                style={[
                    styles.input,
                    {
                        backgroundColor: isEditing ? colors.background : colors.border + '18',
                        borderColor: isEditing ? colors.primary + '60' : colors.border + '30',
                        color: colors.textMain,
                        height: multiline ? 90 : 48,
                    },
                ]}
            />
        </View>
    );
}

// ── PickerField ──────────────────────────────────────────────
function PickerField({ label, value, placeholder, onPress, colors, isEditing, statusColor }: any) {
    return (
        <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>{label}</Text>
            <Pressable
                onPress={onPress}
                style={[
                    styles.input,
                    styles.pickerField,
                    {
                        backgroundColor: isEditing ? colors.background : colors.border + '18',
                        borderColor: isEditing ? colors.primary + '60' : colors.border + '30',
                    },
                ]}
            >
                <Text style={{
                    color: value ? (statusColor || colors.textMain) : colors.textSub + '80',
                    fontSize: 15,
                    flex: 1,
                }}>
                    {value || placeholder}
                </Text>
                {isEditing && <MaterialIcons name="expand-more" size={22} color={colors.textSub} />}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 16, paddingBottom: 40 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 14 },

    /* Page Header */
    pageHeader: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16 },
    pageTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
    editBtnText: { fontSize: 13, fontWeight: '600' },

    /* Avatar Card */
    avatarCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 18,
        marginBottom: 14,
        gap: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    avatarCircle: {
        width: 62,
        height: 62,
        borderRadius: 31,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: { fontSize: 22, fontWeight: '700', color: '#fff' },
    avatarInfo: { flex: 1, gap: 4 },
    avatarName: { fontSize: 17, fontWeight: '700' },
    avatarDesignation: { fontSize: 13 },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        marginTop: 4,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusPillText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },

    /* Section */
    section: {
        borderRadius: 18,
        marginBottom: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
    },
    sectionIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 0.1 },
    sectionBody: { padding: 16, gap: 0 },

    /* Row layout */
    row: { flexDirection: 'row', gap: 10 },
    halfField: { flex: 1 },

    /* Fields */
    inputGroup: { marginBottom: 14 },
    label: { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
    input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, fontSize: 15 },
    pickerField: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48,
    },
    passwordHint: { fontSize: 12, marginTop: -6, lineHeight: 18 },

    /* Save Button */
    saveButton: {
        flexDirection: 'row',
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    saveText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    /* Modal */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    pickerContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '65%' },
    modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1', alignSelf: 'center', marginBottom: 16 },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1 },
    pickerTitle: { fontSize: 17, fontWeight: '700' },
    closeBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
});