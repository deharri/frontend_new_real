import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { disputesApi } from '../api/disputes';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import type { Dispute, DisputeCategory, DisputeStatus, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ResolutionCenter'>;
const TAG = 'ResolutionCenterScreen';

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

export default function ResolutionCenterScreen() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await disputesApi.getMyDisputes(0, 50);
      setItems(page.content);
    } catch (err) {
      logger.error(TAG, 'load failed', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resolution Center</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('SubmitDispute', {})}
          style={styles.addBtn}>
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      {loading && items.length === 0
        ? <ActivityIndicator style={{ marginTop: 40 }} />
        : <FlatList
            data={items}
            keyExtractor={i => i.disputeId}
            contentContainerStyle={items.length === 0 ? styles.emptyContainer : { padding: 16 }}
            refreshControl={
              <RefreshControl refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); load(); }} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.gray400} />
                <Text style={styles.emptyText}>
                  You haven't raised any issues. If something goes wrong with a job, you can flag it here.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => navigation.navigate('DisputeDetail', { disputeId: item.disputeId })}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
                  <View style={styles.rowMeta}>
                    <View style={styles.catChip}>
                      <Text style={styles.catChipText}>{CATEGORY_LABEL[item.category]}</Text>
                    </View>
                    <Text style={styles.metaText}>
                      Job {item.jobId.slice(0, 8)}…  ·  {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusChip, { backgroundColor: STATUS_COLOR[item.status] }]}>
                  <Text style={styles.statusChipText}>{item.status.replace('_', ' ')}</Text>
                </View>
              </TouchableOpacity>
            )}
          />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.foreground },
  addBtn: {
    backgroundColor: colors.primary, width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    padding: 14, marginBottom: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
  },
  subject: { fontSize: 15, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
  rowMeta: { flexDirection: 'row', alignItems: 'center' },
  catChip: { backgroundColor: colors.slate100, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
  catChipText: { fontSize: 11, color: colors.mutedForeground, fontWeight: '500' },
  metaText: { fontSize: 11, color: colors.gray400 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusChipText: { color: colors.white, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  empty: { alignItems: 'center' },
  emptyText: { color: colors.mutedForeground, textAlign: 'center', marginTop: 12, fontSize: 14, lineHeight: 20 },
});
