import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useWorker } from '../context/WorkerContext';
import { JobListingCard } from '../components/JobListingCard';
import { jobsApi } from '../api/jobs';
import { agenciesApi } from '../api/agencies';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import { RootStackParamList, JobListingSummaryResponse } from '../types';

const TAG = 'WorkerDashboard';

export function WorkerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { workerProfile, switchToCustomerMode, fetchWorkerProfile } = useWorker();
  const [refreshing, setRefreshing] = useState(false);
  const [recentJobs, setRecentJobs] = useState<JobListingSummaryResponse[]>([]);
  const [totalAssigned, setTotalAssigned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [assignedRes, dispatchedRes] = await Promise.all([
        jobsApi.getMyJobs(0, 10),
        jobsApi.getMyDispatchedJobs(0, 10).catch(() => ({ data: { listings: [], totalElements: 0 } } as any)),
      ]);
      // Merge + dedupe by jobId (worker could be both assigned-as-worker AND dispatched-by-agency on different jobs)
      const seen = new Set<string>();
      const merged: JobListingSummaryResponse[] = [];
      for (const j of [...(assignedRes.data.listings ?? []), ...(dispatchedRes.data.listings ?? [])]) {
        if (!seen.has(j.jobId)) { seen.add(j.jobId); merged.push(j); }
      }
      // Sort newest-first by createdAt
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentJobs(merged.slice(0, 10));
      setTotalAssigned(assignedRes.data.totalElements + (dispatchedRes.data.totalElements ?? 0));
    } catch (error: any) {
      logger.error(TAG, 'Failed to fetch jobs', error.message);
      setRecentJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      fetchWorkerProfile();
      agenciesApi.getMyInvitations()
        .then(r => setPendingInvitations(r.data.length))
        .catch(() => setPendingInvitations(0));
    }, [fetchData, fetchWorkerProfile])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkerProfile();
    fetchData();
  }, [fetchData, fetchWorkerProfile]);

  const handleSwitchToCustomer = () => {
    switchToCustomerMode();
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  const rating = workerProfile?.averageRating ?? 0;
  const jobsDone = workerProfile?.totalJobsCompleted ?? 0;
  const activeJobs = recentJobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'ASSIGNED').length;

  const renderHeader = () => (
    <View>
      {/* Green Header */}
      <View style={[styles.headerCard, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.firstName || 'Worker'}!</Text>
            <Text style={styles.greetingSub}>Worker Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.switchButton} onPress={handleSwitchToCustomer}>
            <Ionicons name="swap-horizontal" size={16} color={colors.green700} />
            <Text style={styles.switchText}>Customer</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{jobsDone}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalAssigned}</Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStatCard}>
          <View style={[styles.quickStatIcon, { backgroundColor: colors.blue50 }]}>
            <Ionicons name="briefcase" size={20} color={colors.primary} />
          </View>
          <Text style={styles.quickStatValue}>{activeJobs}</Text>
          <Text style={styles.quickStatLabel}>Active</Text>
        </View>
        <View style={styles.quickStatCard}>
          <View style={[styles.quickStatIcon, { backgroundColor: colors.amber100 }]}>
            <Ionicons name="time" size={20} color={colors.amber600} />
          </View>
          <Text style={styles.quickStatValue}>{recentJobs.filter(j => j.status === 'ASSIGNED').length}</Text>
          <Text style={styles.quickStatLabel}>Pending</Text>
        </View>
      </View>

      {/* Pending invitations banner */}
      {pendingInvitations > 0 && (
        <TouchableOpacity
          style={inviteBannerStyles.banner}
          onPress={() => navigation.navigate('MyAgencyInvitations')}
          activeOpacity={0.8}>
          <View style={inviteBannerStyles.iconWrap}>
            <Ionicons name="mail-unread" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={inviteBannerStyles.title}>
              {pendingInvitations} pending agency invitation{pendingInvitations === 1 ? '' : 's'}
            </Text>
            <Text style={inviteBannerStyles.subtitle}>Tap to review and respond</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}

      {/* Section Title */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Recent Jobs</Text>
        <Text style={styles.sectionCount}>{recentJobs.length} shown</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.green600} />
      ) : (
        <>
          <Ionicons name="briefcase-outline" size={56} color={colors.slate300} />
          <Text style={styles.emptyTitle}>No jobs yet</Text>
          <Text style={styles.emptySubtitle}>Browse open jobs in the Find Jobs tab</Text>
        </>
      )}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={recentJobs}
      keyExtractor={item => item.jobId}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16 }}>
          <JobListingCard listing={item} onPress={(jobId) => navigation.navigate('JobListingDetail', { jobId })} />
        </View>
      )}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green600} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate50 },
  listContent: { paddingBottom: 100 },
  headerCard: {
    backgroundColor: colors.green600,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.white },
  greetingSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  switchText: { fontSize: 13, fontWeight: '600', color: colors.green700 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.white },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  quickStats: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 20 },
  quickStatCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: colors.slate200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  quickStatIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickStatValue: { fontSize: 22, fontWeight: '700', color: colors.slate900 },
  quickStatLabel: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  sectionTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.slate900 },
  sectionCount: { fontSize: 13, fontWeight: '600', color: colors.green600 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.slate400, marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: colors.slate400, marginTop: 4 },
});

const inviteBannerStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary,
    borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 12,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: colors.foreground, fontSize: 14, fontWeight: '600' },
  subtitle: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
});

