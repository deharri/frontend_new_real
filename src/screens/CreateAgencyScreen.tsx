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
import { LocationPickerField } from '../components/LocationPickerField';

const CITY_OPTIONS: PakistanCity[] = [
  'KARACHI', 'LAHORE', 'ISLAMABAD', 'RAWALPINDI', 'FAISALABAD',
  'MULTAN', 'PESHAWAR', 'QUETTA', 'SIALKOT', 'GUJRANWALA',
];

export function CreateAgencyScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // latitude/longitude split out from the form so we can render the picker
  // without the type ever being CreateAgency-with-null. They get folded back
  // into the payload at submit time, after validation guarantees they're set.
  const [form, setForm] = useState<Omit<CreateAgency, 'latitude' | 'longitude' | 'address'>>({
    agencyName: '',
    description: '',
    contactNumber: '',
    contactEmail: '',
    city: 'KARACHI',
    serviceCities: ['KARACHI'],
    licenseNumber: '',
  });
  // Address is split into building + street so Google Geocoding can find the
  // pin reliably; the backend still receives one composed `address` string.
  const [building, setBuilding] = useState('');
  const [street, setStreet] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
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
    if (!building.trim() || !street.trim()) {
      Alert.alert('Address required', 'Enter both building and street.');
      return;
    }
    if (latitude == null || longitude == null) {
      Alert.alert(
        'Pin your office on the map',
        'Tap "Find on map" or drop a pin so customers can find your office.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const composedAddress = `${building.trim()}, ${street.trim()}`;
      const res = await agenciesApi.createAgency({
        ...form,
        address: composedAddress,
        latitude,
        longitude,
      });
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

      <LocationPickerField
        label="Office address *"
        building={building}
        onBuildingChange={setBuilding}
        street={street}
        onStreetChange={setStreet}
        city={form.city}
        latitude={latitude}
        longitude={longitude}
        onLocationPicked={(lat, lng) => {
          setLatitude(lat);
          setLongitude(lng);
        }}
        onLocationCleared={() => {
          setLatitude(null);
          setLongitude(null);
        }}
      />
      <Text style={styles.helperText}>
        Required — customers will use this pin to find your office on a map.
      </Text>

      <Text style={styles.label}>License number (optional)</Text>
      <TextInput
        style={styles.input}
        value={form.licenseNumber}
        onChangeText={(v) => setForm({ ...form, licenseNumber: v })}
        placeholder="If you have an official business license"
      />

      <TouchableOpacity
        style={[
          styles.btn,
          (submitting || latitude == null || longitude == null) && styles.btnDisabled,
        ]}
        onPress={onSubmit}
        disabled={submitting || latitude == null || longitude == null}>
        <Text style={styles.btnText}>
          {submitting
            ? 'Creating…'
            : latitude == null || longitude == null
              ? 'Pin office on the map first'
              : 'Continue to payment'}
        </Text>
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
  helperText: { fontSize: 11, color: colors.mutedForeground, marginTop: 6 },
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
