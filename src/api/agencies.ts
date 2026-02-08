import apiClient from './client';
import {
  AgencyListItem,
  AgencyProfile,
  CreateAgency,
  UpdateAgency,
  ResponseMessage,
} from '../types';

export const agenciesApi = {
  getAllAgencies: () =>
    apiClient.get<AgencyListItem[]>('/api/v1/agencies'),

  getAgencyById: (agencyId: string) =>
    apiClient.get<AgencyProfile>(`/api/v1/agencies/${agencyId}`),

  getMyAgencyProfile: () =>
    apiClient.get<AgencyProfile>('/api/v1/agencies/me'),

  createAgency: (data: CreateAgency) =>
    apiClient.post<ResponseMessage>('/api/v1/agencies/create', data),

  updateMyAgency: (data: UpdateAgency) =>
    apiClient.put<ResponseMessage>('/api/v1/agencies/me', data),

  uploadLicenseDocument: (formData: FormData) =>
    apiClient.post<ResponseMessage>('/api/v1/agencies/license/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
