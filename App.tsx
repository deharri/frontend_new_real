import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { WorkerProvider } from './src/context/WorkerContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WorkerProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </WorkerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
