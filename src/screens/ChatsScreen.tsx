import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Chat } from '../types';

const mockChats: Chat[] = [
  { id: 1, name: 'John Smith', service: 'Plumber', lastMessage: 'I can come tomorrow at 2 PM', time: '10:30 AM', unread: 2 },
  { id: 2, name: 'Mike Johnson', service: 'Electrician', lastMessage: 'Thank you for choosing our service', time: 'Yesterday', unread: 0 },
  { id: 3, name: 'Sarah Williams', service: 'Painter', lastMessage: 'The job is completed', time: '2 days ago', unread: 0 },
];

export function ChatsScreen() {
  const insets = useSafeAreaInsets();

  const renderChat = ({ item }: { item: Chat }) => (
    <TouchableOpacity style={styles.chatCard} activeOpacity={0.7}>
      <View style={styles.chatHeader}>
        <View style={styles.chatLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.chatInfo}>
            <Text style={styles.chatName}>{item.name}</Text>
            <Text style={styles.chatService}>{item.service}</Text>
          </View>
        </View>
        <View style={styles.chatRight}>
          <Text style={styles.chatTime}>{item.time}</Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.messageContainer}>
        <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Your conversations with service providers</Text>
      </View>

      <FlatList
        data={mockChats}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderChat}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.slate900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate600,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  chatCard: {
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
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  chatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  chatInfo: {
    gap: 2,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate900,
  },
  chatService: {
    fontSize: 12,
    color: colors.slate500,
  },
  chatRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  chatTime: {
    fontSize: 12,
    color: colors.slate500,
  },
  unreadBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  messageContainer: {
    backgroundColor: colors.slate50,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.slate600,
  },
});
