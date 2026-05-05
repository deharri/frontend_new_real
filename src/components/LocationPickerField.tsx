import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { MapPressEvent, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { geocodeAddress, reverseGeocode } from '../api/geocoding';
import { colors } from '../theme/colors';
import { PakistanCity } from '../types';

/**
 * Mandatory location picker for worker / agency signup.
 *
 *   Building → Street → (City from parent's chip selector) → Find on map
 *   ↓
 *   Google Maps embedded below; pin is draggable to fine-tune.
 *   ↓
 *   Parent reads `latitude` / `longitude` for submit.
 *
 * The address is structured (not a single freeform field) so Google Geocoding
 * resolves more reliably. The full address sent to the backend is composed by
 * the parent screen (typically `${building}, ${street}`).
 */

interface Props {
  /** Building number / shop number / plot. */
  building: string;
  onBuildingChange: (v: string) => void;
  /** Street name + area / sector / locality. */
  street: string;
  onStreetChange: (v: string) => void;
  /** City already selected via the parent's chip selector — read-only here. */
  city: PakistanCity | null;
  /** Confirmed pin coordinates. Null when nothing has been picked yet. */
  latitude: number | null;
  longitude: number | null;
  onLocationPicked: (lat: number, lng: number) => void;
  onLocationCleared?: () => void;
  label?: string;
}

// City → reasonable initial map center. Used only until the user
// geocodes / drops a pin.
const CITY_CENTERS: Record<PakistanCity, { lat: number; lng: number }> = {
  KARACHI:    { lat: 24.8607, lng: 67.0011 },
  LAHORE:     { lat: 31.5497, lng: 74.3436 },
  ISLAMABAD:  { lat: 33.6844, lng: 73.0479 },
  RAWALPINDI: { lat: 33.5651, lng: 73.0169 },
  FAISALABAD: { lat: 31.4504, lng: 73.1350 },
  MULTAN:     { lat: 30.1575, lng: 71.5249 },
  PESHAWAR:   { lat: 34.0151, lng: 71.5249 },
  QUETTA:     { lat: 30.1798, lng: 66.9750 },
  SIALKOT:    { lat: 32.4945, lng: 74.5229 },
  GUJRANWALA: { lat: 32.1877, lng: 74.1945 },
};

export function LocationPickerField({
  building,
  onBuildingChange,
  street,
  onStreetChange,
  city,
  latitude,
  longitude,
  onLocationPicked,
  onLocationCleared,
  label = 'Office address *',
}: Props) {
  const [searching, setSearching] = useState(false);
  const [formattedAddress, setFormattedAddress] = useState<string | null>(null);

  // Recenter the map whenever the city changes (until the user pins something).
  const initialCenter = city
    ? CITY_CENTERS[city]
    : { lat: 30.3753, lng: 69.3451 }; // Pakistan centroid

  const composedQuery = [building, street, city ? city.replace('_', ' ') : '', 'Pakistan']
    .filter((p) => p && p.trim().length > 0)
    .join(', ');

  const handleFindOnMap = async () => {
    if (!building.trim() && !street.trim()) {
      Alert.alert(
        'Type building & street first',
        'Enter at least the building number and street name, then tap "Find on map".',
      );
      return;
    }
    if (!city) {
      Alert.alert('Select a city', 'Pick the city above before searching the map.');
      return;
    }
    setSearching(true);
    try {
      const result = await geocodeAddress(composedQuery);
      if (!result) {
        Alert.alert(
          'Address not found',
          'Google could not match that address. Try a more specific street name, or drag the pin on the map below to set it manually.',
        );
        return;
      }
      onLocationPicked(result.latitude, result.longitude);
      setFormattedAddress(result.formattedAddress);
    } catch (e: any) {
      Alert.alert(
        'Geocoding failed',
        e?.message?.includes('REQUEST_DENIED')
          ? 'Google rejected the API key. Make sure the Geocoding API is enabled in Google Cloud Console for the same key used by Maps.'
          : `Could not search address: ${e?.message ?? 'unknown error'}`,
      );
    } finally {
      setSearching(false);
    }
  };

  const handleMapEvent = (lat: number, lng: number) => {
    onLocationPicked(lat, lng);
    // Fire-and-forget reverse geocode for user feedback.
    reverseGeocode(lat, lng).then((addr) => {
      if (addr) setFormattedAddress(addr);
    });
  };

  // Clear the formatted address echo if the user clears the pin.
  useEffect(() => {
    if (latitude == null || longitude == null) setFormattedAddress(null);
  }, [latitude, longitude]);

  const hasPin = latitude != null && longitude != null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.subLabel}>Building / shop / plot</Text>
        <TextInput
          style={styles.input}
          value={building}
          onChangeText={onBuildingChange}
          placeholder="e.g. Shop 12, Plot 4-A"
          placeholderTextColor={colors.gray400}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.subLabel}>Street / area / sector</Text>
        <TextInput
          style={styles.input}
          value={street}
          onChangeText={onStreetChange}
          placeholder="e.g. Liaqat Road, F-8 Markaz"
          placeholderTextColor={colors.gray400}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.cityRow}>
        <Ionicons name="business" size={14} color={colors.mutedForeground} />
        <Text style={styles.cityText}>
          City: <Text style={styles.cityValue}>{city ? city.replace('_', ' ') : 'select a city above'}</Text>
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.findBtn, (searching || !city) && styles.findBtnBusy]}
        onPress={handleFindOnMap}
        disabled={searching || !city}>
        {searching ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons name="search" size={16} color="white" />
        )}
        <Text style={styles.findBtnText}>
          {searching ? 'Searching…' : 'Find on map'}
        </Text>
      </TouchableOpacity>

      <View style={styles.mapBox}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={{
            latitude: latitude ?? initialCenter.lat,
            longitude: longitude ?? initialCenter.lng,
            latitudeDelta: hasPin ? 0.01 : 0.08,
            longitudeDelta: hasPin ? 0.01 : 0.08,
          }}
          onPress={(e: MapPressEvent) =>
            handleMapEvent(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)
          }>
          {hasPin && (
            <Marker
              coordinate={{ latitude: latitude!, longitude: longitude! }}
              pinColor={colors.primary}
              draggable
              onDragEnd={(e) =>
                handleMapEvent(
                  e.nativeEvent.coordinate.latitude,
                  e.nativeEvent.coordinate.longitude,
                )
              }
            />
          )}
        </MapView>
      </View>

      {hasPin ? (
        <View style={styles.confirmBox}>
          <Ionicons name="checkmark-circle" size={16} color={colors.green600} />
          <View style={{ flex: 1 }}>
            <Text style={styles.confirmText}>
              Location pinned ({latitude!.toFixed(5)}, {longitude!.toFixed(5)})
            </Text>
            {formattedAddress && (
              <Text style={styles.confirmAddress} numberOfLines={2}>
                {formattedAddress}
              </Text>
            )}
            <Text style={styles.dragHint}>Drag the pin or tap elsewhere on the map to fine-tune.</Text>
          </View>
          {onLocationCleared && (
            <TouchableOpacity onPress={onLocationCleared} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Text style={styles.hint}>
          Type building + street, pick a city, then tap <Text style={styles.hintB}>Find on map</Text>{' '}
          — or tap directly on the map to drop a pin.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '700', color: colors.foreground, marginBottom: 8 },
  fieldGroup: { marginBottom: 10 },
  subLabel: { fontSize: 12, fontWeight: '600', color: colors.mutedForeground, marginBottom: 4 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.foreground,
    fontSize: 14,
  },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cityText: { fontSize: 12, color: colors.mutedForeground },
  cityValue: { fontWeight: '600', color: colors.foreground },
  findBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginBottom: 10,
  },
  findBtnBusy: { opacity: 0.6 },
  findBtnText: { color: 'white', fontWeight: '600', fontSize: 13 },
  mapBox: {
    height: 260,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  map: { flex: 1 },
  confirmBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  confirmText: { fontSize: 12, color: colors.foreground, fontWeight: '600' },
  confirmAddress: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  dragHint: { fontSize: 10, color: colors.mutedForeground, marginTop: 2, fontStyle: 'italic' },
  hint: { fontSize: 11, color: colors.mutedForeground, marginTop: 8 },
  hintB: { fontWeight: '700', color: colors.primary },
});
