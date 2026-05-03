import React, { useRef } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { WorkerDashboardScreen } from '../screens/WorkerDashboardScreen';
import { WorkerProfileViewScreen } from '../screens/WorkerProfileViewScreen';
import { ChatDetailScreen } from '../screens/ChatDetailScreen';
import { BrowseJobsScreen } from '../screens/BrowseJobsScreen';
import { JobListingDetailScreen } from '../screens/JobListingDetailScreen';
import { CreateJobListingScreen } from '../screens/CreateJobListingScreen';
import { MyListingsScreen } from '../screens/MyListingsScreen';
import { PlaceBidScreen } from '../screens/PlaceBidScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { LeaveReviewScreen } from '../screens/LeaveReviewScreen';
import { WorkerSubscriptionScreen } from '../screens/WorkerSubscriptionScreen';
import { NearbyWorkersMapScreen } from '../screens/NearbyWorkersMapScreen';
import { LiveTrackingScreen } from '../screens/LiveTrackingScreen';
import { CreateAgencyScreen } from '../screens/CreateAgencyScreen';
import { AgencySubscriptionPaymentScreen } from '../screens/AgencySubscriptionPaymentScreen';
import { AgencyDashboardScreen } from '../screens/AgencyDashboardScreen';
import { AgencyWorkersScreen } from '../screens/AgencyWorkersScreen';
import { AddWorkerScreen } from '../screens/AddWorkerScreen';
import { MyAgencyInvitationsScreen } from '../screens/MyAgencyInvitationsScreen';
import { BrowseAgenciesScreen } from '../screens/BrowseAgenciesScreen';
import JobPaymentScreen from '../screens/JobPaymentScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import PaymentDetailScreen from '../screens/PaymentDetailScreen';
import ResolutionCenterScreen from '../screens/ResolutionCenterScreen';
import SubmitDisputeScreen from '../screens/SubmitDisputeScreen';
import DisputeDetailScreen from '../screens/DisputeDetailScreen';
import { AgencyProfileScreen } from '../screens/AgencyProfileScreen';
import { OtpVerificationScreen } from '../screens/OtpVerificationScreen';
import { useChat } from '../context/ChatContext';
import { colors } from '../theme/colors';
import { RootStackParamList, MainTabParamList, WorkerTabParamList, AgencyTabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const WorkerTab = createBottomTabNavigator<WorkerTabParamList>();
const AgencyTab = createBottomTabNavigator<AgencyTabParamList>();

function MainTabs() {
  const { totalUnread } = useChat();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + insets.bottom;
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
            case 'Listings':
              iconName = focused ? 'document-text' : 'document-text-outline';
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
          height: tabBarHeight,
          paddingBottom: insets.bottom,
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
      <Tab.Screen name="Listings" component={MyListingsScreen} />
      <Tab.Screen
        name="Messages"
        component={ChatsScreen}
        options={{
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.destructive, fontSize: 11 },
        }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function WorkerTabs() {
  const { totalUnread } = useChat();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + insets.bottom;
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
          height: tabBarHeight,
          paddingBottom: insets.bottom,
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
      <WorkerTab.Screen name="WorkerRequests" component={BrowseJobsScreen} options={{ tabBarLabel: 'Find Jobs' }} />
      <WorkerTab.Screen
        name="WorkerMessages"
        component={ChatsScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.destructive, fontSize: 11 },
        }}
      />
      <WorkerTab.Screen name="WorkerProfile" component={WorkerProfileViewScreen} options={{ tabBarLabel: 'Profile' }} />
    </WorkerTab.Navigator>
  );
}

function AgencyTabs() {
  const { totalUnread } = useChat();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + insets.bottom;
  return (
    <AgencyTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          switch (route.name) {
            case 'AgencyDashboard':
              iconName = focused ? 'business' : 'business-outline';
              break;
            case 'AgencyFindJobs':
              iconName = focused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'AgencyMessages':
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
              break;
            case 'AgencyProfile':
              iconName = focused ? 'person-circle' : 'person-circle-outline';
              break;
            default:
              iconName = 'business-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.slate400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.slate200,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      })}
    >
      <AgencyTab.Screen name="AgencyDashboard" component={AgencyDashboardScreen} options={{ tabBarLabel: 'Agency' }} />
      <AgencyTab.Screen name="AgencyFindJobs" component={BrowseJobsScreen} options={{ tabBarLabel: 'Find Jobs' }} />
      <AgencyTab.Screen
        name="AgencyMessages"
        component={ChatsScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.destructive, fontSize: 11 },
        }}
      />
      <AgencyTab.Screen name="AgencyProfile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </AgencyTab.Navigator>
  );
}

export function AppNavigator() {
  const { isLoading, isLoggedIn } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="WorkerTabs" component={WorkerTabs} />
            <Stack.Screen name="AgencyTabs" component={AgencyTabs} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="WorkerDetail" component={WorkerDetailScreen} />
            <Stack.Screen name="CreateWorkerProfile" component={CreateWorkerProfileScreen} />
            <Stack.Screen name="EditWorkerProfile" component={EditWorkerProfileScreen} />
            <Stack.Screen name="JobListingDetail" component={JobListingDetailScreen} />
            <Stack.Screen name="CreateJobListing" component={CreateJobListingScreen} />
            <Stack.Screen name="PlaceBid" component={PlaceBidScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="LeaveReview" component={LeaveReviewScreen} />
            <Stack.Screen name="WorkerSubscription" component={WorkerSubscriptionScreen} />
            <Stack.Screen name="NearbyWorkersMap" component={NearbyWorkersMapScreen} options={{ headerShown: false }} />
            <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreateAgency" component={CreateAgencyScreen} options={{ headerShown: true, title: 'Create Agency' }} />
            <Stack.Screen name="AgencySubscriptionPayment" component={AgencySubscriptionPaymentScreen} options={{ headerShown: true, title: 'Pay Subscription' }} />
            <Stack.Screen name="AgencyDashboard" component={AgencyDashboardScreen} options={{ headerShown: true, title: 'Agency Dashboard' }} />
            <Stack.Screen name="AgencyWorkers" component={AgencyWorkersScreen} options={{ headerShown: true, title: 'Workers' }} />
            <Stack.Screen name="AddWorker" component={AddWorkerScreen} options={{ headerShown: true, title: 'Invite Worker' }} />
            <Stack.Screen name="MyAgencyInvitations" component={MyAgencyInvitationsScreen} options={{ headerShown: true, title: 'Agency Invitations' }} />
            <Stack.Screen name="BrowseAgencies" component={BrowseAgenciesScreen} options={{ headerShown: true, title: 'Agencies' }} />
            <Stack.Screen name="AgencyProfile" component={AgencyProfileScreen} options={{ headerShown: true, title: 'Agency' }} />
            <Stack.Screen name="JobPayment" component={JobPaymentScreen} options={{ headerShown: true, title: 'Pay for job' }} />
            <Stack.Screen name="Payments" component={PaymentsScreen} options={{ headerShown: true, title: 'Payments' }} />
            <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} options={{ headerShown: true, title: 'Payment' }} />
            <Stack.Screen name="ResolutionCenter" component={ResolutionCenterScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SubmitDispute" component={SubmitDisputeScreen} options={{ headerShown: true, title: 'Report an issue' }} />
            <Stack.Screen name="DisputeDetail" component={DisputeDetailScreen} options={{ headerShown: true, title: 'Dispute' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} options={{ headerShown: true, title: 'Verify Phone' }} />
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
