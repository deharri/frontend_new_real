import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ChatsScreen } from '../screens/ChatsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { WorkerDetailScreen } from '../screens/WorkerDetailScreen';
import { CreateWorkerProfileScreen } from '../screens/CreateWorkerProfileScreen';
import { EditWorkerProfileScreen } from '../screens/EditWorkerProfileScreen';
import { WorkerBookingDetailScreen } from '../screens/WorkerBookingDetailScreen';
import { WorkerDashboardScreen } from '../screens/WorkerDashboardScreen';
import { WorkerProfileViewScreen } from '../screens/WorkerProfileViewScreen';
import { colors } from '../theme/colors';
import { RootStackParamList, MainTabParamList, WorkerTabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const WorkerTab = createBottomTabNavigator<WorkerTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          switch (route.name) {
            case 'Services':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Messages':
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.slate400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.slate200,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 28,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Services" component={DashboardScreen} />
      <Tab.Screen name="Messages" component={ChatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function WorkerTabs() {
  return (
    <WorkerTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          switch (route.name) {
            case 'WorkerDashboard':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'WorkerRequests':
              iconName = focused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'WorkerMessages':
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
              break;
            case 'WorkerProfile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'grid-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.green600,
        tabBarInactiveTintColor: colors.slate400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.slate200,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 28,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <WorkerTab.Screen name="WorkerDashboard" component={WorkerDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <WorkerTab.Screen name="WorkerRequests" component={WorkerDashboardScreen} options={{ tabBarLabel: 'Requests' }} />
      <WorkerTab.Screen name="WorkerMessages" component={ChatsScreen} options={{ tabBarLabel: 'Messages' }} />
      <WorkerTab.Screen name="WorkerProfile" component={WorkerProfileViewScreen} options={{ tabBarLabel: 'Profile' }} />
    </WorkerTab.Navigator>
  );
}

export function AppNavigator() {
  const { isLoading, isLoggedIn } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="WorkerTabs" component={WorkerTabs} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="WorkerDetail" component={WorkerDetailScreen} />
            <Stack.Screen name="CreateWorkerProfile" component={CreateWorkerProfileScreen} />
            <Stack.Screen name="EditWorkerProfile" component={EditWorkerProfileScreen} />
            <Stack.Screen name="WorkerBookingDetail" component={WorkerBookingDetailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.slate50,
  },
});
