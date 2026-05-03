import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './client';
import { StartTrackingRequest, TrackingResponse } from '../types';

const CHAT_BASE_URL = BASE_URL.replace('/ums', '/chat');

const chatRestClient = axios.create({
  baseURL: CHAT_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

chatRestClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const trackingApi = {
  startTracking: (request: StartTrackingRequest): Promise<TrackingResponse> =>
    chatRestClient.post('/api/v1/tracking', request).then(r => r.data),

  getTracking: (sessionId: string): Promise<TrackingResponse> =>
    chatRestClient.get(`/api/v1/tracking/${sessionId}`).then(r => r.data),

  completeTracking: (sessionId: string): Promise<TrackingResponse> =>
    chatRestClient.put(`/api/v1/tracking/${sessionId}/complete`).then(r => r.data),
};
