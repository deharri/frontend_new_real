import apiClient from './client';
import {
  AgencyListItem,
  AgencyProfile,
  AgencyMembershipHistoryItem,
  CreateAgency,
  UpdateAgency,
  ResponseMessage,
  WorkerListItem,
  WorkerInvitation,
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

  listAgencyWorkers: (agencyId: string) =>
    apiClient.get<WorkerListItem[]>(`/api/v1/agencies/${agencyId}/workers`),

  inviteWorker: (workerId: string) =>
    apiClient.post<ResponseMessage>(`/api/v1/agencies/workers/${workerId}/invite`),

  removeWorker: (workerId: string) =>
    apiClient.delete<ResponseMessage>(`/api/v1/agencies/workers/${workerId}`),

  getMyInvitations: () =>
    apiClient.get<WorkerInvitation[]>('/api/v1/agencies/invitations/my'),

  respondToInvitation: (invitationId: string, accept: boolean) =>
    apiClient.put<ResponseMessage>(`/api/v1/agencies/invitations/${invitationId}/respond`, null, {
      params: { accept },
    }),

  /** Worker-initiated leave from their current agency. Required before joining another agency or owning one. */
  leaveCurrentAgency: () =>
    apiClient.delete<ResponseMessage>('/api/v1/agencies/me/membership'),

  /** Membership history (current + past) of the calling user's agency. Caller must own an agency. */
  getMyMembersHistory: () =>
    apiClient.get<AgencyMembershipHistoryItem[]>('/api/v1/agencies/me/members/history'),
};
