import { useApiClient } from "./api";
import type {
  PaymentStatus,
  CreatePaymentRequest,
  UpdatePaymentRequest,
} from "~/types";

export const usePaymentsService = () => {
  const api = useApiClient();

  const getPayments = async (
    page = 1,
    pageSize = 10,
    status?: PaymentStatus,
  ) => {
    return await api.getPayments(page, pageSize, status);
  };

  const getPayment = async (id: number) => {
    return await api.getPayment(id);
  };

  const createPayment = async (data: CreatePaymentRequest) => {
    return await api.createPayment(data);
  };

  const updatePayment = async (id: number, data: UpdatePaymentRequest) => {
    return await api.updatePayment(id, data);
  };

  const completePayment = async (id: number) => {
    return await api.completePayment(id);
  };

  const refundPayment = async (id: number) => {
    return await api.refundPayment(id);
  };

  return {
    getPayments,
    getPayment,
    createPayment,
    updatePayment,
    completePayment,
    refundPayment,
  };
};
