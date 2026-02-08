import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mockBookingRequests } from '../data/mockBookings';
import { colors } from '../theme/colors';
import { RootStackParamList, BookingRequest } from '../types';

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

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  REQUESTED: { color: colors.amber600, bg: colors.amber100, label: 'Requested' },
  ACCEPTED: { color: colors.primary, bg: colors.blue50, label: 'Accepted' },
  CONFIRMED: { color: colors.green700, bg: colors.green100, label: 'Confirmed' },
  SCHEDULED: { color: colors.purple600, bg: colors.purple100, label: 'Scheduled' },
  IN_PROGRESS: { color: colors.primary, bg: colors.blue100, label: 'In Progress' },
  COMPLETED: { color: colors.green600, bg: colors.green50, label: 'Completed' },
  CANCELLED: { color: colors.slate500, bg: colors.slate100, label: 'Cancelled' },
  REJECTED: { color: colors.red600, bg: colors.red50, label: 'Rejected' },
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WorkerBookingDetail'>;
  route: RouteProp<RootStackParamList, 'WorkerBookingDetail'>;
};

export function WorkerBookingDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { bookingId } = route.params;

  const initialBooking = mockBookingRequests.find(b => b.bookingId === bookingId);
  const [booking, setBooking] = useState<BookingRequest | null>(initialBooking || null);

  if (!booking) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.slate400} />
        <Text style={styles.emptyText}>Booking not found</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = statusConfig[booking.status] || statusConfig.REQUESTED;
  const rateLabel = booking.rateType === 'HOURLY' ? 'per hour' : booking.rateType === 'DAILY' ? 'per day' : 'fixed';
  const isActionable = booking.status === 'REQUESTED';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
      + ' at ' + date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  };

  const handleAccept = () => {
    Alert.alert('Accept Request', 'Are you sure you want to accept this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: () => {
          setBooking({ ...booking, status: 'ACCEPTED', updatedAt: new Date().toISOString() });
          Alert.alert('Accepted', 'You have accepted this booking request.');
        },
      },
    ]);
  };

  const handleReject = () => {
    Alert.alert('Reject Request', 'Are you sure you want to reject this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          setBooking({ ...booking, status: 'REJECTED', updatedAt: new Date().toISOString() });
          Alert.alert('Rejected', 'You have rejected this booking request.');
        },
      },
    ]);
  };

  const handleCallClient = () => {
    Linking.openURL(`tel:${booking.clientPhoneNumber}`);
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.slate900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Status Badge */}
      <View style={[styles.statusCard, { borderColor: status.color }]}>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        <Text style={styles.bookingId}>ID: {booking.bookingId}</Text>
      </View>

      {/* Client Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Client</Text>
        <View style={styles.clientRow}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientInitial}>{booking.clientName[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{booking.clientName}</Text>
            <Text style={styles.clientPhone}>{booking.clientPhoneNumber}</Text>
          </View>
          <TouchableOpacity style={styles.callButton} onPress={handleCallClient}>
            <Ionicons name="call" size={20} color={colors.green600} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Service Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Details</Text>
        <View style={styles.detailRow}>
          <Ionicons name="construct" size={18} color={colors.primary} />
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>{workerTypeLabels[booking.serviceType] || booking.serviceType}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="document-text" size={18} color={colors.primary} />
          <Text style={styles.detailLabel}>Description</Text>
        </View>
        <Text style={styles.descriptionText}>{booking.description}</Text>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={18} color={colors.primary} />
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{formatDate(booking.proposedDate)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={18} color={colors.primary} />
          <Text style={styles.detailLabel}>Time</Text>
          <Text style={styles.detailValue}>{booking.proposedTime}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <Text style={styles.detailLabel}>Location</Text>
        </View>
        <Text style={styles.locationText}>{booking.location}, {booking.city.replace('_', ' ')}</Text>
      </View>

      {/* Pricing */}
      <View style={styles.pricingCard}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        <View style={styles.priceCenter}>
          <Text style={styles.priceAmount}>Rs. {booking.offeredRate.toLocaleString()}</Text>
          <Text style={styles.priceType}>{rateLabel}</Text>
        </View>
      </View>

      {/* Timestamps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.detailRow}>
          <Ionicons name="add-circle-outline" size={18} color={colors.slate400} />
          <Text style={styles.detailLabel}>Created</Text>
          <Text style={styles.detailValue}>{formatTimestamp(booking.createdAt)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="refresh-outline" size={18} color={colors.slate400} />
          <Text style={styles.detailLabel}>Updated</Text>
          <Text style={styles.detailValue}>{formatTimestamp(booking.updatedAt)}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      {isActionable && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={20} color={colors.white} />
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={handleReject} activeOpacity={0.8}>
            <Ionicons name="close-circle" size={20} color={colors.red600} />
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate50 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.slate50 },
  emptyText: { fontSize: 16, color: colors.slate500, marginTop: 12 },
  goBackBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.primary },
  goBackText: { color: colors.white, fontWeight: '600' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.slate200,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.slate900 },
  statusCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1.5,
  },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 14, fontWeight: '700' },
  bookingId: { fontSize: 12, color: colors.slate400, fontFamily: 'monospace' },
  section: {
    backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.slate200,
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', color: colors.slate500, marginBottom: 12,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clientAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.green100,
    alignItems: 'center', justifyContent: 'center',
  },
  clientInitial: { fontSize: 20, fontWeight: '700', color: colors.green700 },
  clientName: { fontSize: 16, fontWeight: '600', color: colors.slate900 },
  clientPhone: { fontSize: 14, color: colors.slate500, marginTop: 2 },
  callButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.green50,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.green500,
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
  },
  detailLabel: { fontSize: 14, color: colors.slate500, flex: 1 },
  detailValue: { fontSize: 14, fontWeight: '500', color: colors.slate900, textAlign: 'right' },
  descriptionText: {
    fontSize: 14, color: colors.slate700, lineHeight: 20, marginBottom: 12,
    paddingLeft: 28, marginTop: -4,
  },
  locationText: {
    fontSize: 14, color: colors.slate700, lineHeight: 20, paddingLeft: 28, marginTop: -4, marginBottom: 4,
  },
  pricingCard: {
    backgroundColor: colors.white, borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.slate200,
  },
  priceCenter: { alignItems: 'center', paddingVertical: 8 },
  priceAmount: { fontSize: 28, fontWeight: '700', color: colors.green600 },
  priceType: { fontSize: 14, color: colors.slate500, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  acceptButton: {
    flex: 1, backgroundColor: colors.green600, borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.green600, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  acceptText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  rejectButton: {
    flex: 1, borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.red600, backgroundColor: colors.white,
  },
  rejectText: { color: colors.red600, fontSize: 16, fontWeight: '600' },
});
