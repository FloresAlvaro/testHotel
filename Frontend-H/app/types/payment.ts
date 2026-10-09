import type { components } from './generated/api';
/**
 * Tipos de pagos
 */

export type PaymentType = components['schemas']['PaymentType'];
export type PaymentMethod = components['schemas']['PaymentMethod'];
export type PaymentStatus = components['schemas']['PaymentStatus'];

export type Payment = components['schemas']['Payment'];

export type CreatePaymentRequest = components['schemas']['CreatePaymentRequest'];

export type UpdatePaymentRequest = components['schemas']['UpdatePaymentRequest'];

export type UpdatePaymentStatusRequest = components['schemas']['UpdatePaymentStatusRequest'];

export type RefundPaymentRequest = components['schemas']['RefundPaymentRequest'];

export type RevenueReport = components['schemas']['RevenueReport'];

export type RevenueByMethod = components['schemas']['RevenueByMethod'];

export interface PaymentStats {
  total_payments: string;
  completed_payments: string;
  pending_payments: string;
  failed_payments: string;
  total_revenue: string;
  average_payment: string;
}

export interface PaymentState {
  payments: Payment[];
  currentPayment: Payment | null;
  pendingPayments: Payment[];
  loading: boolean;
  error: string | null;
  stats: PaymentStats | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
