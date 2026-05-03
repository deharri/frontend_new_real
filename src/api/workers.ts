import apiClient from './client';
import {
  WorkerListItem,
  WorkerProfile,
  CreateWorkerAccount,
  UpdateWorkerProfile,
  UpdateAvailability,
  WorkerTypeInfo,
  ResponseMessage,
  NearbyWorkerListItem,
} from '../types';

export const workersApi = {
  getAllWorkers: () =>
    apiClient.get<WorkerListItem[]>('/api/v1/workers'),

  getWorkerById: (workerId: string) =>
    apiClient.get<WorkerProfile>(`/api/v1/workers/${workerId}`),

  getWorkerByUserId: (userId: string) =>
    apiClient.get<WorkerProfile>(`/api/v1/workers/by-user/${userId}`),

  getMyWorkerProfile: () =>
    apiClient.get<WorkerProfile>('/api/v1/workers/me'),

  createWorkerAccount: (data: CreateWorkerAccount) =>
    apiClient.post<ResponseMessage>('/api/v1/workers/create', data),

  updateMyWorkerProfile: (data: UpdateWorkerProfile) =>
    apiClient.put<ResponseMessage>('/api/v1/workers/me', data),

  updateAvailability: (data: UpdateAvailability) =>
    apiClient.put<WorkerProfile>('/api/v1/workers/me/availability', data),

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

  getNearbyWorkers: (
    lat: number,
    lng: number,
    radiusKm: number,
    workerType?: string
  ): Promise<NearbyWorkerListItem[]> => {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radiusKm: radiusKm.toString(),
    });
    if (workerType) params.append('workerType', workerType);
    return apiClient.get(`/api/v1/workers/nearby?${params}`).then(r => r.data);
  },
};
