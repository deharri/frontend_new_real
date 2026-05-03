import 'text-encoding';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { WorkerProvider } from './src/context/WorkerContext';
import { AgencyProvider } from './src/context/AgencyContext';
import { ChatProvider } from './src/context/ChatContext';
import { LocationProvider } from './src/context/LocationContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <WorkerProvider>
          <AgencyProvider>
            <ChatProvider>
              <LocationProvider>
                <StatusBar style="auto" />
                <AppNavigator />
              </LocationProvider>
            </ChatProvider>
          </AgencyProvider>
        </WorkerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
