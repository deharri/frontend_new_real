import apiClient from './client';
import {
  WorkerListItem,
  WorkerProfile,
  CreateWorkerAccount,
  UpdateWorkerProfile,
  WorkerTypeInfo,
  ResponseMessage,
} from '../types';

export const workersApi = {
  getAllWorkers: () =>
    apiClient.get<WorkerListItem[]>('/api/v1/workers'),

  getWorkerById: (workerId: string) =>
    apiClient.get<WorkerProfile>(`/api/v1/workers/${workerId}`),

  getMyWorkerProfile: () =>
    apiClient.get<WorkerProfile>('/api/v1/workers/me'),

  createWorkerAccount: (data: CreateWorkerAccount) =>
    apiClient.post<ResponseMessage>('/api/v1/workers/create', data),

  updateMyWorkerProfile: (data: UpdateWorkerProfile) =>
    apiClient.put<ResponseMessage>('/api/v1/workers/me', data),

  submitCnicVerification: (formData: FormData) =>
    apiClient.post<ResponseMessage>('/api/v1/workers/verify/cnic', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadPortfolioImage: (formData: FormData) =>
    apiClient.post<ResponseMessage>('/api/v1/workers/portfolio/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deletePortfolioImage: (imagePath: string) =>
    apiClient.delete<ResponseMessage>('/api/v1/workers/portfolio', {
      params: { imagePath },
    }),

  // Public endpoint — no auth needed
  getAllWorkerTypes: () =>
    apiClient.get<WorkerTypeInfo[]>('/public/api/v1/workers/types/all'),
};
