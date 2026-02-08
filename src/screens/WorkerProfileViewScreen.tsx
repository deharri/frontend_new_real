import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWorker } from '../context/WorkerContext';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';

const workerTypeLabels: Record<string, string> = {
  MECHANIC: 'Mechanic',
  ELECTRICIAN: 'Electrician',
  PLUMBER: 'Plumber',
  CARPENTER: 'Carpenter',
  WELDER: 'Welder',
  PAINTER: 'Painter',
  MASON: 'Mason',
  HVAC_TECHNICIAN: 'AC Technician',
  GENERAL_LABORER: 'General Laborer',
};

export function WorkerProfileViewScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { workerProfile, switchToCustomerMode } = useWorker();

  if (!workerProfile) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.slate400} />
        <Text style={styles.emptyText}>Worker profile not found</Text>
      </View>
    );
  }

  const worker = workerProfile;
  const isAvailable = worker.availabilityStatus === 'AVAILABLE';
  const fullStars = Math.floor(worker.averageRating || 0);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>My Worker Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(worker.firstName?.[0] || '')}{(worker.lastName?.[0] || '')}
          </Text>
        </View>
        <Text style={styles.name}>{worker.firstName} {worker.lastName}</Text>
        <Text style={styles.workerType}>{workerTypeLabels[worker.workerType] || worker.workerType}</Text>

        <View style={styles.ratingRow}>
          {[...Array(5)].map((_, i) => (
            <Ionicons key={i} name="star" size={18} color={i < fullStars ? colors.amber400 : 'rgba(255,255,255,0.3)'} />
          ))}
          <Text style={styles.ratingText}>{(worker.averageRating || 0).toFixed(1)}</Text>
        </View>

        <View style={[styles.statusBadge, isAvailable ? styles.statusAvailable : styles.statusBusy]}>
          <Ionicons name={isAvailable ? 'checkmark-circle' : 'close-circle'} size={16} color={isAvailable ? colors.green700 : colors.red700} />
          <Text style={[styles.statusText, isAvailable ? { color: colors.green700 } : { color: colors.red700 }]}>
            {isAvailable ? 'Available' : worker.availabilityStatus}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{worker.experienceYears || 0}</Text>
          <Text style={styles.statLabel}>Years Exp.</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{worker.totalJobsCompleted || 0}</Text>
          <Text style={styles.statLabel}>Jobs Done</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>Rs. {worker.hourlyRate || 0}</Text>
          <Text style={styles.statLabel}>Per Hour</Text>
        </View>
      </View>

      {/* Bio */}
      {worker.bio ? (
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About</Text>
          <Text style={styles.bioText}>{worker.bio}</Text>
        </View>
      ) : null}

      {/* Skills */}
      {worker.skills?.length > 0 && (
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Skills</Text>
          <View style={styles.tagsRow}>
            {worker.skills.map((skill, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Location */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Location</Text>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={18} color={colors.green600} />
          <Text style={styles.detailText}>
            {worker.city?.replace('_', ' ')}{worker.area ? `, ${worker.area}` : ''}
          </Text>
        </View>
        {worker.serviceCities?.length > 0 && (
          <View style={[styles.detailRow, { marginTop: 8 }]}>
            <Ionicons name="navigate" size={18} color={colors.green600} />
            <Text style={styles.detailText}>
              Serves: {worker.serviceCities.map(c => c.replace('_', ' ')).join(', ')}
            </Text>
          </View>
        )}
      </View>

      {/* Languages */}
      {worker.languages?.length > 0 && (
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Languages</Text>
          <View style={styles.tagsRow}>
            {worker.languages.map((lang, i) => (
              <View key={i} style={[styles.tag, { backgroundColor: colors.purple100 }]}>
                <Text style={[styles.tagText, { color: colors.purple600 }]}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Pricing */}
      <View style={styles.pricingCard}>
        <Text style={styles.pricingTitle}>Pricing</Text>
        <View style={styles.priceRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceValue}>Rs. {worker.hourlyRate || 0}</Text>
            <Text style={styles.priceLabel}>per hour</Text>
          </View>
          {worker.dailyRate ? (
            <View style={styles.priceItem}>
              <Text style={styles.priceValue}>Rs. {worker.dailyRate}</Text>
              <Text style={styles.priceLabel}>per day</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Verification */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Verification</Text>
        <View style={styles.detailRow}>
          <Ionicons
            name={worker.isVerified ? 'shield-checkmark' : 'shield-outline'}
            size={18}
            color={worker.isVerified ? colors.green600 : colors.slate400}
          />
          <Text style={styles.detailText}>
            {worker.isVerified ? 'Verified Worker' : `Status: ${worker.verificationStatus || 'Unverified'}`}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('EditWorkerProfile')}
        >
          <Ionicons name="create-outline" size={18} color={colors.white} />
          <Text style={styles.editButtonText}>Edit Worker Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.switchModeButton}
          activeOpacity={0.7}
          onPress={() => {
            switchToCustomerMode();
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
          }}
        >
          <Ionicons name="swap-horizontal" size={18} color={colors.green600} />
          <Text style={styles.switchModeText}>Switch to Customer Mode</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate50 },
  scrollContent: { paddingBottom: 40 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.slate50 },
  emptyText: { fontSize: 16, color: colors.slate500, marginTop: 12 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.green600, paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.white },
  profileCard: {
    backgroundColor: colors.green600, paddingHorizontal: 16, paddingBottom: 24,
    alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: colors.green600 },
  name: { fontSize: 22, fontWeight: '700', color: colors.white, marginBottom: 4 },
  workerType: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  ratingText: { color: colors.white, fontWeight: '600', fontSize: 15, marginLeft: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  statusAvailable: { backgroundColor: colors.green50 },
  statusBusy: { backgroundColor: colors.red50 },
  statusText: { fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, padding: 16 },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: colors.slate200,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.slate900, marginBottom: 2 },
  statLabel: { fontSize: 12, color: colors.slate500 },
  infoSection: {
    backgroundColor: colors.white, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.slate200,
  },
  infoTitle: { fontSize: 14, fontWeight: '600', color: colors.slate500, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  bioText: { fontSize: 15, color: colors.slate700, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: colors.green50, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.green500 },
  tagText: { fontSize: 13, color: colors.green700, fontWeight: '500' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailText: { fontSize: 15, color: colors.slate700, flex: 1 },
  pricingCard: {
    backgroundColor: colors.white, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.slate200,
  },
  pricingTitle: { fontSize: 14, fontWeight: '600', color: colors.slate500, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  priceRow: { flexDirection: 'row', gap: 16 },
  priceItem: { flex: 1, backgroundColor: colors.slate50, padding: 14, borderRadius: 10, alignItems: 'center' },
  priceValue: { fontSize: 20, fontWeight: '700', color: colors.green600 },
  priceLabel: { fontSize: 13, color: colors.slate500, marginTop: 2 },
  actions: { paddingHorizontal: 16, gap: 12, marginTop: 4 },
  editButton: {
    backgroundColor: colors.green600, borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.green600, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  editButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  switchModeButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, height: 52, borderWidth: 1, borderColor: colors.green500, backgroundColor: colors.white, gap: 8,
  },
  switchModeText: { color: colors.green600, fontSize: 16, fontWeight: '600' },
});
