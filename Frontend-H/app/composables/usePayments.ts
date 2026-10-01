import type {
  CreatePaymentRequest,
  PaymentMethod,
  PaymentStatus,
} from "~/types";

export const usePayments = () => {
  const paymentsStore = usePaymentsStore();
  const uiStore = useUiStore();

  const payments = computed(() => paymentsStore.payments);
  const currentPayment = computed(() => paymentsStore.currentPayment);
  const pendingPayments = computed(() => paymentsStore.pendingPayments);
  const loading = computed(() => paymentsStore.loading);
  const error = computed(() => paymentsStore.error);
  const pagination = computed(() => paymentsStore.pagination);
  const totalAmount = computed(() => paymentsStore.totalAmount);

  const statusFilter = ref<PaymentStatus | null>(null);
  const methodFilter = ref<PaymentMethod | null>(null);
  const dateRangeStart = ref("");
  const dateRangeEnd = ref("");

  const filteredPayments = computed(() =>
    payments.value.filter((payment) => {
      if (statusFilter.value && payment.status !== statusFilter.value) {
        return false;
      }
      if (methodFilter.value && payment.method !== methodFilter.value) {
        return false;
      }
      if (
        dateRangeStart.value &&
        new Date(payment.created_at) < new Date(dateRangeStart.value)
      ) {
        return false;
      }
      if (
        dateRangeEnd.value &&
        new Date(payment.created_at) > new Date(dateRangeEnd.value)
      ) {
        return false;
      }
      return true;
    }),
  );

  const fetchPayments = async (
    page = 1,
    pageSize = 10,
    status?: PaymentStatus,
  ) => {
    try {
      await paymentsStore.fetchPayments(page, pageSize, status);
    } catch (err: unknown) {
      console.error("Error cargando pagos:", err);
      throw err;
    }
  };

  const fetchPayment = async (id: number) => {
    try {
      await paymentsStore.fetchPayment(id);
    } catch (err: unknown) {
      console.error("Error cargando pago:", err);
      throw err;
    }
  };

  const fetchPending = async () => {
    try {
      await paymentsStore.fetchPendingPayments();
    } catch (err: unknown) {
      console.error("Error cargando pagos pendientes:", err);
      throw err;
    }
  };

  const createPayment = async (data: CreatePaymentRequest) => {
    try {
      const response = await paymentsStore.createPayment(data);
      uiStore.success("Pago registrado exitosamente");
      return response;
    } catch (err: unknown) {
      uiStore.error("Error al registrar pago");
      throw err;
    }
  };

  const completePayment = async (id: number) => {
    try {
      const response = await paymentsStore.completePayment(id);
      uiStore.success("Pago completado exitosamente");
      return response;
    } catch (err: unknown) {
      uiStore.error("Error al completar pago");
      throw err;
    }
  };

  const refundPayment = async (id: number) => {
    try {
      const response = await paymentsStore.refundPayment(id);
      uiStore.success("Pago reembolsado exitosamente");
      return response;
    } catch (err: unknown) {
      uiStore.error("Error al reembolsar pago");
      throw err;
    }
  };

  const filterByStatus = (status: PaymentStatus | null) => {
    statusFilter.value = status;
  };

  const filterByMethod = (method: PaymentMethod | null) => {
    methodFilter.value = method;
  };

  const filterByDateRange = (start: string, end: string) => {
    dateRangeStart.value = start;
    dateRangeEnd.value = end;
  };

  const clearFilters = () => {
    statusFilter.value = null;
    methodFilter.value = null;
    dateRangeStart.value = "";
    dateRangeEnd.value = "";
  };

  const formatAmount = (amount: number, currency = "USD"): string =>
    new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency,
    }).format(amount);

  const getPaymentStatus = (status: PaymentStatus) => {
    const statuses: Record<PaymentStatus, { label: string; color: string }> = {
      pending: { label: "Pendiente", color: "yellow" },
      completed: { label: "Completado", color: "green" },
      failed: { label: "Falló", color: "red" },
      refunded: { label: "Reembolsado", color: "gray" },
    };

    return statuses[status];
  };

  const getPaymentMethod = (method: PaymentMethod): string => {
    const methods: Record<PaymentMethod, string> = {
      cash: "Efectivo",
      credit_card: "Tarjeta de Crédito",
      debit_card: "Tarjeta de Débito",
      transfer: "Transferencia",
      check: "Cheque",
    };

    return methods[method];
  };

  return {
    payments,
    currentPayment,
    pendingPayments,
    loading,
    error,
    pagination,
    totalAmount,
    filteredPayments,
    statusFilter: readonly(statusFilter),
    methodFilter: readonly(methodFilter),
    dateRangeStart: readonly(dateRangeStart),
    dateRangeEnd: readonly(dateRangeEnd),
    fetchPayments,
    fetchPayment,
    fetchPending,
    createPayment,
    completePayment,
    refundPayment,
    filterByStatus,
    filterByMethod,
    filterByDateRange,
    clearFilters,
    formatAmount,
    getPaymentStatus,
    getPaymentMethod,
  };
};
