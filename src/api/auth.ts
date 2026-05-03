import apiClient from './client';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  SendOtpRequest,
  ResponseMessage,
} from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/login', data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/register', data),

  refresh: (data: RefreshTokenRequest) =>
    apiClient.post<AuthResponse>('/api/v1/auth/refresh', data),

  logout: (data: RefreshTokenRequest) =>
    apiClient.post<{ message: string }>('/api/v1/auth/logout', data),

  sendOtp: (data: SendOtpRequest) =>
    apiClient.post<ResponseMessage>('/api/v1/auth/send-otp', data),
};
