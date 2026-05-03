import jobsApiClient from './jobsClient';
import {
  JobListingResponse,
  JobListingListResponse,
  CreateJobListing,
  CreateJobFromOffer,
  UpdateJobListing,
  JobSearchParams,
  BidResponse,
  BidListResponse,
  CreateBid,
  UpdateBid,
  ReviewResponse,
  ReviewListResponse,
  CreateReview,
  RatingSummary,
} from '../types';

export const jobsApi = {
  // ==================== Listings ====================
  createListing: (data: CreateJobListing) =>
    jobsApiClient.post<JobListingResponse>('/api/v1/listings', data),

  createJobFromOffer: (data: CreateJobFromOffer) =>
    jobsApiClient.post<JobListingResponse>('/api/v1/listings/from-offer', data),

  searchListings: (params: JobSearchParams = {}) =>
    jobsApiClient.get<JobListingListResponse>('/api/v1/listings', { params }),

  getListingById: (jobId: string) =>
    jobsApiClient.get<JobListingResponse>(`/api/v1/listings/${jobId}`),

  updateListing: (jobId: string, data: UpdateJobListing) =>
    jobsApiClient.put<JobListingResponse>(`/api/v1/listings/${jobId}`, data),

  publishListing: (jobId: string) =>
    jobsApiClient.put<JobListingResponse>(`/api/v1/listings/${jobId}/publish`),

  cancelListing: (jobId: string, reason?: string) =>
    jobsApiClient.put<JobListingResponse>(`/api/v1/listings/${jobId}/cancel`, { reason }),

  startJob: (jobId: string) =>
    jobsApiClient.put<JobListingResponse>(`/api/v1/listings/${jobId}/start`),

  completeJob: (jobId: string) =>
    jobsApiClient.put<JobListingResponse>(`/api/v1/listings/${jobId}/complete`),

  confirmCompletion: (jobId: string) =>
    jobsApiClient.put<JobListingResponse>(`/api/v1/listings/${jobId}/confirm-completion`),

  dispatchJob: (jobId: string, workerId: string) =>
    jobsApiClient.put<JobListingResponse>(`/api/v1/listings/${jobId}/dispatch`, { workerId }),

  getAgencyJobs: (agencyId: string, page = 0, size = 20) =>
    jobsApiClient.get<JobListingListResponse>(`/api/v1/listings/agency/${agencyId}`, { params: { page, size } }),

  getMyDispatchedJobs: (page = 0, size = 20) =>
    jobsApiClient.get<JobListingListResponse>('/api/v1/listings/my-dispatched-jobs', { params: { page, size } }),

  getMyListings: (page = 0, size = 20) =>
    jobsApiClient.get<JobListingListResponse>('/api/v1/listings/my-listings', { params: { page, size } }),

  getMyJobs: (page = 0, size = 20) =>
    jobsApiClient.get<JobListingListResponse>('/api/v1/listings/my-jobs', { params: { page, size } }),

  // ==================== Bids ====================
  placeBid: (jobId: string, data: CreateBid) =>
    jobsApiClient.post<BidResponse>(`/api/v1/listings/${jobId}/bids`, data),

  getJobBids: (jobId: string, page = 0, size = 20) =>
    jobsApiClient.get<BidListResponse>(`/api/v1/listings/${jobId}/bids`, { params: { page, size } }),

  getBidById: (bidId: string) =>
    jobsApiClient.get<BidResponse>(`/api/v1/bids/${bidId}`),

  updateBid: (bidId: string, data: UpdateBid) =>
    jobsApiClient.put<BidResponse>(`/api/v1/bids/${bidId}`, data),

  withdrawBid: (bidId: string) =>
    jobsApiClient.put<BidResponse>(`/api/v1/bids/${bidId}/withdraw`),

  acceptBid: (bidId: string) =>
    jobsApiClient.put<BidResponse>(`/api/v1/bids/${bidId}/accept`),

  rejectBid: (bidId: string) =>
    jobsApiClient.put<BidResponse>(`/api/v1/bids/${bidId}/reject`),

  getMyBids: (page = 0, size = 20) =>
    jobsApiClient.get<BidListResponse>('/api/v1/bids/my-bids', { params: { page, size } }),

  getMyAgencyBids: (agencyId: string, page = 0, size = 20) =>
    jobsApiClient.get<BidListResponse>('/api/v1/bids/my-agency-bids', { params: { agencyId, page, size } }),

  // ==================== Reviews ====================
  createReview: (jobId: string, data: CreateReview) =>
    jobsApiClient.post<ReviewResponse>(`/api/v1/listings/${jobId}/reviews`, data),

  getJobReviews: (jobId: string) =>
    jobsApiClient.get<ReviewResponse[]>(`/api/v1/listings/${jobId}/reviews`),

  getWorkerRatingSummary: (workerId: string) =>
    jobsApiClient.get<RatingSummary>(`/api/v1/reviews/worker/${workerId}/summary`),

  getConsumerRatingSummary: (consumerId: string) =>
    jobsApiClient.get<RatingSummary>(`/api/v1/reviews/consumer/${consumerId}/summary`),

  // ==================== Saved Jobs ====================
  saveJob: (jobId: string) =>
    jobsApiClient.post(`/api/v1/listings/${jobId}/save`),

  unsaveJob: (jobId: string) =>
    jobsApiClient.delete(`/api/v1/listings/${jobId}/save`),

  getSavedJobs: (page = 0, size = 20) =>
    jobsApiClient.get<JobListingListResponse>('/api/v1/saved-jobs', { params: { page, size } }),

  // ==================== Media ====================
  getUploadUrl: (fileName: string, contentType?: string) =>
    jobsApiClient.post<{ url: string; s3Key: string }>('/api/v1/media/upload-url', { fileName, contentType }),

  getDownloadUrl: (s3Key: string) =>
    jobsApiClient.get<{ url: string; s3Key: string }>('/api/v1/media/download-url', { params: { s3Key } }),
};
