import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { JobListingCard } from '../components/JobListingCard';
import { jobsApi } from '../api/jobs';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import { RootStackParamList, JobListingSummaryResponse, JobStatus } from '../types';

const TAG = 'MyListings';

type FilterTab = 'ALL' | JobStatus;

const filterTabs: { value: FilterTab; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'Active' },
  { value: 'COMPLETED', label: 'Done' },
];

export function MyListingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [listings, setListings] = useState<JobListingSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');

  const fetchListings = useCallback(async () => {
    try {
      const response = await jobsApi.getMyListings(0, 50);
      setListings(response.data.listings);
    } catch (error: any) {
      logger.error(TAG, 'Failed to fetch my listings', error.message);
      setListings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch on every tab focus so newly-created jobs appear without manual pull-to-refresh.
  useFocusEffect(useCallback(() => { fetchListings(); }, [fetchListings]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const filteredListings = activeFilter === 'ALL'
    ? listings
    : listings.filter((l) => l.status === activeFilter);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>My Listings</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.filterTab, activeFilter === tab.value && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.value)}
          >
            <Text style={[styles.filterTabText, activeFilter === tab.value && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.jobId}
        renderItem={({ item }) => (
          <JobListingCard listing={item} onPress={(jobId) => navigation.navigate('JobListingDetail', { jobId })} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={56} color={colors.slate300} />
                <Text style={styles.emptyTitle}>No listings yet</Text>
                <Text style={styles.emptySubtitle}>Tap + to post your first job</Text>
              </>
            )}
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB - Post a Job */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateJobListing')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate50 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: colors.primary,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.white },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.slate100,
  },
  filterTabActive: { backgroundColor: colors.primary },
  filterTabText: { fontSize: 13, fontWeight: '500', color: colors.slate600 },
  filterTabTextActive: { color: colors.white },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '500', color: colors.slate400 },
  emptySubtitle: { fontSize: 14, color: colors.slate400 },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
