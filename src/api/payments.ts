import { paymentClient } from './subscriptionApi';
import type {
  EscrowHold,
  EscrowReleaseReason,
  InitiatePaymentRequest,
  PaymentTransaction,
} from '../types';

export const paymentsApi = {
  initiatePayment: (request: InitiatePaymentRequest): Promise<PaymentTransaction> =>
    paymentClient.post('/api/v1/payments/initiate', request).then(r => r.data),

  getMyPayments: (): Promise<PaymentTransaction[]> =>
    paymentClient.get('/api/v1/payments').then(r => r.data),

  getMyJobPayments: (): Promise<PaymentTransaction[]> =>
    paymentClient.get('/api/v1/payments/as-worker').then(r => r.data),

  getAgencyPayments: (agencyId: string): Promise<PaymentTransaction[]> =>
    paymentClient.get(`/api/v1/payments/agency/${agencyId}`).then(r => r.data),

  getTransaction: (transactionId: string): Promise<PaymentTransaction> =>
    paymentClient.get(`/api/v1/payments/${transactionId}`).then(r => r.data),

  getTransactionByJob: (jobId: string): Promise<PaymentTransaction | null> =>
    paymentClient
      .get(`/api/v1/payments/job/${jobId}`)
      .then(r => r.data)
      .catch(err => {
        if (err?.response?.status === 404) return null;
        throw err;
      }),

  getEscrow: (transactionId: string): Promise<EscrowHold> =>
    paymentClient.get(`/api/v1/escrow/${transactionId}`).then(r => r.data),

  releaseEscrow: (
    transactionId: string,
    releaseReason: EscrowReleaseReason,
  ): Promise<EscrowHold> =>
    paymentClient
      .put(`/api/v1/escrow/${transactionId}/release`, { releaseReason })
      .then(r => r.data),

  refundEscrow: (transactionId: string): Promise<EscrowHold> =>
    paymentClient.put(`/api/v1/escrow/${transactionId}/refund`).then(r => r.data),
};
