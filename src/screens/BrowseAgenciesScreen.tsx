import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { agenciesApi } from '../api/agencies';
import { AgencyListItem, RootStackParamList } from '../types';
import { colors } from '../theme/colors';

export function BrowseAgenciesScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<AgencyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await agenciesApi.getAllAgencies();
      setItems(r.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
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
      contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
      data={items}
      keyExtractor={(a) => a.agencyId}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => nav.navigate('AgencyProfile', { agencyId: item.agencyId })}
          activeOpacity={0.8}>
          <View style={styles.iconBox}>
            <Ionicons name="business" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.agencyName}</Text>
            <Text style={styles.meta}>
              {item.city} • {item.totalWorkers ?? 0} worker{item.totalWorkers === 1 ? '' : 's'}
            </Text>
            {item.averageRating > 0 && (
              <Text style={styles.rating}>
                <Ionicons name="star" size={12} color="#f59e0b" /> {item.averageRating.toFixed(1)} (
                {item.totalJobsCompleted} jobs done)
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', padding: 40 }}>
          <Ionicons name="business-outline" size={48} color={colors.mutedForeground} />
          <Text style={styles.empty}>No agencies available right now</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 6,
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  meta: { color: colors.mutedForeground, marginTop: 4, fontSize: 13 },
  rating: { color: colors.mutedForeground, marginTop: 4, fontSize: 12 },
  empty: { color: colors.mutedForeground, marginTop: 12 },
});
