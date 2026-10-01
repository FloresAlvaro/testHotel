import type {
  CreateReservationRequest,
  ReservationStatus,
  UpdateReservationRequest,
} from "~/types";
import {
  compareDateOnly,
  daysBetweenDateOnly,
  getTodayDateOnly,
} from "../utils/dates";

export const useReservations = () => {
  const reservationsStore = useReservationsStore();
  const uiStore = useUiStore();

  // ==================== STATE ====================
  const reservations = computed(() => reservationsStore.reservations);
  const currentReservation = computed(
    () => reservationsStore.currentReservation,
  );
  const activeReservations = computed(
    () => reservationsStore.activeReservations,
  );
  const upcomingReservations = computed(
    () => reservationsStore.upcomingReservations,
  );
  const loading = computed(() => reservationsStore.loading);
  const error = computed(() => reservationsStore.error);
  const pagination = computed(() => reservationsStore.pagination);

  // ==================== FILTROS ====================
  const statusFilter = ref<ReservationStatus | null>(null);
  const dateRangeStart = ref<string>("");
  const dateRangeEnd = ref<string>("");

  const filteredReservations = computed(() => {
    return reservations.value.filter((res) => {
      if (statusFilter.value && res.status !== statusFilter.value) return false;
      const startComparison = dateRangeStart.value
        ? compareDateOnly(res.check_in, dateRangeStart.value)
        : null;
      const endComparison = dateRangeEnd.value
        ? compareDateOnly(res.check_out, dateRangeEnd.value)
        : null;
      if (startComparison !== null && startComparison < 0) return false;
      if (endComparison !== null && endComparison > 0) return false;
      return true;
    });
  });

  // ==================== MÉTODOS ====================

  /**
   * Cargar reservas
   */
  const fetchReservations = async (
    page = 1,
    pageSize = 10,
    status?: ReservationStatus,
  ) => {
    try {
      await reservationsStore.fetchReservations(page, pageSize, status);
    } catch (error) {
      console.error("Error cargando reservas:", error);
      throw error;
    }
  };

  /**
   * Cargar reserva por ID
   */
  const fetchReservation = async (id: number) => {
    try {
      await reservationsStore.fetchReservation(id);
    } catch (error) {
      console.error("Error cargando reserva:", error);
      throw error;
    }
  };

  /**
   * Cargar reservas activas
   */
  const fetchActive = async () => {
    try {
      await reservationsStore.fetchActiveReservations();
    } catch (error) {
      console.error("Error cargando reservas activas:", error);
      throw error;
    }
  };

  /**
   * Cargar próximas reservas
   */
  const fetchUpcoming = async (days = 7) => {
    try {
      await reservationsStore.fetchUpcomingReservations(days);
    } catch (error) {
      console.error("Error cargando próximas reservas:", error);
      throw error;
    }
  };

  /**
   * Crear nueva reserva
   */
  const createReservation = async (data: CreateReservationRequest) => {
    try {
      const response = await reservationsStore.createReservation(data);
      uiStore.success("Reserva creada exitosamente");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al crear reserva");
      throw error;
    }
  };

  /**
   * Actualizar reserva
   */
  const updateReservation = async (
    id: number,
    data: UpdateReservationRequest,
  ) => {
    try {
      const response = await reservationsStore.updateReservation(id, data);
      uiStore.success("Reserva actualizada exitosamente");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al actualizar reserva");
      throw error;
    }
  };

  /**
   * Cancelar reserva
   */
  const cancelReservation = async (id: number) => {
    try {
      const response = await reservationsStore.cancelReservation(id);
      uiStore.success("Reserva cancelada exitosamente");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al cancelar reserva");
      throw error;
    }
  };

  /**
   * Filtrar por estado
   */
  const filterByStatus = (status: ReservationStatus | null) => {
    statusFilter.value = status;
  };

  /**
   * Filtrar por rango de fechas
   */
  const filterByDateRange = (start: string, end: string) => {
    dateRangeStart.value = start;
    dateRangeEnd.value = end;
  };

  /**
   * Limpiar filtros
   */
  const clearFilters = () => {
    statusFilter.value = null;
    dateRangeStart.value = "";
    dateRangeEnd.value = "";
  };

  /**
   * Calcular noches de estadía
   */
  const calculateNights = (checkIn: string, checkOut: string): number => {
    const nights = daysBetweenDateOnly(checkIn, checkOut);
    return nights !== null && nights > 0 ? nights : 0;
  };

  /**
   * Validar fechas de reserva
   */
  const validateDates = (checkIn: string, checkOut: string): boolean => {
    const today = getTodayDateOnly();
    const checkInVsToday = compareDateOnly(checkIn, today);
    const checkOutVsCheckIn = compareDateOnly(checkOut, checkIn);

    if (checkInVsToday === null || checkOutVsCheckIn === null) {
      uiStore.warning("Las fechas de reserva no son válidas");
      return false;
    }

    if (checkInVsToday < 0) {
      uiStore.warning("La fecha de check-in no puede ser anterior a hoy");
      return false;
    }

    if (checkOutVsCheckIn <= 0) {
      uiStore.warning("La fecha de check-out debe ser posterior a check-in");
      return false;
    }

    return true;
  };

  /**
   * Obtener estado visual de una reserva
   */
  const getReservationStatus = (status: string) => {
    const statuses: Record<string, { label: string; color: string }> = {
      confirmed: { label: "Confirmada", color: "blue" },
      checked_in: { label: "Check-in", color: "green" },
      checked_out: { label: "Check-out", color: "gray" },
      cancelled: { label: "Cancelada", color: "red" },
    };

    return statuses[status] || { label: status, color: "gray" };
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
    filteredReservations,

    // Filters
    statusFilter: readonly(statusFilter),
    dateRangeStart: readonly(dateRangeStart),
    dateRangeEnd: readonly(dateRangeEnd),

    // Methods
    fetchReservations,
    fetchReservation,
    fetchActive,
    fetchUpcoming,
    createReservation,
    updateReservation,
    cancelReservation,
    filterByStatus,
    filterByDateRange,
    clearFilters,
    calculateNights,
    validateDates,
    getReservationStatus,
  };
};
