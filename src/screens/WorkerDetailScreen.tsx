import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { workersApi } from '../api/workers';
import { chatApi } from '../api/chat';
import { jobsApi } from '../api/jobs';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import { RootStackParamList, WorkerProfile, RatingSummary } from '../types';

const TAG = 'WorkerDetail';

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

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WorkerDetail'>;
  route: RouteProp<RootStackParamList, 'WorkerDetail'>;
};

export function WorkerDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { workerId } = route.params;
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);

  useEffect(() => {
    fetchWorker();
  }, [workerId]);

  const fetchWorker = async () => {
    try {
      logger.info(TAG, `Fetching worker: ${workerId}`);
      const response = await workersApi.getWorkerById(workerId);
      setWorker(response.data);
      logger.info(TAG, 'Worker fetched', response.data);

      // Fetch rating summary from job service
      try {
        const summaryRes = await jobsApi.getWorkerRatingSummary(response.data.workerId);
        setRatingSummary(summaryRes.data);
      } catch {
        // May not have any reviews yet
      }
    } catch (error: any) {
      if ((error as any)?.response?.status === 403) {
        setSubscriptionRequired(true);
        return;
      }
      logger.error(TAG, 'Failed to fetch worker', error.message);
      Alert.alert('Error', 'Failed to load worker profile');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (subscriptionRequired) {
    return (
      <View style={[styles.lockedContainer, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.lockedBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.slate700} />
        </TouchableOpacity>
        <View style={styles.lockedContent}>
          <Ionicons name="lock-closed" size={56} color={colors.slate300} />
          <Text style={styles.lockedTitle}>Profile Unavailable</Text>
          <Text style={styles.lockedText}>
            This worker has not activated their subscription and is currently unavailable for hire.
          </Text>
          <TouchableOpacity style={styles.lockedBackBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.lockedBackBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!worker) return null;

  const isOwnProfile = worker.userId === user?.userId;
  const isAvailable = worker.availabilityStatus === 'AVAILABLE';
  const fullStars = Math.floor(worker.averageRating || 0);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Profile</Text>
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
          <Ionicons name="location" size={18} color={colors.primary} />
          <Text style={styles.detailText}>
            {worker.city?.replace('_', ' ')}{worker.area ? `, ${worker.area}` : ''}
          </Text>
        </View>
        {worker.serviceCities?.length > 0 && (
          <View style={[styles.detailRow, { marginTop: 8 }]}>
            <Ionicons name="navigate" size={18} color={colors.primary} />
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

      {/* Agency */}
      {worker.agency && (
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Agency</Text>
          <View style={styles.detailRow}>
            <Ionicons name="business" size={18} color={colors.amber600} />
            <Text style={styles.detailText}>{worker.agency.agencyName} — {worker.agency.city?.replace('_', ' ')}</Text>
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
        {!isOwnProfile && (
          <TouchableOpacity
            style={styles.chatButton}
            activeOpacity={0.7}
            onPress={async () => {
              try {
                // Backend returns existing conversation if one already exists
                const res = await chatApi.createConversation({
                  senderContext: 'CONSUMER',
                  targetContext: 'WORKER',
                  targetUserId: worker.userId,
                  type: 'DIRECT',
                });
                navigation.navigate('ChatDetail', {
                  conversationId: res.data.id,
                  participantName: `${worker.firstName} ${worker.lastName}`,
                  participantAvatar: worker.profilePictureUrl,
                });
              } catch (err: any) {
                Alert.alert('Error', 'Could not start conversation.');
              }
            }}
          >
            <Ionicons name="chatbubble" size={20} color={colors.white} />
            <Text style={styles.chatButtonText}>Message</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Rating Breakdown */}
      {ratingSummary && ratingSummary.totalReviews > 0 && (
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Ratings ({ratingSummary.totalReviews} review{ratingSummary.totalReviews !== 1 ? 's' : ''})</Text>
          <View style={styles.ratingSummaryRow}>
            <Text style={styles.ratingBig}>{ratingSummary.averageRating.toFixed(1)}</Text>
            <View style={{ gap: 4, flex: 1 }}>
              {ratingSummary.averageQualityRating > 0 && (
                <RatingBar label="Quality" value={ratingSummary.averageQualityRating} />
              )}
              {ratingSummary.averagePunctualityRating > 0 && (
                <RatingBar label="Punctuality" value={ratingSummary.averagePunctualityRating} />
              )}
              {ratingSummary.averageCommunicationRating > 0 && (
                <RatingBar label="Communication" value={ratingSummary.averageCommunicationRating} />
              )}
              {ratingSummary.averageValueRating > 0 && (
                <RatingBar label="Value" value={ratingSummary.averageValueRating} />
              )}
            </View>
          </View>
        </View>
      )}

      {/* Verification — only visible to the worker themselves */}
      {isOwnProfile && (
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
      )}
    </ScrollView>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.ratingBarRow}>
      <Text style={styles.ratingBarLabel}>{label}</Text>
      <View style={styles.ratingBarTrack}>
        <View style={[styles.ratingBarFill, { width: `${(value / 5) * 100}%` }]} />
      </View>
      <Text style={styles.ratingBarValue}>{value.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate50 },
  scrollContent: { paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.slate50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.white },
  profileCard: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700', color: colors.primary },
  name: { fontSize: 22, fontWeight: '700', color: colors.white, marginBottom: 4 },
  workerType: { fontSize: 15, color: 'rgba(191,219,254,1)', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  ratingText: { color: colors.white, fontWeight: '600', fontSize: 15, marginLeft: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  statusAvailable: { backgroundColor: colors.green50 },
  statusBusy: { backgroundColor: colors.red50 },
  statusText: { fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, padding: 16 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.slate200 },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.slate900, marginBottom: 2 },
  statLabel: { fontSize: 12, color: colors.slate500 },
  infoSection: { backgroundColor: colors.white, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.slate200 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: colors.slate500, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  bioText: { fontSize: 15, color: colors.slate700, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: colors.blue50, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.blue200 },
  tagText: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailText: { fontSize: 15, color: colors.slate700, flex: 1 },
  pricingCard: { backgroundColor: colors.white, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.slate200 },
  pricingTitle: { fontSize: 14, fontWeight: '600', color: colors.slate500, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  priceRow: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  priceItem: { flex: 1, backgroundColor: colors.slate50, padding: 14, borderRadius: 10, alignItems: 'center' },
  priceValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  priceLabel: { fontSize: 13, color: colors.slate500, marginTop: 2 },
  chatButton: { backgroundColor: colors.primary, borderRadius: 12, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  chatButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  ratingSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ratingBig: { fontSize: 36, fontWeight: '700', color: colors.amber600 },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingBarLabel: { fontSize: 12, color: colors.slate500, width: 90 },
  ratingBarTrack: { flex: 1, height: 6, backgroundColor: colors.slate200, borderRadius: 3, overflow: 'hidden' },
  ratingBarFill: { height: 6, backgroundColor: colors.amber400, borderRadius: 3 },
  ratingBarValue: { fontSize: 12, fontWeight: '600', color: colors.slate700, width: 24, textAlign: 'right' },
  lockedContainer: {
    flex: 1,
    backgroundColor: colors.slate50,
  },
  lockedBack: {
    margin: 16,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  lockedContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: -60,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.slate700,
    marginTop: 20,
    marginBottom: 10,
  },
  lockedText: {
    fontSize: 14,
    color: colors.slate500,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  lockedBackBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  lockedBackBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});
