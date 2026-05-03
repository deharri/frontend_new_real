import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usersApi } from '../api/users';
import { colors } from '../theme/colors';
import { RootStackParamList, UserProfile } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;
  route: RouteProp<RootStackParamList, 'UserProfile'>;
};

export function UserProfileScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { userId, senderContext = 'CONSUMER', senderAgencyId } = route.params;
  // Reserved for future "Message" button (see plan C8). Treats absent params as a personal-context (CONSUMER) chat.
  void senderContext;
  void senderAgencyId;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.getUserById(userId)
      .then(res => setProfile(res.data))
      .catch(() => {
        Alert.alert('Error', 'Failed to load profile');
        navigation.goBack();
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) return null;

  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        {profile.profilePictureUrl ? (
          <Image source={{ uri: profile.profilePictureUrl }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <Text style={styles.name}>{profile.firstName} {profile.lastName}</Text>
        <View style={styles.memberRow}>
          <Ionicons name="person-outline" size={16} color={colors.slate400} />
          <Text style={styles.memberText}>Member</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate50 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.slate50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.white },
  profileCard: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatarImg: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: colors.white,
    marginBottom: 14,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.primary },
  name: { fontSize: 22, fontWeight: '700', color: colors.white, marginBottom: 6 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
  },
  memberText: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
});
