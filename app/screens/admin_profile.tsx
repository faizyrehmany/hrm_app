import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar as NativeStatusBar,
} from 'react-native';
import BottomTabBar from '../components/BottomTabBar';
import { useTheme } from '../contexts/ThemeContext';
import { SessionManager } from '../services/SessionManager';

const STATIC_COLORS = {
  green: '#22c55e',
  blue: '#2563eb',
  purple: '#7c3aed',
  orange: '#ea580c',
};

export default function AdminProfileScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();

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
            <MaterialIcons name="arrow-back-ios-new" size={20} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Profile</Text>
          <TouchableOpacity onPress={() => router.push('/screens/admin_settings')} style={styles.iconButton}>
            <MaterialIcons name="settings" size={20} color={colors.textMain} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Hero */}
          <View style={[styles.heroCard, dynamicStyles.heroCard]}>
            <View style={styles.avatarWrap}>
              <Image
                source={{
                  uri:
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuDv2JJLIIgn1PdOreFH9waOfoVP_GEeahouF-1yoc_-7opCC5co29nwkYKChOl203ioJrCxQvrn2kbRjs8sntnzH66x1pTRJ9SQkEYdg9xEMGUAIbW1VENOWFldyE7vKwN4lnqnlKToc2__gpMrNxbb1XVOXWrmeprOHcubsZBSKRKWMhU3xqs4X99D6CxwwHg1b5Q0UsboHkmQy0C53jPz5FQY8SuffNJ1lNGOrdok7-tFxoe1lHw7mflVRXv3HNVEoDtAS8YCIxX7',
                }}
                style={styles.avatar}
              />
              <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="verified" size={16} color="#fff" />
              </View>
            </View>
            <Text style={[styles.name, dynamicStyles.name]}>Sarah Jenkins</Text>
            <View style={[styles.roleChip, { borderColor: `${colors.primary}30`, backgroundColor: `${colors.primary}15` }]}>
              <Text style={[styles.roleChipText, { color: colors.primary }]}>Super Admin</Text>
            </View>
          </View>

          {/* Account Details */}
          <View style={[styles.card, dynamicStyles.card]}>
            <View style={[styles.cardHeader, dynamicStyles.cardHeader]}>
              <MaterialIcons name="badge" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>Account Details</Text>
            </View>
            <View style={[styles.infoRow, dynamicStyles.infoRow]}>
              <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Email</Text>
              <Text style={[styles.infoValue, dynamicStyles.infoValue]}>s.jenkins@company.hr</Text>
            </View>
            <View style={[styles.infoRow, dynamicStyles.infoRow]}>
              <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Admin ID</Text>
              <Text style={[styles.infoValue, dynamicStyles.infoValue]}>#ADM-8821</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>Joined</Text>
              <Text style={[styles.infoValue, dynamicStyles.infoValue]}>March 12, 2021</Text>
            </View>
          </View>

          {/* System Access */}
          <View style={[styles.card, dynamicStyles.card]}>
            <View style={[styles.cardHeader, dynamicStyles.cardHeader]}>
              <MaterialIcons name="security" size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>System Access</Text>
            </View>
            <Text style={[styles.subLabel, dynamicStyles.subLabel]}>ROLE LEVEL</Text>
            <View style={styles.accessRow}>
              <MaterialIcons name="check-circle" size={18} color={STATIC_COLORS.green} />
              <Text style={[styles.accessText, dynamicStyles.accessText]}>Full Administrative Privileges</Text>
            </View>
            <Text style={[styles.subLabel, dynamicStyles.subLabel, { marginTop: 12 }]}>PERMISSIONS</Text>
            <View style={styles.chipRow}>
              <View style={[styles.permChip, { backgroundColor: `${STATIC_COLORS.blue}15`, borderColor: `${STATIC_COLORS.blue}30` }]}>
                <Text style={[styles.permText, { color: STATIC_COLORS.blue }]}>Payroll Mgmt</Text>
              </View>
              <View style={[styles.permChip, { backgroundColor: `${STATIC_COLORS.purple}15`, borderColor: `${STATIC_COLORS.purple}30` }]}>
                <Text style={[styles.permText, { color: STATIC_COLORS.purple }]}>Onboarding</Text>
              </View>
              <View style={[styles.permChip, { backgroundColor: `${STATIC_COLORS.green}15`, borderColor: `${STATIC_COLORS.green}30` }]}>
                <Text style={[styles.permText, { color: STATIC_COLORS.green }]}>Leave Approval</Text>
              </View>
              <View style={[styles.permChip, { backgroundColor: `${STATIC_COLORS.orange}15`, borderColor: `${STATIC_COLORS.orange}30` }]}>
                <Text style={[styles.permText, { color: STATIC_COLORS.orange }]}>System Audit</Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={[styles.card, dynamicStyles.card]}>
            <View style={[styles.cardHeader, styles.cardHeaderRow, dynamicStyles.cardHeader]}>
              <View style={styles.cardHeaderRow}>
                <MaterialIcons name="history" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>Recent Activity</Text>
              </View>
              <TouchableOpacity>
                <Text style={[styles.linkText, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.activityRow}>
              <View style={[styles.activityIcon, { backgroundColor: `${STATIC_COLORS.green}15` }]}>
                <MaterialIcons name="done" size={18} color={STATIC_COLORS.green} />
              </View>
              <View style={styles.activityText}>
                <Text style={[styles.activityTitle, dynamicStyles.activityTitle]}>Approved Leave for J. Doe</Text>
                <Text style={[styles.activitySub, dynamicStyles.activitySub]}>2 hours ago</Text>
              </View>
            </View>

            <View style={[styles.activityRow, styles.activityRowBorder, dynamicStyles.activityRowBorder]}>
              <View style={[styles.activityIcon, { backgroundColor: `${STATIC_COLORS.blue}15` }]}>
                <MaterialIcons name="payments" size={18} color={STATIC_COLORS.blue} />
              </View>
              <View style={styles.activityText}>
                <Text style={[styles.activityTitle, dynamicStyles.activityTitle]}>Processed Monthly Payroll</Text>
                <Text style={[styles.activitySub, dynamicStyles.activitySub]}>Yesterday, 4:30 PM</Text>
              </View>
            </View>

            <View style={[styles.activityRow, styles.activityRowBorder, dynamicStyles.activityRowBorder]}>
              <View style={[styles.activityIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6' }]}>
                <MaterialIcons name="edit-document" size={18} color={colors.textSub} />
              </View>
              <View style={styles.activityText}>
                <Text style={[styles.activityTitle, dynamicStyles.activityTitle]}>Updated Policy Document</Text>
                <Text style={[styles.activitySub, dynamicStyles.activitySub]}>2 days ago</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.primaryBtnText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, dynamicStyles.secondaryBtn]}>
              <MaterialIcons name="lock" size={18} color={colors.textMain} />
              <Text style={[styles.secondaryBtnText, dynamicStyles.secondaryBtnText]}>Change Password</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        <BottomTabBar activeTab="profile" />
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
    justifyContent: 'space-between',
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
    fontSize: 18,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomWidth: 1,
  },
  avatarWrap: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cardHeaderRow: {
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    width: '30%',
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  accessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  accessText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  permChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  permText: {
    fontSize: 11,
    fontWeight: '700',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activityRowBorder: {
    borderTopWidth: 1,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  activitySub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    marginHorizontal: 16,
    gap: 10,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

const createDynamicStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: isDark ? '#1a2632' : '#fff',
      borderBottomColor: colors.border,
    },
    headerTitle: {
      color: colors.textMain,
    },
    heroCard: {
      backgroundColor: isDark ? '#1a2632' : '#fff',
      borderBottomColor: colors.border,
    },
    avatar: {
      borderColor: isDark ? colors.background : '#f6f7f8',
    },
    verifiedBadge: {
      borderColor: isDark ? '#1a2632' : '#fff',
    },
    name: {
      color: colors.textMain,
    },
    card: {
      backgroundColor: isDark ? '#1a2632' : '#fff',
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.08)',
    },
    cardHeader: {
      borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.08)',
    },
    cardTitle: {
      color: colors.textMain,
    },
    infoRow: {
      borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.08)',
    },
    infoLabel: {
      color: colors.textSub,
    },
    infoValue: {
      color: colors.textMain,
    },
    subLabel: {
      color: colors.textSub,
    },
    accessText: {
      color: colors.textMain,
    },
    activityTitle: {
      color: colors.textMain,
    },
    activitySub: {
      color: colors.textSub,
    },
    activityRowBorder: {
      borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.08)',
    },
    secondaryBtn: {
      backgroundColor: isDark ? '#1a2632' : '#fff',
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#d1d5db',
    },
    secondaryBtnText: {
      color: colors.textMain,
    },
  });



