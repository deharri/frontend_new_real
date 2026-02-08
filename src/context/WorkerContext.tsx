import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { workersApi } from '../api/workers';
import { WorkerProfile } from '../types';
import { logger } from '../utils/logger';

const TAG = 'WorkerContext';

interface WorkerContextType {
  isWorkerMode: boolean;
  hasWorkerProfile: boolean;
  workerProfile: WorkerProfile | null;
  isLoadingWorker: boolean;
  switchToWorkerMode: () => void;
  switchToCustomerMode: () => void;
  fetchWorkerProfile: () => Promise<void>;
  clearWorkerState: () => Promise<void>;
}

const WorkerContext = createContext<WorkerContextType | undefined>(undefined);

export function WorkerProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [isWorkerMode, setIsWorkerMode] = useState(false);
  const [hasWorkerProfile, setHasWorkerProfile] = useState(false);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [isLoadingWorker, setIsLoadingWorker] = useState(false);

  const fetchWorkerProfile = useCallback(async () => {
    setIsLoadingWorker(true);
    try {
      logger.info(TAG, 'Fetching worker profile...');
      const response = await workersApi.getMyWorkerProfile();
      setWorkerProfile(response.data);
      setHasWorkerProfile(true);
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
      loadModePreference();
    } else {
      setIsWorkerMode(false);
      setHasWorkerProfile(false);
      setWorkerProfile(null);
    }
  }, [isLoggedIn, fetchWorkerProfile]);

  const loadModePreference = async () => {
    try {
      const mode = await AsyncStorage.getItem('workerMode');
      if (mode === 'true') {
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

  const clearWorkerState = async () => {
    setIsWorkerMode(false);
    setHasWorkerProfile(false);
    setWorkerProfile(null);
    await AsyncStorage.removeItem('workerMode');
    logger.info(TAG, 'Worker state cleared');
  };

  return (
    <WorkerContext.Provider
      value={{
        isWorkerMode,
        hasWorkerProfile,
        workerProfile,
        isLoadingWorker,
        switchToWorkerMode,
        switchToCustomerMode,
        fetchWorkerProfile,
        clearWorkerState,
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
