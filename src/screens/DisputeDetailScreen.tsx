import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { disputesApi } from '../api/disputes';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import type {
  Dispute, DisputeCategory, DisputeStatus, RootStackParamList,
} from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DisputeDetail'>;
type Rt = RouteProp<RootStackParamList, 'DisputeDetail'>;
const TAG = 'DisputeDetailScreen';

const CATEGORY_LABEL: Record<DisputeCategory, string> = {
  PAYMENT: 'Payment', NO_SHOW: 'No-show', QUALITY: 'Quality',
  BEHAVIOR: 'Behavior', OTHER: 'Other',
};
const STATUS_COLOR: Record<DisputeStatus, string> = {
  OPEN: colors.amber500,
  UNDER_REVIEW: colors.primary,
  RESOLVED: colors.green600,
  CLOSED: colors.slate400,
};

export default function DisputeDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { disputeId } = useRoute<Rt>().params;
  const [d, setD] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setD(await disputesApi.getDispute(disputeId));
      } catch (err) {
        logger.error(TAG, 'load failed', err);
        Alert.alert('Error', 'Could not load this dispute.');
      } finally {
        setLoading(false);
      }
    })();
  }, [disputeId]);

  if (loading || !d) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.catChip}>
          <Text style={styles.catChipText}>{CATEGORY_LABEL[d.category]}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: STATUS_COLOR[d.status] }]}>
          <Text style={styles.statusChipText}>{d.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <Text style={styles.subject}>{d.subject}</Text>

      <TouchableOpacity
        style={styles.jobLink}
        onPress={() => navigation.navigate('JobListingDetail', { jobId: d.jobId })}>
        <Text style={styles.jobLinkText}>View linked job ›</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.body}>{d.description}</Text>
      </View>

      {d.adminNote ? (
        <View style={[styles.section, styles.adminNote]}>
          <Text style={styles.sectionLabel}>Response from support</Text>
          <Text style={styles.body}>{d.adminNote}</Text>
          <Text style={styles.meta}>Updated: {new Date(d.updatedAt).toLocaleString()}</Text>
        </View>
      ) : null}

      <Text style={styles.meta}>Submitted {new Date(d.createdAt).toLocaleString()}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  catChip: { backgroundColor: colors.slate100, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  catChipText: { fontSize: 12, color: colors.mutedForeground, fontWeight: '500' },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusChipText: { color: colors.white, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  subject: { fontSize: 22, fontWeight: '700', color: colors.foreground, marginBottom: 12 },
  jobLink: { padding: 10, backgroundColor: colors.slate100, borderRadius: 8, marginBottom: 18 },
  jobLinkText: { color: colors.primary, fontWeight: '600' },
  section: { marginBottom: 18 },
  adminNote: { backgroundColor: colors.blue50, padding: 14, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.primary },
  sectionLabel: { fontSize: 13, color: colors.mutedForeground, marginBottom: 6, fontWeight: '600' },
  body: { fontSize: 15, color: colors.foreground, lineHeight: 22 },
  meta: { fontSize: 12, color: colors.gray400, marginTop: 6 },
});
