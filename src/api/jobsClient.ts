import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './client';
import { logger } from '../utils/logger';

const TAG = 'JobsApiClient';

// Job service is at /jobs, not /ums
export const JOBS_BASE_URL = BASE_URL.replace('/ums', '/jobs');

const jobsApiClient = axios.create({
  baseURL: JOBS_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — attach token
jobsApiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    logger.api(TAG, `→ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '(no body)');
    return config;
  },
  (error) => {
    logger.error(TAG, 'Request interceptor error', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor — token refresh on 401
jobsApiClient.interceptors.response.use(
  (response) => {
    logger.api(TAG, `← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    logger.error(TAG, `← ${status || 'NETWORK_ERROR'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      message: error.message,
      responseData: error.response?.data,
    });

    const originalRequest = error.config;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) return Promise.reject(error);

        // Refresh via UMS (auth lives in user-mgmt-service)
        const response = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
          token: refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        logger.info(TAG, 'Token refreshed successfully');

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return jobsApiClient(originalRequest);
      } catch (refreshError: any) {
        logger.error(TAG, 'Token refresh failed', refreshError.message);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default jobsApiClient;
