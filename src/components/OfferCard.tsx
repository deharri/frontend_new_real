import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { OfferInfo } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OfferCardProps {
  offer: OfferInfo;
  isMine: boolean;
  loading?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onViewJob?: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  PENDING: { color: colors.amber600, bg: colors.amber100, icon: 'time-outline', label: 'Pending' },
  ACCEPTED: { color: colors.green700, bg: colors.green100, icon: 'checkmark-circle', label: 'Accepted' },
  REJECTED: { color: colors.red600, bg: colors.red50, icon: 'close-circle', label: 'Rejected' },
  WITHDRAWN: { color: colors.slate500, bg: colors.slate100, icon: 'arrow-undo', label: 'Withdrawn' },
  EXPIRED: { color: colors.slate500, bg: colors.slate100, icon: 'alarm-outline', label: 'Expired' },
};

export function OfferCard({ offer, isMine, loading, onAccept, onReject, onViewJob }: OfferCardProps) {
  const config = STATUS_CONFIG[offer.status] || STATUS_CONFIG.PENDING;
  const showActions = !isMine && offer.status === 'PENDING';

  // Try to parse job info from description (consumer offers encode it as JSON)
  let jobInfo: { jobTitle?: string; workerType?: string; city?: string; displayText?: string } | null = null;
  let displayDescription = offer.description;
  try {
    const parsed = JSON.parse(offer.description);
    if (parsed.jobTitle) {
      jobInfo = parsed;
      displayDescription = parsed.displayText || parsed.jobDescription || parsed.jobTitle;
    }
  } catch {
    // Plain text description
  }

  const workerTypeLabels: Record<string, string> = {
    MECHANIC: 'Mechanic', ELECTRICIAN: 'Electrician', PLUMBER: 'Plumber',
    CARPENTER: 'Carpenter', WELDER: 'Welder', PAINTER: 'Painter',
    MASON: 'Mason', HVAC_TECHNICIAN: 'AC Technician', GENERAL_LABORER: 'General',
  };

  return (
    <View style={[styles.container, { borderLeftColor: config.color }]}>
      {/* Status badge */}
      <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon as any} size={14} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
      </View>

      {/* Job title for consumer offers */}
      {jobInfo?.jobTitle && (
        <Text style={styles.jobTitle}>{jobInfo.jobTitle}</Text>
      )}

      {/* Amount - large and prominent */}
      <View style={styles.amountRow}>
        <Ionicons name="cash-outline" size={24} color={colors.green700} />
        <Text style={styles.amount}>Rs. {offer.amount.toLocaleString()}</Text>
      </View>

      {/* Job tags for consumer offers */}
      {jobInfo && (
        <View style={styles.jobTags}>
          {jobInfo.workerType && (
            <View style={styles.jobTag}>
              <Ionicons name="construct-outline" size={12} color={colors.primary} />
              <Text style={styles.jobTagText}>{workerTypeLabels[jobInfo.workerType] || jobInfo.workerType}</Text>
            </View>
          )}
          {jobInfo.city && (
            <View style={styles.jobTag}>
              <Ionicons name="location-outline" size={12} color={colors.primary} />
              <Text style={styles.jobTagText}>{jobInfo.city.replace('_', ' ')}</Text>
            </View>
          )}
        </View>
      )}

      {/* Description */}
      {displayDescription ? (
        <Text style={styles.description} numberOfLines={2}>{displayDescription}</Text>
      ) : null}

      {/* Delivery days */}
      <View style={styles.detailRow}>
        <Ionicons name="calendar-outline" size={16} color={colors.slate500} />
        <Text style={styles.detailText}>{offer.deliveryDays} days</Text>
      </View>

      {/* Action buttons for receiver */}
      {showActions && (
        <View style={styles.actions}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.acceptBtn]}
                onPress={onAccept}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark" size={22} color={colors.white} />
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={onReject}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={colors.red600} />
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* View Job button for accepted offers */}
      {offer.status === 'ACCEPTED' && onViewJob && (
        <TouchableOpacity
          style={styles.viewJobBtn}
          onPress={onViewJob}
          activeOpacity={0.7}
        >
          <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
          <Text style={styles.viewJobText}>View Job</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.slate200,
    width: Math.min(SCREEN_WIDTH * 0.7, 300),
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slate900,
  },
  jobTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  jobTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.blue50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  jobTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.primary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.slate900,
  },
  description: {
    fontSize: 13,
    color: colors.slate600,
    lineHeight: 18,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 12,
    color: colors.slate500,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  acceptBtn: {
    backgroundColor: colors.green600,
  },
  rejectBtn: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.red600,
  },
  acceptText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  rejectText: {
    color: colors.red600,
    fontSize: 13,
    fontWeight: '600',
  },
  viewJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.blue50,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  viewJobText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
