import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { disputesApi } from '../api/disputes';
import { jobsApi } from '../api/jobs';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import type {
  DisputeCategory, JobListingSummaryResponse, RootStackParamList,
} from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SubmitDispute'>;
type Rt = RouteProp<RootStackParamList, 'SubmitDispute'>;
const TAG = 'SubmitDisputeScreen';

const CATEGORIES: { key: DisputeCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'PAYMENT',  label: 'Payment',  icon: 'cash-outline' },
  { key: 'NO_SHOW',  label: 'No-show',  icon: 'close-circle-outline' },
  { key: 'QUALITY',  label: 'Quality',  icon: 'construct-outline' },
  { key: 'BEHAVIOR', label: 'Behavior', icon: 'sad-outline' },
  { key: 'OTHER',    label: 'Other',    icon: 'ellipsis-horizontal-outline' },
];

export default function SubmitDisputeScreen() {
  const navigation = useNavigation<Nav>();
  const presetJobId = useRoute<Rt>().params?.jobId;

  const [jobs, setJobs] = useState<JobListingSummaryResponse[]>([]);
  const [jobId, setJobId] = useState<string | undefined>(presetJobId);
  const [category, setCategory] = useState<DisputeCategory | undefined>();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (presetJobId) return;
    (async () => {
      try {
        const [mineAsConsumer, mineAsWorker] = await Promise.all([
          jobsApi.getMyListings(0, 50).then(r => r.data.listings).catch(() => []),
          jobsApi.getMyJobs(0, 50).then(r => r.data.listings).catch(() => []),
        ]);
        const dedup = new Map<string, JobListingSummaryResponse>();
        [...mineAsConsumer, ...mineAsWorker].forEach(j => dedup.set(j.jobId, j));
        setJobs(Array.from(dedup.values()));
      } catch (err) {
        logger.error(TAG, 'load jobs failed', err);
      }
    })();
  }, [presetJobId]);

  const valid = useMemo(() =>
    !!jobId && !!category && subject.trim().length > 0 && description.trim().length > 0,
    [jobId, category, subject, description],
  );

  const onSubmit = async () => {
    if (!valid || submitting || !jobId || !category) return;
    setSubmitting(true);
    try {
      const created = await disputesApi.submitDispute({
        jobId, category, subject: subject.trim(), description: description.trim(),
      });
      navigation.replace('DisputeDetail', { disputeId: created.disputeId });
    } catch (err: any) {
      Alert.alert('Submission failed', err?.response?.data?.message ?? 'Try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Report an issue</Text>

        <Text style={styles.section}>Job</Text>
        {presetJobId ? (
          <View style={styles.jobLocked}>
            <Ionicons name="briefcase-outline" size={18} color={colors.mutedForeground} />
            <Text style={styles.jobLockedText}>Job {presetJobId.slice(0, 8)}…</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {jobs.map(j => {
              const active = jobId === j.jobId;
              return (
                <TouchableOpacity
                  key={j.jobId}
                  style={[styles.jobChip, active && styles.jobChipActive]}
                  onPress={() => setJobId(j.jobId)}>
                  <Text style={[styles.jobChipText, active && styles.jobChipTextActive]} numberOfLines={1}>
                    {j.title || `Job ${j.jobId.slice(0, 8)}…`}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {jobs.length === 0 && (
              <Text style={styles.helperText}>No jobs yet — open a job first.</Text>
            )}
          </ScrollView>
        )}

        <Text style={styles.section}>Category</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map(c => {
            const active = category === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                style={[styles.cat, active && styles.catActive]}
                onPress={() => setCategory(c.key)}>
                <Ionicons name={c.icon} size={20} color={active ? colors.white : colors.mutedForeground} />
                <Text style={[styles.catLabel, active && styles.catLabelActive]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.section}>Subject ({subject.length}/120)</Text>
        <TextInput
          style={styles.input}
          maxLength={120}
          value={subject}
          onChangeText={setSubject}
          placeholder="Short summary"
          placeholderTextColor={colors.gray400}
        />

        <Text style={styles.section}>Description ({description.length}/2000)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          multiline
          maxLength={2000}
          value={description}
          onChangeText={setDescription}
          placeholder="What happened?"
          placeholderTextColor={colors.gray400}
        />

        <TouchableOpacity
          style={[styles.submit, (!valid || submitting) && styles.submitDisabled]}
          disabled={!valid || submitting}
          onPress={onSubmit}>
          {submitting
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.submitText}>Submit</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: colors.foreground, marginBottom: 16 },
  section: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground, marginTop: 14, marginBottom: 6 },
  jobLocked: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.slate100, padding: 10, borderRadius: 8 },
  jobLockedText: { marginLeft: 8, color: colors.foreground },
  jobChip: { paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, maxWidth: 200 },
  jobChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  jobChipText: { color: colors.mutedForeground, fontSize: 13 },
  jobChipTextActive: { color: colors.white, fontWeight: '600' },
  helperText: { color: colors.gray400, fontSize: 13 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cat: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  catActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catLabel: { marginLeft: 6, color: colors.mutedForeground },
  catLabelActive: { color: colors.white, fontWeight: '600' },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 12, color: colors.foreground,
  },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  submit: { backgroundColor: colors.primary, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
