import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { paymentsApi } from '../api/payments';
import { useAgency } from '../context/AgencyContext';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import type { PaymentTransaction, RootStackParamList, TransactionStatus } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Payments'>;
type Tab = 'sent' | 'received' | 'agency';
const TAG = 'PaymentsScreen';

const STATUS_COLORS: Record<TransactionStatus, string> = {
  PENDING:   colors.slate400,
  HELD:      colors.amber500,
  RELEASED:  colors.green600,
  REFUNDED:  colors.slate400,
  FAILED:    colors.red600,
  CANCELLED: colors.slate400,
};

export default function PaymentsScreen() {
  const navigation = useNavigation<Nav>();
  const { agencyProfile } = useAgency();
  const [tab, setTab] = useState<Tab>('sent');
  const [sent, setSent] = useState<PaymentTransaction[]>([]);
  const [received, setReceived] = useState<PaymentTransaction[]>([]);
  const [agencyPayments, setAgencyPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r, a] = await Promise.all([
        paymentsApi.getMyPayments().catch(() => []),
        paymentsApi.getMyJobPayments().catch(() => []),
        agencyProfile
          ? paymentsApi.getAgencyPayments(agencyProfile.agencyId).catch(() => [])
          : Promise.resolve([] as PaymentTransaction[]),
      ]);
      setSent(s);
      setReceived(r);
      setAgencyPayments(a);
    } catch (err) {
      logger.error(TAG, 'load failed', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [agencyProfile]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const data = tab === 'sent' ? sent : tab === 'received' ? received : agencyPayments;

  const renderRow = ({ item }: { item: PaymentTransaction }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => navigation.navigate('PaymentDetail', { transactionId: item.transactionId })}>
      <View style={{ flex: 1 }}>
        <Text style={styles.amount}>Rs. {item.amount.toLocaleString()}</Text>
        <Text style={styles.meta}>
          Job {item.jobId.slice(0, 8)}…  ·  {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.method}>{labelFor(item.paymentMethod)}</Text>
      </View>
      <View style={[styles.chip, { backgroundColor: STATUS_COLORS[item.status] }]}>
        <Text style={styles.chipText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TabButton label="Sent" active={tab === 'sent'} onPress={() => setTab('sent')} />
        <TabButton label="Received" active={tab === 'received'} onPress={() => setTab('received')} />
        {agencyProfile && (
          <TabButton label="Agency" active={tab === 'agency'} onPress={() => setTab('agency')} />
        )}
      </View>
      {loading && data.length === 0
        ? <ActivityIndicator style={{ marginTop: 32 }} />
        : <FlatList
            data={data}
            keyExtractor={i => i.transactionId}
            renderItem={renderRow}
            contentContainerStyle={data.length === 0 ? styles.emptyContainer : { padding: 16 }}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {tab === 'sent'
                  ? 'No payments yet.'
                  : tab === 'received'
                    ? 'No payments received yet.'
                    : 'No payments to your agency yet.'}
              </Text>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); load(); }}
              />
            }
          />}
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function labelFor(m: string) {
  if (m === 'MOCK_CARD') return 'Mock Card';
  if (m === 'MOCK_BANK') return 'Mock Bank';
  if (m === 'MOCK_WALLET') return 'Mock Wallet';
  return m;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderColor: colors.primary },
  tabText: { fontSize: 15, color: colors.mutedForeground },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    padding: 14, marginBottom: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
  },
  amount: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  meta: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  method: { fontSize: 12, color: colors.gray400, marginTop: 2 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  chipText: { color: colors.white, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  empty: { color: colors.mutedForeground, fontSize: 15, textAlign: 'center' },
});
