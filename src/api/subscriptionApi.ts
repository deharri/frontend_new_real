import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './client';
import { PaySubscriptionRequest, SubscriptionResponse } from '../types';

const PAYMENT_BASE_URL = BASE_URL.replace('/ums', '/payments');

export const paymentClient = axios.create({
  baseURL: PAYMENT_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

paymentClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const subscriptionApi = {
  pay: (request: PaySubscriptionRequest): Promise<SubscriptionResponse> =>
    paymentClient.post('/api/v1/subscriptions/pay', request).then(r => r.data),

  getMySubscription: (): Promise<SubscriptionResponse> =>
    paymentClient.get('/api/v1/subscriptions/me').then(r => r.data),
};
