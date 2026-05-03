import jobsApiClient from './jobsClient';
import type { Dispute, DisputePage, DisputeSubmission } from '../types';

export const disputesApi = {
  submitDispute: (request: DisputeSubmission): Promise<Dispute> =>
    jobsApiClient.post<Dispute>('/api/v1/disputes', request).then(r => r.data),

  getMyDisputes: (page = 0, size = 20): Promise<DisputePage> =>
    jobsApiClient
      .get<DisputePage>('/api/v1/disputes/my', { params: { page, size } })
      .then(r => r.data),

  getDispute: (disputeId: string): Promise<Dispute> =>
    jobsApiClient.get<Dispute>(`/api/v1/disputes/${disputeId}`).then(r => r.data),

  getMyDisputesForJob: (jobId: string): Promise<Dispute[]> =>
    jobsApiClient
      .get<Dispute[]>(`/api/v1/listings/${jobId}/disputes/my`)
      .then(r => r.data),
};
