import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLocation } from '../context/LocationContext';
import { workersApi } from '../api/workers';
import { NearbyWorkerListItem, RootStackParamList } from '../types';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';

const TAG = 'NearbyWorkersMap';

const WORKER_TYPE_OPTIONS = [
  { label: 'All', value: undefined },
  { label: 'Electrician', value: 'ELECTRICIAN' },
  { label: 'Plumber', value: 'PLUMBER' },
  { label: 'Carpenter', value: 'CARPENTER' },
  { label: 'Mechanic', value: 'MECHANIC' },
  { label: 'Painter', value: 'PAINTER' },
  { label: 'Mason', value: 'MASON' },
  { label: 'Welder', value: 'WELDER' },
  { label: 'HVAC', value: 'HVAC_TECHNICIAN' },
  { label: 'Laborer', value: 'GENERAL_LABORER' },
];

export function NearbyWorkersMapScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { currentLocation, requestPermission } = useLocation();

  const [workers, setWorkers] = useState<NearbyWorkerListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [radiusKm, setRadiusKm] = useState(50);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const granted = await requestPermission();
      if (!granted) Alert.alert('Location Required', 'Enable location to find nearby workers.');
    })();
  }, []);

  const fetchNearby = useCallback(async () => {
    if (!currentLocation) return;
    setLoading(true);
    try {
      const results = await workersApi.getNearbyWorkers(
        currentLocation.latitude,
        currentLocation.longitude,
        radiusKm,
        selectedType,
      );
      setWorkers(results);
      logger.info(TAG, `Found ${results.length} nearby workers`);
    } catch (e) {
      logger.error(TAG, 'Failed to fetch nearby workers', e);
    } finally {
      setLoading(false);
    }
  }, [currentLocation, radiusKm, selectedType]);

  useEffect(() => {
    if (currentLocation) fetchNearby();
  }, [fetchNearby]);

  if (!currentLocation) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.slate700} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nearby Workers</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.gpsWaiting}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.gpsWaitingText}>Getting your location...</Text>
          <Text style={styles.gpsWaitingSubtext}>Please allow location access when prompted</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.slate700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Workers</Text>
        <TouchableOpacity onPress={fetchNearby} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {WORKER_TYPE_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.label}
            style={[styles.chip, selectedType === opt.value && styles.chipActive]}
            onPress={() => setSelectedType(opt.value)}
          >
            <Text style={[styles.chipText, selectedType === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.radiusRow}>
        <Ionicons name="radio-button-on" size={16} color={colors.primary} />
        <Text style={styles.radiusLabel}>Radius: {radiusKm} km</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={200}
          step={5}
          value={radiusKm}
          onValueChange={setRadiusKm}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.slate200}
          thumbTintColor={colors.primary}
        />
      </View>

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: (radiusKm / 111) * 2.5,
            longitudeDelta: (radiusKm / 111) * 2.5,
          }}
          showsUserLocation
          showsMyLocationButton
        >
          {workers
            .filter(w => w.shopLatitude && w.shopLongitude)
            .map(w => (
              <Marker
                key={w.workerId}
                coordinate={{ latitude: w.shopLatitude!, longitude: w.shopLongitude! }}
                pinColor={colors.primary}
              >
                <Callout
                  tooltip={false}
                  onPress={() => navigation.navigate('WorkerDetail', { workerId: w.workerId })}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutName} numberOfLines={1}>
                      {w.firstName} {w.lastName}
                    </Text>
                    <Text style={styles.calloutType}>
                      {w.workerType?.toString().replace('_', ' ')}
                    </Text>
                    <View style={styles.calloutMetaRow}>
                      <Ionicons name="star" size={12} color="#f59e0b" />
                      <Text style={styles.calloutMeta}>
                        {w.averageRating ? Number(w.averageRating).toFixed(1) : '—'}
                      </Text>
                      <Text style={styles.calloutMetaDot}>·</Text>
                      <Text style={styles.calloutMeta}>
                        {w.totalJobsCompleted ?? 0} jobs
                      </Text>
                    </View>
                    {w.hourlyRate != null && (
                      <Text style={styles.calloutPrice}>
                        Rs. {w.hourlyRate}/hr
                        {w.dailyRate != null ? `  ·  Rs. ${w.dailyRate}/day` : ''}
                      </Text>
                    )}
                    <Text style={styles.calloutDist}>
                      {w.distanceKm?.toFixed(1)} km away
                    </Text>
                    <Text style={styles.calloutAction}>Tap to view profile →</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
        </MapView>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </View>

      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          {workers.length} worker{workers.length !== 1 ? 's' : ''} within {radiusKm} km
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate50 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.slate200 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.slate100, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: colors.slate900 },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.blue50, alignItems: 'center', justifyContent: 'center' },
  gpsWaiting: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  gpsWaitingText: { fontSize: 16, fontWeight: '600', color: colors.slate700, marginTop: 16, marginBottom: 6 },
  gpsWaitingSubtext: { fontSize: 13, color: colors.slate400, textAlign: 'center' },
  filterRow: { maxHeight: 50, backgroundColor: colors.white },
  filterContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.slate100, borderWidth: 1, borderColor: colors.slate200 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.slate600 },
  chipTextActive: { color: colors.white },
  radiusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  radiusLabel: { fontSize: 13, color: colors.slate600, minWidth: 90 },
  slider: { flex: 1 },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  loadingOverlay: { position: 'absolute', top: 12, right: 12, backgroundColor: colors.white, borderRadius: 20, padding: 8, elevation: 3 },
  callout: { width: 220, padding: 10 },
  calloutName: { fontSize: 14, fontWeight: '700', color: colors.slate900, marginBottom: 2 },
  calloutType: { fontSize: 12, color: colors.slate500, marginBottom: 4, textTransform: 'capitalize' },
  calloutMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  calloutMeta: { fontSize: 12, color: colors.slate700, fontWeight: '500' },
  calloutMetaDot: { fontSize: 12, color: colors.slate400, marginHorizontal: 2 },
  calloutPrice: { fontSize: 11, color: colors.slate600, marginBottom: 4 },
  calloutDist: { fontSize: 12, color: colors.primary, fontWeight: '600', marginBottom: 6 },
  calloutAction: { fontSize: 11, color: colors.slate400 },
  resultsBar: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.slate200 },
  resultsText: { fontSize: 13, color: colors.slate500, textAlign: 'center' },
});
