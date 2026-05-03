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
import { CategoryFilter } from '../components/CategoryFilter';
import { JobListingCard } from '../components/JobListingCard';
import { BidCard } from '../components/BidCard';
import { jobsApi } from '../api/jobs';
import { useAuth } from '../context/AuthContext';
import { useAgency } from '../context/AgencyContext';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import { RootStackParamList, JobListingSummaryResponse, BidResponse } from '../types';

const TAG = 'BrowseJobs';

type Tab = 'browse' | 'myBids';

export function BrowseJobsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { isAgencyMode, agencyProfile } = useAgency();
  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Browse state
  const [listings, setListings] = useState<JobListingSummaryResponse[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [refreshingListings, setRefreshingListings] = useState(false);

  // My Bids state
  const [bids, setBids] = useState<BidResponse[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [refreshingBids, setRefreshingBids] = useState(false);

  const fetchListings = useCallback(async () => {
    try {
      const params: any = { status: 'OPEN', size: 50 };
      if (selectedCategory !== 'all') {
        params.workerType = selectedCategory;
      }
      const response = await jobsApi.searchListings(params);
      const filtered = response.data.listings.filter(
        l => l.consumerUsername !== user?.username
      );
      setListings(filtered);
    } catch (error: any) {
      logger.error(TAG, 'Failed to fetch listings', error.message);
      setListings([]);
    } finally {
      setLoadingListings(false);
      setRefreshingListings(false);
    }
  }, [selectedCategory]);

  const fetchBids = useCallback(async () => {
    setLoadingBids(true);
    try {
      // In agency mode, list bids placed by the agency. Otherwise list the worker's own bids.
      const response = (isAgencyMode && agencyProfile)
        ? await jobsApi.getMyAgencyBids(agencyProfile.agencyId, 0, 50)
        : await jobsApi.getMyBids(0, 50);
      setBids(response.data.bids);
    } catch (error: any) {
      logger.error(TAG, 'Failed to fetch bids', error.message);
      setBids([]);
    } finally {
      setLoadingBids(false);
      setRefreshingBids(false);
    }
  }, [isAgencyMode, agencyProfile?.agencyId]);

  useFocusEffect(useCallback(() => {
    if (activeTab === 'browse') {
      setLoadingListings(true);
      fetchListings();
    } else {
      fetchBids();
    }
  }, [activeTab, fetchListings, fetchBids]));

  const onRefreshListings = () => {
    setRefreshingListings(true);
    fetchListings();
  };

  const onRefreshBids = () => {
    setRefreshingBids(true);
    fetchBids();
  };

  const renderEmpty = (loading: boolean, message: string) => (
    <View style={styles.emptyState}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.green600} />
      ) : (
        <>
          <Ionicons name="briefcase-outline" size={56} color={colors.slate300} />
          <Text style={styles.emptyTitle}>{message}</Text>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Find Jobs</Text>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'browse' && styles.tabActive]}
            onPress={() => setActiveTab('browse')}
          >
            <Text style={[styles.tabText, activeTab === 'browse' && styles.tabTextActive]}>Browse Jobs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'myBids' && styles.tabActive]}
            onPress={() => setActiveTab('myBids')}
          >
            <Text style={[styles.tabText, activeTab === 'myBids' && styles.tabTextActive]}>My Bids</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'browse' ? (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.jobId}
          renderItem={({ item }) => (
            <View style={styles.cardPadding}>
              <JobListingCard listing={item} onPress={(jobId) => navigation.navigate('JobListingDetail', { jobId })} />
            </View>
          )}
          ListHeaderComponent={
            <View style={styles.filterSection}>
              <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
            </View>
          }
          ListEmptyComponent={renderEmpty(loadingListings, 'No open jobs found')}
          refreshControl={<RefreshControl refreshing={refreshingListings} onRefresh={onRefreshListings} tintColor={colors.green600} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={bids}
          keyExtractor={(item) => item.bidId}
          renderItem={({ item }) => (
            <View style={styles.cardPadding}>
              <BidCard bid={item} onPress={() => navigation.navigate('JobListingDetail', { jobId: item.jobId })} />
            </View>
          )}
          ListEmptyComponent={renderEmpty(loadingBids, 'No bids placed yet')}
          refreshControl={<RefreshControl refreshing={refreshingBids} onRefresh={onRefreshBids} tintColor={colors.green600} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate50,
  },
  header: {
    backgroundColor: colors.green600,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 14,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.white,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  tabTextActive: {
    color: colors.green700,
  },
  filterSection: {
    backgroundColor: colors.white,
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  cardPadding: {
    // padding already in listContent
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.slate400,
  },
});
