import { useCheckInService } from "../services/checkin";
import {
  compareDateOnly,
  daysBetweenDateOnly,
  formatDateOnly,
  getTodayDateOnly,
} from "../utils/dates";
import type { CheckInLogData, Reservation } from "~/types";

export const useCheckIn = () => {
  const checkInService = useCheckInService();
  const reservationsStore = useReservationsStore();
  const roomsStore = useRoomsStore();
  const uiStore = useUiStore();

  const loading = ref(false);
  const error = ref<string | null>(null);
  const todayCheckIns = ref<CheckInLogData[]>([]);
  const pendingCheckOuts = ref<CheckInLogData[]>([]);

  const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

  const checkIn = async (reservationId: number, notes?: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await checkInService.checkIn(reservationId, notes);
      await reservationsStore.fetchReservations();
      await roomsStore.fetchRooms();
      uiStore.success("Check-in registrado exitosamente");
      return response;
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Error al registrar check-in");
      error.value = message;
      uiStore.error(message);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const checkOut = async (reservationId: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await checkInService.checkOut(reservationId);
      await reservationsStore.fetchReservations();
      await roomsStore.fetchRooms();
      uiStore.success("Check-out registrado exitosamente");
      return response;
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Error al registrar check-out");
      error.value = message;
      uiStore.error(message);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getTodayCheckIns = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await checkInService.getTodayCheckIns();
      if (response.success && response.data) {
        todayCheckIns.value = response.data;
      }
      return response;
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Error cargando check-ins de hoy");
      error.value = message;
      console.error(message, err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getPendingCheckOuts = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await checkInService.getPendingCheckOuts();
      if (response.success && response.data) {
        pendingCheckOuts.value = response.data;
      }
      return response;
    } catch (err: unknown) {
      const message = getErrorMessage(
        err,
        "Error cargando check-outs pendientes",
      );
      error.value = message;
      console.error(message, err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const canCheckIn = (reservation: Reservation | null | undefined): boolean => {
    if (!reservation) return false;
    if (reservation.status === "checked_in") {
      uiStore.warning("Esta reserva ya tiene check-in registrado");
      return false;
    }
    if (reservation.status === "cancelled") {
      uiStore.warning("No se puede hacer check-in a una reserva cancelada");
      return false;
    }

    const checkInComparison = compareDateOnly(
      reservation.check_in,
      getTodayDateOnly(),
    );
    if (checkInComparison === null || checkInComparison > 0) {
      uiStore.warning("Aún no es la fecha de check-in");
      return false;
    }

    return true;
  };

  const canCheckOut = (
    reservation: Reservation | null | undefined,
  ): boolean => {
    if (!reservation) return false;
    if (reservation.status !== "checked_in") {
      uiStore.warning("La reserva debe tener check-in registrado");
      return false;
    }

    return true;
  };

  const getTimeUntilCheckIn = (checkInDate: string): string => {
    const days = daysBetweenDateOnly(getTodayDateOnly(), checkInDate);
    if (days === null) return "Fecha inválida";
    if (days < 0) return "Hoy";

    if (days === 0) return "Hoy";
    if (days === 1) return "Mañana";
    return `En ${days} días`;
  };

  const getCheckInOutStatus = (reservation: Reservation) => {
    const today = getTodayDateOnly();
    const checkInComparison = compareDateOnly(reservation.check_in, today);
    const checkOutComparison = compareDateOnly(reservation.check_out, today);

    if (reservation.status === "checked_in") {
      return {
        checkInStatus: "completed",
        checkOutStatus: checkOutComparison === 0 ? "pending" : "upcoming",
        message:
          checkOutComparison === 0
            ? "Check-out previsto para hoy"
            : `Check-out previsto para ${formatDateOnly(reservation.check_out)}`,
      };
    }

    if (reservation.status === "checked_out") {
      return {
        checkInStatus: "completed",
        checkOutStatus: "completed",
        message: "Estadía completada",
      };
    }

    if (reservation.status === "cancelled") {
      return {
        checkInStatus: "cancelled",
        checkOutStatus: "cancelled",
        message: "Reserva cancelada",
      };
    }

    return {
      checkInStatus: checkInComparison === 0 ? "pending" : "upcoming",
      checkOutStatus: "upcoming",
      message:
        checkInComparison === 0
          ? "Check-in previsto para hoy"
          : `Check-in previsto para ${formatDateOnly(reservation.check_in)}`,
    };
  };

  return {
    loading: readonly(loading),
    error: readonly(error),
    todayCheckIns: readonly(todayCheckIns),
    pendingCheckOuts: readonly(pendingCheckOuts),
    checkIn,
    checkOut,
    getTodayCheckIns,
    getPendingCheckOuts,
    canCheckIn,
    canCheckOut,
    getTimeUntilCheckIn,
    getCheckInOutStatus,
  };
};
