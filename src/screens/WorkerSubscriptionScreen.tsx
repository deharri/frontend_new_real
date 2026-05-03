import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWorker } from '../context/WorkerContext';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';
import { logger } from '../utils/logger';

const TAG = 'WorkerSubscription';

type PaymentMethodType = 'CARD' | 'BANK' | 'WALLET';

const SUBSCRIPTION_AMOUNT = 999;
const PLAN_FEATURES = [
  'Accept unlimited job requests',
  'Appear in worker search results',
  'Receive bids from consumers',
  'Access your worker dashboard',
  'Build your portfolio & ratings',
  'Chat with clients directly',
];

export function WorkerSubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { activateSubscription, switchToWorkerMode } = useWorker();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('CARD');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [processing, setProcessing] = useState(false);

  const formatCardNumber = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const isFormValid = () => {
    if (selectedMethod === 'CARD') {
      return (
        cardNumber.replace(/\s/g, '').length === 16 &&
        cardExpiry.length === 5 &&
        cardCvv.length >= 3 &&
        cardName.trim().length > 0
      );
    }
    return true;
  };

  const handlePayNow = async () => {
    if (!isFormValid()) {
      Alert.alert('Incomplete Details', 'Please fill in all payment details to proceed.');
      return;
    }

    setProcessing(true);
    logger.info(TAG, 'Processing subscription payment...');

    try {
      const methodMap = {
        CARD: 'MOCK_CARD' as const,
        BANK: 'MOCK_BANK' as const,
        WALLET: 'MOCK_WALLET' as const,
      };
      const backendMethod = methodMap[selectedMethod];
      const maskedDetails = selectedMethod === 'CARD' && cardNumber
        ? `**** **** **** ${cardNumber.replace(/\s/g, '').slice(-4)}`
        : undefined;

      await activateSubscription(backendMethod, maskedDetails);
      switchToWorkerMode();
      logger.info(TAG, 'Subscription activated successfully');
      navigation.reset({ index: 0, routes: [{ name: 'WorkerTabs' }] });
    } catch (error) {
      logger.error(TAG, 'Subscription activation failed', error);
      Alert.alert('Payment Failed', (error as any)?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.slate700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Subscription</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Plan Card */}
        <View style={styles.planCard}>
          <View style={styles.planBadge}>
            <Ionicons name="star" size={14} color={colors.white} />
            <Text style={styles.planBadgeText}>MONTHLY PLAN</Text>
          </View>
          <View style={styles.planPriceRow}>
            <Text style={styles.planCurrency}>Rs.</Text>
            <Text style={styles.planAmount}>{SUBSCRIPTION_AMOUNT}</Text>
            <Text style={styles.planPeriod}>/month</Text>
          </View>
          <Text style={styles.planSubtitle}>Unlock your full worker profile and start earning</Text>

          <View style={styles.featuresList}>
            {PLAN_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureCheck}>
                  <Ionicons name="checkmark" size={14} color={colors.green700} />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.methodRow}>
            {(['CARD', 'BANK', 'WALLET'] as PaymentMethodType[]).map(method => (
              <TouchableOpacity
                key={method}
                style={[styles.methodChip, selectedMethod === method && styles.methodChipActive]}
                onPress={() => setSelectedMethod(method)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    method === 'CARD' ? 'card' : method === 'BANK' ? 'business' : 'wallet'
                  }
                  size={18}
                  color={selectedMethod === method ? colors.primary : colors.slate500}
                />
                <Text
                  style={[
                    styles.methodLabel,
                    selectedMethod === method && styles.methodLabelActive,
                  ]}
                >
                  {method === 'CARD' ? 'Card' : method === 'BANK' ? 'Bank' : 'Wallet'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Card Form */}
        {selectedMethod === 'CARD' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Card Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card-outline" size={18} color={colors.slate400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor={colors.slate400}
                  value={cardNumber}
                  onChangeText={t => setCardNumber(formatCardNumber(t))}
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Expiry</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor={colors.slate400}
                    value={cardExpiry}
                    onChangeText={t => setCardExpiry(formatExpiry(t))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="•••"
                    placeholderTextColor={colors.slate400}
                    value={cardCvv}
                    onChangeText={t => setCardCvv(t.replace(/\D/g, '').slice(0, 4))}
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={4}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name on Card</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={colors.slate400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor={colors.slate400}
                  value={cardName}
                  onChangeText={setCardName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>
        )}

        {/* Bank / Wallet placeholder */}
        {selectedMethod !== 'CARD' && (
          <View style={styles.section}>
            <View style={styles.mockMethodNotice}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.mockMethodText}>
                {selectedMethod === 'BANK'
                  ? 'Bank transfer will be processed via your registered account.'
                  : 'Wallet balance will be deducted from your Deharri wallet.'}
              </Text>
            </View>
          </View>
        )}

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monthly subscription</Text>
            <Text style={styles.summaryValue}>Rs. {SUBSCRIPTION_AMOUNT}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Valid for</Text>
            <Text style={styles.summaryValue}>30 days</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total</Text>
            <Text style={styles.summaryTotalValue}>Rs. {SUBSCRIPTION_AMOUNT}</Text>
          </View>
        </View>

        {/* Secure badge */}
        <View style={styles.secureBadge}>
          <Ionicons name="lock-closed" size={14} color={colors.slate500} />
          <Text style={styles.secureText}>Payments are processed securely</Text>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.payButton, (!isFormValid() || processing) && styles.payButtonDisabled]}
          onPress={handlePayNow}
          activeOpacity={0.8}
          disabled={processing}
        >
          {processing ? (
            <View style={styles.payButtonContent}>
              <ActivityIndicator size="small" color={colors.white} />
              <Text style={styles.payButtonText}>Processing...</Text>
            </View>
          ) : (
            <View style={styles.payButtonContent}>
              <Ionicons name="lock-closed" size={16} color={colors.white} />
              <Text style={styles.payButtonText}>Pay Rs. {SUBSCRIPTION_AMOUNT}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: colors.slate900,
  },
  headerRight: {
    width: 36,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  planCard: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
    gap: 5,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  planCurrency: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 6,
    marginRight: 2,
  },
  planAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 52,
  },
  planPeriod: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 8,
    marginLeft: 4,
  },
  planSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 20,
  },
  featuresList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 14,
    color: colors.white,
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate700,
    marginBottom: 12,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  methodChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.slate200,
  },
  methodChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.blue50,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.slate500,
  },
  methodLabelActive: {
    color: colors.primary,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.slate600,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate200,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.slate900,
  },
  inputRow: {
    flexDirection: 'row',
  },
  mockMethodNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.blue50,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.blue100,
  },
  mockMethodText: {
    flex: 1,
    fontSize: 13,
    color: colors.slate600,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.slate500,
  },
  summaryValue: {
    fontSize: 14,
    color: colors.slate700,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.slate200,
    marginVertical: 8,
  },
  summaryTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slate900,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  secureText: {
    fontSize: 12,
    color: colors.slate500,
  },
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
  },
  payButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    backgroundColor: colors.slate300,
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
