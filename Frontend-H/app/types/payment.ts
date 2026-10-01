/**
 * Tipos de pagos
 */

export type PaymentType = "full" | "partial" | "advance";
export type PaymentMethod =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "transfer"
  | "check";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Payment {
  id: number;
  reservation_id: number;
  amount: string;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string | null;
  notes?: string | null;
  client_name?: string;
  check_in?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  reservation_id: number;
  amount: number;
  type: PaymentType;
  method: PaymentMethod;
  transaction_id?: string;
  notes?: string;
}

export interface UpdatePaymentRequest {
  amount?: number;
  type?: PaymentType;
  method?: PaymentMethod;
  transaction_id?: string | null;
}

export interface UpdatePaymentStatusRequest {
  status: PaymentStatus;
}

export interface RefundPaymentRequest {
  reason?: string;
}

export interface RevenueReport {
  date: string;
  total_payments: string;
  total_amount: string | null;
  completed_payments: string;
}

export interface RevenueByMethod {
  method: PaymentMethod;
  total_transactions: string;
  total_amount: string;
}

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
