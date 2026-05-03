import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { paymentsApi } from '../api/payments';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import type {
  EscrowHold, PaymentTransaction, RootStackParamList,
} from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PaymentDetail'>;
type Rt = RouteProp<RootStackParamList, 'PaymentDetail'>;
const TAG = 'PaymentDetailScreen';

export default function PaymentDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { transactionId } = useRoute<Rt>().params;
  const { user } = useAuth();

  const [tx, setTx] = useState<PaymentTransaction | null>(null);
  const [escrow, setEscrow] = useState<EscrowHold | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, e] = await Promise.all([
        paymentsApi.getTransaction(transactionId),
        paymentsApi.getEscrow(transactionId).catch(() => null),
      ]);
      setTx(t);
      setEscrow(e);
    } catch (err) {
      logger.error(TAG, 'load failed', err);
      Alert.alert('Error', 'Could not load this payment.');
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => { load(); }, [load]);

  const isConsumer = !!tx && !!user && tx.consumerId === user.userId;
  const canAct = !!tx && tx.status === 'HELD' && isConsumer;

  const onRelease = () => {
    Alert.alert('Release to worker?', 'This sends the held funds to the worker.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Release', style: 'default', onPress: doRelease },
    ]);
  };

  const onRefund = () => {
    Alert.alert('Refund to me?', 'This returns the held funds to your account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Refund', style: 'destructive', onPress: doRefund },
    ]);
  };

  const doRelease = async () => {
    if (!tx) return;
    setActing(true);
    try {
      await paymentsApi.releaseEscrow(tx.transactionId, 'JOB_COMPLETED');
      await load();
    } catch (err: any) {
      Alert.alert('Release failed', err?.response?.data?.message ?? 'Try again.');
    } finally { setActing(false); }
  };

  const doRefund = async () => {
    if (!tx) return;
    setActing(true);
    try {
      await paymentsApi.refundEscrow(tx.transactionId);
      await load();
    } catch (err: any) {
      Alert.alert('Refund failed', err?.response?.data?.message ?? 'Try again.');
    } finally { setActing(false); }
  };

  if (loading || !tx) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.amount}>Rs. {tx.amount.toLocaleString()}</Text>
      <Text style={styles.status}>{tx.status}</Text>

      <View style={styles.card}>
        <Row label="Payment method" value={tx.paymentMethod} />
        <Row label="Currency" value={tx.currency} />
        <Row label="Created" value={new Date(tx.createdAt).toLocaleString()} />
        <Row label="Updated" value={new Date(tx.updatedAt).toLocaleString()} />
        {tx.notes ? <Row label="Notes" value={tx.notes} /> : null}
        {tx.failureReason ? <Row label="Failure reason" value={tx.failureReason} /> : null}
      </View>

      {escrow && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Escrow</Text>
          <Row label="Amount held" value={`Rs. ${escrow.heldAmount.toLocaleString()}`} />
          <Row label="Status" value={escrow.holdStatus} />
          {escrow.releaseReason ? <Row label="Release reason" value={escrow.releaseReason} /> : null}
          {escrow.releasedAt ? <Row label="Released at" value={new Date(escrow.releasedAt).toLocaleString()} /> : null}
        </View>
      )}

      <TouchableOpacity
        style={styles.linkBtn}
        onPress={() => navigation.navigate('JobListingDetail', { jobId: tx.jobId })}>
        <Text style={styles.linkBtnText}>Open job</Text>
      </TouchableOpacity>

      {canAct && (
        <View style={styles.safety}>
          <Text style={styles.safetyTitle}>If this looks stuck:</Text>
          <TouchableOpacity style={styles.releaseBtn} onPress={onRelease} disabled={acting}>
            <Text style={styles.releaseBtnText}>Release to worker</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refundBtn} onPress={onRefund} disabled={acting}>
            <Text style={styles.refundBtnText}>Refund to me</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  amount: { fontSize: 30, fontWeight: '700', color: colors.foreground },
  status: { fontSize: 14, color: colors.mutedForeground, marginBottom: 18 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: colors.mutedForeground, fontSize: 13 },
  rowValue: { color: colors.foreground, fontSize: 13, fontWeight: '500' },
  linkBtn: { padding: 14, backgroundColor: colors.primary, borderRadius: 10, alignItems: 'center', marginBottom: 24 },
  linkBtnText: { color: colors.white, fontWeight: '600' },
  safety: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 16 },
  safetyTitle: { fontSize: 13, color: colors.mutedForeground, marginBottom: 10 },
  releaseBtn: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.green600, alignItems: 'center', marginBottom: 8 },
  releaseBtnText: { color: colors.green600, fontWeight: '600' },
  refundBtn: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.red600, alignItems: 'center' },
  refundBtnText: { color: colors.red600, fontWeight: '600' },
});
