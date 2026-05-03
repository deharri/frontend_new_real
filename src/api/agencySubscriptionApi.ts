import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './client';
import { AgencySubscription, PayAgencySubscriptionRequest } from '../types';

const PAYMENT_BASE_URL = BASE_URL.replace('/ums', '/payments');

const paymentClient = axios.create({
  baseURL: PAYMENT_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

paymentClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const agencySubscriptionApi = {
  pay: (request: PayAgencySubscriptionRequest): Promise<AgencySubscription> =>
    paymentClient.post('/api/v1/agency-subscriptions/pay', request).then(r => r.data),

  getForAgency: (agencyId: string): Promise<AgencySubscription> =>
    paymentClient.get(`/api/v1/agency-subscriptions/${agencyId}`).then(r => r.data),
};
