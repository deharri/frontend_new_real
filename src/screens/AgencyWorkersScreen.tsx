import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { agenciesApi } from '../api/agencies';
import { chatApi } from '../api/chat';
import { useAgency } from '../context/AgencyContext';
import { WorkerListItem, RootStackParamList } from '../types';
import { colors } from '../theme/colors';

export function AgencyWorkersScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'AgencyWorkers'>>();
  const { agencyId } = route.params;
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { agencyProfile } = useAgency();
  const [workers, setWorkers] = useState<WorkerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    agenciesApi
      .listAgencyWorkers(agencyId)
      .then((r) => setWorkers(r.data))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false));
  }, [agencyId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const messageWorker = async (w: WorkerListItem) => {
    if (!agencyProfile?.agencyId) {
      Alert.alert('Error', 'Agency profile not loaded');
      return;
    }
    setMessagingId(w.workerId);
    try {
      const res = await chatApi.createConversation({
        senderContext: 'AGENCY',
        senderAgencyId: agencyProfile.agencyId,
        targetContext: 'WORKER',
        targetUserId: w.userId,
        type: 'DIRECT',
      });
      nav.navigate('ChatDetail', {
        conversationId: res.data.id,
        participantName: `${w.firstName} ${w.lastName}`,
        participantAvatar: w.profilePictureUrl ?? null,
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e.message ?? 'Failed';
      Alert.alert('Message failed', String(msg));
    } finally {
      setMessagingId(null);
    }
  };

  const remove = (w: WorkerListItem) => {
    Alert.alert(
      'Remove worker?',
      `${w.firstName} ${w.lastName} will be unlinked from your agency.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await agenciesApi.removeWorker(w.workerId);
              load();
            } catch (e: any) {
              const msg = e?.response?.data?.message ?? 'Failed';
              Alert.alert('Error', String(msg));
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      data={workers}
      keyExtractor={(w) => w.workerId}
      ListHeaderComponent={
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => nav.navigate('AddWorker', { agencyId })}>
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.addBtnText}>Add Worker</Text>
        </TouchableOpacity>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.7}
            onPress={() => nav.navigate('WorkerDetail', { workerId: item.workerId })}>
            <Text style={styles.name}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.meta}>
              {item.workerType} • {item.city}
            </Text>
            {item.averageRating > 0 && (
              <Text style={styles.rating}>
                <Ionicons name="star" size={12} color="#f59e0b" /> {item.averageRating.toFixed(1)}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => messageWorker(item)}
            style={styles.messageBtn}
            disabled={messagingId === item.workerId}>
            {messagingId === item.workerId ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                <Text style={styles.messageText}>Message</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => remove(item)} style={styles.removeBtn}>
            <Ionicons name="trash-outline" size={16} color={colors.destructive} />
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>No workers yet. Tap "Invite a worker" to add some.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  name: { fontWeight: '600', color: colors.foreground, fontSize: 15 },
  meta: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  rating: { color: colors.mutedForeground, fontSize: 11, marginTop: 2 },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: 8,
  },
  messageText: { color: colors.primary, fontWeight: '600', fontSize: 12 },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.destructive,
  },
  removeText: { color: colors.destructive, fontWeight: '600', fontSize: 12 },
  empty: { textAlign: 'center', padding: 30, color: colors.mutedForeground },
});
