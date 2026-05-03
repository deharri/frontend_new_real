import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { workersApi } from '../api/workers';
import { subscriptionApi } from '../api/subscriptionApi';
import { WorkerProfile } from '../types';
import { logger } from '../utils/logger';

const TAG = 'WorkerContext';

const SUBSCRIPTION_DURATION_DAYS = 30;

interface SubscriptionData {
  expiresAt: string;
}

interface WorkerContextType {
  isWorkerMode: boolean;
  hasWorkerProfile: boolean;
  workerProfile: WorkerProfile | null;
  isLoadingWorker: boolean;
  isSubscribed: boolean;
  switchToWorkerMode: () => void;
  switchToCustomerMode: () => void;
  fetchWorkerProfile: () => Promise<void>;
  clearWorkerState: () => Promise<void>;
  activateSubscription: (paymentMethod: 'MOCK_CARD' | 'MOCK_BANK' | 'MOCK_WALLET', maskedDetails?: string) => Promise<void>;
}

const WorkerContext = createContext<WorkerContextType | undefined>(undefined);

function getSubscriptionKey(userId: string) {
  return `workerSubscription_${userId}`;
}

async function readSubscription(userId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(getSubscriptionKey(userId));
    if (!raw) return false;
    const data: SubscriptionData = JSON.parse(raw);
    return new Date(data.expiresAt) > new Date();
  } catch {
    return false;
  }
}

export function WorkerProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, user } = useAuth();
  const [isWorkerMode, setIsWorkerMode] = useState(false);
  const [hasWorkerProfile, setHasWorkerProfile] = useState(false);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [isLoadingWorker, setIsLoadingWorker] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const fetchWorkerProfile = useCallback(async () => {
    setIsLoadingWorker(true);
    try {
      logger.info(TAG, 'Fetching worker profile...');
      const response = await workersApi.getMyWorkerProfile();
      setWorkerProfile(response.data);
      setHasWorkerProfile(true);

      // Sync subscription from backend — source of truth is subscriptionActive on the profile
      if (response.data.subscriptionActive && response.data.subscriptionExpiresAt) {
        setIsSubscribed(true);
        // Keep AsyncStorage in sync so offline checks also work
        const userId = response.data.userId;
        if (userId) {
          const data: SubscriptionData = { expiresAt: response.data.subscriptionExpiresAt };
          await AsyncStorage.setItem(getSubscriptionKey(userId), JSON.stringify(data));
        }
        logger.info(TAG, 'Subscription synced from backend', { expires: response.data.subscriptionExpiresAt });
      } else {
        setIsSubscribed(false);
      }

      logger.info(TAG, 'Worker profile found', { workerId: response.data.workerId });
    } catch {
      setWorkerProfile(null);
      setHasWorkerProfile(false);
      logger.info(TAG, 'No worker profile found');
    } finally {
      setIsLoadingWorker(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchWorkerProfile();
      loadModeAndSubscription();
    } else {
      setIsWorkerMode(false);
      setHasWorkerProfile(false);
      setWorkerProfile(null);
      setIsSubscribed(false);
    }
  }, [isLoggedIn, fetchWorkerProfile]);

  const loadModeAndSubscription = async () => {
    try {
      const mode = await AsyncStorage.getItem('workerMode');
      if (mode === 'true') {
        // workerMode pref exists — subscription will be set by fetchWorkerProfile
        // so just restore the mode flag; the subscription gate will correct it if needed
        setIsWorkerMode(true);
      }
    } catch {
      // Ignore
    }
  };

  const switchToWorkerMode = () => {
    setIsWorkerMode(true);
    AsyncStorage.setItem('workerMode', 'true');
    logger.info(TAG, 'Switched to worker mode');
  };

  const switchToCustomerMode = () => {
    setIsWorkerMode(false);
    AsyncStorage.setItem('workerMode', 'false');
    logger.info(TAG, 'Switched to customer mode');
  };

  const activateSubscription = async (
    paymentMethod: 'MOCK_CARD' | 'MOCK_BANK' | 'MOCK_WALLET',
    maskedDetails?: string
  ): Promise<void> => {
    const subscription = await subscriptionApi.pay({ paymentMethod, maskedDetails });
    const expiresAt = subscription.expiresAt;

    const userId = user?.userId;
    if (userId) {
      const data: SubscriptionData = { expiresAt };
      await AsyncStorage.setItem(getSubscriptionKey(userId), JSON.stringify(data));
    }
    setIsSubscribed(true);
    logger.info(TAG, 'Worker subscription activated via backend', { expiresAt });
  };

  const clearWorkerState = async () => {
    setIsWorkerMode(false);
    setHasWorkerProfile(false);
    setWorkerProfile(null);
    setIsSubscribed(false);
    await AsyncStorage.removeItem('workerMode');
    if (user?.userId) {
      await AsyncStorage.removeItem(getSubscriptionKey(user.userId));
    }
    logger.info(TAG, 'Worker state cleared');
  };

  return (
    <WorkerContext.Provider
      value={{
        isWorkerMode,
        hasWorkerProfile,
        workerProfile,
        isLoadingWorker,
        isSubscribed,
        switchToWorkerMode,
        switchToCustomerMode,
        fetchWorkerProfile,
        clearWorkerState,
        activateSubscription,
      }}
    >
      {children}
    </WorkerContext.Provider>
  );
}

export function useWorker() {
  const context = useContext(WorkerContext);
  if (!context) {
    throw new Error('useWorker must be used within a WorkerProvider');
  }
  return context;
}
