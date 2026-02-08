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
import { workersApi } from '../api/workers';
import { useWorker } from '../context/WorkerContext';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import { RootStackParamList, PakistanCity, Language } from '../types';

const TAG = 'EditWorkerProfile';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditWorkerProfile'>;
};

const cities: PakistanCity[] = [
  'ISLAMABAD', 'RAWALPINDI', 'LAHORE', 'KARACHI', 'FAISALABAD',
  'MULTAN', 'PESHAWAR', 'QUETTA', 'SIALKOT', 'GUJRANWALA',
];

const languagesList: Language[] = ['URDU', 'ENGLISH', 'PUNJABI', 'SINDHI', 'PASHTO', 'BALOCHI', 'SARAIKI'];

export function EditWorkerProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { workerProfile, fetchWorkerProfile } = useWorker();

  const [skills, setSkills] = useState<string[]>(workerProfile?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [bio, setBio] = useState(workerProfile?.bio || '');
  const [experienceYears, setExperienceYears] = useState(
    workerProfile?.experienceYears ? String(workerProfile.experienceYears) : ''
  );
  const [hourlyRate, setHourlyRate] = useState(
    workerProfile?.hourlyRate ? String(workerProfile.hourlyRate) : ''
  );
  const [dailyRate, setDailyRate] = useState(
    workerProfile?.dailyRate ? String(workerProfile.dailyRate) : ''
  );
  const [selectedCity, setSelectedCity] = useState<PakistanCity | null>(workerProfile?.city || null);
  const [area, setArea] = useState(workerProfile?.area || '');
  const [selectedServiceCities, setSelectedServiceCities] = useState<PakistanCity[]>(
    workerProfile?.serviceCities || []
  );
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>(
    workerProfile?.languages || []
  );
  const [loading, setLoading] = useState(false);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const toggleServiceCity = (city: PakistanCity) => {
    setSelectedServiceCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const toggleLanguage = (lang: Language) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const extractErrorMessage = (error: any): string => {
    const data = error.response?.data;
    if (data?.errors) {
      const fieldErrors = Object.values(data.errors).join('\n');
      return fieldErrors || data.message || 'Validation failed';
    }
    return data?.message || error.message || 'Something went wrong';
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      logger.info(TAG, 'Updating worker profile...');
      await workersApi.updateMyWorkerProfile({
        skills: skills.length > 0 ? skills : undefined,
        bio: bio.trim() || undefined,
        experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
        hourlyRate: hourlyRate ? parseInt(hourlyRate) : undefined,
        dailyRate: dailyRate ? parseInt(dailyRate) : undefined,
        city: selectedCity || undefined,
        area: area.trim() || undefined,
        serviceCities: selectedServiceCities.length > 0 ? selectedServiceCities : undefined,
        languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
      });
      logger.info(TAG, 'Worker profile updated');
      await fetchWorkerProfile();
      Alert.alert('Success', 'Worker profile updated!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      const msg = extractErrorMessage(error);
      logger.error(TAG, 'Failed to update worker profile', msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={{ paddingTop: insets.top }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.slate900} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Worker Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.blue50 }]}>
              <Ionicons name="star" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Skills</Text>
          </View>
          <View style={styles.skillInputRow}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <TextInput
                style={styles.input}
                placeholder="Add a skill..."
                placeholderTextColor={colors.gray400}
                value={skillInput}
                onChangeText={setSkillInput}
                onSubmitEditing={addSkill}
                returnKeyType="done"
              />
            </View>
            <TouchableOpacity style={styles.addButton} onPress={addSkill}>
              <Ionicons name="add" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>
          {skills.length > 0 && (
            <View style={styles.tagsRow}>
              {skills.map(skill => (
                <TouchableOpacity key={skill} style={styles.skillTag} onPress={() => removeSkill(skill)}>
                  <Text style={styles.skillTagText}>{skill}</Text>
                  <Ionicons name="close" size={14} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.purple100 }]}>
              <Ionicons name="document-text" size={18} color={colors.purple600} />
            </View>
            <Text style={styles.sectionTitle}>Bio</Text>
          </View>
          <View style={[styles.inputContainer, { height: 80, alignItems: 'flex-start', paddingTop: 10 }]}>
            <TextInput
              style={[styles.input, { textAlignVertical: 'top' }]}
              placeholder="Tell clients about your experience..."
              placeholderTextColor={colors.gray400}
              value={bio}
              onChangeText={setBio}
              multiline
            />
          </View>
        </View>

        {/* Rates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.green100 }]}>
              <Ionicons name="cash" size={18} color={colors.green600} />
            </View>
            <Text style={styles.sectionTitle}>Rates</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Experience (years)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g. 5"
                placeholderTextColor={colors.gray400}
                value={experienceYears}
                onChangeText={setExperienceYears}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <View style={styles.rateRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Hourly Rate (Rs.)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 500"
                  placeholderTextColor={colors.gray400}
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Daily Rate (Rs.)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 3000"
                  placeholderTextColor={colors.gray400}
                  value={dailyRate}
                  onChangeText={setDailyRate}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.red50 }]}>
              <Ionicons name="location" size={18} color={colors.red600} />
            </View>
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <Text style={styles.label}>City</Text>
          <View style={styles.chipGrid}>
            {cities.map(city => (
              <TouchableOpacity
                key={city}
                style={[styles.chip, selectedCity === city && styles.chipSelected]}
                onPress={() => setSelectedCity(selectedCity === city ? null : city)}
              >
                <Text style={[styles.chipText, selectedCity === city && styles.chipTextSelected]}>
                  {city.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text style={styles.label}>Area</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g. F-8, DHA Phase 5"
                placeholderTextColor={colors.gray400}
                value={area}
                onChangeText={setArea}
              />
            </View>
          </View>
          <Text style={[styles.label, { marginTop: 8 }]}>Service Cities</Text>
          <View style={styles.chipGrid}>
            {cities.map(city => (
              <TouchableOpacity
                key={`svc-${city}`}
                style={[styles.chip, selectedServiceCities.includes(city) && styles.chipSelected]}
                onPress={() => toggleServiceCity(city)}
              >
                <Text style={[styles.chipText, selectedServiceCities.includes(city) && styles.chipTextSelected]}>
                  {city.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Languages */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.purple100 }]}>
              <Ionicons name="language" size={18} color={colors.purple600} />
            </View>
            <Text style={styles.sectionTitle}>Languages</Text>
          </View>
          <View style={styles.chipGrid}>
            {languagesList.map(lang => (
              <TouchableOpacity
                key={lang}
                style={[styles.chip, selectedLanguages.includes(lang) && styles.chipSelectedPurple]}
                onPress={() => toggleLanguage(lang)}
              >
                <Text style={[styles.chipText, selectedLanguages.includes(lang) && styles.chipTextSelectedPurple]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveButton, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate50 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.slate200,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.slate900 },
  section: {
    backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: colors.slate200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.slate900 },
  skillInputRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  addButton: {
    width: 46, height: 46, borderRadius: 10, backgroundColor: colors.green600,
    alignItems: 'center', justifyContent: 'center',
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.blue50, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: colors.blue200,
  },
  skillTagText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '500', color: colors.slate700, marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, backgroundColor: colors.inputBackground, paddingHorizontal: 12, height: 46,
  },
  input: { flex: 1, fontSize: 15, color: colors.foreground },
  rateRow: { flexDirection: 'row', gap: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50,
  },
  chipSelected: { borderColor: colors.green600, backgroundColor: colors.green50 },
  chipSelectedPurple: { borderColor: colors.purple600, backgroundColor: colors.purple50 },
  chipText: { fontSize: 13, color: colors.slate600 },
  chipTextSelected: { color: colors.green700, fontWeight: '600' },
  chipTextSelectedPurple: { color: colors.purple600, fontWeight: '600' },
  saveButton: {
    backgroundColor: colors.primary, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  saveButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
