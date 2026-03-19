// screens/LoansScreen.tsx
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdvanceSalaryModal } from '../components/AdvanceSalaryModal';
import EmployeeHeader from '../components/EmployeeHeader';
import { LoanModal } from '../components/RequestLoanModal';
import SideMenu from '../components/SideMenu';
import { useTheme } from '../contexts/ThemeContext';
import { SessionManager, User } from '../services/SessionManager';
import { getSalaryAdvances, SalaryAdvance } from '../services/advanceSalary';
import { getLoans } from '../services/loan';
const { width: screenWidth } = Dimensions.get('window');


interface LoanItem {
    id: string;
    employee: string;
    totalAmount: number;
    monthlyInstallment: number;
    remainingAmount: number;
    startDate: string;
    endDate: string;
    createdDate?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    type: 'Loan' | 'Advance';
    employeeId: number;
    deductMonth?: string; // for advances
}

export default function LoansScreen() {
    const { isDark, colors } = useTheme();
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'Loan' | 'Advance'>('Loan');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isMenuVisible, setMenuVisible] = useState(false);

    const [loansData, setLoansData] = useState<LoanItem[]>([]);
    const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
    const [loadingAdvances, setLoadingAdvances] = useState(false);

    // Load user session
    useEffect(() => {
        const loadUser = async () => {
            const userData = await SessionManager.getUser();
            setUser(userData);
            if (!userData) router.replace('/');
        };
        loadUser();
    }, []);

    // Load loans from API
    const loadLoans = useCallback(async () => {
        if (!user?.employeeId) return;
        try {
            const data = await getLoans();
            const userLoans = data
                .filter(l => l.employeeId === user.employeeId)
                .map(l => ({
                    id: l.id,
                    createdDate: l.createdAtUtc ? new Date(l.createdAtUtc).toLocaleDateString() : '-',
                    employee: l.employeeName,
                    totalAmount: l.totalAmount,
                    monthlyInstallment: l.monthlyInstallment,
                    remainingAmount: l.remainingAmount,
                    startDate: l.startDate?.split('T')[0] || '',
                    endDate: l.endDate?.split('T')[0] || '',
                    status: l.status,
                    type: 'Loan',
                    employeeId: l.employeeId,
                }));
            setLoansData(userLoans);
        } catch (error) {
            console.error('Failed to fetch loans:', error);
        }
    }, [user]);

    useEffect(() => {
        loadLoans();
    }, [user, loadLoans]);

    // Load advances from API
    const loadAdvances = useCallback(async () => {
        if (!user?.employeeId) return;
        setLoadingAdvances(true);
        try {
            const data = await getSalaryAdvances();
            const userAdvances = data.filter(a => a.employeeId === user.employeeId);
            setAdvances(userAdvances);
        } catch (error) {
            console.error('Failed to fetch advances:', error);
        } finally {
            setLoadingAdvances(false);
        }
    }, [user?.employeeId]);

    useEffect(() => {
        loadAdvances();
    }, [user, loadAdvances]);

    // Convert advances to LoanItem for table
    // Convert advances to LoanItem for table
    const advanceItems: LoanItem[] = advances.map(a => {
        let formattedDeductMonth = '-';
        if (a.deductFromMonth != null) {
            // Assume deductFromMonth is like 202603 (year * 100 + month)
            // If it’s just month number like 3, you need year separately
            // We'll assume current year for simplicity, or get from a.createdAtUtc
            const year = new Date(a.createdAtUtc).getFullYear();
            const month = a.deductFromMonth; // number
            formattedDeductMonth = `${year}-${String(month).padStart(2, '0')}`; // 2026-03
        }

        return {
            id: a.id,
            createdDate: new Date(a.createdAtUtc).toLocaleDateString(),
            employee: a.employeeName,
            totalAmount: a.amount,
            monthlyInstallment: 0,
            remainingAmount: a.amount,
            startDate: '',
            endDate: '',
            status:
                a.status?.toLowerCase() === 'pending'
                    ? 'Pending'
                    : a.status?.toLowerCase() === 'approved'
                        ? 'Approved'
                        : 'Rejected', type: 'Advance',
            employeeId: a.employeeId,
            deductMonth: formattedDeductMonth,
        };
    });
    const allLoans: LoanItem[] = [...loansData, ...advanceItems];

    // Filter by search & tab
    const filteredLoans = allLoans
        .filter(l => l.employee.toLowerCase().includes(search.toLowerCase()))
        .filter(l => l.type === activeTab);

    // Responsive table setup
    const screenWidth = Dimensions.get('window').width;
    const isLargeScreen = screenWidth > 1200;
    const horizontalPadding = isLargeScreen ? 0 : 16;
    const usableWidth = screenWidth - horizontalPadding * 2;

    // Dynamic columns per tab
    const loanColumns = {
        CREATED: 140,
        EMPLOYEE: 140,
        TOTAL: 120,
        INSTALLMENT: 120,
        REMAINING: 120,
        DURATION: 200,
        STATUS: 120,
    };
    const advanceColumns = {
        CREATED: 140,
        EMPLOYEE: 140,
        TOTAL: 120,
        DEDUCT_MONTH: 120,
        STATUS: 120,
    };

    const columns = activeTab === 'Loan' ? loanColumns : advanceColumns;
    const totalBaseWidth = Object.values(columns).reduce((sum, w) => sum + w, 0);
    const scaleFactor = totalBaseWidth < usableWidth ? usableWidth / totalBaseWidth : 1;

    // Render row
    const renderItem = (item: LoanItem) => (
        <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {Object.keys(columns).map(key => {
                const width = columns[key as keyof typeof columns] * scaleFactor;

                if (key === 'STATUS') {
                    return (
                        <View
                            key={key}
                            style={[
                                styles.statusContainer,
                                {
                                    width, backgroundColor:
                                        item.status === 'Pending'
                                            ? '#f59e0b' // amber
                                            : item.status === 'Approved'
                                                ? '#16a34a' // green
                                                : '#dc2626' // red (Rejected) },
                                },
                            ]}
                        >
                            <Text style={styles.statusText}>{item.status}</Text>
                        </View>
                    );
                }

                let value: any;
                switch (key) {
                    case 'CREATED':
                        value = item.createdDate || '-';
                        break;
                    case 'EMPLOYEE':
                        value = item.employee;
                        break;
                    case 'TOTAL':
                        value = item.totalAmount.toLocaleString();
                        break;
                    case 'INSTALLMENT':
                        value = item.monthlyInstallment.toLocaleString();
                        break;
                    case 'REMAINING':
                        value = item.remainingAmount.toLocaleString();
                        break;
                    case 'DURATION':
                        value = item.startDate && item.endDate ? `${item.startDate} to ${item.endDate}` : '-';
                        break;
                    case 'DEDUCT_MONTH':
                        value = item.deductMonth || '-';
                        break;
                }

                return (
                    <View key={key} style={[styles.cellContainer, { width }]}>
                        <Text style={[styles.cell, { color: colors.textMain }]}>{value}</Text>
                    </View>
                );
            })}
        </View>
    );

    const handleLoanSubmit = () => loadLoans();
    const handleAdvanceSubmit = () => loadAdvances();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <EmployeeHeader
                user={user}
                onMenuPress={() => setMenuVisible(true)}
                onNotificationPress={() => console.log('Notifications pressed')}
            />
            <SideMenu visible={isMenuVisible} onClose={() => setMenuVisible(false)} />

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
                    <Text style={[styles.title, { color: colors.textMain }]}>My Loans & Advances</Text>
                    <Text style={[styles.subtitle, { color: colors.textSub }]}>
                        Request and trace your active loan status
                    </Text>

                    <TouchableOpacity
                        onPress={() => user?.id && setIsModalVisible(true)}
                        style={[styles.button, { backgroundColor: colors.primary, width: '100%' }]}
                    >
                        <Text style={styles.buttonText}>
                            {activeTab === 'Loan' ? '+ Request Loan' : '+ Request Advance'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* TABS */}
                <View style={{ flexDirection: 'row', marginHorizontal: horizontalPadding, marginBottom: 10 }}>
                    {['Loan', 'Advance'].map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab as 'Loan' | 'Advance')}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                borderBottomWidth: 3,
                                borderColor: activeTab === tab ? colors.primary : 'transparent',
                                alignItems: 'center',
                                backgroundColor: activeTab === tab ? (isDark ? '#334155' : '#e2e8f0') : 'transparent',
                                borderRadius: 8,
                            }}
                        >
                            <Text style={{ color: activeTab === tab ? colors.primary : colors.textSub, fontSize: 18, fontWeight: '600' }}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* SEARCH */}
                <View style={[styles.searchContainer, { borderColor: colors.border, backgroundColor: isDark ? '#1e293b' : '#f1f5f9', marginHorizontal: horizontalPadding }]}>
                    <TextInput
                        placeholder="Search by employee name..."
                        placeholderTextColor={colors.textSub}
                        style={[styles.searchInput, { color: colors.textMain }]}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* TABLE */}
                <View style={[styles.tableContainer, { borderColor: colors.border, marginHorizontal: horizontalPadding }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator>
                        <View>
                            {/* Header */}
                            <View style={[styles.tableHeader, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                                {Object.keys(columns).map(key => {
                                    const width = columns[key as keyof typeof columns] * scaleFactor;
                                    const label = key === 'CREATED' ? 'CREATED DATE' : key === 'DEDUCT_MONTH' ? 'DED. MONTH' : key;
                                    return (
                                        <View key={key} style={[styles.cellContainer, { width }]}>
                                            <Text style={styles.headerCell}>{label}</Text>
                                        </View>
                                    );
                                })}
                            </View>

                            {/* Rows */}
                            {filteredLoans.length > 0 ? (
                                filteredLoans.map(item => <View key={item.id}>{renderItem(item)}</View>)
                            ) : (
                                <View style={[styles.row, { justifyContent: 'center', backgroundColor: colors.surface }]}>
                                    <Text style={{ color: colors.textSub, fontStyle: 'italic', paddingVertical: 12, width: totalBaseWidth * scaleFactor, textAlign: 'left' }}>
                                        No records found.
                                    </Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </ScrollView>

            {/* MODALS */}
            {activeTab === 'Loan' ? (
                <LoanModal isVisible={isModalVisible} onClose={() => setIsModalVisible(false)} onSubmit={handleLoanSubmit} />
            ) : user?.employeeId ? (
                <AdvanceSalaryModal isVisible={isModalVisible} onClose={() => setIsModalVisible(false)} employeeId={user.employeeId} onSubmit={handleAdvanceSubmit} />
            ) : null}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { paddingVertical: 16 },
    title: { fontSize: 32, fontWeight: '700' },
    subtitle: { fontSize: 18, marginVertical: 6 },
    button: { padding: 12, borderRadius: 8, marginTop: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    searchContainer: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 },
    searchInput: { fontSize: 14 },
    tableContainer: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
    tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10 },
    headerCell: { fontSize: 12, fontWeight: '600' },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    cellContainer: { paddingHorizontal: 4, justifyContent: 'center' },
    cell: { fontSize: 14 },
    statusContainer: { paddingVertical: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    statusText: { color: '#fff', fontWeight: '600', fontSize: 12 },
});
