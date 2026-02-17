import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar as NativeStatusBar,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SessionManager } from '../services/SessionManager';

const STATIC_COLORS = {
  orange: '#f97316',
  teal: '#14b8a6',
  green: '#22c55e',
};

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { isDark, colors, setMode } = useTheme();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const checkRole = async () => {
      const user = await SessionManager.getUser();
      const roles = user?.roles || [];
      const isAdmin = roles.some((role: string) => String(role).toLowerCase() === 'admin');
      if (!isAdmin) {
        router.replace('/screens/employee_dashboard');
      }
    };
    checkRole();
  }, []);

  const dynamicStyles = createDynamicStyles(colors, isDark);

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.header, dynamicStyles.header]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Admin Settings</Text>
          <View style={styles.spacer} />
        </View>

        {/* Search */}
        <View style={[styles.searchWrap, dynamicStyles.searchWrap]}>
          <MaterialIcons name="search" size={20} color={colors.textSub} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search settings..."
            placeholderTextColor={colors.textSub}
            style={[styles.searchInput, dynamicStyles.searchInput]}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* General */}
          <Text style={[styles.sectionLabel, dynamicStyles.sectionLabel]}>GENERAL</Text>
          <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
            <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
              <View style={[styles.rowIcon, { backgroundColor: `${colors.primary}15` }]}>
                <MaterialIcons name="apartment" size={20} color={colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, dynamicStyles.rowTitle]}>Company Profile</Text>
                <Text style={[styles.rowSub, dynamicStyles.rowSub]}>Manage brand, name, and address</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSub} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
              <View style={[styles.rowIcon, { backgroundColor: `${colors.primary}15` }]}>
                <MaterialIcons name="manage-accounts" size={20} color={colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, dynamicStyles.rowTitle]}>User Management</Text>
                <Text style={[styles.rowSub, dynamicStyles.rowSub]}>Roles, permissions & admin access</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSub} />
            </TouchableOpacity>

            <View style={styles.rowItem}>
              <View style={[styles.rowIcon, { backgroundColor: `${colors.primary}15` }]}>
                <MaterialIcons name={isDark ? 'dark-mode' : 'light-mode'} size={20} color={colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, dynamicStyles.rowTitle]}>Dark Mode</Text>
                <Text style={[styles.rowSub, dynamicStyles.rowSub]}>Toggle app theme</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={() => setMode(isDark ? 'light' : 'dark')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={'#ffffff'}
              />
            </View>
          </View>

          {/* Organization */}
          <Text style={[styles.sectionLabel, dynamicStyles.sectionLabel]}>ORGANIZATION</Text>
          <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
            <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
              <View style={[styles.rowIcon, { backgroundColor: `${STATIC_COLORS.orange}15` }]}>
                <MaterialIcons name="badge" size={20} color={STATIC_COLORS.orange} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, dynamicStyles.rowTitle]}>HR Configurations</Text>
                <Text style={[styles.rowSub, dynamicStyles.rowSub]}>Departments, designations & types</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSub} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
              <View style={[styles.rowIcon, { backgroundColor: `${STATIC_COLORS.teal}15` }]}>
                <MaterialIcons name="event-available" size={20} color={STATIC_COLORS.teal} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, dynamicStyles.rowTitle]}>Leave & Attendance Policy</Text>
                <Text style={[styles.rowSub, dynamicStyles.rowSub]}>Holidays, shifts & leave types</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSub} />
            </TouchableOpacity>
          </View>

          {/* Finance */}
          <Text style={[styles.sectionLabel, dynamicStyles.sectionLabel]}>FINANCE</Text>
          <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
            <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
              <View style={[styles.rowIcon, { backgroundColor: `${STATIC_COLORS.green}15` }]}>
                <MaterialIcons name="payments" size={20} color={STATIC_COLORS.green} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, dynamicStyles.rowTitle]}>Payroll Settings</Text>
                <Text style={[styles.rowSub, dynamicStyles.rowSub]}>Tax slabs, allowances & deductions</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSub} />
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <Text style={[styles.sectionLabel, dynamicStyles.sectionLabel]}>APP INFO</Text>
          <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
            <View style={styles.rowItem}>
              <View style={[styles.rowIcon, dynamicStyles.infoIcon]}>
                <MaterialIcons name="info" size={20} color={colors.textSub} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, dynamicStyles.rowTitle]}>Version</Text>
                <Text style={[styles.rowSub, dynamicStyles.rowSub]}>Current installed version</Text>
              </View>
              <Text style={[styles.versionText, dynamicStyles.versionText]}>v2.4.1</Text>
            </View>

            <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
              <View style={[styles.rowIcon, dynamicStyles.infoIcon]}>
                <MaterialIcons name="help-center" size={20} color={colors.textSub} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, dynamicStyles.rowTitle]}>Support & Help</Text>
                <Text style={[styles.rowSub, dynamicStyles.rowSub]}>FAQs and contact support</Text>
              </View>
              <MaterialIcons name="open-in-new" size={20} color={colors.textSub} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
  },
  spacer: {
    width: 40,
  },
  searchWrap: {
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: {
    marginLeft: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionLabel: {
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 16,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionCard: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

const createDynamicStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      color: colors.textMain,
    },
    searchWrap: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
      borderColor: colors.border,
    },
    searchInput: {
      color: colors.textMain,
    },
    sectionLabel: {
      color: colors.textSub,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderBottomColor: colors.border,
    },
    rowItem: {
      borderBottomColor: colors.border,
    },
    rowTitle: {
      color: colors.textMain,
    },
    rowSub: {
      color: colors.textSub,
    },
    infoIcon: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
    },
    versionText: {
      color: colors.textSub,
    },
  });



