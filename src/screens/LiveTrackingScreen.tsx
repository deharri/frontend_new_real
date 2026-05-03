import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Client as StompClient } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useLocation } from '../context/LocationContext';
import { trackingApi } from '../api/trackingApi';
import { TrackingResponse, LocationUpdate, RootStackParamList } from '../types';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../api/client';
import { useWorker } from '../context/WorkerContext';

const TAG = 'LiveTracking';

type LiveTrackingRouteProp = RouteProp<RootStackParamList, 'LiveTracking'>;

export function LiveTrackingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<LiveTrackingRouteProp>();
  const { sessionId, isWorker } = route.params;

  const { currentLocation, startWatching, stopWatching } = useLocation();
  const { isWorkerMode } = useWorker();

  const [tracking, setTracking] = useState<TrackingResponse | null>(null);
  const [workerCoords, setWorkerCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const stompRef = useRef<StompClient | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentLocationRef = useRef(currentLocation);

  useEffect(() => {
    currentLocationRef.current = currentLocation;
  }, [currentLocation]);

  useEffect(() => {
    initTracking();
    return () => cleanup();
  }, []);

  const CHAT_WS_URL = BASE_URL.replace('/ums', '/chat') + '/ws/chat';

  const initTracking = async () => {
    try {
      const session = await trackingApi.getTracking(sessionId);
      setTracking(session);
      if (session.workerLatitude && session.workerLongitude) {
        setWorkerCoords({ latitude: session.workerLatitude, longitude: session.workerLongitude });
      }

      const token = await AsyncStorage.getItem('accessToken');
      if (token) connectWebSocket(token);

      if (isWorker) {
        await startWatching();
        locationIntervalRef.current = setInterval(() => {
          const loc = currentLocationRef.current;
          if (loc && stompRef.current?.connected) {
            const update: LocationUpdate = {
              latitude: loc.latitude,
              longitude: loc.longitude,
              timestamp: Date.now(),
            };
            stompRef.current.publish({
              destination: `/app/tracking/${sessionId}/update`,
              body: JSON.stringify(update),
            });
          }
        }, 5000);
      }
    } catch (e) {
      logger.error(TAG, 'Failed to init tracking', e);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = (token: string) => {
    const client = new StompClient({
      webSocketFactory: () => new SockJS(`${CHAT_WS_URL}?token=${token}`),
      onConnect: () => {
        logger.info(TAG, 'Tracking WebSocket connected');
        client.subscribe(`/topic/tracking/${sessionId}`, (msg) => {
          const update: LocationUpdate = JSON.parse(msg.body);
          if (update.latitude === -1 && update.longitude === -1) {
            setCompleted(true);
            return;
          }
          setWorkerCoords({ latitude: update.latitude, longitude: update.longitude });
        });
      },
      onDisconnect: () => logger.info(TAG, 'Tracking WebSocket disconnected'),
    });
    client.activate();
    stompRef.current = client;
  };

  const cleanup = () => {
    stompRef.current?.deactivate();
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    if (isWorker) stopWatching();
  };

  const handleComplete = () => {
    Alert.alert('Complete Job', 'Mark this job as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          try {
            await trackingApi.completeTracking(sessionId);
            setCompleted(true);
            cleanup();
          } catch (e) {
            Alert.alert('Error', 'Failed to complete tracking.');
          }
        },
      },
    ]);
  };

  const customerCoords = tracking
    ? { latitude: tracking.customerLatitude, longitude: tracking.customerLongitude }
    : null;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading tracking session...</Text>
      </View>
    );
  }

  if (completed) {
    return (
      <View style={styles.centered}>
        <Ionicons name="checkmark-circle" size={64} color={colors.green600} />
        <Text style={styles.completedTitle}>Job Completed!</Text>
        <Text style={styles.completedSub}>The tracking session has ended.</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.doneBtnText}>Back to Chat</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initialLat = workerCoords?.latitude ?? customerCoords?.latitude ?? 33.6844;
  const initialLng = workerCoords?.longitude ?? customerCoords?.longitude ?? 73.0479;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.slate700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isWorker ? 'Job in Progress' : 'Tracking Worker'}
        </Text>
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={{
          latitude: initialLat,
          longitude: initialLng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {workerCoords && (
          <Marker coordinate={workerCoords} title="Worker" pinColor={colors.primary} />
        )}
        {customerCoords && (
          <Marker coordinate={customerCoords} title="Customer" pinColor={colors.green600} />
        )}
        {workerCoords && customerCoords && (
          <Polyline
            coordinates={[workerCoords, customerCoords]}
            strokeColor={colors.primary}
            strokeWidth={2}
            lineDashPattern={[8, 4]}
          />
        )}
      </MapView>

      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.statusLabel}>Worker</Text>
          <Text style={styles.statusValue}>{workerCoords ? 'Live' : 'Waiting...'}</Text>
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { backgroundColor: colors.green600 }]} />
          <Text style={styles.statusLabel}>Customer</Text>
          <Text style={styles.statusValue}>At location</Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
          <Ionicons name="checkmark-circle" size={20} color={colors.white} />
          <Text style={styles.completeBtnText}>Mark Job Complete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate50 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 15, color: colors.slate500 },
  completedTitle: { fontSize: 24, fontWeight: '700', color: colors.slate900, marginTop: 16 },
  completedSub: { fontSize: 14, color: colors.slate500, marginTop: 8, marginBottom: 24 },
  doneBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  doneBtnText: { fontSize: 16, fontWeight: '600', color: colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.slate200,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.slate100, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 17, fontWeight: '600', color: colors.slate900,
  },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.red50, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red600 },
  liveText: { fontSize: 11, fontWeight: '700', color: colors.red600 },
  map: { flex: 1 },
  workerPin: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: colors.white,
  },
  customerPin: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.green600, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  statusBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, paddingVertical: 12, paddingHorizontal: 24,
    borderTopWidth: 1, borderTopColor: colors.slate100,
  },
  statusItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 13, color: colors.slate500 },
  statusValue: { fontSize: 13, fontWeight: '600', color: colors.slate700, marginLeft: 'auto' as any },
  statusDivider: { width: 1, height: 32, backgroundColor: colors.slate200, marginHorizontal: 16 },
  footer: {
    backgroundColor: colors.white, paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.slate200,
  },
  completeBtn: {
    backgroundColor: colors.green600, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  completeBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
});
