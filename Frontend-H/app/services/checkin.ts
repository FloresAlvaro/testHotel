import { useApiClient } from "./api";

export const useCheckInService = () => {
  const api = useApiClient();
  const uiStore = useUiStore();

  const checkIn = async (reservationId: number, notes?: string) => {
    try {
      const response = await api.checkIn(reservationId, notes);
      uiStore.success("Check-in registrado correctamente");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al registrar check-in");
      throw error;
    }
  };

  const checkOut = async (reservationId: number) => {
    try {
      const response = await api.checkOut(reservationId);
      uiStore.success("Check-out registrado correctamente");
      return response;
    } catch (error: unknown) {
      uiStore.error("Error al registrar check-out");
      throw error;
    }
  };

  const getTodayCheckIns = async () => {
    try {
      return await api.getTodayCheckIns();
    } catch (error) {
      console.error("Error cargando check-ins del día:", error);
      throw error;
    }
  };

  const getPendingCheckOuts = async () => {
    try {
      return await api.getPendingCheckOuts();
    } catch (error) {
      console.error("Error cargando check-outs pendientes:", error);
      throw error;
    }
  };

  return {
    checkIn,
    checkOut,
    getTodayCheckIns,
    getPendingCheckOuts,
  };
};
