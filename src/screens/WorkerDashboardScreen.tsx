import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useWorker } from '../context/WorkerContext';
import { BookingRequestCard } from '../components/BookingRequestCard';
import { mockBookingRequests, mockWorkerStats } from '../data/mockBookings';
import { colors } from '../theme/colors';
import { RootStackParamList, BookingRequest } from '../types';

export function WorkerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { switchToCustomerMode } = useWorker();
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<BookingRequest[]>(mockBookingRequests);

  const pendingBookings = bookings.filter(b => b.status === 'REQUESTED');
  const stats = mockWorkerStats;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setBookings([...mockBookingRequests]);
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleSwitchToCustomer = () => {
    switchToCustomerMode();
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  const handleBookingPress = (bookingId: string) => {
    navigation.navigate('WorkerBookingDetail', { bookingId });
  };

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
            <Text style={styles.statValue}>{stats.totalJobsCompleted}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.averageRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Rs. {(stats.totalEarnings / 1000).toFixed(0)}k</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStatCard}>
          <View style={[styles.quickStatIcon, { backgroundColor: colors.blue50 }]}>
            <Ionicons name="briefcase" size={20} color={colors.primary} />
          </View>
          <Text style={styles.quickStatValue}>{stats.activeBookings}</Text>
          <Text style={styles.quickStatLabel}>Active</Text>
        </View>
        <View style={styles.quickStatCard}>
          <View style={[styles.quickStatIcon, { backgroundColor: colors.amber100 }]}>
            <Ionicons name="time" size={20} color={colors.amber600} />
          </View>
          <Text style={styles.quickStatValue}>{stats.pendingRequests}</Text>
          <Text style={styles.quickStatLabel}>Pending</Text>
        </View>
      </View>

      {/* Section Title */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Recent Requests</Text>
        <Text style={styles.sectionCount}>{pendingBookings.length} new</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="briefcase-outline" size={56} color={colors.slate300} />
      <Text style={styles.emptyTitle}>No requests yet</Text>
      <Text style={styles.emptySubtitle}>New booking requests will appear here</Text>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={bookings}
      keyExtractor={item => item.bookingId}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16 }}>
          <BookingRequestCard booking={item} onPress={handleBookingPress} />
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
