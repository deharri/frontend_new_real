import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { useWorker } from '../context/WorkerContext';
import { agenciesApi } from '../api/agencies';
import { ModeSwitchBanner } from '../components/ModeSwitchBanner';
import { jobsApi } from '../api/jobs';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import { RootStackParamList } from '../types';
import { BASE_URL } from '../api/client';

const TAG = 'Profile';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuth();
  const { hasAgency, agencyProfile, isAgencyActive, daysUntilExpiry, isAgencyMode, switchToAgencyMode, switchToCustomerMode: switchToCustomerFromAgency } = useAgency();
  const { workerProfile, fetchWorkerProfile } = useWorker();
  // True iff the user has a worker profile that's currently a member of some agency.
  const isWorkerInAgency = !!workerProfile?.agency;

  const [completedJobs, setCompletedJobs] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchStats = async () => {
        try {
          const res = await jobsApi.getMyListings(0, 100);
          const completed = res.data.listings.filter(l => l.status === 'COMPLETED').length;
          setCompletedJobs(completed);
        } catch {
          // ignore
        }

        if (user?.userId) {
          try {
            const ratingRes = await jobsApi.getConsumerRatingSummary(user.userId);
            setAvgRating(ratingRes.data.averageRating);
          } catch {
            // ignore — no reviews yet
          }
        }
      };
      fetchStats();
    }, [user?.userId])
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logger.info(TAG, 'User logging out');
          logout();
        },
      },
    ]);
  };

  const firstName = user?.firstName || 'User';
  const lastName = user?.lastName || '';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerSection}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account information</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          {user?.profilePictureUrl ? (
            <Image source={{ uri: user.profilePictureUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View>
            <Text style={styles.profileName}>{firstName} {lastName}</Text>
            <Text style={styles.profileSince}>Member</Text>
          </View>
        </View>

        <View style={styles.contactInfo}>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={[styles.contactText, !user?.email && styles.contactPlaceholder]}>
              {user?.email || 'No email added'}
            </Text>
          </View>
          {user?.phoneNumber && (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.contactText}>{user.phoneNumber}</Text>
            </View>
          )}
          <View style={styles.contactRow}>
            <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.contactText}>Pakistan</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.green100 }]}>
            <Ionicons name="calendar" size={24} color={colors.green600} />
          </View>
          <Text style={styles.statValue}>{completedJobs}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.amber100 }]}>
            <Ionicons name="star" size={24} color={colors.amber600} />
          </View>
          <Text style={styles.statValue}>{avgRating != null ? avgRating.toFixed(1) : '-'}</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>

      {/* Worker Mode Switch */}
      <ModeSwitchBanner />

      {/* Agency CTAs */}
      {!hasAgency && !isWorkerInAgency && (
        <TouchableOpacity
          style={agencyStyles.primaryCta}
          onPress={() => navigation.navigate('CreateAgency')}
          activeOpacity={0.8}>
          <Ionicons name="business" size={18} color="white" />
          <Text style={agencyStyles.ctaText}>Become an Agency — Rs. 10,000/mo</Text>
        </TouchableOpacity>
      )}
      {!hasAgency && isWorkerInAgency && (
        <View style={agencyStyles.disabledCta}>
          <Ionicons name="information-circle" size={18} color={colors.mutedForeground} />
          <Text style={agencyStyles.disabledCtaText}>
            You're currently in {workerProfile?.agency?.agencyName}. Leave first to create your own agency.
          </Text>
        </View>
      )}
      {isWorkerInAgency && (
        <TouchableOpacity
          style={agencyStyles.leaveCta}
          onPress={() => {
            Alert.alert(
              'Leave agency?',
              `You will no longer be a member of ${workerProfile?.agency?.agencyName}. Past job records stay intact.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Leave',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await agenciesApi.leaveCurrentAgency();
                      await fetchWorkerProfile();
                      Alert.alert('Left agency', 'You can now join another agency or create your own.');
                    } catch (err: any) {
                      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to leave agency.');
                    }
                  },
                },
              ],
            );
          }}
          activeOpacity={0.8}>
          <Ionicons name="exit-outline" size={18} color="white" />
          <Text style={agencyStyles.ctaText}>
            Leave {workerProfile?.agency?.agencyName ?? 'agency'}
          </Text>
        </TouchableOpacity>
      )}
      {hasAgency && !isAgencyActive && agencyProfile && (
        <TouchableOpacity
          style={agencyStyles.warnCta}
          onPress={() =>
            navigation.navigate('AgencySubscriptionPayment', { agencyId: agencyProfile.agencyId })
          }
          activeOpacity={0.8}>
          <Ionicons name="alert-circle" size={18} color="white" />
          <Text style={agencyStyles.ctaText}>Your agency is expired — renew now</Text>
        </TouchableOpacity>
      )}
      {hasAgency && isAgencyActive && !isAgencyMode && (
        <TouchableOpacity
          style={agencyStyles.primaryCta}
          onPress={() => {
            switchToAgencyMode();
            navigation.reset({ index: 0, routes: [{ name: 'AgencyTabs' }] });
          }}
          activeOpacity={0.8}>
          <Ionicons name="business" size={18} color="white" />
          <Text style={agencyStyles.ctaText}>
            Switch to Agency Mode ({daysUntilExpiry} days left)
          </Text>
        </TouchableOpacity>
      )}
      {hasAgency && isAgencyActive && isAgencyMode && (
        <TouchableOpacity
          style={agencyStyles.primaryCta}
          onPress={() => {
            switchToCustomerFromAgency();
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
          }}
          activeOpacity={0.8}>
          <Ionicons name="person" size={18} color="white" />
          <Text style={agencyStyles.ctaText}>Switch to Customer Mode</Text>
        </TouchableOpacity>
      )}

      {/* Debug Info */}
      <View style={styles.debugCard}>
        <Text style={styles.debugTitle}>API Connection</Text>
        <Text style={styles.debugText}>Base URL: {BASE_URL}</Text>
        <Text style={styles.debugText}>User ID: {user?.userId || 'N/A'}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.7}
          onPress={() => {
            logger.info(TAG, 'Navigating to EditProfile');
            navigation.navigate('EditProfile');
          }}
        >
          <Ionicons name="create-outline" size={18} color={colors.white} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Payments')}>
          <Ionicons name="card-outline" size={18} color={colors.foreground} />
          <Text style={styles.menuButtonText}>Payments</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ResolutionCenter')}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.foreground} />
          <Text style={styles.menuButtonText}>Resolution Center</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color={colors.red600} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate50 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  headerSection: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: colors.slate900, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.slate600 },
  profileCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
  },
  avatarImage: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderColor: colors.white,
  },
  avatarText: { color: colors.primary, fontSize: 28, fontWeight: '700' },
  profileName: { fontSize: 20, fontWeight: '700', color: colors.white, marginBottom: 4 },
  profileSince: { fontSize: 14, color: 'rgba(191, 219, 254, 1)' },
  contactInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, gap: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactText: { fontSize: 14, color: colors.white },
  contactPlaceholder: { fontStyle: 'italic', opacity: 0.6 },
  statsRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 20, alignItems: 'center',
    borderWidth: 1, borderColor: colors.slate200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.slate900, marginBottom: 4 },
  statLabel: { fontSize: 13, color: colors.slate600 },
  debugCard: {
    backgroundColor: '#fef3c7', borderRadius: 12, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: '#fbbf24',
  },
  debugTitle: { fontSize: 13, fontWeight: '700', color: '#92400e', marginBottom: 6 },
  debugText: { fontSize: 12, color: '#92400e', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  actions: { gap: 12 },
  editButton: {
    backgroundColor: colors.primary, borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  editButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, height: 52, borderWidth: 1, borderColor: '#fecaca', backgroundColor: colors.white, gap: 8,
  },
  logoutButtonText: { color: colors.red600, fontSize: 16, fontWeight: '600' },
  menuButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 14, height: 52,
    paddingHorizontal: 16, gap: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  menuButtonText: { flex: 1, color: colors.foreground, fontSize: 15, fontWeight: '500' },
});

const agencyStyles = StyleSheet.create({
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  warnCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#f59e0b',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  ctaText: { color: 'white', fontWeight: '700', fontSize: 14 },
  leaveCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.red600,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  disabledCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.slate100,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  disabledCtaText: { color: colors.mutedForeground, flex: 1, fontSize: 13 },
});
