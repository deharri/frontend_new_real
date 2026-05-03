import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { agencySubscriptionApi } from '../api/agencySubscriptionApi';
import { useAgency } from '../context/AgencyContext';
import { RootStackParamList, MockPaymentMethod } from '../types';
import { colors } from '../theme/colors';

const METHODS: MockPaymentMethod[] = ['MOCK_CARD', 'MOCK_BANK', 'MOCK_WALLET'];

const labelFor = (m: MockPaymentMethod) => {
  switch (m) {
    case 'MOCK_CARD': return 'Card';
    case 'MOCK_BANK': return 'Bank';
    case 'MOCK_WALLET': return 'Wallet';
  }
};

export function AgencySubscriptionPaymentScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'AgencySubscriptionPayment'>>();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { refreshAgency } = useAgency();
  const { agencyId } = route.params;

  const [method, setMethod] = useState<MockPaymentMethod>('MOCK_CARD');
  const [accountNo, setAccountNo] = useState('');
  const [paying, setPaying] = useState(false);

  const masked =
    accountNo.length >= 4
      ? `**** **** **** ${accountNo.slice(-4)}`
      : '**** **** **** ****';

  const pay = async () => {
    if (accountNo.length < 4) {
      Alert.alert('Enter at least 4 digits');
      return;
    }
    setPaying(true);
    try {
      await agencySubscriptionApi.pay({
        agencyId,
        paymentMethod: method,
        maskedDetails: masked,
      });
      await refreshAgency();
      Alert.alert('Success', 'Agency activated for 30 days', [
        {
          text: 'Open Dashboard',
          onPress: () =>
            nav.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'AgencyDashboard' }],
              }),
            ),
        },
      ]);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e.message ?? 'Payment failed';
      Alert.alert('Payment failed', String(msg));
    } finally {
      setPaying(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Agency Subscription</Text>
      <View style={styles.amountBox}>
        <Text style={styles.amountLabel}>Amount</Text>
        <Text style={styles.amount}>Rs. 10,000</Text>
        <Text style={styles.period}>for 30 days</Text>
      </View>

      <Text style={styles.label}>Payment method</Text>
      <View style={styles.row}>
        {METHODS.map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setMethod(m)}
            style={[styles.chip, method === m && styles.chipActive]}>
            <Text style={method === m ? styles.chipTextActive : styles.chipText}>
              {labelFor(m)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>
        {method === 'MOCK_CARD' ? 'Card number' : method === 'MOCK_BANK' ? 'Account number' : 'Wallet ID'}
      </Text>
      <TextInput
        style={styles.input}
        value={accountNo}
        onChangeText={setAccountNo}
        keyboardType="number-pad"
        placeholder="Enter at least last 4 digits"
        maxLength={20}
      />
      <Text style={styles.note}>Will be stored as: {masked}</Text>

      <TouchableOpacity
        style={[styles.btn, paying && styles.btnDisabled]}
        onPress={pay}
        disabled={paying}>
        {paying ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.btnText}>Pay Rs. 10,000</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Payments are mocked for development purposes. No real money is charged.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground },
  amountBox: {
    marginTop: 16,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountLabel: { color: colors.mutedForeground, fontSize: 12 },
  amount: { fontSize: 32, color: colors.primary, fontWeight: '700', marginVertical: 4 },
  period: { color: colors.mutedForeground },
  label: { marginTop: 20, marginBottom: 8, fontWeight: '600', color: colors.foreground },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.foreground },
  chipTextActive: { color: 'white', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.card,
    color: colors.foreground,
  },
  note: { color: colors.mutedForeground, marginTop: 6, fontSize: 12 },
  btn: {
    marginTop: 28,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: colors.primaryLighter },
  btnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  disclaimer: {
    marginTop: 20,
    color: colors.mutedForeground,
    fontSize: 11,
    textAlign: 'center',
  },
});
