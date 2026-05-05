import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

const TAG = 'ApiClient';

// Production backend URL — hardcoded literal, no env-var indirection.
// Update this string and rebuild when the production IP/host changes.
const PROD_BACKEND_URL = 'http://35.244.16.253:8080/ums';

const getBaseUrl = () => {
  // Production builds always use the hardcoded URL — immune to any bundler /
  // env-injection quirk. Anything below this branch is dev-only.
  if (!__DEV__) {
    logger.info(TAG, `Base URL → production: ${PROD_BACKEND_URL}`);
    return PROD_BACKEND_URL;
  }

  // Dev: dynamic IP from the Expo dev server (Metro picks the host's LAN IP).
  const debuggerHost =
    Constants.expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost;

  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      const url = `http://${host}:8080/ums`;
      logger.info(TAG, `Base URL → local dev (${url})`);
      return url;
    }
    if (host === 'localhost' || host === '127.0.0.1') {
      const url = 'http://localhost:8080/ums';
      logger.info(TAG, `Base URL → adb reverse (${url})`);
      return url;
    }
  }

  // Dev fallback: Android emulator alias for the host's localhost.
  if (Platform.OS === 'android') {
    const url = 'http://10.0.2.2:8080/ums';
    logger.info(TAG, `Base URL → Android emulator fallback (${url})`);
    return url;
  }

  const url = 'http://localhost:8080/ums';
  logger.warn(TAG, `Base URL → localhost fallback — may not work on physical devices`);
  return url;
};

export const BASE_URL = getBaseUrl();

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — log + attach token
apiClient.interceptors.request.use(
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

// Response interceptor — log + token refresh
apiClient.interceptors.response.use(
  (response) => {
    logger.api(TAG, `← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const data = error.response?.data;

    logger.error(TAG, `← ${status || 'NETWORK_ERROR'} ${error.config?.method?.toUpperCase()} ${url}`, {
      message: error.message,
      responseData: data,
    });

    const originalRequest = error.config;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      logger.info(TAG, 'Access token expired, attempting refresh...');

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          logger.warn(TAG, 'No refresh token found, cannot refresh');
          return Promise.reject(error);
        }

        const response = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
          token: refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        logger.info(TAG, 'Token refreshed successfully');

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        logger.error(TAG, 'Token refresh failed', refreshError.message);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
