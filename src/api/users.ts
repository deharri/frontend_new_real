import apiClient from './client';
import {
  UserProfile,
  UserPasswordUpdate,
  UserEmailUpdate,
  UserPhoneUpdate,
  UserNameUpdate,
  ResponseMessage,
} from '../types';

export const usersApi = {
  getMyProfile: () =>
    apiClient.get<UserProfile>('/api/v1/users/me'),

  getAllUsers: () =>
    apiClient.get<UserProfile[]>('/api/v1/users'),

  getUserById: (uuid: string) =>
    apiClient.get<UserProfile>(`/api/v1/users/${uuid}`),

  updateName: (data: UserNameUpdate) =>
    apiClient.put<ResponseMessage>('/api/v1/users/name', data),

  updatePassword: (data: UserPasswordUpdate) =>
    apiClient.put<ResponseMessage>('/api/v1/users/password', data),

  updateEmail: (data: UserEmailUpdate) =>
    apiClient.put<ResponseMessage>('/api/v1/users/email', data),

  updatePhone: (data: UserPhoneUpdate) =>
    apiClient.put<ResponseMessage>('/api/v1/users/phone', data),

  uploadProfilePicture: (file: FormData) =>
    apiClient.post<ResponseMessage>('/api/v1/users/picture', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getProfilePictureUrl: () =>
    apiClient.get('/api/v1/users/picture'),
};
