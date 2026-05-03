import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { JobListingSummaryResponse, JobStatus, UrgencyLevel } from '../types';

const statusConfig: Record<JobStatus, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  DRAFT: { color: colors.slate500, bg: colors.slate100, icon: 'create-outline' },
  OPEN: { color: colors.green600, bg: colors.green50, icon: 'radio-button-on' },
  ASSIGNED: { color: colors.primary, bg: colors.blue50, icon: 'person-outline' },
  IN_PROGRESS: { color: colors.amber600, bg: colors.amber100, icon: 'hammer-outline' },
  COMPLETED: { color: colors.green700, bg: colors.green100, icon: 'checkmark-done-outline' },
  CANCELLED: { color: colors.slate500, bg: colors.slate100, icon: 'close-circle-outline' },
  EXPIRED: { color: colors.red600, bg: colors.red50, icon: 'time-outline' },
};

const urgencyConfig: Record<UrgencyLevel, { color: string; bg: string; label: string }> = {
  EMERGENCY: { color: colors.red600, bg: colors.red50, label: 'Emergency' },
  URGENT: { color: colors.amber600, bg: colors.amber100, label: 'Urgent' },
  NORMAL: { color: colors.primary, bg: colors.blue50, label: 'Normal' },
  FLEXIBLE: { color: colors.slate500, bg: colors.slate100, label: 'Flexible' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

type Props = {
  listing: JobListingSummaryResponse;
  onPress: (jobId: string) => void;
};

export function JobListingCard({ listing, onPress }: Props) {
  const status = statusConfig[listing.status];
  const urgency = listing.urgency ? urgencyConfig[listing.urgency] : null;
  const budgetLabel = listing.budgetType === 'HOURLY' ? '/hr' : listing.budgetType === 'DAILY' ? '/day' : '';

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(listing.jobId)} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
          <Text style={styles.workerType}>{listing.workerTypeDisplayName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={12} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{listing.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={14} color={colors.slate500} />
          <Text style={styles.infoText}>{listing.cityDisplayName}{listing.area ? `, ${listing.area}` : ''}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={14} color={colors.slate500} />
          <Text style={styles.infoText}>{timeAgo(listing.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.budgetRow}>
          <Text style={styles.budgetValue}>
            Rs. {listing.budgetMin?.toLocaleString()}{listing.budgetMax ? ` - ${listing.budgetMax.toLocaleString()}` : ''}
            {budgetLabel}
          </Text>
        </View>
        <View style={styles.footerRight}>
          {urgency && urgency.label !== 'Normal' && (
            <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
              <Text style={[styles.urgencyText, { color: urgency.color }]}>{urgency.label}</Text>
            </View>
          )}
          <View style={styles.bidCount}>
            <Ionicons name="people-outline" size={14} color={colors.slate500} />
            <Text style={styles.bidCountText}>{listing.bidCount}</Text>
          </View>
        </View>
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
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate900,
  },
  workerType: {
    fontSize: 13,
    color: colors.slate500,
    marginTop: 2,
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
  infoRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: colors.slate500,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.green700,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bidCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bidCountText: {
    fontSize: 12,
    color: colors.slate500,
    fontWeight: '500',
  },
});
