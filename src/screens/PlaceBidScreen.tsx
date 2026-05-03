import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorker } from '../context/WorkerContext';
import { useAgency } from '../context/AgencyContext';
import { jobsApi } from '../api/jobs';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import { RootStackParamList, BudgetType } from '../types';

const TAG = 'PlaceBid';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PlaceBid'>;
  route: RouteProp<RootStackParamList, 'PlaceBid'>;
};

const rateTypes: { value: BudgetType; label: string }[] = [
  { value: 'FIXED', label: 'Fixed' },
  { value: 'HOURLY', label: 'Hourly' },
  { value: 'DAILY', label: 'Daily' },
];

export function PlaceBidScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { workerProfile } = useWorker();
  const { isAgencyMode, agencyProfile } = useAgency();
  const { jobId, jobTitle } = route.params;
  const bidAsAgency = isAgencyMode && !!agencyProfile;

  const [proposedAmount, setProposedAmount] = useState('');
  const [selectedRateType, setSelectedRateType] = useState<BudgetType>('FIXED');
  const [coverMessage, setCoverMessage] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!proposedAmount || parseFloat(proposedAmount) <= 0) {
      return Alert.alert('Error', 'Please enter a valid amount');
    }

    setLoading(true);
    try {
      const baseFields = {
        proposedAmount: parseFloat(proposedAmount),
        proposedRateType: selectedRateType,
        coverMessage: coverMessage.trim() || undefined,
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : undefined,
      };
      const payload = bidAsAgency
        ? {
            ...baseFields,
            agencyId: agencyProfile!.agencyId,
            agencyName: agencyProfile!.agencyName,
          }
        : {
            ...baseFields,
            workerFirstName: workerProfile?.firstName,
            workerLastName: workerProfile?.lastName,
            workerWorkerType: workerProfile?.workerType,
            workerExperienceYears: workerProfile?.experienceYears,
            workerRating: workerProfile?.averageRating,
          };
      await jobsApi.placeBid(jobId, payload);
      Alert.alert('Success', 'Bid placed successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      logger.error(TAG, 'Failed to place bid', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.slate900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Place Bid</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Job Title */}
        <View style={styles.jobCard}>
          <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
          <Text style={styles.jobTitle} numberOfLines={2}>{jobTitle}</Text>
        </View>

        {/* Amount */}
        <View style={styles.field}>
          <Text style={styles.label}>Proposed Amount (Rs.) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5000"
            placeholderTextColor={colors.slate400}
            value={proposedAmount}
            onChangeText={setProposedAmount}
            keyboardType="numeric"
          />
        </View>

        {/* Rate Type */}
        <View style={styles.field}>
          <Text style={styles.label}>Rate Type</Text>
          <View style={styles.chipRow}>
            {rateTypes.map((rt) => (
              <TouchableOpacity
                key={rt.value}
                style={[styles.chip, selectedRateType === rt.value && styles.chipActive]}
                onPress={() => setSelectedRateType(rt.value)}
              >
                <Text style={[styles.chipText, selectedRateType === rt.value && styles.chipTextActive]}>{rt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Estimated Days */}
        <View style={styles.field}>
          <Text style={styles.label}>Estimated Days</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 3"
            placeholderTextColor={colors.slate400}
            value={estimatedDays}
            onChangeText={setEstimatedDays}
            keyboardType="numeric"
          />
        </View>

        {/* Cover Message */}
        <View style={styles.field}>
          <Text style={styles.label}>Cover Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Introduce yourself and explain why you're a good fit..."
            placeholderTextColor={colors.slate400}
            value={coverMessage}
            onChangeText={setCoverMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="hand-left" size={20} color={colors.white} />
              <Text style={styles.submitText}>Submit Bid</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate50 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.slate200,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.slate900 },
  jobCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.blue50,
    borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: colors.blue200,
  },
  jobTitle: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.slate900 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.slate700, marginBottom: 8 },
  input: {
    backgroundColor: colors.white, borderRadius: 12, paddingHorizontal: 14, height: 48,
    fontSize: 15, color: colors.foreground, borderWidth: 1, borderColor: colors.slate200,
  },
  textArea: { height: 100, paddingTop: 12 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200,
  },
  chipActive: { backgroundColor: colors.green600, borderColor: colors.green600 },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.slate600 },
  chipTextActive: { color: colors.white },
  submitButton: {
    backgroundColor: colors.green600, borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
    shadowColor: colors.green600, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
