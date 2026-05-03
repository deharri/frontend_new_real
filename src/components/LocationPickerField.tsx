import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LeafletPickerMap } from './LeafletPickerMap';
import { colors } from '../theme/colors';

interface Props {
  /** Plain-text address (e.g. "Block A, Sector 5, near Main Market"). */
  addressText: string;
  onAddressTextChange: (v: string) => void;
  /** Picked latitude/longitude. Null when the user hasn't picked a point yet. */
  latitude: number | null;
  longitude: number | null;
  onLocationPicked: (lat: number, lng: number) => void;
  onLocationCleared?: () => void;
  label?: string;
  placeholder?: string;
  /** Optional initial map center; falls back to Islamabad. */
  initialLat?: number;
  initialLng?: number;
}

/**
 * Combined address input + "Pick on map" picker. The map uses Leaflet via WebView with
 * OpenStreetMap tiles, so it needs no API key. The text address and the lat/lng are
 * stored independently — the parent decides what to do with each.
 */
export function LocationPickerField({
  addressText,
  onAddressTextChange,
  latitude,
  longitude,
  onLocationPicked,
  onLocationCleared,
  label = 'Address',
  placeholder = 'Street, area, landmark',
  initialLat,
  initialLng,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <TextInput
        style={styles.input}
        value={addressText}
        onChangeText={onAddressTextChange}
        placeholder={placeholder}
        placeholderTextColor={colors.gray400}
      />

      <View style={styles.row}>
        <TouchableOpacity style={styles.pickBtn} onPress={() => setPickerOpen(true)}>
          <Ionicons name="map-outline" size={16} color={colors.primary} />
          <Text style={styles.pickBtnText}>
            {latitude != null && longitude != null ? 'Change pin' : 'Pick on map'}
          </Text>
        </TouchableOpacity>

        {latitude != null && longitude != null && (
          <View style={styles.coordsChip}>
            <Ionicons name="location" size={12} color={colors.green600} />
            <Text style={styles.coordsText}>
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </Text>
            {onLocationCleared && (
              <TouchableOpacity onPress={onLocationCleared} hitSlop={8}>
                <Ionicons name="close-circle" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Tap the map to pick a location</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => setPickerOpen(false)}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
          <LeafletPickerMap
            initialLat={latitude ?? initialLat}
            initialLng={longitude ?? initialLng}
            markerLat={latitude}
            markerLng={longitude}
            onLocationPicked={onLocationPicked}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.mutedForeground, marginBottom: 6 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.foreground,
    fontSize: 15,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  pickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.blue50,
  },
  pickBtnText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  coordsChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: colors.slate100,
  },
  coordsText: { fontSize: 12, color: colors.foreground, fontFamily: 'monospace' },
  modalHeader: {
    paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border,
  },
  modalTitle: { fontSize: 15, fontWeight: '600', color: colors.foreground },
  doneBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.primary, borderRadius: 8 },
  doneBtnText: { color: colors.white, fontWeight: '600' },
});
