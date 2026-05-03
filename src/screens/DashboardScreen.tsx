import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Logo } from '../components/Logo';
import { CategoryFilter } from '../components/CategoryFilter';
import { ServiceProviderCard } from '../components/ServiceProviderCard';
import { workersApi } from '../api/workers';
import { chatApi } from '../api/chat';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import { WorkerListItem, RootStackParamList } from '../types';
import { CITY_COORDINATES, PAKISTAN_CENTER, haversineKm } from '../utils/cityCoordinates';

type ViewMode = 'list' | 'map';

const WORKER_TYPE_COLORS: Record<string, string> = {
  PLUMBER: colors.categoryPlumber,
  ELECTRICIAN: colors.categoryElectrician,
  CARPENTER: colors.categoryCarpenter,
  PAINTER: colors.categoryPainter,
  HVAC_TECHNICIAN: colors.categoryAC,
  MASON: colors.categoryMason,
  WELDER: colors.categoryWelder,
  MECHANIC: colors.categoryElectrician,
  GENERAL_LABORER: colors.categoryGeneral,
};

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { currentLocation, requestPermission } = useLocation();
  const mapRef = useRef<MapView>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [workers, setWorkers] = useState<WorkerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMapWorker, setSelectedMapWorker] = useState<WorkerListItem | null>(null);

  const fetchWorkers = useCallback(async () => {
    try {
      logger.info('Dashboard', 'Fetching workers...');
      const response = await workersApi.getAllWorkers();
      setWorkers(response.data);
    } catch (error: any) {
      logger.error('Dashboard', 'Failed to fetch workers', error.message);
      setWorkers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh worker list whenever the Services tab regains focus.
  useFocusEffect(useCallback(() => { fetchWorkers(); }, [fetchWorkers]));

  // One-shot side effect on initial mount.
  useEffect(() => { requestPermission().catch(() => {}); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkers();
  };

  const filteredWorkers = workers.filter((worker) => {
    if (user?.userId && worker.userId === user.userId) return false;
    const matchesCategory =
      selectedCategory === 'all' || worker.workerType === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      `${worker.firstName} ${worker.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.workerType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedWorkers = currentLocation
    ? [...filteredWorkers].sort((a, b) => {
        const ca = CITY_COORDINATES[a.city ?? ''];
        const cb = CITY_COORDINATES[b.city ?? ''];
        if (!ca || !cb) return 0;
        return (
          haversineKm(currentLocation.latitude, currentLocation.longitude, ca.latitude, ca.longitude) -
          haversineKm(currentLocation.latitude, currentLocation.longitude, cb.latitude, cb.longitude)
        );
      })
    : filteredWorkers;

  const handleToggleView = async () => {
    if (viewMode === 'list') {
      if (!currentLocation) {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert('Location needed', 'Enable location permission to use map view.');
          return;
        }
      }
      setViewMode('map');
      setSelectedMapWorker(null);
    } else {
      setViewMode('list');
    }
  };

  const mapRegion: Region = currentLocation
    ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude, latitudeDelta: 3, longitudeDelta: 3 }
    : PAKISTAN_CENTER;

  const renderListHeader = () => (
    <View style={styles.categorySection}>
      <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <>
          <Ionicons name="search-outline" size={48} color={colors.slate300} />
          <Text style={styles.emptyText}>No service providers found</Text>
          <Text style={styles.emptySubtext}>Try a different category or search term</Text>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <Logo size="sm" color={colors.white} />
          <View style={styles.locationBadge}>
            <Ionicons name={currentLocation ? 'locate' : 'location'} size={12} color={colors.white} />
            <Text style={styles.locationText}>{currentLocation ? 'Near You' : 'Pakistan'}</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={colors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services or providers..."
              placeholderTextColor={colors.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.viewToggle, viewMode === 'map' && styles.viewToggleActive]}
            onPress={handleToggleView}
            activeOpacity={0.8}
          >
            <Ionicons name={viewMode === 'list' ? 'map' : 'list'} size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'list' && (
        <TouchableOpacity
          style={styles.nearbyFab}
          onPress={() => navigation.navigate('NearbyWorkersMap')}
          activeOpacity={0.85}
        >
          <Ionicons name="map" size={22} color={colors.white} />
        </TouchableOpacity>
      )}

      {viewMode === 'list' && (
        <TouchableOpacity
          style={dashAgencyStyles.browseAgenciesBtn}
          onPress={() => navigation.navigate('BrowseAgencies')}
          activeOpacity={0.85}
        >
          <Ionicons name="business" size={16} color={colors.white} />
          <Text style={dashAgencyStyles.browseAgenciesText}>Browse Agencies</Text>
        </TouchableOpacity>
      )}

      {viewMode === 'list' ? (
        <FlatList
          data={sortedWorkers}
          keyExtractor={(item) => item.workerId}
          renderItem={({ item }) => (
            <ServiceProviderCard
              worker={item}
              onPress={() => navigation.navigate('WorkerDetail', { workerId: item.workerId })}
              onMessage={async () => {
                try {
                  const res = await chatApi.createConversation({
                    senderContext: 'CONSUMER',
                    targetContext: 'WORKER',
                    targetUserId: item.userId,
                    type: 'DIRECT',
                  });
                  navigation.navigate('ChatDetail', {
                    conversationId: res.data.id,
                    participantName: `${item.firstName} ${item.lastName}`,
                    participantAvatar: item.profilePictureUrl,
                  });
                } catch (err: any) {
                  logger.error('Dashboard', 'Failed to start conversation', err.message);
                }
              }}
            />
          )}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      ) : (
        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={mapRegion}
            showsUserLocation
            showsMyLocationButton
            onPress={() => setSelectedMapWorker(null)}
          >
            {sortedWorkers.map((worker) => {
              const coords = CITY_COORDINATES[worker.city ?? ''];
              if (!coords) return null;
              return (
                <Marker
                  key={worker.workerId}
                  coordinate={coords}
                  pinColor={WORKER_TYPE_COLORS[worker.workerType] ?? colors.primary}
                  onPress={() => setSelectedMapWorker(worker)}
                />
              );
            })}
          </MapView>

          {/* Category filter floating at top of map */}
          <View style={styles.mapCategoryBar}>
            <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
          </View>

          {/* Worker count */}
          <View style={styles.mapCountBadge}>
            <Ionicons name="people" size={13} color={colors.slate600} />
            <Text style={styles.mapCountText}>{sortedWorkers.length} workers</Text>
          </View>

          {/* Selected worker callout */}
          {selectedMapWorker && (
            <View style={[styles.mapCallout, { paddingBottom: 14 + insets.bottom }]}>
              <View style={styles.calloutAvatar}>
                <Text style={styles.calloutInitials}>
                  {selectedMapWorker.firstName?.[0]}{selectedMapWorker.lastName?.[0]}
                </Text>
              </View>
              <View style={styles.calloutInfo}>
                <Text style={styles.calloutName} numberOfLines={1}>
                  {selectedMapWorker.firstName} {selectedMapWorker.lastName}
                </Text>
                <Text style={styles.calloutSub}>{selectedMapWorker.workerType} · {selectedMapWorker.city?.replace('_', ' ')}</Text>
                <Text style={styles.calloutRate}>Rs. {selectedMapWorker.hourlyRate ?? 0}/hr</Text>
              </View>
              <View style={styles.calloutActions}>
                <TouchableOpacity
                  style={styles.calloutViewBtn}
                  onPress={() => navigation.navigate('WorkerDetail', { workerId: selectedMapWorker.workerId })}
                >
                  <Text style={styles.calloutViewText}>View Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate50 },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  locationText: { color: colors.white, fontSize: 12, fontWeight: '500' },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.foreground },
  viewToggle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  viewToggleActive: { backgroundColor: 'rgba(255,255,255,0.4)' },
  categorySection: {
    backgroundColor: colors.white,
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 16, color: colors.slate500, fontWeight: '500' },
  emptySubtext: { fontSize: 14, color: colors.slate400 },
  nearbyFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  // Map
  mapWrapper: { flex: 1 },
  map: { flex: 1 },
  mapCategoryBar: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  mapCountBadge: {
    position: 'absolute',
    top: 68,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapCountText: { fontSize: 12, fontWeight: '600', color: colors.slate700 },
  mapCallout: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  calloutAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutInitials: { color: colors.white, fontSize: 17, fontWeight: '700' },
  calloutInfo: { flex: 1 },
  calloutName: { fontSize: 15, fontWeight: '700', color: colors.slate900 },
  calloutSub: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  calloutRate: { fontSize: 13, fontWeight: '600', color: colors.green600, marginTop: 3 },
  calloutActions: { gap: 8 },
  calloutViewBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  calloutViewText: { color: colors.white, fontSize: 13, fontWeight: '600' },
});

const dashAgencyStyles = StyleSheet.create({
  browseAgenciesBtn: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  browseAgenciesText: { color: colors.white, fontWeight: '700', fontSize: 13 },
});
