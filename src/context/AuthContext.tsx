import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { LoginRequest, RegisterRequest, UserProfile } from '../types';

interface AuthContextType {
  isLoading: boolean;
  isLoggedIn: boolean;
  user: UserProfile | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        const storedUsername = await AsyncStorage.getItem('username');
        const response = await usersApi.getMyProfile();
        setUser({ ...response.data, username: storedUsername || undefined });
        setIsLoggedIn(true);
      }
    } catch {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginRequest) => {
    const response = await authApi.login(data);
    await AsyncStorage.setItem('accessToken', response.data.accessToken);
    await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    await AsyncStorage.setItem('username', data.username);
    try {
      const profileResponse = await usersApi.getMyProfile();
      setUser({ ...profileResponse.data, username: data.username });
    } catch {
      // Profile fetch may fail if user profile isn't fully set up yet
    }
    setIsLoggedIn(true);
  };

  const register = async (data: RegisterRequest) => {
    const response = await authApi.register(data);
    await AsyncStorage.setItem('accessToken', response.data.accessToken);
    await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    await AsyncStorage.setItem('username', data.username);
    setUser({
      userId: '',
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      email: null,
      phoneNumber: data.phoneNumber,
      profilePictureUrl: null,
    });
    setIsLoggedIn(true);
  };

  const logout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        await authApi.logout({ token: refreshToken });
      }
    } catch {
      // Ignore logout errors
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'workerMode', 'username']);
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  const refreshUser = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      const response = await usersApi.getMyProfile();
      setUser({ ...response.data, username: storedUsername || undefined });
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider value={{ isLoading, isLoggedIn, user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
