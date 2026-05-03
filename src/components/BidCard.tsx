import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { BidResponse, BidStatus } from '../types';

const statusConfig: Record<BidStatus, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  PENDING: { color: colors.amber600, bg: colors.amber100, icon: 'time-outline' },
  ACCEPTED: { color: colors.green600, bg: colors.green50, icon: 'checkmark-circle-outline' },
  REJECTED: { color: colors.red600, bg: colors.red50, icon: 'close-circle-outline' },
  WITHDRAWN: { color: colors.slate500, bg: colors.slate100, icon: 'arrow-undo-outline' },
  EXPIRED: { color: colors.slate500, bg: colors.slate100, icon: 'time-outline' },
};

type Props = {
  bid: BidResponse;
  onPress?: (bidId: string) => void;
};

export function BidCard({ bid, onPress }: Props) {
  const status = statusConfig[bid.status];
  const rateLabel = bid.proposedRateType === 'HOURLY' ? '/hr' : bid.proposedRateType === 'DAILY' ? '/day' : '';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(bid.bidId)}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.workerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.initial}>{bid.workerFirstName?.[0] || 'W'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{bid.workerFirstName} {bid.workerLastName}</Text>
            <View style={styles.metaRow}>
              {bid.workerExperienceYears > 0 && (
                <Text style={styles.meta}>{bid.workerExperienceYears}yr exp</Text>
              )}
              {bid.workerRating > 0 && (
                <>
                  <Ionicons name="star" size={12} color={colors.amber500} />
                  <Text style={styles.meta}>{bid.workerRating.toFixed(1)}</Text>
                </>
              )}
            </View>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={12} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{bid.status}</Text>
        </View>
      </View>

      {bid.coverMessage ? (
        <Text style={styles.coverMessage} numberOfLines={2}>{bid.coverMessage}</Text>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.amount}>Rs. {bid.proposedAmount?.toLocaleString()}{rateLabel}</Text>
        {bid.estimatedDays ? (
          <Text style={styles.estimatedDays}>{bid.estimatedDays} day{bid.estimatedDays > 1 ? 's' : ''}</Text>
        ) : null}
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
    marginBottom: 8,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.blue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate900,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    color: colors.slate500,
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
  coverMessage: {
    fontSize: 14,
    color: colors.slate600,
    lineHeight: 20,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.green700,
  },
  estimatedDays: {
    fontSize: 13,
    color: colors.slate500,
  },
});
