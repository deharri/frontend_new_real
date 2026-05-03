import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { agenciesApi } from '../api/agencies';
import { CreateAgency, RootStackParamList, PakistanCity } from '../types';
import { colors } from '../theme/colors';

const CITY_OPTIONS: PakistanCity[] = [
  'KARACHI', 'LAHORE', 'ISLAMABAD', 'RAWALPINDI', 'FAISALABAD',
  'MULTAN', 'PESHAWAR', 'QUETTA', 'SIALKOT', 'GUJRANWALA',
];

export function CreateAgencyScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [form, setForm] = useState<CreateAgency>({
    agencyName: '',
    description: '',
    contactNumber: '',
    contactEmail: '',
    city: 'KARACHI',
    address: '',
    serviceCities: ['KARACHI'],
    licenseNumber: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!form.agencyName.trim()) {
      Alert.alert('Agency name is required');
      return;
    }
    if (!form.contactNumber.trim()) {
      Alert.alert('Contact number is required');
      return;
    }
    if (!form.address.trim()) {
      Alert.alert('Address is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await agenciesApi.createAgency(form);
      const match = res.data.message.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);
      const agencyId = match ? match[1] : null;
      if (!agencyId) {
        throw new Error('Could not extract agency ID from response');
      }
      nav.replace('AgencySubscriptionPayment', { agencyId });
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.response?.data?.errors ?? e.message ?? 'Failed';
      Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Become an Agency</Text>
      <Text style={styles.note}>
        Agency registration is Rs. 10,000 per 30 days. After filling this form you'll be taken to the
        payment screen. Your agency only goes live once payment is received.
      </Text>

      <Text style={styles.label}>Agency name *</Text>
      <TextInput
        style={styles.input}
        value={form.agencyName}
        onChangeText={(v) => setForm({ ...form, agencyName: v })}
        placeholder="e.g. Khan Builders Co."
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        multiline
        value={form.description}
        onChangeText={(v) => setForm({ ...form, description: v })}
        placeholder="What does your agency do?"
      />

      <Text style={styles.label}>Contact number *</Text>
      <TextInput
        style={styles.input}
        value={form.contactNumber}
        onChangeText={(v) => setForm({ ...form, contactNumber: v })}
        keyboardType="phone-pad"
        placeholder="03001234567"
      />

      <Text style={styles.label}>Contact email</Text>
      <TextInput
        style={styles.input}
        value={form.contactEmail}
        onChangeText={(v) => setForm({ ...form, contactEmail: v })}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="agency@example.com"
      />

      <Text style={styles.label}>Base city *</Text>
      <View style={styles.chipRow}>
        {CITY_OPTIONS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setForm({ ...form, city: c })}
            style={[styles.chip, form.city === c && styles.chipActive]}>
            <Text style={form.city === c ? styles.chipTextActive : styles.chipText}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Address *</Text>
      <TextInput
        style={styles.input}
        value={form.address}
        onChangeText={(v) => setForm({ ...form, address: v })}
        placeholder="Street, area, landmark"
      />

      <Text style={styles.label}>License number (optional)</Text>
      <TextInput
        style={styles.input}
        value={form.licenseNumber}
        onChangeText={(v) => setForm({ ...form, licenseNumber: v })}
        placeholder="If you have an official business license"
      />

      <TouchableOpacity
        style={[styles.btn, submitting && styles.btnDisabled]}
        onPress={onSubmit}
        disabled={submitting}>
        <Text style={styles.btnText}>{submitting ? 'Creating…' : 'Continue to payment'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 6 },
  note: { color: colors.mutedForeground, marginBottom: 20, lineHeight: 20 },
  label: { marginTop: 14, marginBottom: 6, fontWeight: '600', color: colors.foreground },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.card,
    color: colors.foreground,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.foreground, fontSize: 12 },
  chipTextActive: { color: 'white', fontSize: 12, fontWeight: '600' },
  btn: {
    marginTop: 28,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: colors.primaryLighter },
  btnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
