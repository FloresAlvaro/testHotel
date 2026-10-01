import { useApiClient } from "./api";
import type {
  PaymentStatus,
  CreatePaymentRequest,
  UpdatePaymentRequest,
} from "~/types";

export const usePaymentsService = () => {
  const api = useApiClient();
  const uiStore = useUiStore();

  const getPayments = async (
    page = 1,
    pageSize = 10,
    status?: PaymentStatus,
  ) => {
    try {
      return await api.getPayments(page, pageSize, status);
    } catch (error) {
      console.error("Error cargando pagos:", error);
      throw error;
    }
  };

  const getPayment = async (id: number) => {
    try {
      return await api.getPayment(id);
    } catch (error) {
      console.error("Error cargando pago:", error);
      throw error;
    }
  };

  const createPayment = async (data: CreatePaymentRequest) => {
    try {
      const response = await api.createPayment(data);
      uiStore.success("Pago registrado correctamente");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al registrar pago");
      throw error;
    }
  };

  const updatePayment = async (id: number, data: UpdatePaymentRequest) => {
    try {
      const response = await api.updatePayment(id, data);
      uiStore.success("Pago actualizado correctamente");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al actualizar pago");
      throw error;
    }
  };

  const completePayment = async (id: number) => {
    try {
      const response = await api.completePayment(id);
      uiStore.success("Pago completado");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al completar pago");
      throw error;
    }
  };

  const refundPayment = async (id: number) => {
    try {
      const response = await api.refundPayment(id);
      uiStore.success("Pago reembolsado");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al reembolsar pago");
      throw error;
    }
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
