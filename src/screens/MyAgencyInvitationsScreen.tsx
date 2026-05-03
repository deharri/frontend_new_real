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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { agenciesApi } from '../api/agencies';
import { WorkerInvitation } from '../types';
import { colors } from '../theme/colors';

export function MyAgencyInvitationsScreen() {
  const nav = useNavigation();
  const [invitations, setInvitations] = useState<WorkerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    agenciesApi
      .getMyInvitations()
      .then((r) => setInvitations(r.data))
      .catch(() => setInvitations([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const respond = async (inv: WorkerInvitation, accept: boolean) => {
    setRespondingId(inv.invitationId);
    try {
      await agenciesApi.respondToInvitation(inv.invitationId, accept);
      Alert.alert(
        accept ? 'Accepted' : 'Rejected',
        accept
          ? `You are now part of ${inv.agencyName}.`
          : `You declined ${inv.agencyName}'s invitation.`,
        [{ text: 'OK', onPress: () => load() }],
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e.message ?? 'Failed';
      Alert.alert('Error', String(msg));
    } finally {
      setRespondingId(null);
    }
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
      data={invitations}
      keyExtractor={(i) => i.invitationId}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.agency}>{item.agencyName}</Text>
            <Text style={styles.meta}>invited you to join their agency</Text>
          </View>
          <TouchableOpacity
            style={[styles.btn, styles.acceptBtn, respondingId === item.invitationId && { opacity: 0.6 }]}
            onPress={() => respond(item, true)}
            disabled={respondingId !== null}>
            {respondingId === item.invitationId
              ? <ActivityIndicator color="white" size="small" />
              : <Text style={styles.btnText}>Accept</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.rejectBtn]}
            onPress={() => respond(item, false)}
            disabled={respondingId !== null}>
            <Text style={[styles.btnText, { color: colors.destructive }]}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>No pending invitations.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 14, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  agency: { fontWeight: '600', color: colors.foreground, fontSize: 15 },
  meta: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  btn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    minWidth: 70, alignItems: 'center',
  },
  acceptBtn: { backgroundColor: colors.primary },
  rejectBtn: { borderWidth: 1, borderColor: colors.destructive, backgroundColor: 'transparent' },
  btnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', padding: 30, color: colors.mutedForeground },
});
