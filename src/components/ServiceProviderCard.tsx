import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { WorkerListItem } from '../types';

interface ServiceProviderCardProps {
  worker: WorkerListItem;
  onPress?: () => void;
}

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

export function ServiceProviderCard({ worker, onPress }: ServiceProviderCardProps) {
  const initials = `${worker.firstName?.[0] || ''}${worker.lastName?.[0] || ''}`.toUpperCase();
  const isAvailable = worker.availabilityStatus === 'AVAILABLE';
  const rating = worker.averageRating || 0;
  const fullStars = Math.floor(rating);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {worker.firstName} {worker.lastName}
            </Text>
            <Text style={styles.category}>
              {workerTypeLabels[worker.workerType] || worker.workerType}
            </Text>
            <View style={styles.ratingRow}>
              <View style={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name="star"
                    size={14}
                    color={i < fullStars ? colors.amber400 : colors.slate200}
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              <Text style={styles.jobsText}>({worker.totalJobsCompleted || 0})</Text>
            </View>
          </View>

          <View style={[styles.badge, isAvailable ? styles.badgeAvailable : styles.badgeBusy]}>
            <Ionicons
              name={isAvailable ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={isAvailable ? colors.green700 : colors.red700}
            />
            <Text style={[styles.badgeText, isAvailable ? styles.badgeTextAvailable : styles.badgeTextBusy]}>
              {isAvailable ? 'Available' : 'Busy'}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.blue50 }]}>
              <Ionicons name="location" size={16} color={colors.primary} />
            </View>
            <Text style={styles.infoText}>
              <Text style={styles.infoTextBold}>{worker.city?.replace('_', ' ')}</Text>
              {worker.area ? `, ${worker.area}` : ''}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.purple50 }]}>
              <Ionicons name="briefcase" size={16} color={colors.purple600} />
            </View>
            <Text style={styles.infoText}>
              <Text style={styles.infoTextMuted}>Experience: </Text>
              <Text style={styles.infoTextBold}>{worker.experienceYears || 0} years</Text>
            </Text>
          </View>
        </View>

        {/* Price & Action */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.price}>
              Rs. {worker.hourlyRate || 0}
              <Text style={styles.priceUnit}>/hr</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.bookButton, !isAvailable && styles.bookButtonDisabled]}
            disabled={!isAvailable}
            onPress={onPress}
          >
            <Ionicons name="call" size={16} color={isAvailable ? colors.white : colors.slate500} />
            <Text style={[styles.bookButtonText, !isAvailable && styles.bookButtonTextDisabled]}>
              {isAvailable ? 'Book Now' : 'Unavailable'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.slate200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate900,
    marginBottom: 2,
  },
  category: {
    fontSize: 13,
    color: colors.slate600,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate900,
  },
  jobsText: {
    fontSize: 13,
    color: colors.slate500,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
  },
  badgeAvailable: {
    backgroundColor: colors.green50,
    borderColor: '#bbf7d0',
  },
  badgeBusy: {
    backgroundColor: colors.red50,
    borderColor: '#fecaca',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  badgeTextAvailable: {
    color: colors.green700,
  },
  badgeTextBusy: {
    color: colors.red700,
  },
  info: {
    gap: 8,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 14,
    color: colors.slate600,
  },
  infoTextBold: {
    color: colors.slate900,
    fontWeight: '500',
  },
  infoTextMuted: {
    color: colors.slate500,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.slate500,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.slate500,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bookButtonDisabled: {
    backgroundColor: colors.slate300,
    shadowOpacity: 0,
    elevation: 0,
  },
  bookButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  bookButtonTextDisabled: {
    color: colors.slate500,
  },
});
