import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAgency } from '../context/AgencyContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { jobsApi } from '../api/jobs';
import { ConversationResponse, JobListingSummaryResponse, RootStackParamList } from '../types';
import { colors } from '../theme/colors';

export function AgencyDashboardScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { agencyProfile, daysUntilExpiry, isAgencyActive, refreshAgency, isLoadingAgency } =
    useAgency();
  const { user } = useAuth();
  const { conversations, totalUnread, loadConversations, typingUsers } = useChat();
  const [openListings, setOpenListings] = React.useState<JobListingSummaryResponse[]>([]);
  const [agencyJobs, setAgencyJobs] = React.useState<JobListingSummaryResponse[]>([]);

  useFocusEffect(
    useCallback(() => {
      refreshAgency();
      loadConversations();
      jobsApi
        .searchListings({ status: 'OPEN' })
        .then((r) => setOpenListings(r.data.listings ?? []))
        .catch(() => setOpenListings([]));
      if (agencyProfile?.agencyId) {
        jobsApi
          .getAgencyJobs(agencyProfile.agencyId)
          .then((r) => setAgencyJobs(r.data.listings ?? []))
          .catch(() => setAgencyJobs([]));
      }
    }, [refreshAgency, loadConversations, agencyProfile?.agencyId]),
  );

  if (isLoadingAgency && !agencyProfile) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!agencyProfile) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.empty}>No agency found.</Text>
        <TouchableOpacity
          style={styles.action}
          onPress={() => nav.navigate('CreateAgency')}>
          <Text style={styles.actionText}>Create Agency</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getOther = (conv: ConversationResponse) =>
    conv.participants.find((p) => p.userId !== user?.userId) || conv.participants[0];

  const recentConversations = conversations.slice(0, 5);

  const previewFor = (conv: ConversationResponse) => {
    if (typingUsers[conv.id]) return 'typing…';
    if (!conv.lastMessage) return 'No messages yet';
    if (conv.lastMessage.type === 'TEXT') return conv.lastMessage.content;
    if (conv.lastMessage.type === 'OFFER') return '💼 Sent an offer';
    if (conv.lastMessage.type === 'IMAGE') return '📷 Image';
    return conv.lastMessage.content || '—';
  };

  const openChat = (conv: ConversationResponse) => {
    const other = getOther(conv);
    nav.navigate('ChatDetail', {
      conversationId: conv.id,
      participantName: other.displayName || 'Customer',
      participantAvatar: null,
    });
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{agencyProfile.agencyName}</Text>
        <Text style={styles.sub}>
          {agencyProfile.city} • {agencyProfile.address}
        </Text>
        {isAgencyActive ? (
          <View style={styles.badgeActive}>
            <Ionicons name="checkmark-circle" size={14} color="white" />
            <Text style={styles.badgeText}>Active — {daysUntilExpiry} days left</Text>
          </View>
        ) : (
          <View style={styles.badgeInactive}>
            <Ionicons name="alert-circle" size={14} color="white" />
            <Text style={styles.badgeText}>Inactive — pay to activate</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Agency stats</Text>
      <View style={styles.statsRow}>
        <Stat label="Workers" value={String(agencyProfile.totalWorkers ?? 0)} />
        <Stat
          label="Rating"
          value={
            agencyProfile.averageRating != null
              ? Number(agencyProfile.averageRating).toFixed(1)
              : '—'
          }
        />
        <Stat label="Jobs done" value={String(agencyProfile.totalJobsCompleted ?? 0)} />
      </View>

      <Text style={styles.sectionTitle}>My Active Jobs</Text>
      {agencyJobs.length === 0 ? (
        <View style={styles.emptyConvosBox}>
          <Ionicons name="checkmark-done-outline" size={28} color={colors.mutedForeground} />
          <Text style={styles.emptyConvosText}>
            No active jobs yet. Win a bid or accept an offer in chat to start.
          </Text>
        </View>
      ) : (
        <View style={styles.convoList}>
          {agencyJobs.slice(0, 5).map((job) => (
            <TouchableOpacity
              key={job.jobId}
              style={styles.convoRow}
              onPress={() => nav.navigate('JobListingDetail', { jobId: job.jobId })}
              activeOpacity={0.7}>
              <View style={styles.convoInfo}>
                <Text style={styles.convoName} numberOfLines={1}>{job.title}</Text>
                <Text style={styles.convoPreview}>
                  {job.status} • {job.cityDisplayName} • Rs. {job.budgetMin} – {job.budgetMax}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
          {agencyJobs.length > 5 && (
            <Text style={styles.moreHint}>+ {agencyJobs.length - 5} more</Text>
          )}
        </View>
      )}

      <Text style={styles.sectionTitle}>Open Job Listings</Text>
      {openListings.length === 0 ? (
        <View style={styles.emptyConvosBox}>
          <Ionicons name="briefcase-outline" size={28} color={colors.mutedForeground} />
          <Text style={styles.emptyConvosText}>No open jobs right now.</Text>
        </View>
      ) : (
        <View style={styles.convoList}>
          {openListings.slice(0, 5).map((job) => (
            <TouchableOpacity
              key={job.jobId}
              style={styles.convoRow}
              onPress={() => nav.navigate('JobListingDetail', { jobId: job.jobId })}
              activeOpacity={0.7}>
              <View style={styles.convoInfo}>
                <Text style={styles.convoName} numberOfLines={1}>{job.title}</Text>
                <Text style={styles.convoPreview}>
                  {job.cityDisplayName} • Rs. {job.budgetMin} – {job.budgetMax}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
          {openListings.length > 5 && (
            <Text style={styles.moreHint}>+ {openListings.length - 5} more in Find Jobs tab</Text>
          )}
        </View>
      )}

      <Text style={styles.sectionTitle}>Messages</Text>
      <View style={styles.statsRow}>
        <Stat label="Conversations" value={String(conversations.length)} />
        <Stat label="Unread" value={String(totalUnread)} highlight={totalUnread > 0} />
      </View>

      {recentConversations.length === 0 ? (
        <View style={styles.emptyConvosBox}>
          <Ionicons name="chatbubbles-outline" size={28} color={colors.mutedForeground} />
          <Text style={styles.emptyConvosText}>
            No messages yet. Customers can reach you from your agency profile.
          </Text>
        </View>
      ) : (
        <View style={styles.convoList}>
          {recentConversations.map((conv) => {
            const other = getOther(conv);
            const initial = (other.displayName || '?').charAt(0).toUpperCase();
            const hasUnread = conv.unreadCount > 0;
            return (
              <TouchableOpacity
                key={conv.id}
                style={styles.convoRow}
                onPress={() => openChat(conv)}
                activeOpacity={0.7}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <View style={styles.convoInfo}>
                  <View style={styles.convoTopRow}>
                    <Text style={styles.convoName} numberOfLines={1}>
                      {other.displayName || 'Customer'}
                    </Text>
                    {hasUnread && (
                      <View style={styles.unreadDot}>
                        <Text style={styles.unreadDotText}>{conv.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.convoPreview,
                      hasUnread && { color: colors.foreground, fontWeight: '600' },
                    ]}
                    numberOfLines={1}>
                    {previewFor(conv)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            );
          })}
          {conversations.length > 5 && (
            <Text style={styles.moreHint}>
              + {conversations.length - 5} more in Messages tab
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.action, styles.actionPrimary]}
        onPress={() =>
          nav.navigate('MainTabs', { screen: 'Messages', params: { initialTab: 'AGENCY' } } as never)
        }>
        <Ionicons name="chatbubbles" size={18} color="white" />
        <Text style={styles.actionText}>View all messages</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Manage</Text>

      {!isAgencyActive && (
        <TouchableOpacity
          style={[styles.action, { backgroundColor: '#f59e0b' }]}
          onPress={() =>
            nav.navigate('AgencySubscriptionPayment', { agencyId: agencyProfile.agencyId })
          }>
          <Ionicons name="card" size={18} color="white" />
          <Text style={styles.actionText}>Renew subscription (Rs. 10,000)</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.action}
        onPress={() =>
          nav.navigate('AgencyWorkers', { agencyId: agencyProfile.agencyId })
        }>
        <Ionicons name="people" size={18} color="white" />
        <Text style={styles.actionText}>Manage workers</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View
      style={[
        styles.statCard,
        highlight && { borderColor: colors.primary, backgroundColor: '#eff6ff' },
      ]}>
      <Text style={[styles.statValue, highlight && { color: colors.primary }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, paddingBottom: 60 },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  empty: { fontSize: 16, color: colors.mutedForeground, marginBottom: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', color: colors.foreground },
  sub: { color: colors.mutedForeground, marginTop: 4 },
  badgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: colors.green600,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 10,
  },
  badgeInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 10,
  },
  badgeText: { color: 'white', fontWeight: '600', fontSize: 12 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: 16,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.foreground },
  statLabel: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
  emptyConvosBox: {
    padding: 18,
    backgroundColor: colors.card,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyConvosText: {
    color: colors.mutedForeground,
    fontSize: 13,
    textAlign: 'center',
  },
  convoList: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  convoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 16 },
  convoInfo: { flex: 1 },
  convoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  convoName: { fontWeight: '600', color: colors.foreground, flex: 1 },
  convoPreview: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  unreadDot: {
    backgroundColor: colors.primary,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDotText: { color: 'white', fontWeight: '700', fontSize: 11 },
  moreHint: {
    color: colors.mutedForeground,
    fontSize: 12,
    textAlign: 'center',
    padding: 10,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    padding: 14,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  actionText: { color: 'white', fontWeight: '700' },
});
