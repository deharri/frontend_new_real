import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { jobsApi } from '../api/jobs';
import { LocationPickerField } from '../components/LocationPickerField';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import { RootStackParamList, WorkerType, PakistanCity, BudgetType, UrgencyLevel } from '../types';

const TAG = 'CreateJobListing';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateJobListing'>;
};

const workerTypes: { value: WorkerType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { value: 'PLUMBER', label: 'Plumber', icon: 'water', color: '#3b82f6' },
  { value: 'ELECTRICIAN', label: 'Electrician', icon: 'flash', color: '#f59e0b' },
  { value: 'CARPENTER', label: 'Carpenter', icon: 'hammer', color: '#d97706' },
  { value: 'PAINTER', label: 'Painter', icon: 'color-palette', color: '#ec4899' },
  { value: 'MASON', label: 'Mason', icon: 'cube', color: '#8b5cf6' },
  { value: 'WELDER', label: 'Welder', icon: 'flame', color: '#ef4444' },
  { value: 'HVAC_TECHNICIAN', label: 'AC Tech', icon: 'snow', color: '#06b6d4' },
  { value: 'MECHANIC', label: 'Mechanic', icon: 'construct', color: '#64748b' },
  { value: 'GENERAL_LABORER', label: 'General', icon: 'body', color: '#64748b' },
];

const cities: { value: PakistanCity; label: string }[] = [
  { value: 'ISLAMABAD', label: 'Islamabad' },
  { value: 'RAWALPINDI', label: 'Rawalpindi' },
  { value: 'LAHORE', label: 'Lahore' },
  { value: 'KARACHI', label: 'Karachi' },
  { value: 'FAISALABAD', label: 'Faisalabad' },
  { value: 'MULTAN', label: 'Multan' },
  { value: 'PESHAWAR', label: 'Peshawar' },
  { value: 'QUETTA', label: 'Quetta' },
  { value: 'SIALKOT', label: 'Sialkot' },
  { value: 'GUJRANWALA', label: 'Gujranwala' },
];

const budgetTypes: { value: BudgetType; label: string }[] = [
  { value: 'FIXED', label: 'Fixed' },
  { value: 'HOURLY', label: 'Hourly' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'NEGOTIABLE', label: 'Negotiable' },
];

const urgencyLevels: { value: UrgencyLevel; label: string }[] = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'FLEXIBLE', label: 'Flexible' },
];

export function CreateJobListingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<WorkerType | null>(null);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [selectedBudgetType, setSelectedBudgetType] = useState<BudgetType>('FIXED');
  const [selectedCity, setSelectedCity] = useState<PakistanCity | null>(null);
  const [area, setArea] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel>('NORMAL');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Please enter a title');
    if (!description.trim()) return Alert.alert('Error', 'Please enter a description');
    if (!selectedType) return Alert.alert('Error', 'Please select a service type');
    if (!selectedCity) return Alert.alert('Error', 'Please select a city');

    setLoading(true);
    try {
      await jobsApi.createListing({
        title: title.trim(),
        description: description.trim(),
        workerType: selectedType,
        budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
        budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
        budgetType: selectedBudgetType,
        city: selectedCity,
        area: area.trim() || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        urgency: selectedUrgency,
        consumerFirstName: user?.firstName,
        consumerLastName: user?.lastName,
        publishImmediately: true,
      });
      Alert.alert('Success', 'Job listing created!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      logger.error(TAG, 'Failed to create listing', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.slate900} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post a Job</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Fix leaking kitchen sink"
            placeholderTextColor={colors.slate400}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the work needed..."
            placeholderTextColor={colors.slate400}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Worker Type Grid */}
        <View style={styles.field}>
          <Text style={styles.label}>Service Type *</Text>
          <View style={styles.typeGrid}>
            {workerTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[styles.typeCard, selectedType === type.value && { borderColor: type.color, borderWidth: 2 }]}
                onPress={() => setSelectedType(type.value)}
              >
                <View style={[styles.typeIcon, { backgroundColor: type.color + '15' }]}>
                  <Ionicons name={type.icon} size={22} color={type.color} />
                </View>
                <Text style={[styles.typeLabel, selectedType === type.value && { color: type.color, fontWeight: '700' }]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget */}
        <View style={styles.field}>
          <Text style={styles.label}>Budget (Rs.)</Text>
          <View style={styles.budgetRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Min"
              placeholderTextColor={colors.slate400}
              value={budgetMin}
              onChangeText={setBudgetMin}
              keyboardType="numeric"
            />
            <Text style={styles.budgetDash}>-</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Max"
              placeholderTextColor={colors.slate400}
              value={budgetMax}
              onChangeText={setBudgetMax}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.chipRow}>
            {budgetTypes.map((bt) => (
              <TouchableOpacity
                key={bt.value}
                style={[styles.chip, selectedBudgetType === bt.value && styles.chipActive]}
                onPress={() => setSelectedBudgetType(bt.value)}
              >
                <Text style={[styles.chipText, selectedBudgetType === bt.value && styles.chipTextActive]}>{bt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* City */}
        <View style={styles.field}>
          <Text style={styles.label}>City *</Text>
          <View style={styles.chipRow}>
            {cities.map((city) => (
              <TouchableOpacity
                key={city.value}
                style={[styles.chip, selectedCity === city.value && styles.chipActive]}
                onPress={() => setSelectedCity(city.value)}
              >
                <Text style={[styles.chipText, selectedCity === city.value && styles.chipTextActive]}>{city.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Area + map picker */}
        <View style={styles.field}>
          <LocationPickerField
            label="Area / Address"
            placeholder="e.g. DHA Phase 5, Block A"
            addressText={area}
            onAddressTextChange={setArea}
            latitude={latitude}
            longitude={longitude}
            onLocationPicked={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
            onLocationCleared={() => { setLatitude(null); setLongitude(null); }}
          />
        </View>

        {/* Urgency */}
        <View style={styles.field}>
          <Text style={styles.label}>Urgency</Text>
          <View style={styles.chipRow}>
            {urgencyLevels.map((u) => (
              <TouchableOpacity
                key={u.value}
                style={[styles.chip, selectedUrgency === u.value && styles.chipActive]}
                onPress={() => setSelectedUrgency(u.value)}
              >
                <Text style={[styles.chipText, selectedUrgency === u.value && styles.chipTextActive]}>{u.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="add-circle" size={22} color={colors.white} />
              <Text style={styles.submitText}>Post Job</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate50 },
  scrollContent: { padding: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.slate200,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.slate900 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.slate700, marginBottom: 8 },
  input: {
    backgroundColor: colors.white, borderRadius: 12, paddingHorizontal: 14, height: 48,
    fontSize: 15, color: colors.foreground, borderWidth: 1, borderColor: colors.slate200,
  },
  textArea: { height: 100, paddingTop: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: {
    width: '30%', backgroundColor: colors.white, borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: colors.slate200,
  },
  typeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  typeLabel: { fontSize: 12, fontWeight: '500', color: colors.slate600, textAlign: 'center' },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  budgetDash: { fontSize: 16, color: colors.slate400 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate200,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.slate600 },
  chipTextActive: { color: colors.white },
  submitButton: {
    backgroundColor: colors.primary, borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
