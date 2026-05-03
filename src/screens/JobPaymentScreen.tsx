import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { paymentsApi } from '../api/payments';
import { jobsApi } from '../api/jobs';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import type { PaymentMethod, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'JobPayment'>;
type Rt = RouteProp<RootStackParamList, 'JobPayment'>;

const TAG = 'JobPaymentScreen';
const METHODS: { key: PaymentMethod; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'MOCK_CARD',   label: 'Mock Card',   icon: 'card-outline' },
  { key: 'MOCK_BANK',   label: 'Mock Bank',   icon: 'business-outline' },
  { key: 'MOCK_WALLET', label: 'Mock Wallet', icon: 'wallet-outline' },
];

export default function JobPaymentScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { jobId, bidId, workerId, agencyId, recipientName, amount } = params;
  const isAgencyPayment = !!agencyId;

  const [method, setMethod] = useState<PaymentMethod>('MOCK_CARD');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePay = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const tx = await paymentsApi.initiatePayment({
        jobId, workerId, agencyId, amount, paymentMethod: method,
        notes: notes.trim() || undefined,
      });
      logger.info(TAG, 'Payment initiated', tx);

      try {
        await jobsApi.acceptBid(bidId);
      } catch (acceptErr) {
        logger.error(TAG, 'Bid accept failed after payment held', acceptErr);
        Alert.alert(
          'Payment held but bid acceptance failed',
          'Your payment is in escrow. You can refund it from the Payments screen.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        return;
      }

      Alert.alert('Payment held in escrow', 'The worker has been notified.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      logger.error(TAG, 'Pay failed', err);
      const msg = err?.response?.data?.message ?? err?.message ?? 'Payment failed';
      Alert.alert('Payment failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Confirm payment</Text>

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Paying {isAgencyPayment ? 'agency' : 'worker'}</Text>
          <Text style={styles.summaryWorker}>{recipientName}</Text>
          <Text style={styles.summaryLabel}>Amount</Text>
          <Text style={styles.summaryAmount}>Rs. {amount.toLocaleString()}</Text>
          {isAgencyPayment && (
            <Text style={styles.summaryNote}>
              The agency receives this payment. They will pay the dispatched worker per their internal arrangement.
            </Text>
          )}
        </View>

        <Text style={styles.section}>Payment method</Text>
        {METHODS.map(m => {
          const active = method === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              style={[styles.method, active && styles.methodActive]}
              onPress={() => setMethod(m.key)}>
              <Ionicons name={m.icon} size={22} color={active ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.methodLabel, active && styles.methodLabelActive]}>{m.label}</Text>
              {active && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}

        <Text style={styles.section}>Notes (optional)</Text>
        <TextInput
          style={styles.notes}
          multiline
          numberOfLines={3}
          maxLength={200}
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything the worker should know"
          placeholderTextColor={colors.gray400}
        />

        <TouchableOpacity
          style={[styles.payBtn, submitting && styles.payBtnDisabled]}
          onPress={handlePay}
          disabled={submitting}>
          {submitting
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.payBtnText}>Pay Rs. {amount.toLocaleString()}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} disabled={submitting}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 16 },
  summary: { backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  summaryLabel: { color: colors.mutedForeground, fontSize: 12, marginTop: 8 },
  summaryWorker: { color: colors.foreground, fontSize: 18, fontWeight: '600' },
  summaryAmount: { color: colors.primary, fontSize: 28, fontWeight: '700' },
  summaryNote: { color: colors.mutedForeground, fontSize: 12, marginTop: 10, lineHeight: 18 },
  section: { fontSize: 14, fontWeight: '600', color: colors.mutedForeground, marginBottom: 8, marginTop: 8 },
  method: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderWidth: 1, borderColor: colors.border, borderRadius: 10, marginBottom: 8,
    backgroundColor: colors.card,
  },
  methodActive: { borderColor: colors.primary, backgroundColor: colors.blue50 },
  methodLabel: { flex: 1, marginLeft: 12, fontSize: 16, color: colors.foreground },
  methodLabelActive: { fontWeight: '600' },
  notes: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12,
    minHeight: 70, textAlignVertical: 'top', color: colors.foreground, marginBottom: 24,
    backgroundColor: colors.card,
  },
  payBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 10, alignItems: 'center' },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: colors.white, fontSize: 17, fontWeight: '600' },
  cancel: { textAlign: 'center', color: colors.mutedForeground, marginTop: 14, fontSize: 15 },
});
