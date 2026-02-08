import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { BookingRequest } from '../types';

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

const statusConfig: Record<string, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  REQUESTED: { color: colors.amber600, bg: colors.amber100, icon: 'time-outline' },
  ACCEPTED: { color: colors.primary, bg: colors.blue50, icon: 'checkmark-circle-outline' },
  CONFIRMED: { color: colors.green700, bg: colors.green100, icon: 'shield-checkmark-outline' },
  SCHEDULED: { color: colors.purple600, bg: colors.purple100, icon: 'calendar-outline' },
  IN_PROGRESS: { color: colors.primary, bg: colors.blue100, icon: 'hammer-outline' },
  COMPLETED: { color: colors.green600, bg: colors.green50, icon: 'checkmark-done-outline' },
  CANCELLED: { color: colors.slate500, bg: colors.slate100, icon: 'close-circle-outline' },
  REJECTED: { color: colors.red600, bg: colors.red50, icon: 'close-circle-outline' },
};

type Props = {
  booking: BookingRequest;
  onPress: (bookingId: string) => void;
};

export function BookingRequestCard({ booking, onPress }: Props) {
  const status = statusConfig[booking.status] || statusConfig.REQUESTED;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const rateLabel = booking.rateType === 'HOURLY' ? '/hr' : booking.rateType === 'DAILY' ? '/day' : '';

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(booking.bookingId)} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.clientInfo}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientInitial}>{booking.clientName[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{booking.clientName}</Text>
            <Text style={styles.serviceType}>{workerTypeLabels[booking.serviceType] || booking.serviceType}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={14} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{booking.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>{booking.description}</Text>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.slate500} />
          <Text style={styles.footerText}>{formatDate(booking.proposedDate)}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={14} color={colors.slate500} />
          <Text style={styles.footerText}>{booking.proposedTime}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="location-outline" size={14} color={colors.slate500} />
          <Text style={styles.footerText}>{booking.city.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Offered Rate</Text>
        <Text style={styles.priceValue}>Rs. {booking.offeredRate.toLocaleString()}{rateLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.slate200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.green700,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate900,
  },
  serviceType: {
    fontSize: 13,
    color: colors.slate500,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    color: colors.slate600,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: colors.slate500,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  priceLabel: {
    fontSize: 13,
    color: colors.slate500,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.green700,
  },
});
