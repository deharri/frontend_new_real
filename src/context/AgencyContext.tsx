import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { agenciesApi } from '../api/agencies';
import { AgencyProfile } from '../types';
import { logger } from '../utils/logger';

const TAG = 'AgencyContext';

interface AgencyContextType {
  agencyProfile: AgencyProfile | null;
  hasAgency: boolean;
  isAgencyActive: boolean;
  daysUntilExpiry: number | null;
  isLoadingAgency: boolean;
  isAgencyMode: boolean;
  refreshAgency: () => Promise<void>;
  clearAgencyState: () => void;
  switchToAgencyMode: () => void;
  switchToCustomerMode: () => void;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export function AgencyProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [agencyProfile, setAgencyProfile] = useState<AgencyProfile | null>(null);
  const [isLoadingAgency, setIsLoadingAgency] = useState(false);
  const [isAgencyMode, setIsAgencyMode] = useState(false);

  const refreshAgency = useCallback(async () => {
    setIsLoadingAgency(true);
    try {
      const response = await agenciesApi.getMyAgencyProfile();
      setAgencyProfile(response.data);
      logger.info(TAG, 'Agency profile loaded', {
        agencyId: response.data.agencyId,
        active: response.data.subscriptionActive,
      });
    } catch {
      setAgencyProfile(null);
      logger.info(TAG, 'No agency for current user');
    } finally {
      setIsLoadingAgency(false);
    }
  }, []);

  const loadMode = async () => {
    try {
      const mode = await AsyncStorage.getItem('agencyMode');
      if (mode === 'true') setIsAgencyMode(true);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      refreshAgency();
      loadMode();
    } else {
      setAgencyProfile(null);
      setIsAgencyMode(false);
    }
  }, [isLoggedIn, refreshAgency]);

  const hasAgency = !!agencyProfile;
  const isAgencyActive = !!agencyProfile?.subscriptionActive;

  // If the user enters agency mode but loses agency ownership/activeness, snap back.
  useEffect(() => {
    if (isAgencyMode && (!hasAgency || !isAgencyActive)) {
      setIsAgencyMode(false);
      AsyncStorage.setItem('agencyMode', 'false');
      logger.info(TAG, 'Agency mode auto-disabled (no active agency)');
    }
  }, [isAgencyMode, hasAgency, isAgencyActive]);

  const clearAgencyState = () => {
    setAgencyProfile(null);
    setIsAgencyMode(false);
    AsyncStorage.removeItem('agencyMode');
  };

  const switchToAgencyMode = () => {
    setIsAgencyMode(true);
    AsyncStorage.setItem('agencyMode', 'true');
    logger.info(TAG, 'Switched to agency mode');
  };

  const switchToCustomerMode = () => {
    setIsAgencyMode(false);
    AsyncStorage.setItem('agencyMode', 'false');
    logger.info(TAG, 'Switched to customer mode (from agency)');
  };

  const daysUntilExpiry = agencyProfile?.subscriptionExpiresAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(agencyProfile.subscriptionExpiresAt).getTime() - Date.now()) /
            (24 * 60 * 60 * 1000),
        ),
      )
    : null;

  return (
    <AgencyContext.Provider
      value={{
        agencyProfile,
        hasAgency,
        isAgencyActive,
        daysUntilExpiry,
        isLoadingAgency,
        isAgencyMode,
        refreshAgency,
        clearAgencyState,
        switchToAgencyMode,
        switchToCustomerMode,
      }}
    >
      {children}
    </AgencyContext.Provider>
  );
}

export function useAgency() {
  const context = useContext(AgencyContext);
  if (!context) {
    throw new Error('useAgency must be used within an AgencyProvider');
  }
  return context;
}
