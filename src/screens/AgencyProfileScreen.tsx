import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { agenciesApi } from '../api/agencies';
import { chatApi } from '../api/chat';
import { useAgency } from '../context/AgencyContext';
import { AgencyProfile, RootStackParamList, WorkerListItem } from '../types';
import { colors } from '../theme/colors';

export function AgencyProfileScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AgencyProfile'>>();
  const { agencyId } = route.params;
  const { agencyProfile, switchToAgencyMode, isAgencyActive } = useAgency();
  const [agency, setAgency] = useState<AgencyProfile | null>(null);
  const [workers, setWorkers] = useState<WorkerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatStarting, setChatStarting] = useState(false);

  // The viewing user is THIS agency's owner if their own agency profile matches.
  const isOwner = !!agencyProfile && agencyProfile.agencyId === agencyId;

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([
        agenciesApi.getAgencyById(agencyId).then((r) => setAgency(r.data)),
        agenciesApi
          .listAgencyWorkers(agencyId)
          .then((r) => setWorkers(r.data))
          .catch(() => setWorkers([])),
      ])
        .catch(() => setAgency(null))
        .finally(() => setLoading(false));
    }, [agencyId]),
  );

  const startChat = async () => {
    if (!agency) return;
    setChatStarting(true);
    try {
      const res = await chatApi.createConversation({
        senderContext: 'CONSUMER',
        targetContext: 'AGENCY',
        targetAgencyId: agency.agencyId,
        type: 'DIRECT',
        title: agency.agencyName,
      });
      nav.navigate('ChatDetail', {
        conversationId: res.data.id,
        participantName: agency.agencyName,
        participantAvatar: null,
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e.message ?? 'Failed';
      Alert.alert('Chat failed', String(msg));
    } finally {
      setChatStarting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!agency) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Agency not found or no longer active.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="business" size={32} color={colors.primary} />
        </View>
        <Text style={styles.title}>{agency.agencyName}</Text>
        <Text style={styles.sub}>
          {agency.city}
          {agency.address ? ` • ${agency.address}` : ''}
        </Text>
        {agency.averageRating > 0 && (
          <Text style={styles.rating}>
            <Ionicons name="star" size={14} color="#f59e0b" /> {agency.averageRating.toFixed(1)} ·{' '}
            {agency.totalJobsCompleted} jobs done
          </Text>
        )}
      </View>

      {!!agency.description && (
        <View style={styles.descBox}>
          <Text style={styles.desc}>{agency.description}</Text>
        </View>
      )}

      {isOwner ? (
        <TouchableOpacity
          style={[styles.chatBtn, !isAgencyActive && styles.chatBtnDisabled]}
          onPress={() => {
            if (!isAgencyActive) {
              Alert.alert('Subscription inactive', 'Renew your agency subscription to switch to agency mode.');
              return;
            }
            switchToAgencyMode();
            nav.reset({ index: 0, routes: [{ name: 'AgencyTabs' }] });
          }}
          disabled={!isAgencyActive}>
          <Ionicons name="business" size={18} color="white" />
          <Text style={styles.chatBtnText}>Switch to Agency Mode</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.chatBtn, chatStarting && styles.chatBtnDisabled]}
          onPress={startChat}
          disabled={chatStarting}>
          {chatStarting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="chatbubble" size={18} color="white" />
              <Text style={styles.chatBtnText}>Chat with this agency</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.contact}>
        {!!agency.contactNumber && (
          <View style={styles.contactRow}>
            <Ionicons name="call" size={16} color={colors.mutedForeground} />
            <Text style={styles.contactText}>{agency.contactNumber}</Text>
          </View>
        )}
        {!!agency.contactEmail && (
          <View style={styles.contactRow}>
            <Ionicons name="mail" size={16} color={colors.mutedForeground} />
            <Text style={styles.contactText}>{agency.contactEmail}</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Workers ({workers.length})</Text>
      {workers.length === 0 ? (
        <Text style={styles.emptyInline}>No workers listed yet.</Text>
      ) : (
        workers.map((w) => (
          <View key={w.workerId} style={styles.wrow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.wname}>
                {w.firstName} {w.lastName}
              </Text>
              <Text style={styles.wmeta}>
                {w.workerType} • {w.city}
              </Text>
            </View>
            {w.averageRating > 0 && (
              <Text style={styles.wrating}>
                <Ionicons name="star" size={12} color="#f59e0b" /> {w.averageRating.toFixed(1)}
              </Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  empty: { color: colors.mutedForeground },
  container: { padding: 20, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 16 },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground, textAlign: 'center' },
  sub: { color: colors.mutedForeground, marginTop: 4, textAlign: 'center' },
  rating: { color: colors.mutedForeground, marginTop: 6 },
  descBox: {
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  desc: { color: colors.foreground, lineHeight: 20 },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: colors.primary,
    borderRadius: 10,
    marginBottom: 18,
  },
  chatBtnDisabled: { backgroundColor: colors.primaryLighter },
  chatBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  contact: { marginBottom: 24, gap: 8 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactText: { color: colors.foreground },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 8 },
  wrow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  wname: { fontWeight: '600', color: colors.foreground },
  wmeta: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  wrating: { color: colors.mutedForeground, fontSize: 12 },
  emptyInline: {
    color: colors.mutedForeground,
    padding: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
