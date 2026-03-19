import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { EmployeeApi } from '../services/auth';
import { User } from '../services/SessionManager';

export default function SystemDetailsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [employee, setEmployee] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployeeDetails();
  }, []);

  const loadEmployeeDetails = async () => {
    setLoading(true);
    const data = await EmployeeApi.getEmployeeDetails();
    setEmployee(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textMain }}>No employee data available</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textMain} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textMain }]}>
          System Details
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Info Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>

          <InfoRow
            icon="apartment"
            label="Department"
            value={employee.departmentName}
            colors={colors}
          />

          <Divider colors={colors} />

          <InfoRow
            icon="work"
            label="Designation"
            value={employee.designationName}
            colors={colors}
          />

          <Divider colors={colors} />

          <InfoRow
            icon="badge"
            label="Employee Code"
            value={employee.employeeCode}
            colors={colors}
          />

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, colors }: any) {
  return (
    <View style={styles.infoRow}>

      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <MaterialIcons name={icon} size={20} color={colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: colors.textSub }]}>
          {label}
        </Text>

        <Text style={[styles.value, { color: colors.textMain }]}>
          {value}
        </Text>
      </View>

    </View>
  );
}

function Divider({ colors }: any) {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 16,
      }}
    />
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  scroll: {
    padding: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  label: {
    fontSize: 13,
    marginBottom: 2,
  },

  value: {
    fontSize: 16,
    fontWeight: '700',
  },

});