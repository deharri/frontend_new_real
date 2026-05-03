import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/users';
import { colors } from '../theme/colors';
import { logger } from '../utils/logger';
import { RootStackParamList } from '../types';

const TAG = 'EditProfile';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;
};

export function EditProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();

  // Profile picture
  const [picLoading, setPicLoading] = useState(false);
  const [localPicUri, setLocalPicUri] = useState<string | null>(null);

  // Name update
  const [newFirstName, setNewFirstName] = useState(user?.firstName || '');
  const [newLastName, setNewLastName] = useState(user?.lastName || '');
  const [oldPasswordForName, setOldPasswordForName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  // Password update
  const [oldPasswordForPwd, setOldPasswordForPwd] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Email update
  const [oldPasswordForEmail, setOldPasswordForEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Phone update (two-step: send OTP, then verify)
  const [oldPasswordForPhone, setOldPasswordForPhone] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  const showResult = (title: string, success: boolean, message: string) => {
    Alert.alert(success ? title : 'Error', message);
  };

  const extractErrorMessage = (error: any): string => {
    const data = error.response?.data;
    if (data?.errors) {
      const fieldErrors = Object.values(data.errors).join('\n');
      return fieldErrors || data.message || 'Validation failed';
    }
    return data?.message || error.message || 'Something went wrong';
  };

  const handlePickImage = async () => {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      return Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setLocalPicUri(asset.uri);
    setPicLoading(true);

    try {
      logger.info(TAG, 'Uploading profile picture...');
      const formData = new FormData();
      const filename = asset.uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('picture', {
        uri: asset.uri,
        name: filename,
        type,
      } as any);

      const res = await usersApi.uploadProfilePicture(formData);
      logger.info(TAG, 'Profile picture uploaded', res.data);
      showResult('Success', true, res.data.message || 'Profile picture updated!');
      await refreshUser();
    } catch (error: any) {
      const msg = extractErrorMessage(error);
      logger.error(TAG, 'Picture upload failed', msg);
      showResult('Error', false, msg);
      setLocalPicUri(null);
    } finally {
      setPicLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    const permResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permResult.granted) {
      return Alert.alert('Permission Required', 'Please allow camera access to take a profile picture.');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setLocalPicUri(asset.uri);
    setPicLoading(true);

    try {
      logger.info(TAG, 'Uploading camera picture...');
      const formData = new FormData();
      const filename = asset.uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('picture', {
        uri: asset.uri,
        name: filename,
        type,
      } as any);

      const res = await usersApi.uploadProfilePicture(formData);
      logger.info(TAG, 'Camera picture uploaded', res.data);
      showResult('Success', true, res.data.message || 'Profile picture updated!');
      await refreshUser();
    } catch (error: any) {
      const msg = extractErrorMessage(error);
      logger.error(TAG, 'Camera picture upload failed', msg);
      showResult('Error', false, msg);
      setLocalPicUri(null);
    } finally {
      setPicLoading(false);
    }
  };

  const handleChangePicture = () => {
    Alert.alert('Change Profile Picture', 'Choose an option', [
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Choose from Library', onPress: handlePickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleNameUpdate = async () => {
    if (!newFirstName.trim() || !newLastName.trim()) {
      return showResult('Error', false, 'First name and last name are required');
    }
    if (!oldPasswordForName) {
      return showResult('Error', false, 'Please enter your current password');
    }
    setNameLoading(true);
    try {
      logger.info(TAG, 'Updating name...');
      const res = await usersApi.updateName({
        oldPassword: oldPasswordForName,
        newFirstName: newFirstName.trim(),
        newLastName: newLastName.trim(),
      });
      logger.info(TAG, 'Name updated', res.data);
      showResult('Success', true, res.data.message || 'Name updated successfully');
      setOldPasswordForName('');
      await refreshUser();
    } catch (error: any) {
      const msg = extractErrorMessage(error);
      logger.error(TAG, 'Name update failed', msg);
      showResult('Error', false, msg);
    } finally {
      setNameLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!oldPasswordForPwd || !newPassword || !confirmNewPassword) {
      return showResult('Error', false, 'Please fill in all password fields');
    }
    if (newPassword !== confirmNewPassword) {
      return showResult('Error', false, 'New passwords do not match');
    }
    setPwdLoading(true);
    try {
      logger.info(TAG, 'Updating password...');
      const res = await usersApi.updatePassword({ oldPassword: oldPasswordForPwd, newPassword });
      logger.info(TAG, 'Password updated', res.data);
      showResult('Success', true, res.data.message || 'Password updated successfully');
      setOldPasswordForPwd('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      const msg = extractErrorMessage(error);
      logger.error(TAG, 'Password update failed', msg);
      showResult('Error', false, msg);
    } finally {
      setPwdLoading(false);
    }
  };

  const handleEmailUpdate = async () => {
    if (!oldPasswordForEmail || !newEmail) {
      return showResult('Error', false, 'Please fill in password and new email');
    }
    setEmailLoading(true);
    try {
      logger.info(TAG, 'Updating email...');
      const res = await usersApi.updateEmail({ oldPassword: oldPasswordForEmail, newEmail });
      logger.info(TAG, 'Email updated', res.data);
      showResult('Success', true, res.data.message || 'Email updated successfully');
      setOldPasswordForEmail('');
      setNewEmail('');
      await refreshUser();
    } catch (error: any) {
      const msg = extractErrorMessage(error);
      logger.error(TAG, 'Email update failed', msg);
      showResult('Error', false, msg);
    } finally {
      setEmailLoading(false);
    }
  };

  // SMS OTP verification disabled — single-step phone update.
  // To re-enable, restore the two-step handleSendPhoneOtp + handlePhoneUpdate flow
  // (see git history) and pass otpCode in the updatePhone call.
  const handlePhoneUpdate = async () => {
    if (!oldPasswordForPhone || !newPhone) {
      return showResult('Error', false, 'Please fill in password and new phone number');
    }
    setPhoneLoading(true);
    try {
      logger.info(TAG, 'Updating phone...');
      const res = await usersApi.updatePhone({
        oldPassword: oldPasswordForPhone,
        newPhoneNumber: newPhone,
        otpCode: '',
      });
      logger.info(TAG, 'Phone updated', res.data);
      showResult('Success', true, res.data.message || 'Phone number updated successfully');
      setOldPasswordForPhone('');
      setNewPhone('');
      await refreshUser();
    } catch (error: any) {
      const msg = extractErrorMessage(error);
      logger.error(TAG, 'Phone update failed', msg);
      showResult('Error', false, msg);
    } finally {
      setPhoneLoading(false);
    }
  };

  const firstName = user?.firstName || 'U';
  const lastName = user?.lastName || '';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  const avatarSource = localPicUri || user?.profilePictureUrl;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ paddingTop: insets.top }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.slate900} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Profile Picture */}
        <View style={styles.pictureSection}>
          <TouchableOpacity onPress={handleChangePicture} activeOpacity={0.8} disabled={picLoading}>
            <View style={styles.avatarContainer}>
              {avatarSource ? (
                <Image source={{ uri: avatarSource }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
              {picLoading ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color={colors.white} />
                </View>
              ) : (
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={16} color={colors.white} />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.changePicText}>Tap to change photo</Text>
        </View>

        {/* Current Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionLabel}>Current Info</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={16} color={colors.primary} />
            <Text style={styles.infoText}>{user?.firstName} {user?.lastName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={16} color={colors.primary} />
            <Text style={styles.infoText}>{user?.email || 'No email set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={16} color={colors.primary} />
            <Text style={styles.infoText}>{user?.phoneNumber || 'No phone set'}</Text>
          </View>
        </View>

        {/* Update Name */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#e0e7ff' }]}>
              <Ionicons name="person" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Change Name</Text>
          </View>

          <View style={styles.nameRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor={colors.gray400}
                  value={newFirstName}
                  onChangeText={setNewFirstName}
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor={colors.gray400}
                  value={newLastName}
                  onChangeText={setNewLastName}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password to confirm"
                placeholderTextColor={colors.gray400}
                value={oldPasswordForName}
                onChangeText={setOldPasswordForName}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleNameUpdate}
            disabled={nameLoading}
          >
            {nameLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.actionButtonText}>Update Name</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Update Password */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="lock-closed" size={18} color={colors.red600} />
            </View>
            <Text style={styles.sectionTitle}>Change Password</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor={colors.gray400}
                value={oldPasswordForPwd}
                onChangeText={setOldPasswordForPwd}
                secureTextEntry={!showOldPwd}
              />
              <TouchableOpacity onPress={() => setShowOldPwd(!showOldPwd)}>
                <Ionicons name={showOldPwd ? 'eye-off' : 'eye'} size={20} color={colors.gray400} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Min 8 chars, uppercase, lowercase, number, special"
                placeholderTextColor={colors.gray400}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPwd}
              />
              <TouchableOpacity onPress={() => setShowNewPwd(!showNewPwd)}>
                <Ionicons name={showNewPwd ? 'eye-off' : 'eye'} size={20} color={colors.gray400} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                placeholderTextColor={colors.gray400}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.red600 }]}
            onPress={handlePasswordUpdate}
            disabled={pwdLoading}
          >
            {pwdLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.actionButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Update Email */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.blue50 }]}>
              <Ionicons name="mail" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Change Email</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={colors.gray400}
                value={oldPasswordForEmail}
                onChangeText={setOldPasswordForEmail}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={colors.gray400} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="new-email@example.com"
                placeholderTextColor={colors.gray400}
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleEmailUpdate}
            disabled={emailLoading}
          >
            {emailLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.actionButtonText}>Update Email</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Update Phone */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.green100 }]}>
              <Ionicons name="call" size={18} color={colors.green600} />
            </View>
            <Text style={styles.sectionTitle}>Change Phone Number</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={colors.gray400}
                value={oldPasswordForPhone}
                onChangeText={setOldPasswordForPhone}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Phone Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={colors.gray400} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="+923001234567"
                placeholderTextColor={colors.gray400}
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.green600 }]}
            onPress={handlePhoneUpdate}
            disabled={phoneLoading}
          >
            {phoneLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.actionButtonText}>Update Phone</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate50,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.slate900,
  },
  pictureSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '700',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  changePicText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate500,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  infoText: {
    fontSize: 15,
    color: colors.slate700,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.slate200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate900,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.slate700,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 12,
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.foreground,
  },
  actionButton: {
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
