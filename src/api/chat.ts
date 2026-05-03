import chatApiClient from './chatClient';
import {
  ConversationListResponse,
  ConversationResponse,
  CreateConversationRequest,
  MessagePageResponse,
  MessageResponse,
  SendMessageRequest,
  CreateOfferRequest,
  OfferResponse,
} from '../types';

interface UploadMediaRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  conversationId: string;
  fileUri: string;
}

interface PresignedUrlResponse {
  url: string;
  s3Key: string;
  expiresAt: string;
}

export const chatApi = {
  // Conversations
  getConversations: (page = 0, size = 20) =>
    chatApiClient.get<ConversationListResponse>('/api/v1/conversations', { params: { page, size } }),

  createConversation: (data: CreateConversationRequest) =>
    chatApiClient.post<ConversationResponse>('/api/v1/conversations', data),

  getConversation: (conversationId: string) =>
    chatApiClient.get<ConversationResponse>(`/api/v1/conversations/${conversationId}`),

  archiveConversation: (conversationId: string) =>
    chatApiClient.put<ConversationResponse>(`/api/v1/conversations/${conversationId}/archive`),

  linkJob: (conversationId: string, messageId: string, jobId: string) =>
    chatApiClient.put<ConversationResponse>(`/api/v1/conversations/${conversationId}/link-job`, { messageId, jobId }),

  markAsRead: (conversationId: string) =>
    chatApiClient.put(`/api/v1/conversations/${conversationId}/read`),

  // Messages
  getMessages: (conversationId: string, cursor?: string, limit = 30) =>
    chatApiClient.get<MessagePageResponse>(
      `/api/v1/conversations/${conversationId}/messages`,
      { params: { cursor, limit } }
    ),

  sendMessage: (conversationId: string, data: SendMessageRequest) =>
    chatApiClient.post<MessageResponse>(
      `/api/v1/conversations/${conversationId}/messages`, data
    ),

  // Offers
  sendOffer: (conversationId: string, data: CreateOfferRequest) =>
    chatApiClient.post<OfferResponse>(
      `/api/v1/conversations/${conversationId}/offers`, data
    ),

  acceptOffer: (offerId: string) =>
    chatApiClient.put<OfferResponse>(`/api/v1/offers/${offerId}/accept`),

  rejectOffer: (offerId: string) =>
    chatApiClient.put<OfferResponse>(`/api/v1/offers/${offerId}/reject`),

  withdrawOffer: (offerId: string) =>
    chatApiClient.put<OfferResponse>(`/api/v1/offers/${offerId}/withdraw`),

  // Media
  uploadMedia: (data: UploadMediaRequest) => {
    const formData = new FormData();
    formData.append('fileName', data.fileName);
    formData.append('fileType', data.fileType);
    formData.append('fileSize', String(data.fileSize));
    formData.append('conversationId', data.conversationId);
    formData.append('mediaFile', {
      uri: data.fileUri,
      name: data.fileName,
      type: data.fileType,
    } as any);
    return chatApiClient.post<PresignedUrlResponse>('/api/v1/messages/upload-url', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getMediaUrl: (messageId: string) =>
    chatApiClient.get<PresignedUrlResponse>(`/api/v1/messages/${messageId}/media-url`),
};
