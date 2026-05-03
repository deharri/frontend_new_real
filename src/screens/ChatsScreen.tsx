import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useWorker } from '../context/WorkerContext';
import { useAgency } from '../context/AgencyContext';
import { usersApi } from '../api/users';
import { ConversationResponse, ParticipantRole, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Deterministic avatar color from userId
const AVATAR_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#ea580c',
  '#16a34a', '#0891b2', '#4f46e5', '#c026d3',
];
function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
}

function getMessagePreviewIcon(type: string): string {
  switch (type) {
    case 'IMAGE': return 'camera';
    case 'OFFER': return 'cash';
    case 'FILE': return 'document';
    case 'AUDIO': return 'mic';
    case 'VIDEO': return 'videocam';
    case 'SYSTEM': return 'information-circle';
    default: return '';
  }
}

// Cache for user profile pictures (userId -> url | null)
const profilePicCache: Record<string, string | null> = {};

export function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { conversations, loadConversations, typingUsers } = useChat();
  const { hasWorkerProfile } = useWorker();
  const { hasAgency } = useAgency();
  const route = useRoute();
  const [refreshing, setRefreshing] = React.useState(false);
  const [profilePics, setProfilePics] = useState<Record<string, string | null>>({});

  const visibleTabs: ParticipantRole[] = React.useMemo(() => {
    const tabs: ParticipantRole[] = ['CONSUMER'];
    if (hasWorkerProfile) tabs.push('WORKER');
    if (hasAgency) tabs.push('AGENCY');
    return tabs;
  }, [hasWorkerProfile, hasAgency]);

  const [activeTab, setActiveTab] = useState<ParticipantRole>('CONSUMER');

  // Honor the initialTab route param (e.g. AgencyDashboard "Messages" deep-link)
  useEffect(() => {
    const initial = (route.params as { initialTab?: ParticipantRole } | undefined)?.initialTab;
    if (initial && visibleTabs.includes(initial)) {
      setActiveTab(initial);
    }
  }, [route.params, visibleTabs]);

  const filteredConversations = React.useMemo(() => {
    return conversations.filter(conv => {
      const mine = conv.participants.find(p => p.userId === user?.userId);
      return mine?.role === activeTab;
    });
  }, [conversations, activeTab, user?.userId]);

  const tabUnreadCount = useCallback((tab: ParticipantRole) => {
    return conversations
      .filter(conv => conv.participants.find(p => p.userId === user?.userId)?.role === tab)
      .reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
  }, [conversations, user?.userId]);

  // Reload conversations every time screen is focused
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  // Fetch profile pictures for participants
  useEffect(() => {
    conversations.forEach(conv => {
      const other = conv.participants.find(p => p.userId !== user?.userId) || conv.participants[0];
      if (profilePicCache[other.userId] !== undefined) {
        setProfilePics(prev => ({ ...prev, [other.userId]: profilePicCache[other.userId] }));
        return;
      }
      usersApi.getUserById(other.userId).then(res => {
        profilePicCache[other.userId] = res.data.profilePictureUrl;
        setProfilePics(prev => ({ ...prev, [other.userId]: res.data.profilePictureUrl }));
      }).catch(() => {
        profilePicCache[other.userId] = null;
      });
    });
  }, [conversations, user?.userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, [loadConversations]);

  const getOtherParticipant = (conv: ConversationResponse) => {
    return conv.participants.find(p => p.userId !== user?.userId) || conv.participants[0];
  };

  const handlePress = (conv: ConversationResponse) => {
    const other = getOtherParticipant(conv);
    navigation.navigate('ChatDetail', {
      conversationId: conv.id,
      participantName: other.displayName || 'Unknown',
      participantAvatar: profilePics[other.userId] || null,
    });
  };

  const renderConversation = ({ item }: { item: ConversationResponse }) => {
    const other = getOtherParticipant(item);
    const safeName = other.displayName || other.userId || '?';
    const initial = safeName.charAt(0).toUpperCase();
    const avatarColor = getAvatarColor(other.userId);
    const isTyping = !!typingUsers[item.id];
    const msgIcon = item.lastMessage ? getMessagePreviewIcon(item.lastMessage.type) : '';

    let preview = '';
    if (isTyping) {
      preview = 'typing...';
    } else if (item.lastMessage) {
      if (item.lastMessage.type === 'TEXT') {
        preview = item.lastMessage.content;
      } else if (item.lastMessage.type === 'OFFER') {
        preview = 'Service offer';
      } else if (item.lastMessage.type === 'IMAGE') {
        preview = 'Photo';
      } else {
        preview = item.lastMessage.type.charAt(0) + item.lastMessage.type.slice(1).toLowerCase();
      }
    }

    return (
      <TouchableOpacity
        style={styles.chatCard}
        activeOpacity={0.7}
        onPress={() => handlePress(item)}
      >
        <View style={styles.row}>
          {/* Avatar */}
          {other.role === 'AGENCY' ? (
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Ionicons name="business" size={20} color="#fff" />
            </View>
          ) : profilePics[other.userId] ? (
            <Image source={{ uri: profilePics[other.userId]! }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}

          {/* Middle content */}
          <View style={styles.chatInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.chatName} numberOfLines={1}>{other.displayName || 'Unknown'}</Text>
              {item.lastMessage && (
                <Text style={[
                  styles.chatTime,
                  item.unreadCount > 0 && { color: colors.primary, fontWeight: '600' }
                ]}>
                  {getRelativeTime(item.lastMessage.sentAt)}
                </Text>
              )}
            </View>

            <View style={styles.previewRow}>
              <View style={styles.previewContent}>
                {msgIcon !== '' && !isTyping && (
                  <Ionicons name={msgIcon as any} size={14} color={colors.slate400} style={{ marginRight: 4 }} />
                )}
                <Text
                  style={[
                    styles.lastMessage,
                    isTyping && { color: colors.green600, fontStyle: 'italic' },
                    item.unreadCount > 0 && { color: colors.slate900, fontWeight: '500' },
                  ]}
                  numberOfLines={1}
                >
                  {preview || 'Start a conversation'}
                </Text>
              </View>

              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>
                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    const subtitle = activeTab === 'WORKER'
      ? 'No worker chats yet'
      : activeTab === 'AGENCY'
        ? 'No agency chats yet'
        : 'Start a conversation by messaging a service provider';
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.slate300} />
        </View>
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptySubtitle}>{subtitle}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          <Ionicons name="chatbubbles" size={26} color={colors.primary} />
          <Text style={styles.title}>Messages</Text>
        </View>
      </View>

      {visibleTabs.length > 1 && (
        <View style={styles.tabStrip}>
          {visibleTabs.map(tab => {
            const label = tab === 'CONSUMER' ? 'Customer' : tab === 'WORKER' ? 'Worker' : 'Agency';
            const unread = tabUnreadCount(tab);
            const isActive = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {label}{unread > 0 ? ` (${unread})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={[
          styles.listContent,
          filteredConversations.length === 0 && { flex: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate50,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.slate900,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 100,
  },
  chatCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.slate200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  chatInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate900,
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    color: colors.slate400,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.slate500,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.slate700,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.slate400,
    textAlign: 'center',
    lineHeight: 20,
  },
  tabStrip: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: colors.slate200 ?? '#e2e8f0',
    backgroundColor: '#fff',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  tabItemActive: {
    borderColor: colors.primary,
  },
  tabLabel: {
    fontSize: 14,
    color: colors.slate500 ?? '#64748b',
    fontWeight: '400',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
