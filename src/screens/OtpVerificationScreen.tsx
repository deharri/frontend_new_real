import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import { colors } from '../theme/colors';

const RESEND_COOLDOWN_S = 30;

export function OtpVerificationScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'OtpVerification'>>();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { register } = useAuth();
  const { flow, e164Phone, signupData } = route.params;

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_COOLDOWN_S);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const masked = e164Phone.length >= 4
    ? `+92 *** *** **${e164Phone.slice(-4)}`
    : e164Phone;

  const onResend = async () => {
    setResending(true);
    setError(null);
    try {
      if (flow === 'SIGNUP') {
        await authApi.sendOtp({ phoneNumber: e164Phone });
      } else {
        Alert.alert(
          'Resend not available',
          'Please go back and re-submit your password to send a new code.',
        );
        return;
      }
      setResendCountdown(RESEND_COOLDOWN_S);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not resend code');
    } finally {
      setResending(false);
    }
  };

  const onVerify = async () => {
    if (code.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (flow === 'SIGNUP') {
        if (!signupData) throw new Error('Missing signup data');
        await register({ ...signupData, otpCode: code });
      } else {
        nav.goBack();
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.errors?.otpCode ??
        e?.response?.data?.errors?.error_0 ??
        e?.response?.data?.message ??
        'Verification failed';
      setError(typeof msg === 'string' ? msg : 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons
        name="phone-portrait-outline"
        size={64}
        color={colors.primary}
        style={styles.icon}
      />
      <Text style={styles.title}>Verify your phone</Text>
      <Text style={styles.sub}>Code sent to {masked}</Text>

      <TextInput
        ref={inputRef}
        style={styles.input}
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
        placeholder="------"
        keyboardType="number-pad"
        maxLength={6}
        textContentType="oneTimeCode"
      />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[
          styles.btn,
          (submitting || code.length !== 6) && styles.btnDisabled,
        ]}
        onPress={onVerify}
        disabled={submitting || code.length !== 6}>
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.btnText}>
            {flow === 'SIGNUP' ? 'Verify and create account' : 'Confirm'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.resendRow}>
        <Text style={styles.resendLabel}>Didn't receive a code?</Text>
        <TouchableOpacity
          onPress={onResend}
          disabled={resendCountdown > 0 || resending}>
          <Text
            style={[
              styles.resendBtn,
              (resendCountdown > 0 || resending) && styles.resendBtnDisabled,
            ]}>
            {resending
              ? 'Sending…'
              : resendCountdown > 0
              ? `Resend in ${resendCountdown}s`
              : 'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => nav.goBack()} style={styles.changeBtn}>
        <Text style={styles.changeText}>Change number</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Demo build — code 000000 always works
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, alignItems: 'center' },
  icon: { marginTop: 60, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground },
  sub: { color: colors.mutedForeground, marginTop: 6, marginBottom: 32, textAlign: 'center' },
  input: {
    width: 240,
    fontSize: 28,
    letterSpacing: 8,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: colors.card,
    color: colors.foreground,
  },
  error: { color: colors.destructive, marginTop: 12, textAlign: 'center', paddingHorizontal: 20 },
  btn: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 8,
    minWidth: 240,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: colors.primaryLighter },
  btnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  resendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24 },
  resendLabel: { color: colors.mutedForeground },
  resendBtn: { color: colors.primary, fontWeight: '600' },
  resendBtnDisabled: { color: colors.mutedForeground },
  changeBtn: { marginTop: 16 },
  changeText: { color: colors.mutedForeground, textDecorationLine: 'underline' },
  hint: {
    position: 'absolute',
    bottom: 30,
    color: colors.mutedForeground,
    fontSize: 11,
    fontStyle: 'italic',
  },
});
