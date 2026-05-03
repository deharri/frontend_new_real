import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWorker } from '../context/WorkerContext';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';

export function ModeSwitchBanner() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { hasWorkerProfile, isLoadingWorker, isSubscribed, switchToWorkerMode } = useWorker();

  if (isLoadingWorker) return null;

  if (!hasWorkerProfile) {
    return (
      <TouchableOpacity
        style={styles.becomeBanner}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('CreateWorkerProfile')}
      >
        <View style={styles.bannerIcon}>
          <Ionicons name="construct" size={24} color={colors.green700} />
        </View>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Become a Worker</Text>
          <Text style={styles.bannerSubtitle}>Start offering your services and earn money</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.green600} />
      </TouchableOpacity>
    );
  }

  const handleSwitchToWorker = () => {
    if (isSubscribed) {
      switchToWorkerMode();
      navigation.reset({ index: 0, routes: [{ name: 'WorkerTabs' }] });
    } else {
      navigation.navigate('WorkerSubscription');
    }
  };

  return (
    <TouchableOpacity
      style={styles.switchBanner}
      activeOpacity={0.7}
      onPress={handleSwitchToWorker}
    >
      <View style={styles.bannerIcon}>
        <Ionicons name="swap-horizontal" size={24} color={colors.green700} />
      </View>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle}>Switch to Worker Mode</Text>
        <Text style={styles.bannerSubtitle}>
          {isSubscribed
            ? 'View and manage your work requests'
            : 'Subscribe to activate your worker profile'}
        </Text>
      </View>
      {!isSubscribed && (
        <View style={styles.subscriptionBadge}>
          <Text style={styles.subscriptionBadgeText}>Rs. 999/mo</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color={colors.green600} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  becomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: colors.green500,
    borderStyle: 'dashed',
    gap: 12,
  },
  switchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.green50,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.green500,
    gap: 12,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.green700,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: colors.slate500,
  },
  subscriptionBadge: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  subscriptionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
});
