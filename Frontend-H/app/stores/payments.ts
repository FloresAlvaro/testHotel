import { defineStore } from "pinia";
import { useApiClient } from "../services/api";
import { getErrorMessage } from "~/utils/errors";
import type {
  Payment,
  PaymentStats,
  PaymentStatus,
  CreatePaymentRequest,
  UpdatePaymentRequest,
} from "~/types";

export const usePaymentsStore = defineStore("payments", () => {
  const api = useApiClient();

  // State
  const payments = ref<Payment[]>([]);
  const currentPayment = ref<Payment | null>(null);
  const pendingPayments = ref<Payment[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const stats = ref<PaymentStats | null>(null);
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  // Computed
  const hasPayments = computed(() => payments.value.length > 0);
  const pendingCount = computed(() => pendingPayments.value.length);
  const totalAmount = computed(() =>
    payments.value
      .filter((p) => p.status === "completed")
      .reduce((sum, payment) => sum + Number(payment.amount), 0),
  );

  const syncPayment = (payment: Payment) => {
    const paymentIndex = payments.value.findIndex(
      (item) => item.id === payment.id,
    );
    if (paymentIndex === -1) {
      payments.value.unshift(payment);
    } else {
      payments.value[paymentIndex] = payment;
    }

    if (currentPayment.value?.id === payment.id) {
      currentPayment.value = payment;
    }

    const pendingIndex = pendingPayments.value.findIndex(
      (item) => item.id === payment.id,
    );
    if (payment.status === "pending") {
      if (pendingIndex === -1) {
        pendingPayments.value.unshift(payment);
      } else {
        pendingPayments.value[pendingIndex] = payment;
      }
    } else if (pendingIndex !== -1) {
      pendingPayments.value.splice(pendingIndex, 1);
    }
  };

  // Actions
  const fetchPayments = async (
    page = 1,
    pageSize = 10,
    status?: PaymentStatus,
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getPayments(page, pageSize, status);

      if (response.data) {
        payments.value = response.data;
      }

      if (response.pagination) {
        pagination.value = response.pagination;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error cargando pagos");
      console.error("Error fetchPayments:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchPayment = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getPayment(id);

      if (response.data) {
        currentPayment.value = response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error cargando pago");
      console.error("Error fetchPayment:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchPendingPayments = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getPayments(1, 100, "pending");

      if (response.data) {
        pendingPayments.value = response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error cargando pagos pendientes");
      console.error("Error fetchPendingPayments:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createPayment = async (data: CreatePaymentRequest) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.createPayment(data);

      if (response.data) {
        syncPayment(response.data);
        pagination.value.total += 1;
        return response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error creando pago");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updatePayment = async (id: number, data: UpdatePaymentRequest) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.updatePayment(id, data);

      if (response.data) {
        syncPayment(response.data);
        return response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error actualizando pago");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const completePayment = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.completePayment(id);

      if (response.data) {
        syncPayment(response.data);
        return response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error completando pago");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const refundPayment = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.refundPayment(id);

      if (response.data) {
        syncPayment(response.data);
        return response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error reembolsando pago");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    payments.value = [];
    currentPayment.value = null;
    pendingPayments.value = [];
    loading.value = false;
    error.value = null;
    stats.value = null;
  };

  return {
    // State
    payments,
    currentPayment,
    pendingPayments,
    loading,
    error,
    stats,
    pagination,

    // Computed
    hasPayments,
    pendingCount,
    totalAmount,

    // Methods
    fetchPayments,
    fetchPayment,
    fetchPendingPayments,
    createPayment,
    updatePayment,
    completePayment,
    refundPayment,
    clearError,
    reset,
  };
});
