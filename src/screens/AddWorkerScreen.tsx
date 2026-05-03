import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { workersApi } from '../api/workers';
import { agenciesApi } from '../api/agencies';
import { WorkerListItem } from '../types';
import { colors } from '../theme/colors';

export function AddWorkerScreen() {
  const nav = useNavigation();
  const [q, setQ] = useState('');
  const [workers, setWorkers] = useState<WorkerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    workersApi
      .getAllWorkers()
      .then((r) => setWorkers(r.data.filter((w) => !w.agencyName)))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = workers.filter(
    (w) =>
      !q ||
      `${w.firstName} ${w.lastName} ${w.workerType} ${w.city}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );

  const add = async (w: WorkerListItem) => {
    setAddingId(w.workerId);
    try {
      await agenciesApi.inviteWorker(w.workerId);
      Alert.alert('Invitation sent', `An invitation has been sent to ${w.firstName} ${w.lastName}. They'll join your agency once they accept.`, [
        { text: 'OK', onPress: () => nav.goBack() },
      ]);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message ?? e.message ?? 'Failed';
      Alert.alert(
        status === 400 || status === 409 ? 'Cannot invite' : 'Error',
        String(msg),
      );
    } finally {
      setAddingId(null);
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
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search by name, type, or city"
        value={q}
        onChangeText={setQ}
      />
      <FlatList
        data={filtered}
        keyExtractor={(w) => w.workerId}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.workerInfo}>
              <Text style={styles.name}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={styles.meta}>
                {item.workerType} • {item.city}
              </Text>
              {item.averageRating > 0 && (
                <Text style={styles.rating}>
                  <Ionicons name="star" size={12} color="#f59e0b" /> {item.averageRating.toFixed(1)} (
                  {item.totalJobsCompleted} jobs)
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.btn, addingId === item.workerId && styles.btnDisabled]}
              onPress={() => add(item)}
              disabled={addingId === item.workerId}>
              {addingId === item.workerId ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.btnText}>Invite</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No unaffiliated workers found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  search: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.card,
    color: colors.foreground,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  workerInfo: { flex: 1 },
  name: { fontWeight: '600', color: colors.foreground, fontSize: 15 },
  meta: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
  rating: { color: colors.mutedForeground, fontSize: 11, marginTop: 4 },
  btn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: colors.primaryLighter ?? colors.primary, opacity: 0.6 },
  btnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', padding: 30, color: colors.mutedForeground },
});
