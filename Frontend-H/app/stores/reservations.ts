import { defineStore } from "pinia";
import { useApiClient } from "../services/api";
import type {
  Reservation,
  ReservationStatus,
  CreateReservationRequest,
  UpdateReservationRequest,
} from "~/types";

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const useReservationsStore = defineStore("reservations", () => {
  const api = useApiClient();

  // State
  const reservations = ref<Reservation[]>([]);
  const currentReservation = ref<Reservation | null>(null);
  const activeReservations = ref<Reservation[]>([]);
  const upcomingReservations = ref<Reservation[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  // Computed
  const hasReservations = computed(() => reservations.value.length > 0);
  const totalReservations = computed(() => pagination.value.total);
  const activeCount = computed(() => activeReservations.value.length);

  // Actions
  const fetchReservations = async (
    page = 1,
    pageSize = 10,
    status?: ReservationStatus,
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getReservations(page, pageSize, status);

      if (response.data) {
        reservations.value = response.data;
      }

      if (response.pagination) {
        pagination.value = response.pagination;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error cargando reservas");
      console.error("Error fetchReservations:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchReservation = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getReservation(id);

      if (response.data) {
        currentReservation.value = response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error cargando reserva");
      console.error("Error fetchReservation:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchActiveReservations = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getActiveReservations();

      if (response.data) {
        activeReservations.value = response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error cargando reservas activas");
      console.error("Error fetchActiveReservations:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchUpcomingReservations = async (days = 7) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.getUpcoming(days);

      if (response.data) {
        upcomingReservations.value = response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error cargando próximas reservas");
      console.error("Error fetchUpcomingReservations:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createReservation = async (data: CreateReservationRequest) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.createReservation(data);

      if (response.data) {
        reservations.value.unshift(response.data);
        pagination.value.total += 1;
        return response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error creando reserva");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateReservation = async (
    id: number,
    data: UpdateReservationRequest,
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.updateReservation(id, data);

      if (response.data) {
        const index = reservations.value.findIndex((r) => r.id === id);
        if (index !== -1) {
          reservations.value[index] = response.data;
        }
        if (currentReservation.value?.id === id) {
          currentReservation.value = response.data;
        }
        return response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error actualizando reserva");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const cancelReservation = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.cancelReservation(id);

      if (response.data) {
        const index = reservations.value.findIndex((r) => r.id === id);
        if (index !== -1) {
          reservations.value[index] = response.data;
        }
        return response.data;
      }
    } catch (err: unknown) {
      error.value = getErrorMessage(err, "Error cancelando reserva");
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    reservations.value = [];
    currentReservation.value = null;
    activeReservations.value = [];
    upcomingReservations.value = [];
    loading.value = false;
    error.value = null;
  };

  return {
    // State
    reservations,
    currentReservation,
    activeReservations,
    upcomingReservations,
    loading,
    error,
    pagination,

    // Computed
    hasReservations,
    totalReservations,
    activeCount,

    // Methods
    fetchReservations,
    fetchReservation,
    fetchActiveReservations,
    fetchUpcomingReservations,
    createReservation,
    updateReservation,
    cancelReservation,
    clearError,
    reset,
  };
});
